import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Copy, Check, ShieldCheck, Paperclip, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MapPicker } from "@/components/MapPicker";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useI18n } from "@/lib/i18n";
import { generateSessionId, hashSessionId } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { addSessionEntry } from "@/lib/sessionLog";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report anonymously — FURSAD" },
      { name: "description", content: "End-to-end encrypted, anonymous incident reporting." },
    ],
  }),
  component: ReportPage,
});

type IncidentKey = "tahrib" | "violent" | "radical" | "other";

function ReportPage() {
  const { t } = useI18n();
  const [incident, setIncident] = useState<IncidentKey>("tahrib");
  const [description, setDescription] = useState("");
  const [voice, setVoice] = useState<Blob | null>(null);
  const [area, setArea] = useState("");
  const [when, setWhen] = useState<string>(t.report.whenOptions[0]);
  const [media, setMedia] = useState<File | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !voice) { alert(t.common.required); return; }
    setSubmitting(true);
    try {
      const id = generateSessionId();
      const hash = await hashSessionId(id);

      let voiceUrl: string | null = null;
      if (voice) {
        const path = `${crypto.randomUUID()}.wav`;
        const { error: upErr } = await supabase.storage.from("voice").upload(path, voice, { contentType: "audio/wav" });
        if (!upErr) voiceUrl = path;
      }

      if (media) {
        const ext = media.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        await supabase.storage.from("media").upload(path, media, { contentType: media.type || "application/octet-stream" });
        // Path stored at end of description so we don't change the DB schema.
      }

      let mediaPath: string | null = null;
      if (media) {
        const ext = media.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: mErr } = await supabase.storage.from("media").upload(path, media, { contentType: media.type || "application/octet-stream" });
        if (!mErr) mediaPath = path;
      }

      const descClean = description.trim().slice(0, 4000);
      const descWithMedia = mediaPath ? `${descClean}\n\n[media:${mediaPath}]` : descClean;

      const { error } = await supabase.from("reports").insert({
        session_id_hash: hash,
        incident_type: incident,
        description: descWithMedia,
        voice_url: voiceUrl,
        area_name: area.trim().slice(0, 120) || null,
        when_bucket: when,
      });
      if (error) throw error;
      addSessionEntry({ id, kind: "report", detailKey: incident });
      setSessionId(id);
    } catch (err) {
      console.error(err);
      alert(t.common.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionId) {
    return (
      <AppShell>
        <div className="card-elevated p-5 text-center space-y-3">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold">{t.report.sessionTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.report.sessionDesc}</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-2xl font-mono tracking-widest bg-secondary px-4 py-2 rounded-lg">{sessionId}</code>
            <button onClick={() => { navigator.clipboard?.writeText(sessionId); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? t.report.copied : t.report.copy}
            </button>
          </div>
          <Link to="/" className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium mt-2">{t.report.done}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-2">{t.report.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">{t.report.privacy}</p>

      <form onSubmit={submit} className="space-y-5">
        <Field label={t.report.incidentType}>
          <select value={incident} onChange={(e) => setIncident(e.target.value as IncidentKey)} className={inputCls}>
            {(Object.keys(t.report.incidentOptions) as IncidentKey[]).map((k) => (
              <option key={k} value={k}>{t.report.incidentOptions[k]}</option>
            ))}
          </select>
        </Field>

        <Field label={t.report.what}>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={t.report.whatPlaceholder} rows={5} maxLength={4000}
            className={inputCls + " resize-y min-h-[120px]"}
          />
          <div className="mt-3"><VoiceRecorder onChange={setVoice} /></div>
        </Field>

        <Field label={t.report.location}>
          <MapPicker value={area} onChange={setArea} />
        </Field>

        <Field label={t.report.when}>
          <div className="grid grid-cols-2 gap-2">
            {t.report.whenOptions.map((opt) => (
              <button type="button" key={opt} onClick={() => setWhen(opt)}
                className={`rounded-lg border px-3 py-2 text-sm text-left ${when === opt ? "border-primary bg-primary/10 text-primary" : "border-input text-foreground"}`}>
                {opt}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t.report.mediaH}>
          <p className="text-xs text-muted-foreground mb-2">{t.report.mediaHint}</p>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 25 * 1024 * 1024) { alert(t.report.mediaTooLarge); e.target.value = ""; return; }
              setMedia(f);
            }}
          />
          {!media ? (
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-foreground hover:border-primary hover:text-primary"
            >
              <Paperclip size={16} aria-hidden="true" />
              {t.report.mediaChoose}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2.5">
              <div className="min-w-0 flex items-center gap-2 text-sm">
                <Paperclip size={16} aria-hidden="true" className="text-primary shrink-0" />
                <span className="truncate">{media.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(media.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <button
                type="button"
                aria-label={t.report.mediaRemove}
                onClick={() => { setMedia(null); if (mediaInputRef.current) mediaInputRef.current.value = ""; }}
                className="inline-flex items-center justify-center rounded-md border border-input p-1.5 text-muted-foreground hover:text-destructive"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </Field>

        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-primary text-primary-foreground font-medium py-3 disabled:opacity-60">
          {submitting ? t.report.submitting : t.report.submit}
        </button>
      </form>
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
