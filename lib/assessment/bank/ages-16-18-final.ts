/*
 * Ages 16 to 18: the final applied assessment.
 *
 * Three equivalent final forms for the most advanced young-adult course. Each form is
 * marked out of 100: ten knowledge questions of two marks each, three debugging tasks
 * worth ten marks each, and one unseen independent build worth fifty marks.
 *
 * The three forms are genuinely equivalent: every form asks ten questions across the
 * same modules in the same proportion, each carries the same three debugging ideas
 * (a swallowed failure, an update that edits by position, and a collection that is
 * mutated in place), and every build is marked against the same ten requirements, one
 * of which is a mandatory accessibility check and one a mandatory privacy check.
 *
 * A debugging task always starts from code that really fails: the starter of each task
 * below misses the thing its requirements ask for, so a learner cannot earn the marks
 * by resubmitting it. The build is unseen work: the learner receives an empty
 * workspace and a brief for a fresh application.
 *
 * The vocabulary is the vocabulary of the lessons: one source of application state,
 * immutable creates, updates by stable id, deletes derived with a condition, response
 * status checks, captured request identifiers, and textContent in place of innerHTML.
 *
 * Note on the builder: buildFinalForms in the factory resolves a knowledge item's
 * lesson through "<module>-final", which is not a real module of this course, so it
 * throws for every question. The construction below therefore mirrors that builder
 * exactly (same ids, same concept keys, same marks, same difficulty profile, same
 * objective and revision resolution) while resolving each lesson against the real
 * module the idea names. Nothing else in the factory is changed.
 */

import {
  assigns,
  avoids,
  callback,
  calls,
  conceptKey,
  currentRequestGuard,
  declaresFunction,
  difficultyProfile,
  el,
  FINAL_BUILD_REQUIREMENT_MARK,
  FINAL_DEBUG_REQUIREMENT_MARK,
  FINAL_KNOWLEDGE_MARK,
  itemId,
  js,
  labelledControls,
  lessonFor,
  showsMessage,
  type AuthoredBuild,
  type AuthoredDebug,
  type AuthoredFinalForm,
  type AuthoredQuestion,
  type AuthoredRequirement,
  type FinalIdea,
} from "@/lib/assessment/bank/factory";
import {
  CONTENT_VERSION,
  type CodeTask,
  type CourseAssessment,
  type FinalForm,
  type KnowledgeItem,
  type Requirement,
} from "@/lib/assessment/types";

const courseId = "ages-16-18" as const;

/* --------------------------------------------------------------------- ideas -- */

/*
 * One idea per assessed objective. Each names the module whose lesson teaches it, so
 * every final question and every marked requirement is traceable to real teaching in
 * lib/course-16-18.ts.
 */

const ideas: Record<string, FinalIdea> = {
  /* 1. structure */
  landmarks: { slug: "landmarks", module: "ages-16-18-structure", lesson: "landmarks", difficulty: "developing", cognitive: "apply" },
  headings: { slug: "headings", module: "ages-16-18-structure", lesson: "headings", difficulty: "developing", cognitive: "understand" },
  links: { slug: "links", module: "ages-16-18-structure", lesson: "links", difficulty: "developing", cognitive: "apply" },
  "structure-project": { slug: "structure-project", module: "ages-16-18-structure", lesson: "project", difficulty: "secure", cognitive: "apply" },

  /* 2. forms */
  labels: { slug: "labels", module: "ages-16-18-forms", lesson: "labels", difficulty: "developing", cognitive: "apply" },
  "input-types": { slug: "input-types", module: "ages-16-18-forms", lesson: "types", difficulty: "developing", cognitive: "understand" },
  choices: { slug: "choices", module: "ages-16-18-forms", lesson: "groups", difficulty: "developing", cognitive: "apply" },

  /* 3. css-system */
  selectors: { slug: "selectors", module: "ages-16-18-css-system", lesson: "selectors", difficulty: "developing", cognitive: "apply" },
  "box-model": { slug: "box-model", module: "ages-16-18-css-system", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
  tokens: { slug: "tokens", module: "ages-16-18-css-system", lesson: "tokens", difficulty: "secure", cognitive: "apply" },

  /* 4. responsive */
  viewport: { slug: "viewport", module: "ages-16-18-responsive", lesson: "viewport", difficulty: "developing", cognitive: "understand" },
  "flex-row": { slug: "flex-row", module: "ages-16-18-responsive", lesson: "flex", difficulty: "developing", cognitive: "apply" },
  "grid-columns": { slug: "grid-columns", module: "ages-16-18-responsive", lesson: "grid", difficulty: "secure", cognitive: "apply" },

  /* 5. javascript */
  "pure-functions": { slug: "pure-functions", module: "ages-16-18-javascript", lesson: "pure-functions", difficulty: "secure", cognitive: "apply" },
  records: { slug: "records", module: "ages-16-18-javascript", lesson: "objects", difficulty: "secure", cognitive: "understand" },
  filter: { slug: "filter", module: "ages-16-18-javascript", lesson: "filter", difficulty: "secure", cognitive: "apply" },
  "logic-project": { slug: "logic-project", module: "ages-16-18-javascript", lesson: "project", difficulty: "advanced", cognitive: "apply" },

  /* 6. data */
  state: { slug: "state", module: "ages-16-18-data", lesson: "state", difficulty: "advanced", cognitive: "understand" },
  create: { slug: "create", module: "ages-16-18-data", lesson: "create", difficulty: "advanced", cognitive: "apply" },
  update: { slug: "update", module: "ages-16-18-data", lesson: "update", difficulty: "advanced", cognitive: "analyse" },
  delete: { slug: "delete", module: "ages-16-18-data", lesson: "delete", difficulty: "advanced", cognitive: "apply" },
  "data-project": { slug: "data-project", module: "ages-16-18-data", lesson: "project", difficulty: "advanced", cognitive: "apply" },

  /* 7. interaction */
  fetch: { slug: "fetch", module: "ages-16-18-interaction", lesson: "fetch", difficulty: "advanced", cognitive: "understand" },
  loading: { slug: "loading", module: "ages-16-18-interaction", lesson: "loading", difficulty: "advanced", cognitive: "apply" },
  errors: { slug: "errors", module: "ages-16-18-interaction", lesson: "errors", difficulty: "advanced", cognitive: "analyse" },
  "stale-results": { slug: "stale-results", module: "ages-16-18-interaction", lesson: "abort", difficulty: "advanced", cognitive: "evaluate" },
  "interaction-project": { slug: "interaction-project", module: "ages-16-18-interaction", lesson: "project", difficulty: "advanced", cognitive: "apply" },

  /* 8. quality */
  debug: { slug: "debug", module: "ages-16-18-quality", lesson: "debug", difficulty: "advanced", cognitive: "analyse" },
  "access-audit": { slug: "access-audit", module: "ages-16-18-quality", lesson: "accessibility", difficulty: "advanced", cognitive: "evaluate" },
  "untrusted-text": { slug: "untrusted-text", module: "ages-16-18-quality", lesson: "security", difficulty: "advanced", cognitive: "evaluate" },
  "quality-project": { slug: "quality-project", module: "ages-16-18-quality", lesson: "project", difficulty: "advanced", cognitive: "evaluate" },
};

/* ------------------------------------------------------------------ builders -- */

/* The answer position is derived from the question, as the factory does, so the
 * correct option is not always in the same place. */
function answerIndex(prompt: string): number {
  return Array.from(prompt).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
}

function question(variant: string, index: number, spec: AuthoredQuestion): KnowledgeItem {
  const [ideaSlug, prompt, correct, wrongOne, wrongTwo, explanation, tagSource] = spec;
  const idea = ideas[ideaSlug];
  if (!idea) throw new Error(`Unknown final idea ${ideaSlug} in form ${variant}.`);
  const lesson = lessonFor(courseId, idea.module, idea.lesson);
  const tags = tagSource.split("|").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  if (tags.length < 2) throw new Error(`Final question ${index} of form ${variant} needs a tag for each wrong option.`);
  const answer = answerIndex(prompt);
  const ordered: [string, string, string] = answer === 0
    ? [correct, wrongOne, wrongTwo]
    : answer === 1
      ? [wrongOne, correct, wrongTwo]
      : [wrongOne, wrongTwo, correct];
  const misconceptions = answer === 0
    ? ["", tags[0], tags[1]]
    : answer === 1
      ? [tags[0], "", tags[1]]
      : [tags[0], tags[1], ""];
  return {
    id: itemId(courseId, `${idea.module}-final`, variant, "k", index),
    version: CONTENT_VERSION,
    courseId,
    moduleId: idea.module,
    formVariant: variant,
    objective: lesson.id,
    concept: conceptKey(courseId, `${idea.module}-final`, ideaSlug),
    difficulty: idea.difficulty,
    cognitive: idea.cognitive,
    type: "knowledge",
    marks: FINAL_KNOWLEDGE_MARK,
    prompt: prompt.trim(),
    options: [ordered[0].trim(), ordered[1].trim(), ordered[2].trim()],
    answer,
    explanation: explanation.trim(),
    misconceptions,
    revision: lesson.id,
  };
}

function requirementList(
  variant: string,
  moduleId: string,
  kind: string,
  index: number,
  spec: AuthoredRequirement[],
  marks: number,
): Requirement[] {
  return spec.map((entry, position) => {
    const [label, check, ideaSlug, mandatory] = entry;
    const idea = ideas[ideaSlug];
    if (!idea) throw new Error(`Unknown requirement idea ${ideaSlug} in final ${variant}.`);
    return {
      id: `${itemId(courseId, `${moduleId}-final`, variant, kind, index)}-r${position + 1}`,
      label: label.trim(),
      marks,
      check,
      concept: conceptKey(courseId, idea.module, ideaSlug),
      revision: lessonFor(courseId, idea.module, idea.lesson).id,
      ...(mandatory ? { mandatory } : {}),
    };
  });
}

function debugTask(variant: string, index: number, spec: AuthoredDebug): CodeTask {
  const idea = ideas[spec.idea];
  if (!idea) throw new Error(`Unknown final debug idea ${spec.idea} in form ${variant}.`);
  const lesson = lessonFor(courseId, idea.module, idea.lesson);
  const requirements = requirementList(variant, idea.module, "d", index, spec.requirements, FINAL_DEBUG_REQUIREMENT_MARK);
  return {
    id: itemId(courseId, `${idea.module}-final`, variant, "d", index),
    version: CONTENT_VERSION,
    courseId,
    moduleId: idea.module,
    formVariant: variant,
    type: "debug",
    title: spec.title.trim(),
    brief: spec.brief.trim(),
    objective: lesson.id,
    concept: conceptKey(courseId, idea.module, spec.idea),
    difficulty: idea.difficulty,
    cognitive: "analyse",
    marks: requirements.reduce((total, requirement) => total + requirement.marks, 0),
    editableFiles: spec.editable ?? ["html", "css", "javascript"],
    starterFiles: {
      html: spec.starter.html ?? "",
      css: spec.starter.css ?? "",
      javascript: spec.starter.javascript ?? "",
    },
    requirements,
    revision: lesson.id,
    allowedSkills: ["HTML", "CSS", "JavaScript"],
  };
}

function buildTask(variant: string, spec: AuthoredBuild): CodeTask {
  const idea = ideas[spec.idea];
  if (!idea) throw new Error(`Unknown final build idea ${spec.idea} in form ${variant}.`);
  const lesson = lessonFor(courseId, idea.module, idea.lesson);
  const requirements = requirementList(variant, idea.module, "b", 1, spec.requirements, FINAL_BUILD_REQUIREMENT_MARK);
  return {
    id: itemId(courseId, `${idea.module}-final`, variant, "b", 1),
    version: CONTENT_VERSION,
    courseId,
    moduleId: idea.module,
    formVariant: variant,
    type: "build",
    title: spec.title.trim(),
    brief: spec.brief.trim(),
    objective: lesson.id,
    concept: conceptKey(courseId, idea.module, spec.idea),
    difficulty: "secure",
    cognitive: "evaluate",
    marks: requirements.reduce((total, requirement) => total + requirement.marks, 0),
    editableFiles: spec.editable ?? ["html", "css", "javascript"],
    starterFiles: { html: "", css: "", javascript: "" },
    requirements,
    revision: lesson.id,
    allowedSkills: ["HTML", "CSS", "JavaScript"],
  };
}

function finalForm(variant: string, spec: AuthoredFinalForm): FinalForm {
  const knowledge = spec.knowledge.map((entry, index) => question(variant, index + 1, entry));
  const debug = spec.debug.map((entry, index) => debugTask(variant, index + 1, entry));
  const build = buildTask(variant, spec.build);
  return {
    id: `${courseId}-final-form-${variant}`,
    courseId,
    variant,
    knowledge,
    debug,
    build,
    difficultyProfile: difficultyProfile([...knowledge, ...debug, build]),
    objectives: [...new Set([...knowledge.map((item) => item.objective), ...debug.map((item) => item.objective)])].sort(),
  };
}

/* ---------------------------------------------------------- shared build brief -- */

/*
 * The ten marked requirements of the independent build. All three forms are marked
 * against the same ten skills so the three finals are equivalent: one source of state,
 * an immutable create, an update by stable id, a filter that keeps the source whole, a
 * request for external JSON, explicit loading, empty and failure messages, a caught
 * failure, no markup from outside values, a label on every control and text rendering
 * for each record. Requirement 8 is the mandatory privacy check and requirement 9 the
 * mandatory accessibility check.
 */

const buildRequirements: AuthoredRequirement[] = [
  ["One state object holds the records and the current search text", js("object-literal"), "state"],
  ["A new record joins the collection as a new array", js("spread"), "create"],
  ["A matching record is replaced through map, using its own id", calls("map"), "update"],
  ["The records on screen are derived by a filter that keeps the source whole", callback("filter", { needsReturn: true, needsComparison: true }), "delete"],
  ["The starting records are requested from an address", calls("fetch"), "fetch"],
  ["Loading, empty and failure are each reported in words", showsMessage("Loading...", "No results", "Something went wrong"), "loading"],
  ["A failed request is caught and explained with a next step", js("try-catch"), "errors"],
  ["No value from outside ever becomes markup in the page", avoids("innerhtml-assignment"), "untrusted-text", "privacy"],
  ["Every control in the page is joined to a visible label", labelledControls(), "labels", "accessibility"],
  ["Each record is written to the page as text", assigns("textContent"), "data-project"],
];

/* ------------------------------------------------------------------ form A ----- */

const formA: AuthoredFinalForm = {
  knowledge: [
    ["landmarks", "A visitor uses a screen reader to list the page regions. Which region holds the central content they came for?", "The main region", "The footer region", "The first section on the page", "The main element marks the central content of the page, and it is announced as a region of its own.", "expects-the-footer-to-hold-content|treats-a-section-as-the-whole-page"],
    ["labels", "A repair changes the for value of a label and the field is now announced without its name. What was broken?", "The for value no longer matches the id of its control", "The label lost its colour", "The input lost its type attribute", "The programmatic connection is the matching pair of values, so changing one of them alone breaks the name.", "relies-on-appearance|blames-the-input-type"],
    ["selectors", "Two cards sit inside different sections and both need the same inner space. Which selector keeps one rule in charge of both of them?", "The shared class that both cards carry", "A selector that names the first section only", "An inline style written on each card", "A class is a reusable hook, so one rule dresses every element that carries it.", "targets-one-section-only|repeats-the-style-per-element"],
    ["viewport", "A phone shows the page zoomed out so far that the text cannot be read. Which base rule is missing?", "A layout width that follows the space the screen actually offers", "A rule that hides the navigation on small screens", "A fixed width measured for a desktop monitor", "A fluid default protects the narrowest screen, and the wider layouts are added on top of it.", "hides-content-instead|hard-codes-a-desktop-width"],
    ["pure-functions", "Which change makes a total function testable without opening a browser?", "Taking its values as parameters and returning the result", "Writing the total straight into the page", "Reading the current time inside the function", "A function that depends only on its arguments gives the same answer for the same pair of inputs.", "couples-the-logic-to-the-page|depends-on-the-clock"],
    ["state", "The list on screen disagrees with the records the interface is holding. Which repair removes the disagreement?", "Render the page from the current records after every change", "Edit the visible list by hand to match", "Keep a second copy of the list for the page", "One trusted source of truth plus a render step keeps the page and the data in agreement.", "edits-the-view-directly|keeps-two-copies"],
    ["fetch", "A request completes with a status that says the resource is missing, yet the code reads the body as though it worked. Which step was skipped?", "Checking the reported status before the body is read", "Sending the request a second time", "Writing the address into a variable first", "A completed request is not a successful one, so the status has to be inspected deliberately.", "assumes-completion-means-success|expects-a-retry-to-fix-it"],
    ["debug", "A page stops failing after one repair but nobody knows which change fixed it. How should a repair be made instead?", "Change one cause, rerun the same test and record the result", "Change several lines so the fix is certain", "Delete the test that was failing", "One controlled change plus one repeated test is what produces usable evidence.", "changes-many-things|removes-the-evidence"],
    ["delete", "A removal keeps every record except the chosen id and leaves the original array untouched. Why is that the safe shape?", "The derived array holds the survivors while the source stays whole", "The removed record is moved to the end of the array", "The source array is emptied first and rebuilt", "A derived array means the collection it came from is never edited in place.", "reorders-instead-of-removing|rebuilds-the-source"],
    ["stale-results", "A visitor types quickly, an older request lands last and its answer replaces the newer one. What prevents that?", "An identifier captured before the request and compared after it", "A longer loading message", "Sorting the responses before they are shown", "Comparing the captured identifier with the latest one identifies the stale response before it touches the page.", "expects-a-message-to-solve-it|sorts-responses"],
  ],
  debug: [
    {
      idea: "errors",
      title: "Repair the loader that hides every failure",
      brief: "The loader below never checks whether the response was successful, reads the body anyway, writes an outside value straight into the page as markup, and leaves the visitor with nothing when the request fails. Repair the function so that a completed request carrying an error status is treated as a failure, that failure is caught and explained in plain words, that each topic is created as an element and appended instead of injected as markup, and that the outcome is reported in words rather than silence.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Topics</h1>\n  <ul id=\"topic-list\"></ul>\n  <p id=\"status\" role=\"status\">Ready</p>\n</main>",
        javascript: "const statusText = document.querySelector(\"#status\");\nconst list = document.querySelector(\"#topic-list\");\n\nasync function loadTopics() {\n  statusText.textContent = \"Loading...\";\n  const response = await fetch(\"topics.json\");\n  const topics = await response.json();\n  list.innerHTML = \"<li>\" + topics[0].title + \"</li>\";\n}\n\nloadTopics();",
      },
      requirements: [
        ["The code branches on the reported status before the body is read", js("conditional"), "fetch"],
        ["A failed load is caught and explained", js("try-catch"), "errors"],
        ["No value from outside becomes markup", avoids("innerhtml-assignment"), "untrusted-text"],
        ["Each topic is created as an element and appended", js("create-element"), "data-project"],
        ["The outcome is reported to the visitor in words", showsMessage("No results", "Ready when loaded", "Could not load"), "loading"],
      ],
    },
    {
      idea: "update",
      title: "Repair the rename that edits by position",
      brief: "The rename below finds a record by where it sits in the array and changes the record object in place, so a sort or a filter silently renames the wrong record. Repair it so that the record is found by its own id, that the collection is rebuilt with map, and that the changed record is a copy rather than the original object.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Records</h1>\n  <ul id=\"record-list\"></ul>\n  <p id=\"status\" role=\"status\"></p>\n</main>",
        javascript: "const state = { records: [{ id: 1, title: \"First\" }, { id: 2, title: \"Second\" }] };\nconst list = document.querySelector(\"#record-list\");\nconst statusText = document.querySelector(\"#status\");\n\nfunction renameRecord(position, title) {\n  state.records[position].title = title;\n  statusText.textContent = \"Saved\";\n}\n\nfunction render() {\n  state.records.forEach(function (record) {\n    const item = document.createElement(\"li\");\n    item.textContent = record.title;\n    list.append(item);\n  });\n}\n\nrender();\nrenameRecord(0, \"Renamed\");",
      },
      requirements: [
        ["The collection is rebuilt with the changed record in place", calls("map"), "update"],
        ["The changed record is a copy of the earlier one", js("spread"), "update"],
        ["The record is found by its own id rather than its position", js("strict-equality"), "records"],
        ["Each record title is written to the page as text", assigns("textContent"), "logic-project"],
        ["A named function receives the values it needs as parameters", declaresFunction(2), "pure-functions"],
      ],
    },
    {
      idea: "delete",
      title: "Repair the removal that edits the source array",
      brief: "The removal below walks the source array with a loop and cuts a record out of it where it stands, which changes the collection the rest of the page trusts. Repair it so that a new collection is derived by a condition that keeps every record whose id is not the chosen one, that each surviving record is created as an element and shown, that the visitor is told what happened in words, and that the list on the page holds the survivors.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Records</h1>\n  <ul id=\"record-list\"></ul>\n  <p id=\"status\" role=\"status\"></p>\n</main>",
        javascript: "const state = { records: [{ id: \"a\" }, { id: \"b\" }, { id: \"c\" }] };\nconst list = document.querySelector(\"#record-list\");\nconst statusText = document.querySelector(\"#status\");\n\nfunction deleteRecord(id) {\n  for (let index = 0; index < state.records.length; index += 1) {\n    if (state.records[index].id !== id) continue;\n    state.records.splice(index, 1);\n  }\n}\n\ndeleteRecord(\"b\");",
      },
      requirements: [
        ["The survivors come from a condition that keeps the source array whole", callback("filter", { needsReturn: true, needsComparison: true }), "delete"],
        ["Each surviving record is created as an element", js("create-element"), "data-project"],
        ["The removal is reported to the visitor in words", showsMessage("Removed", "No records left"), "loading"],
        ["A named function receives the id it needs as a parameter", declaresFunction(1), "pure-functions"],
        ["The page keeps a list for the surviving records", el("ul"), "data-project"],
      ],
    },
  ],
  build: {
    idea: "data-project",
    title: "Independent build: study session planner",
    brief: "Build a self-contained study session planner from an empty workspace. The page holds a list of sessions in one state object and shows each one as text in a list. It must add a session from a labelled form, rename a session, remove a session, and narrow the list to the sessions that match a word the visitor types, and it must load its starting sessions as external JSON from an address. While that request is running the page says so, an empty result gets its own honest message, and a failure is caught and explained with a next step. Nothing that arrived from outside may become markup. Keep the page readable on a narrow screen and make sure every control can be reached and named.",
    requirements: buildRequirements,
  },
};

/* ------------------------------------------------------------------ form B ----- */

const formB: AuthoredFinalForm = {
  knowledge: [
    ["headings", "A page opens with a section heading and never names itself. What has the outline lost?", "The single top-level heading that states the subject of the page", "A larger type size for the opening paragraph", "A second navigation region", "The outline needs its main heading first, so its sections sit underneath a stated subject.", "treats-headings-as-sizes|adds-another-region"],
    ["input-types", "Which choice lets the browser warn about a value before the form is submitted?", "An input type chosen for the value the field expects", "A longer placeholder sentence", "A note placed in the footer of the page", "The narrowest suitable type tells the browser enough to help the visitor before submission.", "relies-on-placeholder-text|hides-help-in-the-footer"],
    ["box-model", "A card declares a width of 300 pixels and renders wider than planned. Which sizing rule keeps that arithmetic honest?", "Counting the padding and the border inside the declared width", "Removing the border from the card", "Setting every card to the same width", "Border-box sizing makes a declared width mean the whole box rather than only its content.", "removes-the-border-instead|confuses-equal-widths"],
    ["flex-row", "A row of navigation links forces the page wider instead of continuing onto a second line. Which rule is missing?", "Allowing the flex row to wrap", "A wider border on each link", "A fixed width on the parent element", "Wrapping lets a row continue onto the next line instead of pushing the page beyond the screen.", "expects-borders-to-wrap|fixes-the-parent-width"],
    ["records", "Records are reordered and the interface keeps changing the wrong one. What was relied on to identify a record?", "Its position in the array, which moves when the collection is reordered", "Its stable id, which travels with the record", "The colour used to display it", "Identity has to live in the data, because an array position changes as soon as the collection is sorted or filtered.", "trusts-the-position|uses-a-display-detail"],
    ["create", "A create step is refused because the title is blank. What should the caller receive?", "A clear failure result it can act on", "A new record carrying an empty title", "An unchanged collection with no explanation", "A visible refusal is what lets the interface explain why nothing was added.", "admits-an-empty-record|fails-silently"],
    ["loading", "A request returns a successful but empty list and the page still says it is loading. Which state was missing?", "An empty state that explains there is nothing to show", "A longer loading message", "An error message about the network", "An empty result is a success with nothing in it, so it needs its own honest message.", "leaves-loading-on-screen|reports-an-empty-result-as-an-error"],
    ["access-audit", "Which finding belongs in an accessibility audit rather than a styling review?", "A control that cannot be reached with the keyboard", "A heading that uses a smaller type size", "A card whose shadow is too subtle", "An audit asks whether people can perceive, understand and operate the interface, not only how it looks.", "judges-appearance-only|treats-type-size-as-access"],
    ["update", "One property of a record changes. Which shape keeps every other property intact?", "A copy of the record with that one property replaced", "A brand new record holding only the changed value", "The whole collection rebuilt from scratch", "Copying the existing fields keeps every other value, so only the named property changes.", "drops-the-other-fields|rebuilds-everything"],
    ["errors", "Which block is the right place for work that must happen after a request succeeds or fails?", "The block that runs in every outcome", "The block that only receives a thrown error", "The block that starts the request", "Cleanup belongs in the step that runs either way, not in the step that only receives a failure.", "confuses-catch-with-finally|puts-cleanup-before-the-work"],
  ],
  debug: [
    {
      idea: "fetch",
      title: "Repair the loader that ignores the reported status",
      brief: "The loader below reads the body of every response as though the request had succeeded, has no way to explain a failure, lets a slow older request replace a newer answer, and never tells the visitor that anything is happening. Repair it so that the reported status is checked before the body is read, that a failure is caught and explained, that an older response is recognised and ignored before the page is updated, and that the interface reports the loading, empty and failure states in words.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Summary</h1>\n  <p id=\"status\" role=\"status\">Waiting</p>\n</main>",
        javascript: "const statusText = document.querySelector(\"#status\");\n\nasync function loadSummary() {\n  const response = await fetch(\"summary.json\");\n  const data = await response.json();\n  statusText.textContent = data.title;\n}\n\nloadSummary();",
      },
      requirements: [
        ["The reported status is checked before the body is read", js("conditional"), "fetch"],
        ["A failed load is caught and explained", js("try-catch"), "errors"],
        ["An older response cannot replace a newer one", currentRequestGuard(), "stale-results"],
        ["The interface reports the states it passes through", showsMessage("Loading...", "No results", "Something went wrong"), "loading"],
        ["The value that arrives is written to the page as text", assigns("textContent"), "logic-project"],
      ],
    },
    {
      idea: "create",
      title: "Repair the create that pushes into the collection",
      brief: "The create below pushes a record straight into the array the page is reading, accepts an empty title, and takes nothing as a parameter, so the caller cannot supply or check anything. Repair it so that a new array holds the earlier records and the new one, that a record is accepted only when it carries a title, and that the function receives the value it needs as a parameter.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Records</h1>\n  <label for=\"title\">Title</label>\n  <input id=\"title\">\n  <ul id=\"record-list\"></ul>\n  <p id=\"status\" role=\"status\"></p>\n</main>",
        javascript: "const state = { records: [{ id: 1, title: \"First\" }] };\nconst input = document.querySelector(\"#title\");\nconst statusText = document.querySelector(\"#status\");\n\nfunction addRecord() {\n  state.records.push({ id: state.records.length + 1, title: input.value });\n  statusText.textContent = \"Added\";\n}\n\naddRecord();",
      },
      requirements: [
        ["The new record joins the collection as a new array", js("spread"), "create"],
        ["A record is accepted only when it carries a title", js("conditional"), "create"],
        ["A named function receives the value it needs as a parameter", declaresFunction(1), "pure-functions"],
        ["The interface reports what happened in words", assigns("textContent"), "logic-project"],
        ["The page keeps a list for the records", el("ul"), "data-project"],
      ],
    },
    {
      idea: "stale-results",
      title: "Repair the search that shows a stale answer",
      brief: "The search below counts its requests but never captures the count, never compares it after the wait and never returns early, so a slow earlier search can overwrite a newer answer. It also has no way of explaining a failure. Repair it so that the identifier of the current request is captured before the wait, that it is compared with the latest one afterwards and a stale result is ignored, and that a failure is caught and explained.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Search</h1>\n  <p id=\"results\" role=\"status\">Waiting</p>\n</main>",
        javascript: "const resultsText = document.querySelector(\"#results\");\nlet requestCount = 0;\n\nasync function search(term) {\n  requestCount = requestCount + 1;\n  const response = await fetch(\"/search?q=\" + term);\n  const results = await response.json();\n  resultsText.textContent = results.length + \" results\";\n}\n\nsearch(\"html\");",
      },
      requirements: [
        ["An older response is recognised and ignored before the page updates", currentRequestGuard(), "stale-results"],
        ["The captured identifier is compared with the latest one", js("strict-equality"), "records"],
        ["A failed search is caught and explained", js("try-catch"), "errors"],
        ["The results are written to the page as text", assigns("textContent"), "logic-project"],
        ["A named function receives the search text as a parameter", declaresFunction(1), "pure-functions"],
      ],
    },
  ],
  build: {
    idea: "interaction-project",
    title: "Independent build: volunteer shift roster",
    brief: "Build a self-contained volunteer shift roster from an empty workspace. The page keeps the shifts in one state object and shows each one as text in a list. It must add a shift from a labelled form, change the role of a shift, cancel a shift, and narrow the list to the shifts that match a word the visitor types, and it must load its starting shifts as external JSON from an address. While that request is running the page says so, an empty result gets its own honest message, and a failure is caught and explained with a next step. Nothing that arrived from outside may become markup. Keep the page readable on a narrow screen and make sure every control can be reached and named.",
    requirements: buildRequirements,
  },
};

/* ------------------------------------------------------------------ form C ----- */

const formC: AuthoredFinalForm = {
  knowledge: [
    ["links", "A navigation link is written with the words read more and a fragment destination. Which part is the weak choice?", "The link text, which does not name where it goes", "The fragment destination, which must be a full web address", "The element used for the navigation region", "A link has to make sense read on its own, so its words name the destination.", "expects-a-full-address|blames-the-region-element"],
    ["choices", "Three radio buttons answer one question and the browser lets all three be chosen. What is missing?", "One shared name that ties the three controls into a single answer", "One shared label for all three controls", "A larger click area around each control", "A shared name makes the browser treat the group as one question with several options.", "expects-one-label-for-all|expects-a-bigger-target"],
    ["tokens", "A colour appears twenty times in the stylesheet and the design decision changes. What makes that a single edit?", "Naming the value once and calling it from every rule", "Searching the file and replacing each occurrence", "Moving the colour into the markup", "A named value records the decision in one place, so one change reaches every rule that uses it.", "edits-every-copy-by-hand|moves-values-into-markup"],
    ["grid-columns", "The number of columns should follow the space that is available rather than a fixed count. Which track list does that?", "A repeat of self-fitting tracks with a sensible minimum", "A fixed count of three equal columns", "A percentage width set on every card", "Self-fitting tracks let the browser decide how many columns the space can hold.", "fixes-the-column-count|sets-widths-on-items"],
    ["filter", "A view should show only the available records and the source collection must survive. What does the callback return?", "A true or false answer for each record", "A new array built from every record", "A string of markup for the view", "The callback answers a question about one record, and only the records that answer true are kept.", "returns-an-array-per-item|returns-markup"],
    ["update", "A rename needs to touch one record and leave the rest exactly as they are. Which method fits?", "A method that returns a value for every record in turn", "A method that keeps only the records that match", "A method that reorders the collection by id", "Map visits every record and returns a value for each, which is one replaced and the rest unchanged.", "filters-the-others-away|reorders-instead-of-updating"],
    ["errors", "A failure message names the internal function that threw. How should it be rewritten?", "State plainly what went wrong and what the visitor can do next", "Include the technical name so the fault can be traced", "Say nothing and leave the last message on screen", "A useful message speaks to the visitor about the next action rather than about the code.", "exposes-internal-detail|fails-silently"],
    ["untrusted-text", "A title arrives from an outside service and may contain tag characters. How should it reach the page?", "As text, so any tags inside it stay visible characters", "As markup, so the tags take effect", "Written into the document while the page loads", "Outside text is untrusted input, so it is never allowed to become part of the document structure.", "interprets-the-markup|writes-into-the-document"],
    ["state", "The interface is rebuilt from the records and the current search word. Where should both of those live?", "In one object that is the single source of truth", "In separate variables scattered through the file", "In the stylesheet as custom properties", "One place that holds the current information is what stops the interface disagreeing with itself.", "scatters-state|confuses-state-with-styling"],
    ["fetch", "Which value must be inspected before a response body is turned into records?", "The status the response reports", "The length of the address that was requested", "The number of properties in the returned records", "An HTTP error still arrives as a completed request, so only the reported status separates the two.", "judges-by-address-length|judges-by-record-shape"],
  ],
  debug: [
    {
      idea: "loading",
      title: "Repair the interface that never says it is busy",
      brief: "The interface below waits for its data in silence, never says that it has started, never catches a failure and never runs the step that has to happen whatever the outcome. Repair it so that a loading message appears before the request begins, that a failure is caught and explained, and that the step that must run in every outcome is present.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Topics</h1>\n  <ul id=\"topic-list\"></ul>\n  <p id=\"status\" role=\"status\">Waiting</p>\n</main>",
        javascript: "const statusText = document.querySelector(\"#status\");\n\nasync function showTopics(address) {\n  const response = await fetch(address);\n  const topics = await response.json();\n  if (topics.length === 0) {\n    statusText.textContent = \"No results\";\n  } else {\n    statusText.textContent = \"Ready\";\n  }\n}\n\nshowTopics(\"topics.json\");",
      },
      requirements: [
        ["A loading message appears before the request begins", showsMessage("Loading...", "Loading"), "loading"],
        ["A failed request is caught and explained", js("try-catch"), "errors"],
        ["The step that runs in every outcome is present", js("finally"), "interaction-project"],
        ["A named function receives the address it needs as a parameter", declaresFunction(1), "pure-functions"],
        ["Each topic is written to the page as text", assigns("textContent"), "logic-project"],
      ],
    },
    {
      idea: "state",
      title: "Repair the change that edits a record in place",
      brief: "The change below reaches into the array by position and edits the record object itself, so the earlier version of the record is lost and a reordered list changes the wrong row. Repair it so that the record is found by its own id, that the collection is rebuilt from the records, and that the changed record is a copy rather than the original object.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Records</h1>\n  <ul id=\"record-list\"></ul>\n  <p id=\"status\" role=\"status\"></p>\n</main>",
        javascript: "const state = { records: [{ id: 1, title: \"First\" }, { id: 2, title: \"Second\" }] };\nconst list = document.querySelector(\"#record-list\");\nconst statusText = document.querySelector(\"#status\");\n\nfunction archiveRecord(position) {\n  state.records[position].archived = true;\n  statusText.textContent = \"Archived\";\n}\n\nfunction render() {\n  state.records.forEach(function (record) {\n    const item = document.createElement(\"li\");\n    item.textContent = record.title;\n    list.append(item);\n  });\n}\n\nrender();\narchiveRecord(0);",
      },
      requirements: [
        ["The changed record is a copy instead of being edited in place", js("spread"), "update"],
        ["The record is found by its own id rather than its position", js("strict-equality"), "records"],
        ["The collection is rebuilt from the records", calls("map"), "update"],
        ["Each record title is written to the page as text", assigns("textContent"), "logic-project"],
        ["The page keeps a list for the records", el("ul"), "data-project"],
      ],
    },
    {
      idea: "untrusted-text",
      title: "Repair the board that trusts outside text",
      brief: "The board below puts a value from outside straight into the document as markup, so anything that arrives with tag characters becomes part of the page, and it overwrites the board instead of adding to it. Repair it so that the text stays text, that an element is created and appended rather than injected, and that nothing unsafe reaches the document.",
      editable: ["html", "javascript"],
      starter: {
        html: "<main>\n  <h1>Board</h1>\n  <div id=\"board\"></div>\n  <p id=\"status\" role=\"status\"></p>\n</main>",
        javascript: "const board = document.querySelector(\"#board\");\nconst statusText = document.querySelector(\"#status\");\n\nfunction showMessage(text) {\n  board.innerHTML = \"<p>\" + text + \"</p>\";\n  statusText.textContent = \"Message posted\";\n}\n\nshowMessage(\"Community update\");",
      },
      requirements: [
        ["Outside text stays text instead of becoming markup", avoids("innerhtml-assignment"), "untrusted-text"],
        ["The element is created rather than injected as markup", js("create-element"), "data-project"],
        ["A named function receives the value it shows as a parameter", declaresFunction(1), "pure-functions"],
        ["The posted message is displayed as plain text", assigns("textContent"), "logic-project"],
        ["The new text is appended to the board rather than overwriting it", js("append"), "data-project"],
      ],
    },
  ],
  build: {
    idea: "quality-project",
    title: "Independent build: equipment loan tracker",
    brief: "Build a self-contained equipment loan tracker from an empty workspace. The page keeps the loans in one state object and shows each one as text in a list. It must add a loan from a labelled form, change the borrower of a loan, close a loan, and narrow the list to the loans that match a word the visitor types, and it must load its starting loans as external JSON from an address. While that request is running the page says so, an empty result gets its own honest message, and a failure is caught and explained with a next step. Nothing that arrived from outside may become markup. Keep the page readable on a narrow screen and make sure every control can be reached and named.",
    requirements: buildRequirements,
  },
};

const forms: Record<string, AuthoredFinalForm> = { A: formA, B: formB, C: formC };

export const ages16to18Final: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: [],
  finalForms: ["A", "B", "C"].map((variant) => finalForm(variant, forms[variant])),
  defence: [],
};
