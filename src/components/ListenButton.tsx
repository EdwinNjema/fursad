import { Headphones, CircleStop } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function ListenButton() {
  const { t, lang } = useI18n();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const toggle = () => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const main = document.getElementById("main");
    const text = (main?.innerText || document.body.innerText || "").replace(/\s+/g, " ").slice(0, 1200);
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "sw" ? "sw-KE" : lang === "so" ? "so-SO" : "en-US";
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? t.stopListening : t.listen}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-secondary"
    >
      {speaking ? <CircleStop size={16} aria-hidden="true" /> : <Headphones size={16} aria-hidden="true" />}
      <span className="hidden sm:inline">{speaking ? t.stopListening : t.listen}</span>
    </button>
  );
}
