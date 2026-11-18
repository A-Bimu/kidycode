/*
 * The review key, held for a synthetic review session.
 *
 * Synthetic review mode exists so the owner can open the console on a demonstration
 * deployment before any signing edge or owner account is configured. It is only reachable
 * when the DEPLOYMENT switches it on and holds a matching key, so this is not a client-side
 * flag that could grant access anywhere: with the deployment flag off, or with a real owner
 * signing secret configured, no value held here opens anything.
 *
 * The key arrives once as ?review=<key>, is moved into this tab's session storage, and is
 * stripped from the address bar so it does not linger in the URL or in a screenshot. It is
 * never rendered into the page.
 */

const STORAGE_KEY = "kidycode:admin:review-key:v1";
const REVIEW_HEADER = "x-kidycode-review-demo";
const MINIMUM_LENGTH = 16;
const MAXIMUM_LENGTH = 200;
const SAFE_KEY = /^[A-Za-z0-9._~-]+$/;

function read(): string {
  if (typeof window === "undefined") return "";
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY) || "";
    return isUsable(value) ? value : "";
  } catch {
    return "";
  }
}

function isUsable(value: string): boolean {
  return value.length >= MINIMUM_LENGTH && value.length <= MAXIMUM_LENGTH && SAFE_KEY.test(value);
}

export function captureReviewKeyFromLocation(): void {
  if (typeof window === "undefined") return;
  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }
  const supplied = url.searchParams.get("review") || "";
  if (isUsable(supplied)) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, supplied);
    } catch {
      /* A blocked storage API still leaves the console closed rather than guessing. */
    }
    url.searchParams.delete("review");
    try {
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* Leaving the key in the address bar is the fallback, not a failure. */
    }
    return;
  }
  /* An unusable value in the URL is discarded so it can never be mistaken for a session. */
  if (supplied) {
    url.searchParams.delete("review");
    try {
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* Nothing to do. */
    }
  }
}

export function reviewKey(): string {
  return read();
}

/* Headers for every admin request. Empty when no key is held, so an ordinary visitor sends
 * nothing special. */
export function adminRequestHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = read();
  return key ? { ...extra, [REVIEW_HEADER]: key } : { ...extra };
}
