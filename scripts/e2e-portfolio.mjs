/*
 * The learner portfolio and the completion record, against a real server and the
 * real local database.
 *
 * Which paths are real and which are fixtures:
 *
 *   - every portfolio read, every module read, the checkpoint save and both exam
 *     attempts go through the HTTP API exactly as the browser does
 *   - the 48 completed activities and the checkpoints for modules 2 to 8 are
 *     written straight into the local store, because driving all 48 activities and
 *     all eight module projects through their own code checks would only re-test
 *     the grading paths that the tutor, backend and browser suites already cover.
 *     What is under test here is the derivation: ordering, filtering, the
 *     completion rule and the privacy boundary.
 *
 *   cd C:/Users/USER/kidycode
 *   KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx --no-warnings scripts/e2e-portfolio.mjs
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
console.log(`Checking the portfolio against ${base}`);

let cookie = "";
async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
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

const runTag = crypto.randomUUID().slice(0, 8);
const course = courses["ages-10-12"];
const stageIds = course.stages.map((stage) => stage.id);

/* Fixtures written straight into the store. */
function completeEveryActivity(learnerId, from) {
  const insert = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, '', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  course.lessons.forEach((lesson, index) => {
    insert.run(learnerId, lesson.id, new Date(new Date(from).getTime() + index * 60_000).toISOString());
  });
}

function saveCheckpointRow(learnerId, stageId, projectJson, reflection, createdAt) {
  database
    .prepare(`INSERT INTO project_checkpoints (id, learner_id, stage_id, version, project_json, reflection, created_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET project_json = excluded.project_json, reflection = excluded.reflection, created_at = excluded.created_at`)
    .run(`${learnerId}:${stageId}`, learnerId, stageId, projectJson, reflection, createdAt);
}

function countCheckpoints(learnerId) {
  return database.prepare("SELECT COUNT(*) AS total FROM project_checkpoints WHERE learner_id = ?").get(learnerId).total;
}

const moduleOneProject = {
  html: `<main>
  <h1>My First Website</h1>
  <p>A website about the things I enjoy most.</p>
  <h2>Inside this site</h2>
  <ul><li>One</li><li>Two</li><li>Three</li></ul>
</main>`,
  css: "h1 { color: #111936; }",
  javascript: "console.log('ready');",
  theme: "interest",
};

/* The practical repair the final check expects, kept in step with the course. */
const practicalCode = `<h2>Final check</h2>
<button id="check">Check work</button>
<p id="message">Waiting</p>
<script>
const button = document.querySelector("#check");
const message = document.querySelector("#message");
button.addEventListener("click", function () {
  message.textContent = "Ready";
});
</script>`;

const learner = await newLearner(`Portfolio${runTag}`, "ages-10-12", 11);
const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

await step("a new learner sees an empty portfolio with the correct first action", async () => {
  const { status, body } = await api("/api/portfolio");
  assert.equal(status, 200, `the portfolio must open, received ${status}`);
  const portfolio = body.portfolio;
  assert.equal(portfolio.modules.length, 8, `expected eight module cards, received ${portfolio.modules.length}`);
  assert.equal(portfolio.totals.saved, 0, "nothing should be saved yet");
  assert.equal(portfolio.totals.required, 8, "the course has eight modules");
  assert.equal(portfolio.completion.complete, false, "an empty portfolio is not complete");
  assert.equal(portfolio.completion.activities.completed, 0, "no activities are complete yet");
  assert.match(portfolio.completion.nextRequirement.label, /Complete 48 more activities/, `unexpected first action: ${portfolio.completion.nextRequirement.label}`);
  assert.equal(portfolio.completion.completedAt, null, "no completion date may exist before completion");
  assert.equal(portfolio.modules.every((module) => module.saved === false), true, "no module should be saved");
  assert.equal(body.learner.nickname, learner.nickname, "the portfolio belongs to this learner");
  assert.equal(JSON.stringify(body).includes(learner.id), false, "the portfolio must not carry the learner identifier");
});

await step("completing every activity is reflected without a stored total", async () => {
  completeEveryActivity(learner.id, start);
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.completion.activities.completed, 48, "all 48 activities must count");
  assert.equal(body.portfolio.completion.activities.required, 48, "the course requires 48 activities");
  assert.equal(body.portfolio.completion.complete, false, "activities alone do not complete the course");
  assert.match(body.portfolio.completion.nextRequirement.label, /Save the Module 1 project version/, `unexpected next step: ${body.portfolio.completion.nextRequirement.label}`);
});

await step("a saved module version appears in its own module", async () => {
  const saved = await api("/api/checkpoints", {
    method: "POST",
    body: JSON.stringify({ stageId: stageIds[0], reflection: "The main heading made the page clear to read.", project: moduleOneProject }),
  });
  assert.equal(saved.status, 200, `saving module 1 must work, received ${saved.status}: ${JSON.stringify(saved.body)}`);
  const { body } = await api("/api/portfolio");
  const first = body.portfolio.modules[0];
  assert.equal(first.number, 1, "the first card is module 1");
  assert.equal(first.saved, true, "module 1 must be saved");
  assert.equal(first.readable, true, "module 1 must be readable");
  assert.equal(first.hasReflection, true, "the reflection must be recorded");
  assert.equal(body.portfolio.totals.saved, 1, "exactly one version is saved");
  assert.equal(body.portfolio.modules.slice(1).every((module) => module.saved === false), true, "no other module may be saved");
});

await step("saving the same module again does not inflate the count", async () => {
  const before = countCheckpoints(learner.id);
  const again = await api("/api/checkpoints", {
    method: "POST",
    body: JSON.stringify({ stageId: stageIds[0], reflection: "The main heading made the page clear to read, again.", project: moduleOneProject }),
  });
  assert.equal(again.status, 200, "saving again must be accepted");
  assert.equal(countCheckpoints(learner.id), before, "a repeated save must not add a row");
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.totals.saved, 1, "a repeated save must not change the saved count");
  assert.equal(body.portfolio.modules.filter((module) => module.saved).length, 1, "only one module is saved");
});

await step("a checkpoint from another course is excluded", async () => {
  const otherCourse = courses["ages-13-15"];
  saveCheckpointRow(learner.id, otherCourse.stages[0].id, JSON.stringify(moduleOneProject), "Another course version.", new Date().toISOString());
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.modules.length, 8, "the portfolio still shows eight modules");
  assert.equal(body.portfolio.modules.some((module) => module.stageId === otherCourse.stages[0].id), false, "a foreign module must not appear");
  assert.equal(body.portfolio.totals.saved, 1, "a foreign version must not be counted");
  const foreign = await api(`/api/portfolio?module=${encodeURIComponent(otherCourse.stages[0].id)}`);
  assert.equal(foreign.status, 404, `another course's module must not be readable, received ${foreign.status}`);
});

await step("all eight versions appear in course order", async () => {
  for (const stage of course.stages.slice(1)) {
    saveCheckpointRow(
      learner.id,
      stage.id,
      JSON.stringify(moduleOneProject),
      `Module ${stage.number} reflection.`,
      new Date(new Date(start).getTime() + stage.number * 30 * 60_000).toISOString(),
    );
  }
  const { body } = await api("/api/portfolio");
  const numbers = body.portfolio.modules.map((module) => module.number);
  assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8], `modules must be in course order, received ${numbers.join(", ")}`);
  assert.equal(body.portfolio.totals.saved, 8, "eight versions are saved");
  assert.equal(body.portfolio.modules.every((module) => module.title.length > 0), true, "every card needs its course title");
  assert.equal(body.portfolio.modules.every((module) => module.skill.length > 0), true, "every card needs its skill description");
  assert.equal(body.portfolio.finalBuild.number, 8, "the finished build is module 8");
  assert.equal(body.portfolio.completion.modules.saved, 8, "the record counts eight saved versions");
});

await step("a malformed stored version does not crash the portfolio", async () => {
  const stage = course.stages[2];
  saveCheckpointRow(learner.id, stage.id, "{not json", "Corrupt row.", new Date().toISOString());
  const { status, body } = await api("/api/portfolio");
  assert.equal(status, 200, `a corrupt row must not break the portfolio, received ${status}`);
  const card = body.portfolio.modules.find((module) => module.stageId === stage.id);
  assert.equal(card.saved, true, "the row exists, so the module reports as saved");
  assert.equal(card.readable, false, "an unreadable version must be reported as unreadable");
  assert.equal(body.portfolio.totals.saved, 7, "an unreadable version must not count as saved");
  assert.equal(body.portfolio.completion.complete, false, "an unreadable version must not complete the course");
  assert.match(body.portfolio.completion.nextRequirement.label, /Save the Module 3 project version/, `the gap must name module 3: ${body.portfolio.completion.nextRequirement.label}`);
  const detail = await api(`/api/portfolio?module=${encodeURIComponent(stage.id)}`);
  assert.equal(detail.status, 404, "an unreadable version must not open");
});

await step("the course stays incomplete while one activity is missing", async () => {
  saveCheckpointRow(learner.id, course.stages[2].id, JSON.stringify(moduleOneProject), "Repaired.", new Date().toISOString());
  const missing = course.lessons[20];
  database.prepare("DELETE FROM course_progress WHERE learner_id = ? AND lesson_id = ?").run(learner.id, missing.id);
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.completion.activities.completed, 47, "one activity must be missing");
  assert.equal(body.portfolio.completion.complete, false, "47 of 48 activities cannot complete the course");
  assert.match(body.portfolio.completion.nextRequirement.label, /Complete 1 more activity/, `unexpected wording: ${body.portfolio.completion.nextRequirement.label}`);
  assert.equal(body.portfolio.completion.missing.some((item) => item.kind === "activities"), true, "the missing activity must be listed");
  completeEveryActivity(learner.id, start);
});

await step("the course stays incomplete without a passed final assessment", async () => {
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.completion.activities.completed, 48, "all activities are complete again");
  assert.equal(body.portfolio.completion.modules.saved, 8, "all eight versions are saved");
  assert.equal(body.portfolio.completion.finalAssessment.status, "not-started", "the final assessment has not been attempted");
  assert.equal(body.portfolio.completion.complete, false, "the course cannot be complete without the final assessment");
  assert.equal(body.portfolio.completion.nextRequirement.label, "Pass the final assessment", "the last requirement must be named");
});

await step("a failed final assessment does not complete the course", async () => {
  const failedAnswers = course.finalExam.map((question) => (question.answer + 1) % 3);
  const attempt = await api("/api/exam", {
    method: "POST",
    body: JSON.stringify({
      courseId: "ages-10-12",
      answers: failedAnswers,
      practicalCode,
      explanation: "I repaired the heading and the selector.",
    }),
  });
  assert.equal(attempt.status, 200, `a failed attempt must still be recorded, received ${attempt.status}`);
  assert.equal(attempt.body.attempt.passed, false, "this attempt must not pass");
  const { body } = await api("/api/portfolio");
  assert.equal(body.portfolio.completion.finalAssessment.status, "attempted", "a failed attempt is recorded as attempted");
  assert.equal(body.portfolio.completion.complete, false, "a failed attempt must not complete the course");
});

await step("a passed final assessment completes the course and the record is truthful", async () => {
  const answers = course.finalExam.map((question) => question.answer);
  const attempt = await api("/api/exam", {
    method: "POST",
    body: JSON.stringify({ courseId: "ages-10-12", answers, practicalCode, explanation: "I repaired the heading, the selector and the message text." }),
  });
  assert.equal(attempt.status, 200, `the final attempt must be accepted, received ${attempt.status}`);
  assert.equal(attempt.body.attempt.passed, true, "the correct answers and repaired code must pass");

  const { body } = await api("/api/portfolio");
  const record = body.portfolio.completion;
  assert.equal(record.complete, true, "all three requirements are met, so the course is complete");
  assert.equal(record.recordName, "KidyCode course completion record", "the record must be named plainly");
  assert.equal(record.activities.completed, 48, "48 activities completed");
  assert.equal(record.modules.saved, 8, "eight module versions saved");
  assert.equal(record.finalAssessment.status, "passed", "the final assessment is passed");
  assert.equal(record.missing.length, 0, "nothing may be listed as missing");
  assert.equal(record.nextRequirement, null, "there is no next requirement once complete");
  assert.ok(record.completedAt, "a completion date must be derived from the evidence");
  const latestEvidence = [start, ...course.stages.map((stage) => new Date(new Date(start).getTime() + stage.number * 30 * 60_000).toISOString())].sort().pop();
  assert.ok(record.completedAt >= latestEvidence, `the completion date must follow the last required evidence: ${record.completedAt}`);
  assert.match(record.statement, /Built and tested a website using HTML, CSS and JavaScript/, `unexpected statement: ${record.statement}`);
  assert.equal(record.projectTitle, "Interest Guide", "the record must name the learner's project");
  assert.equal(record.courseTitle, course.courseFacts.title, "the record must name the course");
  assert.equal(record.ageRange, course.courseFacts.ageRange, "the record must name the age group");
  assert.equal(/certificate|diploma|accredited|qualification/i.test(JSON.stringify(body)), false, "the record must not claim an accreditation");
});

await step("the portfolio never carries answers, practical code or identifiers", async () => {
  const { body } = await api("/api/portfolio");
  const serialised = JSON.stringify(body);
  for (const probe of ["answersJson", "answers_json", "practicalJson", "practical_json", "access_hash", "accessHash", "kidycode_session", "projectJson", "workspaceJson"]) {
    assert.equal(serialised.includes(probe), false, `the portfolio must not carry ${probe}`);
  }
  /* The stored attempt is read back here only to prove none of it is returned. */
  const exam = database.prepare("SELECT answers_json AS answers, practical_json AS practical FROM exam_attempts WHERE learner_id = ? ORDER BY created_at DESC").get(learner.id);
  assert.ok(exam.answers.includes("courseId"), "the stored attempt keeps its answers for the audit trail");
  assert.equal(serialised.includes(exam.practical.slice(20, 60)), false, "the stored practical code must never be returned");
  const answerArray = JSON.parse(exam.answers).answers;
  assert.equal(serialised.includes(JSON.stringify(answerArray)), false, "the stored exam answers must never be returned");
  assert.equal(serialised.includes("I repaired the heading"), false, "the learner's exam explanation must never be returned");
});

await step("a saved version opens with its own code and one preview at a time", async () => {
  const { status, body } = await api(`/api/portfolio?module=${encodeURIComponent(stageIds[3])}`);
  assert.equal(status, 200, `a saved version must open, received ${status}`);
  assert.equal(body.module.number, 4, "the opened version must be module 4");
  assert.equal(typeof body.module.files.html, "string", "the HTML must be returned to the learner");
  assert.equal(typeof body.module.files.css, "string", "the CSS must be returned to the learner");
  assert.equal(typeof body.module.files.javascript, "string", "the JavaScript must be returned to the learner");
  assert.equal(body.module.reflection.length > 0, true, "the learner's own reflection comes back to the learner");
  assert.equal(body.module.truncated, false, "a short version is not truncated");
  const unknown = await api("/api/portfolio?module=not-a-module");
  assert.equal(unknown.status, 404, "an unknown module must not open");
});

await step("another learner cannot reach this portfolio", async () => {
  const stranger = await newLearner(`Stranger${runTag}`, "ages-13-15", 14);
  const { status, body } = await api("/api/portfolio");
  assert.equal(status, 200, "the second learner has their own portfolio");
  assert.equal(body.learner.nickname, stranger.nickname, "the portfolio is the second learner's own");
  assert.equal(body.portfolio.totals.saved, 0, "the second learner must not see the first learner's versions");
  assert.equal(JSON.stringify(body).includes(learner.nickname), false, "the first learner must not appear");
  const foreign = await api(`/api/portfolio?module=${encodeURIComponent(stageIds[0])}`);
  assert.equal(foreign.status, 404, "the first learner's module must not open for the second learner");
  const unauthenticated = await fetch(`${base}/api/portfolio`, { signal: AbortSignal.timeout(30000) });
  assert.equal(unauthenticated.status, 401, "an unauthenticated portfolio request must be refused");
});

console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}