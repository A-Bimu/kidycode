/*
 * The Day 3 dry runs: four pathways, one failure and one recovery each, then the
 * boundaries that hold around them.
 *
 * Every pathway is walked the way a learner walks it, through the real routes against a
 * real local server and the real local D1 store:
 *
 *   1. An independent start. The learner opens a module assessment with no revision help,
 *      and the server issues a form of its own choosing.
 *   2. A failed first attempt. The learner submits answers that are deliberately wrong and
 *      the server records the failure, a revision plan and one first action.
 *   3. A changed requirement. The same concept list becomes the condition the learner must
 *      meet before a fresh form opens, so the retake is refused while it is outstanding.
 *   4. A corrected retry. Every listed concept is passed at readiness, the retake opens a
 *      different equivalent form, and the correct answers are submitted from the bank the
 *      server grades against. The second attempt must score above the first and every
 *      knowledge item must be met.
 *
 * Then, once per pathway: the saved work survives a move to another device (a real
 * transfer code claim, with a second claim of the same code refused as already used), and
 * the certificate stays refused because a module assessment is not the final one.
 *
 * Finally the institution boundaries are re-verified end to end: the four pilot roles each
 * see only their own scope, an administrator is refused an enrolment it may not make, and
 * a cohort lead can insert, reiterate, revoke and reactivate the same durable row.
 *
 *   KIDYCODE_E2E_URL=http://localhost:3001 node --import tsx --no-warnings scripts/e2e-dry-runs.mjs
 *
 * This suite writes only local fixtures a learner would have produced (completed
 * activities, saved module versions, the course final check) and learner rows it creates
 * itself. It never writes a mark: every mark in these journeys is written by the server.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { courses } from "../lib/course-catalog.ts";
import { contentFor } from "../lib/assessment/manifest.ts";

const root = resolve(import.meta.dirname, "..");
const base = (process.env.KIDYCODE_E2E_URL || "http://localhost:3001").replace(/\/$/, "");

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

/* A recorder and a runner are deliberately separate: check() can only record a name, so a
 * step body can never be passed to it and silently ignored. */
const passed = [];
const failures = [];
function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}
async function step(name, body) {
  if (typeof body !== "function") throw new TypeError("step() needs a body function.");
  try {
    await body();
    check(name);
  } catch (error) {
    failures.push(`${name}: ${String(error.message).split("\n").slice(0, 3).join(" | ")}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

const probe = await fetch(`${base}/api/progress`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
if (!probe) throw new Error(`No KidyCode server answered on ${base}. Start it before running the dry runs.`);
if (probe.status !== 401) throw new Error(`${base}/api/progress answered ${probe.status} to an anonymous request, so this is not the KidyCode app.`);

const database = new DatabaseSync(locateDatabase());
console.log(`Dry runs against ${base}`);

/* ------------------------------------------------------------------ helpers -- */

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

/* The nickname rule allows two to twenty letters, digits, spaces, underscores or hyphens. */
function kidName(prefix) {
  return `${prefix}${Math.floor(Math.random() * 1e6)}`.slice(0, 20);
}

async function newLearner(prefix, courseId, age) {
  cookie = "";
  const response = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname: kidName(prefix), age, theme: "interest", courseId }),
    signal: AbortSignal.timeout(30000),
  });
  const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
  if (!session) throw new Error(`learner creation for ${prefix} returned no session (${response.status})`);
  cookie = session.split(";")[0];
  const body = await response.json();
  const learner = body.learner || body;
  assert.ok(learner.id, "learner creation returned no id");
  return { id: learner.id, cookie, courseId };
}

/* The state a learner who finished the course would have: every activity completed, one
 * saved project version per module and a passed course final check. These are fixtures of
 * starting state, not marks: no assessment row and no certificate is written here. */
function completeCourse(learnerId, courseId) {
  const course = courses[courseId];
  const now = new Date().toISOString();
  const progress = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, 'Done in the dry run.', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  for (const lesson of course.lessons) progress.run(learnerId, lesson.id, now);
  const checkpoint = database.prepare(`INSERT OR REPLACE INTO project_checkpoints
    (id, learner_id, stage_id, version, reflection, project_json, created_at)
    VALUES (?, ?, ?, 1, 'Saved in the dry run.', ?, ?)`);
  for (const stage of course.stages) {
    checkpoint.run(`${learnerId}-${stage.id}`, learnerId, stage.id, JSON.stringify({ html: "<main><h1>Project</h1></main>", css: "", javascript: "" }), now);
  }
  database.prepare(`INSERT INTO exam_attempts (id, learner_id, score, total, answers_json, practical_json, passed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
    .run(crypto.randomUUID(), learnerId, course.finalExam.length, course.finalExam.length, JSON.stringify({ courseId }), JSON.stringify({}), now);
}

/* The correct option for every knowledge item in a course, read from the reviewed bank the
 * server grades against, so a dry run never guesses an answer key from a response. */
function answerKey(courseId) {
  const content = contentFor(courseId);
  const key = new Map();
  for (const form of [...content.moduleForms, ...content.finalForms]) {
    for (const item of form.knowledge) key.set(item.id, item.answer);
  }
  return key;
}

function starterCode(knowledgeTasks) {
  const code = {};
  for (const task of knowledgeTasks) {
    const files = {};
    for (const [file, text] of Object.entries(task.starterFiles || {})) files[file] = text;
    code[task.itemId] = files;
  }
  return code;
}

/* Readiness is proved the way a learner proves it: the page never carries an answer index,
 * so each option is offered until the server marks the question correct. */
async function solveReadiness(conceptRef, count) {
  const answers = [];
  for (let index = 0; index < count; index += 1) {
    let found = false;
    for (let option = 0; option < 3; option += 1) {
      const response = await api("/api/assessment/revision", {
        method: "POST",
        body: JSON.stringify({ concept: conceptRef, kind: "readiness", answers: [...answers, option] }),
      });
      const graded = response.body.readiness?.[index];
      if (graded?.correct) {
        answers.push(option);
        found = true;
        break;
      }
    }
    if (!found) throw new Error(`no option satisfied readiness question ${index + 1} of ${conceptRef}`);
  }
  return answers;
}

async function passReadiness(conceptRef) {
  const page = await api(`/api/assessment/revision?concept=${encodeURIComponent(conceptRef)}`);
  assert.equal(page.status, 200, `the revision page for ${conceptRef} answered ${page.status}`);
  const answers = await solveReadiness(conceptRef, page.body.pack.readiness.length);
  const marked = await api("/api/assessment/revision", {
    method: "POST",
    body: JSON.stringify({ concept: conceptRef, kind: "readiness", answers }),
  });
  assert.equal(marked.body.passed, true, `${conceptRef} did not pass its readiness check`);
}

function attemptRows(learnerId) {
  return database
    .prepare("SELECT id, kind, form_id AS formId, status, total_awarded AS awarded, total_available AS available, outcome FROM assessment_attempts WHERE learner_id = ? ORDER BY started_at")
    .all(learnerId);
}

/* ------------------------------------------------------- the four pathways --- */

const pathways = [
  { courseId: "ages-10-12", age: 11, label: "Ages 10 to 12" },
  { courseId: "ages-13-15", age: 14, label: "Ages 13 to 15" },
  { courseId: "ages-16-18", age: 17, label: "Ages 16 to 18" },
  { courseId: "adults", age: 19, label: "Adults" },
];

for (const pathway of pathways) {
  const { courseId, age, label } = pathway;
  const course = courses[courseId];
  const moduleId = course.stages[0].id;
  const key = answerKey(courseId);

  let learner = null;
  let firstAttempt = null;
  let pending = [];
  let retry = null;

  await step(`${label}: an independent start opens a module form with no help`, async () => {
    learner = await newLearner("DryRun", courseId, age);
    completeCourse(learner.id, courseId);
    const started = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
    assert.equal(started.status, 200, `start answered ${started.status}: ${JSON.stringify(started.body).slice(0, 160)}`);
    assert.equal(started.body.resumed, false, "a first start must not resume an attempt");
    assert.equal(started.body.attempt.kind, "module", "the start must open a module attempt");
    assert.ok(started.body.attempt.knowledge.length > 0, "the form carries no questions");
    assert.ok(started.body.attempt.practical, "the form carries no practical task");
    assert.ok(!JSON.stringify(started.body.attempt).includes("\"answer\""), "the start leaked an answer key");
    firstAttempt = { id: started.body.attempt.attemptId, variant: started.body.attempt.formVariant, tasks: started.body.attempt };
  });

  await step(`${label}: a failed first attempt is recorded with a revision plan and one next action`, async () => {
    const items = firstAttempt.tasks.knowledge;
    /* Every option chosen is one step away from the right one, so the failure is real and
     * is not an artefact of an empty submission. */
    const wrong = items.map((item) => {
      const right = key.get(item.itemId);
      assert.equal(typeof right, "number", `no reviewed answer for ${item.itemId}`);
      return (right + 1) % 3;
    });
    const submitted = await api("/api/assessment/submit", {
      method: "POST",
      body: JSON.stringify({
        attemptId: firstAttempt.id,
        answers: wrong,
        code: { [firstAttempt.tasks.practical.itemId]: starterCode([firstAttempt.tasks.practical])[firstAttempt.tasks.practical.itemId] },
      }),
    });
    assert.equal(submitted.status, 200, `submit answered ${submitted.status}: ${JSON.stringify(submitted.body).slice(0, 160)}`);
    assert.equal(submitted.body.attempt.outcome, "not_passed_yet", `a wrong first attempt was marked ${submitted.body.attempt.outcome}`);
    assert.ok(submitted.body.revision.length > 0, "a failed attempt produced no revision plan");
    assert.ok(submitted.body.firstAction && submitted.body.firstAction.concept, "a failed attempt produced no first action");
    assert.ok(submitted.body.corrections.every((entry) => entry.correct === false), "a deliberately wrong answer was marked correct");
    const stored = attemptRows(learner.id).find((row) => row.id === firstAttempt.id);
    assert.equal(stored.status, "submitted", "the attempt was not stored as submitted");
    pending = submitted.body.revision.map((entry) => entry.concept);
  });

  await step(`${label}: the changed requirement blocks a fresh form until every concept is ready`, async () => {
    const blocked = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
    assert.equal(blocked.status, 409, `the retake gate answered ${blocked.status} with ${pending.length} concepts outstanding`);
    assert.ok(Array.isArray(blocked.body.revision), "the refusal listed no outstanding concept");
    assert.ok(blocked.body.revision.length > 0, "the refusal listed an empty plan");
  });

  await step(`${label}: meeting every listed concept opens a different equivalent form`, async () => {
    for (const conceptRef of pending) await passReadiness(conceptRef);
    const retaken = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
    assert.equal(retaken.status, 200, `the retake answered ${retaken.status} after every concept was ready`);
    assert.equal(retaken.body.resumed, false, "the retake resumed the failed attempt");
    assert.notEqual(retaken.body.attempt.formVariant, firstAttempt.variant, "the retake repeated the failed form");
    retry = { id: retaken.body.attempt.attemptId, variant: retaken.body.attempt.formVariant, tasks: retaken.body.attempt };
  });

  await step(`${label}: the corrected retry is graded on the server and scores above the failure`, async () => {
    const answers = retry.tasks.knowledge.map((item) => {
      const right = key.get(item.itemId);
      assert.equal(typeof right, "number", `no reviewed answer for ${item.itemId}`);
      return right;
    });
    const submitted = await api("/api/assessment/submit", {
      method: "POST",
      body: JSON.stringify({
        attemptId: retry.id,
        answers,
        code: { [retry.tasks.practical.itemId]: starterCode([retry.tasks.practical])[retry.tasks.practical.itemId] },
      }),
    });
    assert.equal(submitted.status, 200, `the corrected retry answered ${submitted.status}: ${JSON.stringify(submitted.body).slice(0, 160)}`);
    assert.ok(submitted.body.corrections.every((entry) => entry.correct === true), "a correct answer was not marked correct");

    const rows = attemptRows(learner.id);
    const first = rows.find((row) => row.id === firstAttempt.id);
    const second = rows.find((row) => row.id === retry.id);
    assert.ok(second.awarded > first.awarded, `the retry scored ${second.awarded}, not above the failure's ${first.awarded}`);
    assert.ok(second.awarded > 0, "the retry scored nothing");
    assert.equal(second.status, "submitted", "the retry was not stored as submitted");
  });

  await step(`${label}: the saved work survives a device transfer, and the code cannot be replayed`, async () => {
    const issued = await api("/api/transfer/codes", { method: "POST", body: JSON.stringify({ action: "generate" }) });
    assert.equal(issued.status, 201, `code issue answered ${issued.status}`);
    const code = issued.body.transfer.code;
    assert.match(code, /^[0-9A-Z-]+$/, `the issued code is not a code: ${code}`);

    /* A new device has no cookie at all, which is the point of the transfer. */
    cookie = "";
    const claim = await fetch(`${base}/api/transfer/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": `203.0.121.${Math.floor(Math.random() * 200) + 1}` },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(claim.status, 200, `the claim answered ${claim.status}`);
    const session = (claim.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
    assert.ok(session, "a successful claim issued no session");
    cookie = session.split(";")[0];

    const state = await api(`/api/assessment/state?attempt=${retry.id}`);
    assert.equal(state.status, 200, `the moved session answered ${state.status} for its own attempt`);
    assert.equal(state.body.attempt.attemptId, retry.id, "the moved session reached a different attempt");
    const progress = await api("/api/progress");
    assert.equal(progress.status, 200, `progress answered ${progress.status} after the transfer`);
    assert.equal(progress.body.progress.filter((entry) => entry.status === "completed").length, course.lessons.length, "the moved session lost saved activity");

    const replay = await fetch(`${base}/api/transfer/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": `203.0.122.${Math.floor(Math.random() * 200) + 1}` },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(replay.status, 410, `a replayed code answered ${replay.status}, not a one-time refusal`);
    const replayBody = await replay.json();
    assert.match(replayBody.error, /already been used/i, `the replay refusal said: ${replayBody.error}`);
  });

  await step(`${label}: a module pass does not make the certificate eligible`, async () => {
    const read = await api("/api/certification");
    assert.equal(read.status, 200, `certification read answered ${read.status}`);
    assert.equal(read.body.certification.status, "ready", `the course is complete, so the status was ${read.body.certification.status}`);
    assert.equal(read.body.certification.eligible, false, "a module assessment made the certificate eligible");
    assert.deepEqual(
      read.body.certification.missing.map((gate) => gate.id),
      ["assessment", "build", "mandatory", "defence"],
      "the missing conditions are not the final assessment, the independent build, the required checks and the defence",
    );
    const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
    assert.equal(issue.status, 403, `a certificate was issued without the final assessment (${issue.status})`);
    const credentials = database.prepare("SELECT COUNT(*) AS total FROM assessment_credentials WHERE learner_id = ?").get(learner.id).total;
    assert.equal(credentials, 0, "a certificate row was written for an ineligible learner");
  });
}

/* ------------------------------------------------------ institution roles --- */

const identities = {
  admin: { id: "p-admin", email: "admin@school.test" },
  lead: { id: "p-lead", email: "lead@school.test" },
  reviewer: { id: "p-review", email: "review@school.test" },
  outsider: { id: "p-outsider", email: "out@elsewhere.test" },
};

function identityHeaders(identity) {
  return { "oai-authenticated-user-id": identity.id, "oai-authenticated-user-email": identity.email };
}

async function workspaceFor(who, query = "") {
  cookie = "";
  const response = await fetch(`${base}/api/institution/workspace${query}`, {
    headers: identityHeaders(identities[who]),
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

await step("the pilot institution is seeded locally before the role checks", async () => {
  const output = execFileSync(process.execPath, ["--no-warnings", resolve(root, "scripts/seed-local-pilot.mjs")], { encoding: "utf8" });
  assert.match(output, /seeded the local pilot institution/, `the local pilot seed did not report success: ${output.slice(-200)}`);
});

await step("the workspace refuses an identity that is not signed in", async () => {
  const anonymous = await fetch(`${base}/api/institution/workspace`, { signal: AbortSignal.timeout(30000) });
  assert.equal(anonymous.status, 401, `an anonymous workspace request answered ${anonymous.status}`);
});

await step("each pilot role reaches its own scope and never another organisation", async () => {
  const admin = await workspaceFor("admin");
  assert.equal(admin.status, 200, `the administrator answered ${admin.status}`);
  assert.equal(admin.body.workspace.organisation.id, "org-home", "the administrator reached the wrong organisation");
  assert.equal(admin.body.workspace.audience, "organisation", "the administrator was scoped below the organisation");
  assert.ok(admin.body.workspace.hidden.includes("learner identities"), "the administrator was not told learner identities are hidden from them");

  const lead = await workspaceFor("lead");
  assert.equal(lead.status, 200, `the cohort lead answered ${lead.status}`);
  assert.equal(lead.body.workspace.audience, "cohort", "the cohort lead was scoped to the whole organisation");
  assert.equal(lead.body.workspace.readOnly, false, "the cohort lead was reported as read-only");
  assert.ok(lead.body.workspace.capabilities.mayAct.includes("enrol_learner"), "the cohort lead may not enrol a learner");

  const reviewer = await workspaceFor("reviewer");
  assert.equal(reviewer.status, 200, `the reviewer answered ${reviewer.status}`);
  for (const denied of ["learner identities", "learner code"]) {
    assert.ok(reviewer.body.workspace.hidden.includes(denied), `the reviewer was not denied ${denied}`);
  }
  const rosterText = JSON.stringify(reviewer.body.workspace.cohorts);
  assert.ok(!/Sky|River|Wren/.test(rosterText), "a reviewer read a learner name");

  const outsider = await workspaceFor("outsider");
  assert.equal(outsider.status, 200, `the second organisation's administrator answered ${outsider.status}`);
  assert.equal(outsider.body.workspace.organisation.id, "org-other", "the outsider reached the first organisation");
  assert.ok(!JSON.stringify(outsider.body.workspace).includes("cohort-a"), "the outsider reached the first organisation's cohort");

  const crossed = await workspaceFor("lead", "?organisation=org-other");
  assert.equal(crossed.status, 403, `naming another organisation answered ${crossed.status}, not a refusal`);
});

await step("a role may not act beyond its scope, and a lead keeps one durable enrolment row", async () => {
  cookie = "";
  const refused = await fetch(`${base}/api/institution/enrolment`, {
    method: "POST",
    headers: { "content-type": "application/json", ...identityHeaders(identities.admin) },
    body: JSON.stringify({ organisationId: "org-home", cohortId: "cohort-a", learnerId: "seed-learner-3", wanted: "active" }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(refused.status, 403, `an administrator enrolled a learner (${refused.status})`);

  const enrol = async (learnerId, wanted) => {
    const response = await fetch(`${base}/api/institution/enrolment`, {
      method: "POST",
      headers: { "content-type": "application/json", ...identityHeaders(identities.lead) },
      body: JSON.stringify({ organisationId: "org-home", cohortId: "cohort-a", learnerId, wanted }),
      signal: AbortSignal.timeout(30000),
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  };

  const learnerId = `dry-run-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  database.prepare(`INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, course_id, created_at, last_seen_at)
    VALUES (?, ?, 'DryRunGuest', 12, 'interest', 'ages-10-12', ?, ?)`).run(learnerId, `hash-${learnerId}`, now, now);

  const inserted = await enrol(learnerId, "active");
  assert.equal(inserted.body.plan.action, "insert", `the first enrolment was ${inserted.body.plan.action}`);
  const repeated = await enrol(learnerId, "active");
  assert.equal(repeated.body.plan.action, "no-op", `a repeated enrolment was ${repeated.body.plan.action}`);
  const revoked = await enrol(learnerId, "revoked");
  assert.equal(revoked.body.plan.action, "revoke", `the revoke was ${revoked.body.plan.action}`);
  const reactivated = await enrol(learnerId, "active");
  assert.equal(reactivated.body.plan.action, "reactivate", `the re-enrolment was ${reactivated.body.plan.action}`);

  const rows = database.prepare("SELECT status FROM cohort_enrolments WHERE cohort_id = 'cohort-a' AND learner_id = ?").all(learnerId);
  assert.equal(rows.length, 1, `the enrolments left ${rows.length} rows instead of one durable row`);
  assert.equal(rows[0].status, "active", "the reactivated row is not active");
});

/* --------------------------------------------------------------------- end --- */

console.log(`\ndry runs: ${passed.length} checks passed, ${failures.length} failed.`);
if (failures.length > 0) {
  console.log("Failures:");
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
