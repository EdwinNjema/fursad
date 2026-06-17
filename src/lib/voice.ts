// Client-side voice anonymisation using Web Audio API.
// Original audio never leaves the device — only the altered Blob is uploaded.

export async function recordMicrophone(maxMs = 60000): Promise<{ stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();
  const timer = setTimeout(() => recorder.state === "recording" && recorder.stop(), maxMs);

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          clearTimeout(timer);
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: "audio/webm" }));
        };
        if (recorder.state === "recording") recorder.stop();
      }),
  };
}

// Documentary-style witness-protection voice.
//
// 1. Pitch shift DOWN via resample (playbackRate < 1) — gives a deep, serious
//    "witness protection" timbre. This also stretches duration.
// 2. Time-stretch the pitched audio back to the ORIGINAL duration with an
//    overlap-add (OLA) pass so the speaker still talks at normal pace.
// 3. Band-pass filtering removes the formants that identify a specific person.
export async function alterPitch(blob: Blob, pitchRate = 0.78): Promise<Blob> {
  const arrayBuf = await blob.arrayBuffer();
  const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
  const decodeCtx = new Ctx();
  const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
  await decodeCtx.close();

  // --- Step 1: pitch shift down + filter (duration becomes length / pitchRate)
  const sr = decoded.sampleRate;



  const offline = new OfflineAudioContext(
    decoded.numberOfChannels,
    Math.ceil(decoded.length / pitchRate),
    sr,
  );
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.playbackRate.value = pitchRate;

  const hp = offline.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 85;
  const lp = offline.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 2400;
  const gain = offline.createGain();
  gain.gain.value = 1.3;

  src.connect(hp).connect(lp).connect(gain).connect(offline.destination);
  src.start();
  const pitchedBuf = await offline.startRendering();

  // --- Step 2: time-stretch back to original duration so pace is natural
  const stretchFactor = pitchRate; // pitched is 1/pitchRate longer; compress by pitchRate
  const restored = timeStretchBuffer(pitchedBuf, stretchFactor);

  return audioBufferToWavBlob(restored);
}

// Simple overlap-add (OLA) time-stretcher.
// stretchFactor < 1 = shorter output (faster); > 1 = longer (slower).
// Pitch is preserved because we re-use raw samples without resampling.
function timeStretchBuffer(buffer: AudioBuffer, stretchFactor: number): AudioBuffer {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const inLen = buffer.length;
  const outLen = Math.max(1, Math.floor(inLen * stretchFactor));

  const frameSize = 2048;
  const synthHop = 512;
  const analHop = Math.max(1, Math.round(synthHop / stretchFactor));

  // Hann window
  const win = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1));
  }

  // Use an offline context purely to allocate an AudioBuffer of the right shape.
  const out = new OfflineAudioContext(numCh, outLen, sr).createBuffer(numCh, outLen, sr);

  for (let c = 0; c < numCh; c++) {
    const input = buffer.getChannelData(c);
    const output = new Float32Array(outLen);
    const norm = new Float32Array(outLen); // sum of windows, for amplitude normalisation

    let inPos = 0;
    let outPos = 0;
    while (inPos + frameSize <= input.length && outPos + frameSize <= outLen) {
      for (let i = 0; i < frameSize; i++) {
        output[outPos + i] += input[inPos + i] * win[i];
        norm[outPos + i] += win[i];
      }
      inPos += analHop;
      outPos += synthHop;
    }
    for (let i = 0; i < outLen; i++) {
      if (norm[i] > 1e-4) output[i] /= norm[i];
    }
    out.copyToChannel(output, c, 0);
  }
  return out;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const dataLen = samples * numCh * 2;
  const ab = new ArrayBuffer(44 + dataLen);
  const view = new DataView(ab);
  let p = 0;
  const writeStr = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); };
  writeStr("RIFF"); view.setUint32(p, 36 + dataLen, true); p += 4;
  writeStr("WAVE"); writeStr("fmt "); view.setUint32(p, 16, true); p += 4;
  view.setUint16(p, 1, true); p += 2; view.setUint16(p, numCh, true); p += 2;
  view.setUint32(p, sampleRate, true); p += 4;
  view.setUint32(p, sampleRate * numCh * 2, true); p += 4;
  view.setUint16(p, numCh * 2, true); p += 2; view.setUint16(p, 16, true); p += 2;
  writeStr("data"); view.setUint32(p, dataLen, true); p += 4;

  const channels: Float32Array[] = [];
  for (let i = 0; i < numCh; i++) channels.push(buffer.getChannelData(i));
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      p += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
