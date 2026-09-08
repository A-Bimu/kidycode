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

const { stages, lessons, finalExam, practicalExam, blockCatalog } = exportsObject;
assert.equal(stages.length, 10, "The ages 10 to 12 course needs 10 stages.");
assert.equal(lessons.length, 40, "The ages 10 to 12 course needs 40 lessons.");
assert.equal(finalExam.length, 10, "The final knowledge check needs 10 questions.");
assert.equal(practicalExam.requiredCode.length, 3, "The practical exam needs three checks.");

const ids = new Set();
for (const stage of stages) {
  assert.equal(stage.lessons.length, 4, `Stage ${stage.number} needs four lessons.`);
  assert.equal(stage.checkpoint.checks.length, 4, `Stage ${stage.number} needs four checkpoint checks.`);
  for (const lesson of stage.lessons) {
    assert(!ids.has(lesson.id), `Duplicate lesson id: ${lesson.id}`);
    ids.add(lesson.id);
    assert.equal(lesson.notes.length, 3, `${lesson.id} needs three short notes.`);
    assert.equal(lesson.hints.length, 3, `${lesson.id} needs three graduated hints.`);
    assert.equal(lesson.question.options.length, 3, `${lesson.id} needs three answer options.`);
    assert(lesson.question.answer >= 0 && lesson.question.answer < 3, `${lesson.id} has an invalid answer.`);
    assert(lesson.exampleCode.length > 8, `${lesson.id} needs a worked example.`);
    assert(lesson.reflection.length > 10, `${lesson.id} needs a reflection prompt.`);
    if (lesson.mode === "blocks") {
      assert(lesson.solutionBlocks.length > 0, `${lesson.id} needs a block solution.`);
      lesson.solutionBlocks.forEach((block) => assert(blockCatalog[block], `${lesson.id} uses an unknown block: ${block}`));
    } else {
      assert(lesson.requiredCode.length > 0, `${lesson.id} needs JavaScript checks.`);
    }
  }
}

const visibleSource = [
  source,
  readFileSync(new URL("../components/LearningApp.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../components/ExamPanel.tsx", import.meta.url), "utf8"),
].join("\n");
assert(!visibleSource.includes("—"), "Visible course source contains an em dash.");
assert(!/\bgreen\b/i.test(visibleSource), "Visible course source contains a banned colour name.");

console.log(`Validated ${stages.length} stages, ${lessons.length} complete lessons, ${stages.length} checkpoints and ${finalExam.length} final questions.`);
