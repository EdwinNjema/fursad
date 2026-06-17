const KEY = "fursad-saved-opps";

export function getSavedOpps(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function toggleSavedOpp(id: string): string[] {
  const cur = new Set(getSavedOpps());
  if (cur.has(id)) cur.delete(id); else cur.add(id);
  const arr = Array.from(cur);
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
  return arr;
}
