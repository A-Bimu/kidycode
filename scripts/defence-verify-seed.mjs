#!/usr/bin/env node
/*
 * Deterministic starting state for a Needs verification journey.
 *
 * The route assigns a defence template from the attempt id. This seeder creates a real learner
 * through the real API, marks their course work complete, and then writes ONE in-progress final
 * attempt row into local D1 whose id is chosen so the route assigns a chosen reviewed template.
 * The browser then resumes that attempt and completes it normally; the outcome is still decided by
 * the production grader, and no final status is ever written by this script.
 *
 * It refuses to run against anything but the local database, and it prints the cookie, the attempt
 * id and the template the route will assign, so the harness never guesses.
 *
 *   node --import tsx --no-warnings scripts/defence-verify-seed.mjs <courseId> <templateId> <nickname>
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../lib/course-catalog.ts";
import { contentFor } from "../lib/assessment/manifest.ts";
import { templatesFor } from "../lib/assessment/defence";

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

/* The route's own rule, repeated here so the seeded id can be chosen to land on a template. */
function templateIndexFor(attemptId, count) {
  const total = [...attemptId].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  return total % count;
}

const [courseId, templateId, nickname] = process.argv.slice(2);
if (!courseId || !courses[courseId]) throw new Error("Pass a real course id.");
const owned = templatesFor(courseId);
/* A template may be named outright, or by the kind of change it asks for, which is how a journey
 * asks for one the grader genuinely cannot decide without the learner's own work to compare. */
const wanted = templateId?.startsWith("kind:")
  ? owned.find((template) => template.change.changeRequirement?.kind === templateId.slice(5))
  : owned.find((template) => template.id === templateId);
const targetIndex = wanted ? owned.indexOf(wanted) : -1;
if (targetIndex < 0) {
  throw new Error(`Course ${courseId} has no template ${templateId}. Known: ${owned.map((t) => `${t.id}(${t.change.changeRequirement?.kind})`).join(", ")}`);
}

const age = { "ages-10-12": 11, "ages-13-15": 14, "ages-16-18": 17, adults: 19 }[courseId];
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

const content = contentFor(courseId);
const form = content.finalForms[0];
const course = courses[courseId];
const database = new DatabaseSync(locateDatabase());
const now = new Date().toISOString();

const progress = database.prepare(`INSERT INTO course_progress
  (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
  VALUES (?, ?, 'completed', 1, 'Seeded for the verification journey.', '{}', ?)
  ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);
for (const lesson of course.lessons) progress.run(learnerId, lesson.id, now);

const checkpoint = database.prepare(`INSERT OR REPLACE INTO project_checkpoints
  (id, learner_id, stage_id, version, reflection, project_json, created_at)
  VALUES (?, ?, ?, 1, 'Seeded project version.', '{}', ?)`);
for (const stage of course.stages) checkpoint.run(`${learnerId}-${stage.id}`, learnerId, stage.id, now);

/* Find an id that the route will read as the chosen template. This is a search over identifiers,
 * not a loop of journeys. */
let attemptId = null;
for (let suffix = 0; suffix < 5000; suffix += 1) {
  const candidate = `verify-needs-verification-${suffix}`;
  if (candidate.length >= 6 && candidate.length <= 64 && templateIndexFor(candidate, owned.length) === targetIndex) {
    attemptId = candidate;
    break;
  }
}
if (!attemptId) throw new Error("No identifier could be found for that template.");

const knowledgeTotal = form.knowledge.reduce((total, item) => total + item.marks, 0);
const debugTotal = form.debug.reduce((total, task) => total + task.requirements.reduce((sum, r) => sum + r.marks, 0), 0);
const buildTotal = form.build.requirements.reduce((total, requirement) => total + requirement.marks, 0);

/* One in-progress attempt row. No totals are awarded, no status is decided, and the defence row is
 * not created here: the learner's own submission and the production grader decide everything. */
database.prepare(`INSERT OR REPLACE INTO assessment_attempts
  (id, learner_id, course_id, kind, module_id, form_id, content_version, status, stage, draft_json,
   answers_json, code_json, knowledge_total, practical_total, debug_total, build_total, total_available,
   started_at, saved_at)
  VALUES (?, ?, ?, 'final', NULL, ?, ?, 'in_progress', 'knowledge', '{}', '[]', '{}', ?, 0, ?, ?, ?, ?, ?)`)
  .run(attemptId, learnerId, courseId, form.id, content.contentVersion,
       knowledgeTotal, debugTotal, buildTotal, knowledgeTotal + debugTotal + buildTotal, now, now);

const stored = database.prepare("SELECT id, status FROM assessment_attempts WHERE id = ?").get(attemptId);
const assigned = owned[templateIndexFor(stored.id, owned.length)];

console.log(JSON.stringify({
  learnerId,
  cookie: session.split(";")[0],
  attemptId: stored.id,
  attemptStatus: stored.status,
  templateId: assigned.id,
  templateIndex: templateIndexFor(stored.id, owned.length),
  changeRequirementKind: assigned.change.changeRequirement?.kind ?? null,
  codeJson: "{}",
}));