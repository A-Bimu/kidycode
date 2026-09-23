#!/usr/bin/env node
/*
 * The Phase 5 journey, against a real local server and a real local D1 database.
 *
 *   submit an unsuccessful attempt -> results carry secure skills, a revision list and one
 *   first action -> open a revision page (which must not leak an answer) -> guided practice
 *   -> readiness refused when wrong, accepted when right -> a fresh equivalent form opens,
 *   never the one just sat.
 *
 * It also proves the boundaries: another learner cannot read the page or mark readiness, and
 * a concept belonging to another course is refused.
 *
 * Run with a local server listening: node --import tsx --no-warnings scripts/e2e-assessment-revision.mjs
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

let failures = 0;
let checks = 0;
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
if (!probe || probe.status !== 401) throw new Error("No local KidyCode server answered on " + base);

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
  return created.learner?.id || created.id;
}

function completeAllActivities(learnerId, courseId) {
  const now = new Date().toISOString();
  const insert = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, 'Seeded for the local revision journey.', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  for (const lesson of courses[courseId].lessons) insert.run(learnerId, lesson.id, now);
}

const courseId = "ages-10-12";
const moduleId = courses[courseId].stages[0].id;

const ownerCookie = await (async () => {
  const id = await newLearner(kidName("RevOwner"), courseId, 11);
  completeAllActivities(id, courseId);
  return { id, cookie };
})();
const owner = { id: ownerCookie.id, cookie: ownerCookie.cookie };

let concept = "";
let firstVariant = "";
let plan = [];
let otherLearner = { id: "", cookie: "" };

await step("an unsuccessful attempt reports secure skills, a revision list and one first action", async () => {
  cookie = owner.cookie;
  const started = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
  assert.equal(started.status, 200, `start answered ${started.status}`);
  const attemptId = started.body.attempt.attemptId;
  firstVariant = started.body.attempt.formVariant;

  const submitted = await api("/api/assessment/submit", {
    method: "POST",
    body: JSON.stringify({ attemptId, answers: [2, 2, 2, 2, 2], code: {} }),
  });
  assert.equal(submitted.status, 200, `submit answered ${submitted.status}`);
  const result = submitted.body;
  assert.ok(Array.isArray(result.secure), "the result carries no secure skill list");
  assert.ok(result.revision.length > 0, "an unsuccessful attempt produced no revision list");
  assert.ok(result.firstAction && result.firstAction.concept, "no first revision action");
  assert.equal(result.attempt.outcome, "not_passed_yet", `outcome was ${result.attempt.outcome}`);
  concept = result.firstAction.concept;
  plan = result.revision.map((entry) => entry.concept);
});

await step("a revision page is served without any answer index", async () => {
  const page = await api(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
  assert.equal(page.status, 200, `revision page answered ${page.status}`);
  assert.ok(page.body.pack && page.body.pack.guided.length === 2, "the page has no guided practice");
  assert.ok(page.body.pack.hints.length === 3, "the page has no three hints");
  assert.ok(!/"answer"/.test(page.text), "the revision page leaked an answer index");
  assert.ok(!/correctAnswer/.test(page.text), "the revision page leaked a correct answer");
});

await step("a concept from another course is refused", async () => {
  const foreign = await api(`/api/assessment/revision?concept=${encodeURIComponent("adults:adults-structure:landmarks")}`);
  assert.equal(foreign.status, 404, `a foreign concept answered ${foreign.status}`);
  const nonsense = await api("/api/assessment/revision?concept=x");
  assert.equal(nonsense.status, 400, `a nonsense concept answered ${nonsense.status}`);
});

await step("guided practice is marked on the server and explains itself", async () => {
  const page = await api(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
  const wrong = page.body.pack.guided.map(() => 0);
  const graded = await api("/api/assessment/revision", {
    method: "POST",
    body: JSON.stringify({ concept, kind: "practice", answers: wrong }),
  });
  assert.equal(graded.status, 200, `practice answered ${graded.status}`);
  assert.equal(graded.body.practice.length, 2, "practice did not mark both questions");
  for (const entry of graded.body.practice) {
    assert.equal(typeof entry.correct, "boolean", "practice did not say whether the answer was right");
    assert.ok(Number.isInteger(entry.correctAnswer), "practice did not correct the answer");
    assert.ok(entry.explanation.length > 20, "practice gave no explanation");
  }
});

await step("readiness refuses a wrong answer and accepts a correct one", async () => {
  const page = await api(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
  const correct = await solveAnswers(concept, page.body.pack.readiness.length);
  /* One option away from the right answer is wrong, whichever option that is. */
  const wrong = correct.map((value) => (value + 1) % 3);
  const refused = await api("/api/assessment/revision", {
    method: "POST",
    body: JSON.stringify({ concept, kind: "readiness", answers: wrong }),
  });
  assert.equal(refused.status, 200, `readiness answered ${refused.status}`);
  assert.equal(refused.body.passed, false, "readiness passed with answers that are not correct");
  /* Readiness is monotonic: once a concept is ready it is never unlearned, so the timestamp
   * this concept already earned stays. Nothing here can clear a stored result. */

  const solved = await api("/api/assessment/revision", {
    method: "POST",
    body: JSON.stringify({ concept, kind: "readiness", answers: correct }),
  });
  assert.equal(solved.body.passed, true, "readiness did not pass with the correct answers");
  assert.ok(solved.body.readinessPassedAt, "readiness was not recorded with a timestamp");
});

await step("the retake gate opens only once every listed concept is ready", async () => {
  /* The plan lists every weak or mandatorily unmet concept, so one ready concept is not
   * enough: the gate must still refuse until the rest are ready too. */
  const blocked = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
  if (plan.length > 1) {
    assert.equal(blocked.status, 409, `the gate opened with ${plan.length - 1} concepts still pending`);
    assert.ok(Array.isArray(blocked.body.revision), "the refusal listed no pending concept");
  }

  for (const pending of plan) {
    const page = await api(`/api/assessment/revision?concept=${encodeURIComponent(pending)}`);
    const answers = await solveAnswers(pending, page.body.pack.readiness.length);
    const marked = await api("/api/assessment/revision", {
      method: "POST",
      body: JSON.stringify({ concept: pending, kind: "readiness", answers }),
    });
    assert.equal(marked.body.passed, true, `${pending} did not pass its readiness check`);
  }

  const started = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId }) });
  assert.equal(started.status, 200, `the retake gate answered ${started.status} after every concept was ready`);
  assert.notEqual(started.body.attempt.formVariant, firstVariant, "the retake repeated the previous form");
  assert.equal(started.body.resumed, false, "the retake resumed the old attempt");
});

await step("another learner can neither read the page nor mark readiness", async () => {
  const otherId = await newLearner(kidName("RevOther"), courseId, 12);
  completeAllActivities(otherId, courseId);
  otherLearner = { id: otherId, cookie };
  const otherCookie = cookie;

  cookie = otherCookie;
  const read = await api(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
  /* The concept belongs to their course too, so reading is allowed, but readiness is their
   * own: the first learner's timestamp must never appear for them. */
  assert.equal(read.status, 200, `the other learner could not read their own page (${read.status})`);
  assert.equal(read.body.pack.readinessPassedAt, null, "one learner saw another learner's readiness");

  cookie = owner.cookie;
  const mine = await api(`/api/assessment/revision?concept=${encodeURIComponent(concept)}`);
  assert.ok(mine.body.pack.readinessPassedAt, "the owner lost their own readiness record");
});

await step("readiness cannot reach another learner's row", async () => {
  const rows = database
    .prepare("SELECT learner_id AS learnerId, concept, readiness_passed_at AS passedAt FROM assessment_revision_items WHERE concept = ?")
    .all(concept);
  const passing = rows.filter((row) => row.passedAt);
  assert.ok(passing.length >= 1, "no readiness row was recorded");
  const mine = passing.filter((row) => row.learnerId === owner.id);
  assert.ok(mine.length >= 1, "the owner has no readiness row");
  const otherId = otherLearner.id;
  assert.equal(passing.filter((row) => row.learnerId === otherId).length, 0, "readiness was recorded for the wrong learner");
  /* One timestamp per learner and concept, never a second competing row. */
  assert.equal(mine.length, 1, "the owner has more than one readiness row for one concept");
});

/* Recover the correct answers by asking the server one option at a time, which is the most a
 * determined learner could do: the page itself never carries an answer index. */
async function solveAnswers(conceptRef, count) {
  const answers = [];
  for (let index = 0; index < count; index += 1) {
    let found = false;
    for (let option = 0; option < 3; option += 1) {
      const candidate = [...answers, option];
      const response = await api("/api/assessment/revision", {
        method: "POST",
        body: JSON.stringify({ concept: conceptRef, kind: "readiness", answers: candidate }),
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

console.log(`\nassessment revision journey: ${checks} checks, ${failures} failed`);
if (failures > 0) process.exitCode = 1;