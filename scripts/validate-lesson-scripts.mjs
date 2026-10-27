import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { lessonScripts, lessonScriptIssues, lessonIdForCourse, scriptFor } from "../lib/lesson-scripts.ts";

/*
 * The V3 lesson journey contract. It proves that every script is anchored to a
 * real lesson in a real course, that companions and prerequisites exist, that
 * all three languages are represented, and that the mastery checks fail on the
 * starter and pass on the worked solution.
 */

const root = resolve(import.meta.dirname, "..");
const expectedCourseIds = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"];

const issues = lessonScriptIssues();
assert.equal(issues.length, 0, `Lesson script contract issues:\n${issues.join("\n")}`);

const lessonIdsByCourse = new Map(expectedCourseIds.map((courseId) => [courseId, new Set(courses[courseId].lessons.map((lesson) => lesson.id))]));
const allLessonIds = new Set(expectedCourseIds.flatMap((courseId) => [...lessonIdsByCourse.get(courseId)]));
const languages = new Set();

for (const script of lessonScripts) {
  assert(script.courseIds.length > 0, `${script.lessonId} names no course.`);
  for (const courseId of script.courseIds) {
    assert(expectedCourseIds.includes(courseId), `${script.lessonId} references an unknown course: ${courseId}.`);
    const resolvedId = script.courseLessonIds?.[courseId] || script.lessonId;
    assert(lessonIdsByCourse.get(courseId).has(resolvedId), `${resolvedId} is not a lesson in ${courseId}.`);
  }
  const primaryCourse = script.courseIds[0];
  const lesson = courses[primaryCourse].lessons.find((item) => item.id === script.lessonId);
  assert(lesson, `${script.lessonId} has no matching lesson in ${primaryCourse}.`);
  languages.add(lesson.language);

  for (const [courseId, companionIds] of Object.entries(script.companionLessonIds || {})) {
    assert(expectedCourseIds.includes(courseId), `${script.lessonId} has companions in an unknown course: ${courseId}.`);
    for (const companionId of companionIds) {
      assert(lessonIdsByCourse.get(courseId).has(companionId), `${script.lessonId}: companion ${companionId} is not a lesson in ${courseId}.`);
    }
  }

  for (const prerequisite of script.prerequisites) {
    assert(allLessonIds.has(prerequisite), `${script.lessonId}: prerequisite ${prerequisite} does not exist in any course.`);
    assert(!prerequisite.includes(script.lessonId), `${script.lessonId} lists itself as a prerequisite.`);
  }

  const languagesCovered = new Set(script.courseIds.map((courseId) => {
    const resolvedId = script.courseLessonIds?.[courseId] || script.lessonId;
    return courses[courseId].lessons.find((item) => item.id === resolvedId)?.language;
  }));
  assert(languagesCovered.size >= 1, `${script.lessonId} has no language.`);
}

assert.equal(lessonScripts.length, 9, "Nine lesson scripts are required in the difficult-concept phase.");
for (const language of ["HTML", "CSS", "JavaScript"]) {
  assert(languages.has(language), `The sample lessons must cover ${language}.`);
}

/* The concepts this phase must cover, by primary lesson id. A missing script is a
 * missing concept, not a rounding error, so the list is written out. */
const requiredScripts = [
  "ages-13-15-structure-headings",
  "ages-13-15-responsive-flex",
  "ages-13-15-responsive-grid",
  "javascript-logic-loops",
  "ages-13-15-javascript-values",
  "ages-13-15-javascript-functions",
  "ages-13-15-data-arrays",
  "ages-16-18-javascript-objects",
  "ages-16-18-javascript-filter",
];
for (const required of requiredScripts) {
  assert(lessonScripts.some((script) => script.lessonId === required), `The ${required} script is missing.`);
}

/* Independent transfer. The fresh task may not be the lesson's own task: its
 * starter has to differ and its requirement list may not be the lesson's list. */
for (const script of lessonScripts) {
  const primary = courses[script.courseIds[0]].lessons.find((item) => item.id === script.lessonId);
  assert(primary, `${script.lessonId} has no lesson to compare its fresh task against.`);
  assert.notDeepEqual(script.mastery.checks, primary.tests, `${script.lessonId}: the fresh task reuses the lesson's own checks.`);
  for (const check of script.mastery.checks) {
    assert.notEqual(
      script.mastery.starterFiles[check.file],
      primary.starterFiles[check.file],
      `${script.lessonId}: the fresh task starter for ${check.file} is the lesson's own starter.`,
    );
  }
}

/* Individual coverage, reported per course. Phase 3 widens conversion from this
 * baseline, so the number of scripted activities per course is printed rather
 * than claimed. */
const coverage = expectedCourseIds.map((courseId) => {
  const scripted = courses[courseId].lessons.filter((lesson) => {
    for (const script of lessonScripts) {
      if (script.courseIds.includes(courseId) && (script.courseLessonIds?.[courseId] || script.lessonId) === lesson.id) return true;
      if ((script.companionLessonIds?.[courseId] || []).includes(lesson.id)) return true;
    }
    return false;
  });
  return `${courseId}: ${scripted.length} of ${courses[courseId].lessons.length} activities scripted`;
});

/* The presenter resolves a script by course and lesson id. Prove both the primary
 * ids and every companion id resolve back to the same script. */
let resolvedLessons = 0;
for (const script of lessonScripts) {
  for (const courseId of script.courseIds) {
    const resolvedId = lessonIdForCourse(script, courseId);
    assert.equal(scriptFor(courseId, resolvedId)?.lessonId, script.lessonId, `scriptFor did not resolve ${resolvedId} in ${courseId}.`);
    resolvedLessons += 1;
  }
  for (const [courseId, companionIds] of Object.entries(script.companionLessonIds || {})) {
    for (const companionId of companionIds) {
      assert.equal(scriptFor(courseId, companionId)?.lessonId, script.lessonId, `scriptFor did not resolve companion ${companionId} in ${courseId}.`);
      resolvedLessons += 1;
    }
  }
}

const source = [
  readFileSync(resolve(root, "lib/lesson-scripts.ts"), "utf8"),
  readFileSync(resolve(root, "lib/lesson-scripts-difficult-concepts.ts"), "utf8"),
].join("\n");
assert(!source.includes("\u2014"), "The lesson scripts contain an em dash.");
assert(!/\bgreen\b/i.test(source), "The lesson scripts contain the banned colour name.");

console.log(`Validated ${lessonScripts.length} lesson scripts, ${resolvedLessons} course and companion mappings, their prerequisites, mastery checks and misconception detectors across ${expectedCourseIds.length} courses.`);
for (const line of coverage) console.log(`  ${line}`);
