import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check, Trash2, FileWarning, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { hashSessionId } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { getSessionLog, removeSessionEntry, type SessionEntry } from "@/lib/sessionLog";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [{ title: "Check status — FURSAD" }] }),
  component: StatusPage,
});

function StatusPage() {
  const { t } = useI18n();
  const [id, setId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<SessionEntry[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setLog(getSessionLog()); }, []);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null); setNotFound(false); setLoading(true);
    try {
      const hash = await hashSessionId(id);
      const { data } = await supabase.from("reports").select("verified,created_at").eq("session_id_hash", hash).maybeSingle();
      if (!data) { setNotFound(true); return; }
      const ageH = (Date.now() - new Date(data.created_at).getTime()) / 36e5;
      if (data.verified) setStatus(t.status.labels.action);
      else if (ageH > 24) setStatus(t.status.labels.elders);
      else setStatus(t.status.labels.received);
    } finally { setLoading(false); }
  };

  const useEntry = (entryId: string) => {
    setId(entryId);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeEntry = (entryId: string) => {
    removeSessionEntry(entryId);
    setLog(getSessionLog());
  };

  const copy = (entryId: string) => {
    navigator.clipboard?.writeText(entryId);
    setCopied(entryId);
    setTimeout(() => setCopied(null), 1500);
  };

  const labelFor = (e: SessionEntry): string => {
    if (e.kind === "report") {
      const k = e.detailKey as keyof typeof t.report.incidentOptions | undefined;
      const detail = k ? t.report.incidentOptions[k] : undefined;
      return detail ? `${t.status.kindReport} — ${detail}` : t.status.kindReport;
    }
    const k = e.detailKey as keyof typeof t.mentors.needOptions | undefined;
    const detail = k ? t.mentors.needOptions[k] : undefined;
    return detail ? `${t.status.kindMentor} — ${detail}` : t.status.kindMentor;
  };

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">{t.status.title}</h1>
      <form onSubmit={check} className="space-y-3">
        <input
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
          placeholder={t.status.placeholder}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base tracking-widest font-mono uppercase focus-visible:border-primary outline-none"
        />
        <button
          type="submit"
          disabled={loading || !id.trim()}
          className="w-full rounded-lg bg-primary text-primary-foreground font-medium py-3 disabled:opacity-60"
        >
          {loading ? t.common.loading : t.status.check}
        </button>
      </form>
      {status && <div className="mt-5 card-elevated p-4 text-foreground">{status}</div>}
      {notFound && <div className="mt-5 card-elevated p-4 text-muted-foreground">{t.status.notFound}</div>}

      <section className="mt-8">
        <h2 className="text-base font-semibold mb-1">{t.status.yoursH}</h2>
        <p className="text-xs text-muted-foreground mb-3">{t.status.yoursHint}</p>
        {log.length === 0 ? (
          <div className="card-elevated p-4 text-sm text-muted-foreground">{t.status.yoursEmpty}</div>
        ) : (
          <ul className="space-y-2">
            {log.map((e) => {
              const Icon = e.kind === "report" ? FileWarning : UserPlus;
              return (
                <li key={e.id + e.createdAt} className="card-elevated p-3 flex flex-wrap items-center gap-3">
                  <Icon size={18} className="text-primary shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono tracking-widest text-sm bg-secondary px-2 py-0.5 rounded">{e.id}</code>
                      <button
                        type="button"
                        onClick={() => copy(e.id)}
                        aria-label={t.report.copy}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {copied === e.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      </button>
                    </div>
                    <p className="text-sm text-foreground truncate">{labelFor(e)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => useEntry(e.id)}
                      className="rounded-md border border-input px-2.5 py-1.5 text-xs"
                    >
                      {t.status.use}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEntry(e.id)}
                      aria-label={t.status.remove}
                      className="inline-flex items-center justify-center rounded-md border border-input p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
