/*
 * Requirement grading: every check kind the content uses, with a passing and a failing
 * submission. The failing case is asserted to fail, so a fixture that is in fact
 * correct cannot quietly pass and hide a real defect behind a green run.
 *
 *   node --import tsx tests/assessment/grading.test.mjs
 */
import assert from "node:assert/strict";
import { buildContext, runCheck } from "../../lib/assessment/grading.ts";
import { check, passed, report, stepSync, sweep, failed } from "./harness.mjs";
import { PARTIAL_PROJECT, SAFE_PROJECT, UNSAFE_PROJECT, WEAK_PROJECT } from "./fixtures.mjs";

const F = (files) => buildContext(files);

const cases = [
  /* HTML */
  { name: "html-element finds a list", spec: { kind: "html-element", file: "html", tag: "ul" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "html-element counts repeated items", spec: { kind: "html-element", file: "html", tag: "li", min: 3 }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "html-attribute reads alternative text", spec: { kind: "html-attribute", file: "html", tag: "img", attr: "alt", minLength: 8 }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "html-labelled-control", spec: { kind: "html-labelled-control", file: "html" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "html-fragment-link", spec: { kind: "html-fragment-link", file: "html" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  {
    name: "html-heading-order rejects a skipped level",
    spec: { kind: "html-heading-order", file: "html" },
    pass: SAFE_PROJECT,
    fail: { html: "<main><h1>Title</h1><h3>Skipped</h3></main>" },
  },
  { name: "html-document-meta", spec: { kind: "html-document-meta", file: "html" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "html-image-alt", spec: { kind: "html-image-alt", file: "html" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "html-landmarks", spec: { kind: "html-landmarks", file: "html", tags: ["header", "main", "footer"] }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "html-list", spec: { kind: "html-list", file: "html", minItems: 3 }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "html-status-region", spec: { kind: "html-status-region", file: "html" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "html-language", spec: { kind: "html-language", file: "html" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "privacy check catches contact detail", spec: { kind: "html-text-free-of", file: "html", catalogue: "personal-contact" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  {
    name: "privacy check catches a private location",
    spec: { kind: "html-text-free-of", file: "html", catalogue: "private-location" },
    pass: SAFE_PROJECT,
    fail: { html: "<p>My school is the one on the main road.</p>" },
  },

  /* CSS */
  { name: "css flex layout", spec: { kind: "css-declaration", file: "css", selector: "nav", property: "display", value: "flex" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css grid layout", spec: { kind: "css-declaration", file: "css", selector: ".cards", property: "display", value: "grid" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css flexible tracks", spec: { kind: "css-declaration", file: "css", property: "grid-template-columns", value: "fr" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css minmax tracks", spec: { kind: "css-declaration", file: "css", property: "grid-template-columns", value: "minmax" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css auto-fit tracks", spec: { kind: "css-declaration", file: "css", property: "grid-template-columns", value: "auto-fit" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css wrapping navigation", spec: { kind: "css-declaration", file: "css", property: "flex-wrap", value: "wrap" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css gap", spec: { kind: "css-declaration", file: "css", property: "gap", value: "gap" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css border-box", spec: { kind: "css-declaration", file: "css", property: "box-sizing", value: "border-box" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css padding", spec: { kind: "css-declaration", file: "css", selector: ".card", property: "padding", value: "padding" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css margin", spec: { kind: "css-declaration", file: "css", property: "margin-bottom", value: "margin" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css border on a card", spec: { kind: "css-declaration", file: "css", selector: ".card", property: "border", value: "border" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css custom property use", spec: { kind: "css-declaration", file: "css", property: "background", value: "custom-property" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css outline", spec: { kind: "css-declaration", file: "css", property: "outline", value: "outline" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css line height", spec: { kind: "css-declaration", file: "css", property: "line-height", value: "line-height" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css breakpoint", spec: { kind: "css-at-rule", file: "css", at: "media", minWidth: 700 }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css named values", spec: { kind: "css-custom-properties", file: "css", min: 3 }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css var usage", spec: { kind: "css-var-usage", file: "css", min: 2 }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css focus visible", spec: { kind: "css-focus-visible", file: "css" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css fluid width", spec: { kind: "css-fluid-width", file: "css" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css readability", spec: { kind: "css-readability", file: "css" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "css grid tracks", spec: { kind: "css-grid-tracks", file: "css", minTracks: 3 }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },

  /* JavaScript */
  { name: "js function with a parameter", spec: { kind: "js-function", file: "javascript", paramsMin: 1 }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js forEach call", spec: { kind: "js-call", file: "javascript", method: "forEach" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js filter callback returns a condition", spec: { kind: "js-callback", file: "javascript", method: "filter", needsReturn: true, needsComparison: true }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  {
    name: "js filter callback rejects a callback with no condition",
    spec: { kind: "js-callback", file: "javascript", method: "filter", needsComparison: true },
    pass: SAFE_PROJECT,
    fail: { javascript: "const kept = items.filter(function (item) { return true; });" },
  },
  { name: "js conditional", spec: { kind: "js-structural", file: "javascript", fact: "conditional" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js event listener", spec: { kind: "js-structural", file: "javascript", fact: "event-listener" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js preventDefault", spec: { kind: "js-structural", file: "javascript", fact: "prevent-default" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js createElement", spec: { kind: "js-structural", file: "javascript", fact: "create-element" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js try and catch", spec: { kind: "js-structural", file: "javascript", fact: "try-catch" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js finally", spec: { kind: "js-structural", file: "javascript", fact: "finally" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js await", spec: { kind: "js-structural", file: "javascript", fact: "await" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js strict equality", spec: { kind: "js-structural", file: "javascript", fact: "strict-equality" }, pass: SAFE_PROJECT, fail: WEAK_PROJECT },
  { name: "js array literal", spec: { kind: "js-structural", file: "javascript", fact: "array-literal" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js object literal", spec: { kind: "js-structural", file: "javascript", fact: "object-literal" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  {
    name: "js spread into a new array",
    spec: { kind: "js-structural", file: "javascript", fact: "spread" },
    pass: { javascript: "const next = [...items, item];" },
    fail: PARTIAL_PROJECT,
  },
  { name: "js assigns textContent", spec: { kind: "js-member-assignment", file: "javascript", property: "textContent" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js saves to browser storage", spec: { kind: "js-storage", file: "javascript", method: "setItem" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js restores from browser storage", spec: { kind: "js-storage", file: "javascript", method: "getItem" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js accepted message", spec: { kind: "js-literal-any", file: "javascript", values: ["Saved", "Saved note restored"] }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js stale request guard", spec: { kind: "js-request-id", file: "javascript" }, pass: SAFE_PROJECT, fail: PARTIAL_PROJECT },
  { name: "js rejects innerHTML", spec: { kind: "js-absent", file: "javascript", fact: "innerhtml-assignment" }, pass: SAFE_PROJECT, fail: UNSAFE_PROJECT },
  { name: "js rejects eval", spec: { kind: "js-absent", file: "javascript", fact: "eval" }, pass: SAFE_PROJECT, fail: UNSAFE_PROJECT },
  { name: "js rejects document.write", spec: { kind: "js-absent", file: "javascript", fact: "document-write" }, pass: SAFE_PROJECT, fail: UNSAFE_PROJECT },
];

await sweep("requirement checks", async () => {
  for (const entry of cases) {
    stepSync(entry.name, () => {
      const good = runCheck(entry.spec, F(entry.pass));
      assert.equal(good.status, "met", `the passing fixture for ${entry.name} reported ${good.status}: ${good.detail}`);
      const bad = runCheck(entry.spec, F(entry.fail));
      assert.equal(bad.status, "unmet", `the failing fixture for ${entry.name} reported ${bad.status}: ${bad.detail}`);
    });
  }
});

stepSync("an undecidable requirement returns Needs verification, never a pass or a fail", () => {
  const outcome = runCheck({ kind: "cannot-verify", reason: "The page has to be opened to check this." }, F(SAFE_PROJECT));
  assert.equal(outcome.status, "needs-verification");
  assert.match(outcome.detail, /Needs verification/);
});

stepSync("a requirement is never graded from one exact code string", () => {
  /* Four different valid ways of writing the same list render must all pass. */
  const spec = { kind: "js-structural", file: "javascript", fact: "create-element" };
  const variants = [
    "const item = document.createElement('li'); list.append(item);",
    "let item = document.createElement(\"li\"); list.append(item);",
    "items.forEach((item) => { const node = document.createElement(`li`); list.append(node); });",
    "const node = document.createElement(\"li\");\nlist.appendChild(node);",
  ];
  for (const variant of variants) {
    assert.equal(runCheck(spec, F({ javascript: variant })).status, "met", variant);
  }
});

stepSync("a missing file is Never guessed: it needs verification", () => {
  const outcome = runCheck({ kind: "html-element", file: "html", tag: "main" }, F({ css: "body { color: #111936; }" }));
  assert.equal(outcome.status, "needs-verification");
});

stepSync("an increase is measured against the learner's own earlier submission", () => {
  const baseline = { html: "<ul><li>One</li><li>Two</li></ul>", css: "", javascript: "" };
  const spec = { kind: "increase", inner: { kind: "html-element", file: "html", tag: "li", min: 1 }, by: 1, on: "html-element" };
  const grown = buildContext({ html: "<ul><li>One</li><li>Two</li><li>Three</li></ul>", css: "", javascript: "" }, baseline);
  assert.equal(runCheck(spec, grown).status, "met");
  const unchanged = buildContext({ html: "<ul><li>One</li><li>Two</li></ul>", css: "", javascript: "" }, baseline);
  assert.equal(runCheck(spec, unchanged).status, "unmet");
  const noBaseline = buildContext({ html: "<ul><li>One</li></ul>", css: "", javascript: "" });
  assert.equal(runCheck(spec, noBaseline).status, "needs-verification");
});

stepSync("learner code is read, never executed", () => {
  /* The unsafe project would break or hang an executing grader. It is inspected only. */
  const facts = buildContext(UNSAFE_PROJECT);
  assert.equal(runCheck({ kind: "js-absent", file: "javascript", fact: "eval" }, facts).status, "unmet");
  assert.equal(runCheck({ kind: "js-absent", file: "javascript", fact: "innerhtml-assignment" }, facts).status, "unmet");
  assert.equal(runCheck({ kind: "js-structural", file: "javascript", fact: "conditional" }, facts).status, "unmet");
});

stepSync("a malformed document is read as far as it can be", () => {
  const broken = buildContext({ html: "<main><h1>Title</h2><p>Text<p><ul><li>a<li>b", css: "", javascript: "" });
  assert.equal(runCheck({ kind: "html-element", file: "html", tag: "h1" }, broken).status, "met");
  assert.equal(runCheck({ kind: "html-landmarks", file: "html", tags: ["main", "ul"] }, broken).status, "met");
  assert.equal(runCheck({ kind: "html-element", file: "html", tag: "footer" }, broken).status, "unmet");
});

if (failed.length === 0) check("every requirement check kind behaved as specified");
report("assessment grading");
assert.ok(passed.length > 0);