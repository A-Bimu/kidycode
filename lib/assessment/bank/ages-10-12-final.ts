/*
 * Ages 10 to 12: the final Applied Skills Assessment.
 *
 * Three equivalent forms, each marked out of 100: ten knowledge questions of two marks,
 * three debugging tasks of ten marks each, and one unseen independent build of fifty
 * marks. The build carries the mandatory accessibility and privacy checks, so no total
 * can override them, and it is exactly the one-page website brief this course prepares a
 * learner to build.
 *
 * The debugging tasks start from broken code and the requirements name what the repaired
 * version must do, so a learner is never asked to guess what "fixed" means.
 */

import {
  assigns,
  breakpoint,
  buildFinalForms,
  calls,
  decl,
  declaresFunction,
  el,
  focusRing,
  fragmentLink,
  freeOf,
  headingOrder,
  imageAlt,
  js,
  landmarks,
  list,
  type AuthoredBuild,
  type AuthoredFinalForm,
  type FinalIdea,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "ages-10-12" as const;

const ideas: Record<string, FinalIdea> = {
  elements: { slug: "elements", module: "html-foundations", lesson: "elements", difficulty: "foundation", cognitive: "remember" },
  lists: { slug: "lists", module: "html-foundations", lesson: "lists", difficulty: "foundation", cognitive: "apply" },
  links: { slug: "links", module: "html-content", lesson: "links", difficulty: "developing", cognitive: "apply" },
  "image-alt": { slug: "image-alt", module: "html-content", lesson: "images", difficulty: "developing", cognitive: "understand" },
  landmarks: { slug: "landmarks", module: "html-content", lesson: "semantics", difficulty: "developing", cognitive: "apply" },
  "css-rules": { slug: "css-rules", module: "css-foundations", lesson: "rules", difficulty: "foundation", cognitive: "understand" },
  "box-model": { slug: "box-model", module: "css-layout", lesson: "box", difficulty: "developing", cognitive: "understand" },
  "media-query": { slug: "media-query", module: "css-layout", lesson: "responsive", difficulty: "developing", cognitive: "apply" },
  "dom-output": { slug: "dom-output", module: "javascript-foundations", lesson: "output", difficulty: "developing", cognitive: "apply" },
  functions: { slug: "functions", module: "javascript-foundations", lesson: "functions", difficulty: "developing", cognitive: "apply" },
  conditions: { slug: "conditions", module: "javascript-logic", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
  "access-check": { slug: "access-check", module: "quality", lesson: "access", difficulty: "secure", cognitive: "evaluate" },
  "safe-note": { slug: "safe-note", module: "quality", lesson: "sharing", difficulty: "secure", cognitive: "understand" },
};

/* The build brief is the same task in all three forms, because the task is the outcome;
 * what changes between forms is every question and every debugging task. */
const build: AuthoredBuild = {
  idea: "access-check",
  title: "Build a one page website about something you know well",
  brief: "Build a complete one page website for a topic you can explain to somebody else. It needs a clear heading, an introduction, a list of at least three useful points, a working link that jumps to a section, an image that earns its place with useful alternative text, readable styling, a layout that still works on a phone, and one JavaScript interaction that changes something on the page when it is used. Do not put any personal contact or location detail on the page, and finish with a credit that uses a nickname.",
  requirements: [
    ["Semantic regions make the page structure clear", landmarks("header", "main", "footer"), "landmarks"],
    ["One heading names the page and the levels step down", headingOrder(), "elements"],
    ["A list holds at least three points", list(3), "lists"],
    ["A link reaches a section of the page", fragmentLink(), "links"],
    ["The image carries useful alternative text", imageAlt(), "image-alt"],
    ["The text is readable with a comfortable line height", decl("line-height", "line-height"), "css-rules"],
    ["A breakpoint adapts the layout for a narrower screen", breakpoint(600), "media-query"],
    ["One JavaScript interaction responds to the visitor", js("event-listener"), "dom-output"],
    ["Keyboard focus is clearly visible", focusRing(), "access-check", "accessibility" as const],
    ["No personal contact or location detail is on the page", freeOf("personal-contact"), "safe-note", "privacy" as const],
  ],
};

const forms: Record<string, AuthoredFinalForm> = {
  A: {
    knowledge: [
      ["elements", "Which part of a page does an h1 element name?", "The whole page", "One small card", "The stylesheet", "The h1 gives the page its main heading, and lower levels name the sections inside it.", "treats-a-heading-as-a-card|confuses-a-heading-with-a-file"],
      ["lists", "A page shows three books as a list. What does the ul element do here?", "It wraps the whole list that holds the items", "It marks the third item in the list", "It draws the bullets and the spacing", "ul is the container around the items, and each item is an li element inside it.", "treats-the-wrapper-as-an-item|thinks-ul-draws-the-bullets"],
      ["image-alt", "A photograph of a finished model is on the page. What should its description say?", "What the finished model shows", "Which camera the photograph was taken with", "How many pixels the picture file holds", "A description carries what the picture contributes, not the details of the equipment or the file.", "describes-the-camera|describes-the-file-size"],
      ["landmarks", "A page ends with a short credit. Which element wraps it?", "footer", "main", "head", "The footer closes the page with information about it, while main holds the content a visitor came for.", "wraps-the-credit-in-main|confuses-footer-with-head"],
      ["css-rules", "A rule reads .card { padding: 1rem; }. What is 1rem in that rule?", "The value given to the padding property", "The selector that chooses the card", "The name of the stylesheet", "Inside the braces, each declaration pairs a property with the value it is set to.", "confuses-value-and-selector|thinks-a-value-names-a-file"],
      ["media-query", "A rule sits inside @media (min-width: 600px). When does it take effect?", "On screens at least 600 pixels wide", "Only on screens narrower than 600 pixels", "Only when the page is printed", "The condition is read as the smallest width at which the rule applies.", "inverts-the-breakpoint|confuses-media-with-printing"],
      ["dom-output", "What does textContent change?", "The plain words inside an element", "The colour of the element", "The address of the page", "textContent replaces the visible text, which is what a visitor reads.", "expects-a-colour-change|confuses-text-with-the-address"],
      ["conditions", "Two messages are possible, one for an empty list and one for a list with items. What decides which appears?", "The result of a condition that tests the number of items", "The order of the functions in the file", "The colour of the message", "A condition produces a true or false result, and the branches act on it.", "expects-file-order-to-decide|thinks-colour-decides"],
      ["access-check", "Which habit catches missing keyboard support quickly?", "Tab through the page and use every control without a mouse", "Read the stylesheet line by line", "Count how many images the page has", "Using the page with the keyboard alone shows what a mouse hides.", "reads-the-stylesheet-instead|counts-images-instead"],
      ["safe-note", "A page is about a hobby. Which credit is the safest?", "A chosen nickname with the technologies used", "The writer's full name and school", "A phone number for questions", "A credit should show the work without identifying a young person.", "publishes-a-full-name|publishes-contact-detail"],
    ],
    debug: [
      {
        idea: "landmarks",
        title: "Repair the page structure",
        brief: "This page uses plain div elements, skips a heading level, has a link that goes nowhere and an image with no description. Repair the structure so the page reads properly from the top.",
        starter: {
          html: `<div>
  <h1>My weekend club</h1>
  <div><a href="#week">This week</a></div>
</div>
<div id="news">
  <h3>What we did</h3>
  <img src="club.jpg">
  <p>We built a paper crane together.
</div>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["The page uses header, main and footer regions", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading levels step down without gaps", headingOrder(), "elements"],
          ["A link reaches a section that exists on the page", fragmentLink(), "links"],
          ["The image is described in words", imageAlt(), "image-alt"],
          ["The introduction is inside a paragraph", el("p", 2), "elements"],
        ],
      },
      {
        idea: "css-rules",
        title: "Repair the stylesheet",
        brief: "The stylesheet has a declaration with an equals sign where a colon belongs, no box model rule, no breakpoint, a fixed page width and no visible focus. Repair each one.",
        starter: {
          html: `<main class="page"><h1>My weekend club</h1><p>We meet on Saturday.</p><a href="#news">News</a><section id="news">Latest news</section></main>`,
          css: `body { color = #111936; font-size: 16px; }
.page { width: 1200px; }
.card { padding 1rem; border: 2px solid #111936; }
a:hover { color: #ee9d2b; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["A declaration uses a property, a colon and a value", decl("color", "colour"), "css-rules"],
          ["Boxes count their border inside their width", decl("box-sizing", "border-box"), "box-model"],
          ["A breakpoint changes the layout on a narrow screen", breakpoint(600), "media-query"],
          ["The page width follows the screen", decl("max-width", "percentage"), "media-query"],
          ["Keyboard focus is clearly visible", focusRing(), "access-check", "accessibility" as const],
        ],
      },
      {
        idea: "dom-output",
        title: "Repair the JavaScript",
        brief: "The code selects an element that does not exist, never puts anything on the page and compares values with a single equals sign. Repair it so a visitor sees the message.",
        starter: {
          html: `<p id="status">Waiting</p>`,
          css: "",
          javascript: `const statusText = document.querySelector("#stats");
const message = "Waiting";

// Show the message on the page when it is ready.
message == "Ready";`,
        },
        editable: ["javascript", "html"],
        requirements: [
          ["A named function shows the message", declaresFunction(0), "functions"],
          ["A condition chooses between two messages", js("conditional"), "conditions"],
          ["The page text is set from the code", assigns("textContent"), "dom-output"],
          ["An element is selected with a selector that can match", calls("querySelector"), "dom-output"],
          ["A comparison uses three equals signs", js("strict-equality"), "conditions"],
        ],
      },
    ],
    build,
  },
  B: {
    knowledge: [
      ["elements", "A page has a heading and then some sentences. What does the p element mark?", "One paragraph of ordinary text", "The page heading", "A list of points", "The p element marks a paragraph, while a heading uses an h element.", "confuses-paragraph-with-heading|confuses-paragraph-with-a-list"],
      ["lists", "Which pair of tags builds a bulleted list?", "ul around several li elements", "ol around one p element", "li around one ul element", "ul is the list and each li is one item inside it.", "swaps-the-list-and-its-items|uses-paragraphs-for-items"],
      ["image-alt", "Why is a description such as the club logo not useful?", "It names the file rather than what the picture contributes", "It is written in the wrong language", "It is too short to read", "A description earns its place by adding information the words do not already give.", "describes-the-file-name|thinks-length-is-the-problem"],
      ["landmarks", "Why use header, main and footer instead of div elements?", "They tell the browser and assistive technology what each region is for", "The page loads more quickly", "They are needed before CSS works", "A named region carries meaning that a plain div does not.", "expects-a-speed-gain|thinks-css-requires-them"],
      ["css-rules", "Which line is a complete CSS declaration?", "padding: 1rem;", "padding 1rem", "padding = 1rem", "A declaration pairs a property with a value using a colon.", "omits-the-colon|uses-an-equals-sign"],
      ["media-query", "The phone layout shows one column. Where does the wider layout belong?", "Inside a media query that applies from a chosen width", "In a second stylesheet used only by phones", "In the HTML file", "A breakpoint holds the differences, so both layouts live in one stylesheet.", "expects-two-stylesheets|puts-layout-in-markup"],
      ["dom-output", "Why store the selected element in a const?", "The name can be reused without searching the page again", "It stops the element from moving", "It changes the element type", "One lookup with a clear name keeps the code shorter.", "searches-again-every-time|expects-the-element-to-move"],
      ["conditions", "A condition is untrue for the visitor. Which branch runs?", "The else branch", "The if branch", "Both branches together", "if runs when the condition is true, and else carries the alternative.", "expects-the-if-branch|expects-both-branches"],
      ["access-check", "Why test the page with the keyboard?", "Some visitors cannot use a mouse", "The keyboard makes the page faster", "It changes the layout", "Keyboard access is how many people use a page at all.", "thinks-it-is-faster|expects-a-layout-change"],
      ["safe-note", "Which detail should stay off the page?", "A home address or the name of a school", "A nickname you chose", "A description of your topic", "Personal details identify a young person, so they stay out of the page.", "includes-a-school-name|includes-a-home-address"],
    ],
    debug: [
      {
        idea: "landmarks",
        title: "Repair a broken page outline",
        brief: "The page has its content in the right order but the wrong elements, one paragraph is left open and the image repeats the word image in its description. Repair it.",
        starter: {
          html: `<div><h1>Bird watching notes</h1><nav><a href="#birds">Birds</a></nav></div>
<div>
  <h2>Birds</h2>
  <img src="robin.jpg" alt="image">
  <p>We saw a robin.
  <p id="birds">Notes from the field.
</div>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["Header, main and footer are present", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading order steps down without gaps", headingOrder(), "elements"],
          ["A navigation link reaches a section that exists", fragmentLink(), "links"],
          ["The image has alternative text that says something useful", imageAlt(), "image-alt"],
          ["The notes are inside paragraphs", el("p", 2), "elements"],
        ],
      },
      {
        idea: "css-rules",
        title: "Repair the page styling",
        brief: "The stylesheet is missing a colon, has no box model rule, no breakpoint and no maximum width, and the focus state is invisible. Repair it so the page is readable on a small screen and usable with the keyboard.",
        starter: {
          html: `<main class="page"><h1>Bird watching notes</h1><a href="#notes">Notes</a><section id="notes">Field notes</section></main>`,
          css: `.page { width: 1400px; }
body { background #f7f3ea; color: #111936; }
.card { border: 2px solid #111936; }
a:focus { color: #111936; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["A background declaration uses a property and a value", decl("background", "colour"), "css-rules"],
          ["Boxes count their border inside their width", decl("box-sizing", "border-box"), "box-model"],
          ["A breakpoint changes the layout on a narrow screen", breakpoint(600), "media-query"],
          ["The page has a maximum width", decl("max-width", "relative-length"), "media-query"],
          ["Focus is shown with an outline", focusRing(), "access-check", "accessibility" as const],
        ],
      },
      {
        idea: "dom-output",
        title: "Repair the counter",
        brief: "The code counts the notes but never shows the total, uses a comparison that only checks the value loosely and has no function at all. Repair it so the count appears on the page.",
        starter: {
          html: `<p id="notes-total">No notes yet</p>`,
          css: "",
          javascript: `const total = document.querySelector("#notes-total");
let noteCount = 2;

// Show the number of notes on the page.
noteCount == 2;`,
        },
        editable: ["javascript", "html"],
        requirements: [
          ["The count is shown by a named function", declaresFunction(0), "functions"],
          ["A condition decides which message appears", js("conditional"), "conditions"],
          ["The visible text is set from the code", assigns("textContent"), "dom-output"],
          ["An element is found with a selector", calls("querySelector"), "dom-output"],
          ["The comparison uses three equals signs", js("strict-equality"), "conditions"],
        ],
      },
    ],
    build,
  },
  C: {
    knowledge: [
      ["elements", "Which element marks a single item inside a list?", "li", "ul", "p", "li marks one item, and the ul element wraps the items it belongs to.", "swaps-item-and-list|uses-a-paragraph-for-an-item"],
      ["lists", "A page gives three steps in order. Which elements show that?", "ol with li items inside", "ul with li items inside", "p elements in the right order", "An ordered list numbers each step, which a bulleted list does not.", "uses-bullets-for-numbered-steps|uses-paragraphs-for-steps"],
      ["image-alt", "Where does a useful image description belong?", "In the alt value of the img element", "In the title of the page", "In the stylesheet next to the image rule", "The description travels with the element it describes, which is the image itself.", "puts-the-description-in-the-title|puts-it-in-the-stylesheet"],
      ["landmarks", "What is the job of the footer region?", "It closes the page with information about it", "It holds the main content", "It holds the navigation only", "The footer carries the closing information, such as the credit.", "puts-main-content-in-footer|thinks-footer-is-navigation"],
      ["css-rules", "Which of these starts a CSS rule with a selector?", "h1 { }", "color: #111936;", "{ padding: 1rem }", "A rule begins with the selector, and the declaration goes inside the braces.", "confuses-a-rule-with-a-declaration|omits-the-selector"],
      ["media-query", "The page already works at 320 pixels wide. What should a breakpoint add?", "A wider arrangement for screens that have room", "A smaller font for narrow screens", "Fewer sections than before", "A breakpoint adds to the base layout rather than shrinking it.", "shrinks-the-text|removes-sections"],
      ["dom-output", "The selected element turns out to be null. What does that mean?", "The selector did not match anything on the page", "The element has no words in it", "The browser is too old to run the code", "A selector has to match real markup before it can be used.", "expects-empty-text|blames-the-browser"],
      ["conditions", "Which line compares two values instead of storing one?", "total === 3", "total = 3", "let total = 3", "Three equals signs compare, and a single equals sign stores.", "uses-one-equals-to-compare|confuses-storing-with-comparing"],
      ["access-check", "A message appears on the page after a form is sent. Who could miss it?", "Somebody who cannot see that part of the screen, unless the message is announced", "Only somebody with a slow connection", "Nobody, because the page updated itself", "Feedback has to reach everybody, which is why changing messages need to be announced as well as shown.", "blames-the-connection|thinks-updating-is-enough"],
      ["safe-note", "When should the page be checked for personal details?", "Before it is shared with anyone", "After it has been shared", "Only if somebody complains", "The check has to happen before the page leaves your control.", "reviews-after-sharing|waits-for-a-complaint"],
    ],
    debug: [
      {
        idea: "landmarks",
        title: "Repair a page from a template",
        brief: "This template has the content but not the structure: no named regions, a skipping heading level, a list written as one sentence and a link to a section that does not exist. Repair it.",
        starter: {
          html: `<div><h1>My reading list</h1><div><a href="#top">Top</a></div></div>
<div>
  <h3>This month</h3>
  <p>Three books: a mystery, a history and a comic.</p>
</div>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["The page uses header, main and footer regions", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading order steps down without gaps", headingOrder(), "elements"],
          ["The books are listed as list items", list(3), "lists"],
          ["A link reaches a section that exists", fragmentLink(), "links"],
          ["The section holds at least two paragraphs", el("p", 2), "elements"],
        ],
      },
      {
        idea: "css-rules",
        title: "Repair a stylesheet written in a hurry",
        brief: "The declaration uses an equals sign, the page is fixed at a desktop width, there is no breakpoint and the focus state cannot be seen. Repair all four problems.",
        starter: {
          html: `<main class="page"><h1>My reading list</h1><a href="#list">List</a><section id="list">Books</section></main>`,
          css: `.page { width: 1600px; }
h1 { color = #4b1f63; }
body { line-height: 1.6; }
a:focus { outline: none; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["A colour declaration uses a property, a colon and a value", decl("color", "colour"), "css-rules"],
          ["Boxes count their border inside their width", decl("box-sizing", "border-box"), "box-model"],
          ["A breakpoint adapts the layout on a narrow screen", breakpoint(600), "media-query"],
          ["The page width follows the screen", decl("max-width", "percentage"), "media-query"],
          ["The focus state is visible again", focusRing(), "access-check", "accessibility" as const],
        ],
      },
      {
        idea: "dom-output",
        title: "Repair the welcome message",
        brief: "The welcome message never appears: the selector names an element that is not there, there is no function and the comparison uses two equals signs. Repair it.",
        starter: {
          html: `<p id="welcome">No message yet</p>`,
          css: "",
          javascript: `const welcome = document.querySelector("#message");
const visitor = "friend";

// Welcome the visitor on the page.
visitor == "friend";`,
        },
        editable: ["javascript", "html"],
        requirements: [
          ["A named function shows the message", declaresFunction(0), "functions"],
          ["A condition chooses which welcome appears", js("conditional"), "conditions"],
          ["The message is set on the page", assigns("textContent"), "dom-output"],
          ["An element is selected with a selector", calls("querySelector"), "dom-output"],
          ["The comparison uses three equals signs", js("strict-equality"), "conditions"],
        ],
      },
    ],
    build,
  },
};

export const ages10to12Final: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: [],
  finalForms: buildFinalForms(courseId, forms, ideas),
  defence: [],
};
