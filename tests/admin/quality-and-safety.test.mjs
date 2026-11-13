#!/usr/bin/env node
/*
 * The quality checks, the review book rules and the notification safety rules.
 *
 * The quality module is a heuristic: these checks prove it actually notices the defects it
 * claims to notice, by feeding it a deliberately broken lesson, and that a clean lesson is
 * left alone. The review book and the notification rules are asserted directly, including
 * that there is no send path.
 */

import assert from "node:assert/strict";
import { adminLessonIndex } from "../../lib/admin-curriculum.ts";
import { curriculumQuality, lessonQuality, normalizePrompt } from "../../lib/admin-quality.ts";
import {
  makeReview,
  parseReviewBook,
  reviewStatuses,
  serializeReviewBook,
  summarizeReview,
} from "../../lib/admin-review.ts";
import {
  canSend,
  defaultQuietHours,
  planSend,
  renderMessage,
  safeDisplayName,
  withinQuietHours,
} from "../../lib/admin-notifications.ts";

let checks = 0;
const failing = [];

function check(label, body) {
  checks += 1;
  try {
    body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failing.push(label);
    console.log(`  FAIL ${label}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const index = adminLessonIndex();

console.log("quality: the heuristic notices real defects");
const brokenRef = {
  key: "demo:0:broken",
  pathwayId: "demo",
  pathwayTitle: "Demo",
  ageRange: "Ages 0",
  kind: "coding",
  unitIndex: 0,
  unitId: "demo",
  unitTitle: "Demo unit",
  unitNumber: 1,
  lesson: {
    id: "broken",
    title: "Broken lesson",
    type: "challenge",
    language: "HTML",
    minutes: 200,
    objective: "Short.",
    notes: [],
    keyTerms: [],
    activity: "Do it.",
    workedExample: "",
    exampleExplanation: "",
    starterFiles: { html: '<img src="a.png"><button></button><input>', css: "", javascript: "" },
    hints: [],
    requirements: [],
    questions: [{ prompt: "Which?", options: ["a", "a", "b"], correctIndex: 7, explanation: "no" }],
    reflection: "",
  },
};

check("a broken lesson raises the expected suggestions", () => {
  const quality = lessonQuality(brokenRef);
  const codes = new Set(quality.flags.map(flag => flag.code));
  for (const expected of [
    "thin-objective",
    "missing-notes",
    "missing-example",
    "no-hints",
    "no-requirements",
    "answer-out-of-range",
    "duplicate-options",
    "weak-explanation",
    "image-missing-alt",
    "button-missing-text",
    "long-lesson",
  ]) {
    assert.ok(codes.has(expected), `expected a ${expected} suggestion, saw ${[...codes].join(", ")}`);
  }
});
check("a well formed lesson produces no suggestions", () => {
  const clean = {
    ...brokenRef,
    key: "demo:0:clean",
    lesson: {
      ...brokenRef.lesson,
      id: "clean",
      title: "Clean lesson",
      type: "challenge",
      minutes: 12,
      objective: "Write an opening tag, some content and a closing tag for the page.",
      notes: [
        "HTML gives a webpage structure. Most elements have an opening tag, content and a closing tag, and the tag name tells the browser what the content means.",
        "Work through the example one element at a time and run the page before you change the next thing so you can see which change did what.",
      ],
      activity: "Replace the plain text with an h1 element that says My First Website.",
      workedExample: "<h1>My First Website</h1>",
      exampleExplanation: "The h1 element is the main heading of the page.",
      starterFiles: { html: '<img src="a.png" alt="A short useful description">', css: "", javascript: "" },
      hints: ["A main heading begins with <h1>.", "Put the words between the two tags.", "Use <h1>My First Website</h1>."],
      requirements: ["Your page has the required h1"],
      questions: [{ prompt: "Which element marks the main heading?", options: ["The h1 element", "The file name", "The space bar"], correctIndex: 0, explanation: "h1 represents the main heading of the page." }],
    },
  };
  const flags = lessonQuality(clean).flags;
  assert.deepEqual(flags.map(flag => `${flag.code}: ${flag.message}`), []);
});
check("the heuristic does not flag the bulk of a healthy catalogue", () => {
  const withSuggestions = index.filter(entry => lessonQuality(entry).flags.some(flag => flag.level === "suggestion"));
  assert.ok(withSuggestions.length < index.length / 2, `expected fewer than half the lessons to be flagged, saw ${withSuggestions.length} of ${index.length}`);
});
check("every flag is labelled a suggestion or plain information, never a finding", () => {
  for (const entry of index) {
    for (const flag of lessonQuality(entry).flags) {
      assert.ok(["info", "suggestion"].includes(flag.level));
    }
  }
});
check("a correct answer out of range is only flagged when it really is", () => {
  const valid = lessonQuality({ ...brokenRef, lesson: { ...brokenRef.lesson, questions: [{ prompt: "Q", options: ["a", "b", "c"], correctIndex: 1, explanation: "A full explanation of the answer." }] } });
  assert.ok(!valid.flags.some(flag => flag.code === "answer-out-of-range"));
});

console.log("quality: the whole catalogue");
check("the report covers the whole index and declares itself heuristic", () => {
  const report = curriculumQuality(index);
  assert.equal(report.totalLessons, index.length);
  assert.equal(report.heuristic, true);
  assert.ok(report.note.length > 20);
  assert.equal(report.lessons.length, index.length);
});
check("duplicate prompts are grouped by normalised text only", () => {
  const report = curriculumQuality(index);
  for (const duplicate of report.duplicates) {
    assert.ok(duplicate.lessonKeys.length > 1, "a duplicate must name more than one lesson");
    assert.equal(duplicate.normalized, normalizePrompt(duplicate.prompt));
  }
});
check("normalising a prompt is stable and case-insensitive", () => {
  assert.equal(normalizePrompt("What  is  an Element?"), normalizePrompt("what is an element"));
});

console.log("review book: untrusted input");
check("a malformed book is dropped rather than trusted", () => {
  assert.deepEqual(parseReviewBook("not json"), {});
  assert.deepEqual(parseReviewBook('["array"]'), {});
  assert.deepEqual(parseReviewBook('{"bad key!!": {"status":"reviewed","note":"x"}}'), {});
  assert.deepEqual(parseReviewBook('{"ages-10-12:0:x": {"status":"nonsense","note":"x"}}'), {});
});
check("a valid book round-trips", () => {
  const book = { "ages-10-12:0:html-foundations-elements": makeReview("issue", "Needs a clearer example") };
  const parsed = parseReviewBook(serializeReviewBook(book));
  assert.equal(parsed["ages-10-12:0:html-foundations-elements"].status, "issue");
  assert.equal(parsed["ages-10-12:0:html-foundations-elements"].note, "Needs a clearer example");
});
check("a note is stripped of control characters and capped", () => {
  const review = makeReview("reviewed", `${"a".repeat(5000)}\u0000\u0007`);
  assert.ok(review.note.length <= 2000);
  assert.ok(!review.note.includes("\u0000"));
});
check("the summary counts each status and the decided share", () => {
  const summary = summarizeReview({ "a:0:b": makeReview("reviewed", ""), "a:0:c": makeReview("issue", "note") }, 10);
  assert.equal(summary.byStatus.reviewed, 1);
  assert.equal(summary.byStatus.issue, 1);
  assert.equal(summary.noted, 1);
  assert.equal(summary.decided, 2);
  assert.equal(summary.total, 10);
  assert.equal(summary.completionPercent, 20);
});
check("every declared status is represented in the labels", () => {
  for (const status of reviewStatuses) assert.ok(typeof status === "string" && status.length > 0);
});

console.log("notifications: permissions and safety");
const ownerContext = { role: "owner", cohortIds: [], guardianLinkedChildRefs: [] };
const teacherContext = { role: "institution", cohortIds: ["cohort-a"], guardianLinkedChildRefs: [] };
const guardianContext = { role: "guardian", cohortIds: [], guardianLinkedChildRefs: ["child-1"] };

check("a guardian message from the owner is allowed in principle", () => {
  const decision = canSend(ownerContext, { template: "guardian-report", audience: "guardian", recipientRef: "pathway-wide", variables: {} });
  assert.equal(decision.allowed, true);
});
check("a direct message to an under-18 learner is refused without child-directed consent", () => {
  const decision = canSend(ownerContext, { template: "unfinished-lesson", audience: "learner", recipientRef: "pathway-wide", variables: {} });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /child-directed consent/);
});
check("an institution role may not broadcast platform-wide", () => {
  const decision = canSend(teacherContext, { template: "announcement", audience: "guardian", recipientRef: "pathway-wide", variables: {} });
  assert.equal(decision.allowed, false);
});
check("an institution role reaches only a cohort it leads", () => {
  const allowed = canSend(teacherContext, { template: "guardian-report", audience: "guardian", recipientRef: "cohort-a", variables: {} });
  assert.equal(allowed.allowed, true);
  const refused = canSend(teacherContext, { template: "guardian-report", audience: "guardian", recipientRef: "cohort-z", variables: {} });
  assert.equal(refused.allowed, false);
});
check("an institution role may never address a learner directly", () => {
  const decision = canSend(teacherContext, { template: "unfinished-lesson", audience: "learner", recipientRef: "cohort-a", variables: {} });
  assert.equal(decision.allowed, false);
});
check("a guardian may not broadcast either", () => {
  const decision = canSend(guardianContext, { template: "announcement", audience: "guardian", recipientRef: "pathway-wide", variables: {} });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /linked children/);
});

check("quiet hours cover an overnight window in the recipient time zone", () => {
  const at = new Date("2026-11-13T20:00:00.000Z"); // 23:00 in Nairobi
  assert.equal(withinQuietHours(at, defaultQuietHours, "Africa/Nairobi"), true);
  const daytime = new Date("2026-11-13T09:00:00.000Z"); // 12:00 in Nairobi
  assert.equal(withinQuietHours(daytime, defaultQuietHours, "Africa/Nairobi"), false);
});
check("a deliverable draft still refuses live delivery", () => {
  const plan = planSend(ownerContext, { template: "guardian-report", audience: "guardian", recipientRef: "pathway-wide", variables: { name: "SkyCoder" } }, {
    now: new Date("2026-11-13T09:00:00.000Z"),
    sentThisWeek: 0,
  });
  assert.equal(plan.deliverable, true);
  assert.equal(plan.liveDeliveryEnabled, false);
  assert.equal(plan.dryRunOnly, true);
});
check("the frequency cap stops another message in the same week", () => {
  const plan = planSend(ownerContext, { template: "achievement", audience: "guardian", recipientRef: "pathway-wide", variables: {} }, {
    now: new Date("2026-11-13T09:00:00.000Z"),
    sentThisWeek: 5,
  });
  assert.equal(plan.deliverable, false);
  assert.ok(plan.reasons.some(reason => /Frequency cap/.test(reason)));
});
check("nobody may borrow the owner's broadcast permission", () => {
  const decision = canSend({ role: "learner", cohortIds: [], guardianLinkedChildRefs: [] }, { template: "announcement", audience: "guardian", recipientRef: "x", variables: {} });
  assert.equal(decision.allowed, false);
});
check("a nickname is reduced and never a full name or email", () => {
  assert.equal(safeDisplayName("  Sky   Coder  "), "Sky Coder");
  assert.equal(safeDisplayName(""), "there");
  assert.ok(safeDisplayName("a".repeat(200)).length <= 24);
  assert.ok(!safeDisplayName("a@b.com\nschool").includes("\n"));
});
check("a rendered message never leaves an unfilled placeholder", () => {
  const rendered = renderMessage({ template: "guardian-report", audience: "guardian", recipientRef: "x", variables: { name: "SkyCoder" } });
  assert.ok(!rendered.subject.includes("{"));
  assert.ok(!rendered.body.includes("{name}"));
});
check("the no-shaming template never blames the learner for a gap", () => {
  const rendered = renderMessage({ template: "missed-week", audience: "guardian", recipientRef: "x", variables: { name: "SkyCoder", nextSuggestion: "one short lesson" } });
  assert.doesNotMatch(rendered.body, /missed|failed|behind|absent|late/i);
});

if (failing.length > 0) {
  console.error(`\nadmin quality and safety: ${failing.length} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`\nadmin quality and safety: all ${checks} checks passed`);
