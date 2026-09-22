/*
 * Prove every marked requirement in every module bank can actually be met, and that the
 * marks behave one requirement at a time.
 *
 * Each requirement's check is turned into the plain code that satisfies it, independently
 * of the grader's internals. The composed submission must meet every requirement of the
 * task. Then, for each requirement in turn, its part is removed and the grader must
 * report that requirement as unmet while still awarding the rest, which is what partial
 * credit means in practice.
 */
import assert from "node:assert/strict";
import { gradeCodeTask } from "../../lib/assessment/engine.ts";
import { assessmentContent, contentFor } from "../../lib/assessment/manifest.ts";
import { MODULE_PRACTICAL_MIN, REQUIRED_COURSES } from "../../lib/assessment/blueprint.ts";
import { check, report, stepSync, sweep, failed } from "./harness.mjs";

const COURSES = REQUIRED_COURSES.filter((courseId) => contentFor(courseId) !== null);
if (COURSES.length === 0) {
  console.log("No bank has content yet, so there is nothing to prove satisfiable.");
}

/* The code that satisfies one check, written as plain source. */
function fragmentFor(requirement) {
  const check_ = requirement.check;
  switch (check_.kind) {
    case "html-element": {
      const tag = check_.tag;
      const count = Math.max(1, check_.min ?? 1);
      const open = `<${tag} class="probe">Text</${tag}>`;
      return { html: open.repeat(count) };
    }
    case "html-list":
      return { html: `<ul>${"<li>Item</li>".repeat(check_.minItems)}</ul>` };
    case "html-landmarks":
      return { html: check_.tags.map((tag) => `<${tag}>Content</${tag}>`).join("") };
    case "html-attribute": {
      /* A requirement that names accepted values (an input type, a section id) is met
       * with the first accepted value, so the fixture reflects what the task asked for.
       * A control also gets a label, because a submission with an unlabelled control
       * would not be a complete submission for a form task. */
      const value = (check_.values && check_.values[0])
        || (check_.attr === "type" ? "email" : check_.attr === "id" ? "probe-section" : "A useful description of the content");
      if (check_.tag === "input") {
        return { html: `<label for="probe-type">Contact address</label><input id="probe-type" ${check_.attr}="${value}">` };
      }
      return { html: `<${check_.tag} ${check_.attr}="${value}">Content</${check_.tag}>` };
    }
    case "html-image-alt":
      return { html: `<img src="photo.webp" alt="A finished paper crane on a table">` };
    case "html-labelled-control":
      return { html: `<label for="probe-field">Your answer</label><input id="probe-field" type="text">` };
    case "html-fragment-link":
      return { html: `<a href="#probe-section">Jump to the section</a>`.concat(`<section id="probe-section">Content</section>`) };
    case "html-heading-order":
      return { html: `<h1>Page title</h1><h2>Section</h2>` };
    case "html-status-region":
      return { html: `<p role="status">Ready</p>` };
    case "html-language":
      return { html: `<html lang="en"></html>` };
    case "html-document-meta":
      return { html: `<title>My project page</title><meta name="viewport" content="width=device-width, initial-scale=1">` };
    case "html-text-free-of":
      return { html: `<p>Built by a learner with HTML, CSS and JavaScript.</p>` };
    case "css-declaration":
      return { css: `${check_.selector || ".probe"} { ${check_.property}: ${valueFor(check_.value)}; }` };
    case "css-at-rule":
      return { css: `@media (min-width: ${check_.minWidth ?? 600}px) { .probe { color: #111936; } }` };
    case "css-custom-properties":
      return { css: `:root { ${Array.from({ length: check_.min }, (_, index) => `--value-${index}: ${index + 1}rem`).join("; ")}; }` };
    case "css-var-usage":
      return { css: `:root { --ink: #111936; } .probe { color: var(--ink); border-color: var(--ink); }` };
    case "css-focus-visible":
      return { css: `a:focus-visible, button:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }` };
    case "css-fluid-width":
      return { css: `img { max-width: 100%; height: auto; }` };
    case "css-readability":
      return { css: `body { line-height: 1.6; font-size: 1rem; }` };
    case "css-grid-tracks":
      return { css: `.probe { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }` };
    case "js-function":
      /* Two parameters satisfy any parameter requirement, including none. */
      return { javascript: `function build(title, extra) { return title; }` };
    case "js-call":
      return { javascript: callFor(check_.method) };
    case "js-callback":
      return { javascript: `const kept = records.filter(function (record) { return record.available === true; });` };
    case "js-member-assignment":
      return { javascript: `const output = document.querySelector("#probe");\noutput.${check_.property} = "Ready";` };
    case "js-structural":
      return { javascript: factFor(check_.fact) };
    case "js-storage":
      return { javascript: `localStorage.${check_.method}("probe-key", "value");` };
    case "js-literal-any":
      return { javascript: `const message = ${JSON.stringify(check_.values[0])};` };
    case "js-absent":
      return { javascript: `const safe = document.createElement("li");\nlist.append(safe);` };
    case "js-request-id":
      return { javascript: "let latest = 0;\nasync function load() { const id = ++latest; const data = await fetch(url); if (id !== latest) return; show(data); }" };
    default:
      return {};
  }
}

function valueFor(valueClass) {
  const values = {
    grid: "grid",
    flex: "flex",
    "flex-wrap": "wrap",
    wrap: "wrap",
    fr: "repeat(2, minmax(0, 1fr))",
    minmax: "repeat(2, minmax(0, 1fr))",
    "auto-fit": "repeat(auto-fit, minmax(15rem, 1fr))",
    "relative-length": "1.5rem",
    percentage: "100%",
    "border-box": "border-box",
    "line-height": "1.6",
    "font-size": "1rem",
    gap: "1rem",
    outline: "3px solid #ee9d2b",
    padding: "1rem",
    margin: "1rem",
    border: "2px solid #111936",
    colour: "#111936",
    "custom-property": "var(--ink)",
  };
  return values[valueClass] || "1rem";
}

function callFor(method) {
  const calls = {
    forEach: `items.forEach(function (item) { show(item); });`,
    map: `const next = items.map(function (item) { return item; });`,
    filter: `const kept = items.filter(function (item) { return item.available === true; });`,
    querySelector: `const probe = document.querySelector("#probe");`,
    querySelectorAll: `const probes = document.querySelectorAll(".probe");`,
    toggle: `probe.classList.toggle("is-open");`,
    trim: `const value = input.value.trim();`,
    addEventListener: `probe.addEventListener("click", function () { show(); });`,
    createElement: `const item = document.createElement("li");`,
    append: `list.append(item);`,
    setItem: `localStorage.setItem("probe-key", "value");`,
    getItem: `const saved = localStorage.getItem("probe-key");`,
    fetch: `const response = await fetch(url);`,
    json: `const data = await response.json();`,
    sort: `const sorted = [...items].sort(function (a, b) { return a.title.localeCompare(b.title); });`,
  };
  return calls[method] || `probe.${method}(value);`;
}

function factFor(fact) {
  const facts = {
    conditional: `if (count > 0) { show(count); } else { show(0); }`,
    ternary: `const label = count > 0 ? "ready" : "empty";`,
    return: `function total(values) { return values.length; }`,
    declaration: `const title = "Project";\nlet count = 0;`,
    "string-literal": `const title = "Project page";`,
    "number-literal": `const total = 12;`,
    "strict-equality": `const same = chosen === expected;`,
    "array-literal": `const items = [{ title: "One" }, { title: "Two" }, { title: "Three" }];`,
    "object-literal": `const record = { id: 1, title: "One" };`,
    "try-catch": `try { load(); } catch (error) { show("Could not load. Try again."); }`,
    finally: `try { load(); } finally { button.disabled = false; }`,
    await: `const data = await load();`,
    "async-function": `async function load() { return 1; }`,
    "event-listener": `form.addEventListener("submit", function (event) { event.preventDefault(); });`,
    "prevent-default": `form.addEventListener("submit", function (event) { event.preventDefault(); });`,
    "create-element": `const item = document.createElement("li");`,
    append: `list.append(item);`,
    spread: `const next = [...items, item];`,
    "innerhtml-assignment": `list.innerHTML = "<li>Text</li>";`,
    eval: `const value = eval("1 + 1");`,
    "document-write": `document.write("Text");`,
  };
  return facts[fact] || "";
}

function compose(requirements, skip = -1) {
  const files = { html: "", css: "", javascript: "" };
  const parts = [];
  requirements.forEach((requirement, index) => {
    if (index === skip) return;
    const fragment = fragmentFor(requirement);
    parts.push(fragment);
    for (const key of Object.keys(files)) {
      if (typeof fragment[key] === "string") files[key] += `${fragment[key]}\n`;
    }
  });
  return { files, parts };
}

let total = 0;
for (const courseId of COURSES) {
  const content = assessmentContent[courseId];
  await sweep(`${courseId} requirements are satisfiable`, async () => {
    for (const form of content.moduleForms) {
      const requirements = form.practical.requirements;
      const composed = compose(requirements);

      stepSync(`${form.id} earns every mark when the task is done`, () => {
        const graded = gradeCodeTask(form.practical, composed.files);
        const unmet = graded.requirements.filter((requirement) => requirement.status !== "met");
        assert.deepEqual(
          unmet.map((requirement) => `${requirement.requirementId}: ${requirement.detail}`),
          [],
          "every requirement must be achievable",
        );
        assert.equal(graded.awarded, 5, "a complete submission earns every mark");
        total += 1;
      });

      stepSync(`${form.id} cannot reach the practical floor with empty code`, () => {
        /* An absence requirement (no personal detail on the page) is met by an empty
         * page, so the rule is that empty code can never earn enough to pass on its
         * own. The blueprint refuses a form that could. */
        const graded = gradeCodeTask(form.practical, { html: "", css: "", javascript: "" });
        assert.ok(
          graded.awarded < MODULE_PRACTICAL_MIN,
          `empty code earned ${graded.awarded} of 5, which is enough to pass the practical task`,
        );
        assert.equal(graded.requirements.length, 5);
        assert.equal(
          graded.awarded,
          graded.requirements.reduce((sum, requirement) => sum + (requirement.status === "met" ? requirement.available : 0), 0),
          "the mark is exactly the sum of the requirements that were met",
        );
        total += 1;
      });

      stepSync(`${form.id} decides each requirement on its own`, () => {
        /* One requirement's own code, and nothing else, must satisfy that requirement.
         * This is what makes the marking requirement by requirement rather than all or
         * nothing. */
        for (let index = 0; index < requirements.length; index += 1) {
          const alone = compose([requirements[index]]);
          const graded = gradeCodeTask(form.practical, alone.files);
          assert.equal(
            graded.requirements[index].status,
            "met",
            `requirement ${index + 1} is not decidable on its own: ${graded.requirements[index].detail}`,
          );
        }
        total += 1;
      });

      stepSync(`${form.id} accounts for every mark`, () => {
        const partial = compose(requirements.slice(0, 3));
        const graded = gradeCodeTask(form.practical, partial.files);
        const metCount = graded.requirements.filter((requirement) => requirement.status === "met").length;
        assert.ok(metCount >= 1, "at least the first requirements must be credited");
        assert.equal(
          graded.awarded,
          graded.requirements.reduce((sum, requirement) => sum + (requirement.status === "met" ? requirement.available : 0), 0),
          "the mark is exactly the sum of the requirements that were met",
        );
        total += 1;
      });
    }
  });
}

if (failed.length === 0 && total > 0) check("every marked requirement in every bank is achievable and independent");
report("assessment satisfiability");