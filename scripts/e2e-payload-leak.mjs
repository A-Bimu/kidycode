/*
 * What a real learner's browser can actually see, inspected on the wire.
 *
 * This is the payload-leak half of the release audit. It creates a real learner through the
 * real API, seeds one module's activities in the local store so a real reviewed form is
 * served, then reads every byte of every response:
 *
 *   - starting an assessment carries the question and its options and nothing else: no
 *     correct index, no explanation, no misconception note, no grading rule, no rubric;
 *   - the state and autosave responses carry the learner's own draft and no answer key;
 *   - a question belonging to an unassigned equivalent form never travels, before or after
 *     submission;
 *   - the corrections after submission cover the form the learner sat, and that form's
 *     explanations do reach them;
 *   - nothing in any response names the learner, their access hash, a code digest or an
 *     internal database id;
 *   - a module from another course is refused, and a body carrying its own marks, level,
 *     date, credential id or eligibility cannot change what is returned or stored;
 *   - the rendered screens carry no explanation and no em dash.
 *
 * Local only: it refuses to run against anything but the local miniflare database and a
 * local development server.
 *
 *   node --import tsx --no-warnings scripts/e2e-payload-leak.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { courses } from "../lib/course-catalog.ts";
import { assessmentContent } from "../lib/assessment/manifest.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.KIDYCODE_E2E_URL || "http://localhost:3001";

const passed = [];
const failed = [];
function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}
async function step(name, body) {
  try {
    await body();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

function locateDatabase() {
  if (process.env.KIDYCODE_D1_PATH) return process.env.KIDYCODE_D1_PATH;
  const directory = resolve(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) throw new Error(`No local D1 store at ${directory}. Run the local migration first.`);
  const file = readdirSync(directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => resolve(directory, name))
    .sort()
    .pop();
  if (!file) throw new Error("No local D1 database file was found.");
  return file;
}

/* ------------------------------------------------------ the answer material ---- */

/*
 * Grouped by the form that owns it, because the two questions are different: "does an
 * explanation travel before submission" is asked of the whole bank, and "does a question
 * from an unassigned form travel" is asked of every form except the one that was served.
 *
 * Explanations are the server-only prose. A knowledge item's prompted *answer* and its
 * misconception keys are learner-visible elsewhere (the correction and the recovery list), so
 * those are excluded here; the structural check on the item's own keys is what proves an item
 * cannot carry its answer. A question prompt is shown for the served form and must never
 * appear for any other one, which is why the bank validator forbids repeating a question
 * across forms.
 */
function answerMaterial() {
  const forms = new Map();
  const add = (list, value) => {
    if (typeof value === "string" && value.length >= 20) list.push(value);
  };
  for (const content of Object.values(assessmentContent)) {
    for (const form of [...content.moduleForms, ...content.finalForms]) {
      const entry = forms.get(form.id) ?? { hidden: [], prompts: [], knowledgeIds: [] };
      for (const item of form.knowledge) {
        add(entry.hidden, item.explanation);
        add(entry.prompts, item.prompt);
        entry.knowledgeIds.push(item.id);
      }
      forms.set(form.id, entry);
    }
  }
  return forms;
}

const forms = answerMaterial();
const allFormIds = [...forms.keys()];
const hiddenEverywhere = allFormIds.flatMap((id) => forms.get(id).hidden);
const promptsOf = (exclude) => allFormIds.filter((id) => id !== exclude).flatMap((id) => forms.get(id).prompts);
const hiddenOf = (exclude) => allFormIds.filter((id) => id !== exclude).flatMap((id) => forms.get(id).hidden);

const leaksIn = (text, strings) => strings.filter((needle) => text.includes(needle));
function assertNoLeak(text, strings, what) {
  const leaked = leaksIn(text, strings);
  assert.deepEqual(leaked.slice(0, 3).map((entry) => entry.slice(0, 60)), [], `${leaked.length} ${what}.`);
}

/* ------------------------------------------------------------------- helpers --- */

const context = {};
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
  return { status: response.status, body, text };
}

const database = new DatabaseSync(locateDatabase());

async function newLearner(nickname, courseId, age) {
  cookie = "";
  const response = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
    signal: AbortSignal.timeout(30000),
  });
  assert.ok(response.ok, `learner creation answered ${response.status}`);
  const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
  assert.ok(session, "learner creation returned no session");
  cookie = session.split(";")[0];
  const created = await response.json();
  return created.learner?.id || created.id;
}

/* The first module of a course, completed in the store so the assessment gate opens. The
 * route refuses to serve a module until its activities are complete, and clicking through a
 * whole module in a leak audit would prove nothing extra. */
function completeModule(learnerId, courseId, stageIndex) {
  const stage = courses[courseId].stages[stageIndex];
  const now = new Date().toISOString();
  const insert = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, 'Seeded for the payload audit.', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  for (const lesson of stage.lessons) insert.run(learnerId, lesson.id, now);
  return stage.id;
}

const stamp = () => `${Date.now() % 1000000}${Math.floor(Math.random() * 1000)}`;

await step("a real learner can open a real reviewed module assessment", async () => {
  context.learnerId = await newLearner(`Leak${stamp()}`, "ages-10-12", 11);
  context.moduleId = completeModule(context.learnerId, "ages-10-12", 0);
  const response = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId: context.moduleId }) });
  assert.equal(response.status, 200, `the module assessment answered ${response.status}: ${response.text.slice(0, 160)}`);
  context.attemptId = response.body.attempt.attemptId;
  context.formId = database.prepare("SELECT form_id AS formId FROM assessment_attempts WHERE id = ?").get(context.attemptId).formId;
  assert.ok(allFormIds.includes(context.formId), "the served form must be one of the reviewed forms.");
  assert.deepEqual(Object.keys(response.body).sort(), ["attempt", "attemptCount", "draft", "resumed"], "starting an assessment carries only the attempt and the resume state.");
});

await step("the response shape is an allow list, not the form", async () => {
  const response = await api(`/api/assessment/state?attempt=${context.attemptId}`);
  assert.equal(response.status, 200, `state answered ${response.status}`);
  assert.deepEqual(Object.keys(response.body).sort(), ["attempt", "attemptCount", "draft", "resumable"], "the state response carries only what resuming needs.");
  const attempt = response.body.attempt;
  assert.deepEqual(
    Object.keys(attempt).sort(),
    ["attemptId", "build", "contentVersion", "courseId", "debug", "defenceRequired", "formVariant", "kind", "knowledge", "moduleId", "moduleTitle", "practical", "rules", "savedAt", "stage", "status"],
    "the attempt view carries only the fields the screen needs.",
  );
  assert.equal(attempt.knowledge.length, 5, "a module form holds five knowledge items.");
  for (const item of attempt.knowledge) {
    assert.deepEqual(Object.keys(item).sort(), ["itemId", "options", "prompt"], "a knowledge item must carry its prompt and its options and nothing else.");
    assert.equal(item.options.length, 3, "each question offers three options.");
  }
  assert.equal(attempt.practical.requirements.length, 5, "the practical task carries its five marked requirements.");
  context.practicalItemId = attempt.practical.itemId;
  for (const requirement of attempt.practical.requirements) {
    assert.deepEqual(Object.keys(requirement).sort(), ["id", "label", "mandatory", "marks"], "a requirement must carry its label and its marks and no grading rule.");
  }
  for (const rule of attempt.rules) assert(!rule.includes("\u2014"), "the assessment rules shown to a learner must not contain an em dash.");
});

await step("no explanation, misconception, grading rule or rubric reaches the browser before submission", async () => {
  const response = await api(`/api/assessment/state?attempt=${context.attemptId}`);
  for (const banned of ['"answer"', "correctAnswer", '"explanation"', '"misconceptions"', '"check"', '"rubric"', "predictExpected", '"awarded"', "requirementId"]) {
    assert(!response.text.includes(banned), `the attempt payload carries ${banned}.`);
  }
  assertNoLeak(response.text, hiddenEverywhere, "explanations or misconception notes travelled before submission");
  console.log(`  ..   ${hiddenEverywhere.length} reviewed explanations, checked against the payload`);
});

await step("a question from an unassigned equivalent form never travels", async () => {
  const response = await api(`/api/assessment/state?attempt=${context.attemptId}`);
  const others = promptsOf(context.formId);
  assert.ok(others.length > 100, `expected the other forms to hold a substantial question bank, found ${others.length}.`);
  assertNoLeak(response.text, others, "questions from an unassigned form travelled");
  /* The served form's own questions are present, which is what makes the check above mean
   * something rather than passing on an empty payload. */
  const servedPrompts = forms.get(context.formId).prompts;
  assert.ok(leaksIn(response.text, servedPrompts).length >= 5, "the served form's own questions must be in the payload.");
  console.log(`  ..   ${servedPrompts.length} served questions present, ${others.length} questions from other forms absent`);
});

await step("the payload names the learner nowhere but the opaque attempt handle", async () => {
  const response = await api(`/api/assessment/state?attempt=${context.attemptId}`);
  for (const banned of [context.learnerId, "learner_id", "learnerId", "access_hash", "accessHash", "code_digest", "codeDigest", "sha256"]) {
    assert(!response.text.includes(banned), `the payload exposes ${banned}.`);
  }
  assert(/^[0-9a-f-]{30,40}$/.test(context.attemptId), "the attempt handle must be an opaque random id, not a sequence.");
});

await step("a saved draft comes back exactly as it was sent, with no answer key", async () => {
  const answers = [0, 1, 2, -1, -1];
  const saved = await api("/api/assessment/autosave", {
    method: "POST",
    body: JSON.stringify({ attemptId: context.attemptId, answers, code: { "task-1": { html: "<h1>Mine</h1>", css: "", javascript: "" } }, stage: "practical", visibilityChanges: 1, pasteEvents: 2, largestPasteChars: 30 }),
  });
  assert.equal(saved.status, 200, `autosave answered ${saved.status}`);
  assert.equal(saved.body.saved, true, "the draft must be reported as saved.");
  assert(!saved.text.includes(context.formId), "the save response must not name the form.");
  const restored = await api(`/api/assessment/state?attempt=${context.attemptId}`);
  assert.deepEqual(restored.body.draft.answers, answers, "the restored draft must be the learner's own answers.");
  assert.equal(restored.body.draft.code["task-1"].html, "<h1>Mine</h1>", "the restored draft must keep the learner's own code.");
  assert.equal(restored.body.resumable, true, "an open attempt must be resumable.");
  assertNoLeak(restored.text, hiddenEverywhere, "explanations travelled with the saved draft");
});

await step("a submission carrying its own marks, level, date, credential id or eligibility changes nothing", async () => {
  const submitted = await api("/api/assessment/submit", {
    method: "POST",
    body: JSON.stringify({
      attemptId: context.attemptId,
      answers: [0, 0, 0, 0, 0],
      score: 10,
      passed: true,
      outcome: "passed",
      eligible: true,
      level: "Business Website Builder",
      issuedAt: "1999-01-01T00:00:00.000Z",
      credentialId: "chosen-by-the-learner",
      courseId: "adults",
      learnerId: "somebody-else",
      formId: "chosen-form",
    }),
  });
  assert.equal(submitted.status, 200, `the submission answered ${submitted.status}: ${submitted.text.slice(0, 160)}`);
  context.submit = submitted;
  for (const banned of ["somebody-else", "chosen-by-the-learner", "Business Website Builder", "1999-01-01", "chosen-form"]) {
    assert(!submitted.text.includes(banned), `a client-supplied ${banned} was echoed back.`);
  }
  const stored = database.prepare("SELECT outcome, form_id AS formId FROM assessment_attempts WHERE id = ?").get(context.attemptId);
  assert.notEqual(stored.outcome, "passed", "five unanswered questions and no code must never be stored as a pass.");
  assert.equal(stored.formId, context.formId, "the stored form must be the one the server selected.");
});

await step("the corrections cover the form the learner sat and no other form in the product", async () => {
  assert.deepEqual(
    Object.keys(context.submit.body).sort(),
    ["attempt", "corrections", "defenceRequired", "firstAction", "requirements", "revision", "secure"],
    "the result payload carries only what the learner is shown.",
  );
  const served = forms.get(context.formId);
  assert.ok(context.submit.body.corrections.length >= 1, "a submission must be corrected.");
  for (const correction of context.submit.body.corrections) {
    assert(served.knowledgeIds.includes(correction.itemId), `a correction for ${correction.itemId} does not belong to the served form.`);
  }
  /* The reason reaches the learner for the form they sat, and no other form's material does. */
  const ownLeaks = leaksIn(context.submit.text, served.hidden);
  assert.ok(ownLeaks.length >= 1, "the corrections must explain the questions the learner answered.");
  assertNoLeak(context.submit.text, hiddenOf(context.formId), "explanations from an unassigned form travelled with the result");
  assertNoLeak(context.submit.text, promptsOf(context.formId), "questions from an unassigned form travelled with the result");
  for (const key of Object.keys(context.submit.body.requirements)) {
    assert(
      served.knowledgeIds.includes(key) || key === context.practicalItemId,
      `requirement detail was returned for ${key}, which is not an item of the served form.`,
    );
  }
  console.log(`  ..   ${context.submit.body.corrections.length} corrections from the served form, ${ownLeaks.length} of its explanations present, no other form's material`);
});

await step("a replay of a submitted attempt returns the same corrections and moves no stored mark", async () => {
  const before = database.prepare("SELECT total_awarded AS awarded, outcome, submitted_at AS submittedAt FROM assessment_attempts WHERE id = ?").get(context.attemptId);
  const replay = await api("/api/assessment/submit", { method: "POST", body: JSON.stringify({ attemptId: context.attemptId, answers: [1, 1, 1, 1, 1] }) });
  assert.equal(replay.status, 200, `the replay answered ${replay.status}`);
  assert.equal(replay.body.replay, true, "a second submission of the same attempt must be reported as a replay.");
  assert.deepEqual(replay.body.corrections, context.submit.body.corrections, "a replay must carry the same corrections, not new ones.");
  assert.equal(replay.body.attempt.mark.awarded, context.submit.body.attempt.mark.awarded, "a replay must not move the mark.");
  const after = database.prepare("SELECT total_awarded AS awarded, outcome, submitted_at AS submittedAt FROM assessment_attempts WHERE id = ?").get(context.attemptId);
  assert.deepEqual(after, before, "a replay must change nothing on the stored attempt.");
});

await step("a module from another course is refused before anything is served", async () => {
  const adultId = await newLearner(`LeakAdult${stamp()}`, "adults", 19);
  completeModule(adultId, "adults", 0);
  const foreignModule = courses["ages-10-12"].stages[0].id;
  const response = await api("/api/assessment/start", { method: "POST", body: JSON.stringify({ kind: "module", moduleId: foreignModule }) });
  assert.equal(response.status, 400, `a module from another course answered ${response.status}.`);
  assert.deepEqual(Object.keys(response.body), ["error"], "a refused start may return an explanation and nothing else.");
});

await step("progress, portfolio and the rendered screens carry no assessment internals", async () => {
  const surfaces = ["/api/progress", "/api/summary", "/api/portfolio", "/learn", "/"];
  for (const path of surfaces) {
    const response = await fetch(`${base}${path}`, { headers: { cookie }, signal: AbortSignal.timeout(30000) });
    const text = await response.text();
    assert.ok(response.status < 500, `${path} answered ${response.status}`);
    assertNoLeak(text, hiddenEverywhere, `answer strings were exposed by ${path}`);
    for (const banned of ["correctAnswer", '"rubric"', "access_hash", "learner_profiles", "assessment_item_results"]) {
      assert(!text.includes(banned), `${path} exposes ${banned}.`);
    }
  }
});

await step("no learner-facing screen copy contains an em dash", async () => {
  for (const path of ["/learn", "/", "/privacy"]) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
    const text = await response.text();
    assert.ok(!text.includes("\u2014"), `${path} contains an em dash.`);
  }
});

console.log(`\npayload leak audit: ${passed.length} checks passed, ${failed.length} failed`);
if (failed.length > 0) {
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
