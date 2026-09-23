#!/usr/bin/env node
/*
 * Server-only fixture for the targeted defence journeys.
 *
 * It reproduces, from the same code the route uses, which reviewed template was assigned to an
 * attempt, which prediction index is reviewed as correct, and which small change satisfies the
 * assigned requirement. The browser never sees any of this: the harness reads it here and then
 * types the values in through the normal interface, so the server still decides the outcome.
 *
 * Nothing is written to the database and no test-only route exists.
 *
 *   node --import tsx --no-warnings scripts/defence-fixture.mjs <attemptId>
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { changeTaskFrom, gradeChange } from "../lib/assessment/engine.ts";
import { contentFor } from "../lib/assessment/manifest.ts";
import { templatesFor } from "../lib/assessment/defence";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function locateDatabase() {
  const directory = resolve(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) throw new Error(`No local D1 store at ${directory}`);
  const file = readdirSync(directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => resolve(directory, name))
    .sort()
    .pop();
  if (!file) throw new Error("No local D1 database file was found.");
  return file;
}

/* Small, taught-material changes. Each is graded by the ordinary requirement checker, exactly as
* the route grades a learner's own submission, with the learner's submitted build as baseline.
* The last three are valid learner input that is malformed, which is the legitimate way a learner
* can hand in work the reader genuinely cannot decide. */
const CANDIDATES = [
  { html: "", css: ".card { color: #ee9d2b; }\nbody { color: #111936; }", javascript: "" },
  { html: "", css: "*, *::before, *::after { box-sizing: border-box; }\n.card { padding: 1rem; line-height: 1.6; }", javascript: "" },
  { html: "", css: "a:focus-visible, button:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }", javascript: "" },
  { html: "", css: "@media (min-width: 700px) { .cards { grid-template-columns: repeat(3, 1fr); } }", javascript: "" },
  { html: "<header><h1>My club</h1></header>\n<main><section><h2>This week</h2><p>We meet on Saturday.</p><ul><li>Biscuits</li><li>Badges</li><li>Photos</li></ul></section></main>\n<img src=\"club.webp\" alt=\"The club table with three finished models\">\n<footer><p>A page by a member.</p></footer>", css: "", javascript: "" },
  { html: "<label for=\"name\">Your name</label>\n<input id=\"name\" type=\"text\">\n<p role=\"status\">Ready</p>", css: "", javascript: "" },
  { html: "", css: "", javascript: "const list = document.querySelector('#list');\nconst item = document.createElement('li');\nitem.textContent = 'One more';\nlist.append(item);" },
  { html: "", css: "", javascript: "const items = [{ id: 1, title: 'One' }];\nconst kept = items.filter(function (record) { return record.id > 0; });\nkept.forEach(function (record) { record.title = record.title.trim(); });" },
  { html: "", css: "", javascript: "const form = document.querySelector('#enquiry');\nform.addEventListener('submit', function (event) { event.preventDefault(); });\nconst saved = localStorage.getItem('office');\ntry { const value = 'ok'; } catch (error) { const message = 'failed'; }" },
  { html: "", css: "", javascript: "" },
  { html: "", css: ".card { color: ", javascript: "" },
  { html: "", css: "", javascript: "function broken( {" },
  { html: "<main><h1>Half a page", css: "", javascript: "" },
];

const attemptId = process.argv[2];
if (!attemptId) throw new Error("Pass an attempt id.");

const database = new DatabaseSync(locateDatabase());
const attempt = database
  .prepare(`SELECT id, learner_id AS learnerId, course_id AS courseId, kind, form_id AS formId, status, code_json AS codeJson
    FROM assessment_attempts WHERE id = ?`)
  .get(attemptId);
if (!attempt) throw new Error(`No attempt ${attemptId}`);

const content = contentFor(attempt.courseId);
if (!content) throw new Error(`No reviewed content for ${attempt.courseId}`);
const owned = templatesFor(attempt.courseId);
if (owned.length === 0) throw new Error(`No defence templates for ${attempt.courseId}`);

/* The same selection the route makes, so the fixture cannot drift from production. */
const index = [...attempt.id].reduce((total, letter) => total + letter.charCodeAt(0), 0);
const template = owned[index % owned.length];

const build = content.finalForms.find((form) => form.id === attempt.formId)?.build;
if (!build) throw new Error(`No build task for form ${attempt.formId}`);
const submitted = (JSON.parse(attempt.codeJson || "{}")[build.id]) || {};

const changeTask = changeTaskFrom(template, build);

/* Candidates derived from the learner's own submitted project. A requirement that asks for one more
 * of something, or that the project keeps what it already has, can only be satisfied in the context
 * of that work, so the fixture builds these from the submission exactly as a learner would edit it.
 * Nothing here is decided by the fixture: every candidate is graded by the production checker. */
const base = {
  html: submitted.html || "",
  css: submitted.css || "",
  javascript: submitted.javascript || "",
};
const before = (text, marker, addition) => (text.includes(marker) ? text.replace(marker, addition + marker) : text + addition);
const after = (text, marker, addition) => (text.includes(marker) ? text.replace(marker, marker + addition) : text + addition);
const DERIVED = [
  { html: before(base.html, "</ul>", "<li>Notes</li>"), css: "", javascript: "" },
  { html: before(base.html, "</main>", "<section><h2>Diary</h2><p>Notes from the last meeting.</p></section>"), css: "", javascript: "" },
  { html: before(base.html, "</nav>", '<a href="#models">Models</a>'), css: "", javascript: "" },
  { html: base.html, css: after(base.css, "\n", ""), javascript: "" },
  { html: base.html, css: `${base.css}\nh2 { margin-top: 1.5rem; }\nli { line-height: 1.6; }`, javascript: "" },
  { html: base.html, css: base.css, javascript: `${base.javascript}\nconst note = document.createElement('p');\nnote.textContent = 'Saved';\ndocument.querySelector('main').append(note);` },
  { html: base.html.replace("<h1", '<h1 id="top"'), css: base.css, javascript: "" },
  { html: base.html.replace("<img", '<img loading="lazy"'), css: base.css, javascript: "" },
  { html: base.html, css: base.css, javascript: base.javascript },
  { html: before(base.html, "</body>", "<p>Thanks for reading.</p>"), css: "", javascript: "" },
];

const graded = [...CANDIDATES, ...DERIVED].map((candidate, at) => {
  const result = gradeChange(template, { ...submitted, ...candidate }, build, submitted);
  return { at, status: result.status, detail: result.detail, candidate };
});
const satisfying = graded.find((entry) => entry.status === "met") || null;
const undecidable = graded.find((entry) => entry.status === "needs-verification") || null;

console.log(JSON.stringify({
  attemptId: attempt.id,
  learnerId: attempt.learnerId,
  courseId: attempt.courseId,
  kind: attempt.kind,
  attemptStatus: attempt.status,
  templateId: template.id,
  predictItemId: template.predict.id,
  predictAnswer: template.predict.answer,
  predictOptions: (template.predict.options || []).length,
  changeRequirementKind: changeTask?.requirements[0]?.check?.kind ?? null,
  satisfyingChange: satisfying ? satisfying.candidate : null,
  satisfyingDetail: satisfying ? satisfying.detail : null,
  undecidableChange: undecidable ? undecidable.candidate : null,
  undecidableDetail: undecidable ? undecidable.detail : null,
  statuses: graded.map((entry) => entry.status),
}, null, 1));