import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Target, Sparkles, Mail, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — FURSAD" },
      { name: "description", content: "FURSAD is a safe, anonymous platform built for the youth of Wajir County." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-2">{t.about.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t.about.intro}</p>

      <section className="card-elevated p-5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-primary"><Target size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-foreground">{t.about.missionH}</h2></div>
        <p className="text-sm text-foreground">{t.about.mission}</p>
      </section>

      <section className="card-elevated p-5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-primary"><Users size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-foreground">{t.about.eldersH}</h2></div>
        <p className="text-sm text-foreground">{t.about.elders}</p>
      </section>

      <section className="card-elevated p-5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-primary"><Sparkles size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-foreground">{t.about.whatH}</h2></div>
        <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
          {t.about.whatList.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="card-elevated p-5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-primary"><ShieldCheck size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-foreground">{t.about.privacyH}</h2></div>
        <p className="text-sm text-foreground">{t.about.privacy}</p>
      </section>

      <section className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-2 text-primary"><Mail size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-foreground">{t.about.contactH}</h2></div>
        <p className="text-sm text-foreground">{t.about.contact}</p>
      </section>
    </AppShell>
  );
}
