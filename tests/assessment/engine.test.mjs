/*
 * The pure assessment engine: marking rules, pass floors, the mandatory override, the
 * Needs verification path, form rotation and what the client is allowed to see.
 *
 * These assertions are the product rules themselves, so a later edit that weakens a
 * floor fails here rather than in front of a learner.
 *
 *   node --import tsx tests/assessment/engine.test.mjs
 */
import assert from "node:assert/strict";
import {
  FINAL_BUILD_MIN,
  FINAL_PASS_MARK,
  MODULE_PASS_MARK,
  MODULE_PRACTICAL_MIN,
  DEFENCE_RETRY_MESSAGE,
  defenceComplete,
  escalatedDefence,
  outcomeLabel,
  gradeCodeTask,
  gradePractice,
  gradeReadiness,
  gradeChange,
  decideDefence,
  predictionCorrect,
  gradeKnowledge,
  revisionConceptsFrom,
  scoreAttempt,
  selectForm,
  secureConceptsFrom,
  firstRevisionAction,
  toClientRevisionPack,
  toClientKnowledge,
  toClientTask,
  submissionFrom,
} from "../../lib/assessment/engine.ts";
import { check, report, stepSync, sweep, failed } from "./harness.mjs";
import { SAFE_PROJECT, WEAK_PROJECT } from "./fixtures.mjs";

const COURSE = "ages-10-12";
const MARKER = (index) => ({ kind: "html-element", file: "html", tag: `x${index}` });
const htmlWith = (count) => {
  let html = "<main><h1>Built</h1>";
  for (let index = 1; index <= count; index += 1) html += `<x${index}></x${index}>`;
  return html + "</main>";
};

function knowledgeItem(id, marks, answer = 0) {
  return {
    id,
    version: "test",
    courseId: COURSE,
    moduleId: "m1",
    formVariant: "A",
    objective: "lesson-1",
    concept: `concept-${id}`,
    difficulty: "foundation",
    cognitive: "understand",
    type: "knowledge",
    marks,
    prompt: `Question ${id}`,
    options: ["Right", "Wrong one", "Wrong two"],
    answer,
    explanation: "Because of the thing the lesson taught.",
    misconceptions: ["m1", "m2", "m3"],
    revision: "lesson-1",
  };
}

function task(id, type, requirementCount, marksEach, options = {}) {
  const requirements = [];
  for (let index = 1; index <= requirementCount; index += 1) {
    requirements.push({
      id: `${id}-r${index}`,
      label: `Requirement ${index}`,
      marks: marksEach,
      check: options.check || MARKER(index),
      concept: `concept-${id}-${index}`,
      revision: "lesson-1",
      ...(options.mandatory && options.mandatory.index === index ? { mandatory: options.mandatory.kind } : {}),
    });
  }
  return {
    id,
    version: "test",
    courseId: COURSE,
    moduleId: "m1",
    formVariant: "A",
    type,
    title: `Task ${id}`,
    brief: "Build the thing the brief describes.",
    objective: "lesson-1",
    concept: `concept-${id}`,
    difficulty: "developing",
    cognitive: "apply",
    marks: requirementCount * marksEach,
    editableFiles: ["html", "css", "javascript"],
    starterFiles: { html: "", css: "", javascript: "" },
    requirements,
    revision: "lesson-1",
    allowedSkills: ["html"],
  };
}

/* ------------------------------------------------------------------ knowledge -- */

stepSync("a correct answer earns the item marks and a wrong one earns none", () => {
  const items = [knowledgeItem("k1", 1), knowledgeItem("k2", 2)];
  const results = gradeKnowledge(items, [0, 1]);
  assert.equal(results[0].awarded, 1);
  assert.equal(results[1].awarded, 0);
  assert.equal(results[1].misconception, "m2");
  const unanswered = gradeKnowledge(items, [-1, -1]);
  assert.equal(unanswered[0].awarded, 0);
});

/* --------------------------------------------------------------------- module -- */

const moduleKnowledge = [1, 2, 3, 4, 5].map((index) => knowledgeItem(`k${index}`, 1));
const modulePractical = task("p1", "practical", 5, 1);

function moduleRun(correctCount, metRequirements, options = {}) {
  const answers = moduleKnowledge.map((_, index) => (index < correctCount ? 0 : 1));
  const knowledge = gradeKnowledge(moduleKnowledge, answers);
  let html = "<main><h1>Built</h1>";
  for (let index = 1; index <= metRequirements; index += 1) html += `<x${index}></x${index}>`;
  html += "</main>";
  const practical = gradeCodeTask(modulePractical, { html });
  return scoreAttempt("module", { knowledge, practical: [practical], ...options });
}

stepSync("a module passes at seven of ten when the practical floor is met", () => {
  const outcome = moduleRun(2, 5);
  assert.equal(outcome.mark.awarded, 7);
  assert.equal(outcome.outcome, "passed");
});

stepSync("a module at six of ten does not pass", () => {
  const outcome = moduleRun(2, 4);
  assert.equal(outcome.mark.awarded, 6);
  assert.equal(outcome.outcome, "not_passed_yet");
});

stepSync("a module with a weak practical does not pass even at seven total", () => {
  const outcome = moduleRun(5, MODULE_PRACTICAL_MIN - 1);
  assert.equal(outcome.mark.awarded, MODULE_PASS_MARK);
  assert.equal(outcome.practical.awarded, 2);
  assert.equal(outcome.outcome, "not_passed_yet");
  assert.match(outcome.nextStep, /revision/);
});

stepSync("a failed mandatory requirement overrides a high total", () => {
  const mandated = task("p2", "practical", 5, 1, { mandatory: { index: 5, kind: "privacy" } });
  /* Everything else is perfect; only the mandatory requirement is missing. */
  const knowledge = gradeKnowledge(moduleKnowledge, [0, 0, 0, 0, 0]);
  const practical = gradeCodeTask(mandated, { html: htmlWith(4) });
  const outcome = scoreAttempt("module", { knowledge, practical: [practical] });
  assert.equal(outcome.mark.awarded, 9);
  assert.equal(outcome.mandatoryPassed, false);
  assert.equal(outcome.outcome, "not_passed_yet");
  assert.match(outcome.reasons[0], /mandatory/i);
});

stepSync("an undecidable mandatory requirement returns Needs verification", () => {
  const mandated = task("p3", "practical", 5, 1, { mandatory: { index: 1, kind: "accessibility" } });
  mandated.requirements[0].check = { kind: "cannot-verify", reason: "The page has to be opened." };
  const knowledge = gradeKnowledge(moduleKnowledge, [0, 0, 0, 0, 0]);
  const practical = gradeCodeTask(mandated, { html: htmlWith(5) });
  const outcome = scoreAttempt("module", { knowledge, practical: [practical] });
  assert.equal(outcome.outcome, "needs_verification");
  assert.match(outcome.nextStep, /grown-up|teacher/);
});

stepSync("an undecidable requirement that is not needed does not hold a pass back", () => {
  const partly = task("p4", "practical", 5, 1);
  partly.requirements[4].check = { kind: "cannot-verify", reason: "A person must look at this." };
  const knowledge = gradeKnowledge(moduleKnowledge, [0, 0, 0, 0, 0]);
  const practical = gradeCodeTask(partly, { html: htmlWith(4) });
  const outcome = scoreAttempt("module", { knowledge, practical: [practical] });
  assert.equal(outcome.mark.awarded, 9);
  assert.equal(outcome.outcome, "passed", "a decided nine of nine is a pass");
  assert.equal(outcome.needsVerification, true);
});

stepSync("an undecidable requirement that could decide the result returns Needs verification", () => {
  const partly = task("p5", "practical", 5, 1);
  partly.requirements[4].check = { kind: "cannot-verify", reason: "A person must look at this." };
  const knowledge = gradeKnowledge(moduleKnowledge, [0, 0, 1, 1, 1]);
  const practical = gradeCodeTask(partly, { html: htmlWith(4) });
  const outcome = scoreAttempt("module", { knowledge, practical: [practical] });
  assert.equal(outcome.mark.awarded, 6);
  assert.equal(outcome.outcome, "needs_verification");
});

/* ---------------------------------------------------------------------- final -- */

const finalKnowledge = Array.from({ length: 10 }, (_, index) => knowledgeItem(`f${index}`, 2));
const debugTasks = [1, 2, 3].map((index) => task(`d${index}`, "debug", 2, 5));
const buildTask = task("b1", "build", 10, 5);

function finalRun(options) {
  const {
    knowledgeCorrect = 10,
    debugMet = [2, 2, 2],
    buildMet = 10,
    defence = { status: "passed" },
  } = options;
  const answers = finalKnowledge.map((_, index) => (index < knowledgeCorrect ? 0 : 1));
  const knowledge = gradeKnowledge(finalKnowledge, answers);
  const debug = debugTasks.map((entry, index) => gradeCodeTask(entry, { html: htmlWith(debugMet[index]) }));
  const build = gradeCodeTask(buildTask, { html: htmlWith(buildMet) });
  return scoreAttempt("final", { knowledge, debug, build: [build], defence });
}

stepSync("a final passes at seventy with a thirty mark build", () => {
  const outcome = finalRun({ knowledgeCorrect: 8, debugMet: [2, 2, 2], buildMet: 6 });
  assert.equal(outcome.mark.awarded, 16 + 30 + 30);
  assert.equal(outcome.build.awarded, 30);
  assert.equal(outcome.outcome, "passed");
});

stepSync("the independent build floor blocks a pass however high the total", () => {
  const outcome = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 5 });
  assert.equal(outcome.mark.awarded, 20 + 30 + 25);
  assert.ok(outcome.mark.awarded > FINAL_PASS_MARK);
  assert.equal(outcome.build.awarded, 25);
  assert.ok(outcome.build.awarded < FINAL_BUILD_MIN);
  assert.equal(outcome.outcome, "not_passed_yet");
});

stepSync("an unfinished code defence is not a pass", () => {
  const outcome = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 10, defence: { status: "pending" } });
  assert.equal(outcome.outcome, "not_passed_yet");
  assert.match(outcome.nextStep, /code defence/);
});

stepSync("a failed code defence is not a pass", () => {
  const outcome = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 10, defence: { status: "not_passed" } });
  assert.equal(outcome.outcome, "not_passed_yet");
  assert.match(outcome.reasons[0], /defence/);
});

stepSync("a defence that cannot be confirmed returns Needs verification", () => {
  const outcome = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 10, defence: { status: "needs-verification" } });
  assert.equal(outcome.outcome, "needs_verification");
});

stepSync("the same successful submission never moves the score", () => {
  const first = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 10 });
  const second = finalRun({ knowledgeCorrect: 10, debugMet: [2, 2, 2], buildMet: 10 });
  assert.deepEqual(first.mark, second.mark);
  assert.equal(first.outcome, second.outcome);
});

/* ---------------------------------------------------------------- form rotation */

stepSync("a fresh learner is served the first form and repeats are avoided", () => {
  const forms = [{ id: "A" }, { id: "B" }, { id: "C" }];
  assert.equal(selectForm(forms, []).id, "A");
  assert.equal(selectForm(forms, ["A"]).id, "B");
  assert.equal(selectForm(forms, ["A", "B"]).id, "C");
});

stepSync("no form repeats until every form has been used", () => {
  const forms = [{ id: "A" }, { id: "B" }, { id: "C" }];
  /* History is newest first. With A most recent, the least recently used of the rest
   * is C. */
  assert.equal(selectForm(forms, ["A", "B", "C"]).id, "C");
  assert.equal(selectForm(forms, ["C", "B", "A"]).id, "A");
});

stepSync("the immediately preceding form is never served again", () => {
  const forms = [{ id: "A" }, { id: "B" }, { id: "C" }];
  for (const history of [["A", "B", "C", "A"], ["A", "B", "C", "B"], ["A", "B", "C", "C"]]) {
    const chosen = selectForm(forms, history);
    assert.notEqual(chosen.id, history[0], `history ${history.join(",")} repeated ${chosen.id}`);
  }
});

stepSync("a single form bank still answers safely", () => {
  assert.equal(selectForm([{ id: "only" }], ["only"]).id, "only");
  assert.equal(selectForm([], ["only"]), null);
});

/* ------------------------------------------------------------ client projection */

stepSync("the client never receives the answer, the explanation or the misconception", () => {
  const item = knowledgeItem("k9", 2);
  const client = toClientKnowledge(item);
  assert.equal("answer" in client, false);
  assert.equal("explanation" in client, false);
  assert.equal("misconceptions" in client, false);
  const serialized = JSON.stringify(client);
  assert.ok(!serialized.includes("Because of the thing"), "the explanation must not travel to the client");
  assert.ok(!serialized.includes("m1"));
});

stepSync("the client never receives a grading rule or a solution", () => {
  const client = toClientTask(buildTask);
  assert.equal(JSON.stringify(client).includes("check"), false);
  assert.equal(JSON.stringify(client).includes("starterCode"), false);
  assert.equal(client.requirements.length, 10);
  assert.equal(client.marks, 50);
  assert.equal("allowedSkills" in client, false);
});

/* ----------------------------------------------------------------- revision plan */

stepSync("only the weak concepts reach the revision plan", () => {
  const strong = task("s1", "practical", 3, 1);
  const weak = task("w1", "practical", 3, 1);
  const strongDemo = gradeCodeTask(strong, { html: htmlWith(3) });
  const weakDemo = gradeCodeTask(weak, { html: htmlWith(1) });
  const concepts = revisionConceptsFrom([strongDemo, weakDemo], { "concept-w1-2": "lesson-42" });
  assert.equal(concepts.length, 2);
  assert.deepEqual(concepts.map((entry) => entry.concept), ["concept-w1-2", "concept-w1-3"]);
  assert.equal(concepts[0].lessonId, "lesson-42");
});

stepSync("a passed concept is never sent back through revision", () => {
  const done = gradeCodeTask(task("done", "practical", 3, 1), { html: htmlWith(3) });
  assert.deepEqual(revisionConceptsFrom([done], {}), []);
});

/* -------------------------------------------------------------------- defence -- */

stepSync("a defence needs an explanation, a prediction and a change", () => {
  const words = "I used a function so the count is easy to test in both directions every time.";
  assert.equal(defenceComplete(words, 1, true), true);
  assert.equal(defenceComplete("Too short.", 1, true), false);
  assert.equal(defenceComplete(words, null, true), false);
  assert.equal(defenceComplete(words, 1, false), false);
});

stepSync("a signal can add a defence check and never a penalty", () => {
  assert.equal(escalatedDefence({ visibilityChanges: 0, pasteEvents: 0, largestPasteChars: 0 }), false);
  assert.equal(escalatedDefence({ visibilityChanges: 0, pasteEvents: 2, largestPasteChars: 0 }), true);
  assert.equal(escalatedDefence({ visibilityChanges: 0, pasteEvents: 0, largestPasteChars: 400 }), true);
  assert.equal(escalatedDefence({ visibilityChanges: 4, pasteEvents: 0, largestPasteChars: 0 }), true);
});

/* ------------------------------------------------------------------- submission */

stepSync("a submission is read defensively and bounded", () => {
  const parsed = submissionFrom({ answers: [0, 1, "2", -5, 1.5], code: { p1: { html: "x" } } });
  assert.deepEqual(parsed.answers, [0, 1, -1, -1, -1]);
  assert.deepEqual(Object.keys(parsed.code), ["p1"]);
  const junk = submissionFrom({ answers: "no", code: 4 });
  assert.deepEqual(junk.answers, []);
  assert.deepEqual(junk.code, {});
});

stepSync("a real project passes every requirement of a realistic brief", () => {
  const realistic = task("real", "build", 5, 10);
  realistic.requirements = [
    { id: "real-1", label: "Regions", marks: 10, check: { kind: "html-landmarks", file: "html", tags: ["header", "main", "footer"] }, concept: "c1" },
    { id: "real-2", label: "Responsive", marks: 10, check: { kind: "css-at-rule", file: "css", at: "media", minWidth: 600 }, concept: "c2" },
    { id: "real-3", label: "Focus", marks: 10, check: { kind: "css-focus-visible", file: "css" }, concept: "c3" },
    { id: "real-4", label: "Interaction", marks: 10, check: { kind: "js-structural", file: "javascript", fact: "event-listener" }, concept: "c4" },
    { id: "real-5", label: "Privacy", marks: 10, mandatory: "privacy", check: { kind: "html-text-free-of", file: "html", catalogue: "personal-contact" }, concept: "c5" },
  ];
  const good = gradeCodeTask(realistic, SAFE_PROJECT);
  assert.equal(good.status, "met");
  assert.equal(good.awarded, 50);
  const bad = gradeCodeTask(realistic, WEAK_PROJECT);
  assert.ok(bad.awarded < 30, `a weak project must not reach the build floor, scored ${bad.awarded}`);
  assert.equal(bad.requirements[4].status, "unmet");
  assert.equal(bad.requirements[4].mandatory, "privacy");
});

await sweep("secure skills, the first action and readiness follow the product rules", async () => {
  const lessonMap = { "a:one": "lesson-one", "a:two": "lesson-two" };
  const metKnowledge = { itemId: "k1", itemType: "knowledge", formVariant: "A", concept: "a:one", status: "met", awarded: 2, available: 2, requirements: [] };
  const missedKnowledge = { ...metKnowledge, itemId: "k2", concept: "a:two", status: "unmet", awarded: 0 };
  const mixedTask = {
    itemId: "p1",
    itemType: "practical",
    formVariant: "A",
    concept: "a:one",
    status: "unmet",
    awarded: 2,
    available: 5,
    requirements: [
      { requirementId: "r1", label: "Kept", status: "met", awarded: 1, available: 1, concept: "a:one", mandatory: null, detail: "" },
      { requirementId: "r2", label: "Missed", status: "unmet", awarded: 0, available: 1, concept: "a:two", mandatory: "privacy", detail: "" },
    ],
  };

  const secure = secureConceptsFrom([metKnowledge, missedKnowledge, mixedTask], lessonMap);
  check("a met skill is secure and a missed one is not", () =>
    assert.deepEqual(secure.map((entry) => entry.concept), ["a:one"]));
  check("a secure skill carries its lesson", () =>
    assert.equal(secure[0].lessonId, "lesson-one"));

  const plan = revisionConceptsFrom([mixedTask], lessonMap);
  check("the first action is a mandatory unmet concept before any other", () =>
    assert.equal(firstRevisionAction(plan)?.concept, "a:two"));
  check("the first action is nothing when the plan is empty", () =>
    assert.equal(firstRevisionAction([]), null));

  const pack = {
    concept: "a:two",
    courses: ["ages-10-12"],
    title: "A worked example",
    meaning: "What the concept means, in words a young learner reads easily.",
    whyItMatters: "It matters because the project shows it on the page.",
    workedExample: "A short example.",
    commonMistake: "A mistake that looks right at first.",
    guided: [
      { prompt: "A guided question about the concept", options: ["right", "wrong", "also wrong"], answer: 0, explanation: "Because it is the correct one." },
      { prompt: "A second guided question about it", options: ["wrong", "right too", "wrong"], answer: 1, explanation: "Because that option is the correct one." },
    ],
    independent: "A task the learner can finish on their own with what the course taught.",
    hints: ["A nudge.", "A closer nudge.", "Almost the answer."],
    readiness: [
      { prompt: "A readiness question about it", options: ["no", "yes", "no"], answer: 1, explanation: "Because that is right." },
    ],
    lessonId: "lesson-two",
  };

  check("readiness passes only when every question is right", () => {
    assert.equal(gradeReadiness(pack, [1]).passed, true);
    assert.equal(gradeReadiness(pack, [0]).passed, false);
    assert.equal(gradeReadiness(pack, []).passed, false);
  });
  check("readiness explains each answer it marks", () => {
    const graded = gradeReadiness(pack, [0]);
    assert.equal(graded.results[0].correct, false);
    assert.equal(graded.results[0].correctAnswer, 1);
    assert.ok(graded.results[0].explanation.length > 10);
  });
  check("guided practice is marked without touching any stored mark", () => {
    const graded = gradePractice(pack, [0, 1]);
    assert.deepEqual(graded.map((entry) => entry.correct), [true, true]);
    assert.deepEqual(graded.map((entry) => entry.available ?? 0), [0, 0].map(() => 0));
  });
  check("a revision page never carries an answer index", () => {
    const view = toClientRevisionPack(pack, "2026-01-01T00:00:00.000Z");
    const serialised = JSON.stringify(view);
    assert.ok(!/"answer"/.test(serialised), "the client view leaked an answer index");
    assert.ok(!/"explanation"/.test(serialised), "the client view leaked an explanation");
    assert.equal(view.guided.length, 2);
    assert.equal(view.hints.length, 3);
    assert.equal(view.readinessPassedAt, "2026-01-01T00:00:00.000Z");
  });
});

await sweep("the code defence decision follows the product rules", async () => {
  const long = "I put the list inside the main region so the page has one clear main area, and the headings step down one level at a time so a reader can follow the shape of the page.";

  check("a correct prediction, a real explanation and a met change pass", () => {
    const decision = decideDefence({ explain: long, predictionCorrect: true, changeStatus: "met" });
    assert.equal(decision.status, "passed");
    assert.ok(decision.nextStep.length > 10);
  });
  check("a wrong prediction never passes, however good the change", () => {
    assert.equal(decideDefence({ explain: long, predictionCorrect: false, changeStatus: "met" }).status, "not_passed");
  });
  check("a thin explanation never passes", () => {
    assert.equal(decideDefence({ explain: "I chose it.", predictionCorrect: true, changeStatus: "met" }).status, "not_passed");
  });
  check("an unmet change never passes", () => {
    assert.equal(decideDefence({ explain: long, predictionCorrect: true, changeStatus: "unmet" }).status, "not_passed");
  });
  check("an undecidable change asks for a different task instead of an outcome", () => {
    const decision = decideDefence({ explain: long, predictionCorrect: true, changeStatus: "needs-verification" });
    assert.equal(decision.retry, true, "an undecidable change did not ask for a retry");
    assert.equal(decision.status, "not_passed", "an undecidable change must never report Passed");
    assert.equal(decision.reason, DEFENCE_RETRY_MESSAGE, "the learner did not get the neutral retry message");
    assert.ok(!/person will review|a person needs/i.test(decision.reason + decision.nextStep),
      "the learner was told a person will review the work");
  });
  check("a decided defence never carries the retry flag", () => {
    for (const changeStatus of ["met", "unmet"]) {
      const decision = decideDefence({ explain: long, predictionCorrect: true, changeStatus });
      assert.equal(decision.retry, false, `${changeStatus} asked for a retry`);
    }
  });
  check("only two educational outcomes exist in learner-facing wording", () => {
    assert.equal(outcomeLabel("passed"), "Passed");
    assert.equal(outcomeLabel("not_passed_yet"), "Not passed yet");
    assert.equal(outcomeLabel("needs_verification"), "Not checked yet");
    assert.ok(!/needs verification/i.test(outcomeLabel("needs_verification")), "the internal value leaked as an outcome");
  });
  check("the prediction is decided against the reviewed index, not the client", () => {
    const task = { id: "t", courseId: "ages-10-12", kind: "predict", prompt: "A prediction task with enough words.", snippet: "x", options: ["a", "b", "c", "d"], answer: 2, explanation: "Because that is what the code does.", objectives: ["o"], revision: "r" };
    assert.equal(predictionCorrect(task, 2).correct, true);
    assert.equal(predictionCorrect(task, 0).correct, false);
    assert.equal(predictionCorrect(task, null).correct, false);
    assert.equal(predictionCorrect(task, 0).correctAnswer, 2);
  });
  check("a live change is graded by the ordinary requirement checker", () => {
    const template = {
      id: "t1",
      courseId: "ages-10-12",
      objectives: ["o"],
      explain: { id: "e", courseId: "ages-10-12", kind: "explain", prompt: "Explain something in your own words.", snippet: "x", explanation: "What a good answer contains.", objectives: ["o"], revision: "r" },
      predict: { id: "p", courseId: "ages-10-12", kind: "predict", prompt: "Predict what this does.", snippet: "x", options: ["a", "b", "c", "d"], answer: 1, explanation: "Because of the rules.", objectives: ["o"], revision: "r" },
      change: {
        id: "c",
        courseId: "ages-10-12",
        kind: "change",
        prompt: "Add one more colour to your stylesheet.",
        snippet: "x",
        explanation: "One more colour declaration.",
        objectives: ["o"],
        revision: "r",
        changeInstruction: "Add one more rule that sets a text colour in your own stylesheet.",
        changeRequirement: { kind: "css-declaration", file: "css", property: "color", value: "colour" },
      },
      escalatedPredict: { id: "x", courseId: "ages-10-12", kind: "predict", prompt: "A harder prediction task.", snippet: "x", options: ["a", "b", "c", "d"], answer: 0, explanation: "Because of the rules.", objectives: ["o"], revision: "r" },
    };
    const like = { id: "b", version: "v", courseId: "ages-10-12", moduleId: "m", formVariant: "A", title: "Build", brief: "b", marks: 50, editableFiles: ["html", "css", "javascript"], starterFiles: { html: "", css: "", javascript: "" }, requirements: [], difficultyProfile: {}, objectives: [] };
    const met = gradeChange(template, { css: ".card { color: #ee9d2b; }" }, like);
    assert.equal(met.status, "met", `a colour declaration did not satisfy the change: ${met.detail}`);
    const unmet = gradeChange(template, { css: ".card { padding: 1rem; }" }, like);
    assert.equal(unmet.status, "unmet", "an unrelated change satisfied the requirement");
  });
});

await sweep("engine sweep", async () => {
  if (failed.length === 0) check("every engine rule behaved as specified");
});

report("assessment engine");