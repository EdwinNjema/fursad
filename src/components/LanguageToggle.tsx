import { useI18n, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const OPTIONS: { code: Lang; label: string }[] = [
  { code: "so", label: "Somali" },
  { code: "sw", label: "Kiswahili" },
  { code: "en", label: "English" },
];

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = OPTIONS.find((o) => o.code === lang)?.label ?? "English";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.language}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-secondary focus-visible:outline-none"
      >
        <Languages size={16} aria-hidden="true" />
        <span>{current}</span>
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-1 min-w-[140px] card-elevated py-1 text-sm">
          {OPTIONS.map((o) => (
            <li key={o.code}>
              <button
                role="option"
                aria-selected={lang === o.code}
                onClick={() => { setLang(o.code); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 hover:bg-secondary ${lang === o.code ? "text-primary font-medium" : "text-foreground"}`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
