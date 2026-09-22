/*
 * Guardian identity.
 *
 * ChatGPT Sites forwards an authenticated identity to the server through request
 * headers once a visitor has signed in. This module reads those headers and
 * nothing else, so a page cannot claim to be someone by sending a value of its
 * own choosing. It is deliberately free of database access so the rules can be
 * reasoned about and tested on their own.
 */

export const GUARDIAN_ID_HEADER = "oai-authenticated-user-id";
export const GUARDIAN_EMAIL_HEADER = "oai-authenticated-user-email";
export const GUARDIAN_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
export const GUARDIAN_NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";
export const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";

/* The platform provides these two paths. Keeping them here means the interface
 * never invents a sign-in route of its own. */
export const GUARDIAN_SIGN_IN_PATH = "/signin-with-chatgpt";
export const GUARDIAN_SIGN_OUT_PATH = "/signout-with-chatgpt";

const MAX_PLATFORM_ID_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;

const PLATFORM_ID_PATTERN = /^[A-Za-z0-9._:@-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export type GuardianIdentity = {
  platformUserId: string;
  email: string;
  displayName: string | null;
};

/* A name is a display hint only. It can never influence authorisation, so a
 * malformed value is dropped rather than trusted. */
function readDisplayName(request: Request): string | null {
  const raw = request.headers.get(GUARDIAN_FULL_NAME_HEADER);
  if (!raw) return null;
  let value = raw;
  if (request.headers.get(GUARDIAN_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8) {
    try {
      value = decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, MAX_NAME_LENGTH);
}

export function readGuardianIdentity(request: Request): GuardianIdentity | null {
  const platformUserId = request.headers.get(GUARDIAN_ID_HEADER)?.trim() || "";
  const email = request.headers.get(GUARDIAN_EMAIL_HEADER)?.trim().toLowerCase() || "";
  if (platformUserId.length === 0 || platformUserId.length > MAX_PLATFORM_ID_LENGTH) return null;
  if (!PLATFORM_ID_PATTERN.test(platformUserId)) return null;
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return { platformUserId, email, displayName: readDisplayName(request) };
}

/* The learner's own view of a guardian is limited to what they need to recognise
 * who is connected, so a child's page never shows a full address. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "connected grown-up";
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function guardianDisplay(account: { email: string; displayName: string | null }): { displayName: string; email: string } {
  return { displayName: account.displayName || account.email.split("@")[0], email: account.email };
}