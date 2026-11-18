#!/usr/bin/env node
/*
 * The owner gate, asserted against the real rules.
 *
 * These are the rules that must never quietly weaken: platform-wide owner access needs a
 * signed edge identity AND an explicit allowlist; an unsigned header, a learner cookie, a
 * guardian header and a platform-headers deployment all fail closed; synthetic review is
 * refused the moment a real secret exists.
 *
 * The harness follows the project convention: check() records a result and refuses anything
 * that is not a name, step() runs a body. A failure exits non-zero.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  REVIEW_DEMO_HEADER,
  REVIEW_KEY_MINIMUM,
  adminGateState,
  ownerConfigured,
  ownerIds,
  resolveOwner,
  reviewDemoEnabled,
} from "../../lib/admin-security.ts";
import { identityAssertionPayload, identityTrustModeFor, signIdentityAssertion } from "../../lib/identity-trust.ts";

const root = resolve(import.meta.dirname, "../..");

let checks = 0;
const failing = [];

async function check(label, body) {
  checks += 1;
  try {
    await body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failing.push({ label, error });
    console.log(`  FAIL ${label}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const SECRET = "a".repeat(48);
const OWNER_ID = "owner-123";
const IDENTITY = { platformUserId: OWNER_ID, email: "owner@example.com", displayName: "Owner" };

function identityHeaders(identity) {
  return {
    "oai-authenticated-user-id": identity.platformUserId,
    "oai-authenticated-user-email": identity.email,
  };
}

async function signedHeaders(identity, secret, issuedAt = new Date().toISOString()) {
  const signature = await signIdentityAssertion(identity, issuedAt, secret);
  return {
    ...identityHeaders(identity),
    "x-kidycode-identity-signature": signature,
    "x-kidycode-identity-issued-at": issuedAt,
  };
}

function request(headers) {
  return new Request("https://kidycode.test/api/admin/curriculum", { headers });
}

console.log("admin security: allowlist parsing");
await check("an empty allowlist grants nobody", () => {
  assert.equal(ownerIds("").size, 0);
  assert.equal(ownerIds(null).size, 0);
  assert.equal(ownerIds(undefined).size, 0);
});
await check("an unsafe id is rejected rather than trimmed into safety", () => {
  assert.equal(ownerIds("ok-id, bad id").size, 0);
  assert.equal(ownerIds("ok-id,<script>").size, 0);
});
await check("more than 20 ids is refused outright", () => {
  const many = Array.from({ length: 21 }, (_, index) => `id-${index}`).join(",");
  assert.equal(ownerIds(many).size, 0);
});
await check("a well formed list is accepted", () => {
  assert.deepEqual([...ownerIds("owner-123, ops@team.example")], ["owner-123", "ops@team.example"]);
});

console.log("admin security: configuration");
await check("a short secret never counts as configured", () => {
  assert.equal(ownerConfigured({ mode: "proxy-signature", secret: "short", adminIds: OWNER_ID }), false);
});
await check("platform-headers mode is not an owner mode", () => {
  assert.equal(ownerConfigured({ mode: "platform-headers", secret: SECRET, adminIds: OWNER_ID }), false);
});
await check("a long secret plus an allowlist is configured", () => {
  assert.equal(ownerConfigured({ mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID }), true);
});
await check("the trust mode follows a configured secret", () => {
  assert.equal(identityTrustModeFor(null, SECRET), "proxy-signature");
  assert.equal(identityTrustModeFor(null, null), "platform-headers");
  assert.equal(identityTrustModeFor("nonsense", null), "deny");
});

console.log("admin security: the gate itself");
await check("an unsigned platform header is refused even with an allowlist", async () => {
  const decision = await resolveOwner(request(identityHeaders(IDENTITY)), {
    mode: "platform-headers",
    secret: null,
    adminIds: OWNER_ID,
  });
  assert.equal(decision, null);
});
await check("a learner cookie alone is refused", async () => {
  const decision = await resolveOwner(
    request({ cookie: "kidycode_session=learner-1.deadbeef" }),
    { mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID },
  );
  assert.equal(decision, null);
});
await check("a valid signed identity on the allowlist is the owner", async () => {
  const decision = await resolveOwner(request(await signedHeaders(IDENTITY, SECRET)), {
    mode: "proxy-signature",
    secret: SECRET,
    adminIds: OWNER_ID,
  });
  assert.equal(decision?.permission, "owner");
  assert.equal(decision?.identity.platformUserId, OWNER_ID);
});
await check("a valid signature for an id that is not allowlisted is refused", async () => {
  const outsider = { platformUserId: "somebody-else", email: "other@example.com", displayName: null };
  const decision = await resolveOwner(request(await signedHeaders(outsider, SECRET)), {
    mode: "proxy-signature",
    secret: SECRET,
    adminIds: OWNER_ID,
  });
  assert.equal(decision, null);
});
await check("a tampered signature is refused", async () => {
  const headers = await signedHeaders(IDENTITY, SECRET);
  headers["x-kidycode-identity-signature"] = "0".repeat(64);
  const decision = await resolveOwner(request(headers), { mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID });
  assert.equal(decision, null);
});
await check("a signature over a different email is refused", async () => {
  const issuedAt = new Date().toISOString();
  const signature = await signIdentityAssertion({ ...IDENTITY, email: "elsewhere@example.com" }, issuedAt, SECRET);
  const decision = await resolveOwner(
    request({ ...identityHeaders(IDENTITY), "x-kidycode-identity-signature": signature, "x-kidycode-identity-issued-at": issuedAt }),
    { mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID },
  );
  assert.equal(decision, null);
});
await check("a stale signature is refused", async () => {
  const issuedAt = new Date(Date.now() - 600_000).toISOString();
  const decision = await resolveOwner(request(await signedHeaders(IDENTITY, SECRET, issuedAt)), {
    mode: "proxy-signature",
    secret: SECRET,
    adminIds: OWNER_ID,
  });
  assert.equal(decision, null);
});
await check("the signed payload cannot be confused across fields", () => {
  const payload = identityAssertionPayload(IDENTITY, "2026-01-01T00:00:00.000Z");
  assert.equal(payload, `${OWNER_ID}\nowner@example.com\n2026-01-01T00:00:00.000Z`);
  assert.equal(payload.split("\n").length, 3);
});

console.log("admin security: synthetic review mode");
const REVIEW_KEY = "review-key-0123456789";
await check("synthetic review is off unless the deployment switches it on", () => {
  assert.equal(reviewDemoEnabled({ mode: "deny", secret: null, adminIds: null }), false);
  assert.equal(reviewDemoEnabled({ mode: "deny", secret: null, adminIds: null, reviewDemo: false }), false);
  assert.ok(REVIEW_KEY_MINIMUM >= 16);
});
await check("the flag alone is not enough: a review key is required", () => {
  assert.equal(reviewDemoEnabled({ mode: "deny", secret: null, adminIds: null, reviewDemo: true }), false);
  assert.equal(reviewDemoEnabled({ mode: "deny", secret: null, adminIds: null, reviewDemo: true, reviewKey: "too-short" }), false);
});
await check("flag plus a long review key enables synthetic review", () => {
  assert.equal(reviewDemoEnabled({ mode: "deny", secret: null, adminIds: null, reviewDemo: true, reviewKey: REVIEW_KEY }), true);
});
await check("with the key, the review header opens a synthetic session", async () => {
  const config = { mode: "deny", secret: null, adminIds: null, reviewDemo: true, reviewKey: REVIEW_KEY };
  const decision = await resolveOwner(request({ [REVIEW_DEMO_HEADER]: REVIEW_KEY }), config);
  assert.equal(decision?.permission, "synthetic-review");
  assert.equal(decision?.identity.platformUserId, "synthetic-review-owner");
});
await check("the old well-known value no longer opens anything", async () => {
  const decision = await resolveOwner(
    request({ [REVIEW_DEMO_HEADER]: "kidycode-synthetic-review" }),
    { mode: "deny", secret: null, adminIds: null, reviewDemo: true, reviewKey: REVIEW_KEY },
  );
  assert.equal(decision, null);
});
await check("the review header without the flag does nothing", async () => {
  const decision = await resolveOwner(
    request({ [REVIEW_DEMO_HEADER]: REVIEW_KEY }),
    { mode: "deny", secret: null, adminIds: null, reviewDemo: false, reviewKey: REVIEW_KEY },
  );
  assert.equal(decision, null);
});
await check("a wrong key of the same length does nothing", async () => {
  const decision = await resolveOwner(
    request({ [REVIEW_DEMO_HEADER]: "review-key-0123456788" }),
    { mode: "deny", secret: null, adminIds: null, reviewDemo: true, reviewKey: REVIEW_KEY },
  );
  assert.equal(decision, null);
});
await check("a real signed owner always wins and synthetic review is switched off", async () => {
  const config = { mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID, reviewDemo: true, reviewKey: REVIEW_KEY };
  assert.equal(reviewDemoEnabled(config), false);
  const owner = await resolveOwner(request(await signedHeaders(IDENTITY, SECRET)), config);
  assert.equal(owner?.permission, "owner");
  const synthetic = await resolveOwner(request({ [REVIEW_DEMO_HEADER]: REVIEW_KEY }), config);
  assert.equal(synthetic, null);
});
await check("the gate state reports configuration without revealing the allowlist or the key", () => {
  const state = adminGateState({ mode: "proxy-signature", secret: SECRET, adminIds: OWNER_ID, reviewDemo: true, reviewKey: REVIEW_KEY });
  assert.deepEqual(state, { configured: true, synthetic: false });
  assert.equal(JSON.stringify(state).includes(REVIEW_KEY), false);
});

console.log("admin boundary: source rules");
function sourceFiles(directory) {
  const out = [];
  for (const entry of readdirSync(directory)) {
    const full = resolve(directory, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const adminRouteFiles = sourceFiles(resolve(root, "app/api/admin"));
const adminLeafRoutes = adminRouteFiles.filter(path => !path.replace(/\\/g, "/").endsWith("session/route.ts"));

await check("every admin data route goes through requireOwner", () => {
  assert.ok(adminLeafRoutes.length >= 3, "expected the curriculum, lesson, analytics and notifications routes.");
  for (const path of adminLeafRoutes) {
    const text = readFileSync(path, "utf8");
    assert.match(text, /requireOwner\(/, `${path} must call requireOwner`);
  }
});

await check("no admin data route can write to the database", () => {
  for (const path of adminLeafRoutes) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /\.run\(|INSERT INTO|UPDATE |DELETE FROM/, `${path} must stay read only`);
  }
});

await check("the analytics route is the only admin route that touches the database", () => {
  for (const path of adminRouteFiles) {
    const text = readFileSync(path, "utf8");
    if (path.replace(/\\/g, "/").endsWith("analytics/route.ts")) assert.match(text, /getDatabase\(/);
    else assert.doesNotMatch(text, /getDatabase\(/, `${path} should not read the database`);
  }
});

await check("no learner-facing route imports the admin modules", () => {
  const learnerRoutes = [
    ...sourceFiles(resolve(root, "app/learn")),
    ...sourceFiles(resolve(root, "app/practice")),
    ...sourceFiles(resolve(root, "app/dashboard")),
    ...sourceFiles(resolve(root, "app/studio")),
    resolve(root, "app/api/progress/route.ts"),
    resolve(root, "app/api/learner/route.ts"),
  ];
  for (const path of learnerRoutes) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /admin-security|admin-runtime|admin-curriculum/, `${path} must not reach admin code`);
  }
});

await check("the admin pages carry a noindex directive and no server-side data", () => {
  const layout = readFileSync(resolve(root, "app/admin/layout.tsx"), "utf8");
  assert.match(layout, /index: false/);
  const page = readFileSync(resolve(root, "app/admin/page.tsx"), "utf8");
  assert.doesNotMatch(page, /getDatabase|headers\(\)|cookies\(\)/);
});

await check("admin route responses are marked no-store", () => {
  for (const path of adminRouteFiles) {
    const text = readFileSync(path, "utf8");
    assert.match(text, /no-store/, `${path} must set a private, no-store cache header`);
  }
});

await check("no review key is ever hard-coded in the source", () => {
  const adminSources = [
    ...adminRouteFiles,
    ...sourceFiles(resolve(root, "components/admin")),
    resolve(root, "lib/admin-security.ts"),
    resolve(root, "lib/admin-runtime.ts"),
  ];
  for (const path of adminSources) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(text, /kidycode-synthetic-review"/, `${path} must not carry a shared review key`);
  }
});

await check("the review key is read from the environment and never returned to a caller", () => {
  const runtime = readFileSync(resolve(root, "lib/admin-runtime.ts"), "utf8");
  assert.match(runtime, /env\.KIDYCODE_ADMIN_REVIEW_KEY/);
  const session = readFileSync(resolve(root, "app/api/admin/session/route.ts"), "utf8");
  assert.doesNotMatch(session, /reviewKey|REVIEW_KEY/, "the session route must not echo the key");
});

if (failing.length > 0) {
  console.error(`\nadmin security: ${failing.length} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\nadmin security: all ${checks} checks passed`);
