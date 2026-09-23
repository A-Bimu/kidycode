/*
 * Code defence templates: adults, Web Skills for Work and Business.
 *
 * One template for each part of the client project the course builds: the structure and
 * content of the site, the visual system and responsive layout, and the JavaScript
 * behaviour. Every template carries four reviewed tasks:
 *
 *   explain          the learner says in their own words why they made one decision
 *   predict          a short snippet the course taught, with four options and one answer
 *   change           one small change made to the site the learner actually submitted
 *   escalatedPredict the same idea, about half a step harder, used when a coarse
 *                    integrity signal suggests checking more closely
 *
 * Every task points at a real lesson of the adults course, carries its own revision
 * slug, snippet and explanation, and asks for nothing the course does not teach. The
 * language is written for an adult working on a client project: plain, professional and
 * free of jargon the lessons never used.
 */

import type { DefenceTemplate } from "@/lib/assessment/types";

const courseId = "adults" as const;

export const templates: DefenceTemplate[] = [
  {
    id: "adults-defence-1",
    courseId,
    objectives: [
      "adults-structure-headings",
      "adults-structure-landmarks",
      "adults-structure-links",
      "adults-structure-metadata",
    ],
    explain: {
      id: "adults-defence-1-explain",
      courseId,
      kind: "explain",
      prompt:
        "In your own words, explain one decision you made about the structure of the business website you built. Name the decision, say why you made it and describe what the client or their visitor gains from it.",
      snippet:
        "<header>\n  <h1>Service business name</h1>\n  <nav><a href=\"#services\">Services</a></nav>\n</header>\n<main>\n  <section id=\"services\">\n    <h2>What we do</h2>\n  </section>\n</main>\n<footer><p>A short closing line about the business.</p></footer>",
      explanation:
        "A good answer names one decision you actually made, for example giving the services one section with its own heading under a single h1, keeping the navigation link inside the header, or describing a photograph so the page still carries the same information when the picture is not shown. It gives the reason for that choice and what the visitor gains, such as finding the services quickly or moving through the page with a screen reader. It is written in your own words about your own site rather than as a definition from the lesson.",
      objectives: ["adults-structure-headings", "adults-structure-landmarks"],
      revision: "landmarks",
    },
    predict: {
      id: "adults-defence-1-predict",
      courseId,
      kind: "predict",
      prompt:
        "This navigation link points at #services and the section below carries id=\"services\". What happens when a visitor chooses the link?",
      snippet:
        "<nav><a href=\"#services\">Services</a></nav>\n<section id=\"services\">\n  <h2>What we do</h2>\n  <p>Fitted furniture for small rooms.</p>\n</section>",
      options: [
        "The services section opens in a second browser tab",
        "The enquiry form on the page is sent to the business",
        "The browser moves to the section whose id is services on the same page",
        "Every heading on the page changes into a link",
      ],
      answer: 2,
      explanation:
        "A fragment link uses a hash and an id that exists on the same page, which is what the links lesson taught, so the browser moves to that section. It does not open a new tab, send the form or turn headings into links.",
      objectives: ["adults-structure-links"],
      revision: "links",
    },
    change: {
      id: "adults-defence-1-change",
      courseId,
      kind: "change",
      prompt:
        "Make one small change to the home page you submitted: add a photograph of finished work to the services section and describe what matters in it.",
      changeInstruction:
        "Open the home page you submitted and add one photograph of a finished piece of work inside the services section. Describe what matters in the photograph, so the page keeps giving the same information when the picture cannot be seen.",
      snippet:
        "<section id=\"services\">\n  <h2>What we do</h2>\n  <img src=\"fitted-shelves.jpg\" alt=\"Fitted shelves in a small living room\">\n</section>",
      changeRequirement: { kind: "html-image-alt", file: "html" },
      explanation:
        "The check looks at the images in the submitted page and reports the requirement met when at least one carries alternative text that states its useful information. A description such as Fitted shelves in a small living room passes, while a short label, or the words image of followed by a file name, does not.",
      objectives: ["adults-structure-metadata"],
      revision: "metadata",
    },
    escalatedPredict: {
      id: "adults-defence-1-escalated-predict",
      courseId,
      kind: "predict",
      escalated: true,
      prompt:
        "A colleague sends this page for review before it goes to the client. Using the heading order the course taught, which statement describes what needs repair?",
      snippet:
        "<header><h1>Alder Carpentry</h1></header>\n<main>\n  <h3>What we do</h3>\n  <p>Fitted shelves, window seats and stair rails.</p>\n</main>\n<footer><p>A small workshop working across the county.</p></footer>",
      options: [
        "The page skips a heading level from h1 to h3, so the section needs an h2 first",
        "The page is correct, because a section title may use any heading level other than h1",
        "The page needs a second h1 so that each section is named in the outline",
        "The page needs no repair, because the paragraph already carries the service details",
      ],
      answer: 0,
      explanation:
        "The heading order rule asks for one h1 and for levels that step down one at a time, so an h3 directly under the h1 skips a level. Adding an h2 for the section and keeping the h3 for a part inside that section repairs the outline. Two h1 elements would break the rule rather than satisfy it.",
      objectives: ["adults-structure-headings"],
      revision: "headings",
    },
  },
  {
    id: "adults-defence-2",
    courseId,
    objectives: [
      "adults-css-system-project",
      "adults-css-system-tokens",
      "adults-responsive-media",
      "adults-responsive-viewport",
    ],
    explain: {
      id: "adults-defence-2-explain",
      courseId,
      kind: "explain",
      prompt:
        "In your own words, explain one styling or layout decision in the stylesheet of the website you built. Name the decision, say why you made it that way for this client and describe what a visitor notices because of it.",
      snippet:
        ":root {\n  --ink: #111936;\n  --paper: #f7f3ea;\n  --space: 1rem;\n}\n\nbody {\n  background: var(--paper);\n  color: var(--ink);\n  line-height: 1.6;\n}",
      explanation:
        "A good answer names one decision you actually made, for example naming the text colour once and using it everywhere, setting a readable line height on the page, or starting the card grid with one column and adding more columns from 700 pixels. It gives the reason for the choice and the result a visitor sees, such as longer paragraphs that stay easy to read or a page that fits a phone without sideways scrolling. It describes your own stylesheet rather than repeating a definition.",
      objectives: ["adults-css-system-project", "adults-css-system-tokens"],
      revision: "tokens",
    },
    predict: {
      id: "adults-defence-2-predict",
      courseId,
      kind: "predict",
      prompt:
        "The service cards use this stylesheet. A laptop screen is 1200 pixels wide and a phone screen is 380 pixels wide. How many cards sit side by side on each screen?",
      snippet:
        ".cards {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n@media (min-width: 700px) {\n  .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n}",
      options: [
        "Three on the laptop and one on the phone",
        "One on the laptop and three on the phone",
        "Three on both screens, because a media query always applies",
        "One on both screens, because the first rule wins on every screen",
      ],
      answer: 0,
      explanation:
        "The base rule gives a single column, and the 700 pixel breakpoint applies only when the screen is at least that wide. The laptop therefore receives three tracks while the phone keeps one, and the first rule is overridden on the wide screen because the media query applies there.",
      objectives: ["adults-responsive-media"],
      revision: "media",
    },
    change: {
      id: "adults-defence-2-change",
      courseId,
      kind: "change",
      prompt:
        "Make one small change to the stylesheet you submitted: use one of your named design values in a second place so it appears in more than one rule.",
      changeInstruction:
        "Open the stylesheet you submitted and use one of your named design values in a second place, for example as the text colour of a card or the space inside a section, so the named value is used in more than one rule. Do not add a value the page does not need.",
      snippet:
        ":root {\n  --ink: #111936;\n  --space: 1rem;\n}\n\n.card {\n  color: var(--ink);\n  padding: var(--space);\n}",
      changeRequirement: { kind: "css-var-usage", file: "css", min: 2 },
      explanation:
        "The check counts every use of var() in the submitted stylesheet and reports the requirement met once at least two uses are present. Declaring a value in one block without using it does not count, so the change has to be a real use of the named value inside a rule.",
      objectives: ["adults-css-system-project", "adults-css-system-tokens"],
      revision: "project",
    },
    escalatedPredict: {
      id: "adults-defence-2-escalated-predict",
      courseId,
      kind: "predict",
      escalated: true,
      prompt:
        "On a 380 pixel phone this page scrolls sideways to the right. Following the approach the course taught for fitting every screen, which change repairs it?",
      snippet:
        ".cards {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n.card {\n  width: 30rem;\n  padding: 1rem;\n}",
      options: [
        "Give the card a width that follows the space available, such as 100% with a maximum width",
        "Remove the gap between the cards so the row becomes narrower",
        "Make the page text smaller so that each card takes up less room",
        "Add a second media query for screens of 320 pixels",
      ],
      answer: 0,
      explanation:
        "A fixed width that is wider than the screen is what makes the page wider than the viewport, and the viewport lesson ties the width to the space available while keeping a sensible maximum. Removing the gap, reducing the text size or adding another breakpoint leaves the fixed width in place, so the sideways scrolling would remain.",
      objectives: ["adults-responsive-viewport"],
      revision: "viewport",
    },
  },
  {
    id: "adults-defence-3",
    courseId,
    objectives: [
      "adults-data-foreach",
      "adults-data-render",
      "adults-interaction-storage",
      "adults-interaction-validation",
    ],
    explain: {
      id: "adults-defence-3-explain",
      courseId,
      kind: "explain",
      prompt:
        "In your own words, explain one decision in the JavaScript on your site. Say what the code does, why you wrote it that way and what the visitor sees because of it.",
      snippet:
        "const services = [\n  { title: \"Fitted shelves\" },\n  { title: \"Window seats\" },\n];\nconst list = document.querySelector(\"#service-list\");\n\nservices.forEach(function (service) {\n  const item = document.createElement(\"li\");\n  item.textContent = service.title;\n  list.append(item);\n});",
      explanation:
        "A good answer names one decision you actually made, for example keeping the services in one array and rendering them with a loop instead of writing every list item by hand, choosing const for a value that never changes, or checking the typed value with trim before the form accepts it. It says why the code is written that way and what the visitor sees, such as one list item for every service or a message that explains an empty field. It describes your own script rather than repeating a definition.",
      objectives: ["adults-data-foreach", "adults-data-render"],
      revision: "render",
    },
    predict: {
      id: "adults-defence-3-predict",
      courseId,
      kind: "predict",
      prompt:
        "The page holds an empty list with id service-list. After this script runs, what does the visitor see on the page?",
      snippet:
        "const services = [\n  { title: \"Fitted shelves\" },\n  { title: \"Window seats\" },\n  { title: \"Stair rails\" },\n];\nconst list = document.querySelector(\"#service-list\");\n\nservices.forEach(function (service) {\n  const item = document.createElement(\"li\");\n  item.textContent = service.title;\n  list.append(item);\n});",
      options: [
        "One list item that shows the whole array as a line of text",
        "Three list items, one for each record in the array",
        "Nothing at all until the visitor sends the enquiry form",
        "Three articles appended after the footer of the page",
      ],
      answer: 1,
      explanation:
        "The loop runs its function once for every record, and each run creates one list item, sets its text from the record and adds it to the list, so three records produce three list items. Nothing waits for a form submission, and the records are never shown as raw data.",
      objectives: ["adults-data-foreach", "adults-data-render"],
      revision: "foreach",
    },
    change: {
      id: "adults-defence-3-change",
      courseId,
      kind: "change",
      prompt:
        "Make one small change to the script you submitted: keep one small non-sensitive value in the browser when the visitor sends the enquiry form.",
      changeInstruction:
        "Open the script you submitted and save one non-sensitive value in the browser when the visitor sends the enquiry form, using a short key of your own, for example the service they asked about. Keep the message the visitor sees after the form is sent.",
      snippet:
        "form.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  const choice = input.value.trim();\n  localStorage.setItem(\"service-choice\", choice);\n  statusText.textContent = \"Saved\";\n});",
      changeRequirement: { kind: "js-storage", file: "javascript", method: "setItem" },
      explanation:
        "The check reads the submitted script and reports the requirement met when a value is saved in browser storage. The storage lesson asks for one small non-sensitive value, so a preference such as the chosen service is suitable, while a password, a phone number or an address would not be acceptable for the client site.",
      objectives: ["adults-interaction-storage"],
      revision: "storage",
    },
    escalatedPredict: {
      id: "adults-defence-3-escalated-predict",
      courseId,
      kind: "predict",
      escalated: true,
      prompt:
        "A visitor presses the send button without typing anything in the field. What does the visitor see, and what is kept in the browser?",
      snippet:
        "const input = document.querySelector(\"#service-choice\");\nconst statusText = document.querySelector(\"#status\");\n\nform.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  const choice = input.value.trim();\n  if (choice === \"\") {\n    statusText.textContent = \"Please name the service you need\";\n  } else {\n    localStorage.setItem(\"service-choice\", choice);\n    statusText.textContent = \"Saved\";\n  }\n});",
      options: [
        "The message Please name the service you need appears, and nothing is saved",
        "The message Saved appears, and an empty value is saved",
        "Nothing changes, because the empty check runs only when the page is reloaded",
        "The page reloads and the field is cleared without any message",
      ],
      answer: 0,
      explanation:
        "Trimming an entry that holds only spaces produces an empty string, so the first branch runs, the page explains what is needed and the saving line is never reached. That is the validation the course taught, which is why nothing is written to the browser and the visitor receives a clear next step instead.",
      objectives: ["adults-interaction-validation"],
      revision: "validation",
    },
  },
];
