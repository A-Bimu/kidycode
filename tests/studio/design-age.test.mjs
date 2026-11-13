import assert from "node:assert/strict";
import { designCourseFor, designCourseIssues } from "../../lib/design-course.ts";
const ages = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"];
for (const age of ages) {
  const course = designCourseFor(age);
  assert.equal(course.modules.length, 6);
  assert.equal(course.modules.reduce((total, module) => total + module.lessons.length, 0), 12);
  assert.deepEqual(designCourseIssues(course), [], "Age pathway design course should meet curriculum contract: " + age);
  assert(course.modules.every(module => module.studio.length > 35));
}
const beginner = designCourseFor("ages-10-12");
const intermediate = designCourseFor("ages-13-15");
const adult = designCourseFor("adults");
assert.notDeepEqual(beginner.modules[0].lessons[0].notes, intermediate.modules[0].lessons[0].notes,
  "Beginner notes must be genuinely simpler, not just have a different age label");
assert.notEqual(adult.modules[0].studio, beginner.modules[0].studio,
  "Adults must receive a distinct professional project brief");
for (const section of beginner.modules) {
  for (const lesson of section.lessons) {
    assert(lesson.check.options.length === 3 && lesson.check.options[lesson.check.answer],
      "Beginner check must have a grounded answer");
    assert(lesson.activity.length >= 30 && lesson.notes.join(" ").length >= 120,
      "Beginner activities should provide sufficient explanation");
  }
}
console.log("All four age-adapted UI/UX curricula and 12 beginner learning activities passed.");
