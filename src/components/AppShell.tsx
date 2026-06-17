import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Megaphone, Users, Briefcase, MessagesSquare, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { ListenButton } from "./ListenButton";
import { ThemeToggle } from "./ThemeToggle";
import type { ReactNode } from "react";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: t.nav.home, Icon: Home },
    { to: "/opps", label: t.nav.opps, Icon: Briefcase },
    { to: "/report", label: t.nav.report, Icon: Megaphone },
    { to: "/mentors", label: t.nav.mentors, Icon: Users },
    { to: "/discuss", label: t.nav.discuss, Icon: MessagesSquare },
    { to: "/status", label: t.nav.sessions, Icon: KeyRound },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-lg text-foreground">
            FURSAD
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/about" className="text-sm text-foreground hover:text-primary px-2 py-1.5">{t.nav.about}</Link>
            <ListenButton />
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 w-full mx-auto max-w-2xl px-4 pb-24 pt-4">
        {children}
      </main>

      {!hideNav && (
        <nav
          aria-label={t.common.primaryNav}
          className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border"
        >
          <ul className="mx-auto max-w-2xl grid grid-cols-6">
            {items.map(({ to, label, Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
