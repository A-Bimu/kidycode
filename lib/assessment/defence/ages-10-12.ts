/*
 * Ages 10 to 12: reviewed code-defence templates.
 *
 * The code defence runs after a learner has submitted their small website. It asks three
 * things of the learner, in this order: explain one decision in their own words, predict
 * what a short taught snippet does, and make one small change to the page they actually
 * built. A fourth, slightly harder prediction is used when a coarse integrity signal
 * suggests checking more.
 *
 * Every task carries the objectives it assesses and the lesson a learner can revise, so
 * nothing in a defence can ask for a skill the course has not taught. The language is
 * written for a ten to twelve year old: one idea at a time, plain words, and no
 * assumption that a learner can infer a rule.
 *
 * The change task is decided by a declarative requirement check, the same kind of check
 * the practical tasks use, so a live change is graded from the learner's own submitted
 * files rather than from an exact string.
 */

import type { DefenceTemplate } from "@/lib/assessment/types";

const courseId = "ages-10-12" as const;

/* ------------------------------------------------- 1. page structure and lists -- */

/* The first HTML module: elements, headings, nesting, lists and a first complete page.
   The defence asks the learner to justify grouping their list inside a section, to read
   a nested section with a heading in it, and to add one more item to the list they
   already built. */

const structureObjectives = ["elements", "headings", "nesting", "lists", "first-page"];

const structureDefence: DefenceTemplate = {
  id: "ages-10-12-defence-1",
  courseId,
  objectives: structureObjectives,
  explain: {
    id: "ages-10-12-defence-1-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why you put your list inside a section on the page you built, instead of leaving the items loose between two paragraphs. Say what the grouping tells someone who reads the page without any styling.",
    snippet: `<main>
  <h1>My Science Page</h1>
  <p>Three things I learned about the water cycle.</p>
  <section>
    <h2>What happens first</h2>
    <ul>
      <li>Sun heats the water.</li>
      <li>Water rises as vapour.</li>
      <li>Vapour cools into cloud.</li>
    </ul>
  </section>
</main>`,
    explanation:
      "A good answer says that the section holds content that belongs together, so the list is understood as one group rather than as odd lines sitting between paragraphs, and that a reader who cannot see any styling still knows where the group starts and ends. A good answer also points at your own page and names the list you grouped. Saying only that the section looks tidy, or that the tags were needed to make the page open, misses the reason.",
    objectives: ["nesting", "lists"],
    revision: "nesting",
  },
  predict: {
    id: "ages-10-12-defence-1-predict",
    courseId,
    kind: "predict",
    prompt: "This snippet sits inside main, below the page h1. How does the browser read it?",
    snippet: `<section>
  <h2>Weather</h2>
  <p>It rained today.</p>
</section>`,
    options: [
      "The h2 names a section inside the page, and the paragraph is read as part of that section",
      "The h2 becomes the main heading of the whole page, in place of the h1",
      "The paragraph is read as part of the page, because the section closed before it",
      "The h2 is read as ordinary paragraph text, and the paragraph becomes the section heading",
    ],
    answer: 0,
    explanation:
      "A section groups content together, and the h2 inside it introduces that group under the page heading. The paragraph sits between the opening and closing section tags, so it belongs to the same group rather than to the page as a whole. An h2 is still a heading, and heading levels step down one at a time from h1 to h2.",
    objectives: ["headings", "nesting"],
    revision: "nesting",
  },
  change: {
    id: "ages-10-12-defence-1-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the page you submitted, then explain what the change does and why the list still works with one more item in it.",
    changeInstruction:
      "In the HTML you submitted, find the list of items and add one more honest item to it, keeping the new line inside the same list element as the others. Leave the heading, the paragraphs and the sections as they are.",
    snippet: `<ul>
  <li>Sun heats the water.</li>
  <li>Water rises as vapour.</li>
  <li>Vapour cools into cloud.</li>
</ul>`,
    changeRequirement: { kind: "increase", inner: { kind: "html-element", file: "html", tag: "li" }, by: 1, on: "html-element" },
    explanation:
      "One more item means one more line inside the same list, added between the opening and closing list tags. The item stays inside the list element, so the browser still shows the whole group as one list and the numbering or bullets continue without a break. The surrounding page does not need to change, which is what makes a list easy to grow.",
    objectives: ["lists"],
    revision: "lists",
  },
  escalatedPredict: {
    id: "ages-10-12-defence-1-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt: "The page uses these two headings, one after the other. What is the problem with the heading levels?",
    snippet: `<h1>My Science Page</h1>
<h3>What I tested</h3>
<p>I watched a cup of water for a week.</p>`,
    options: [
      "There is no problem, because any heading level may follow an h1",
      "The h1 must come after the h3, because a page is read from the smallest heading upward",
      "The h3 skips a level, so an h2 is needed between the h1 and the h3",
      "The page needs a second h1, because every section has its own main heading",
    ],
    answer: 2,
    explanation:
      "Heading levels step down one at a time, so h2 belongs directly under h1 and h3 belongs under an h2. Jumping from h1 to h3 leaves a gap that a reader using a screen reader cannot follow, because the levels are how the shape of the page is announced. A page has one h1, and heading levels are about the order of the sections rather than about the size of the text.",
    objectives: ["headings"],
    revision: "text",
  },
};

/* ---------------------------------------------------- 2. stylesheet and cards --- */

/* The CSS foundations module: a rule, a reusable class, readable type, a card built from
   padding, border and background, and a small set of named design values. The defence
   asks the learner to justify reusing one class, to read padding and margin apart on a
   card, and to add one more colour rule of their own. */

const styleObjectives = ["rules", "classes", "type", "cards", "visual-system"];

const styleDefence: DefenceTemplate = {
  id: "ages-10-12-defence-2",
  courseId,
  objectives: styleObjectives,
  explain: {
    id: "ages-10-12-defence-2-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why you gave the same class to more than one element on your page instead of styling each element on its own. Say what happens later when you want to change how those elements look.",
    snippet: `.card {
  padding: 12px;
  border: 2px solid #22223b;
  background-color: #f2e9e4;
}`,
    explanation:
      "A good answer says that a class is one reusable label, so a single rule styles every element that carries it, and that changing the rule later changes all of those elements together. A good answer also points at your own page and names the elements that share the class. Saying only that a class is shorter to type, or that it makes the page load faster, misses the reason.",
    objectives: ["classes", "visual-system"],
    revision: "classes",
  },
  predict: {
    id: "ages-10-12-defence-2-predict",
    courseId,
    kind: "predict",
    prompt: "The card class is applied to three elements on the page. Which sentence about the space around each card is correct?",
    snippet: `.card {
  padding: 12px;
  border: 2px solid #22223b;
  margin: 8px;
}`,
    options: [
      "12px of space sits outside each card and 8px sits inside its edge",
      "12px of space sits inside each card's edge and 8px sits outside it, between neighbouring cards",
      "The two numbers are added together, so each card has 20px of space inside its edge",
      "Each card has 12px of space outside its edge, because padding is measured from the card outwards",
    ],
    answer: 1,
    explanation:
      "Padding is the space between the content and the card's own edge, so it holds the words away from the border. Margin is the space around the outside of the box, so it separates one card from the next. The two spaces are measured separately and are never added together, and padding is always measured inwards from the edge.",
    objectives: ["cards"],
    revision: "cards",
  },
  change: {
    id: "ages-10-12-defence-2-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the page you submitted, then explain what the change does and why it is easy to reuse the same choice again later.",
    changeInstruction:
      "In the stylesheet you submitted, add one more rule that sets a text colour with a value you would be happy to reuse, for example the colour you want your headings to share. Do not change the HTML and do not remove any rule that is already there.",
    snippet: `.card {
  padding: 12px;
  border: 2px solid #22223b;
}`,
    changeRequirement: { kind: "increase", inner: { kind: "css-declaration", file: "css", property: "color", value: "colour" }, by: 1, on: "css-declaration" },
    explanation:
      "One more colour rule means one more declaration that sets a colour from a value you chose, which the rest of the page can follow. Because the value lives in the stylesheet rather than being typed again and again, a later change to that one value updates every place that reads it. The markup is untouched, which is what keeps the change small.",
    objectives: ["rules"],
    revision: "rules",
  },
  escalatedPredict: {
    id: "ages-10-12-defence-2-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt: "A card has padding of 12px and a margin of 24px. A visitor says the words feel too close to the edge of the card. Which value would you change?",
    snippet: `.card {
  padding: 12px;
  margin: 24px;
  border: 2px solid #22223b;
}`,
    options: [
      "The margin, because margin is the space inside an element",
      "The padding, because padding is the space between the content and the edge of the element",
      "The border width, because a wider border adds space around the words",
      "Neither, because the space inside an element cannot be changed with CSS",
    ],
    answer: 1,
    explanation:
      "Padding is the space inside an element, between its content and its border. Margin is the space outside the border, between this element and its neighbours. The gap the visitor describes sits inside the card, so padding is the value to change.",
    objectives: ["box"],
    revision: "box",
  },
};

/* ---------------------------------------- 3. data, loops and page interactions --- */

/* The data and interaction modules: items kept in an array, one loop that puts an
   element on the page for each item, a comparison that decides something, and a click
   that switches one visible state on and off. The defence asks the learner to justify
   keeping the items in an array, to read a loop over a changing array, and to add one
   more element to the page inside their own loop. */

const dataObjectives = ["selecting", "events", "class-toggle", "arrays", "loops-render"];

const dataDefence: DefenceTemplate = {
  id: "ages-10-12-defence-3",
  courseId,
  objectives: dataObjectives,
  explain: {
    id: "ages-10-12-defence-3-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why you kept your items in an array and let one loop put them on the page, instead of typing each list item into the HTML yourself. Say what you would do to show a fourth item.",
    snippet: `const facts = ["Water rises as vapour.", "Clouds hold tiny drops.", "Rain returns the water."];

facts.forEach(function (fact) {
  const item = document.createElement("li");
  item.textContent = fact;
  list.append(item);
});`,
    explanation:
      "A good answer says that the array is the one place the items live, so the loop can show every item without a new line of markup for each one, and that a fourth item appears by adding one sentence to the array. A good answer also says what does not change: the loop and the list stay exactly as they are. Saying only that the code is shorter misses why the page is still correct when the group changes.",
    objectives: ["arrays", "loops-render"],
    revision: "javascript-logic-loops",
  },
  predict: {
    id: "ages-10-12-defence-3-predict",
    courseId,
    kind: "predict",
    prompt: "One more sentence is added to the facts array in the code, and the page is reloaded. How many list items appear, and in what order?",
    snippet: `const facts = ["Water rises as vapour.", "Clouds hold tiny drops.", "Rain returns the water."];

facts.forEach(function (fact) {
  const item = document.createElement("li");
  item.textContent = fact;
  list.append(item);
});`,
    options: [
      "Four items appear, one for every sentence in the array, in the order they are written",
      "Three items appear, because the loop stops when the list on the page is full",
      "One item appears, holding all four sentences joined together",
      "Four items appear, but they are written backwards, because forEach visits the array in reverse",
    ],
    answer: 0,
    explanation:
      "forEach runs its function once for every item in the array, moving forwards from the first item to the last, so a fourth sentence produces a fourth list item in its own place. The loop never counts the elements it has made, and the list element itself has no fixed size. The order on the page therefore matches the order in the array.",
    objectives: ["arrays", "loops-render"],
    revision: "javascript-logic-loops",
  },
  change: {
    id: "ages-10-12-defence-3-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the page you submitted, then explain what the change does and what the visitor sees because of it.",
    changeInstruction:
      "In the JavaScript you submitted, find the loop that adds one element to the page for each item. Inside that same loop, add one more element to the page for each item, for example a small label that names the item's place in the list, using document.createElement and append. Keep the array, the loop and the element you already add.",
    snippet: `facts.forEach(function (fact) {
  const item = document.createElement("li");
  item.textContent = fact;
  list.append(item);
});`,
    changeRequirement: { kind: "increase", inner: { kind: "js-call", file: "javascript", method: "append" }, by: 1, on: "js-call" },
    explanation:
      "One more append inside the same loop puts one more element on the page for every item the loop visits, so the extra label appears beside each item and not just beside the first one. Because the work stays inside the loop, adding a fifth item to the array still receives the same treatment. The array and the loop are unchanged, which is what keeps the change small and repeatable.",
    objectives: ["loops-render"],
    revision: "javascript-logic-loops",
  },
  escalatedPredict: {
    id: "ages-10-12-defence-3-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt: "The visitor presses the button three times while the page stays open. What is true of the card element after the third press?",
    snippet: `const card = document.querySelector("#card");
const button = document.querySelector("#toggle");

button.addEventListener("click", function () {
  card.classList.toggle("open");
});`,
    options: [
      "The open class is added on every press, so it is listed on the card three times",
      "The open class is on the card after the first and third presses, and off the card after the second press",
      "The open class is added on the first press and then stays on the card",
      "The card element is replaced on each press, so the class is lost again each time",
    ],
    answer: 1,
    explanation:
      "A toggle checks whether the class is already there: it removes the class when it is present and adds it when it is missing. Three presses therefore leave the class on, then off, then on again, following the same rule each time. A class is either present on an element or absent, so it is never listed twice, and nothing replaces the element.",
    objectives: ["class-toggle", "events"],
    revision: "dom-interaction-classes",
  },
};

export const templates: DefenceTemplate[] = [structureDefence, styleDefence, dataDefence];