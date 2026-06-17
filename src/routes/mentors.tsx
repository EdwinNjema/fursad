import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { generateSessionId, hashSessionId } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { addSessionEntry } from "@/lib/sessionLog";

export const Route = createFileRoute("/mentors")({
  head: () => ({ meta: [{ title: "Mentors — FURSAD" }] }),
  component: MentorsPage,
});

type NeedKey = "skills" | "jobs" | "life" | "school" | "business" | "other";
type Method = "check" | "text" | "call";

// Minimal client-side obfuscation of phone numbers before they hit the server.
// The number is then deleted by the admin tool after the message is sent.
async function obfuscatePhone(phone: string): Promise<string> {
  const enc = new TextEncoder().encode(phone);
  const buf = await crypto.subtle.digest("SHA-256", new Uint8Array([...enc, ...new TextEncoder().encode("fursad-salt")]));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `enc:${hex.slice(0, 16)}:${btoa(phone)}`;
}

function MentorsPage() {
  const { t } = useI18n();
  const [need, setNeed] = useState<NeedKey>("skills");
  const [method, setMethod] = useState<Method>("check");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((method === "text" || method === "call") && (!phone.trim() || !consent)) return;
    setSubmitting(true);
    try {
      const id = generateSessionId();
      const hash = await hashSessionId(id);
      const phoneEnc = phone ? await obfuscatePhone(phone.trim()) : null;
      const { error } = await supabase.from("mentorship_requests").insert({
        session_id_hash: hash,
        need: t.mentors.needOptions[need],
        contact_method: method,
        phone_encrypted: phoneEnc,
        consent,
      });
      if (error) throw error;
      addSessionEntry({ id, kind: "mentor", detailKey: need });
      setSessionId(id);
    } catch (err) {
      console.error(err);
      alert(t.common.submitError);
    } finally { setSubmitting(false); }
  };

  if (sessionId) {
    return (
      <AppShell>
        <div className="card-elevated p-5 space-y-3 text-center">
          <h1 className="text-lg font-semibold">{t.mentors.saved}</h1>
          <code className="text-2xl font-mono tracking-widest bg-secondary px-4 py-2 rounded-lg inline-block">{sessionId}</code>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">{t.mentors.title}</h1>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t.mentors.need}>
          <select value={need} onChange={(e) => setNeed(e.target.value as NeedKey)} className={inputCls}>
            {(Object.keys(t.mentors.needOptions) as NeedKey[]).map((k) => (
              <option key={k} value={k}>{t.mentors.needOptions[k]}</option>
            ))}
          </select>
        </Field>

        <Field label={t.mentors.contact}>
          <div className="space-y-2">
            {([
              ["check", t.mentors.methodCheck],
              ["text", t.mentors.methodText],
              ["call", t.mentors.methodCall],
            ] as [Method, string][]).map(([k, label]) => (
              <label key={k} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer ${method === k ? "border-primary bg-primary/5" : "border-input"}`}>
                <input type="radio" name="method" checked={method === k} onChange={() => setMethod(k)} className="accent-[color:var(--color-primary)]" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </Field>

        {(method === "text" || method === "call") && (
          <Field label={t.mentors.phone}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.mentors.phonePlaceholder}
              className={inputCls} maxLength={20} />
            <label className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[color:var(--color-primary)]" />
              <span>{t.mentors.consent}</span>
            </label>
          </Field>
        )}

        <button type="submit" disabled={submitting}
          className="w-full rounded-lg bg-primary text-primary-foreground font-medium py-3 disabled:opacity-60">
          {submitting ? t.mentors.submitting : t.mentors.submit}
        </button>
      </form>
    </AppShell>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base focus-visible:border-primary outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>{children}</div>);
}
