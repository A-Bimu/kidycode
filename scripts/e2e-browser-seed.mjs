/*
 * Local-only helper for the browser journeys.
 *
 * It creates a real learner through the real API and then marks activities complete
 * directly in the local D1 store, which is the only way to reach an assessment screen
 * without clicking through an entire course. It refuses to run against anything that is
 * not the local miniflare database, and it prints the session cookie so a browser can
 * hold the same session.
 *
 * Usage: node --import tsx --no-warnings scripts/e2e-browser-seed.mjs <courseId> <completeCount|all> <nickname>
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../lib/course-catalog.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function locateDatabase() {
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

const [courseId, count, nickname] = process.argv.slice(2);
if (!courseId || !courses[courseId]) throw new Error("Pass a real course id.");
if (!count) throw new Error("Pass a completion count, or 'all'.");

const base = process.env.KIDYCODE_E2E_URL || "http://localhost:3001";
const course = courses[courseId];
const age = { "ages-10-12": 11, "ages-13-15": 14, "ages-16-18": 17, adults: 19 }[courseId];

const response = await fetch(`${base}/api/learners`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
});
if (!response.ok) throw new Error(`Learner creation failed with ${response.status}.`);
const session = (response.headers.getSetCookie?.() || []).find((value) => value.startsWith("kidycode_session="));
if (!session) throw new Error("Learner creation returned no session.");
const cookie = session.split(";")[0];
const created = await response.json();
const learnerId = created.learner?.id || created.id;

const total = course.lessons.length;
const howMany = count === "all" ? total : Math.min(Number(count), total);
const database = new DatabaseSync(locateDatabase());
const now = new Date().toISOString();
const insert = database.prepare(`INSERT INTO course_progress
  (learner_id, lesson_id, status, question_correct, reflection, workspace_json, updated_at)
  VALUES (?, ?, 'completed', 1, 'Seeded for the local browser journey.', '{}', ?)
  ON CONFLICT (learner_id, lesson_id) DO UPDATE SET status = 'completed', updated_at = excluded.updated_at`);

for (const lesson of course.lessons.slice(0, howMany)) insert.run(learnerId, lesson.id, now);

console.log(JSON.stringify({
  learnerId,
  cookie,
  courseId,
  completed: howMany,
  total,
  modules: course.stages.length,
  firstModuleId: course.stages[0].id,
  finalAvailable: howMany === total,
}));
