#!/usr/bin/env node
/*
 * The certificate and Skills Passport journey, against a real server and the real local D1.
 *
 * Every fixture writes only the starting state a learner would have produced (course progress, a
 * module project version and a submitted assessment attempt whose figures the server itself would
 * have written). The certificate itself is never written by this script: it is always requested
 * through POST /api/certification, and the route decides from stored evidence.
 *
 *   KIDYCODE_E2E_URL=http://localhost:3001 node --import tsx --no-warnings scripts/e2e-certification.mjs
 */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { contentFor } from "../lib/assessment/manifest.ts";

const base = process.env.KIDYCODE_E2E_URL || "http://localhost:3001";

function locateDatabase() {
  const directory = resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) throw new Error(`No local D1 store at ${directory}`);
  const file = readdirSync(directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => resolve(directory, name))
    .sort()
    .pop();
  if (!file) throw new Error("No local D1 database file was found.");
  return file;
}

const database = new DatabaseSync(locateDatabase());
const passed = [];
const failures = [];

function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
}

async function step(name, body) {
  if (typeof body !== "function") throw new TypeError("step() needs a body function.");
  try {
    await body();
    check(name);
  } catch (error) {
    failures.push({ name, error });
  }
}

let cookie = "";
async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", cookie, ...(options.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

function kidName(prefix) {
  return `${prefix}${Math.floor(Math.random() * 1e6)}`.slice(0, 20);
}

async function newLearner(nickname, courseId, age) {
  const response = await fetch(`${base}/api/learners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
    signal: AbortSignal.timeout(30000),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  const body = await response.json().catch(() => ({}));
  if (!session) throw new Error(`learner creation returned no session (${response.status})`);
  return { cookie: session.split(";")[0], id: body.learner?.id || body.id, nickname };
}

/* The evidence a learner who finished the course would have: every activity completed, one saved
 * project version per module, and a passed course final check. All three are required by the
 * existing completion calculation, which this phase leaves exactly as it was. */
function completeCourse(learnerId, courseId) {
  const course = courses[courseId];
  const now = new Date().toISOString();
  const progress = database.prepare(`INSERT INTO course_progress
    (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
    VALUES (?, ?, 'completed', 1, 'Done in the journey.', '{}', ?)
    ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
  for (const lesson of course.lessons) progress.run(learnerId, lesson.id, now);
  const checkpoint = database.prepare(`INSERT OR REPLACE INTO project_checkpoints
    (id, learner_id, stage_id, version, reflection, project_json, created_at)
    VALUES (?, ?, ?, 1, 'Saved for the journey.', ?, ?)`);
  for (const stage of course.stages) {
    checkpoint.run(`${learnerId}-${stage.id}`, learnerId, stage.id, JSON.stringify({ html: "<main><h1>Project</h1></main>", css: "", javascript: "" }), now);
  }
  seedV1Exam(learnerId, courseId);
}

/* The course's own final check, which the existing completion rule requires. A V1 pass alone must
 * never certify a learner, which is why the V1 test below relies on this and nothing else. */
function seedV1Exam(learnerId, courseId) {
  const course = courses[courseId];
  database.prepare(`INSERT INTO exam_attempts
    (id, learner_id, score, total, answers_json, practical_json, passed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
    .run(
      crypto.randomUUID(), learnerId, course.finalExam.length, course.finalExam.length,
      JSON.stringify({ courseId }), JSON.stringify({}), new Date().toISOString(),
    );
}

/* A submitted Assessment V2 final attempt with the figures the server writes when it grades. */
function seedFinalAttempt(learnerId, courseId, figures) {
  const content = contentFor(courseId);
  const form = content.finalForms[0];
  const now = new Date().toISOString();
  const id = `journey-${crypto.randomUUID()}`;
  database.prepare(`INSERT INTO assessment_attempts
    (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
     answers_json, code_json, knowledge_awarded, knowledge_total, practical_awarded, practical_total,
     debug_awarded, debug_total, build_awarded, build_total, total_awarded, total_available,
     mandatory_passed, needs_verification, defence_passed, outcome, started_at, saved_at, submitted_at)
    VALUES (?, ?, ?, 'final', NULL, ?, ?, 'submitted', 'review', '{}', '[]', '{}',
      ?, 20, 0, 0, ?, 30, ?, 50, ?, 100, ?, 0, ?, ?, ?, ?, ?)`)
    .run(
      id, learnerId, courseId, form.id, content.contentVersion,
      Math.max(figures.score - 10, 0), Math.max(figures.score - 10, 0) > 0 ? 10 : 0,
      figures.buildAwarded, figures.score,
      figures.mandatory ? 1 : 0,
      figures.defence === "passed" ? 1 : 0,
      figures.outcome || (figures.defence === "passed" ? "passed" : "not_passed_yet"),
      now, now, now,
    );
  return id;
}

function credentialRows(learnerId) {
  return database.prepare("SELECT id, level, issued_at AS issuedAt, attempt_id AS attemptId FROM assessment_credentials WHERE learner_id = ?").all(learnerId);
}

/* A guardian is identified by the platform headers only, exactly as the app reads them. */
function guardianHeaders(tag) {
  return {
    "oai-authenticated-user-id": `journey-guardian-${tag}`,
    "oai-authenticated-user-email": `guardian-${tag}@example.com`,
    "oai-authenticated-user-full-name": "Guardian Journey",
  };
}

const FORBIDDEN = [
  "answers", "answersJson", "codeJson", "code_json", "explainResponse", "predictChoice",
  "visibilityChanges", "pasteEvents", "largestPasteChars", "attemptId", "attempt_id",
  "learnerId", "learner_id", "needsVerification", "scoreJson", "sha256", "digest",
  "accessHash", "sessionId", "<main>", "html", "javascript",
];

function leaks(value) {
  const text = JSON.stringify(value);
  return FORBIDDEN.filter((token) => text.includes(token));
}

/* ------------------------------------------------------------------ the rule -- */

await step("course completed with no Assessment V2 attempt cannot be certified", async () => {
  const learner = await newLearner(kidName("CertNoCheck"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  cookie = learner.cookie;
  const read = await api("/api/certification");
  assert.equal(read.status, 200, `read answered ${read.status}`);
  assert.equal(read.body.certification.eligible, false);
  assert.equal(read.body.certification.status, "ready");
  assert.deepEqual(read.body.certification.missing.map((gate) => gate.id), ["assessment", "build", "mandatory", "defence"]);
  assert.equal(read.body.certificate, null, "reading must never issue a certificate");
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `a certificate was issued without an assessment (${issue.status})`);
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("a historical V1 learner is never certified retroactively", async () => {
  const learner = await newLearner(kidName("CertV1"), "ages-13-15", 14);
  /* Exactly what a V1 learner has: a completed course with a passed final check, and no
   * Assessment V2 attempt at all. */
  completeCourse(learner.id, "ages-13-15");
  cookie = learner.cookie;
  const read = await api("/api/certification");
  assert.equal(read.body.certification.status, "ready", "the course is complete, so the learner is ready");
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `V1 completion alone certified a learner (${issue.status})`);
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("an assessment below the pass mark cannot be certified", async () => {
  const learner = await newLearner(kidName("CertLow"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 69, buildAwarded: 40, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `69 out of 100 was accepted (${issue.status})`);
  const read = await api("/api/certification");
  assert.ok(read.body.certification.missing.some((gate) => gate.id === "assessment"));
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("an independent build below its own floor cannot be certified", async () => {
  const learner = await newLearner(kidName("CertBuild"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 96, buildAwarded: 29, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `a weak build with a high total was accepted (${issue.status})`);
  const read = await api("/api/certification");
  assert.ok(read.body.certification.missing.some((gate) => gate.id === "build"));
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("a failed mandatory check cannot be overridden by a high total", async () => {
  const learner = await newLearner(kidName("CertMand"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 100, buildAwarded: 50, mandatory: false, defence: "passed" });
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `a failed mandatory check was overridden (${issue.status})`);
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("Not passed yet on the defence cannot be certified", async () => {
  const learner = await newLearner(kidName("CertDef"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 94, buildAwarded: 46, mandatory: true, defence: "not_passed" });
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `a failed defence was certified (${issue.status})`);
  const read = await api("/api/certification");
  assert.equal(read.body.certification.status, "ready", "the learner must still be told the course is complete");
  assert.equal(read.body.passport.defence.label, "Code defence not passed yet");
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("a retryable technical defence state neither issues nor denies", async () => {
  const learner = await newLearner(kidName("CertTech"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  const attemptId = seedFinalAttempt(learner.id, "ages-10-12", { score: 90, buildAwarded: 44, mandatory: true, defence: "none" });
  /* An unfinished defence row, exactly as the route leaves one when a change cannot be checked. */
  database.prepare(`INSERT INTO assessment_defence
    (attempt_id, learner_id, course_id, template_id, explain_item_id, predict_item_id, predict_expected,
     change_item_id, change_prompt, explain_response, predict_response, change_code_json, predict_correct,
     change_status, status, created_at, updated_at)
    VALUES (?, ?, ?, 'ages-10-12-defence-1', 'explain-1', 'predict-1', '0', 'change-1',
      'Make one small change.', 'A saved explanation.', '0', '{}', 0, 'pending', 'pending', ?, ?)`)
    .run(attemptId, learner.id, "ages-10-12", new Date().toISOString(), new Date().toISOString());
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 403, `an unfinished defence issued a certificate (${issue.status})`);
  const read = await api("/api/certification");
  assert.equal(read.body.passport.defence.status, "pending");
  assert.equal(read.body.certification.nextAction.label, "Complete your code defence");
  assert.equal(credentialRows(learner.id).length, 0);
});

await step("every condition satisfied issues the certificate", async () => {
  const learner = await newLearner(kidName("CertOk"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 88, buildAwarded: 44, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(issue.status, 200, `issue answered ${issue.status}: ${JSON.stringify(issue.body).slice(0, 200)}`);
  assert.equal(issue.body.issued, true);
  const rows = credentialRows(learner.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].level, "Web Creator");
  assert.equal(issue.body.certificate.credentialId, rows[0].id);
  assert.match(rows[0].id, /^KC-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]{4,}$/);
  assert.equal(issue.body.certificate.certificateName, "KidyCode Applied Web Skills Certificate");
  assert.ok(issue.body.certificate.learnerFirstName.length > 0, "the certificate names the learner");
  assert.ok(issue.body.certificate.issuedAt === rows[0].issuedAt, "the printed date is the stored date");
  assert.ok(issue.body.certificate.skills.length > 0, "the certificate lists demonstrated skills");
  assert.ok(!JSON.stringify(issue.body.certificate).includes("88"), "raw marks must not reach the printed record");
});

await step("a repeated request returns the same credential, without minting another", async () => {
  const learner = await newLearner(kidName("CertRepeat"), "ages-13-15", 14);
  completeCourse(learner.id, "ages-13-15");
  seedFinalAttempt(learner.id, "ages-13-15", { score: 91, buildAwarded: 47, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const first = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  const second = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.alreadyHeld, true);
  assert.equal(second.body.certificate.credentialId, first.body.certificate.credentialId);
  assert.equal(second.body.certificate.issuedAt, first.body.certificate.issuedAt);
  assert.equal(credentialRows(learner.id).length, 1, "a repeat must not create a second credential");
});

await step("concurrent requests create exactly one credential with one id", async () => {
  const learner = await newLearner(kidName("CertRace"), "ages-16-18", 17);
  completeCourse(learner.id, "ages-16-18");
  seedFinalAttempt(learner.id, "ages-16-18", { score: 90, buildAwarded: 45, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const responses = await Promise.all(
    Array.from({ length: 5 }, () => api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) })),
  );
  const ids = new Set(responses.map((response) => response.body.certificate?.credentialId));
  assert.ok(responses.every((response) => response.status === 200), `a concurrent request failed: ${responses.map((r) => r.status).join(",")}`);
  assert.equal(ids.size, 1, `concurrent requests produced ${ids.size} different ids`);
  const rows = credentialRows(learner.id);
  assert.equal(rows.length, 1, `concurrent requests produced ${rows.length} rows`);
  assert.equal([...ids][0], rows[0].id);
});

await step("all four courses receive their exact level", async () => {
  const expected = {
    "ages-10-12": "Web Creator",
    "ages-13-15": "Web Builder",
    "ages-16-18": "Web Application Builder",
    adults: "Business Website Builder",
  };
  const ages = { "ages-10-12": 11, "ages-13-15": 14, "ages-16-18": 17, adults: 19 };
  for (const [courseId, level] of Object.entries(expected)) {
    const learner = await newLearner(kidName("CertLvl"), courseId, ages[courseId]);
    completeCourse(learner.id, courseId);
    seedFinalAttempt(learner.id, courseId, { score: 86, buildAwarded: 43, mandatory: true, defence: "passed" });
    cookie = learner.cookie;
    const issue = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
    assert.equal(issue.status, 200, `${courseId} could not be certified (${issue.status})`);
    assert.equal(issue.body.certificate.level, level, `${courseId} produced the wrong level`);
    assert.equal(credentialRows(learner.id)[0].level, level);
  }
});

await step("the browser cannot choose the level, the date, the id or the result", async () => {
  const learner = await newLearner(kidName("CertClient"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 88, buildAwarded: 44, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const bodies = [
    { action: "issue", level: "Business Website Builder" },
    { action: "issue", issuedAt: "2020-01-01T00:00:00.000Z" },
    { action: "issue", credentialId: "KC-AAAA-BBBB-CCCC" },
    { action: "issue", score: 100 },
    { action: "issue", result: "passed" },
    { action: "issue", defence: "passed" },
    { action: "issue", eligible: true },
    { action: "issue", mandatoryPassed: true },
  ];
  for (const body of bodies) {
    const response = await api("/api/certification", { method: "POST", body: JSON.stringify(body) });
    assert.equal(response.status, 400, `a client-supplied ${Object.keys(body).join(",")} was accepted (${response.status})`);
  }
  assert.equal(credentialRows(learner.id).length, 0, "a refused request must not issue anything");
  const honest = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(honest.status, 200);
  assert.equal(honest.body.certificate.level, "Web Creator", "the level still comes from the course");
  assert.notEqual(honest.body.certificate.issuedAt, "2020-01-01T00:00:00.000Z");
  assert.notEqual(honest.body.certificate.credentialId, "KC-AAAA-BBBB-CCCC");
});

await step("another learner cannot read a certificate or a passport that is not theirs", async () => {
  const holder = await newLearner(kidName("CertMine"), "ages-10-12", 11);
  completeCourse(holder.id, "ages-10-12");
  seedFinalAttempt(holder.id, "ages-10-12", { score: 90, buildAwarded: 45, mandatory: true, defence: "passed" });
  cookie = holder.cookie;
  const issued = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  const credentialId = issued.body.certificate.credentialId;

  const other = await newLearner(kidName("CertOther"), "ages-10-12", 11);
  cookie = other.cookie;
  const read = await api("/api/certification");
  assert.equal(read.status, 200);
  assert.equal(read.body.certificate, null, "a learner must not see someone else's certificate");
  assert.ok(!JSON.stringify(read.body).includes(credentialId), "another learner's credential id leaked");
  const attempt = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(attempt.status, 403, "a learner with no evidence must not be able to claim one");
  assert.equal(credentialRows(other.id).length, 0);
});

await step("no certificate or passport response leaks private material", async () => {
  const learner = await newLearner(kidName("CertLeak"), "ages-16-18", 17);
  completeCourse(learner.id, "ages-16-18");
  seedFinalAttempt(learner.id, "ages-16-18", { score: 92, buildAwarded: 46, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  const read = await api("/api/certification");
  const issued = await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  const summary = await api("/api/summary");
  for (const [name, payload] of [["read", read.body], ["issued", issued.body], ["summary", summary.body]]) {
    const found = leaks({ certification: payload.certification, passport: payload.passport, certificate: payload.certificate });
    assert.deepEqual(found, [], `the ${name} payload leaked ${found.join(", ")}`);
  }
});

await step("an unrelated guardian cannot read the summary, and a linked one reads only allowed facts", async () => {
  const learner = await newLearner(kidName("CertGuard"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 89, buildAwarded: 45, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });

  const strangers = await fetch(`${base}/api/guardian/summary?link=anything`, { headers: guardianHeaders("stranger") });
  assert.equal(strangers.status, 403, `an unrelated guardian read a summary (${strangers.status})`);

  const code = await api("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(code.status, 200, `a connect code could not be created (${code.status})`);
  const claim = await fetch(`${base}/api/guardian/links`, {
    method: "POST",
    headers: { "content-type": "application/json", ...guardianHeaders("linked") },
    body: JSON.stringify({ code: code.body.issuedCode }),
    signal: AbortSignal.timeout(30000),
  });
  const claimed = await claim.json();
  assert.equal(claim.status, 200, `the guardian could not connect (${claim.status})`);
  const linkRef = claimed.learner.linkRef;

  const summary = await fetch(`${base}/api/guardian/summary?link=${encodeURIComponent(linkRef)}`, { headers: guardianHeaders("linked") });
  const body = await summary.json();
  assert.equal(summary.status, 200, `the linked guardian could not read (${summary.status})`);

  const { GUARDIAN_SUMMARY_KEYS, GUARDIAN_FORBIDDEN_KEYS, collectKeys } = await import("../lib/guardian-view.ts");
  /* The allow list governs the shape of the summary; the forbidden list governs everything,
   * at every depth. */
  const unexpected = Object.keys(body.summary).filter((key) => !GUARDIAN_SUMMARY_KEYS.includes(key));
  assert.deepEqual(unexpected, [], `the guardian summary carried unexpected keys: ${unexpected.join(", ")}`);
  assert.ok(collectKeys(body.summary).length > 5, "the key collector must actually walk the payload");
  const present = GUARDIAN_FORBIDDEN_KEYS.filter((key) => new RegExp(`"${key}"\\s*:`).test(JSON.stringify(body)));
  assert.deepEqual(present, [], `the guardian summary carried forbidden keys: ${present.join(", ")}`);
  assert.deepEqual(leaks(body), [], `the guardian summary leaked ${leaks(body).join(", ")}`);
  assert.equal(body.summary.certificate.certificateName, "KidyCode Applied Web Skills Certificate");
  assert.equal(body.summary.certificate.level, "Web Creator");
  assert.equal(body.summary.certificate.status, "certified");
  assert.equal(body.summary.certificate.courseComplete, true);
  assert.ok(!JSON.stringify(body.summary.certificate).includes("KC-"), "the credential id must not reach a guardian");
  assert.ok(!Object.keys(body.summary.certificate).includes("credentialId"));

  /* Revoking the connection removes access immediately. */
  const revoke = await fetch(`${base}/api/guardian/links`, {
    method: "DELETE",
    headers: { "content-type": "application/json", ...guardianHeaders("linked") },
    body: JSON.stringify({ linkRef }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(revoke.status, 200, `the connection could not be revoked (${revoke.status})`);
  const after = await fetch(`${base}/api/guardian/summary?link=${encodeURIComponent(linkRef)}`, { headers: guardianHeaders("linked") });
  assert.equal(after.status, 403, `a revoked guardian still read the summary (${after.status})`);
});

await step("the adult course offers no guardian controls", async () => {
  const adult = await newLearner(kidName("CertAdult"), "adults", 19);
  cookie = adult.cookie;
  const read = await api("/api/guardian/connections");
  assert.equal(read.status, 409, `an adult was offered guardian controls (${read.status})`);
  const create = await api("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(create.status, 409, `an adult could create a connect code (${create.status})`);
});

await step("permanent deletion removes the credential with the learner", async () => {
  const learner = await newLearner(kidName("CertDel"), "ages-10-12", 11);
  completeCourse(learner.id, "ages-10-12");
  seedFinalAttempt(learner.id, "ages-10-12", { score: 87, buildAwarded: 44, mandatory: true, defence: "passed" });
  cookie = learner.cookie;
  await api("/api/certification", { method: "POST", body: JSON.stringify({ action: "issue" }) });
  assert.equal(credentialRows(learner.id).length, 1);
  const deleted = await api("/api/learner", { method: "DELETE", body: JSON.stringify({ confirm: "delete my profile" }) });
  assert.equal(deleted.status, 200, `deletion answered ${deleted.status}`);
  assert.equal(credentialRows(learner.id).length, 0, "the credential survived the learner");
  const orphans = database.prepare("SELECT COUNT(*) AS total FROM assessment_credentials WHERE learner_id = ?").get(learner.id).total;
  assert.equal(orphans, 0);
  const stranded = await api("/api/certification");
  assert.equal(stranded.status, 401, "a deleted learner must stop reading their certificate");
});

console.log("\ncertification journey");
for (const name of passed) console.log(`  ok   ${name}`);
for (const failure of failures) {
  console.log(`  FAIL ${failure.name}`);
  console.log(`       ${failure.error && failure.error.message ? failure.error.message : failure.error}`);
}
console.log(`\ncertification: ${passed.length} checks passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);