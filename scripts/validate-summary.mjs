import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { MASTERY_LABELS, buildSummary, masteryLabelFor } from "../lib/summary.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const course = courses["ages-10-12"];
const moduleOne = course.stages[0];
const moduleOneLessons = moduleOne.lessons;
const allowedLabels = Object.values(MASTERY_LABELS);

const emptyInput = { progress: [], evidence: [], reviews: [], checkpoints: [], exams: [] };

/* 1. A brand new learner gets a complete, answerable summary. */
const fresh = buildSummary(course, emptyInput);
assert.equal(fresh.courseProgress.lessonsCompleted, 0);
assert.equal(fresh.courseProgress.lessonsTotal, course.lessons.length);
assert.equal(fresh.courseProgress.checksPassed, 0);
assert.equal(fresh.courseProgress.status, "not-started");
assert.equal(fresh.courseProgress.completionLabel, MASTERY_LABELS.started);
assert.equal(fresh.courseProgress.masteryLabel, MASTERY_LABELS.started);
assert.equal(fresh.modules.length, course.stages.length);
assert.equal(fresh.modules.every((module) => module.status === "not-started" && module.mastery === 0), true);
assert.deepEqual(fresh.needsReview, []);
assert.deepEqual(fresh.strengthened, []);
assert.equal(fresh.independentCorrections, 0);
assert.equal(fresh.project.checkpointsSaved, 0);
assert.equal(fresh.finalAssessment.status, "not-started");
assert.equal(fresh.recentActivityAt, null);
assert.equal(fresh.nextAction.lessonId, course.lessons[0].id, "A new learner is pointed at the first activity.");
assert.equal(fresh.nextAction.kind, "lesson");

/* 2. Partial progress reports correct totals. */
const firstLesson = course.lessons[0];
const partialInput = {
  progress: [{ lessonId: firstLesson.id, status: "completed", updatedAt: "2026-01-02T10:00:00.000Z" }],
  evidence: [{
    lessonId: firstLesson.id,
    mastery: 100,
    successfulChecks: 2,
    attempts: 5,
    hintsRequested: 2,
    independentCorrections: 1,
    lastActivityAt: "2026-01-02T10:00:00.000Z",
    completedAt: "2026-01-02T10:00:00.000Z",
  }],
  reviews: [],
  checkpoints: [],
  exams: [],
};
const partial = buildSummary(course, partialInput);
assert.equal(partial.courseProgress.lessonsCompleted, 1);
assert.equal(partial.courseProgress.checksPassed, 2);
assert.equal(partial.courseProgress.status, "in-progress");
assert.equal(partial.modules[0].lessonsCompleted, 1);
assert.equal(partial.modules[0].checksPassed, 2);
assert.equal(partial.independentCorrections, 1);
assert.equal(partial.recentActivityAt, "2026-01-02T10:00:00.000Z");
assert.equal(partial.nextAction.lessonId, course.lessons[1].id, "The next step moves on with the learner.");

/* 3. A lesson is never counted twice, and checks can never exceed what the
 *    activity offers. */
const duplicated = buildSummary(course, {
  ...partialInput,
  progress: [
    { lessonId: firstLesson.id, status: "completed", updatedAt: "2026-01-02T10:00:00.000Z" },
    { lessonId: firstLesson.id, status: "completed", updatedAt: "2026-01-03T10:00:00.000Z" },
  ],
  evidence: [{ ...partialInput.evidence[0], successfulChecks: 9, mastery: 400 }],
});
assert.equal(duplicated.courseProgress.lessonsCompleted, 1, "A repeated row must not count twice.");
assert.equal(duplicated.courseProgress.checksPassed, 2, "Checks must be capped at what the activity offers.");
assert.equal(duplicated.modules[0].lessonsCompleted, 1);
assert.equal(duplicated.modules[0].mastery, 17, "Mastery is capped at one hundred per activity.");
assert(duplicated.modules[0].masteryLabel === MASTERY_LABELS.building);

/* 4. Module mastery is calculated from the module's own activities. */
function completeWholeModule(stageNumber) {
  const stage = course.stages[stageNumber - 1];
  return {
    progress: stage.lessons.map((lesson, index) => ({ lessonId: lesson.id, status: "completed", updatedAt: `2026-02-0${index + 1}T10:00:00.000Z` })),
    evidence: stage.lessons.map((lesson, index) => ({
      lessonId: lesson.id,
      mastery: 100,
      successfulChecks: 2,
      attempts: 1,
      hintsRequested: 0,
      independentCorrections: 0,
      lastActivityAt: `2026-02-0${index + 1}T10:00:00.000Z`,
      completedAt: `2026-02-0${index + 1}T10:00:00.000Z`,
    })),
    reviews: [],
    checkpoints: [],
    exams: [],
  };
}
const finishedModule = buildSummary(course, completeWholeModule(1));
assert.equal(finishedModule.modules[0].mastery, 100);
assert.equal(finishedModule.modules[0].masteryLabel, MASTERY_LABELS.secure);
assert.equal(finishedModule.modules[0].status, "complete");
assert.equal(finishedModule.modules[1].status, "not-started");
assert.equal(finishedModule.courseProgress.status, "in-progress");
assert(finishedModule.courseProgress.completionLabel === MASTERY_LABELS.started
  || finishedModule.courseProgress.completionLabel === MASTERY_LABELS.building);

const threeOfSix = buildSummary(course, {
  progress: moduleOneLessons.slice(0, 3).map((lesson) => ({ lessonId: lesson.id, status: "completed", updatedAt: "2026-03-01T10:00:00.000Z" })),
  evidence: moduleOneLessons.slice(0, 3).map((lesson) => ({
    lessonId: lesson.id,
    mastery: 100,
    successfulChecks: 2,
    attempts: 1,
    hintsRequested: 0,
    independentCorrections: 0,
    lastActivityAt: "2026-03-01T10:00:00.000Z",
    completedAt: "2026-03-01T10:00:00.000Z",
  })),
  reviews: [],
  checkpoints: [],
  exams: [],
});
assert.equal(threeOfSix.modules[0].lessonsCompleted, 3);
assert.equal(threeOfSix.modules[0].mastery, 50);
assert.equal(threeOfSix.modules[0].masteryLabel, MASTERY_LABELS.nearly);
assert.equal(threeOfSix.modules[0].status, "in-progress");

/* 5. Due concepts are listed as needing another look, and retired concepts are
 *    never shown as weak. */
const partialLessonId = course.lessons[4].id;
const reviewSummary = buildSummary(course, {
  ...partialInput,
  reviews: [
    { concept: "list-items", label: "The list contains at least three items", lessonId: partialLessonId, timesFailed: 3, timesRecovered: 1, reviewStreak: 0, due: true },
    { concept: "main-heading", label: firstLesson.tests[0].label, lessonId: firstLesson.id, timesFailed: 2, timesRecovered: 3, reviewStreak: 2, due: false },
    { concept: "not-in-course", label: "Something from another course", lessonId: "another-course-lesson", timesFailed: 4, timesRecovered: 0, reviewStreak: 0, due: true },
  ],
});
assert.equal(reviewSummary.needsReview.length, 1, "Only the due concept from this course needs another look.");
assert.equal(reviewSummary.needsReview[0].concept, "list-items");
assert.equal(reviewSummary.needsReview[0].moduleNumber, 1);
assert(reviewSummary.needsReview[0].focus.length > 0, "A review item must carry a readable focus.");
assert.equal(reviewSummary.strengthened.length, 1, "A retired concept appears in the strengthened list.");
assert.equal(reviewSummary.strengthened[0].concept, "main-heading");
assert.equal(
  reviewSummary.needsReview.some((item) => item.concept === "main-heading"),
  false,
  "A retired concept must never be shown as weak.",
);

/* 6. Independent corrections are counted across every lesson. */
const corrections = buildSummary(course, {
  ...partialInput,
  evidence: [
    { ...partialInput.evidence[0], independentCorrections: 2 },
    { ...partialInput.evidence[0], lessonId: course.lessons[1].id, independentCorrections: 3 },
  ],
});
assert.equal(corrections.independentCorrections, 5);

/* 7. The recommended activity always belongs to the learner's own course. */
const courseLessonIds = new Set(course.lessons.map((lesson) => lesson.id));
assert.equal(courseLessonIds.has(fresh.nextAction.lessonId), true);
assert.equal(courseLessonIds.has(partial.nextAction.lessonId), true);
const allComplete = {
  progress: course.lessons.map((lesson) => ({ lessonId: lesson.id, status: "completed", updatedAt: "2026-04-01T10:00:00.000Z" })),
  evidence: course.lessons.map((lesson) => ({
    lessonId: lesson.id,
    mastery: 100,
    successfulChecks: 2,
    attempts: 1,
    hintsRequested: 0,
    independentCorrections: 0,
    lastActivityAt: "2026-04-01T10:00:00.000Z",
    completedAt: "2026-04-01T10:00:00.000Z",
  })),
  reviews: [],
  checkpoints: course.stages.map((stage) => ({ stageId: stage.id, version: 1, createdAt: "2026-04-02T10:00:00.000Z" })),
  exams: [],
};
const finishedCourse = buildSummary(course, allComplete);
assert.equal(finishedCourse.courseProgress.status, "complete");
assert.equal(finishedCourse.courseProgress.completionLabel, MASTERY_LABELS.secure);
assert.equal(finishedCourse.nextAction.kind, "final-check", "A finished course recommends the final check.");
assert.equal(finishedCourse.project.checkpointsSaved, course.stages.length);
assert.equal(finishedCourse.project.label, MASTERY_LABELS.secure);

const passedCourse = buildSummary(course, {
  ...allComplete,
  exams: [{ score: 10, total: 10, passed: true, createdAt: "2026-04-03T10:00:00.000Z" }],
});
assert.equal(passedCourse.finalAssessment.status, "passed");
assert.equal(passedCourse.finalAssessment.bestScore, 10);
assert.equal(passedCourse.nextAction.kind, "complete");

const attemptedCourse = buildSummary(course, {
  ...allComplete,
  exams: [{ score: 4, total: 10, passed: false, createdAt: "2026-04-03T10:00:00.000Z" }],
});
assert.equal(attemptedCourse.finalAssessment.status, "attempted");
assert.equal(attemptedCourse.nextAction.kind, "final-check");

/* A summary is derivable for every learning path, and every label stays inside
 * the agreed plain wording. */
for (const [courseId, bundle] of Object.entries(courses)) {
  const summary = buildSummary(bundle, emptyInput);
  assert.equal(summary.course.id, courseId, `${courseId} must summarise itself.`);
  assert.equal(summary.modules.length, bundle.stages.length);
  for (const label of [summary.courseProgress.masteryLabel, summary.courseProgress.completionLabel, summary.project.label, ...summary.modules.map((module) => module.masteryLabel)]) {
    assert(allowedLabels.includes(label), `${courseId} produced an unapproved label: ${label}`);
  }
}
assert.equal(masteryLabelFor(0), MASTERY_LABELS.started);
assert.equal(masteryLabelFor(100), MASTERY_LABELS.secure);

/* 8. The endpoint is learner scoped, course filtered, and never returns code or
 *    stored answers. */
const route = read("app/api/summary/route.ts");
assert(route.includes("authenticateLearner(request)"), "The summary must authenticate the learner.");
assert(/if \(!learner\) return unauthorized\(\)/.test(route), "The summary must refuse an unauthenticated request.");
assert(route.includes('parsed.data.learnerId !== learner.id'), "A request for another learner must be rejected.");
assert(route.includes("{ status: 403 }"), "A request for another learner must be refused, not silently emptied.");
assert(route.includes("WHERE learner_id = ?"), "Every query must be scoped to the authenticated learner.");
assert(route.includes("courseLessonIds.has(row.lessonId)"), "Progress and evidence must be filtered to the learner course.");
assert(route.includes("courseStageIds.has(row.stageId)"), "Checkpoints must be filtered to the learner course.");
assert(route.includes("z.string().min(1).max(64).optional()"), "The learner id input must be bounded.");
assert(route.includes("storedCourseId(row.answersJson) === learner.courseId"), "Final attempts must belong to the learner course.");
assert(route.includes("SELECT score, total, passed, created_at AS createdAt, answers_json AS answersJson"), "Only the score and outcome may be read from an attempt.");
assert.equal(route.includes("practical_json"), false, "The summary must never read stored code.");
assert.equal(route.includes("workspace"), false, "The summary must never read saved drafts.");
assert.equal(route.includes("kidycode_session"), false, "The summary must never touch session data.");
assert(route.includes("Response.json({ summary })"), "The response must carry the derived summary and nothing else.");
assert(route.includes("passed: Boolean(row.passed), createdAt: row.createdAt }))"),
  "Only the score and outcome of an attempt may reach the summary.");

/* No migration was added, because no new durable data is required. */
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const latestMigration = journal.entries[journal.entries.length - 1].tag;
assert.equal(latestMigration, "0004_light_solo", "Phase 3 must not add a migration.");

const pageSource = read("components/ProgressPage.tsx");
const summarySource = [read("lib/summary.ts"), route, pageSource].join("\n");
for (const banned of ["—", "green"]) {
  assert(!summarySource.includes(banned), `The summary source contains ${banned}.`);
}
assert.equal(pageSource.includes("%"), false, "The progress page must not show a percentage.");
/* Comments explain what the page avoids, so only the code and the copy are
 * checked for the words that must never reach the learner. */
const pageCode = pageSource
  .split("\n")
  .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
  .join("\n");
assert.equal(/\bgrade\b/i.test(pageCode), false, "The progress page must not present a grade.");
assert.equal(/\bpercentage\b/i.test(pageCode), false, "The progress page must not present a percentage.");

console.log(`Validated the progress summary across ${Object.keys(courses).length} courses: totals, module mastery, review sections, learner scoping and no added migration.`);