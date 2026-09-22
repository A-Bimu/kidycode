/*
 * The built-in reference sheet.
 *
 * This is the only help available while an assessment is running: general syntax for the
 * three languages the courses teach, with no worked solution to any task and no wording
 * from any question. It is deliberately short, because a learner should be reading their
 * own code rather than a manual, and it is served from the server so the client cannot
 * edit what it is allowed to see.
 */

import type { ReferenceSection } from "@/lib/assessment/types";

export const REFERENCE_RULES = [
  "This sheet shows general syntax only. It never contains the answer to a question or a task.",
  "The tutor, hints and any answer-revealing help are switched off while you are being assessed.",
  "Reading this sheet is allowed. Copying a whole answer from anywhere else is not, and the code defence is how you show the work is yours.",
];

export const REFERENCE_SECTIONS: ReferenceSection[] = [
  {
    id: "html-structure",
    title: "HTML: the shape of a page",
    note: "An element is an opening tag, its content and a closing tag.",
    lines: [
      "<h1>Page title</h1>",
      "<h2>Section title</h2>",
      "<p>One paragraph of text.</p>",
      "<ul><li>First item</li><li>Second item</li></ul>",
      "<a href=\"#section\">Link to a section</a>",
      "<section id=\"section\">...</section>",
    ],
  },
  {
    id: "html-content",
    title: "HTML: describing content",
    note: "A description travels with the element it describes.",
    lines: [
      "<img src=\"photo.webp\" alt=\"What the picture shows\">",
      "<label for=\"name\">Your name</label>",
      "<input id=\"name\" type=\"text\">",
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      "<p role=\"status\">Ready</p>",
    ],
  },
  {
    id: "css-rule",
    title: "CSS: rules and values",
    note: "A selector chooses elements, and each declaration changes one property.",
    lines: [
      "selector { property: value; }",
      "body { line-height: 1.6; }",
      ".card { padding: 1rem; border: 2px solid #111936; }",
      ":root { --ink: #111936; }",
      ".card { color: var(--ink); }",
    ],
  },
  {
    id: "css-layout",
    title: "CSS: layout and screens",
    note: "Start with the small screen and add changes for wider ones.",
    lines: [
      "nav { display: flex; flex-wrap: wrap; gap: 1rem; }",
      ".cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; }",
      "@media (min-width: 600px) { .cards { grid-template-columns: repeat(3, 1fr); } }",
      "img { max-width: 100%; height: auto; }",
      "a:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }",
    ],
  },
  {
    id: "js-values",
    title: "JavaScript: values and decisions",
    note: "A condition produces true or false, and a branch acts on it.",
    lines: [
      "const name = \"Project\";",
      "let count = 0;",
      "count = count + 1;",
      "if (count > 0) { } else { }",
      "count === 0",
      "count > 0 ? \"ready\" : \"empty\"",
    ],
  },
  {
    id: "js-page",
    title: "JavaScript: the page and records",
    note: "Select an element, decide a value, then show it.",
    lines: [
      "const status = document.querySelector(\"#status\");",
      "status.textContent = \"Ready\";",
      "records.forEach(function (record) { });",
      "const item = document.createElement(\"li\");",
      "item.textContent = record.title;",
      "list.append(item);",
      "const kept = records.filter(function (record) { return record.available === true; });",
    ],
  },
  {
    id: "js-failure",
    title: "JavaScript: forms, storage and failure",
    note: "Feedback and recovery need a state for every outcome.",
    lines: [
      "form.addEventListener(\"submit\", function (event) { event.preventDefault(); });",
      "const value = input.value.trim();",
      "localStorage.setItem(\"project-key\", value);",
      "const saved = localStorage.getItem(\"project-key\");",
      "try { } catch (error) { } finally { }",
    ],
  },
];

export function referenceSectionsFor(): ReferenceSection[] {
  return REFERENCE_SECTIONS.map((section) => ({ ...section, lines: [...section.lines] }));
}
