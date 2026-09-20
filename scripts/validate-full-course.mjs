import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import { termDefinitions } from "../lib/course.ts";

const root = resolve(import.meta.dirname, "..");
const codeFiles = new Set(["html", "css", "javascript"]);
const expectedIds = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"];
const expectedAges = {
  "ages-10-12": [10, 11, 12],
  "ages-13-15": [13, 14, 15],
  "ages-16-18": [16, 17, 18],
  adults: [19],
};

function validateQuestion(question, label) {
  assert(question, `${label} needs a question.`);
  assert.equal(question.options.length, 3, `${label} needs three answer options.`);
  assert(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 3, `${label} has an invalid answer.`);
  assert(question.explanation.length > 18, `${label} needs useful answer feedback.`);
}

assert.deepEqual(Object.keys(courses).sort(), [...expectedIds].sort(), "The catalogue must contain the four approved learner paths.");
const globalIds = new Set();
const projectIds = new Set();
const missingTerms = new Set();
let activityTotal = 0;

for (const courseId of expectedIds) {
  const bundle = courses[courseId];
  const { courseFacts, stages, lessons, projectChoices, finalExam, practicalExam } = bundle;
  assert.equal(courseFacts.id, courseId, `${courseId} has mismatched course facts.`);
  assert.deepEqual(courseFacts.ages, expectedAges[courseId], `${courseId} has the wrong onboarding ages.`);
  assert.equal(courseFacts.stageCount, 8, `${courseId} needs 8 modules.`);
  assert.equal(courseFacts.lessonCount, 48, `${courseId} needs 48 activities.`);
  assert.equal(courseFacts.passMark, 7, `${courseId} needs a 7 out of 10 pass mark.`);
  assert.equal(stages.length, 8, `${courseId} needs 8 modules.`);
  assert.equal(lessons.length, 48, `${courseId} needs 48 activities.`);
  assert.equal(projectChoices.length, 3, `${courseId} needs three project choices.`);
  assert.equal(finalExam.length, 10, `${courseId} needs 10 final questions.`);
  assert.equal(practicalExam.requiredPatterns.length, 3, `${courseId} needs three practical checks.`);
  activityTotal += lessons.length;

  for (const project of projectChoices) {
    assert(!projectIds.has(`${courseId}:${project.id}`), `${courseId} repeats project id ${project.id}.`);
    projectIds.add(`${courseId}:${project.id}`);
    assert(project.title.length > 4 && project.pitch.length > 20, `${courseId} has an unfinished project choice.`);
    assert.equal(project.items.length, 3, `${courseId} project ${project.id} needs three content prompts.`);
  }

  for (const stage of stages) {
    assert.equal(stage.lessons.length, 6, `${courseId} module ${stage.number} needs six activities.`);
    assert.equal(
      stage.lessons.map((activity) => activity.activityType).join(","),
      "challenge,challenge,challenge,challenge,project,quiz",
      `${courseId} module ${stage.number} has the wrong activity order.`,
    );

    for (const activity of stage.lessons) {
      assert(!globalIds.has(activity.id), `Duplicate activity id: ${activity.id}`);
      globalIds.add(activity.id);
      assert.equal(activity.hints.length, 3, `${activity.id} needs three graduated hints.`);
      assert(activity.exampleCode.length > 8, `${activity.id} needs a worked example.`);

      for (const term of activity.keyTerms) {
        if (!termDefinitions[term]) missingTerms.add(term);
      }

      if (activity.activityType !== "quiz") {
        assert(activity.explanation.length >= 2, `${activity.id} needs at least two note paragraphs.`);
        assert(activity.explanation.join(" ").length >= 190, `${activity.id} needs clear, detailed notes.`);
        assert(activity.editableFiles.length > 0, `${activity.id} needs a real editable code file.`);
        assert(activity.tests.length > 0, `${activity.id} needs automatic code checks.`);
        validateQuestion(activity.question, activity.id);
      }

      if (activity.activityType === "project") {
        assert(activity.tests.length >= 4, `${activity.id} needs at least four project requirements.`);
        assert(activity.reflection && activity.reflection.length > 20, `${activity.id} needs a useful reflection prompt.`);
      }

      if (activity.activityType === "quiz") {
        assert.equal(activity.questions.length, 5, `${activity.id} needs five module questions.`);
        activity.questions.forEach((question, index) => validateQuestion(question, `${activity.id} question ${index + 1}`));
      }

      for (const codeTest of activity.tests) {
        assert(codeFiles.has(codeTest.file), `${activity.id} has an unknown code file: ${codeTest.file}`);
        assert(activity.editableFiles.includes(codeTest.file), `${activity.id} tests ${codeTest.file}, but that file is not editable.`);
        assert.doesNotThrow(() => new RegExp(codeTest.pattern, "i"), `${activity.id} has an invalid test pattern.`);
      }
    }
  }

  assert.deepEqual(stages.flatMap((stage) => stage.lessons).map((activity) => activity.id), lessons.map((activity) => activity.id), `${courseId} has a broken activity order.`);
  finalExam.forEach((question, index) => validateQuestion(question, `${courseId} final question ${index + 1}`));
  assert(new Set(finalExam.map((question) => question.answer)).size > 1, `${courseId} final answers must not all use the same position.`);
  for (const pattern of practicalExam.requiredPatterns) assert.doesNotThrow(() => new RegExp(pattern, "i"), `${courseId} has an invalid practical pattern.`);
}

const sourceFiles = [
  "lib/course.ts",
  "lib/course-factory.ts",
  "lib/pathway-course.ts",
  "lib/course-13-15.ts",
  "lib/course-16-18.ts",
  "lib/course-adults.ts",
];
assert.equal(missingTerms.size, 0, `Undefined glossary terms: ${[...missingTerms].sort().join(", ")}`);
const visibleSource = sourceFiles.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
assert(!visibleSource.includes("—"), "Product source contains an em dash.");
assert(!/\bgreen\b/i.test(visibleSource), "Product source contains a banned colour name.");
assert(!visibleSource.includes("MissionGame"), "The rejected mission game is still referenced.");
assert(!visibleSource.includes("blockCatalog"), "The rejected block editor is still referenced.");

console.log(`Validated 4 courses, ${activityTotal} activities, 32 project checkpoints and 40 final questions.`);
