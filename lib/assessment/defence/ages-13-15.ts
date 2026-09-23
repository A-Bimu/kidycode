/*
 * Ages 13 to 15: code defence templates.
 *
 * Three reviewed templates for the Practical Web Development course. A learner who
 * reaches the defence explains one decision they made in their own project, predicts what
 * a short piece of taught code does, and makes one small change to the site they
 * submitted. The extra prediction is added when a coarse integrity signal suggests
 * checking more. A signal can add a task; it can never lower a mark.
 *
 * Every objective and every revision link names a lesson of
 * lib/assessment/bank/ages-13-15.ts, so nothing is asked about material the course has
 * not taught. Every change requirement is a requirement check copied from that bank, and
 * every check kind is one that lib/assessment/grading.ts decides from the submitted
 * files, with the fields that kind needs.
 */

import type { DefenceTemplate } from "@/lib/assessment/types";

const courseId = "ages-13-15" as const;

/* ------------------------------------------------- 1. the responsive site ---- */

const responsiveDefence: DefenceTemplate = {
  id: "ages-13-15-defence-1",
  courseId,
  objectives: [
    "ages-13-15-responsive-viewport",
    "ages-13-15-responsive-grid",
    "ages-13-15-responsive-project",
  ],
  explain: {
    id: "ages-13-15-defence-1-explain",
    courseId,
    kind: "explain",
    prompt:
      "Every width of screen has to work for your project. In your own words, explain why the cards area starts as one column, why the wider rule sits inside a media query, and why the tracks are written as minmax(0, 1fr). Write three or four sentences that name each decision and give the reason for it.",
    snippet: `.cards { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (min-width: 700px) {
  .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}`,
    explanation:
      "A good answer says that the one column rule is the base, so the cards stay readable on a small screen even if no wider rule ever applies. It says that the media query carries only what changes from 700px upward, rather than repeating the whole stylesheet. It says that minmax(0, 1fr) allows a track to shrink, so a long word or a long line cannot stretch the layout past its share of the width. Naming the widths you tested, such as 320px and 800px, and what you saw at each one, is strong evidence that the decision is yours.",
    objectives: [
      "ages-13-15-responsive-viewport",
      "ages-13-15-responsive-grid",
      "ages-13-15-responsive-project",
    ],
    revision: "ages-13-15-responsive-project",
  },
  predict: {
    id: "ages-13-15-defence-1-predict",
    courseId,
    kind: "predict",
    prompt:
      "The cards area has about 60rem of space. What does the browser do with repeat(auto-fit, minmax(15rem, 1fr))?",
    snippet: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1rem;
}`,
    options: [
      "It fits as many 15rem tracks as the space allows, and the tracks share the space that is left.",
      "It always creates three tracks, whatever the width of the cards area.",
      "It fixes every track at exactly 15rem and leaves the rest of the space empty.",
      "It puts every card into one column until a media query changes it.",
    ],
    answer: 0,
    explanation:
      "Auto-fit lets the browser choose how many tracks fit into the space, so the number of columns changes with the width without any new media query. minmax(15rem, 1fr) sets a smallest useful track and then hands the leftover space to the tracks. Three tracks is what appears at one particular width, so it is a result and not the rule; the tracks are not fixed at 15rem; and nothing here stacks the cards in a single column.",
    objectives: ["ages-13-15-responsive-grid"],
    revision: "ages-13-15-responsive-grid",
  },
  change: {
    id: "ages-13-15-defence-1-change",
    courseId,
    kind: "change",
    prompt: "Make one small change to your own site, then check it in the browser.",
    snippet: `/* The cards area is still one column at every width. */
.cards { display: grid; grid-template-columns: 1fr; gap: 1rem; }`,
    changeInstruction:
      "In the site you submitted, add one media query that gives the cards area more columns once there is room. The query must apply from 700px upward and must change the grid columns of the cards area only.",
    changeRequirement: { kind: "css-at-rule", file: "css", at: "media", minWidth: 700 },
    explanation:
      "A correct change is a media query with min-width: 700px that alters the cards grid, for example from grid-template-columns: 1fr to grid-template-columns: repeat(3, minmax(0, 1fr)). The query is read from the stylesheet you submit, so it has to be in the file rather than planned. Leave the rest of the layout as it was, then open the page at a narrow width and at 800px and compare the two.",
    objectives: [
      "ages-13-15-responsive-grid",
      "ages-13-15-responsive-project",
    ],
    revision: "ages-13-15-responsive-project",
  },
  escalatedPredict: {
    id: "ages-13-15-defence-1-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt:
      "One card contains a very long word with no spaces in it. What does minmax(0, 1fr) do for that track?",
    snippet: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 1rem;
}`,
    options: [
      "Each track grows until the whole long word fits, which can push the layout sideways.",
      "The browser leaves the long word out of the card so the track can stay narrow.",
      "Each track keeps its share of the width instead of being stretched wider by the long word.",
      "The gap between the tracks closes so that the long word has somewhere to go.",
    ],
    answer: 2,
    explanation:
      "The first value in minmax is the smallest size a track may take. A minimum of 0 lets the track shrink, so a long word cannot stretch the track beyond its share of the space, which is why the project uses it. A minimum of 15rem would do the opposite, because the track would refuse to go below that width. Nothing in this rule removes text from the page, and the gap between the tracks is unchanged.",
    objectives: ["ages-13-15-responsive-grid"],
    revision: "ages-13-15-responsive-grid",
  },
};

/* ------------------------------------------------------ 2. the project form --- */

const formDefence: DefenceTemplate = {
  id: "ages-13-15-defence-2",
  courseId,
  objectives: [
    "ages-13-15-forms-labels",
    "ages-13-15-forms-groups",
    "ages-13-15-css-system-states",
    "ages-13-15-quality-accessibility",
  ],
  explain: {
    id: "ages-13-15-defence-2-explain",
    courseId,
    kind: "explain",
    prompt:
      "Your site asks the visitor for one piece of information and answers back. In your own words, explain how the label is connected to its input and why the reply is written into a paragraph with role status. Write three or four sentences that name each decision and give the reason for it.",
    snippet: `<form id="contact">
  <label for="visitor-name">Your name</label>
  <input id="visitor-name" name="visitor-name" type="text" required>
  <button type="submit">Send</button>
</form>
<p id="status" role="status">Ready</p>`,
    explanation:
      "A good answer says that the for value must match the input's id exactly, because that match is the connection that lets a screen reader announce the field with its name and lets a click on the words move the focus into the field. It says why a placeholder cannot do that job, since it disappears as soon as someone types. It says that role status marks the paragraph as a live region, so a message written into it is announced without moving the visitor's focus. Describing what you saw when you filled the form in with the keyboard alone is strong evidence.",
    objectives: ["ages-13-15-forms-labels", "ages-13-15-quality-accessibility"],
    revision: "ages-13-15-forms-labels",
  },
  predict: {
    id: "ages-13-15-defence-2-predict",
    courseId,
    kind: "predict",
    prompt: "A visitor clicks the words Email address. What happens?",
    snippet: `<label for="contact">Email address</label>
<input id="contact-email" name="contact" type="email">`,
    options: [
      "The input receives the focus, because the label sits directly above it.",
      "The input is filled in with the words Email address.",
      "The form is submitted with an empty value.",
      "Nothing happens, because the for value does not match the input's id.",
    ],
    answer: 3,
    explanation:
      "A label is connected by matching values rather than by position. Here for is contact and the id is contact-email, so no control matches the label and clicking the words does nothing. Making the two values identical repairs it, and then the same click moves the focus into the field and the field is announced with the label as its name.",
    objectives: ["ages-13-15-forms-labels"],
    revision: "ages-13-15-forms-labels",
  },
  change: {
    id: "ages-13-15-defence-2-change",
    courseId,
    kind: "change",
    prompt: "Make one small change to your own site, then use it with the keyboard.",
    snippet: `button { background: var(--accent); color: var(--paper); padding: 0.5rem 1rem; }

/* The focus state has not been styled yet, so the browser default is all there is. */`,
    changeInstruction:
      "In the site you submitted, make the keyboard focus state clearly visible. Add one rule for the focus-visible state of the controls a visitor can reach with the Tab key, and give that rule an outline that stands out against the background.",
    changeRequirement: { kind: "css-focus-visible", file: "css" },
    explanation:
      "A correct change is a rule such as a:focus-visible, button:focus-visible or one rule covering the controls you can reach, with an outline value that is easy to see, for example outline: 3px solid var(--accent). The stylesheet you submit is read for a focus-visible rule that sets an outline, so the rule has to be in the file. Then press Tab through the page and confirm that you can always see where the focus is.",
    objectives: ["ages-13-15-css-system-states", "ages-13-15-quality-accessibility"],
    revision: "ages-13-15-css-system-states",
  },
  escalatedPredict: {
    id: "ages-13-15-defence-2-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt: "Both radio buttons carry the same name, reply-method. What does sharing that name do?",
    snippet: `<fieldset>
  <legend>How should we reply?</legend>
  <label for="reply-call">Phone call</label>
  <input type="radio" id="reply-call" name="reply-method">
  <label for="reply-message">Message</label>
  <input type="radio" id="reply-message" name="reply-method">
</fieldset>`,
    options: [
      "It gives both radio buttons the same value when the form is sent.",
      "It makes the two buttons one choice, so choosing one clears the other.",
      "It groups the buttons for the eye only, and both can be chosen at once.",
      "It connects each radio button to the label beside it.",
    ],
    answer: 1,
    explanation:
      "A shared name is what turns separate radio buttons into one group with a single answer, and the browser clears the earlier choice as soon as another is made. The name carries no value of its own, so each button would still send its own value. Position is not a connection, so each label still needs a for value matching its input, and the fieldset with its legend is what names the shared question.",
    objectives: ["ages-13-15-forms-groups"],
    revision: "ages-13-15-forms-groups",
  },
};

/* ------------------------------------------------- 3. building the page list --- */

const dataDefence: DefenceTemplate = {
  id: "ages-13-15-defence-3",
  courseId,
  objectives: [
    "ages-13-15-data-arrays",
    "ages-13-15-data-foreach",
    "ages-13-15-data-render",
    "ages-13-15-javascript-dom-output",
  ],
  explain: {
    id: "ages-13-15-defence-3-explain",
    courseId,
    kind: "explain",
    prompt:
      "Your project shows a list that is built from its data. In your own words, explain why the records live in an array and one loop builds the list, and why each item's words are set with textContent rather than innerHTML. Write three or four sentences that name each decision and give the reason for it.",
    snippet: `const topics = [
  { title: "About me" },
  { title: "Selected work" },
];

topics.forEach(function (topic) {
  const item = document.createElement("li");
  item.textContent = topic.title;
  topicList.append(item);
});`,
    explanation:
      "A good answer says that the array holds the records in one place, so the same few lines can show any number of them and adding a record needs no new markup. It says that forEach runs the same instruction once per record, and that the callback receives the current record. It says that textContent puts the value in as text, so words inside the data can never be read as markup, which is what keeps the page safe when the data changes. Saying what you saw after adding a fourth record is strong evidence that you tested the rendering yourself.",
    objectives: [
      "ages-13-15-data-arrays",
      "ages-13-15-data-foreach",
      "ages-13-15-data-render",
    ],
    revision: "ages-13-15-data-project",
  },
  predict: {
    id: "ages-13-15-defence-3-predict",
    courseId,
    kind: "predict",
    prompt:
      "The page starts with an empty list element whose id is topic-list. After this code has run, what is on the page?",
    snippet: `const topics = ["About me", "Selected work", "What I am learning"];
const topicList = document.querySelector("#topic-list");

topics.forEach(function (topic) {
  const item = document.createElement("li");
  item.textContent = topic;
  topicList.append(item);
});`,
    options: [
      "Nothing appears, because createElement makes an element in memory only.",
      "One list item that holds all three topics as its text.",
      "Three list items, one for each topic in the array.",
      "Three list items, and each item also repeats the whole array.",
    ],
    answer: 2,
    explanation:
      "forEach runs the function once for every string in the array, so the body runs three times and creates one element each time. createElement does build the element in memory, and append is the step that places it inside the list, which is why the items do appear. The value given to the function is the current topic rather than the whole array, so no item holds all three strings and no item repeats the array.",
    objectives: ["ages-13-15-data-foreach", "ages-13-15-data-render"],
    revision: "ages-13-15-data-foreach",
  },
  change: {
    id: "ages-13-15-defence-3-change",
    courseId,
    kind: "change",
    prompt: "Make one small change to your own site, then reload the page and read it.",
    snippet: `<p id="status" role="status">Ready</p>

<!-- After the list is built, say how many records the page is showing. -->`,
    changeInstruction:
      "In the site you submitted, add one short piece of feedback: once the list has been built, write a sentence into the status paragraph that says how many records the page is showing. Set the words with textContent.",
    changeRequirement: { kind: "js-member-assignment", file: "javascript", property: "textContent" },
    explanation:
      "A correct change writes a sentence into the status element, for example statusText.textContent = \"Showing \" + topics.length + \" records\", so the visitor is told what happened. The JavaScript you submit is read for a textContent assignment on an element, so the line has to be in the file. Because the paragraph already carries role status, the sentence is announced as well as shown, and you can confirm that by reading the page after a reload.",
    objectives: ["ages-13-15-data-arrays", "ages-13-15-javascript-dom-output"],
    revision: "ages-13-15-javascript-dom-output",
  },
  escalatedPredict: {
    id: "ages-13-15-defence-3-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt:
      "The record's title contains angle brackets. What does the list item show once this code has run?",
    snippet: `const record = { title: "<b>About me</b>" };
const item = document.createElement("li");
item.textContent = record.title;`,
    options: [
      "About me in bold, because the angle brackets are read as markup.",
      "Nothing at all, because angle brackets are not allowed inside data.",
      "The characters <b>About me</b>, exactly as they appear in the record.",
      "An empty item, because the record is replaced by its text.",
    ],
    answer: 2,
    explanation:
      "textContent puts the string into the element as plain text, so the angle brackets are shown to the visitor instead of being understood as an instruction. That is exactly why the project sets an item's words this way: data can never become markup. Setting the same string with innerHTML would treat it as markup, and nothing here removes the text or the element.",
    objectives: ["ages-13-15-data-render"],
    revision: "ages-13-15-data-render",
  },
};

export const templates: DefenceTemplate[] = [responsiveDefence, formDefence, dataDefence];