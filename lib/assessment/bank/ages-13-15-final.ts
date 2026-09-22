/*
 * Ages 13 to 15: Practical Web Development, final applied assessment.
 *
 * Three equivalent final forms, each marked out of one hundred: ten knowledge
 * questions of two marks, three debugging tasks of ten marks and one unseen
 * independent build of fifty marks.
 *
 * Every form covers the same five modules with the same number of questions, and
 * every debugging task starts from its own broken page so the repair can be seen
 * rather than guessed. The build is deliberately unseen: a fresh brief with
 * markable requirements, about half of them about behaviour rather than looks.
 */

import {
  attr,
  avoids,
  assigns,
  breakpoint,
  buildQuestion,
  calls,
  conceptKey,
  decl,
  declaresFunction,
  difficultyProfile,
  documentLanguage,
  el,
  fluidWidth,
  focusRing,
  FORM_VARIANTS,
  FINAL_BUILD_REQUIREMENT_MARK,
  FINAL_DEBUG_REQUIREMENT_MARK,
  FINAL_KNOWLEDGE_MARK,
  fragmentLink,
  freeOf,
  headingOrder,
  imageAlt,
  itemId,
  js,
  labelledControls,
  landmarks,
  lessonFor,
  namedValues,
  readableText,
  statusRegion,
  storage,
  showsMessage,
  usesVar,
  type AuthoredFinalForm,
  type FinalIdea,
  type AuthoredRequirement,
  type Idea,
} from "@/lib/assessment/bank/factory";
import {
  CONTENT_VERSION,
  type CodeFiles,
  type CodeTask,
  type CourseAssessment,
  type FileKey,
  type FinalForm,
  type Requirement,
} from "@/lib/assessment/types";

const courseId = "ages-13-15" as const;

/* One idea per assessed objective, each naming the module whose lesson teaches it. */
const ideas: Record<string, FinalIdea> = {
  "s-landmarks": { slug: "s-landmarks", module: "ages-13-15-structure", lesson: "landmarks", difficulty: "foundation", cognitive: "understand" },
  "s-headings": { slug: "s-headings", module: "ages-13-15-structure", lesson: "headings", difficulty: "foundation", cognitive: "apply" },
  "s-links": { slug: "s-links", module: "ages-13-15-structure", lesson: "links", difficulty: "developing", cognitive: "apply" },
  "s-alt": { slug: "s-alt", module: "ages-13-15-structure", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
  "s-lang": { slug: "s-lang", module: "ages-13-15-structure", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
  "s-structure": { slug: "s-structure", module: "ages-13-15-structure", lesson: "project", difficulty: "developing", cognitive: "apply" },
  "f-labels": { slug: "f-labels", module: "ages-13-15-forms", lesson: "labels", difficulty: "foundation", cognitive: "apply" },
  "f-types": { slug: "f-types", module: "ages-13-15-forms", lesson: "types", difficulty: "developing", cognitive: "apply" },
  "f-groups": { slug: "f-groups", module: "ages-13-15-forms", lesson: "groups", difficulty: "developing", cognitive: "apply" },
  "f-status": { slug: "f-status", module: "ages-13-15-forms", lesson: "messages", difficulty: "developing", cognitive: "understand" },
  "c-tokens": { slug: "c-tokens", module: "ages-13-15-css-system", lesson: "tokens", difficulty: "developing", cognitive: "apply" },
  "c-box": { slug: "c-box", module: "ages-13-15-css-system", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
  "c-focus": { slug: "c-focus", module: "ages-13-15-css-system", lesson: "states", difficulty: "developing", cognitive: "apply" },
  "r-viewport": { slug: "r-viewport", module: "ages-13-15-responsive", lesson: "viewport", difficulty: "developing", cognitive: "apply" },
  "r-grid": { slug: "r-grid", module: "ages-13-15-responsive", lesson: "grid", difficulty: "developing", cognitive: "apply" },
  "r-nav": { slug: "r-nav", module: "ages-13-15-responsive", lesson: "flex", difficulty: "developing", cognitive: "apply" },
  "r-breakpoint": { slug: "r-breakpoint", module: "ages-13-15-responsive", lesson: "media", difficulty: "developing", cognitive: "apply" },
  "j-functions": { slug: "j-functions", module: "ages-13-15-javascript", lesson: "functions", difficulty: "developing", cognitive: "apply" },
  "j-conditions": { slug: "j-conditions", module: "ages-13-15-javascript", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
  "j-output": { slug: "j-output", module: "ages-13-15-javascript", lesson: "dom-output", difficulty: "developing", cognitive: "apply" },
  "d-arrays": { slug: "d-arrays", module: "ages-13-15-data", lesson: "arrays", difficulty: "developing", cognitive: "apply" },
  "d-foreach": { slug: "d-foreach", module: "ages-13-15-data", lesson: "foreach", difficulty: "developing", cognitive: "apply" },
  "d-render": { slug: "d-render", module: "ages-13-15-data", lesson: "render", difficulty: "developing", cognitive: "apply" },
  "d-safe": { slug: "d-safe", module: "ages-13-15-data", lesson: "render", difficulty: "developing", cognitive: "apply" },
  "i-events": { slug: "i-events", module: "ages-13-15-interaction", lesson: "events", difficulty: "developing", cognitive: "apply" },
  "i-validation": { slug: "i-validation", module: "ages-13-15-interaction", lesson: "validation", difficulty: "developing", cognitive: "apply" },
  "i-storage": { slug: "i-storage", module: "ages-13-15-interaction", lesson: "storage", difficulty: "developing", cognitive: "apply" },
  "q-privacy": { slug: "q-privacy", module: "ages-13-15-quality", lesson: "security", difficulty: "secure", cognitive: "understand" },
};

/* -------------------------------------------------------------------- form A ---- */

const formA: AuthoredFinalForm = {
  knowledge: [
    ["s-landmarks", "Why does a large page region need a named element instead of a plain div?", "The named element tells software what the region holds and how to reach it", "It makes the region load before the other content", "It removes the need for a heading inside the region", "A named region carries meaning that a div cannot, so both people and software can navigate the page.", "expects-a-div-to-describe-purpose|thinks-a-landmark-replaces-a-heading"],
    ["s-headings", "What does the heading outline of a long page tell a reader?", "The order and the grouping of the sections below the page title", "The exact width each section will be drawn at", "The order in which the stylesheet rules are applied", "Headings describe structure, so the outline shows how the page is organised before its content is read.", "confuses-the-outline-with-layout|confuses-the-outline-with-css-order"],
    ["f-labels", "Why must a label and its control share matching for and id values?", "The match lets software name the control wherever it appears", "The match makes the form markup shorter", "The match makes the field optional", "Matching values create the programmatic link, so the control is always announced with its own label.", "expects-markup-to-shrink|thinks-the-field-becomes-optional"],
    ["f-status", "What makes a live status region the right place for changing feedback?", "Its updates can be announced without moving the visitor's focus", "It stores the message between visits", "It gives the message a coloured background", "A live region reports a change where it happens, so nobody has to hunt for the message.", "confuses-feedback-with-storage|expects-colour-to-carry-the-message"],
    ["r-viewport", "Why is a fluid page width safer than a fixed pixel width on a phone?", "The content follows the screen instead of spilling past its edge", "The page downloads fewer images", "The text becomes larger on its own", "A fluid width keeps every element inside the visible area, which is what prevents sideways scrolling.", "expects-a-fixed-width-to-fit|expects-automatic-text-scaling"],
    ["r-breakpoint", "What should be true of the rules written inside a media query?", "They describe only what changes at that width", "They repeat every rule from the base stylesheet", "They rewrite the structure of the HTML", "A focused media query shows exactly what the wider layout alters and nothing else.", "repeats-the-whole-stylesheet|changes-the-structure-from-css"],
    ["d-arrays", "Why does one rendering function cope with three records and with thirty?", "The code walks the collection instead of naming each record", "The code makes a copy of itself for every record", "The browser writes the extra markup on its own", "A loop reads the data it is given, so the amount of data never changes the instructions.", "expects-duplicated-instructions|expects-the-browser-to-write-markup"],
    ["d-safe", "What is the danger of putting record text into a page as markup?", "Text that looks like a tag can be treated as one", "The record loses its property names", "The list becomes impossible to sort", "Treating data as markup is how unexpected content reaches the page, so ordinary text belongs in textContent.", "expects-properties-to-be-lost|blames-sorting"],
    ["i-validation", "Why test the trimmed value rather than the raw value of a field?", "A field holding only spaces should count as empty", "Trimming turns the text into a number", "Trimming clears the field for the next visitor", "Whitespace on its own is not a real answer, so the trimmed form is what should be checked.", "expects-a-number-conversion|expects-the-field-to-clear"],
    ["i-storage", "What belongs in a project's saved preference?", "A small harmless choice the interface needs again", "A password the visitor uses elsewhere", "A full personal profile of the visitor", "Saved values stay on the device and are readable, so only harmless preferences belong there.", "stores-secrets|stores-personal-profiles"],
  ],
  debug: [
    {
      idea: "s-landmarks",
      title: "Repair the event page regions",
      brief: "This page was written with div elements where regions belong, the heading levels jump, the picture has no description, the document never states its language and one closing tag is missing. Repair the markup so the page is announced and navigated correctly, and so the link to the programme still works.",
      editable: ["html"],
      starter: {
        html: `<!doctype html>
<html>
  <head><title>Community Events</title></head>
  <body>
    <div class="header">
      <h1>Community Events</h1>
      <nav><a href="#programme">Programme</a></nav>
    </div>
    <div class="main">
      <h3>What is on</h3>
      <img src="hall.jpg">
      <section id="programme"><h2>Programme</h2><p>Sessions and times.</p></section>
  </body>
</html>`,
      },
      requirements: [
        ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "s-landmarks"],
        ["The heading levels step down without a gap", headingOrder(), "s-headings"],
        ["The picture carries useful alternative text", imageAlt(), "s-alt"],
        ["The document states the language it is written in", documentLanguage(), "s-lang"],
        ["A link reaches a section that exists on this page", fragmentLink(), "s-links"],
      ],
    },
    {
      idea: "r-viewport",
      title: "Repair the card layout",
      brief: "The navigation never becomes a row because one declaration is written with an equals sign instead of a colon, the card rule targets the wrong selector so the grid nothing styles, the wider layout has no breakpoint and there is no visible focus state. Repair the stylesheet so the page works from a narrow screen upward and a keyboard user can see where the focus is.",
      editable: ["css"],
      starter: {
        css: `nav {
  display = flex;
  gap: 1rem;
}
.card {
  padding: 1rem;
  border: 2px solid #16204a;
}`,
      },
      requirements: [
        ["The navigation arranges its links in a row", decl("display", "flex", "nav"), "r-nav"],
        ["The cards container is laid out with Grid", decl("display", "grid", ".cards"), "r-grid"],
        ["The card tracks share the available space", decl("grid-template-columns", "fr", ".cards"), "r-grid"],
        ["The layout changes at a useful wider width", breakpoint(600), "r-breakpoint"],
        ["Keyboard focus is clearly visible on the controls", focusRing(), "c-focus"],
      ],
    },
    {
      idea: "j-conditions",
      title: "Repair the availability message",
      brief: "The message is chosen with an equals sign, so the comparison never happens, and the decision is written inline instead of in a named function that takes the number of places. Repair the script so the value is compared properly, a function with a parameter produces the message and the page still shows one of the two expected sentences.",
      editable: ["javascript"],
      starter: {
        javascript: `const statusText = document.querySelector("#status");
const places = 4;

if (places = 0) {
  statusText.textContent = "Waiting list only";
} else {
  statusText.textContent = "Places available";
}`,
      },
      requirements: [
        ["A condition chooses between two outcomes", js("conditional"), "j-conditions"],
        ["The comparison tests equality instead of assigning", js("strict-equality"), "j-conditions"],
        ["A function with a parameter produces the message", declaresFunction(1), "j-functions"],
        ["The message is written onto the page as text", assigns("textContent"), "j-output"],
        ["One of the two expected sentences is shown", showsMessage("Places available", "Waiting list only"), "j-conditions"],
      ],
    },
  ],
  build: {
    idea: "s-structure",
    title: "Unseen build: workshop club page",
    brief: "Build a small site for an after-school workshop club from three empty files. It needs a header with navigation, a main region and a footer, a programme section, a sign-up form in which every control has a connected label and a live status line, a layout that adapts at a wider width with a visible focus state, and a list of workshop records rendered from an array in JavaScript. Save one harmless preference on the device, and keep every value on the page as text.",
    requirements: [
      ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "s-landmarks"],
      ["Every form control has a connected label", labelledControls(), "f-labels", "accessibility"],
      ["A live status region reports the result of the form", statusRegion(), "f-status"],
      ["Keyboard focus is clearly visible in the stylesheet", focusRing(), "c-focus"],
      ["The layout adapts from 600px with a media query", breakpoint(600), "r-breakpoint"],
      ["The workshop records live in an array", js("array-literal"), "d-arrays"],
      ["Every record is processed with forEach", calls("forEach"), "d-foreach"],
      ["A list item is created for each record", js("create-element"), "d-render"],
      ["One harmless preference is saved on the device", storage("setItem"), "i-storage"],
      ["The list is built without assigning innerHTML", avoids("innerhtml-assignment"), "d-safe", "safety"],
    ],
  },
};

/* -------------------------------------------------------------------- form B ---- */

const formB: AuthoredFinalForm = {
  knowledge: [
    ["s-landmarks", "What is the practical gain from building a page out of named regions first?", "Every later style and script has a known structure to attach to", "The page no longer needs any headings", "The regions can no longer be styled afterwards", "Regions give the page a stable skeleton, so later work attaches to something meaningful instead of to anonymous boxes.", "thinks-headings-become-unnecessary|thinks-regions-block-styling"],
    ["s-headings", "A page runs from h1 straight to h4. What has gone wrong?", "A level was skipped, so the outline no longer reads in order", "The h1 is too long to act as a page title", "The page holds too many sections", "Each level should step down by exactly one, otherwise the structure of the page stops being clear.", "blames-the-title-length|blames-the-number-of-sections"],
    ["f-labels", "A control sits in the form with no label at all. What does a screen reader announce?", "The kind of control, without saying what it is for", "The placeholder text as a permanent name", "The nearest heading as the field name", "Without a connected label there is no name for the control, so its purpose is lost.", "trusts-the-placeholder|expects-a-heading-to-be-used"],
    ["f-status", "A result appears in a plain paragraph while focus stays on the submit button. What is missing?", "A live region, so the change is announced where the visitor is", "A larger font size for the result", "A second submit button for the result", "Feedback needs a region that reports its own changes, otherwise the visitor has to go looking for it.", "relies-on-styling|adds-an-extra-control"],
    ["r-viewport", "What does a mobile-first stylesheet take as its starting point?", "The narrowest layout, with wider changes added later", "The widest layout, with narrow changes removed later", "The screen of the device the author happens to own", "Beginning narrow protects the smallest screen and treats everything wider as an enhancement.", "starts-from-the-desktop|starts-from-one-device"],
    ["r-breakpoint", "How do you decide where a breakpoint belongs?", "Where the layout starts to look cramped at that width", "At the width of the most popular phone model", "At a round number that looks tidy in the file", "The content itself shows where it needs more room, and that is where a breakpoint earns its place.", "chooses-by-device-model|chooses-by-tidiness"],
    ["d-arrays", "What does the length property tell a rendering function?", "How many items the collection holds at that moment", "The position of the last item in the collection", "How many properties each record carries", "Length is a count, so the last index is always one less than it.", "confuses-length-with-last-index|confuses-length-with-properties"],
    ["d-safe", "Which property sets visible words without letting them become markup?", "textContent, because the value is always treated as text", "innerHTML, because it accepts longer strings", "append, because it adds the value to the page", "Text content cannot be read as tags, which is exactly what makes it the safe choice for record values.", "expects-innerhtml-to-be-safe|confuses-appending-with-setting-text"],
    ["i-validation", "A visitor submits the form with nothing typed. What should happen?", "A clear message explains what is needed and nothing is saved", "The empty value is saved so the form feels complete", "The page reloads quietly with no message", "Feedback that names the next step is what lets the visitor finish the task.", "saves-empty-values|stays-silent-on-failure"],
    ["i-storage", "What does reading a storage key that was never saved give back?", "A null value, so the code needs a sensible default", "A blank page instead of the previous one", "An error that stops the script", "A missing key returns null, so the interface should fall back to a clear starting value.", "expects-a-broken-page|expects-a-crash"],
  ],
  debug: [
    {
      idea: "f-labels",
      title: "Repair the enquiry form",
      brief: "Two faults were left in this form: the first label points at an id that does not exist and the second label has no for value at all, so neither control is named. The related choices were also never grouped, and there is no region for the result. Repair the markup so every control is labelled, the choices are grouped under one named legend and the page can announce the result.",
      editable: ["html"],
      starter: {
        html: `<form id="enquiry">
  <label for="visitor-name">Your name</label>
  <input id="guest-name" type="text" required>
  <label>Email</label>
  <input id="visitor-email" type="email" required>
  <p>Preferred contact time</p>
  <label><input type="radio" name="slot"> Morning</label>
  <label><input type="radio" name="slot"> Afternoon</label>
  <button type="submit">Send</button>
</form>`,
      },
      requirements: [
        ["Every control has a connected label", labelledControls(), "f-labels"],
        ["The email field uses the email input type", attr("input", "type", undefined, ["email"]), "f-types"],
        ["The related choices sit inside a fieldset", el("fieldset"), "f-groups"],
        ["The group carries a legend that names the question", el("legend"), "f-groups"],
        ["A status region can announce the result", statusRegion(), "f-status"],
      ],
    },
    {
      idea: "r-breakpoint",
      title: "Repair the responsive card grid",
      brief: "The card grid switches to two columns far too early and there is no focus outline for keyboard users. Repair the stylesheet so the narrow layout stays single column until 700px, the wider layout gains its extra track there, and a keyboard user can see where the focus sits. Keep the fluid page width and the Grid layout that already work.",
      editable: ["css"],
      starter: {
        css: `.page {
  width: min(100% - 2rem, 70rem);
  margin: 0 auto;
}
.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 480px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}`,
      },
      requirements: [
        ["The page width stays tied to the screen", fluidWidth(), "r-viewport"],
        ["The cards container uses Grid", decl("display", "grid", ".cards"), "r-grid"],
        ["The card tracks are flexible", decl("grid-template-columns", "fr", ".cards"), "r-grid"],
        ["The layout changes from 700px upward", breakpoint(700), "r-breakpoint"],
        ["Keyboard focus is clearly visible", focusRing(), "c-focus"],
      ],
    },
    {
      idea: "d-safe",
      title: "Repair the record list",
      brief: "The list is built by writing a tag and the record text into the page as markup, which is not a safe way to show data. Repair the script so each record becomes a real list item whose text is set with textContent, while the loop and the array keep working exactly as they do now.",
      editable: ["javascript"],
      starter: {
        javascript: `const list = document.querySelector("#topic-list");
const topics = [
  { title: "Booking" },
  { title: "Programme" },
];

topics.forEach(function (topic) {
  const item = document.createElement("li");
  item.innerHTML = topic.title;
  list.append(item);
});`,
      },
      requirements: [
        ["The records live in an array", js("array-literal"), "d-arrays"],
        ["Every record is processed in turn", calls("forEach"), "d-foreach"],
        ["A list item is created for each record", js("create-element"), "d-render"],
        ["Each record's text is set with textContent", assigns("textContent"), "d-safe"],
        ["The list is built without assigning innerHTML", avoids("innerhtml-assignment"), "d-safe"],
      ],
    },
  ],
  build: {
    idea: "i-storage",
    title: "Unseen build: library hold request page",
    brief: "Build a small site for a school library hold service from three empty files. It needs a header with navigation, a main region and a footer, an availability section, a hold request form in which every control has a connected label and a live status line, a layout that adapts at a wider width with a visible focus state, and a list of book records rendered from JavaScript when the form is submitted. Save one harmless preference on the device and publish no personal contact detail anywhere on the page.",
    requirements: [
      ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "s-landmarks"],
      ["Every form control has a connected label", labelledControls(), "f-labels", "accessibility"],
      ["A live status region reports the outcome", statusRegion(), "f-status"],
      ["Keyboard focus is clearly visible in the stylesheet", focusRing(), "c-focus"],
      ["The layout adapts from 600px with a media query", breakpoint(600), "r-breakpoint"],
      ["The book records are stored in an array", js("array-literal"), "d-arrays"],
      ["Every record is processed with forEach", calls("forEach"), "d-foreach"],
      ["The visible text is written with textContent", assigns("textContent"), "d-render"],
      ["The form responds to the submit event", js("event-listener"), "i-events"],
      ["No personal contact detail is published on the page", freeOf("personal-contact"), "q-privacy", "privacy"],
    ],
  },
};

/* -------------------------------------------------------------------- form C ---- */

const formC: AuthoredFinalForm = {
  knowledge: [
    ["s-landmarks", "Why is an anonymous div a weak substitute for a named region?", "It says nothing about the job of the content inside it", "It cannot hold other elements inside it", "It cannot receive any styles at all", "A div carries no meaning, so neither a reader nor assistive software learns anything from the structure.", "thinks-divs-cannot-nest|thinks-divs-cannot-be-styled"],
    ["s-headings", "Only the headings of a page are read out loud. What should that short list convey?", "How the page is organised and in what order its sections come", "The colours that were chosen for each section", "The file each section is stored in", "The heading list acts as a table of contents, so it has to describe the structure of the page.", "expects-styling-in-the-outline|expects-file-paths-in-the-outline"],
    ["f-labels", "Why is a placeholder a poor substitute for a label?", "It disappears as soon as the visitor begins to type", "It cannot be styled by the stylesheet", "It is always longer than a label", "A name has to stay visible for as long as the field is in use, and many placeholders vanish the moment they are needed.", "uses-placeholder-as-label|thinks-placeholders-cannot-be-styled"],
    ["f-status", "Why is a colour change on its own not enough to report a result?", "Some visitors cannot tell the two colours apart", "Colour cannot be set from a stylesheet", "Colour makes the page load more slowly", "Every result needs words as well, so the message never depends on seeing a colour change.", "relies-on-colour|thinks-colour-is-unsupported"],
    ["r-viewport", "What is the surest sign that a layout is too wide for a phone?", "The page scrolls sideways when it should not", "The heading text wraps onto two lines", "One list becomes taller than the others", "Sideways scrolling means content is wider than the screen, which is the classic phone layout failure.", "accepts-horizontal-scrolling|confuses-wrapping-with-overflow"],
    ["r-breakpoint", "What stays the same at every screen width?", "The meaning of the content and the actions that are available", "The exact number of columns in the grid", "The exact spacing between every element", "Responsive design rearranges a page; it never removes an action or changes what the words mean.", "removes-actions-at-narrow-widths|fixes-the-spacing"],
    ["d-arrays", "Why give every record in an array the same property names?", "One function can then read every record in the same way", "The array sorts itself into order automatically", "The records take up less room when stored", "A consistent shape is what allows a single piece of code to handle the whole collection.", "expects-automatic-sorting|confuses-consistency-with-size"],
    ["d-safe", "Why create a real element per record instead of joining markup text together?", "The record's value stays data instead of becoming part of the markup", "It removes the need for a list element", "It always takes fewer lines to write", "Creating an element keeps the boundary between data and markup, which is what keeps the page safe.", "thinks-the-list-element-becomes-optional|judges-by-shortness"],
    ["i-validation", "What protects a stored value when a visitor turns off the browser's own form checks?", "Validation on the server, which the visitor cannot switch off", "Nothing further, because the browser can be trusted", "A rule written in the stylesheet", "Client checks are there to help the visitor, but only a server check can be relied on.", "trusts-the-client-alone|expects-css-to-validate"],
    ["i-storage", "Why use a project-specific storage key instead of a generic one?", "It keeps this project's value separate from other pages on the device", "It encrypts the saved value", "It allows much larger values to be saved", "A specific key avoids collisions with anything else that uses storage on the same device.", "expects-encryption|expects-more-capacity"],
  ],
  debug: [
    {
      idea: "s-headings",
      title: "Repair the page outline",
      brief: "The outline of this page is broken: it starts with a second level heading, the page title sits halfway down the document, one level is skipped and the document never states its language. Repair the markup so a reader can follow the outline in order, while the picture, the regions and the link to the equipment section keep working.",
      editable: ["html"],
      starter: {
        html: `<!doctype html>
<html>
  <head><title>Workshop Hub</title></head>
  <body>
    <header><h2>Workshop Hub</h2></header>
    <main>
      <h1>Session details</h1>
      <h4>Equipment</h4>
      <img src="desk.jpg" alt="Room with desks set out for a workshop">
      <a href="#equipment">Equipment list</a>
      <section id="equipment"><h2>Equipment</h2><p>What to bring.</p></section>
    </main>
    <footer><p>Updated today.</p></footer>
  </body>
</html>`,
      },
      requirements: [
        ["One h1 names the page and the levels step down", headingOrder(), "s-headings"],
        ["The document states the language it is written in", documentLanguage(), "s-lang"],
        ["A link reaches a section that exists on this page", fragmentLink(), "s-links"],
        ["The picture carries useful alternative text", imageAlt(), "s-alt"],
        ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "s-landmarks"],
      ],
    },
    {
      idea: "c-tokens",
      title: "Repair the design values",
      brief: "The stylesheet names only two design values, it never sets border-box sizing and there is no visible focus state, so the page is harder to keep consistent and harder to use with a keyboard. Repair it so at least three named values exist, the rules keep using them, boxes include their border in their width and keyboard focus is clearly visible.",
      editable: ["css"],
      starter: {
        css: `:root {
  --ink: #16204a;
  --paper: #f7f3ea;
}
body {
  color: var(--ink);
  background: var(--paper);
  font-size: 1rem;
  line-height: 1.6;
}
.panel {
  padding: 1rem;
  border: 2px solid #16204a;
}`,
      },
      requirements: [
        ["At least three design values are named", namedValues(3), "c-tokens"],
        ["The rules refer to the named values", usesVar(2), "c-tokens"],
        ["Boxes count their border inside their width", decl("box-sizing", "border-box"), "c-box"],
        ["The page text has a readable size or line height", readableText(), "c-box"],
        ["Keyboard focus is clearly visible", focusRing(), "c-focus"],
      ],
    },
    {
      idea: "i-storage",
      title: "Repair the saved name",
      brief: "The form saves whatever is in the field, including spaces alone, and it never checks that anything was typed. Repair the script so the value is trimmed before it is used, an empty value is refused with a message of its own, and a real value is saved and confirmed.",
      editable: ["javascript"],
      starter: {
        javascript: `const form = document.querySelector("#contact");
const nameInput = document.querySelector("#visitor-name");
const statusText = document.querySelector("#status");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const visitorName = nameInput.value;
  localStorage.setItem("project-visitor-name", visitorName);
  statusText.textContent = "Saved";
});`,
      },
      requirements: [
        ["The submission is handled without reloading the page", js("event-listener"), "i-events"],
        ["The default page reload is prevented", js("prevent-default"), "i-events"],
        ["The value is trimmed before it is checked", calls("trim"), "i-validation"],
        ["A harmless preference is saved on the device", storage("setItem"), "i-storage"],
        ["A message is shown to the visitor", showsMessage("Saved", "Please enter a name"), "i-storage"],
      ],
    },
  ],
  build: {
    idea: "d-render",
    title: "Unseen build: repair cafe booking page",
    brief: "Build a small site for a weekend repair cafe from three empty files. It needs a header with navigation, a main region and a footer, a repairs section, a booking form in which every control has a connected label and a live status line, a layout that adapts at a wider width with a visible focus state, and a list of repair records rendered from an array in JavaScript with every value written as text. Keep the rendered list free of any markup assignment.",
    requirements: [
      ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "s-landmarks"],
      ["A section groups the repairs information", el("section"), "s-structure"],
      ["Every form control has a connected label", labelledControls(), "f-labels", "accessibility"],
      ["A live status region reports the outcome", statusRegion(), "f-status"],
      ["Keyboard focus is clearly visible in the stylesheet", focusRing(), "c-focus"],
      ["The layout adapts from 600px with a media query", breakpoint(600), "r-breakpoint"],
      ["The repair records are stored in an array", js("array-literal"), "d-arrays"],
      ["Every record is processed with forEach", calls("forEach"), "d-foreach"],
      ["The visible text is written with textContent", assigns("textContent"), "d-render"],
      ["The list is built without assigning innerHTML", avoids("innerhtml-assignment"), "d-safe", "safety"],
    ],
  },
};

const forms: Record<string, AuthoredFinalForm> = { A: formA, B: formB, C: formC };

/*
 * The final forms are assembled here from the same factory building blocks the module
 * bank uses. The factory's own final builder hands the lesson resolver a pseudo module
 * id of the form `<module>-final`, which no stage of the catalogue carries, so it
 * cannot resolve a lesson. The lesson is therefore resolved from the idea's real
 * module, while every identifier, mark and requirement keeps the factory convention.
 */

function lessonIdOf(idea: FinalIdea): string {
  return lessonFor(courseId, idea.module, idea.lesson).id;
}

function lessonIdForIdea(ideaSlug: string): string {
  const idea = ideas[ideaSlug];
  if (!idea) throw new Error(`Unknown final idea ${ideaSlug}.`);
  return lessonIdOf(idea);
}

function debugRequirements(
  variant: string,
  spec: AuthoredFinalForm["debug"][number],
  idea: FinalIdea,
  index: number,
): Requirement[] {
  return spec.requirements.map((entry: AuthoredRequirement, position: number) => {
    const [label, check, ideaSlug, mandatory] = entry;
    const requirementIdea = ideas[ideaSlug];
    if (!requirementIdea) throw new Error(`Unknown requirement idea ${ideaSlug} in final ${variant}.`);
    return {
      id: `${itemId(courseId, `${idea.module}-final`, variant, "d", index + 1)}-r${position + 1}`,
      label: label.trim(),
      marks: FINAL_DEBUG_REQUIREMENT_MARK,
      check,
      concept: conceptKey(courseId, requirementIdea.module, ideaSlug),
      revision: lessonIdForIdea(ideaSlug),
      ...(mandatory ? { mandatory } : {}),
    };
  });
}

function buildRequirements(
  variant: string,
  spec: AuthoredFinalForm["build"],
  idea: FinalIdea,
): Requirement[] {
  return spec.requirements.map((entry: AuthoredRequirement, position: number) => {
    const [label, check, ideaSlug, mandatory] = entry;
    const requirementIdea = ideas[ideaSlug];
    if (!requirementIdea) throw new Error(`Unknown build requirement idea ${ideaSlug} in final ${variant}.`);
    return {
      id: `${itemId(courseId, `${idea.module}-final`, variant, "b", 1)}-r${position + 1}`,
      label: label.trim(),
      marks: FINAL_BUILD_REQUIREMENT_MARK,
      check,
      concept: conceptKey(courseId, requirementIdea.module, ideaSlug),
      revision: lessonIdForIdea(ideaSlug),
      ...(mandatory ? { mandatory } : {}),
    };
  });
}

function assembleFinalForms(): FinalForm[] {
  const built: FinalForm[] = [];
  for (const variant of FORM_VARIANTS) {
    const form = forms[variant];
    if (!form) throw new Error(`${courseId} has no final form ${variant}.`);

    const knowledge = form.knowledge.map((spec, index) => {
      const idea = ideas[spec[0]];
      if (!idea) throw new Error(`Unknown final idea ${spec[0]} in form ${variant}.`);
      const lesson = lessonIdOf(idea);
      const shim: Record<string, Idea> = {
        [spec[0]]: { slug: spec[0], lesson: idea.lesson, difficulty: idea.difficulty, cognitive: idea.cognitive },
      };
      const base = buildQuestion(courseId, idea.module, variant, index + 1, spec, shim, FINAL_KNOWLEDGE_MARK);
      return {
        ...base,
        id: itemId(courseId, `${idea.module}-final`, variant, "k", index + 1),
        moduleId: idea.module,
        objective: lesson,
        revision: lesson,
      };
    });

    const debug: CodeTask[] = form.debug.map((spec, index) => {
      const idea = ideas[spec.idea];
      if (!idea) throw new Error(`Unknown final idea ${spec.idea} in form ${variant}.`);
      const lesson = lessonIdOf(idea);
      const requirements = debugRequirements(variant, spec, idea, index);
      const starter: CodeFiles = {
        html: spec.starter.html ?? "",
        css: spec.starter.css ?? "",
        javascript: spec.starter.javascript ?? "",
      };
      return {
        id: itemId(courseId, `${idea.module}-final`, variant, "d", index + 1),
        version: CONTENT_VERSION,
        courseId,
        moduleId: idea.module,
        formVariant: variant,
        type: "debug" as const,
        title: spec.title.trim(),
        brief: spec.brief.trim(),
        objective: lesson,
        concept: conceptKey(courseId, idea.module, spec.idea),
        difficulty: idea.difficulty,
        cognitive: "analyse" as const,
        marks: requirements.reduce((total, requirement) => total + requirement.marks, 0),
        editableFiles: spec.editable ?? (["html", "css", "javascript"] as FileKey[]),
        starterFiles: starter,
        requirements,
        revision: lesson,
        allowedSkills: ["HTML", "CSS", "JavaScript"],
      };
    });

    const buildIdea = ideas[form.build.idea];
    if (!buildIdea) throw new Error(`Unknown build idea ${form.build.idea} in final ${variant}.`);
    const buildReq = buildRequirements(variant, form.build, buildIdea);
    const build: CodeTask = {
      id: itemId(courseId, `${buildIdea.module}-final`, variant, "b", 1),
      version: CONTENT_VERSION,
      courseId,
      moduleId: buildIdea.module,
      formVariant: variant,
      type: "build" as const,
      title: form.build.title.trim(),
      brief: form.build.brief.trim(),
      objective: lessonIdOf(buildIdea),
      concept: conceptKey(courseId, buildIdea.module, form.build.idea),
      difficulty: "secure",
      cognitive: "evaluate",
      marks: buildReq.reduce((total, requirement) => total + requirement.marks, 0),
      editableFiles: form.build.editable ?? (["html", "css", "javascript"] as FileKey[]),
      starterFiles: { html: "", css: "", javascript: "" },
      requirements: buildReq,
      revision: lessonIdOf(buildIdea),
      allowedSkills: ["HTML", "CSS", "JavaScript"],
    };

    built.push({
      id: `${courseId}-final-form-${variant}`,
      courseId,
      variant,
      knowledge,
      debug,
      build,
      difficultyProfile: difficultyProfile([...knowledge, ...debug, build]),
      objectives: [...new Set([...knowledge.map((item) => item.objective), ...debug.map((task) => task.objective)])].sort(),
    });
  }
  return built;
}

export const ages13to15Final: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  /* The module bank lives in ages-13-15.ts and is merged by the manifest. */
  moduleForms: [],
  finalForms: assembleFinalForms(),
  defence: [],
};
