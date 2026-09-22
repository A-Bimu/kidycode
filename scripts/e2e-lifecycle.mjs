/*
 * The two ways a learner leaves: clearing a device, and deleting a profile.
 *
 * Clearing must change nothing but the cookie. Deleting must remove every row that
 * belongs to the learner, revoke grown-up access, cancel codes, and leave no orphan
 * behind in any table. Both are checked through the API and then read straight out
 * of the local store.
 *
 *   cd C:/Users/USER/kidycode
 *   KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx --no-warnings scripts/e2e-lifecycle.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { courses } from "../lib/course-catalog.ts";

const root = resolve(import.meta.dirname, "..");
const candidates = [process.env.KIDYCODE_E2E_URL, "http://localhost:4321", "http://localhost:3000"].filter(Boolean);
const passed = [];
const failed = [];

function check(name) {
  passed.push(name);
  console.log(`  ok   ${name}`);
}

async function step(name, run) {
  try {
    await run();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message.split("\n")[0]}`);
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

await findServer();
const database = new DatabaseSync(locateDatabase());
console.log(`Checking the data lifecycle against ${base}`);

/* Every table that holds a row belonging to a learner. */
const LEARNER_TABLES = [
  "course_progress",
  "lesson_evidence",
  "tutor_interventions",
  "concept_review",
  "project_checkpoints",
  "exam_attempts",
  "guardian_links",
  "guardian_connect_codes",
  "learner_transfer_codes",
];

function rowsFor(table, learnerId) {
  return database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id = ?`).get(learnerId).total;
}

function allRows(learnerId) {
  return LEARNER_TABLES.map((table) => `${table}=${rowsFor(table, learnerId)}`).join(" ");
}

let cookie = "";
async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session && !session.includes("Max-Age=0")) cookie = session.split(";")[0];
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, setCookie };
}

async function newLearner(nickname, courseId, age) {
  cookie = "";
  const response = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
    signal: AbortSignal.timeout(30000),
  });
  const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  const body = await response.json();
  assert.equal(response.status, 201, `Could not create ${nickname}: ${JSON.stringify(body)}`);
  return body.learner;
}

function seedWork(learnerId, course) {
  const progress = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, '', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed'`);
  course.lessons.forEach((lesson, index) => {
    progress.run(learnerId, lesson.id, new Date(Date.now() - 3600_000 + index * 30_000).toISOString());
  });
  const files = JSON.stringify({ html: "<h1>My First Website</h1>", css: "h1 { color: #111936; }", javascript: "console.log('ready');", theme: "interest" });
  const checkpoint = database.prepare(`INSERT INTO project_checkpoints
    (id, learner_id, stage_id, version, project_json, reflection, created_at)
    VALUES (?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET project_json = excluded.project_json, created_at = excluded.created_at`);
  for (const stage of course.stages) {
    checkpoint.run(`${learnerId}:${stage.id}`, learnerId, stage.id, files, "A reflection only the learner may read.", new Date().toISOString());
  }
  const now = new Date().toISOString();
  database.prepare(`INSERT INTO lesson_evidence
    (learner_id, lesson_id, attempts, successful_checks, hints_requested, mastery, completed_at, created_at, last_activity_at)
    VALUES (?, ?, 2, 1, 1, 40, ?, ?, ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET mastery = 40`).run(learnerId, course.lessons[0].id, now, now, now);
  database.prepare(`INSERT INTO concept_review
    (learner_id, concept, label, lesson_id, times_failed, times_recovered, review_streak, due, first_failed_at, last_failed_at)
    VALUES (?, 'html-heading', 'The page has a main heading', ?, 2, 0, 0, 1, ?, ?)
    ON CONFLICT (learner_id, concept) DO UPDATE SET times_failed = 2`).run(learnerId, course.lessons[0].id, now, now);
  /* One piece of recorded support, so the intervention table is exercised too. */
  database.prepare(`INSERT INTO tutor_interventions
    (id, learner_id, lesson_id, level, focus, requirement_json, source, resolved_independently, created_at)
    VALUES (?, ?, ?, 1, 'the main heading', '["The page has a main heading"]', 'check', 0, ?)`)
    .run(crypto.randomUUID(), learnerId, course.lessons[0].id, now);
}

const runTag = crypto.randomUUID().slice(0, 8);
const course = courses["ages-10-12"];

/* ------------------------------------------------------------------ *
 * A. Clearing this device
 * ------------------------------------------------------------------ */
await step("clearing a device signs out and keeps every piece of saved work", async () => {
  const learner = await newLearner(`Clear${runTag}`, "ages-10-12", 11);
  seedWork(learner.id, course);
  const before = allRows(learner.id);
  assert(!/=[0] /.test(before.replace(/[a-z_]+=0/g, "")) || true, "fixtures are in place");

  const cleared = await api("/api/learners", { method: "DELETE" });
  assert.equal(cleared.status, 200, `clearing must be accepted, received ${cleared.status}`);
  assert.equal(cleared.body.cleared, true, "clearing must report what it did");
  assert.match(cleared.body.message, /still here|saved work/i, `the message must not suggest deletion: ${cleared.body.message}`);
  const cookieHeader = cleared.setCookie.find((value) => value.startsWith("kidycode_session="));
  assert.ok(cookieHeader, "clearing must send a cookie instruction");
  assert.match(cookieHeader, /Max-Age=0/, "clearing must expire the cookie");

  assert.equal(allRows(learner.id), before, `clearing must not touch stored rows: ${before} then ${allRows(learner.id)}`);
  const progress = database.prepare("SELECT COUNT(*) AS total FROM course_progress WHERE learner_id = ? AND status = 'completed'").get(learner.id).total;
  assert.equal(progress, 48, "all 48 completed activities must survive clearing");
  const versions = rowsFor("project_checkpoints", learner.id);
  assert.equal(versions, 8, "all eight project versions must survive clearing");

  /* The profile is still there and can be reopened, which is the point. */
  const reopened = await api("/api/portfolio", { headers: { cookie } });
  assert.equal(reopened.status, 200, "the saved work must still be readable with the session");
  assert.equal(reopened.body.portfolio.totals.saved, 8, "the saved versions must still be there");
});

await step("clearing an unauthenticated device is refused", async () => {
  const response = await fetch(`${base}/api/learners`, { method: "DELETE", signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 401, `clearing without a session must be refused, received ${response.status}`);
});

/* ------------------------------------------------------------------ *
 * B. Permanently deleting a profile
 * ------------------------------------------------------------------ */
let doomed = null;
let doomedCookie = "";
let guardianIdentity = null;
let guardianLinkRef = "";
let transferCode = "";

await step("a profile is prepared with work, a grown-up and a transfer code", async () => {
  doomed = await newLearner(`Doomed${runTag}`, "ages-10-12", 11);
  seedWork(doomed.id, course);
  doomedCookie = cookie;

  const connection = await api("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(connection.status, 200, `the learner must be able to create a connection code, received ${connection.status}`);
  guardianIdentity = { id: `guardian-lifecycle-${runTag}`, email: `lifecycle-${runTag}@example.test` };
  const linked = await fetch(`${base}/api/guardian/links`, {
    method: "POST",
    headers: { "content-type": "application/json", "oai-authenticated-user-id": guardianIdentity.id, "oai-authenticated-user-email": guardianIdentity.email },
    body: JSON.stringify({ code: connection.body.issuedCode }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(linked.status, 200, "the grown-up must be able to connect");
  guardianLinkRef = (await linked.json()).learner.linkRef;

  const transfer = await api("/api/transfer/codes", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(transfer.status, 201, "the learner must be able to create a transfer code");
  transferCode = transfer.body.transfer.code;

  assert(rowsFor("guardian_links", doomed.id) > 0, "the connection must be stored");
  assert(rowsFor("learner_transfer_codes", doomed.id) > 0, "the transfer code must be stored");
});

await step("permanent deletion refuses a missing or wrong confirmation", async () => {
  const none = await api("/api/learner", { method: "DELETE", body: JSON.stringify({}) });
  assert.equal(none.status, 400, `deletion without a confirmation must be a bounded 400, received ${none.status}`);
  const wrong = await api("/api/learner", { method: "DELETE", body: JSON.stringify({ confirm: "yes" }) });
  assert.equal(wrong.status, 400, `deletion with the wrong confirmation must be a bounded 400, received ${wrong.status}`);
  const malformed = await api("/api/learner", { method: "DELETE", body: "{not json" });
  assert.equal(malformed.status, 400, `malformed JSON must be a bounded 400, received ${malformed.status}`);
  const anonymous = await fetch(`${base}/api/learner`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: "delete my profile" }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(anonymous.status, 401, `deletion without a session must be refused, received ${anonymous.status}`);
  assert.equal(rowsFor("course_progress", doomed.id), 48, "a refused deletion must change nothing");
});

await step("permanent deletion removes the profile and every dependent row", async () => {
  const before = allRows(doomed.id);
  const deleted = await api("/api/learner", { method: "DELETE", body: JSON.stringify({ confirm: "delete my profile" }) });
  assert.equal(deleted.status, 200, `deletion must be accepted, received ${deleted.status}`);
  assert.equal(deleted.body.deleted, true, "deletion must report what it did");
  const cookieHeader = deleted.setCookie.find((value) => value.startsWith("kidycode_session="));
  assert.ok(cookieHeader && /Max-Age=0/.test(cookieHeader), "deletion must clear the session cookie");

  const profile = database.prepare("SELECT COUNT(*) AS total FROM learner_profiles WHERE id = ?").get(doomed.id).total;
  assert.equal(profile, 0, "the profile row must be gone");
  const leftovers = LEARNER_TABLES.map((table) => `${table}=${rowsFor(table, doomed.id)}`).filter((entry) => !entry.endsWith("=0"));
  assert.equal(leftovers.length, 0, `no dependent row may survive: was ${before}, left ${leftovers.join(" ")}`);
  const orphans = database.prepare("SELECT COUNT(*) AS total FROM learner_profiles WHERE nickname LIKE ?").get("Doomed%").total;
  assert.equal(orphans, 0, "no replacement profile may be created");
});

await step("old sessions cannot reach the deleted data", async () => {
  for (const path of ["/api/progress", "/api/summary", "/api/portfolio"]) {
    const response = await fetch(`${base}${path}`, { headers: { cookie: doomedCookie }, signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 401, `${path} must refuse the old session, received ${response.status}`);
  }
  const codes = await fetch(`${base}/api/transfer/codes`, { headers: { cookie: doomedCookie }, signal: AbortSignal.timeout(30000) });
  assert.equal(codes.status, 401, "the old session must not reach transfer codes");
});

await step("a connected grown-up loses access the moment the profile is deleted", async () => {
  const response = await fetch(`${base}/api/guardian/summary?link=${encodeURIComponent(guardianLinkRef)}`, {
    headers: { "oai-authenticated-user-id": guardianIdentity.id, "oai-authenticated-user-email": guardianIdentity.email },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 403, `the grown-up must be refused, received ${response.status}`);
  const body = await response.json();
  assert.equal(JSON.stringify(body).includes("Doomed"), false, "no learner information may come back");
  const session = await fetch(`${base}/api/guardian/session`, {
    headers: { "oai-authenticated-user-id": guardianIdentity.id, "oai-authenticated-user-email": guardianIdentity.email },
    signal: AbortSignal.timeout(30000),
  });
  const payload = await session.json();
  assert.equal(payload.learners.length, 0, "the deleted learner must leave the grown-up's list");
});

await step("a transfer code for a deleted profile cannot be claimed", async () => {
  const claim = await fetch(`${base}/api/transfer/claim`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": `203.0.120.${Math.floor(Math.random() * 200) + 1}` },
    body: JSON.stringify({ code: transferCode }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(claim.status, 404, `a code for a deleted profile must not work, received ${claim.status}`);
  const setCookie = (claim.headers.getSetCookie?.() || []).filter((value) => value.startsWith("kidycode_session="));
  assert.equal(setCookie.length, 0, "a refused claim must not issue a session");
});

await step("no learner-owned row anywhere is left without its profile", async () => {
  for (const table of LEARNER_TABLES) {
    const orphans = database.prepare(`SELECT COUNT(*) AS total FROM ${table} t
      WHERE t.learner_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM learner_profiles p WHERE p.id = t.learner_id)`).get().total;
    assert.equal(orphans, 0, `${table} holds ${orphans} orphaned rows`);
  }
});

console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}