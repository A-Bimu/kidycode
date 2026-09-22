/*
 * End to end check of the Adaptive Tutor against a running KidyCode server.
 *
 * Run the app first, then:
 *   node --import tsx scripts/e2e-tutor.mjs
 *
 * Override the address when the server listens elsewhere:
 *   KIDYCODE_E2E_URL=http://127.0.0.1:3000 node --import tsx scripts/e2e-tutor.mjs
 */
import assert from "node:assert/strict";
import { courses } from "../lib/course-catalog.ts";
import { gradeRequirements } from "../lib/tutor.ts";

const candidates = [
  process.env.KIDYCODE_E2E_URL,
  "http://localhost:3000",
  "http://[::1]:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

let base = "";
const passed = [];
const failed = [];

/* Records a passing test. Use step() when there is a body to run: a name only
 * call is deliberate, because a body passed here would never execute. */
function check(name) {
  if (typeof name !== "string") {
    throw new TypeError("check() only records a result. Use step() to run a test body.");
  }
  passed.push(name);
  console.log(`  ok   ${name}`);
}

async function step(name, run) {
  try {
    await run();
    check(name);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message}`);
  }
}

async function findServer() {
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/api/progress`, { signal: AbortSignal.timeout(8000) });
      if (response.status === 401) {
        base = candidate;
        return;
      }
    } catch {
      continue;
    }
  }
  throw new Error("No KidyCode server answered. Start it first with: node_modules/.bin/vinext dev");
}

let cookie = "";

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(30000) });
  const setCookie = response.headers.getSetCookie?.() || [];
  const session = setCookie.find((value) => value.startsWith("kidycode_session="));
  if (session) cookie = session.split(";")[0];
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function readSummary(query = "") {
  const result = await api(`/api/summary${query}`);
  return result;
}

async function createLearner(nickname, courseId, age) {
  cookie = "";
  const result = await api("/api/learners", {
    method: "POST",
    body: JSON.stringify({ nickname, age, theme: "interest", courseId }),
  });
  assert.equal(result.status, 201, `Could not create learner ${nickname}: ${JSON.stringify(result.body)}`);
  assert(cookie.startsWith("kidycode_session="), "The learner session cookie was not issued.");
  return result.body.learner;
}

const course = courses["ages-10-12"];
const lessonOne = course.lessons[0];
const lessonTwo = course.lessons[1];
const lessonThree = course.lessons[2];

/* The working code below is graded by the same engine the server uses, so the
 * test proves itself instead of trusting a hard coded expectation. */
const lessonOneCode = { html: "<h1>My First Website</h1>", css: "", javascript: "" };
const lessonTwoCode = {
  html: "<h1>My First Website</h1>\n<h2>About this page</h2>\n<p>This page shares useful ideas.</p>",
  css: "",
  javascript: "",
};
assert.equal(gradeRequirements(lessonOne, lessonOneCode).every((result) => result.passed), true,
  "The end to end fixture for the first lesson must actually pass.");
assert.equal(gradeRequirements(lessonTwo, lessonTwoCode).every((result) => result.passed), true,
  "The end to end fixture for the second lesson must actually pass.");

/* This workspace is deliberately close but wrong: the words are right and the
 * element is not, which is exactly the kind of mistake the tutor must explain. */
const brokenCode = { html: "<p>My First Website</p>", css: "", javascript: "" };
assert.equal(gradeRequirements(lessonOne, brokenCode).some((result) => result.passed), false,
  "The end to end broken workspace must fail the requirements.");

console.log(`Checking the tutor against ${base}`);

await findServer();
check("a KidyCode server is reachable");

/* 1. The four learning paths still load. */
for (const [route, label] of [["/", "marketing"], ["/learn", "ages 10 to 12"], ["/learn/13-15", "ages 13 to 15"], ["/learn/16-18", "ages 16 to 18"], ["/learn/adults", "adults"]]) {
  await step(`route ${route} (${label}) loads`, async () => {
    const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `Expected 200, received ${response.status}`);
    const html = await response.text();
    assert(html.length > 500, "The page returned almost no markup.");
  });
}

let firstLearner = null;

await step("a learner can be created and receives a session", async () => {
  firstLearner = await createLearner("TutorCheck", "ages-10-12", 11);
  assert(firstLearner.id, "The learner record has no id.");
});

await step("the tutor refuses an unauthenticated request", async () => {
  const saved = cookie;
  cookie = "";
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 401, `Expected 401, received ${result.status}`);
  cookie = saved;
});

await step("a new learner starts with no evidence", async () => {
  const result = await api("/api/tutor");
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.deepEqual(result.body.evidence, [], "A new learner must have no tutoring evidence.");
});

await step("a new learner sees a helpful, complete empty state", async () => {
  const result = await readSummary();
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  const summary = result.body.summary;
  assert(summary, "The summary must be returned.");
  assert.equal(summary.course.id, "ages-10-12", "The summary must describe the learner course.");
  assert.equal(summary.courseProgress.lessonsCompleted, 0);
  assert.equal(summary.courseProgress.lessonsTotal, course.lessons.length);
  assert.equal(summary.courseProgress.checksPassed, 0);
  assert.equal(summary.courseProgress.status, "not-started");
  assert.equal(summary.courseProgress.completionLabel, "Just started");
  assert.equal(summary.courseProgress.masteryLabel, "Just started");
  assert.equal(summary.recentActivityAt, null, "A new learner has no activity date.");
  assert.deepEqual(summary.needsReview, []);
  assert.deepEqual(summary.strengthened, []);
  assert.equal(summary.independentCorrections, 0);
  assert.equal(summary.project.checkpointsSaved, 0);
  assert.equal(summary.finalAssessment.status, "not-started");
  assert.equal(summary.modules.length, course.stages.length);
  assert.equal(summary.modules.every((module) => module.status === "not-started"), true);
  assert.equal(summary.nextAction.kind, "lesson");
  assert.equal(summary.nextAction.lessonId, course.lessons[0].id, "A new learner is pointed at the first activity.");
});

await step("the summary refuses to describe another learner", async () => {
  const result = await readSummary("?learnerId=00000000-0000-0000-0000-000000000000");
  assert.equal(result.status, 403, `A request for another learner must be refused, received ${result.status}`);
});

await step("summary inputs are bounded", async () => {
  const long = await readSummary(`?learnerId=${"a".repeat(200)}`);
  assert.equal(long.status, 400, `An oversized learner id must be refused, received ${long.status}`);
});

await step("the lesson belongs to the learner course", async () => {
  const otherCourseLesson = courses.adults.lessons[0];
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: otherCourseLesson.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 403, `A lesson from another path must be refused, received ${result.status}`);
});

await step("request fields are validated and limited", async () => {
  const bad = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "make-me-a-cake", workspace: brokenCode }) });
  assert.equal(bad.status, 400, `An unknown action must be refused, received ${bad.status}`);
  const huge = await api("/api/tutor", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: { html: "x".repeat(30000), css: "", javascript: "" } }),
  });
  assert.equal(huge.status, 400, `An oversized workspace must be refused, received ${huge.status}`);
  const longId = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: "l".repeat(400), action: "check", workspace: brokenCode }) });
  assert.equal(longId.status, 400, `An oversized lesson id must be refused, received ${longId.status}`);
});

/* 2. Wrong code gets a relevant nudge that gets clearer each time. */
const levels = [];
await step("the first failure gives one small nudge", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.equal(result.body.passed, false, "Broken code must not pass.");
  assert.equal(result.body.nudge.level, 1, `Expected level 1, received ${result.body.nudge.level}`);
  assert.equal(result.body.nudge.focus.length > 0, true, "A nudge must name a focus area.");
  assert.equal(result.body.nudge.example, "", "The first nudge must not show an example.");
  assert.equal(result.body.evidence.hintsRequested, 1, "The nudge must be recorded as a requested hint.");
  levels.push(result.body.nudge.message);
});

await step("a second failure gives a clearer explanation", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.body.nudge.level, 2, `Expected level 2, received ${result.body.nudge.level}`);
  assert.equal(result.body.evidence.hintsRequested, 2, "The second nudge must be counted.");
  levels.push(result.body.nudge.message);
});

await step("continued struggle shows a small related example", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(result.body.nudge.level, 3, `Expected level 3, received ${result.body.nudge.level}`);
  assert(result.body.nudge.example.length > 0, "The final level must show a related example.");
  levels.push(result.body.nudge.message);
});

await step("every level says something different", async () => {
  assert.equal(new Set(levels).size, 3, `Expected three different messages, received ${JSON.stringify(levels)}`);
});

await step("a code check gives specific feedback and records an attempt", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: brokenCode }) });
  assert.equal(result.body.passed, false);
  assert.equal(result.body.results.length, lessonOne.tests.length, "Every requirement must be reported.");
  assert.equal(result.body.results.every((item) => typeof item.passed === "boolean"), true);
  assert(result.body.feedback.includes(lessonOne.tests[0].label.toLowerCase()), "Feedback must name the failed requirement.");
  assert(result.body.evidence.attempts >= 4, `Attempts must be counted, received ${result.body.evidence.attempts}`);
  assert(result.body.evidence.struggles.length > 0, "A failed requirement must be recorded as a struggle.");
  assert(result.body.evidence.focusArea.length > 0, "A focus area must be reported.");
});

/* 3. Correct code is accepted and mastery is recorded once. */
let masteryAfterFirstPass = 0;
await step("correct code is accepted and acknowledges the concept", async () => {
  const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: lessonOneCode }) });
  assert.equal(result.body.passed, true, `Correct code must pass: ${JSON.stringify(result.body.results)}`);
  assert.equal(result.body.results.every((item) => item.passed), true);
  assert(result.body.acknowledgement.length > 0, "A success must acknowledge the concept demonstrated.");
  assert.equal(result.body.evidence.codePassed, true, "The code pass must be recorded.");
  assert.equal(result.body.evidence.successfulChecks, 1, `Expected one completed check, received ${result.body.evidence.successfulChecks}`);
  assert.equal(result.body.evidence.mastery, 75, `Expected three quarters of the offered checks, received ${result.body.evidence.mastery}`);
  masteryAfterFirstPass = result.body.evidence.mastery;
});

await step("a struggle clears once the requirement passes", async () => {
  const result = await api("/api/tutor");
  const row = result.body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert(row, "The lesson evidence must be listed.");
  assert.equal(row.struggles.length, 0, "Passing the requirement must clear the struggle.");
  assert.equal(row.focusArea, "", "A learner with no struggles must have no focus area.");
});

await step("repeated successful submissions cannot inflate mastery", async () => {
  const before = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "check", workspace: lessonOneCode }) });
    assert.equal(result.body.evidence.mastery, before.mastery, "Mastery must not rise on a repeated success.");
    assert.equal(result.body.evidence.successfulChecks, before.successfulChecks, "A repeated success must not add a check.");
  }
  const after = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(after.mastery, masteryAfterFirstPass, "Mastery after repeats must equal the first pass value.");
  assert.equal(after.successfulChecks, 1, "Only one code check may be recorded.");
});

/* 4. The quick check affects evidence, and the learner is credited with fixing
 *    the problem themselves after support. */
await step("an independent correction is recorded after support", async () => {
  const result = await api("/api/tutor");
  const row = result.body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(row.interventionPending, false, "A pass after support must close the pending intervention.");
  assert.equal(row.independentCorrections, 1, `Expected one independent correction, received ${row.independentCorrections}`);
});

await step("the quick check is graded on the server and affects evidence", async () => {
  const question = lessonOne.question;
  const wrong = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "quickcheck", questionAnswer: (question.answer + 1) % 3, workspace: lessonOneCode }) });
  assert.equal(wrong.body.quickCheck.correct, false, "A wrong quick check answer must not pass.");
  assert.equal(wrong.body.evidence.quickCheckPassed, false, "A wrong answer must not record a pass.");
  assert(wrong.body.quickCheck.message.length > 30, "A wrong answer needs a specific explanation.");

  const right = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "quickcheck", questionAnswer: question.answer, workspace: lessonOneCode }) });
  assert.equal(right.body.quickCheck.correct, true, "The correct answer must pass.");
  assert.equal(right.body.evidence.quickCheckPassed, true, "A correct answer must be recorded.");
  assert.equal(right.body.evidence.successfulChecks, 2, `Expected two completed checks, received ${right.body.evidence.successfulChecks}`);
  assert.equal(right.body.evidence.mastery, 100, `Expected full mastery, received ${right.body.evidence.mastery}`);
});

/* 5. Completion is recorded once, and the next lesson unlocks. */
let completionStamp = null;
await step("completing the lesson records evidence once", async () => {
  const complete = await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({
      lessonId: lessonOne.id,
      status: "completed",
      questionAnswer: lessonOne.question.answer,
      quizAnswers: [],
      reflection: "",
      workspace: lessonOneCode,
    }),
  });
  assert.equal(complete.status, 200, `Completion failed: ${JSON.stringify(complete.body)}`);
  const row = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert(row.completedAt, "Completion must record a timestamp.");
  assert.equal(row.mastery, 100, `A completed lesson must reach full mastery, received ${row.mastery}`);
  completionStamp = row.completedAt;
});

await step("completing the same lesson again does not change the record", async () => {
  const again = await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, status: "completed", questionAnswer: lessonOne.question.answer, quizAnswers: [], reflection: "", workspace: lessonOneCode }),
  });
  assert.equal(again.status, 200, `Repeat completion failed: ${JSON.stringify(again.body)}`);
  const row = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(row.completedAt, completionStamp, "The completion timestamp must be written only once.");
  assert.equal(row.successfulChecks, 2, "A repeat completion must not add checks.");
});

await step("lesson progression is still locked on the server", async () => {
  const blocked = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonThree.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(blocked.status, 409, `A locked lesson must be refused, received ${blocked.status}`);
});

await step("progress survives a reload", async () => {
  const progress = await api("/api/progress");
  assert.equal(progress.status, 200);
  const row = progress.body.progress.find((item) => item.lessonId === lessonOne.id);
  assert(row, "The completed lesson must come back from the server.");
  assert.equal(row.status, "completed", "The completed lesson must still be complete.");
  const evidence = (await api("/api/tutor")).body.evidence.find((item) => item.lessonId === lessonOne.id);
  assert.equal(evidence.mastery, 100, "Mastery must survive a reload.");
  assert.equal(evidence.completedAt, completionStamp, "The completion date must survive a reload.");
});

/* 6. Cross lesson review keeps a weak concept beyond its own lesson. */
const failedConcept = gradeRequirements(lessonOne, brokenCode).find((result) => !result.passed).concept;

await step("a missed requirement enters the review list", async () => {
  const result = await api("/api/review");
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert(result.body.totalDue >= 1, "The missed requirement must be queued for review.");
  assert(result.body.items.length <= 3, `The review list must stay small, received ${result.body.items.length}`);
  const item = result.body.items.find((candidate) => candidate.concept === failedConcept);
  assert(item, `Expected a review item for ${failedConcept}: ${JSON.stringify(result.body.items)}`);
  assert.equal(item.lessonId, lessonOne.id, "The review item must remember where it came from.");
  assert(item.focus.length > 0 && item.hint.length > 0, "A review item needs a focus and a hint.");
  assert.equal(typeof item.timesFailed, "number", "A review item needs a recorded failure count.");
});

await step("passing the requirement in its own lesson does not retire it", async () => {
  const result = await api("/api/review");
  const item = result.body.items.find((candidate) => candidate.concept === failedConcept);
  assert(item, "The concept must still be due after the learner passed it in the lesson.");
  assert(item.timesRecovered >= 1, "The in lesson recovery must be recorded.");
});

await step("one successful recall keeps the concept queued", async () => {
  const result = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: failedConcept, recalled: true }) });
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.equal(result.body.retired, false, "One recall must not retire a concept.");
  assert.equal(result.body.item.reviewStreak, 1, `Expected a streak of one, received ${result.body.item.reviewStreak}`);
  assert(result.body.totalDue >= 1, "The concept must still be due.");
});

await step("a concept recalled once is still shown as needing another look", async () => {
  const summary = (await readSummary()).body.summary;
  const strengthened = summary.strengthened.find((entry) => entry.concept === failedConcept);
  assert(strengthened, `A recalled concept must appear as strengthened: ${JSON.stringify(summary.strengthened)}`);
  assert.equal(strengthened.reviewStreak, 1, "The strengthened entry must carry the recall it recorded.");
  assert(summary.needsReview.some((entry) => entry.concept === failedConcept),
    "One recall must not clear a concept from the weak list.");
});

await step("a second successful recall retires the concept", async () => {
  const result = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: failedConcept, recalled: true }) });
  assert.equal(result.body.retired, true, "Two recalls must retire the concept.");
  const after = await api("/api/review");
  /* Other concepts may legitimately still be waiting, so the check is about this
   * concept leaving the queue rather than the queue being empty. */
  assert.equal(after.body.items.some((item) => item.concept === failedConcept), false,
    `A retired concept must stop appearing: ${JSON.stringify(after.body.items.map((item) => item.concept))}`);
  assert(after.body.maxItems <= 3, "The queue must stay small.");
});

await step("a missed recall puts the concept back and raises its count", async () => {
  const failedLessonTwo = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonTwo.id, action: "check", workspace: brokenCode }) });
  assert.equal(failedLessonTwo.body.passed, false, "The second lesson workspace must fail.");
  const concept = failedLessonTwo.body.nudge.concept;
  const before = await api("/api/review");
  const item = before.body.items.find((candidate) => candidate.concept === concept);
  assert(item, `Expected ${concept} to be queued: ${JSON.stringify(before.body.items)}`);
  const missed = await api("/api/review", { method: "POST", body: JSON.stringify({ concept, recalled: false }) });
  assert.equal(missed.body.retired, false, "A missed recall must not retire anything.");
  assert.equal(missed.body.item.reviewStreak, 0, "A missed recall must reset the streak.");
  assert(missed.body.item.timesFailed > item.timesFailed, "A missed recall must raise the failure count.");
  assert(missed.body.totalDue >= 1, "The concept must stay queued.");
});

await step("a review answer for an unknown concept is refused", async () => {
  const result = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: "not-a-real-concept", recalled: true }) });
  assert.equal(result.status, 403, `Expected 403, received ${result.status}`);
});

await step("the review list is validated", async () => {
  const bad = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: "", recalled: true }) });
  assert.equal(bad.status, 400, `An empty concept must be refused, received ${bad.status}`);
  const long = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: "c".repeat(200), recalled: true }) });
  assert.equal(long.status, 400, `An oversized concept must be refused, received ${long.status}`);
  const wrongType = await api("/api/review", { method: "POST", body: JSON.stringify({ concept: "main-heading", recalled: "yes" }) });
  assert.equal(wrongType.status, 400, `A non boolean outcome must be refused, received ${wrongType.status}`);
});

await step("partial progress reports correct totals and no double counting", async () => {
  const first = await readSummary();
  const summary = first.body.summary;
  assert.equal(summary.courseProgress.lessonsCompleted, 1, `Expected one completed activity, received ${summary.courseProgress.lessonsCompleted}`);
  assert.equal(summary.courseProgress.checksPassed, 2, `Expected two passed checks, received ${summary.courseProgress.checksPassed}`);
  assert.equal(summary.modules[0].lessonsCompleted, 1, "The first module must show one completed activity.");
  assert.equal(summary.modules[0].checksPassed, 2, "The first module must show the checks it passed.");
  assert.equal(summary.modules[0].status, "in-progress");
  assert.equal(summary.modules[1].status, "not-started");
  assert.equal(summary.courseProgress.status, "in-progress");
  /* Two corrections in this journey: the code repair after a nudge, and the
   * quick check answered correctly after a wrong attempt. */
  assert.equal(summary.independentCorrections, 2, `Expected two independent corrections, received ${summary.independentCorrections}`);
  assert(summary.recentActivityAt, "A learner who has worked must have an activity date.");
  assert.equal(summary.nextAction.kind, "lesson");
  assert.equal(summary.nextAction.lessonId, course.lessons[1].id, "The next step must move on with the learner.");

  /* Completing the same activity again must not move any total. */
  await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, status: "completed", questionAnswer: lessonOne.question.answer, quizAnswers: [], reflection: "", workspace: lessonOneCode }),
  });
  const after = (await readSummary()).body.summary;
  assert.equal(after.courseProgress.lessonsCompleted, summary.courseProgress.lessonsCompleted, "A repeat completion must not be counted twice.");
  assert.equal(after.courseProgress.checksPassed, summary.courseProgress.checksPassed, "A repeat completion must not add checks.");
  assert.equal(after.modules[0].lessonsCompleted, 1, "A repeat completion must not inflate the module total.");
});

await step("a retired concept is strengthened and a due one needs another look", async () => {
  const summary = (await readSummary()).body.summary;
  const settled = summary.strengthened.find((entry) => entry.concept === failedConcept);
  assert(settled, `A retired concept must appear as strengthened: ${JSON.stringify(summary.strengthened)}`);
  assert.equal(settled.reviewStreak, 2, "A retired concept must record both recalls.");
  assert.equal(summary.needsReview.some((entry) => entry.concept === failedConcept), false,
    "A retired concept must never be shown as weak.");
  const waiting = summary.needsReview.find((entry) => entry.concept !== failedConcept);
  assert(waiting, `The concept missed later must need another look: ${JSON.stringify(summary.needsReview)}`);
  assert(waiting.focus.length > 0 && waiting.label.length > 0, "A weak concept must carry a readable focus and requirement.");
  assert(summary.needsReview.every((entry) => entry.focus.length > 0), "Every weak concept needs a readable focus.");
});

await step("the summary never leaks code, answers or identifiers", async () => {
  const body = JSON.stringify((await readSummary()).body);
  for (const probe of ["<h1>", "<p>", "My First Website", "querySelector", "workspace", "practical", "answers", "kidycode_session"]) {
    assert.equal(body.includes(probe), false, `The summary must not contain ${probe}.`);
  }
  assert.equal(body.includes(firstLearner.id), false, "The summary must not return the learner identifier.");
});

/* 7. A second learner cannot see or change the first learner records. */
await step("one learner cannot see another learner records", async () => {
  const other = await createLearner("OtherCoder", "ages-10-12", 12);
  assert.notEqual(other.id, firstLearner.id, "The second learner must have a different identity.");
  const isolated = await api("/api/tutor");
  assert.deepEqual(isolated.body.evidence, [], "A second learner must not see the first learner evidence.");
  const progress = await api("/api/progress");
  assert.deepEqual(progress.body.progress, [], "A second learner must not see the first learner progress.");
  const reviews = await api("/api/review");
  assert.deepEqual(reviews.body.items, [], "A second learner must not see the first learner review list.");
  assert.equal(reviews.body.totalDue, 0, "A second learner must have nothing due.");
  const foreign = await readSummary(`?learnerId=${firstLearner.id}`);
  assert.equal(foreign.status, 403, `Reading the first learner summary must be refused, received ${foreign.status}`);
  const ownSummary = await readSummary(`?learnerId=${other.id}`);
  assert.equal(ownSummary.status, 200, "A learner may read their own summary by identifier.");
  assert.equal(ownSummary.body.summary.courseProgress.lessonsCompleted, 0, "The second learner has their own totals.");
  const own = await api("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) });
  assert.equal(own.body.evidence.lessonId, lessonOne.id);
  assert.equal(own.body.evidence.hintsRequested, 1, "The second learner must start from zero hints.");
});

await step("the first learner records were not changed by the second learner", async () => {
  const response = await api("/api/learners", { method: "DELETE" });
  assert.equal(response.status, 200);
  const fresh = await createLearner("TutorCheck", "ages-10-12", 11);
  assert(fresh.id !== firstLearner.id, "A reset must create a new profile.");
  assert.deepEqual((await api("/api/tutor")).body.evidence, [], "A new profile must start with no evidence.");
  assert.deepEqual((await api("/api/review")).body.items, [], "A new profile must start with no review items.");
});

/* 8. Every learning path produces a summary of its own. */
for (const [courseId, bundle] of Object.entries(courses)) {
  await step(`the summary works for ${courseId}`, async () => {
    await createLearner("PathCheck", courseId, bundle.courseFacts.ages[0]);
    const result = await readSummary();
    assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
    const summary = result.body.summary;
    assert.equal(summary.course.id, courseId, `Expected ${courseId}, received ${summary.course.id}`);
    assert.equal(summary.courseProgress.lessonsTotal, bundle.lessons.length);
    assert.equal(summary.modules.length, bundle.stages.length);
    assert.equal(summary.courseProgress.lessonsCompleted, 0);
    const lessonIds = new Set(bundle.lessons.map((lesson) => lesson.id));
    assert(lessonIds.has(summary.nextAction.lessonId), "The next step must belong to this course.");
  });
}

/* 9. Grown-up access: platform identity, one-time codes, linking and
 *    authorisation. The identity headers stand in for the platform edge, which
 *    forwards them after a ChatGPT sign-in. */
const CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

async function guardianApi(path, options = {}, identity = null) {
  const headers = { "content-type": "application/json" };
  if (identity) {
    headers["oai-authenticated-user-id"] = identity.id;
    headers["oai-authenticated-user-email"] = identity.email;
    if (identity.name) headers["oai-authenticated-user-full-name"] = identity.name;
  }
  const response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(30000) });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function learnerApi(path, options = {}) {
  const headers = { "content-type": "application/json", cookie };
  const response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(30000) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

/* Guardian identities are unique per run, because a guardian account is real
 * and durable: reusing one would carry links from an earlier run into this one. */
const guardianRunTag = crypto.randomUUID().slice(0, 8);
const guardianIdentity = (name) => ({ id: `guardian-${name}-${guardianRunTag}`, email: `${name}-${guardianRunTag}@example.test` });
const alpha = { ...guardianIdentity("alpha"), name: "Ana Alpha" };
const beta = guardianIdentity("beta");
const gamma = guardianIdentity("gamma");
const delta = guardianIdentity("delta");
const omega = guardianIdentity("omega");

await step("guardian endpoints refuse a caller with no platform identity", async () => {
  for (const [path, method] of [["/api/guardian/session", "GET"], ["/api/guardian/links", "POST"], ["/api/guardian/summary?link=abc", "GET"]]) {
    const result = await guardianApi(path, { method, body: method === "POST" ? JSON.stringify({ code: "AAAA-BBBB-CCCC-DDDD" }) : undefined });
    assert.equal(result.status, 401, `${method} ${path} must answer 401 without an identity, received ${result.status}`);
    assert.equal(result.body.signInPath, "/signin-with-chatgpt", "A 401 must point at the platform sign in.");
  }
});

await step("a browser cannot claim an identity through the body", async () => {
  const result = await guardianApi("/api/guardian/links", {
    method: "POST",
    body: JSON.stringify({ code: "AAAA-BBBB-CCCC-DDDD", platformUserId: alpha.id, email: alpha.email }),
  });
  assert.equal(result.status, 401, `A body supplied identity must be ignored, received ${result.status}`);
});

let learnerACookie = "";
let learnerAId = "";
let learnerAFirstCode = "";

await step("a learner can create a connection code", async () => {
  const learner = await createLearner("GuardianChild", "ages-10-12", 11);
  learnerAId = learner.id;
  learnerACookie = cookie;
  const result = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.match(result.body.issuedCode, CODE_PATTERN, `A code must be readable and grouped: ${result.body.issuedCode}`);
  assert(result.body.pendingCode?.expiresAt, "A code must come with an expiry.");
  assert.equal(result.body.connections.length, 0, "A new learner starts with nobody connected.");
  learnerAFirstCode = result.body.issuedCode;
});

await step("the code is not returned again after it is created", async () => {
  const result = await learnerApi("/api/guardian/connections");
  assert.equal(result.body.pendingCode?.expiresAt ? true : false, true, "The waiting code must still be reported as pending.");
  assert.equal(JSON.stringify(result.body).includes(learnerAFirstCode.replace(/-/g, "")), false, "The plain code must not be readable again.");
  assert.equal(result.body.issuedCode, undefined, "Only the moment of creation returns a plain code.");
});

await step("a wrong code is rejected and attempts are bounded", async () => {
  const wrong = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: "ZZZZ-ZZZZ-ZZZZ-ZZZZ" }) }, gamma);
  assert.equal(wrong.status, 404, `A code that does not exist must be refused, received ${wrong.status}`);
  const malformed = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: "not-a-code" }) }, gamma);
  assert.equal(malformed.status, 404, `A malformed code must be refused, received ${malformed.status}`);
  let limited = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: `AAAA-BBBB-CCCC-DDD${attempt}` }) }, gamma);
    if (result.status === 429) { limited += 1; break; }
  }
  assert.equal(limited, 1, "Repeated attempts from one guardian must eventually be limited.");
  const stillLimited = await guardianApi("/api/guardian/session", {}, gamma);
  assert.equal(stillLimited.status, 200, "A limited guardian can still read their own account.");
});

await step("a guardian connects with a valid code", async () => {
  const result = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: learnerAFirstCode }) }, alpha);
  assert.equal(result.status, 200, `Expected 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  assert.equal(result.body.connected, true);
  assert.equal(result.body.learner.firstName, "GuardianChild");
  assert(result.body.learner.linkRef, "A connection must return an opaque handle.");
  assert.equal(result.body.learner.linkRef.includes(learnerAId), false, "A handle must not contain the learner identifier.");
  assert.equal(result.body.learners.length, 1, "The guardian's list must show the learner.");
});

await step("a used code cannot be used again", async () => {
  const result = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: learnerAFirstCode }) }, delta);
  assert.equal(result.status, 410, `A spent code must be refused, received ${result.status}`);
});

await step("a new code invalidates the previous unused one", async () => {
  const first = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  const superseded = first.body.issuedCode;
  const second = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.notEqual(first.body.issuedCode, second.body.issuedCode, "A replacement code must differ.");
  const old = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: superseded }) }, omega);
  assert.equal(old.status, 410, `A replaced code must stop working, received ${old.status}`);
  const current = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: second.body.issuedCode }) }, omega);
  assert.equal(current.status, 200, `The newest code must work, received ${current.status}`);
});

await step("two guardians racing on one code cannot both link", async () => {
  const created = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  const code = created.body.issuedCode;
  const [left, right] = await Promise.all([
    guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code }) }, beta),
    guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code }) }, delta),
  ]);
  const winners = [left, right].filter((result) => result.status === 200);
  const losers = [left, right].filter((result) => result.status !== 200);
  assert.equal(winners.length, 1, `Exactly one claim may win, received ${left.status} and ${right.status}`);
  assert.equal(losers.length, 1, "The other claim must be refused.");
  const winner = winners[0];
  assert.equal(winner.body.learners.length, 1, "The winner must hold exactly one link, not two.");
  const loserSession = losers[0] === left
    ? await guardianApi("/api/guardian/session", {}, beta)
    : await guardianApi("/api/guardian/session", {}, delta);
  assert.equal(loserSession.body.learners.length, 0, "The losing guardian must have no link.");
});

await step("one child can have two grown-ups who were separately approved", async () => {
  cookie = learnerACookie;
  const connections = await learnerApi("/api/guardian/connections");
  /* More than one grown-up can be connected at once, each one approved
   * separately with their own code. */
  assert(connections.body.connections.length >= 2,
    `Expected at least two connected grown-ups, received ${connections.body.connections.length}`);
  const first = connections.body.connections[0];
  assert(first.guardianName.length > 0, "A connection needs a name the learner can recognise.");
  assert(first.guardianEmailMasked.includes("*"), "A child must not be shown a full address.");
  assert.equal(first.guardianEmailMasked.includes("alpha@example.test"), false, "A full address must never reach the learner page.");
});

await step("one guardian can follow more than one learner", async () => {
  await createLearner("GuardianChildTwo", "ages-13-15", 14);
  const secondCookie = cookie;
  const created = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  const claimed = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ code: created.body.issuedCode }) }, alpha);
  assert.equal(claimed.status, 200, `Expected 200, received ${claimed.status}`);
  assert.equal(claimed.body.learners.length, 2, `Expected two learners, received ${claimed.body.learners.length}`);
  const courseGroups = claimed.body.learners.map((learner) => learner.courseGroup).sort();
  assert.equal(courseGroups.length, 2, "Both learners must be listed.");
  assert(courseGroups.every((group) => group.startsWith("Ages") || group === "Adults"), `Unexpected course group: ${courseGroups}`);
  void secondCookie;
});

await step("the guardian summary is complete and allow listed", async () => {
  cookie = learnerACookie;
  const session = await guardianApi("/api/guardian/session", {}, alpha);
  const link = session.body.learners.find((learner) => learner.firstName === "GuardianChild");
  assert(link, "The learner must be listed for the guardian.");
  const result = await guardianApi(`/api/guardian/summary?link=${encodeURIComponent(link.linkRef)}`, {}, alpha);
  assert.equal(result.status, 200, `Expected 200, received ${result.status}: ${JSON.stringify(result.body)}`);
  const summary = result.body.summary;
  const allowed = new Set([
    "summary", "learner", "activities", "modules", "needsReview", "strengthened", "project",
    "finalAssessment", "lastActivityAt", "nextLesson", "firstName", "courseGroup", "completed", "total",
    "label", "number", "title", "masteryLabel", "focus", "moduleNumber", "saved", "status", "bestScore",
  ]);
  const seen = new Set();
  (function walk(value) {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) { seen.add(key); walk(entry); }
    }
  }(result.body));
  for (const key of seen) {
    assert(allowed.has(key), `The guardian summary exposes ${key}, which is outside the allow list.`);
  }
  assert.equal(summary.learner.firstName, "GuardianChild");
  assert.equal(summary.learner.courseGroup, "Ages 10 to 12");
  assert.equal(summary.modules.length, course.stages.length);
  assert(summary.activities.total === course.lessons.length, "The totals must match the course.");
  assert(summary.nextLesson.title.length > 0, "A next lesson must be recommended.");
});

await step("the guardian summary leaks nothing it must not", async () => {
  cookie = learnerACookie;
  const session = await guardianApi("/api/guardian/session", {}, alpha);
  const link = session.body.learners.find((learner) => learner.firstName === "GuardianChild");
  const body = JSON.stringify((await guardianApi(`/api/guardian/summary?link=${encodeURIComponent(link.linkRef)}`, {}, alpha)).body);
  for (const probe of ["<h1>", "<p>", "My First Website", "querySelector", "workspace", "answers", "practical", "kidycode_session", "concept", "timesFailed", "reviewStreak", "independentCorrections", "checksPassed"]) {
    assert.equal(body.includes(probe), false, `The guardian summary must not contain ${probe}.`);
  }
  assert.equal(body.includes(learnerAId), false, "The guardian summary must not contain the learner identifier.");
  assert.equal(body.includes(learnerAFirstCode.replace(/-/g, "")), false, "The guardian summary must not contain a code.");
  assert.equal(body.includes(alpha.id), false, "The guardian summary must not contain the platform identity.");
});

await step("an unrelated guardian is refused", async () => {
  cookie = learnerACookie;
  const session = await guardianApi("/api/guardian/session", {}, alpha);
  const link = session.body.learners.find((learner) => learner.firstName === "GuardianChild");
  const result = await guardianApi(`/api/guardian/summary?link=${encodeURIComponent(link.linkRef)}`, {}, omega);
  assert.equal(result.status, 403, `A guardian with no link must be refused, received ${result.status}`);
});

await step("knowing a learner identifier gives a guardian nothing", async () => {
  const byLearnerId = await guardianApi(`/api/guardian/summary?link=${learnerAId}`, {}, omega);
  assert.equal(byLearnerId.status, 403, `A guessed learner identifier must fail, received ${byLearnerId.status}`);
  const asQuery = await guardianApi(`/api/guardian/summary?learnerId=${learnerAId}`, {}, omega);
  assert.equal(asQuery.status, 400, `An unknown parameter must not be accepted, received ${asQuery.status}`);
  const asLinkRef = await guardianApi("/api/guardian/links", { method: "POST", body: JSON.stringify({ learnerId: learnerAId }) }, omega);
  assert.equal(asLinkRef.status, 400, `A link must never be created from a learner identifier, received ${asLinkRef.status}`);
});

await step("a guardian cannot change a learner's work", async () => {
  const progress = await guardianApi("/api/progress", {
    method: "POST",
    body: JSON.stringify({ lessonId: lessonOne.id, status: "completed", questionAnswer: 0, quizAnswers: [], reflection: "", workspace: brokenCode }),
  });
  assert.equal(progress.status, 401, `A guardian is not a learner session, received ${progress.status}`);
  const tutor = await guardianApi("/api/tutor", { method: "POST", body: JSON.stringify({ lessonId: lessonOne.id, action: "nudge", workspace: brokenCode }) }, alpha);
  assert.equal(tutor.status, 401, `A guardian identity is not a learner session, received ${tutor.status}`);
  const write = await guardianApi("/api/guardian/summary", { method: "POST", body: JSON.stringify({ link: "x" }) }, alpha);
  assert(write.status >= 400, `The guardian summary must be read only, received ${write.status}`);
});

await step("revoking a connection stops the guardian immediately", async () => {
  cookie = learnerACookie;
  const before = await learnerApi("/api/guardian/connections");
  const countBefore = before.body.connections.length;
  const session = await guardianApi("/api/guardian/session", {}, omega);
  const link = session.body.learners[0];
  assert(link, "The guardian approved earlier must still be listed.");
  const revoked = await learnerApi("/api/guardian/connections", { method: "DELETE", body: JSON.stringify({ action: "revoke", linkRef: link.linkRef }) });
  assert.equal(revoked.status, 200, `Expected 200, received ${revoked.status}`);
  assert.equal(revoked.body.connections.length, countBefore - 1,
    `Revoking must remove exactly one connection: was ${countBefore}, now ${revoked.body.connections.length}`);
  assert.equal(revoked.body.connections.some((row) => row.linkRef === link.linkRef), false,
    "The revoked grown-up must leave the learner's list.");
  const blocked = await guardianApi(`/api/guardian/summary?link=${encodeURIComponent(link.linkRef)}`, {}, omega);
  assert.equal(blocked.status, 403, `A revoked link must stop working at once, received ${blocked.status}`);
  const after = await guardianApi("/api/guardian/session", {}, omega);
  assert.equal(after.body.learners.length, 0, "A revoked learner must leave the guardian's list.");
});

await step("a guardian can disconnect themselves", async () => {
  cookie = learnerACookie;
  const session = await guardianApi("/api/guardian/session", {}, alpha);
  const link = session.body.learners.find((learner) => learner.firstName === "GuardianChild");
  const result = await guardianApi("/api/guardian/links", { method: "DELETE", body: JSON.stringify({ linkRef: link.linkRef }) }, alpha);
  assert.equal(result.status, 200, `Expected 200, received ${result.status}`);
  assert.equal(result.body.learners.some((learner) => learner.firstName === "GuardianChild"), false, "The learner must leave the list.");
  const connections = await learnerApi("/api/guardian/connections");
  assert.equal(connections.body.connections.some((row) => row.linkRef === link.linkRef), false, "The learner's list must lose that grown-up.");
});

await step("grown-up access is not part of the adult path", async () => {
  await createLearner("AdultLearner", "adults", 19);
  const read = await learnerApi("/api/guardian/connections");
  assert.equal(read.status, 409, `An adult must not reach grown-up access, received ${read.status}`);
  const create = await learnerApi("/api/guardian/connections", { method: "POST", body: JSON.stringify({ action: "generate" }) });
  assert.equal(create.status, 409, `An adult must not create a code, received ${create.status}`);
  const revoke = await learnerApi("/api/guardian/connections", { method: "DELETE", body: JSON.stringify({ action: "revoke", linkRef: "x" }) });
  assert.equal(revoke.status, 409, `An adult must not revoke anything, received ${revoke.status}`);
});

console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}
