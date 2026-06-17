import { useRef, useState } from "react";
import { Mic, Square, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { alterPitch, recordMicrophone } from "@/lib/voice";

export function VoiceRecorder({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "recording" | "ready">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const stopper = useRef<null | (() => Promise<Blob>)>(null);

  const start = async () => {
    try {
      const rec = await recordMicrophone();
      stopper.current = rec.stop;
      setState("recording");
    } catch {
      alert(t.voice.micRequired);
    }
  };
  const stop = async () => {
    if (!stopper.current) return;
    const raw = await stopper.current();
    stopper.current = null;
    const altered = await alterPitch(raw);
    const u = URL.createObjectURL(altered);
    setUrl(u);
    setState("ready");
    onChange(altered);
  };
  const reset = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null); setState("idle"); onChange(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {state === "idle" && (
          <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium">
            <Mic size={16} aria-hidden="true" /> {t.report.record}
          </button>
        )}
        {state === "recording" && (
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-md bg-destructive text-destructive-foreground px-3 py-2 text-sm font-medium">
            <Square size={16} aria-hidden="true" /> {t.report.stopRecording}
          </button>
        )}
        {state === "ready" && (
          <>
            <span className="inline-flex items-center gap-2 text-sm text-foreground"><Play size={16} aria-hidden="true" /> {t.report.preview}</span>
            <audio src={url ?? undefined} controls className="h-9" />
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <RotateCcw size={14} aria-hidden="true" /> {t.report.reRecord}
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t.report.voiceNote}</p>
    </div>
  );
}
