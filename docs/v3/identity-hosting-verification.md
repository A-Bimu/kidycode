# KidyCode identity boundary: hosting verification and release decision

Status: **BLOCKED — do not merge, deploy, or run a human child pilot.** Investigated 2026-10-29. Scope: ChatGPT Sites hosting project declared in `.openai/hosting.json` (contains a Sites project ID and D1 binding `DB`; no Vercel project config was found).

## Code evidence
- `lib/guardian-identity.ts` reads `oai-authenticated-user-id` and `oai-authenticated-user-email` as plain incoming request headers.
- `lib/identity-trust.ts` in P4 offers `platform-headers`, `proxy-signature`, and `deny`. In the current default with no config, **platform-headers is selected**, and its own unit/e2e evidence shows that if an attacker can supply those headers to the app, they can be believed.
- `lib/institution-identity.ts` uses the identity trust configuration for institutional endpoints.
- **Additional gap closed in this review branch:** `lib/guardian-auth.ts` previously called `readGuardianIdentity` directly, bypassing signed trust mode even when institutional routes were guarded. It now awaits `readInstitutionIdentity` so guardian routes use the same trust policy. No hosting configuration changes were applied.
- Signature verification uses HMAC-SHA-256, 300-second timestamp skew, but no one-time nonce. Avoid claiming strict replay prevention: a captured signed assertion could be replayed within its validity window unless other session/network controls prevent that.
- A user-provided `KIDYCODE_IDENTITY_SECRET` **cannot magically cause ChatGPT Sites to sign headers**. The server-side verifier alone is insufficient.

## Hosting compatibility finding
1. Repo `.openai/hosting.json` confirms ChatGPT Sites packaging via `build/sites-vite-plugin.ts`, `scripts/sites-env.sh` and ChatGPT sign-in routes.
2. No accessible official public ChatGPT Sites documentation located confirming that an app owner can add custom HMAC-signing middleware at the Sites edge or guarantee stripping of client-provided copies of `oai-authenticated-user-*`.
3. Therefore **signed-proxy support on actual hosting is NOT VERIFIED**. Do not introduce `KIDYCODE_IDENTITY_SECRET` in production or switch to `proxy-signature` expecting it to work; without a real trusted signer, it would deny legitimate sign-ins, and with a weak origin boundary it could still be bypassed by unguarded endpoints.
4. OpenAI's public documentation on *ChatGPT Work Cloud Browser* HTTP message signatures is unrelated to **ChatGPT Sites user identity forwarding**. Do not treat it as evidence of Sites edge signing.

## Required evidence before release
- Obtain authoritative platform documentation or support confirmation stating whether Sites strips caller-supplied `oai-authenticated-user-id`, `oai-authenticated-user-email`, `oai-authenticated-user-full-name`, `oai-authenticated-user-full-name-encoding` and whether Sites can generate/forward a custom signed assertion.
- With an isolated non-production deployment and synthetic accounts only, test **signed-out and forged headers** against *all* privileged guardian and institution endpoints. Expected 401/403, no data or side effect. This must be a carefully authorized test of our own staging instance, never unrelated users.
- If Sites cannot meet the trust contract, choose supported first-party identity such as verified OAuth/OpenID token verification or an owner-controlled edge with its own authenticated session, and refactor every guardian/institution route through one common verified identity helper.
- Audit `establishGuardian`, `readInstitutionIdentity`, and any other use of `readGuardianIdentity` (including future endpoints), and add regression checks for signing mode and unknown-mode fail closed.
- Validate secret provision, signer ownership, timestamp/replay handling and key rotation before any real deployment.
- Keep the pilot blocked until signed-out, forged-header and cross-tenant tests are evidenced on staging.

## Recommendation
**Prefer an owner-controlled, independently authenticated proxy or a vetted identity provider, not a homemade signer with unverified Sites support.** Keep the current deployment and PRs untouched until we know what the actual ingress guarantees. If no supported secure edge option exists on ChatGPT Sites, changing hosting/auth architecture is a separate reviewed decision, not a silent switch.

## Review status
This branch includes one guardian-auth integration change, not a complete release-safe deployment. No local build or end-to-end checks run from this GitHub-only session. No secrets were created or exposed.
