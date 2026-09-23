#!/usr/bin/env node
/*
 * Deterministic starting state for a certificate journey.
 *
 * Creates a real learner through the real API, then writes the evidence a learner would have
 * produced: completed activities, one saved project version per module, a passed course final
 * check, and a submitted Assessment V2 attempt whose figures the server would have written.
 * The certificate itself is never written here: the browser asks for it through the normal
 * interface and the route decides.
 *
 *   node --import tsx --no-warnings scripts/certificate-verify-seed.mjs <courseId> <certified|ready|below> [tag]
 *
 * The three states:
 *   certified  every eligibility condition holds
 *   ready      the course is complete, the assessment is below the pass mark
 *   below      some activities are still incomplete
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../lib/course-catalog.ts";
import { contentFor } from "../lib/assessment/manifest.ts";

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
  if (!file) throw new Error("No local D1 database file was found.");
  return file;
}

const [courseId, state = "certified", tag = "cert"] = process.argv.slice(2);
if (!courseId || !courses[courseId]) throw new Error("Pass a real course id.");
if (!["certified", "ready", "below"].includes(state)) throw new Error("Pass certified, ready or below.");

const course = courses[courseId];
const content = contentFor(courseId);
const form = content.finalForms[0];
const age = { "ages-10-12": 11, "ages-13-15": 14, "ages-16-18": 17, adults: 19 }[courseId];
const nickname = `${tag}${Date.now().toString().slice(-6)}`.slice(0, 20);

const response = await fetch(`${base}/api/learners`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
});
if (!response.ok) throw new Error(`Learner creation failed with ${response.status}.`);
const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
if (!session) throw new Error("Learner creation returned no session.");
const created = await response.json();
const learnerId = created.learner?.id || created.id;

const database = new DatabaseSync(locateDatabase());
const now = new Date().toISOString();

/* Activities. In the "below" state the last module is left untouched, so the course is genuinely
 * unfinished and the passport must say so. */
const lessons = state === "below" ? course.lessons.slice(0, Math.max(course.lessons.length - 2, 1)) : course.lessons;
const progress = database.prepare(`INSERT INTO course_progress
  (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
  VALUES (?, ?, 'completed', 1, 'Recorded for the certificate journey.', '{}', ?)
  ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
for (const lesson of lessons) progress.run(learnerId, lesson.id, now);

/* One saved project version per module. The "below" state saves only the modules it finished. */
const stages = state === "below" ? course.stages.slice(0, 1) : course.stages;
const checkpoint = database.prepare(`INSERT OR REPLACE INTO project_checkpoints
  (id, learner_id, stage_id, version, reflection, project_json, created_at)
  VALUES (?, ?, ?, 1, 'Saved for the certificate journey.', ?, ?)`);
for (const stage of stages) {
  checkpoint.run(
    `${learnerId}-${stage.id}`, learnerId, stage.id,
    JSON.stringify({ html: "<main><h1>My project</h1><img src=\"photo.webp\" alt=\"A finished model\"></main>", css: "body { line-height: 1.6; }", javascript: "" }),
    now,
  );
}

/* The course's own final check, required by the existing completion rule. */
database.prepare(`INSERT INTO exam_attempts
  (id, learner_id, score, total, answers_json, practical_json, passed, created_at)
  VALUES (?, ?, ?, ?, ?, '{}', 1, ?)`)
  .run(crypto.randomUUID(), learnerId, course.finalExam.length, course.finalExam.length, JSON.stringify({ courseId }), now);

/* The submitted Assessment V2 attempt. "ready" is below the pass mark on purpose. */
const score = state === "certified" ? 86 : 48;
const buildAwarded = state === "certified" ? 44 : 22;
const attemptId = `cert-seed-${crypto.randomUUID()}`;
database.prepare(`INSERT INTO assessment_attempts
  (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
   answers_json, code_json, knowledge_awarded, knowledge_total, practical_awarded, practical_total,
   debug_awarded, debug_total, build_awarded, build_total, total_awarded, total_available,
   mandatory_passed, needs_verification, defence_passed, outcome, started_at, saved_at, submitted_at)
  VALUES (?, ?, ?, 'final', NULL, ?, ?, 'submitted', 'review', '{}', '[]', '{}',
    ?, 20, 0, 0, ?, 30, ?, 50, ?, 100, ?, 0, ?, ?, ?, ?, ?)`)
  .run(
    attemptId, learnerId, courseId, form.id, content.contentVersion,
    Math.max(score - 8, 0), Math.max(score - 8, 0) > 0 ? 8 : 0, buildAwarded, score,
    state === "certified" ? 1 : 0,
    state === "certified" ? 1 : 0,
    state === "certified" ? "passed" : "not_passed_yet",
    now, now, now,
  );

console.log(JSON.stringify({
  learnerId,
  cookie: session.split(";")[0],
  attemptId,
  courseId,
  state,
  expected: state === "certified" ? "certified" : state === "ready" ? "ready" : "in-progress",
}));