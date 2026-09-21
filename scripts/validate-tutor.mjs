import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { MAX_DUE_ITEMS, RETIRE_STREAK } from "../lib/review.ts";
import { pathwayConceptRules } from "../lib/tutor-concepts.ts";
import {
  MASTERY_WEIGHTS,
  MAX_STRUGGLES,
  checkCount,
  conceptFor,
  conceptRules,
  failsFor,
  firstFailure,
  focusArea,
  gradeRequirements,
  levelForFails,
  masteryFrom,
  masteryLabel,
  mergeStruggles,
  nudgeFor,
  quizFeedback,
  quickCheckFeedback,
  requirementsPassed,
  termFocus,
} from "../lib/tutor.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const courseList = Object.values(courses);
const allLessons = courseList.flatMap((course) => course.lessons);
const allTests = allLessons.flatMap((lesson) => lesson.tests);
const emptyFiles = { html: "", css: "", javascript: "" };

/* 1. Every requirement in every course maps to a named concept, so a nudge can
 *    always point at the real requirement instead of a generic reply. */
assert(allTests.length > 500, "The tutor must be validated against the whole curriculum.");
const unmatched = allTests.filter((codeTest) => conceptFor(codeTest.label).key === "general-requirement");
assert.equal(unmatched.length, 0, `${unmatched.length} course requirements have no tutor concept.`);

/* 2. The first hint never reveals the answer. */
for (const rule of [...conceptRules, ...pathwayConceptRules]) {
  assert(rule.hint.length > 30, `${rule.key} needs a useful first hint.`);
  assert(rule.explanation.length > 40 && rule.explanation !== rule.hint, `${rule.key} needs a clearer second explanation.`);
  assert(rule.focus.length > 0 && rule.focus.length <= 40, `${rule.key} needs a short focus label.`);
  assert(!rule.hint.includes("—") && !rule.explanation.includes("—"), `${rule.key} contains an em dash.`);
  assert(!/\bgreen\b/i.test(`${rule.hint}${rule.explanation}${rule.example}${rule.acknowledgement}`),
    `${rule.key} mentions the banned colour name.`);
  assert(!/<[a-z]+[^>]*>/i.test(rule.hint), `${rule.key} shows markup in the first hint.`);
  assert(!rule.hint.includes("{"), `${rule.key} shows code braces in the first hint.`);
  if (rule.example) {
    assert(!rule.hint.includes(rule.example), `${rule.key} leaks its example in the first hint.`);
  }
}

/* 3. Grading reads the lesson definition on the server, so an empty workspace
 *    never passes and a correct answer is accepted. */
const headingLesson = courses["ages-10-12"].lessons.find((lesson) => lesson.id === "html-foundations-elements");
assert(headingLesson, "The ages 10 to 12 starter lesson is missing.");
const emptyResults = gradeRequirements(headingLesson, emptyFiles);
assert.equal(emptyResults.length, headingLesson.tests.length, "Grading must cover every requirement.");
assert.equal(emptyResults.every((result) => !result.passed), true, "An empty workspace cannot pass.");
assert.equal(requirementsPassed(emptyResults), false, "An empty workspace must not report a pass.");
assert.equal(requirementsPassed([]), false, "An activity with no requirements must not report a pass.");
const correctWorkspace = gradeRequirements(headingLesson, { ...emptyFiles, html: "<h1>My First Website</h1>" });
assert.equal(requirementsPassed(correctWorkspace), true, "Correct code must be accepted.");
const wrongWorkspace = gradeRequirements(headingLesson, { ...emptyFiles, html: "<h2>My First Website</h2>" });
assert.equal(requirementsPassed(wrongWorkspace), false, "The wrong element must not be accepted.");
assert.equal(wrongWorkspace[0].concept, conceptFor(headingLesson.tests[0].label).key,
  "A graded requirement must carry its concept.");

/* 4. Support gets clearer as the same mistake repeats. */
const imageTest = allTests.find((codeTest) => conceptFor(codeTest.label).key === "image-description");
assert(imageTest, "The image description requirement is missing from the curriculum.");
const requirement = { label: imageTest.label, file: imageTest.file, concept: conceptFor(imageTest.label).key, passed: false };
const firstNudge = nudgeFor(requirement, 0);
const secondNudge = nudgeFor(requirement, 1);
const thirdNudge = nudgeFor(requirement, 2);
assert.equal(levelForFails(0), 1, "The first failure must give the smallest hint.");
assert.equal(levelForFails(1), 2, "A second failure must give a clearer explanation.");
assert.equal(levelForFails(4), 3, "A repeated failure must show a related example.");
assert.deepEqual([firstNudge.level, secondNudge.level, thirdNudge.level], [1, 2, 3]);
assert.notEqual(firstNudge.message, secondNudge.message, "Each level must say something more helpful.");
assert.notEqual(secondNudge.message, thirdNudge.message, "Each level must say something more helpful.");
assert.equal(firstNudge.example, "", "The first level must not show an example.");
assert(thirdNudge.example.length > 0, "The final level must show a small related example.");
assert.equal(firstNudge.focus, thirdNudge.focus, "The focus area must stay stable across levels.");

/* 5. Support follows the learner's own attempts. */
assert.equal(failsFor([{ concept: "nesting", label: "x", fails: 2 }], "nesting"), 2);
assert.equal(failsFor([], "nesting"), 0);

/* 6. Struggling concepts are tracked safely and cleared when they pass. */
const struggles = mergeStruggles([], [
  { label: "A", file: "html", concept: "a", passed: false },
  { label: "B", file: "css", concept: "b", passed: false },
]);
assert.equal(struggles.length, 2);
assert.equal(mergeStruggles(struggles, [{ label: "A", file: "html", concept: "a", passed: true }]).length, 1,
  "A concept that now passes must leave the struggle list.");
assert.equal(mergeStruggles(struggles, [{ label: "A", file: "html", concept: "a", passed: true }])[0].concept, "b");
assert.equal(mergeStruggles(struggles, [{ label: "A", file: "html", concept: "a", passed: false }])[0].fails, 2,
  "A repeated failure must increase the recorded count.");
const many = mergeStruggles([], Array.from({ length: 20 }, (unused, index) => ({
  label: `A very long requirement label number ${index}`,
  file: "html",
  concept: `concept-${index}`,
  passed: false,
})));
assert.equal(many.length, MAX_STRUGGLES, "The struggle list must stay bounded.");
assert(many.every((entry) => entry.label.length <= 140 && entry.concept.length <= 60),
  "Stored struggle labels must stay inside their length limits.");
assert.equal(focusArea([{ concept: "a", label: imageTest.label, fails: 3 }]), conceptFor(imageTest.label).focus);
assert.equal(focusArea([{ concept: "a", label: imageTest.label, fails: 1 }, { concept: "b", label: headingLesson.tests[0].label, fails: 4 }]),
  conceptFor(headingLesson.tests[0].label).focus, "The focus area must follow the most repeated struggle.");
assert.equal(focusArea([]), "", "A learner with no struggles must have no focus area.");
assert.equal(firstFailure([{ label: "ok", file: "html", concept: "x", passed: true }]), null);

/* 7. Mastery only rises when new evidence arrives, and it is measured against
 *    the checks the activity actually offers. */
const codeOnly = { requirementsPassed: false, quickCheckPassed: false, bestQuizScore: 0, quizTotal: 0, alreadyPassedCode: false, alreadyPassedQuickCheck: false, codeOffered: true, quickCheckOffered: false };
assert.equal(masteryFrom(codeOnly), 0, "No evidence must give no mastery.");
assert.equal(masteryFrom({ ...codeOnly, requirementsPassed: true }), 100, "An activity that only offers a code check must reach full mastery.");
assert.equal(masteryFrom({ ...codeOnly, codeOffered: false, quickCheckOffered: false, quizTotal: 0 }), 0, "An activity with no checks must not report mastery.");
const challenge = { requirementsPassed: true, quickCheckPassed: true, bestQuizScore: 0, quizTotal: 0, alreadyPassedCode: false, alreadyPassedQuickCheck: false, codeOffered: true, quickCheckOffered: true };
assert.equal(masteryFrom(challenge), 100, "Passing every offered check must reach full mastery.");
assert.equal(masteryFrom({ ...challenge, requirementsPassed: false }), 25, "Mastery must weight each check by what it proves.");
assert.equal(masteryFrom({ ...challenge, alreadyPassedCode: true, alreadyPassedQuickCheck: true }),
  100, "A repeated success must not raise mastery further.");
const quizOnly = { requirementsPassed: false, quickCheckPassed: false, bestQuizScore: 5, quizTotal: 5, alreadyPassedCode: false, alreadyPassedQuickCheck: false, codeOffered: false, quickCheckOffered: false };
assert.equal(masteryFrom(quizOnly), 100, "A full module check must reach full mastery.");
assert.equal(masteryFrom({ ...quizOnly, bestQuizScore: 4 }), 80, "Four of five must show the work still to do.");
assert.equal(masteryFrom({ ...quizOnly, bestQuizScore: 99 }), 100, "A quiz score above the total must be clamped.");
assert(masteryFrom(quizOnly) <= 100, "Mastery must never exceed one hundred.");
assert(MASTERY_WEIGHTS.code > 0 && MASTERY_WEIGHTS.quickCheck > 0 && MASTERY_WEIGHTS.quiz > 0,
  "Every kind of check must carry weight in the mastery score.");
assert.equal(masteryLabel(0), "Not started");
assert.equal(masteryLabel(100), "Mastered");

/* 8. Checks completed is a count of real milestones, never a precision figure. */
assert.equal(checkCount({ codePassed: true, quickCheckPassed: false, bestQuizScore: 0, quizTotal: 0, quickCheckOffered: true, quizOffered: false }), 1);
assert.equal(checkCount({ codePassed: true, quickCheckPassed: true, bestQuizScore: 0, quizTotal: 0, quickCheckOffered: true, quizOffered: false }), 2);
assert.equal(checkCount({ codePassed: true, quickCheckPassed: true, bestQuizScore: 3, quizTotal: 5, quickCheckOffered: true, quizOffered: true }), 2,
  "A module check below four of five must not count as completed.");
assert.equal(checkCount({ codePassed: true, quickCheckPassed: true, bestQuizScore: 4, quizTotal: 5, quickCheckOffered: true, quizOffered: true }), 3,
  "Four of five must count as a completed module check.");
assert.equal(checkCount({ codePassed: true, quickCheckPassed: true, bestQuizScore: 5, quizTotal: 0, quickCheckOffered: true, quizOffered: false }), 2,
  "Checks cannot exceed the checks this activity offers.");
assert.equal(checkCount({ codePassed: false, quickCheckPassed: false, bestQuizScore: 5, quizTotal: 5, quickCheckOffered: false, quizOffered: true }), 1,
  "An activity without a quick check must not count one.");

/* 9. Written questions give specific feedback. */
const quizLesson = allLessons.find((lesson) => lesson.activityType === "quiz");
assert(quizLesson && quizLesson.questions.length === 5, "A module check with five questions is missing.");
const quizQuestions = quizLesson.questions;
const allWrong = quizFeedback(quizLesson, quizQuestions, quizQuestions.map(() => -1));
assert.equal(allWrong.correct.length, 0);
assert.equal(allWrong.missed.length, quizQuestions.length, "Every unanswered question must be reported as missed.");
assert(allWrong.focus.length > 0 && allWrong.focus.length <= 3, "Missed questions must produce a short focus list.");
assert(allWrong.focus.every((item) => typeof item === "string" && item.length > 0), "Focus labels must be readable.");
const allRight = quizFeedback(quizLesson, quizQuestions, quizQuestions.map((question) => question.answer));
assert.equal(allRight.correct.length, quizQuestions.length);
assert.equal(allRight.missed.length, 0);
assert.equal(allRight.focus.length, 0);
const quickQuestion = allLessons.find((lesson) => lesson.question).question;
const rightFeedback = quickCheckFeedback(quickQuestion, quickQuestion.answer);
const wrongFeedback = quickCheckFeedback(quickQuestion, (quickQuestion.answer + 1) % 3);
assert.equal(rightFeedback.correct, true);
assert.equal(wrongFeedback.correct, false);
assert.notEqual(wrongFeedback.message, rightFeedback.message);
assert(wrongFeedback.message.includes(quickQuestion.explanation), "A wrong answer must point back at the idea.");
const termLesson = allLessons.find((lesson) => lesson.keyTerms.length > 0 && lesson.question);
const sampleTerm = termLesson.keyTerms[0];
assert.equal(termFocus(termLesson, `This is about ${sampleTerm} in the notes.`), sampleTerm,
  "A question must be matched to the lesson term it is about.");
assert.equal(termFocus(termLesson, "Nothing recognisable here."), "",
  "An unrelated question must not invent a focus term.");

/* 10. Stored evidence cannot hold learner code, and the database owns the rules
 *     that stop mastery being inflated and completion being double counted. */
const schema = read("db/schema.ts");
const evidence = read("lib/evidence.ts");
const tutorRoute = read("app/api/tutor/route.ts");
const progressRoute = read("app/api/progress/route.ts");
const migration = read("drizzle/0003_closed_winter_soldier.sql");
const tutorSource = [schema, evidence, tutorRoute, migration].join("\n");

for (const table of ["lesson_evidence", "tutor_interventions"]) {
  assert(migration.includes(`CREATE TABLE \`${table}\``), `The migration is missing ${table}.`);
  assert(schema.includes(`"${table}"`), `The Drizzle schema is missing ${table}.`);
}
const evidenceTable = migration.slice(migration.indexOf("CREATE TABLE `lesson_evidence`"), migration.indexOf("CREATE TABLE `tutor_interventions`"));
const interventionTable = migration.slice(migration.indexOf("CREATE TABLE `tutor_interventions`"));
for (const table of [evidenceTable, interventionTable]) {
  for (const banned of ["html", "css", "javascript", "workspace", "source_code", "learner_code"]) {
    assert(!new RegExp(`\`${banned}`, "i").test(table), `Tutoring history must not store ${banned}.`);
  }
}
assert(interventionTable.includes("requirement_json"), "Interventions must store requirement labels only.");
assert(migration.includes("ON DELETE cascade"), "Evidence must be removed with its learner profile.");
assert(evidence.includes("learner_id = ? AND lesson_id = ?"), "Evidence reads must be scoped to one learner.");
assert(evidence.includes("WHERE learner_id = ?"), "Evidence reads must be scoped to one learner.");
assert(evidence.includes("MAX(lesson_evidence.mastery, excluded.mastery)"), "Mastery must never fall.");
assert(evidence.includes("COALESCE(lesson_evidence.code_passed_at, excluded.code_passed_at)"), "A code pass must be recorded once.");
assert(evidence.includes("COALESCE(lesson_evidence.completed_at, excluded.completed_at)"), "Lesson completion must be recorded once.");
assert(evidence.includes("MAX(lesson_evidence.successful_checks, excluded.successful_checks)"), "Completed checks must never be counted twice.");
assert(evidence.includes("MIN(lesson_evidence.attempts + excluded.attempts"), "Attempts must increase without exceeding the limit.");

assert(tutorRoute.includes("courses[learner.courseId]"), "The tutor must read the learner course.");
assert(tutorRoute.includes("lessonIndex < 0"), "The tutor must verify the lesson belongs to the learner course.");
assert(tutorRoute.includes("previousActivityIsComplete"), "The tutor must enforce lesson progression on the server.");
assert(tutorRoute.includes("authenticateLearner(request)"), "The tutor must authenticate the learner.");
assert(/if \(!learner\) return unauthorized\(\)/.test(tutorRoute), "The tutor must refuse an unauthenticated request.");
assert(tutorRoute.includes("learner.id"), "Tutor records must be associated with the authenticated learner.");
assert(tutorRoute.includes("insertIntervention(database, learner.id, lesson.id"), "Interventions must be stored against the learner.");
assert(tutorRoute.includes("markLatestInterventionIndependent"), "Independent corrections must be recorded from evidence.");
assert(tutorRoute.includes("requirements: results.filter((result) => !result.passed).map((result) => result.label)"),
  "Interventions must store failed requirement labels and nothing else.");
const requestSchema = tutorRoute.slice(tutorRoute.indexOf("const tutorSchema"), tutorRoute.indexOf("function quizTotalFor"));
assert(!requestSchema.includes("passed"), "The tutor request must not accept a pass claim from the browser.");
assert(!parsedPassIsRead(tutorRoute), "The tutor must not read a pass result from the request.");
function parsedPassIsRead(source) {
  return /parsed\.data\.passed|body\.passed|payload\.passed/.test(source);
}
assert(tutorRoute.includes('z.string().min(1).max(160)'), "Lesson ids must be validated and limited.");
assert(tutorRoute.includes("z.string().max(20000)"), "Workspace fields must be length limited.");
assert(tutorRoute.includes("z.array(z.number().int().min(0).max(2)).max(5)"), "Quiz answers must be validated and limited.");
assert(tutorRoute.includes("gradeRequirements(lesson, data.workspace)"), "Code requirements must be graded on the server.");
assert(progressRoute.includes("gradeRequirements"), "Completion evidence must be graded on the server.");
assert(progressRoute.includes("completedAt: now"), "Completion must record a completion timestamp.");
assert(progressRoute.includes("attemptIncrement: 0"), "Autosaved drafts must not inflate attempt counts.");

const interfaceSource = read("components/LearningApp.tsx");
assert(interfaceSource.includes("Give me a nudge"), "Practice must offer a nudge.");
assert(interfaceSource.includes('"Another nudge"'), "Later requests must become another nudge.");
assert(interfaceSource.includes("checks passed"), "The interface must show checks completed as a count.");
assert(interfaceSource.includes("requestTutor") && interfaceSource.includes("return null"),
  "A failing tutor must return safely instead of blocking the lesson.");
assert(!interfaceSource.includes("allow-same-origin"), "Learner previews must not receive same-origin access.");

for (const banned of ["—", "green"]) {
  assert(!tutorSource.includes(banned), `Tutor backend source contains ${banned}.`);
}
assert(!/\bgreen\b/i.test(interfaceSource), "The learner interface contains the banned colour name.");

/* 11. Cross lesson review keeps a weak concept beyond its own lesson, and only
 *     retires it after two recorded recalls. */
const reviewMigration = read("drizzle/0004_light_solo.sql");
const reviewLib = read("lib/review.ts");
const reviewRoute = read("app/api/review/route.ts");
const reviewSource = [schema, reviewLib, reviewRoute, reviewMigration].join("\n");

assert(reviewMigration.includes("CREATE TABLE \`concept_review\`"), "The review migration is missing the table.");
assert(schema.includes('"concept_review"'), "The Drizzle schema is missing concept_review.");
assert(reviewMigration.includes("PRIMARY KEY(\`learner_id\`, \`concept\`)"), "A concept must be recorded once per learner.");
assert(reviewMigration.includes("ON DELETE cascade"), "Reviews must be removed with their learner profile.");
const reviewTable = reviewMigration.slice(reviewMigration.indexOf("CREATE TABLE \`concept_review\`"));
for (const banned of ["html", "css", "javascript", "workspace", "source_code", "learner_code"]) {
  assert(!new RegExp(`\`${banned}`, "i").test(reviewTable), `Review history must not store ${banned}.`);
}
assert(reviewTable.includes("`label`"), "A review must keep the requirement label, not the submission.");
assert.equal(RETIRE_STREAK, 2, "A concept must be retired only after two successful recalls.");
assert(MAX_DUE_ITEMS <= 3, "The review list must stay small so it cannot crowd a lesson.");
assert(reviewLib.includes("CASE WHEN review_streak + 1 >= ${RETIRE_STREAK} THEN 0 ELSE 1 END"),
  "Retirement must depend on the recorded streak.");
assert(reviewLib.includes("review_streak = 0"), "A missed recall must reset the streak.");
assert(reviewLib.includes("MIN(concept_review.times_failed + 1, ${MAX_FAILURES})"), "Failure counts must rise but stay bounded.");
assert(reviewLib.includes("WHERE learner_id = ? AND concept = ?"), "Review writes must be scoped to one learner.");
assert(reviewLib.includes("WHERE learner_id = ? AND due = 1"), "Review reads must be scoped to one learner.");
assert(reviewRoute.includes("authenticateLearner(request)"), "The review endpoint must authenticate the learner.");
assert(/if \(!learner\) return unauthorized\(\)/.test(reviewRoute), "The review endpoint must refuse an unauthenticated request.");
assert(reviewRoute.includes("lessonsById.has(row.lessonId)"), "Reviews must be filtered to the learner's own course.");
assert(reviewRoute.includes('z.string().min(1).max(60)') && reviewRoute.includes("z.boolean()"),
  "Review fields must be validated and bounded.");
assert(!/body\.recalled|data\.recalled\s*===/.test(reviewRoute) || reviewRoute.includes("parsed.data.recalled"),
  "The review outcome must come from the validated request body.");
assert(read("app/api/tutor/route.ts").includes("recordConceptFailures"), "The tutor must feed failures into the review queue.");
assert(read("app/api/tutor/route.ts").includes("recordConceptRecoveries"), "The tutor must record in lesson recoveries.");
assert(read("app/api/progress/route.ts").includes("recordConceptRecoveries"), "Completion must record recoveries.");
assert(read("components/LearningApp.tsx").includes("Come back to this"), "The learner must see the review card.");

for (const banned of ["—", "green"]) {
  assert(!reviewSource.includes(banned), `Review backend source contains ${banned}.`);
}

console.log(`Validated the tutor engine across ${allTests.length} requirements, graduated support, mastery limits, cross lesson review, evidence privacy and server-side gating.`);
