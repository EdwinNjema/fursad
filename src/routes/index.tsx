import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Info, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { getSavedOpps, toggleSavedOpp } from "@/lib/savedOpps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FURSAD — Home" },
      { name: "description", content: "Verified reports and featured opportunities for Wajir youth." },
    ],
  }),
  component: Home,
});

function hoursSince(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
}

function Home() {
  const { t } = useI18n();

  const reports = useQuery({
    queryKey: ["home-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports").select("id,incident_type,area_name,created_at,verified")
        .eq("verified", true).order("created_at", { ascending: false }).limit(8);
      if (error) throw error; return data ?? [];
    },
  });

  const opps = useQuery({
    queryKey: ["home-opps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities").select("*").eq("featured", true).order("created_at", { ascending: false }).limit(6);
      if (error) throw error; return data ?? [];
    },
  });

  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => setSaved(getSavedOpps()), []);

  return (
    <AppShell>
      <h1 className="sr-only">FURSAD</h1>

      <section aria-labelledby="welcome-h" className="card-elevated p-5 mb-6 bg-gradient-to-br from-primary/10 to-transparent border-l-4 border-primary">
        <h2 id="welcome-h" className="text-lg font-semibold text-foreground">{t.home.welcomeTitle}</h2>
        <p className="mt-2 text-sm text-foreground leading-relaxed">{t.home.welcomeBody}</p>
        <a href="/about" className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline">
          {t.home.learnMore} →
        </a>
      </section>

      <section aria-labelledby="reports-h" className="mb-6">
        <h2 id="reports-h" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t.home.verifiedReports}</h2>
        <div className="space-y-3">
          {reports.isLoading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
          {reports.data && reports.data.length === 0 && <p className="text-sm text-muted-foreground">{t.home.noReports}</p>}
          {reports.data?.map((r) => (
            <article key={r.id} className="card-elevated p-4">
              <header className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {(t.report.incidentOptions as Record<string, string>)[r.incident_type] ?? r.incident_type}{r.area_name ? ` — ${r.area_name}` : ""}
                </h3>
                <span className="badge-verified shrink-0"><ShieldCheck size={12} aria-hidden="true" /> {t.home.verified}</span>
              </header>
              <p className="mt-1 text-xs text-muted-foreground">{t.home.anonymousReport} · {t.home.hoursAgo(hoursSince(r.created_at))}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="opps-h">
        <h2 id="opps-h" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t.home.featuredOpps}</h2>
        <div className="space-y-3">
          {opps.isLoading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
          {opps.data && opps.data.length === 0 && <p className="text-sm text-muted-foreground">{t.home.noOpps}</p>}
          {opps.data?.map((o) => {
            const isSaved = saved.includes(o.id);
            return (
              <article key={o.id} className="card-elevated p-4">
                <header className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground leading-tight">{o.title}</h3>
                  <span className="badge-verified shrink-0 !bg-primary">{t.home.featured}</span>
                </header>
                <p className="mt-1 text-xs text-muted-foreground">{o.type}{o.location ? ` · ${o.location}` : ""}</p>
                <p className="mt-2 text-sm text-foreground">{o.description}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setSaved(toggleSavedOpp(o.id))}
                    aria-pressed={isSaved}
                    aria-label={t.home.save}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${isSaved ? "bg-primary/10 border-primary text-primary" : "border-input text-foreground"}`}
                  >
                    <Heart size={14} aria-hidden="true" fill={isSaved ? "currentColor" : "none"} />
                    {t.home.save}
                  </button>
                  <a href="/opps" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">
                    <Info size={14} aria-hidden="true" /> {t.home.apply}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
