/*
 * Database level checks for grown-up access, which cannot be made through the
 * HTTP interface on their own:
 *
 *   1. A plain connection code is never stored anywhere.
 *   2. An expired code is refused, even though it was once valid.
 *   3. Deleting a learner removes their codes and links.
 *
 * The server must be running, and the local D1 store must be reachable:
 *
 *   node_modules/.bin/vinext dev &
 *   node --import tsx scripts/e2e-guardian-db.mjs
 *
 * Point it at a different store with KIDYCODE_D1_PATH, and at a different server
 * with KIDYCODE_E2E_URL.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(import.meta.dirname, "..");
const candidates = [
  process.env.KIDYCODE_E2E_URL,
  "http://localhost:4321",
  "http://localhost:3000",
].filter(Boolean);

const passed = [];
const failed = [];

function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records a result. Use step() to run a test body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}

async function step(name, run) {
  try {
    await run();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

function locateDatabase() {
  if (process.env.KIDYCODE_D1_PATH) return process.env.KIDYCODE_D1_PATH;
  const directory = resolve(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) throw new Error(`No local D1 store at ${directory}`);
  const file = readdirSync(directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => resolve(directory, name))
    .sort()
    .pop();
  if (!file) throw new Error("No D1 database file was found.");
  return file;
}

let base = "";
async function findServer() {
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/api/progress`, { signal: AbortSignal.timeout(8000) });
      if (response.status === 401) {
        base = candidate;
        return;
      }
    } catch {
      continue;
    }
  }
  throw new Error("No KidyCode server answered. Start it first.");
}

const databasePath = locateDatabase();
const database = new DatabaseSync(databasePath);
console.log(`Checking grown-up access against ${databasePath}`);

let cookie = "";
async function learnerApi(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", cookie },
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function guardianApi(path, options = {}, identity) {
  const headers = {
    "content-type": "application/json",
    "oai-authenticated-user-id": identity.id,
    "oai-authenticated-user-email": identity.email,
  };
  const response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(30000) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function newLearner(nickname, courseId, age) {
  cookie = "";
  const response = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  const body = await response.json();
  assert.equal(response.status, 201, `Could not create ${nickname}: ${JSON.stringify(body)}`);
  return body.learner;
}

const runTag = crypto.randomUUID().slice(0, 8);
const guardian = { id: `guardian-db-${runTag}`, email: `db-${runTag}@example.test` };

await findServer();

/* 1. A plain code never reaches the database. */
let learnerA = null;
let codeA = "";
await step("a plain connection code is never stored", async () => {
  learnerA = await newLearner("DbChild", "ages-10-12", 11);
  const created = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(created.status, 200, `Expected 200, received ${created.status}`);
  codeA = created.body.issuedCode;
  const normalised = codeA.replace(/-/g, "");

  const rows = database.prepare("SELECT * FROM guardian_connect_codes WHERE learner_id = ?").all(learnerA.id);
  assert.equal(rows.length >= 1, true, "The learner must have a code row.");
  const dump = JSON.stringify(rows);
  assert.equal(dump.includes(normalised), false, "The plain code must not appear in any column.");
  assert.equal(dump.includes(codeA), false, "The grouped code must not appear in any column.");
  for (const row of rows) {
    assert.equal(String(row.code_digest).length, 64, "Only a SHA-256 digest may be stored.");
    assert.equal(String(row.code_digest).includes(normalised), false, "A digest must not contain the code.");
  }
});

/* 2. An expired code is refused. */
await step("a valid code is prepared and then backdated", async () => {
  const row = database
    .prepare("SELECT id, expires_at AS expiresAt FROM guardian_connect_codes WHERE learner_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(learnerA.id);
  assert(row, "A code row must exist to expire.");
  const past = new Date(Date.now() - 60_000).toISOString();
  database.prepare("UPDATE guardian_connect_codes SET expires_at = ? WHERE id = ?").run(past, row.id);
  const updated = database.prepare("SELECT expires_at AS expiresAt FROM guardian_connect_codes WHERE id = ?").get(row.id);
  assert.equal(updated.expiresAt, past, "The code must be backdated for the test to mean anything.");
});

await step("an expired code is refused", async () => {
  const result = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: codeA }) }, guardian);
  assert.equal(result.status, 410, `An expired code must be refused, received ${result.status}`);
  assert.equal(result.body.error.includes("expired"), true, `The message must say it expired: ${result.body.error}`);
});

await step("the learner is told no code is waiting once it expires", async () => {
  const result = await learnerApi("/api/guardian/connections");
  assert.equal(result.body.pendingCode, null, "An expired code must not be reported as waiting.");
});

/* 3. Deleting a learner removes related codes and links. */
let learnerB = null;
let linkRefB = "";
await step("a learner is connected before deletion", async () => {
  learnerB = await newLearner("DbChildTwo", "ages-10-12", 12);
  const created = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  const claimed = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: created.body.issuedCode }) }, guardian);
  assert.equal(claimed.status, 200, `Expected 200, received ${claimed.status}`);
  linkRefB = claimed.body.learner.linkRef;
  const codes = database.prepare("SELECT COUNT(*) AS total FROM guardian_connect_codes WHERE learner_id = ?").get(learnerB.id);
  const links = database.prepare("SELECT COUNT(*) AS total FROM guardian_links WHERE learner_id = ?").get(learnerB.id);
  assert.equal(codes.total >= 1, true, "A code row must exist before deletion.");
  assert.equal(links.total, 1, "A link row must exist before deletion.");
});

await step("deleting a learner removes their codes and links", async () => {
  database.prepare("DELETE FROM learner_profiles WHERE id = ?").run(learnerB.id);
  const codes = database.prepare("SELECT COUNT(*) AS total FROM guardian_connect_codes WHERE learner_id = ?").get(learnerB.id);
  const links = database.prepare("SELECT COUNT(*) AS total FROM guardian_links WHERE learner_id = ?").get(learnerB.id);
  assert.equal(codes.total, 0, "Codes must be removed with the learner.");
  assert.equal(links.total, 0, "Links must be removed with the learner.");
});

await step("the deleted learner's session stops working", async () => {
  const result = await learnerApi("/api/progress");
  assert.equal(result.status, 401, `A deleted learner must not keep a session, received ${result.status}`);
});

await step("the guardian list no longer shows the deleted learner", async () => {
  const session = await guardianApi("/api/guardian/session", {}, guardian);
  assert.equal(session.status, 200, `Expected 200, received ${session.status}`);
  assert.equal(session.body.learners.some((learner) => learner.linkRef === linkRefB), false,
    "A deleted learner must leave the guardian's list.");
});

await step("the deleted learner's link handle gives no access", async () => {
  const result = await guardianApi(`/api/guardian/summary?link=${encodeURIComponent(linkRefB)}`, {}, guardian);
  assert.equal(result.status, 403, `A dead handle must be refused, received ${result.status}`);
});

database.close();
console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}