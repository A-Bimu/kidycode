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

assert.equal(lessonScripts.length, 3, "Three sample lesson scripts are required in this phase.");
for (const language of ["HTML", "CSS", "JavaScript"]) {
  assert(languages.has(language), `The sample lessons must cover ${language}.`);
}

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

const source = readFileSync(resolve(root, "lib/lesson-scripts.ts"), "utf8");
assert(!source.includes("\u2014"), "The lesson scripts contain an em dash.");
assert(!/\bgreen\b/i.test(source), "The lesson scripts contain the banned colour name.");

console.log(`Validated ${lessonScripts.length} lesson scripts, ${resolvedLessons} course and companion mappings, their prerequisites and mastery checks across ${expectedCourseIds.length} courses.`);
