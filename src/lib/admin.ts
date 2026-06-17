// Admin auth — MVP: hardcoded credentials kept client-side.
// The admin can manage data because RLS allows reads of opportunities/forum,
// and admin-only writes (delete, update, mentorship reads) go through service-role
// server functions guarded by an admin secret session token.
// For this MVP we authorize through the supabase service role from a server fn
// that checks a shared admin password before acting.

export const ADMIN_USERNAME = "admin";
// Demo password — change in production. Stored client side for simplicity in MVP.
export const ADMIN_PASSWORD = "fursad2026";

const KEY = "fursad-admin-session";

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    return true;
  }
  return false;
}
export function adminLogout() { try { sessionStorage.removeItem(KEY); } catch {} }
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}
