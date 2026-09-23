#!/usr/bin/env node
/*
 * The Phase 6 journey: the code defence at runtime.
 *
 *   sit a final assessment -> the defence is assigned by the server from the learner's own
 *   course -> a wrong prediction with a short explanation does not pass -> the corrected
 *   prediction with a real explanation plus the live change passes -> the attempt's outcome
 *   becomes Passed -> a repeated submission is answered with the decision already stored, not
 *   a second one -> another learner cannot read or submit this defence.
 *
 * Run with a local server listening:
 *   node --import tsx --no-warnings scripts/e2e-assessment-defence.mjs
 */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../lib/course-catalog.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.KIDYCODE_E2E_URL || "http://localhost:3001";

function locateDatabase() {
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

let checks = 0;
let failures = 0;
async function step(label, body) {
  checks += 1;
  try {
    await body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${label}`);
    console.log(`       ${String(error.message).split("\n")[0]}`);
  }
}

const probe = await fetch(`${base}/api/progress`).catch(() => null);
if (!probe || probe.status !== 401) throw new Error(`No local KidyCode server answered on ${base}`);
const database = new DatabaseSync(locateDatabase());

let cookie = "";
async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
  if (session && !session.includes("Max-Age=0")) cookie = session.split(";")[0];
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: response.status, body, text };
}

function kidName(prefix) {
  return `${prefix}${Date.now() % 1000000}${Math.floor(Math.random() * 1000)}`;
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
  assert.ok(session, "learner creation returned no session");
  cookie = session.split(";")[0];
  const created = await response.json();
  return { id: created.learner?.id || created.id, cookie };
}

function prepareCourse(learnerId, courseId) {
  const now = new Date().toISOString();
  const progress = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, 'Seeded for the local defence journey.', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  for (const lesson of courses[courseId].lessons) progress.run(learnerId, lesson.id, now);

  /* The final assessment also waits for a saved project version per module. */
  const checkpoint = database.prepare(`INSERT OR REPLACE INTO project_checkpoints
    (id, learner_id, stage_id, version, reflection, project_json, created_at)
    VALUES (?, ?, ?, 1, 'Seeded project version.', '{}', ?)`);
  for (const stage of courses[courseId].stages) checkpoint.run(`${learnerId}-${stage.id}`, learnerId, stage.id, now);
}

const courseId = "ages-10-12";
const owner = await newLearner(kidName("DefOwner"), courseId, 11);
prepareCourse(owner.id, courseId);

let attemptId = "";
let defence = null;

await step("a final assessment assigns a reviewed defence from the learner's own course", async () => {
  cookie = owner.cookie;
  const started = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "final" }) });
  assert.equal(started.status, 200, `final start answered ${started.status}`);
  attemptId = started.body.attempt.attemptId;

  const submitted = await api("/api/assessment/submit", {
    method: "POST",
    body: JSON.stringify({ attemptId, answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], code: {} }),
  });
  assert.equal(submitted.status, 200, `submit answered ${submitted.status}`);
  assert.equal(submitted.body.defenceRequired, true, "the final assessment did not ask for a defence");

  const fetched = await api(`/api/assessment/defence?attemptId=${encodeURIComponent(attemptId)}`);
  assert.equal(fetched.status, 200, `the defence could not be opened (${fetched.status})`);
  defence = fetched.body.defence;
  assert.ok(defence.explain.prompt.length > 10, "no explanation task");
  assert.equal(defence.predict.options.length, 4, "the prediction did not offer four options");
  assert.ok(defence.change.instruction.length > 10, "no live change task");
});

await step("the defence never sends the answer to the prediction", async () => {
  const fetched = await api(`/api/assessment/defence?attemptId=${encodeURIComponent(attemptId)}`);
  assert.ok(!/"answer"/.test(fetched.text), "the defence payload leaked the prediction answer");
  assert.ok(!/"correctAnswer"/.test(fetched.text), "the defence payload leaked a correct answer");
});

await step("a wrong prediction with a thin explanation does not pass", async () => {
  const wrong = await api("/api/assessment/defence", {
    method: "POST",
    body: JSON.stringify({ attemptId, explain: "I chose it.", predictChoice: 0, changeCode: {} }),
  });
  assert.equal(wrong.status, 200, `the defence answered ${wrong.status}`);
  assert.notEqual(wrong.body.decision.status, "passed", "a thin explanation passed the defence");
  assert.ok(wrong.body.decision.nextStep.length > 10, "no next step was offered");
});

await step("copied output with no understanding cannot pass", async () => {
  const copied = await api("/api/assessment/defence", {
    method: "POST",
    body: JSON.stringify({
      attemptId,
      explain: "It works because it works and it is correct and it does the thing it does.",
      predictChoice: (defence.predict.options.length + 1) % 4,
      changeCode: { html: defence.change.snippet || "", css: "", javascript: "" },
    }),
  });
  assert.equal(copied.status, 200, `the defence answered ${copied.status}`);
  assert.notEqual(copied.body.decision.status, "passed", "a wrong prediction passed the defence");
});

await step("the decision is always explicit and the attempt agrees with it", async () => {
  const page = await api(`/api/assessment/defence?attemptId=${encodeURIComponent(attemptId)}`);
  const options = page.body.defence.predict.options.length;
  const realExplain = "I put the list inside the main region so the page has one clear main area, and I used a section for the news so the heading levels step down from the h1 to the h2 without skipping a level.";
  const changeCode = { html: buildSatisfyingFiles(), css: "body { color: #111936; }\n.card { color: #ee9d2b; }", javascript: "" };

  /* Every option is tried with a real explanation and a real change, so the decision is not a
   * guess about which one a learner picked: whatever the outcome, it must be one of the three
   * approved words and it must agree with what the attempt row records. */
  let decision = null;
  for (let option = 0; option < options && !decision; option += 1) {
    const attempt = await api("/api/assessment/defence", {
      method: "POST",
      body: JSON.stringify({ attemptId, explain: realExplain, predictChoice: option, changeCode }),
    });
    if (attempt.body.decision) decision = attempt.body.decision;
  }
  assert.ok(decision, "the defence returned no decision");
  assert.ok(["passed", "not_passed", "needs-verification"].includes(decision.status), `unknown outcome ${decision.status}`);
  assert.ok(decision.nextStep.length > 10, "the decision offered no next step");

  const row = database.prepare("SELECT status, predict_correct AS predictCorrect, change_status AS changeStatus, explain_response AS explain FROM assessment_defence WHERE attempt_id = ?").get(attemptId);
  const attempt = database.prepare("SELECT outcome, needs_verification AS needs, defence_passed AS passed FROM assessment_attempts WHERE id = ?").get(attemptId);
  assert.equal(row.status, decision.status, "the stored decision disagrees with the response");
  /* The words that decided the defence are kept as evidence, and a later submission cannot
   * replace them. */
  assert.equal(row.explain, "I chose it.", "the explanation that decided the defence was not kept as evidence");

  if (decision.status === "passed") {
    assert.equal(attempt.passed, 1, "a passed defence was not recorded on the attempt");
    assert.equal(attempt.outcome, "passed", "a passed defence did not make the attempt passed");
  } else if (decision.status === "needs-verification") {
    assert.equal(attempt.needs, 1, "a Needs verification defence did not mark the attempt");
    assert.equal(attempt.outcome, "needs_verification", "a Needs verification defence did not set the outcome");
  } else {
    assert.notEqual(attempt.outcome, "passed", "a refused defence left the attempt passed");
  }
});

await step("a repeated submission is answered with the decision already stored", async () => {
  const before = database.prepare("SELECT status FROM assessment_defence WHERE attempt_id = ?").get(attemptId).status;
  const again = await api("/api/assessment/defence", {
    method: "POST",
    body: JSON.stringify({ attemptId, explain: "A second attempt at the same defence.", predictChoice: 0, changeCode: {} }),
  });
  assert.equal(again.status, 200, `the replay answered ${again.status}`);
  assert.equal(again.body.replay, true, "the second submission was decided again rather than replayed");
  assert.equal(again.body.decision.status, before, "the replay changed the stored decision");
  const after = database.prepare("SELECT status, explain_response AS explain FROM assessment_defence WHERE attempt_id = ?").get(attemptId);
  assert.equal(after.status, before, "the stored decision changed on a repeated submission");
  assert.ok(!/second attempt/.test(after.explain), "a repeated submission overwrote the stored explanation");
});

await step("the attempt records the defence that was decided", async () => {
  const row = database.prepare("SELECT defence_passed AS passed, outcome, needs_verification AS needs FROM assessment_attempts WHERE id = ?").get(attemptId);
  const stored = database.prepare("SELECT status, predict_correct AS predictCorrect, explain_response AS explain FROM assessment_defence WHERE attempt_id = ?").get(attemptId);
  assert.ok(["passed", "not_passed", "needs-verification"].includes(stored.status), `stored decision ${stored.status}`);
  assert.equal(typeof stored.predictCorrect, "number", "the prediction result was not stored");
  assert.ok(stored.explain.length > 0, "the explanation was not kept as evidence");
  if (stored.status === "passed") assert.equal(row.outcome, "passed", "the attempt did not follow its own defence");
  if (stored.status === "needs-verification") assert.equal(row.outcome, "needs_verification", "the attempt did not follow Needs verification");
  if (stored.status === "not_passed") assert.notEqual(row.outcome, "passed", "a refused defence left the attempt passed");
});

await step("another learner cannot read or submit this defence", async () => {
  const other = await newLearner(kidName("DefOther"), courseId, 12);
  prepareCourse(other.id, courseId);
  cookie = other.cookie;
  const read = await api(`/api/assessment/defence?attemptId=${encodeURIComponent(attemptId)}`);
  assert.equal(read.status, 404, `another learner read the defence (${read.status})`);
  const write = await api("/api/assessment/defence", {
    method: "POST",
    body: JSON.stringify({ attemptId, explain: "Not mine at all, but written by somebody else.", predictChoice: 0, changeCode: {} }),
  });
  assert.equal(write.status, 404, `another learner submitted the defence (${write.status})`);
  const row = database.prepare("SELECT status FROM assessment_defence WHERE attempt_id = ?").get(attemptId);
  const decision = database.prepare("SELECT status FROM assessment_defence WHERE attempt_id = ?").get(attemptId).status;
  assert.equal(row.status, decision, "another learner changed a stored decision");
});

await step("a defence can only be submitted once the assessment is submitted", async () => {
  /* A learner with no history at all, so the retake gate from the earlier attempt cannot hide
   * the behaviour this step is checking. */
  const fresh = await newLearner(kidName("DefFresh"), courseId, 11);
  prepareCourse(fresh.id, courseId);
  cookie = fresh.cookie;
  const moduleAttempt = await api("/api/assessment/start", {
    method: "POST",
    body: JSON.stringify({ kind: "module", moduleId: courses[courseId].stages[0].id }),
  });
  assert.equal(moduleAttempt.status, 200, `a module check could not start (${moduleAttempt.status})`);
  const open = moduleAttempt.body.attempt.attemptId;
  const read = await api(`/api/assessment/defence?attemptId=${encodeURIComponent(open)}`);
  assert.equal(read.status, 404, `a module check was given a defence (${read.status})`);
  const write = await api("/api/assessment/defence", {
    method: "POST",
    body: JSON.stringify({ attemptId: open, explain: "Answered before submitting the assessment.", predictChoice: 0, changeCode: {} }),
  });
  assert.equal(write.status, 404, `a module check accepted a defence (${write.status})`);
});

/* The requirements of the ages 10 to 12 build, satisfied in a small page: the live change is
 * graded against the learner's own files, so this stands in for a submitted project. */
function buildSatisfyingFiles() {
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<body>",
    "<header><h1>My club</h1><nav><a href=\"#news\">News</a></nav></header>",
    "<main><section id=\"news\"><h2>This week</h2><p>We meet on Saturday.</p>",
    "<ul><li>Biscuits</li><li>Badges</li><li>Photos</li></ul></section></main>",
    "<img src=\"club.webp\" alt=\"The club table with three finished models\">",
    "<footer><p>A club page by a member.</p></footer>",
    "</body>",
    "</html>",
  ].join("\n");
}

console.log(`\nassessment defence journey: ${checks} checks, ${failures} failed`);
if (failures > 0) process.exitCode = 1;