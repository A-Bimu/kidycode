import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../lib/course.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(`(function(exports, require) { ${compiled}\n})(exports, require);`, {
  exports: exportsObject,
  require,
});

const { stages, lessons, finalExam, practicalExam } = exportsObject;
const codeFiles = new Set(["html", "css", "javascript"]);
const validateQuestion = (question, label) => {
  assert(question, `${label} needs a question.`);
  assert.equal(question.options.length, 3, `${label} needs three answer options.`);
  assert(question.answer >= 0 && question.answer < 3, `${label} has an invalid answer.`);
  assert(question.explanation.length > 8, `${label} needs answer feedback.`);
};

assert.equal(stages.length, 8, "The ages 10 to 12 course needs 8 modules.");
assert.equal(lessons.length, 48, "The ages 10 to 12 course needs 48 activities.");
assert.equal(finalExam.length, 10, "The final knowledge check needs 10 questions.");
assert.equal(practicalExam.requiredPatterns.length, 3, "The practical exam needs three flexible checks.");

const ids = new Set();
for (const stage of stages) {
  assert.equal(stage.lessons.length, 6, `Module ${stage.number} needs six activities.`);
  assert.equal(
    stage.lessons.map((lesson) => lesson.activityType).join(","),
    "challenge,challenge,challenge,challenge,project,quiz",
    `Module ${stage.number} has the wrong activity order.`,
  );

  for (const lesson of stage.lessons) {
    assert(!ids.has(lesson.id), `Duplicate lesson id: ${lesson.id}`);
    ids.add(lesson.id);
    assert.equal(lesson.hints.length, 3, `${lesson.id} needs three graduated hints.`);
    assert(lesson.exampleCode.length > 8, `${lesson.id} needs a worked example.`);

    if (lesson.activityType === "challenge") {
      assert(lesson.explanation.length > 0, `${lesson.id} needs concise teaching notes.`);
      assert(lesson.editableFiles.length > 0, `${lesson.id} needs a real editable code file.`);
      assert(lesson.tests.length > 0, `${lesson.id} needs automatic code checks.`);
      validateQuestion(lesson.question, lesson.id);
    }

    if (lesson.activityType === "project") {
      assert(lesson.editableFiles.length > 0, `${lesson.id} needs editable project files.`);
      assert(lesson.tests.length >= 4, `${lesson.id} needs at least four project requirements.`);
      assert(lesson.reflection && lesson.reflection.length > 10, `${lesson.id} needs a useful reflection prompt.`);
      validateQuestion(lesson.question, lesson.id);
    }

    if (lesson.activityType === "quiz") {
      assert.equal(lesson.questions.length, 5, `${lesson.id} needs five module questions.`);
      lesson.questions.forEach((question, index) => validateQuestion(question, `${lesson.id} question ${index + 1}`));
    }

    for (const test of lesson.tests) {
      assert(codeFiles.has(test.file), `${lesson.id} has an unknown code file: ${test.file}`);
      assert.doesNotThrow(() => new RegExp(test.pattern, "i"), `${lesson.id} has an invalid test pattern.`);
    }
  }
}

finalExam.forEach((question, index) => validateQuestion(question, `Final question ${index + 1}`));
assert(new Set(finalExam.map((question) => question.answer)).size > 1, "Final answers must not all appear in the same position.");

for (const pattern of practicalExam.requiredPatterns) {
  assert.doesNotThrow(() => new RegExp(pattern, "i"), "The practical exam has an invalid test pattern.");
}

const visibleSource = [
  source,
  readFileSync(new URL("../components/LearningApp.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../components/ExamPanel.tsx", import.meta.url), "utf8"),
].join("\n");
assert(!visibleSource.includes("—"), "Visible course source contains an em dash.");
assert(!/\bgreen\b/i.test(visibleSource), "Visible course source contains a banned colour name.");
assert(!visibleSource.includes("MissionGame"), "The rejected mission game is still referenced.");
assert(!visibleSource.includes("blockCatalog"), "The rejected block editor is still referenced.");
assert(visibleSource.includes("QuickCheck"), "Coding lessons must show their practice questions.");
assert(visibleSource.includes("Saving draft"), "Coding work must autosave before completion.");

console.log(`Validated ${stages.length} modules, ${lessons.length} code-first activities, ${stages.length} project checkpoints and ${finalExam.length} final questions.`);
