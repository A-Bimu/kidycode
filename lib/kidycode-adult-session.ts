/**
 * Adult-browser session utilities. Provider access tokens stay in HttpOnly,
 * same-site cookies; neither lesson JavaScript nor the guardian UI reads them.
 * No refresh token is stored: short sessions require signing in again.
 */
export const ADULT_COOKIE = "__Host-kidycode-adult";
export const LOCAL_ADULT_COOKIE = "kidycode-local-adult";
const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,8192}$/;

export function secureRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
}

export function isSameOriginMutation(request: Request): boolean {
  if (!secureRequest(request)) return false;
  const origin = request.headers.get("Origin");
  return origin !== null && origin === new URL(request.url).origin;
}

function cookieName(request: Request): string {
  return new URL(request.url).protocol === "https:" ? ADULT_COOKIE : LOCAL_ADULT_COOKIE;
}

export function cookieToken(request: Request): string | null {
  if (!secureRequest(request)) return null;
  const prefix = cookieName(request) + "=";
  const entry = (request.headers.get("cookie") || "").split(";").map(item => item.trim()).find(part => part.startsWith(prefix));
  const token = entry?.slice(prefix.length) || "";
  return TOKEN_PATTERN.test(token) ? token : null;
}

export function sessionCookie(request: Request, token: string, expiresIn: number): string {
  if (!secureRequest(request) || !TOKEN_PATTERN.test(token)) throw new Error("Cannot establish an unsafe browser session.");
  const seconds = Math.min(3600, Math.max(1, Math.trunc(expiresIn)));
  const flags = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName(request)}=${token}; Path=/; Max-Age=${seconds}; HttpOnly; SameSite=Strict${flags}`;
}

export function clearSessionCookie(request: Request): string {
  const flags = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName(request)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${flags}`;
}

export function supabaseAuthEndpoint(url: string | null | undefined, path: string): URL | null {
  let origin: URL;
  try { origin = new URL(url || ""); } catch { return null; }
  if (origin.protocol !== "https:" || !origin.hostname.endsWith(".supabase.co") ||
      origin.hostname === ".supabase.co" || origin.pathname !== "/" ||
      origin.username || origin.password || origin.search || origin.hash || origin.port) return null;
  return new URL(path, origin);
}
