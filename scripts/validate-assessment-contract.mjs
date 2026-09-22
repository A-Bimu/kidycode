/*
 * The Assessment V2 contract, asserted against the source.
 *
 * These checks are the rules that may not be quietly weakened later: the pass marks,
 * the build floor, server-side grading, no executed learner code, the additive
 * migration, client-visible payloads that carry no answer key, no client-supplied
 * authority, idempotent submission, the deletion cascade and the banned words.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  FINAL_BUILD_MARKS,
  FINAL_BUILD_MIN,
  FINAL_DEBUG_MARKS,
  FINAL_KNOWLEDGE_MARKS,
  FINAL_PASS_MARK,
  FINAL_TOTAL,
  MODULE_PASS_MARK,
  MODULE_PRACTICAL_MARKS,
  MODULE_PRACTICAL_MIN,
  MODULE_TOTAL,
  ASSESSMENT_RULES,
} from "../lib/assessment/engine.ts";
import { contentFor } from "../lib/assessment/manifest.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

/* ------------------------------------------------------------- the mark rules -- */

assert.equal(MODULE_TOTAL, 10, "a module assessment is marked out of ten.");
assert.equal(MODULE_PASS_MARK, 7, "a module passes at seven of ten.");
assert.equal(MODULE_PRACTICAL_MARKS, 5, "the module practical task carries five marks.");
assert.equal(MODULE_PRACTICAL_MIN, 3, "the module practical floor is three of five.");
assert.equal(FINAL_TOTAL, 100, "the final assessment is marked out of one hundred.");
assert.equal(FINAL_PASS_MARK, 70, "the final assessment passes at seventy.");
assert.equal(FINAL_KNOWLEDGE_MARKS, 20, "final knowledge carries twenty marks.");
assert.equal(FINAL_DEBUG_MARKS, 30, "final debugging carries thirty marks.");
assert.equal(FINAL_BUILD_MARKS, 50, "the independent build carries fifty marks.");
assert.equal(FINAL_BUILD_MIN, 30, "the independent build floor is thirty of fifty.");

/* ------------------------------------------------------------------ the rules -- */

const rules = ASSESSMENT_RULES.join(" ");
assert(/not timed/i.test(rules), "the assessment must say plainly that it is not timed.");
assert(/reference sheet/i.test(rules), "the reference sheet must be named as allowed.");
assert(/on your own, without AI-generated answers/i.test(rules), "the copy must ask for independent work without AI-generated answers.");
assert(/never treated as cheating/i.test(rules), "a paste or tab change must be stated as never being cheating.");
assert(/does not try to/i.test(rules), "no impossible claim about detecting all external help may be made.");
assert(/retake/i.test(rules), "retakes must be described to the learner.");

/* ------------------------------------------------------------- safe grading --- */

const engineSource = read("lib/assessment/engine.ts");
const gradingSource = read("lib/assessment/grading.ts");
const readers = ["html", "css", "js"].map((name) => read(`lib/assessment/${name}.ts`));
const core = [engineSource, gradingSource, ...readers].join("\n");

/* String literals and comments are stripped before these assertions, so a label shown
 * to a learner (the words eval or document.write in a message) is not mistaken for a
 * call. */
const coreCode = core
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/`(?:[^`\\]|\\.)*`/g, "``");

assert(!/(?<![."'`])\beval\s*\(/.test(coreCode), "the grading path must never call eval.");
assert(!/(?<![."'`])new\s+Function\s*\(/.test(coreCode), "the grading path must never build a function from text.");
assert(!/require\s*\(|child_process|WebAssembly|vm\./.test(coreCode), "the grading path must not reach a process or a virtual machine.");
assert(!/D1Database|cloudflare:workers/.test(coreCode), "the engine must stay pure: no database access.");
assert(!/window\.|document\.(querySelector|createElement|getElementById|addEventListener|write)/.test(coreCode), "the engine must stay pure: no browser access.");
assert(/scanJs/.test(core), "the JavaScript path must read the source structurally.");
assert(/runCheck/.test(gradingSource), "requirements must be decided by the declarative checks.");

/* The one attempt row is written by a conditional update that requires one changed
 * row, which is what makes a repeat submission safe. */
const store = read("lib/assessment/store.ts");
assert(store.includes("WHERE id = ? AND learner_id = ? AND status = 'in_progress'"), "submission must be a conditional update on an open attempt.");
assert(/\(result\.meta\?\.changes \?\? 0\) === 1/.test(store), "submission must require exactly one changed row.");
assert(store.includes("ON CONFLICT (attempt_id, item_id, requirement_id) DO NOTHING"), "item marks must be insert-once.");
assert(store.includes("ON CONFLICT (learner_id, course_id) DO NOTHING"), "a credential must be issued once per learner and course.");
assert(store.includes("COALESCE(assessment_signals.first_saved_at, excluded.first_saved_at)"), "a first save time must be written once.");

/* --------------------------------------------------------- client authority --- */

const apiSource = read("lib/assessment/api.ts");
const routeFiles = [
  "app/api/assessment/start/route.ts",
  "app/api/assessment/state/route.ts",
  "app/api/assessment/autosave/route.ts",
  "app/api/assessment/submit/route.ts",
  "app/api/assessment/signals/route.ts",
];
const routes = routeFiles.map(read).join("\n");

/* Every request schema in the assessment routes is read out and inspected. The client
 * may send an attempt id, answers, code, a stage and coarse signal counts, and nothing
 * that could carry authority. */
const schemaBodies = [...routes.matchAll(/z\.object\(\{([\s\S]*?)\n\}\)/g)].map((match) => match[1]);
assert.ok(schemaBodies.length >= 4, "the assessment routes must declare their request schemas.");
for (const banned of ["courseId", "learnerId", "formId", "score", "passed", "outcome", "marks", "awarded", "total", "passedFlag"]) {
  for (const body of schemaBodies) {
    assert(!new RegExp(`\\b${banned}\\b`).test(body), `no assessment request schema may accept ${banned}.`);
  }
}
assert(routes.includes("authenticateLearner(request)"), "every assessment route must authenticate the learner.");
assert(!/parsed\.data\.courseId/.test(routes), "the course must never come from the request body.");
assert(!/searchParams\.get\("courseId"\)/.test(routes), "the course must never come from the query string.");

/* The client view is built by projection, and the projection never carries the answer
 * key, the explanation or the grading rule. */
assert(/export function toClientKnowledge/.test(engineSource), "knowledge items must pass through a client projection.");
assert(/export function toClientTask/.test(engineSource), "tasks must pass through a client projection.");
const projection = engineSource
  .slice(engineSource.indexOf("export function toClientKnowledge"))
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
assert(!/answer:/.test(projection), "the client projection must not carry the correct answer.");
assert(!/misconceptions/.test(projection), "the client projection must not carry the misconception tags.");
assert(!/check:/.test(projection), "the client projection must not carry the grading rule.");
assert(/requirements: task\.requirements\.map/.test(projection), "only requirement labels and marks reach the client.");
assert(/correctionPayload/.test(apiSource), "corrections are built in one place, after submission.");
assert(!/correctionPayload/.test(read("app/api/assessment/state/route.ts")), "an unfinished attempt must never receive corrections.");

/* --------------------------------------------------------------- the migration -- */

const migrationFiles = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql"));
const creators = migrationFiles.filter((name) => read(`drizzle/${name}`).includes("CREATE TABLE `assessment_attempts`"));
assert.equal(creators.length, 1, "exactly one migration may create the assessment tables.");
const migration = read(`drizzle/${creators[0]}`);
for (const table of [
  "assessment_attempts",
  "assessment_item_results",
  "assessment_defence",
  "assessment_signals",
  "assessment_credentials",
  "assessment_revision_items",
]) {
  assert(migration.includes(`CREATE TABLE \`${table}\``), `the migration must create ${table}.`);
}
assert.equal((migration.match(/CREATE TABLE/g) || []).length, 6, "the assessment migration adds six tables and nothing else.");
assert(!/DROP\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM/i.test(migration), "the assessment migration must be purely additive.");
assert((migration.match(/ON DELETE cascade/g) || []).length >= 8, "every learner-owned assessment table must cascade.");

const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const tags = journal.entries.map((entry) => entry.tag);
assert.equal(tags.length, migrationFiles.length, "every migration file must be listed in the journal.");
for (const tag of tags) {
  assert(migrationFiles.includes(`${tag}.sql`), `the journal lists ${tag}, which has no migration file.`);
}
assert(tags[tags.length - 1] === creators[0].replace(".sql", "") || tags.includes(creators[0].replace(".sql", "")), "the assessment migration must be packaged in the journal.");

/* ------------------------------------------------------------------- deletion -- */

const learnerRoute = read("app/api/learner/route.ts");
for (const table of [
  "assessment_attempts",
  "assessment_item_results",
  "assessment_defence",
  "assessment_signals",
  "assessment_credentials",
  "assessment_revision_items",
]) {
  assert(learnerRoute.includes(`"${table}"`), `permanent deletion must remove ${table}.`);
}

/* ------------------------------------------------------------- fail closed ---- */

assert.equal(contentFor("ages-10-12") === null, true, "a course with no reviewed content must serve no assessment.");
assert(routes.includes("notReady()"), "a route must answer 503 rather than inventing an assessment.");
assert(read("app/api/assessment/submit/route.ts").includes('attempt.courseId !== learner.courseId'), "a submission must belong to the learner's own course.");

/* ---------------------------------------------------------------- brand rules -- */

const assessmentSources = [
  ...readdirSync(resolve(root, "lib/assessment")).map((name) => read(`lib/assessment/${name}`)),
  ...routeFiles.map(read),
].join("\n");
assert(!assessmentSources.includes("\u2014"), "assessment source contains an em dash.");
/* The colour rule is decided from the words a learner can read, and the plan document
 * is a developer note that names the rule itself. */
assert(!/[\u2014]/.test(read("docs/assessment-v2-plan.md")), "the plan document contains an em dash.");
const learnerFacing = [engineSource, apiSource, ...routeFiles.map(read)].join("\n");
assert(!/\bgreen\b/i.test(learnerFacing), "assessment source contains the banned colour name.");

console.log("Validated the Assessment V2 contract: marks and floors, safe server-side grading, no executed learner code, the additive six-table migration, the client projection, no client-supplied authority, idempotent submission, the deletion cascade and the brand rules.");