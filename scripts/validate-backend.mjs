import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const schema = read("db/schema.ts");
const database = read("lib/server-database.ts");
const learners = read("app/api/learners/route.ts");
const progress = read("app/api/progress/route.ts");
const checkpoints = read("app/api/checkpoints/route.ts");
const exam = read("app/api/exam/route.ts");
const migrationPath = resolve(root, "drizzle/0002_good_master_mold.sql");

assert(existsSync(migrationPath), "The additive course-path migration is missing.");
const migration = readFileSync(migrationPath, "utf8").trim();
assert.equal(
  migration,
  "ALTER TABLE `learner_profiles` ADD `course_id` text DEFAULT 'ages-10-12' NOT NULL;",
  "The course migration must preserve old learners and default them to ages 10 to 12.",
);
assert(schema.includes('courseId: text("course_id").notNull().default("ages-10-12")'), "The Drizzle schema does not match the migration.");

for (const courseId of ["ages-10-12", "ages-13-15", "ages-16-18", "adults"]) {
  assert(learners.includes(`"${courseId}"`), `Learner creation is missing ${courseId}.`);
  assert(exam.includes(`"${courseId}"`), `Exam validation is missing ${courseId}.`);
}
for (const exactAgeMap of [
  '"ages-10-12": [10, 11, 12]',
  '"ages-13-15": [13, 14, 15]',
  '"ages-16-18": [16, 17, 18]',
  "adults: [19]",
]) {
  assert(learners.includes(exactAgeMap), `Learner creation is missing age rule: ${exactAgeMap}`);
}

/* The cookie and the key helpers live in one shared module now, used by learner
 * creation, the transfer claim and the reset flow alike. */
const accessKeys = readFileSync(resolve(root, "lib/access-keys.ts"), "utf8");
for (const cookieRule of ["HttpOnly", "Secure", "SameSite=Lax", "Max-Age=15552000"]) {
  assert(accessKeys.includes(cookieRule), `The learner cookie is missing ${cookieRule}.`);
}
assert(accessKeys.includes("crypto.getRandomValues(new Uint8Array(32))"), "Learner access keys must be 32 random bytes.");
assert(learners.includes("sessionCookie(id, accessKey)"), "Learner creation must use the shared cookie builder.");
assert(learners.includes("clearedSessionCookie"), "Clearing a session must use the shared cookie.");
assert(database.includes('course_id AS courseId'), "Authentication must return the learner course.");
assert(database.includes("hashAccessKey(accessKey)"), "Learner access keys must be hashed before lookup.");
assert(readFileSync(resolve(root, "lib/access-keys.ts"), "utf8").includes("sha256Hex(accessKey)"), "Access keys must be hashed with the shared digest.");
assert(!/UPDATE\s+learner_profiles/i.test(database), "Authentication must remain a read-only database operation.");

for (const required of [
  "courses[learner.courseId]",
  "lessonIndex < 0",
  "previousActivityIsComplete",
  "codeChecksPass",
  "data.questionAnswer === lesson.question?.answer",
  "data.quizAnswers.length === questions.length && score >= 4",
  "reflection.trim().length >= 10",
  "course_progress.status = 'completed'",
  "CASE WHEN course_progress.status = 'completed'",
]) {
  assert(progress.includes(required), `Progress protection is missing: ${required}`);
}
assert(progress.includes("questionAnswer"), "Progress must grade the selected quick-check answer on the server.");
assert(progress.includes("quizAnswers"), "Progress must grade all module answers on the server.");
assert(!progress.includes("questionCorrect: z."), "Progress must not trust a client-supplied correctness flag.");

for (const required of [
  "courses[learner.courseId]",
  "parsed.data.project.theme !== learner.theme",
  "projectChecksPass",
  "stage.lessons.every",
  'const id = `${learner.id}:${stage.id}`',
  "ON CONFLICT (id) DO UPDATE SET",
]) {
  assert(checkpoints.includes(required), `Checkpoint protection is missing: ${required}`);
}

for (const required of [
  "parsed.data.courseId !== learner.courseId",
  "course.lessons.every",
  "course.finalExam.reduce",
  "course.practicalExam.requiredPatterns.every",
  "knowledgeScore >= course.courseFacts.passMark && practicalPassed",
]) {
  assert(exam.includes(required), `Final-check protection is missing: ${required}`);
}

const backendSource = [schema, database, learners, progress, checkpoints, exam, migration].join("\n");
assert(!backendSource.includes("—"), "Backend source contains an em dash.");
assert(!/\bgreen\b/i.test(backendSource), "Backend source contains the banned colour name.");

console.log("Validated course-aware profiles, monotonic progress, idempotent checkpoints, final-exam gates and the additive migration.");
