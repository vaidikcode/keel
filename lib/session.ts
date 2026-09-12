export const SESSION_KEY = "keel-session";
export function readSessionId(): string {
  const old = sessionStorage.getItem(SESSION_KEY);
  const existing = localStorage.getItem(SESSION_KEY);
  const id = existing || old || crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}
