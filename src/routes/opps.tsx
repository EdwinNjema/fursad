import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Info, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { getSavedOpps, toggleSavedOpp } from "@/lib/savedOpps";

export const Route = createFileRoute("/opps")({
  head: () => ({ meta: [{ title: "Opportunities — FURSAD" }] }),
  component: OppsPage,
});

function OppsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<{ title: string; instructions: string | null } | null>(null);

  useEffect(() => setSaved(getSavedOpps()), []);

  const q = useQuery({
    queryKey: ["opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });

  const list = (q.data ?? []).filter((o) => (tab === "all" ? true : saved.includes(o.id)));

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-3">{t.opps.title}</h1>
      <div className="inline-flex rounded-lg bg-secondary p-1 mb-4" role="tablist">
        {(["all", "saved"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-sm rounded-md ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {k === "all" ? t.opps.all : t.opps.saved}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
        {!q.isLoading && list.length === 0 && (
          <p className="text-sm text-muted-foreground">{tab === "all" ? t.opps.noneAll : t.opps.noneSaved}</p>
        )}
        {list.map((o) => {
          const isSaved = saved.includes(o.id);
          return (
            <article key={o.id} className="card-elevated p-4">
              <header className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold leading-tight">{o.title}</h3>
                {o.featured && <span className="badge-verified shrink-0 !bg-primary">{t.home.featured}</span>}
              </header>
              <p className="mt-1 text-xs text-muted-foreground">
                {o.type}{o.location ? ` · ${o.location}` : ""}{o.opp_date ? ` · ${o.opp_date}` : ""}
              </p>
              <p className="mt-2 text-sm text-foreground">{o.description}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setSaved(toggleSavedOpp(o.id))} aria-pressed={isSaved}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${isSaved ? "bg-primary/10 border-primary text-primary" : "border-input"}`}>
                  <Heart size={14} aria-hidden="true" fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? t.opps.saved2 : t.opps.save}
                </button>
                <button onClick={() => setModal({ title: o.title, instructions: o.apply_instructions })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium">
                  <Info size={14} aria-hidden="true" /> {t.opps.apply}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {modal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 bg-foreground/40 flex items-end sm:items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="card-elevated w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{t.opps.howToApply}</h2>
              <button onClick={() => setModal(null)} aria-label={t.opps.close} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <p className="mt-1 text-sm font-medium">{modal.title}</p>
            <p className="mt-3 text-sm text-foreground whitespace-pre-line">{modal.instructions || "Contact FURSAD for details."}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
