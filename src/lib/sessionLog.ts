// Local-only log of Session IDs the user has created on this device.
// Stored in localStorage; never sent to the server. Helps the user follow up.

const KEY = "fursad-session-log";

export type SessionKind = "report" | "mentor";

export type SessionEntry = {
  id: string;
  kind: SessionKind;
  // Stable key (e.g. incident type or need key) — translated on display.
  detailKey?: string;
  // Optional free-text snippet (kept short, never sensitive).
  note?: string;
  createdAt: number;
};

export function getSessionLog(): SessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw as SessionEntry[];
  } catch {
    return [];
  }
}

export function addSessionEntry(entry: Omit<SessionEntry, "createdAt">): void {
  if (typeof window === "undefined") return;
  const log = getSessionLog();
  log.unshift({ ...entry, createdAt: Date.now() });
  try {
    localStorage.setItem(KEY, JSON.stringify(log.slice(0, 50)));
  } catch {}
}

export function removeSessionEntry(id: string): void {
  if (typeof window === "undefined") return;
  const log = getSessionLog().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {}
}
