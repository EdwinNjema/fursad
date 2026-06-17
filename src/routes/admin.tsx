import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { adminLogin, adminLogout, isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — FURSAD" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useI18n();
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");

  useEffect(() => setAuthed(isAdmin()), []);

  if (!authed) {
    return (
      <AppShell hideNav>
        <div className="max-w-sm mx-auto card-elevated p-5 mt-12 space-y-3">
          <h1 className="text-lg font-semibold">{t.admin.title}</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (adminLogin(u, p)) setAuthed(true); else setErr(t.admin.invalid); }} className="space-y-2">
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder={t.admin.username} className={inputCls} />
            <input value={p} onChange={(e) => setP(e.target.value)} placeholder={t.admin.password} type="password" className={inputCls} />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium">{t.admin.login}</button>
          </form>
        </div>
      </AppShell>
    );
  }

  return <AdminDash onLogout={() => { adminLogout(); setAuthed(false); }} />;
}

function AdminDash({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"reports" | "mentorship" | "opps" | "forum">("reports");
  const tabs = [
    ["reports", t.admin.tabs.reports],
    ["mentorship", t.admin.tabs.mentorship],
    ["opps", t.admin.tabs.opps],
    ["forum", t.admin.tabs.forum],
  ] as const;
  return (
    <AppShell hideNav>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">{t.admin.title}</h1>
        <button onClick={onLogout} className="text-sm text-muted-foreground">{t.admin.logout}</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-full text-sm ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{label}</button>
        ))}
      </div>
      {tab === "reports" && <AdminReports />}
      {tab === "mentorship" && <AdminMentorship />}
      {tab === "opps" && <AdminOpps />}
      {tab === "forum" && <AdminForum />}
    </AppShell>
  );
}

function AdminReports() {
  const { t } = useI18n();
  const qc = useQueryClient();
  // Reading all reports including unverified requires bypassing RLS — for MVP we only show verified ones to admin too.
  // For unverified, the admin would normally use a server function with service role. Keeping MVP scope minimal.
  const q = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error; return data ?? [];
    },
  });
  const toggleVerified = async (id: string, verified: boolean) => {
    // RLS forbids anon UPDATE — surface a clear MVP note.
    const { error } = await supabase.from("reports").update({ verified: !verified }).eq("id", id);
    if (error) alert("Admin verify needs service-role wiring. (MVP: use Lovable Cloud dashboard.)");
    else qc.invalidateQueries({ queryKey: ["admin-reports"] });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t.adminNotes.mvpNote}</p>
      {q.data?.map((r) => (
        <article key={r.id} className="card-elevated p-4">
          <header className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{(t.report.incidentOptions as Record<string, string>)[r.incident_type] ?? r.incident_type}</h3>
            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
          </header>
          <p className="text-xs text-muted-foreground mt-1">{r.area_name || "—"} · {r.when_bucket}</p>
          <p className="mt-2 text-sm">{r.description}</p>
          <div className="mt-3">
            <button onClick={() => toggleVerified(r.id, r.verified)} className="text-sm rounded-md border border-input px-3 py-1.5">
              {r.verified ? t.admin.unmark : t.admin.markVerified}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminMentorship() {
  const { t } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">{t.adminNotes.mentorshipNote}</p>
  );
}

function AdminOpps() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
  const [form, setForm] = useState({ title: "", type: "Workshop", opp_date: "", location: "", description: "", apply_instructions: "", featured: false });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("opportunities").insert({
      title: form.title, type: form.type, opp_date: form.opp_date || null, location: form.location || null,
      description: form.description, apply_instructions: form.apply_instructions || null, featured: form.featured,
    });
    if (error) { alert(t.adminNotes.rlsBlocked); return; }
    setForm({ title: "", type: "Workshop", opp_date: "", location: "", description: "", apply_instructions: "", featured: false });
    qc.invalidateQueries({ queryKey: ["admin-opps"] });
  };
  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card-elevated p-4 space-y-2">
        <input className={inputCls} placeholder={t.admin.title2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-3 gap-2">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Workshop">{t.oppTypes.workshop}</option><option value="NGO">{t.oppTypes.ngo}</option><option value="County">{t.oppTypes.county}</option>
          </select>
          <input className={inputCls} type="date" value={form.opp_date} onChange={(e) => setForm({ ...form, opp_date: e.target.value })} />
          <input className={inputCls} placeholder={t.admin.location} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <textarea className={inputCls} rows={2} placeholder={t.admin.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <textarea className={inputCls} rows={2} placeholder={t.admin.instructions} value={form.apply_instructions} onChange={(e) => setForm({ ...form, apply_instructions: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> {t.admin.featured}</label>
        <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">{t.admin.addOpp}</button>
      </form>

      <div className="space-y-2">
        {q.data?.map((o) => (
          <article key={o.id} className="card-elevated p-3 text-sm flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{o.title} {o.featured && <span className="badge-verified !bg-primary ml-1">{t.home.featured}</span>}</p>
              <p className="text-xs text-muted-foreground">{o.type} · {o.location || "—"}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminForum() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ["admin-forum"],
    queryFn: async () => {
      const { data } = await supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <div className="space-y-2">
      {q.data?.map((p) => (
        <article key={p.id} className="card-elevated p-3 text-sm">
          <p className="text-xs text-muted-foreground">{p.nickname} · {(t.discuss.categories as Record<string, string>)[p.category] ?? p.category}</p>
          <p className="mt-1">{p.content}</p>
        </article>
      ))}
      <p className="text-xs text-muted-foreground mt-3">{t.adminNotes.deleteNote}</p>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus-visible:border-primary outline-none";
