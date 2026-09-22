/*
 * Assessment V2 over the real API, against a real local database.
 *
 * Covers what a unit test cannot: the authenticated learner path, ownership between two
 * learners, bounded rejection of malformed input, the fail-closed answer while content
 * is still being reviewed, the coarse signals being counts and nothing else, the exact
 * submission statement being idempotent, and permanent deletion leaving no assessment
 * row or orphan behind.
 *
 *   KIDYCODE_E2E_URL=http://localhost:3001 node --import tsx --no-warnings scripts/e2e-assessment-api.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(import.meta.dirname, "..");
const candidates = [process.env.KIDYCODE_E2E_URL, "http://localhost:3001", "http://localhost:4321", "http://localhost:3000"].filter(Boolean);
const passed = [];
const failed = [];

function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}

async function step(name, run) {
  try {
    await run();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n").slice(0, 4).join(" | ")}`);
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
console.log(`Checking Assessment V2 against ${base}`);

/* The six assessment tables, children first. */
const ASSESSMENT_TABLES = [
  "assessment_item_results",
  "assessment_signals",
  "assessment_defence",
  "assessment_credentials",
  "assessment_revision_items",
  "assessment_attempts",
];

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
  return { status: response.status, body, text, setCookie };
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
  assert.ok(session, `learner creation for ${nickname} did not return a session`);
  cookie = session.split(";")[0];
  const created = await response.json();
  return { id: created.learner?.id || created.id, cookie };
}

function stamp() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/* The nickname rule is two to twenty letters, digits, spaces, underscores or hyphens. */
function kidName(prefix) {
  return `${prefix}${Date.now() % 1000000}${Math.floor(Math.random() * 1000)}`;
}

/* The first module of the ages 10 to 12 course, taken from the real catalogue rather
 * than written out, so the fixture cannot drift from the course. */
import { courses } from "../lib/course-catalog.ts";
const moduleId = courses["ages-10-12"].stages[0].id;

/* ------------------------------------------------------------- unauthenticated -- */

await step("every assessment route refuses an unauthenticated request", async () => {
  const saved = cookie;
  cookie = "";
  const responses = await Promise.all([
    api("/api/assessment/state"),
    api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "final" }) }),
    api("/api/assessment/submit", { method: "POST", body: JSON.stringify({ attemptId: "abcdef123456", answers: [] }) }),
    api("/api/assessment/autosave", { method: "POST", body: JSON.stringify({ attemptId: "abcdef123456" }) }),
    api("/api/assessment/signals", { method: "POST", body: JSON.stringify({ attemptId: "abcdef123456" }) }),
  ]);
  cookie = saved;
  for (const response of responses) {
    assert.equal(response.status, 401, `expected 401, received ${response.status}`);
  }
});

/* ---------------------------------------------------------------- input bounds -- */

const owner = await newLearner(kidName("Owner"), "ages-10-12", 11);
const other = await newLearner(kidName("Other"), "ages-10-12", 12);
const learnerOne = owner.id;
const ownerCookie = owner.cookie;
const otherCookie = other.cookie;

await step("malformed, oversized and wrongly typed bodies are refused with a bounded 400", async () => {
  cookie = ownerCookie;
  const cases = [
    ["/api/assessment/start", "{"],
    ["/api/assessment/start", JSON.stringify({ kind: "everything" })],
    ["/api/assessment/start", JSON.stringify({ kind: "module", moduleId: "ages-13-15-forms" })],
    ["/api/assessment/start", JSON.stringify({ kind: "module" })],
    ["/api/assessment/start", JSON.stringify({ kind: "module", moduleId: "x".repeat(400) })],
    ["/api/assessment/autosave", JSON.stringify({ attemptId: "abcdef123456", answers: Array(40).fill(0) })],
    ["/api/assessment/autosave", JSON.stringify({ attemptId: "abcdef123456", answers: ["a", {}, null] })],
    ["/api/assessment/autosave", JSON.stringify({ attemptId: "no" })],
    ["/api/assessment/submit", JSON.stringify({ attemptId: "abcdef123456", answers: "all of them" })],
    ["/api/assessment/submit", JSON.stringify({ attemptId: "abcdef123456", answers: Array(30).fill(1) })],
    ["/api/assessment/signals", JSON.stringify({ attemptId: "abcdef123456", visibilityChanges: -5 })],
    ["/api/assessment/signals", JSON.stringify({ attemptId: "abcdef123456", largestPasteChars: 999999 })],
  ];
  for (const [path, body] of cases) {
    const response = await api(path, { method: "POST", body });
    assert.equal(response.status, 400, `${path} with ${body.slice(0, 40)} answered ${response.status}`);
    assert.equal(typeof response.body.error, "string", `${path} must explain the refusal`);
  }
  const longId = await api(`/api/assessment/state?attempt=${"z".repeat(300)}`);
  assert.equal(longId.status, 400, `an oversized attempt id answered ${longId.status}`);
  const badQuery = await api("/api/assessment/state?kind=whatever");
  assert.equal(badQuery.status, 400, `an unknown kind answered ${badQuery.status}`);
});

await step("a request never becomes a server error", async () => {
  const responses = await Promise.all([
    api("/api/assessment/start", { method: "POST", body: "null" }),
    api("/api/assessment/submit", { method: "POST", body: "[]" }),
    api("/api/assessment/autosave", { method: "POST", body: "\"text\"" }),
  ]);
  for (const response of responses) {
    assert.ok(response.status < 500, `a malformed body produced ${response.status}`);
  }
});

/* ------------------------------------------------------------- fail closed ----- */

await step("a course whose content is still being reviewed serves no assessment", async () => {
  const response = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
  assert.equal(response.status, 503, `expected 503 while content is unreviewed, received ${response.status}`);
  assert.deepEqual(Object.keys(response.body), ["error"], "only an explanation may be returned");
  assert.ok(!/answer|explanation|option/i.test(JSON.stringify(response.body)), "no assessment material may leak");
});

/* --------------------------------------------------------------- ownership ----- */

const attemptId = crypto.randomUUID();
const now = new Date().toISOString();
database.prepare(`INSERT INTO assessment_attempts
  (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
   answers_json, code_json, knowledge_total, practical_total, debug_total, build_total, total_available,
   started_at, saved_at)
  VALUES (?, ?, 'ages-10-12', 'module', ?, 'fixture-form-1', 'assessment-v2.1', 'in_progress', 'knowledge', '{"answers":[0]}',
   '[]', '{}', 5, 5, 0, 0, 10, ?, ?)`)
  .run(attemptId, learnerOne, moduleId, now, now);

await step("a learner reaches their own attempt and a second learner cannot", async () => {
  cookie = ownerCookie;
  const mine = await api(`/api/assessment/state?attempt=${attemptId}`);
  assert.equal(mine.status, 503, `the owner should reach the content gate, received ${mine.status}`);

  cookie = otherCookie;
  const foreign = await api(`/api/assessment/state?attempt=${attemptId}`);
  assert.equal(foreign.status, 404, `another learner answered ${foreign.status}, not 404`);
  const submit = await api("/api/assessment/submit", { method: "POST", body: JSON.stringify({ attemptId, answers: [0, 0, 0, 0, 0] }) });
  assert.equal(submit.status, 404, `another learner could submit (${submit.status})`);
  const autosave = await api("/api/assessment/autosave", { method: "POST", body: JSON.stringify({ attemptId, answers: [1] }) });
  assert.equal(autosave.status, 404, `another learner could autosave (${autosave.status})`);
  const signals = await api("/api/assessment/signals", { method: "POST", body: JSON.stringify({ attemptId, pasteEvents: 5 }) });
  assert.equal(signals.status, 404, `another learner could write signals (${signals.status})`);
  const start = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
  /* With content still under review the content gate answers first, so fail-closed comes
   * before the per-module completion gate. */
  assert.equal(start.status, 503, `an unreviewed course must fail closed first (${start.status})`);
});

await step("a refused write leaves no cross-learner row behind", async () => {
  const signals = database.prepare("SELECT COUNT(*) AS total FROM assessment_signals WHERE attempt_id = ?").get(attemptId).total;
  assert.equal(signals, 0, "no signal row may be written for a foreign attempt");
  const draft = database.prepare("SELECT draft_json AS draft FROM assessment_attempts WHERE id = ?").get(attemptId).draft;
  assert.equal(draft, '{"answers":[0]}', "a foreign autosave must not change the owner's draft");
});

await step("a submission cannot carry its own score, pass status or course", async () => {
  cookie = ownerCookie;
  const response = await api("/api/assessment/submit", {
    method: "POST",
    body: JSON.stringify({
      attemptId,
      answers: [0, 0, 0, 0, 0],
      score: 10,
      passed: true,
      outcome: "passed",
      marks: 10,
      formId: "fixture-form-2",
      courseId: "ages-16-18",
      learnerId: "somebody-else",
      awarded: 100,
    }),
  });
  assert.equal(response.status, 503, `the owner's own attempt reaches the content gate (${response.status})`);
  const body = JSON.stringify(response.body);
  assert.ok(!/"passed"\s*:\s*true/.test(body), "a client-supplied pass status may never be echoed");
  assert.ok(!body.includes("somebody-else"), "a client-supplied learner id may never be echoed");
  const stored = database.prepare("SELECT status AS status, total_awarded AS awarded FROM assessment_attempts WHERE id = ?").get(attemptId);
  assert.equal(stored.status, "in_progress", "the attempt must still be open");
  assert.equal(stored.awarded, 0, "no client-supplied mark may be stored");
});

/* ----------------------------------------------------------------- signals ----- */

await step("the signals are counts and timestamps, never content", async () => {
  const columns = database.prepare("PRAGMA table_info(assessment_signals)").all().map((row) => row.name);
  assert.deepEqual(columns, [
    "attempt_id",
    "learner_id",
    "visibility_changes",
    "paste_events",
    "largest_paste_chars",
    "save_count",
    "first_saved_at",
    "last_saved_at",
    "created_at",
    "updated_at",
  ], "the signal table must hold counts and times only");
  for (const banned of ["content", "text", "clipboard", "keystroke", "answer", "code"]) {
    assert.ok(!columns.some((name) => name.includes(banned)), `a signal column must not hold ${banned}`);
  }
});

await step("a learner's own signal counts are recorded and bounded", async () => {
  const response = await api("/api/assessment/signals", {
    method: "POST",
    body: JSON.stringify({ attemptId, visibilityChanges: 3, pasteEvents: 2, largestPasteChars: 140 }),
  });
  assert.equal(response.status, 200);
  const row = database.prepare("SELECT visibility_changes AS v, paste_events AS p, largest_paste_chars AS l FROM assessment_signals WHERE attempt_id = ?").get(attemptId);
  assert.deepEqual({ v: row.v, p: row.p, l: row.l }, { v: 3, p: 2, l: 140 });
  const second = await api("/api/assessment/signals", { method: "POST", body: JSON.stringify({ attemptId, pasteEvents: 1 }) });
  assert.equal(second.status, 200);
  const after = database.prepare("SELECT paste_events AS p, largest_paste_chars AS l FROM assessment_signals WHERE attempt_id = ?").get(attemptId);
  assert.equal(after.p, 3, "counts add up");
  assert.equal(after.l, 140, "the largest paste keeps the largest value");
});

await step("autosave reports the truth for a submitted attempt instead of pretending", async () => {
  database.prepare("UPDATE assessment_attempts SET status = 'submitted', submitted_at = ? WHERE id = ?").run(now, attemptId);
  const response = await api("/api/assessment/autosave", { method: "POST", body: JSON.stringify({ attemptId, answers: [1, 1, 1, 1, 1] }) });
  assert.equal(response.status, 200);
  assert.equal(response.body.saved, false, "a submitted attempt must not accept a late save");
  const row = database.prepare("SELECT draft_json AS draft, answers_json AS answers FROM assessment_attempts WHERE id = ?").get(attemptId);
  assert.equal(row.draft, '{"answers":[0]}', "the draft must be untouched");
  assert.equal(row.answers, "[]", "the submitted answers must be untouched");
});

/* ------------------------------------------------------------- idempotency ----- */

await step("the submission statement is idempotent and owned", async () => {
  const second = crypto.randomUUID();
  database.prepare(`INSERT INTO assessment_attempts
    (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
     answers_json, code_json, knowledge_total, practical_total, debug_total, build_total, total_available,
     started_at, saved_at)
    VALUES (?, ?, 'ages-10-12', 'module', ?, 'fixture-form-2', 'assessment-v2.1', 'in_progress', 'knowledge', '{}',
     '[]', '{}', 5, 5, 0, 0, 10, ?, ?)`)
    .run(second, learnerOne, moduleId, now, now);

  /* The exact conditional update the route runs, executed twice against the real
   * store, proves a repeat cannot award the marks twice. */
  const statement = database.prepare(`UPDATE assessment_attempts SET status = 'submitted', total_awarded = ?, outcome = ?
    WHERE id = ? AND learner_id = ? AND status = 'in_progress'`);
  const first = statement.run(8, "passed", second, learnerOne);
  const repeat = statement.run(8, "passed", second, learnerOne);
  assert.equal(first.changes, 1, "the first submission must win the attempt");
  assert.equal(repeat.changes, 0, "a repeat submission must change nothing");
  const foreign = statement.run(10, "passed", second, other.id);
  assert.equal(foreign.changes, 0, "another learner's submission must match no row");
  const stored = database.prepare("SELECT total_awarded AS awarded, outcome FROM assessment_attempts WHERE id = ?").get(second);
  assert.equal(stored.awarded, 8, "the mark must not move");
  assert.equal(stored.outcome, "passed", "the outcome must not change");
});

/* ------------------------------------------------------------------ deletion --- */

await step("permanent deletion removes every assessment row and leaves no orphan", async () => {
  const credentialId = `cred-${stamp()}`;
  database.prepare(`INSERT INTO assessment_item_results
    (attempt_id, learner_id, item_id, requirement_id, form_id, content_version, item_type, concept, status, awarded, available, mandatory, detail, created_at)
    VALUES (?, ?, 'item-1', 'req-1', 'fixture-form-1', 'assessment-v2.1', 'practical', 'concept-1', 'met', 1, 1, NULL, 'ok', ?)`)
    .run(attemptId, learnerOne, now);
  database.prepare(`INSERT INTO assessment_defence
    (attempt_id, learner_id, course_id, template_id, explain_item_id, predict_item_id, predict_expected, change_item_id, change_prompt, created_at, updated_at)
    VALUES (?, ?, 'ages-10-12', 'template-1', 'e1', 'p1', '2', 'c1', 'Add one item', ?, ?)`)
    .run(attemptId, learnerOne, now, now);
  database.prepare(`INSERT INTO assessment_credentials
    (id, learner_id, course_id, level, certificate_name, project_title, skills_json, attempt_id, issued_at)
    VALUES (?, ?, 'ages-10-12', 'Web Creator', 'KidyCode Applied Web Skills Certificate', 'The Origami Club', '[]', ?, ?)`)
    .run(credentialId, learnerOne, attemptId, now);
  database.prepare(`INSERT INTO assessment_revision_items
    (learner_id, course_id, concept, label, lesson_id, source_attempt_id, source_kind, mandatory, created_at, updated_at)
    VALUES (?, 'ages-10-12', 'concept-1', 'Use one h1', 'ages-10-12-structure-headings', ?, 'module', NULL, ?, ?)`)
    .run(learnerOne, attemptId, now, now);

  const before = ASSESSMENT_TABLES.map((table) =>
    database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id = ?`).get(learnerOne).total);
  assert.ok(before.every((count) => count > 0), `every assessment table must hold a row before deletion: ${before.join(",")}`);

  /* The owner deletes their own profile through the real route. */
  cookie = ownerCookie;
  const response = await api("/api/learner", { method: "DELETE", body: JSON.stringify({ confirm: "delete my profile" }) });
  assert.equal(response.status, 200, `deletion answered ${response.status}`);
  assert.equal(response.body.deleted, true);

  for (const table of ASSESSMENT_TABLES) {
    const owned = database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id = ?`).get(learnerOne).total;
    assert.equal(owned, 0, `${table} still holds ${owned} rows for the deleted learner`);
    const orphaned = database
      .prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id NOT IN (SELECT id FROM learner_profiles)`)
      .get().total;
    assert.equal(orphaned, 0, `${table} holds ${orphaned} rows for a learner that no longer exists`);
  }
  const profile = database.prepare("SELECT COUNT(*) AS total FROM learner_profiles WHERE id = ?").get(learnerOne).total;
  assert.equal(profile, 0, "the profile itself must be gone");
});

await step("the deleted learner's session no longer reaches an attempt", async () => {
  cookie = ownerCookie;
  const response = await api(`/api/assessment/state?attempt=${attemptId}`);
  assert.equal(response.status, 401, `a deleted learner answered ${response.status}`);
  const orphaned = database
    .prepare("SELECT COUNT(*) AS total FROM assessment_item_results WHERE attempt_id NOT IN (SELECT id FROM assessment_attempts)")
    .get().total;
  assert.equal(orphaned, 0, "no mark may survive its attempt");
});

console.log(`\nassessment API: ${passed.length} checks passed, ${failed.length} failed`);
if (failed.length > 0) {
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}