/*
 * Adults: Web Skills for Work and Business, the final Applied Skills Assessment.
 *
 * Three equivalent forms, each marked out of 100: ten knowledge questions of two marks,
 * three debugging tasks of ten marks each, and one unseen independent build of fifty
 * marks. The build carries the mandatory accessibility and privacy checks, so a strong
 * total can never override them.
 *
 * Every idea names the module whose lesson teaches it, so a final item is still
 * traceable to real teaching. Each form carries the same ten objectives, the same
 * module coverage and the same shape; what changes between forms is every question,
 * every debugging task and the client brief of the build.
 *
 * The tone is professional throughout: purpose, audience, services, calls to action,
 * testing evidence and handover notes, written as one adult professional would write to
 * another. Nothing here is written for a child.
 */

import {
  assigns,
  attr,
  avoids,
  breakpoint,
  buildFinalForms,
  calls,
  decl,
  documentMeta,
  el,
  fluidWidth,
  focusRing,
  freeOf,
  gridTracks,
  imageAlt,
  js,
  labelledControls,
  landmarks,
  list,
  statusRegion,
  type AuthoredFinalForm,
  type FinalIdea,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "adults" as const;

/* One idea per assessed objective, each naming the module whose lesson teaches it. */
const ideas: Record<string, FinalIdea> = {
  /* Module 1: meaningful HTML structure. */
  "semantic-regions": { slug: "semantic-regions", module: "adults-structure", lesson: "landmarks", difficulty: "foundation", cognitive: "understand" },
  "heading-outline": { slug: "heading-outline", module: "adults-structure", lesson: "headings", difficulty: "foundation", cognitive: "apply" },
  "section-links": { slug: "section-links", module: "adults-structure", lesson: "links", difficulty: "developing", cognitive: "apply" },
  "image-alternative": { slug: "image-alternative", module: "adults-structure", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
  "page-metadata": { slug: "page-metadata", module: "adults-structure", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
  /* Module 2: accessible forms. */
  "label-connection": { slug: "label-connection", module: "adults-forms", lesson: "labels", difficulty: "developing", cognitive: "understand" },
  "control-types": { slug: "control-types", module: "adults-forms", lesson: "types", difficulty: "developing", cognitive: "apply" },
  "grouped-choice": { slug: "grouped-choice", module: "adults-forms", lesson: "groups", difficulty: "developing", cognitive: "understand" },
  "live-feedback": { slug: "live-feedback", module: "adults-forms", lesson: "messages", difficulty: "developing", cognitive: "apply" },
  /* Module 3: a consistent CSS system. */
  "design-tokens": { slug: "design-tokens", module: "adults-css-system", lesson: "tokens", difficulty: "developing", cognitive: "apply" },
  "interaction-states": { slug: "interaction-states", module: "adults-css-system", lesson: "states", difficulty: "secure", cognitive: "apply" },
  "box-spacing": { slug: "box-spacing", module: "adults-css-system", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
  /* Module 4: responsive layouts. */
  "flexible-layout": { slug: "flexible-layout", module: "adults-responsive", lesson: "viewport", difficulty: "developing", cognitive: "apply" },
  "card-grid": { slug: "card-grid", module: "adults-responsive", lesson: "grid", difficulty: "developing", cognitive: "apply" },
  "layout-breakpoint": { slug: "layout-breakpoint", module: "adults-responsive", lesson: "media", difficulty: "developing", cognitive: "apply" },
  /* Module 5: JavaScript decisions. */
  "named-functions": { slug: "named-functions", module: "adults-javascript", lesson: "functions", difficulty: "developing", cognitive: "apply" },
  "safe-output": { slug: "safe-output", module: "adults-javascript", lesson: "dom-output", difficulty: "developing", cognitive: "apply" },
  "branch-decisions": { slug: "branch-decisions", module: "adults-javascript", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
  /* Module 6: structured data. */
  "record-shape": { slug: "record-shape", module: "adults-data", lesson: "objects", difficulty: "developing", cognitive: "understand" },
  "each-record": { slug: "each-record", module: "adults-data", lesson: "foreach", difficulty: "developing", cognitive: "apply" },
  /* Module 7: DOM, forms and browser storage. */
  "element-selection": { slug: "element-selection", module: "adults-interaction", lesson: "select", difficulty: "developing", cognitive: "apply" },
  "submit-events": { slug: "submit-events", module: "adults-interaction", lesson: "events", difficulty: "developing", cognitive: "apply" },
  "input-validation": { slug: "input-validation", module: "adults-interaction", lesson: "validation", difficulty: "secure", cognitive: "analyse" },
  "saved-preference": { slug: "saved-preference", module: "adults-interaction", lesson: "storage", difficulty: "developing", cognitive: "apply" },
  /* Module 8: test, protect and release. */
  "fault-evidence": { slug: "fault-evidence", module: "adults-quality", lesson: "debug", difficulty: "secure", cognitive: "analyse" },
  "keyboard-access": { slug: "keyboard-access", module: "adults-quality", lesson: "accessibility", difficulty: "secure", cognitive: "evaluate" },
  "private-detail": { slug: "private-detail", module: "adults-quality", lesson: "security", difficulty: "secure", cognitive: "understand" },
  "handover-notes": { slug: "handover-notes", module: "adults-quality", lesson: "release", difficulty: "developing", cognitive: "understand" },
  "tested-release": { slug: "tested-release", module: "adults-quality", lesson: "project", difficulty: "advanced", cognitive: "evaluate" },
};

/*
 * The ten build requirements are the same professional spine in all three forms, because
 * the task is the outcome. Only the client brief changes between forms.
 */
const buildRequirements: AuthoredFinalForm["build"]["requirements"] = [
  ["The page opens with header, navigation, main and footer regions", landmarks("header", "nav", "main", "footer"), "semantic-regions"],
  ["The handover notes list at least three tested items", list(3), "handover-notes"],
  ["Every enquiry form control has a connected label", labelledControls(), "label-connection", "accessibility"],
  ["The enquiry feedback can be announced without moving focus", statusRegion(), "live-feedback"],
  ["The enquiry value is checked before it is accepted", calls("trim"), "input-validation"],
  ["The page responds when the enquiry is sent", js("event-listener"), "submit-events"],
  ["The wider arrangement arrives at a 700 pixel breakpoint", breakpoint(700), "layout-breakpoint"],
  ["The document carries a specific title and a responsive viewport", documentMeta(), "page-metadata"],
  ["The document carries a meta description for search results", attr("meta", "name", undefined, ["description"]), "page-metadata"],
  ["The page publishes no personal contact detail", freeOf("personal-contact"), "private-detail", "privacy"],
];

const forms: Record<string, AuthoredFinalForm> = {
  /* ------------------------------------------------------------------------ A --- */
  A: {
    knowledge: [
      ["semantic-regions", "A client asks why each page region should be named rather than left as a plain div. What is the strongest reason?", "Named regions tell the browser and assistive technology what each part of the page is for", "Named regions make the page download more quickly", "Named regions are needed before CSS can be applied", "A landmark names the job of a region, so a visitor using assistive technology can move straight to the navigation or the main content.", "expects-a-speed-gain|thinks-markup-needs-css-first"],
      ["label-connection", "Support reports that a form field is read aloud without its name. What is the repair?", "Give the field an id and set the matching for value on its label", "Make the label text bolder", "Move the label closer to the field", "A connected label is announced together with its control, so the field is never read out unnamed.", "tries-stronger-styling|relies-on-position"],
      ["design-tokens", "A client asks for one shade to change across the whole site next month. What makes that request cheap to fulfil?", "Every shade is defined once as a named value and reused", "Every rule writes the shade out by hand", "The shade is set on one element only", "A named value changes in one place, so the whole site follows without a search through every rule.", "writes-values-by-hand|sets-one-element-only"],
      ["interaction-states", "A client loses track of the selected button while completing the enquiry form with the keyboard. What is missing?", "A visible focus state on each interactive control", "A stronger background colour on hover", "A larger submit button", "Focus shows where the keyboard is, so every interactive control must make it clearly visible.", "relies-on-hover|resizes-the-control"],
      ["layout-breakpoint", "When should a breakpoint be added to a client site?", "When the content itself starts to feel cramped at that width", "Once for every device model on the market", "Only when the client asks for one", "The content decides where it needs more room, so a breakpoint is placed at a real pressure point.", "picks-by-device-model|waits-for-a-request"],
      ["named-functions", "The same calculation is copied into three places. What is the professional repair?", "Give the calculation one named function and call it where it is needed", "Copy it a fourth time for safety", "Move the calculation into the stylesheet", "One named job can be called wherever it is needed, so a later change happens in one place.", "keeps-copying|moves-logic-to-css"],
      ["safe-output", "A script builds a list of client reviews. Why is textContent safer than innerHTML for the review text?", "The text is inserted as words rather than being read as markup", "It loads the review more quickly", "It saves the review for the next visit", "Review text is treated as words, so nothing a visitor can type becomes part of the page structure.", "expects-a-speed-gain|expects-permanent-storage"],
      ["record-shape", "The service list has to change whenever the client adds an offer. What keeps that task small?", "The services live as records and one rendering step displays them", "Each service is typed into the markup by hand", "The services are stored in the stylesheet", "Data plus one rendering step means a new record appears without editing the markup.", "hand-edits-every-item|stores-data-in-css"],
      ["saved-preference", "A client wants the visitor's chosen office remembered on a return visit. What should be stored?", "The chosen office only, as a small non-sensitive value", "The whole enquiry including contact detail", "The visitor account password", "The interface needs the smallest non-sensitive value, which protects the visitor and keeps the code simple.", "stores-private-detail|stores-a-secret"],
      ["private-detail", "A client asks for a personal mobile number on the public contact page. What is the professional response?", "Offer a general contact route and keep personal detail off the page", "Publish the number because the client asked", "Publish it inside an image so the text cannot be read", "Protecting personal detail is part of the service, and a general route still lets visitors make contact.", "publishes-on-request|hides-it-in-an-image"],
    ],
    debug: [
      {
        idea: "label-connection",
        title: "Repair the enquiry form that leaves its fields unnamed",
        brief: "This booking enquiry form was published last week. Assistive technology reads the two fields without their labels, neither field states what kind of value it expects, the required field is not marked and a visitor who sends the form sees the page reload with no confirmation at all. Repair the markup so each control carries a connected label, the fields declare their type, the required field is marked and the result can be announced.",
        starter: {
          html: `<h1>Booking enquiry</h1>
<form id="booking-enquiry">
  <label>Company</label>
  <input name="company">
  <label>Contact email</label>
  <input name="contact-email">
  <button type="submit">Send enquiry</button>
</form>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["Every form control has a connected label", labelledControls(), "label-connection"],
          ["Each field declares the kind of value it expects", attr("input", "type"), "control-types"],
          ["The field that must be completed is marked as required", attr("input", "required"), "control-types"],
          ["The feedback can be announced without moving focus", statusRegion(), "live-feedback"],
          ["The enquiry form is present and can be sent", el("form"), "label-connection"],
        ],
      },
      {
        idea: "flexible-layout",
        title: "Repair the page that never fits the screen",
        brief: "The services page was built at a fixed desktop width. On a phone the visitor has to scroll sideways to read it, the navigation never arranges itself as a row, and the service cards keep a fixed width instead of sharing the space. Repair the stylesheet so the body width follows the screen, the navigation is a flexible row, the cards use flexible grid columns spaced with a gap, and a breakpoint gives wider screens the multi-column arrangement.",
        starter: {
          html: `<header>
  <nav><a href="#services">Services</a></nav>
</header>
<main>
  <h1>Fast Ledger services</h1>
  <section id="services" class="cards">
    <article class="card"><h2>Bookkeeping</h2><p>Monthly records kept tidy.</p></article>
    <article class="card"><h2>Payroll</h2><p>Wages and payslips prepared.</p></article>
    <article class="card"><h2>Tax</h2><p>Returns prepared on time.</p></article>
  </section>
</main>
<footer><p>Prepared by the studio.</p></footer>`,
          css: `body { width: 1080px; margin: 0 auto; font-family: Arial, sans-serif; color: #1b1b1b; }
nav { display: block; }
nav a { color: #1b1b1b; }
.cards { display: block; }
.card { width: 320px; margin: 12px 0; padding: 16px; border: 1px solid #dddddd; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["The page width follows the space the browser gives it", fluidWidth(), "flexible-layout"],
          ["The navigation is arranged as a flexible row", decl("display", "flex", "nav"), "flexible-layout"],
          ["The cards use flexible grid columns", decl("grid-template-columns", "fr", ".cards"), "card-grid"],
          ["The card grid is spaced with a gap", decl("gap", "gap", ".cards"), "card-grid"],
          ["A breakpoint changes the layout on a wider screen", breakpoint(700), "layout-breakpoint"],
        ],
      },
      {
        idea: "private-detail",
        title: "Repair the quote panel and the published contact detail",
        brief: "The quote panel is filled by a script that writes markup with innerHTML, so the figure is treated as code and the panel shows the tags as text. The page also publishes a personal email address as the way to ask a question. Repair the script so it selects the panel it updates and writes the message as text rather than markup, keep the decision that chooses the message, and remove the personal contact detail from the page.",
        starter: {
          html: `<h1>Quote estimate</h1>
<p>Questions? Write to amina@fastbooks.example</p>
<p id="quote-panel">Quote pending</p>`,
          css: "",
          javascript: `const price = 420;
const quotePanel = document.querySelector("#quote-panel");

if (price > 0) {
  quotePanel.innerHTML = "<strong>Your quote is " + price + "</strong>";
} else {
  quotePanel.innerHTML = "<strong>Ask us for a quote</strong>";
}`,
        },
        editable: ["javascript", "html"],
        requirements: [
          ["The repaired script selects the element it updates", calls("querySelector"), "element-selection"],
          ["The message is written to the page as text", assigns("textContent"), "safe-output"],
          ["No value is written to the page as markup", avoids("innerhtml-assignment"), "safe-output"],
          ["The script still decides which message to show", js("conditional"), "branch-decisions"],
          ["The page publishes no personal contact detail", freeOf("personal-contact"), "private-detail"],
        ],
      },
    ],
    build: {
      idea: "tested-release",
      title: "Build the site for a small bookkeeping practice",
      brief: "An unseen client brief. Build a complete one page website for a small bookkeeping practice from the three files you write. The page opens with the purpose and the audience, lists the services on offer, and gives the visitor a clear call to action. It carries a labelled enquiry form that is checked before it is accepted and reports back in a region that can be announced, a layout that keeps a fluid width and reaches its wider arrangement from 700 pixels, and one JavaScript behaviour that responds when the enquiry is sent. The document carries a specific title, a responsive viewport and a meta description for search results. Finish with handover notes that list at least three tested items, and publish no personal contact detail on the page.",
      requirements: buildRequirements,
    },
  },

  /* ------------------------------------------------------------------------ B --- */
  B: {
    knowledge: [
      ["semantic-regions", "Which region holds the content that is unique to one page of a client site?", "The main region", "The header region", "The footer region", "Main marks the primary content, so a visitor using assistive technology can skip the repeated navigation.", "names-the-header|names-the-footer"],
      ["label-connection", "What does a connected label let a visitor do with a small checkbox?", "Tap or click the label words to toggle the control", "Send the form without a button", "Change the input type", "A label is part of the control's hit area, which helps touch, mouse and assistive technology users alike.", "thinks-it-submits|thinks-it-changes-the-type"],
      ["design-tokens", "Which value belongs in a named design token rather than inside one component rule?", "The spacing scale the whole site repeats", "A one-off rotation on a decorative image", "The colour of one link inside a single article", "Tokens exist for repeated decisions, so a value used once stays with the rule that needs it.", "names-a-one-off-value|tokens-every-declaration"],
      ["interaction-states", "Which pair of states should a handover checklist confirm for a link and a button?", "A hover state and a visible keyboard focus state", "A visited state and a hidden focus ring", "A disabled state only", "Hover shows what is available and focus shows where the keyboard is, and both must be clearly visible.", "hides-the-focus-ring|checks-disabled-only"],
      ["layout-breakpoint", "A layout is built narrow first and widened later. What does that order protect?", "The smallest screen, which most visitors meet first", "The largest screen, which is tested last", "The designer's own screen only", "A narrow base keeps the content usable before any wider enhancement is applied.", "protects-desktop-first|tests-one-screen-only"],
      ["named-functions", "Why name a function after the job it performs?", "Its purpose is clear wherever it is called", "The browser runs it faster", "The stylesheet can use it", "A name that states the job makes each call site readable without opening the function itself.", "expects-a-speed-gain|expects-css-to-use-it"],
      ["safe-output", "A status message is written with innerHTML. What is the professional concern?", "Markup inside the value could change the page structure", "The message loads more slowly", "The message cannot be styled", "Writing markup from data risks injecting structure the design never intended.", "expects-a-speed-loss|expects-a-style-conflict"],
      ["record-shape", "Why must every record in one service list carry the same property names?", "One piece of code can then process each record without special cases", "It keeps the records in alphabetical order", "It reduces the size of the file", "A consistent shape is what lets a single loop handle the whole collection.", "expects-alphabetical-order|judges-by-file-size"],
      ["saved-preference", "What should the code do when a saved preference is missing on a first visit?", "Fall back to a sensible default value", "Stop the whole script", "Ask the visitor to clear the browser", "A missing key returns nothing, so a default keeps the interface sensible on a first visit.", "crashes-on-first-visit|blames-the-browser"],
      ["private-detail", "Which detail is safe to publish on a service business page?", "The general area the business covers", "A home address", "A private mobile number", "A general statement of coverage informs visitors without exposing where a person lives.", "publishes-a-home-address|publishes-a-private-number"],
    ],
    debug: [
      {
        idea: "control-types",
        title: "Repair the quote request form",
        brief: "A visitor sent a screenshot of this quote request form. The company size choices are not grouped under a single question, the budget field accepts anything at all and says nothing about what it expects, one label is only placed next to its field and there is nowhere for the confirmation to appear. Repair the markup so the related choices sit in a named group, each field declares its type, every control carries a connected label and the result can be announced.",
        starter: {
          html: `<h1>Request a quote</h1>
<form id="quote-request">
  <p>Company size</p>
  <label><input name="size" value="small"> Small</label>
  <label><input name="size" value="large"> Large</label>
  <label>Monthly budget</label>
  <input name="budget">
  <button type="submit">Request quote</button>
</form>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["Every control has a connected label", labelledControls(), "label-connection"],
          ["Each field declares the kind of value it expects", attr("input", "type"), "control-types"],
          ["The related choices sit inside a fieldset", el("fieldset"), "grouped-choice"],
          ["The group of related choices is named", el("legend"), "grouped-choice"],
          ["The feedback can be announced without moving focus", statusRegion(), "live-feedback"],
        ],
      },
      {
        idea: "layout-breakpoint",
        title: "Repair the pricing page that leaves a wide margin",
        brief: "The pricing page has one fixed body width and no breakpoint, so on a laptop it leaves a wide empty margin and the cards can never share a row. The navigation is a plain block and the card grid defines no tracks and no spacing. Repair the stylesheet so the body width follows the screen, the navigation is a flexible row, the card grid defines three flexible tracks with a gap, and a breakpoint from 700 pixels changes the layout.",
        starter: {
          html: `<header><nav><a href="#plans">Plans</a></nav></header>
<main>
  <h1>Service plans</h1>
  <section id="plans" class="cards">
    <article class="card"><h2>Starter</h2><p>One site, updated monthly.</p></article>
    <article class="card"><h2>Standard</h2><p>Three sites and support.</p></article>
    <article class="card"><h2>Complete</h2><p>Everything, reviewed weekly.</p></article>
  </section>
</main>`,
          css: `body { width: 960px; margin: 0; background: #ffffff; color: #202020; }
nav { display: block; }
.cards { display: block; }
.card { padding: 1rem; border: 1px solid #cccccc; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["The layout keeps its width tied to the screen", fluidWidth(), "flexible-layout"],
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flexible-layout"],
          ["The cards define three flexible grid tracks", gridTracks(3), "card-grid"],
          ["The grid is spaced with a gap", decl("gap", "gap"), "card-grid"],
          ["A media query changes the layout from 700 pixels", breakpoint(700), "layout-breakpoint"],
        ],
      },
      {
        idea: "keyboard-access",
        title: "Repair the signup a keyboard cannot complete",
        brief: "A client tried the newsletter signup with the keyboard alone and could not tell which control was active, because the focus state is invisible. The signup picture is announced as an unnamed image, there is no region for the confirmation, and the page offers a personal mobile number as the contact route. Repair the page and the stylesheet so keyboard focus is clearly visible, every image is described, the feedback can be announced and no personal contact detail remains on the page.",
        starter: {
          html: `<h1>Newsletter signup</h1>
<form id="newsletter">
  <label for="signup-email">Email</label>
  <input id="signup-email" type="email">
  <button type="submit">Sign up</button>
</form>
<img src="office.jpg">
<p>Text the studio on 07 555 0199 for help.</p>
<p id="note">Ready</p>`,
          css: `body { background: #f4f1ea; color: #1c1c1c; line-height: 1.6; }
form { padding: 1rem; border: 1px solid #cccccc; }
a, button { color: #1c1c1c; }`,
          javascript: "",
        },
        editable: ["html", "css"],
        requirements: [
          ["Keyboard focus is clearly visible", focusRing(), "interaction-states"],
          ["The signup picture is described in words", imageAlt(), "image-alternative"],
          ["The feedback can be announced without moving focus", statusRegion(), "live-feedback"],
          ["The page publishes no personal contact detail", freeOf("personal-contact"), "private-detail"],
          ["Every form control keeps a connected label", labelledControls(), "label-connection"],
        ],
      },
    ],
    build: {
      idea: "tested-release",
      title: "Build the site for an independent driving instructor",
      brief: "An unseen client brief. Build a complete one page website for a driving instructor who works alone, using the three files you write. State the purpose and the audience, list the lesson types offered and give the visitor a clear call to action. Add a labelled enquiry form that is checked before it is accepted and reports back in a region that can be announced, a layout that keeps a fluid width and reaches its wider arrangement from 700 pixels, and one JavaScript behaviour that responds when the enquiry is sent. Give the document a specific title, a responsive viewport and a meta description. Close with handover notes that list at least three tested items, and publish no personal contact detail on the page.",
      requirements: buildRequirements,
    },
  },

  /* ------------------------------------------------------------------------ C --- */
  C: {
    knowledge: [
      ["semantic-regions", "A visitor using a screen reader wants the main content of a page quickly. What makes that possible?", "The main region names the primary content for assistive technology", "The longest paragraph is read out first", "The footer announces the main content", "A named main region lets assistive technology jump past the repeated header and navigation.", "expects-the-longest-paragraph|expects-the-footer-to-announce"],
      ["label-connection", "A developer copies a form and the same id now appears on two fields. What breaks first?", "The label connects to the first match, so one field is mislabelled", "The form refuses to submit", "The stylesheet stops applying", "An id identifies one element, so a repeated value makes the label connection ambiguous.", "expects-a-blocked-submit|blames-the-stylesheet"],
      ["design-tokens", "What is the difference between defining a named design value and using it?", "Defining records it in one place and using reads it wherever it is needed", "Both write the value into every rule", "Using the value changes its definition", "The definition holds the decision and each use reads it, so the site stays consistent.", "thinks-both-are-the-definition|expects-a-use-to-change-it"],
      ["interaction-states", "Why is removing the focus outline a professional mistake?", "A visitor who cannot use a mouse then loses their place on the page", "The browser will not submit the form", "The stylesheet becomes invalid", "The outline is the only sign of position for a keyboard visitor, so it is never safe to remove it.", "thinks-it-blocks-submission|thinks-the-stylesheet-breaks"],
      ["layout-breakpoint", "What is the risk of a fixed pixel width on a content card?", "It cannot shrink or grow with the space the page gives it", "Pixels are not allowed in modern stylesheets", "Fixed widths stop images from loading", "A fixed width cannot follow its container, so it overflows on a narrow screen.", "believes-pixels-are-invalid|blames-fixed-widths-for-images"],
      ["named-functions", "A function is defined but nothing on the page changes. What is the most likely cause?", "The function is never called", "The browser removed the function", "The stylesheet is not linked", "Defining a function only prepares the work, and the job happens when the function is called.", "expects-a-definition-to-run|blames-the-stylesheet"],
      ["safe-output", "A colleague asks why a value is set with textContent on a selected element. What is the sound reason?", "The value is plain content, so it belongs on the page as text", "textContent runs after every other script", "textContent stores the value in the browser", "The element text is the right place for plain content, and it never interprets the value as markup.", "thinks-it-is-a-timing-rule|confuses-text-with-storage"],
      ["record-shape", "Which property name is the better choice for a record that describes a service?", "title, because it states what the value holds", "a, because it is quick to type", "value1, because it comes first", "A name that describes its value keeps a set of records readable and consistent.", "optimises-for-typing|numbers-properties"],
      ["saved-preference", "Which value is unsuitable for browser storage on a client project?", "A private client document or a password", "The last section the visitor opened", "A small interface preference", "Storage on the device is not a safe place for secrets or private records.", "keeps-secrets-on-the-device|keeps-private-records-on-the-device"],
      ["private-detail", "Before handover, which check should the page pass?", "A read-through confirming that no personal contact or location detail is visible", "A check that the page carries enough photographs", "A check that the footer names a private address", "A deliberate read-through is what catches detail that was added while the site was built.", "checks-appearance-instead|expects-a-private-address"],
    ],
    debug: [
      {
        idea: "live-feedback",
        title: "Repair the contact form handed over without feedback",
        brief: "This contact form was handed over without a region for the result, so a visitor who sends an enquiry sees the page reload and nothing else. The message box and the name field are unlabelled, no control states what kind of value it expects, the required fields are not marked and the consent question is not grouped. Repair the markup so every control carries a connected label, the fields declare their type and required state, the consent question sits in a named group and the result can be announced.",
        starter: {
          html: `<h1>Contact the studio</h1>
<form id="contact">
  <label>Your name</label>
  <input name="visitor-name">
  <label for="message">Your message</label>
  <textarea id="message" name="message"></textarea>
  <p>May we send a reply?</p>
  <label><input name="consent" value="yes"> Yes</label>
  <button type="submit">Send</button>
</form>`,
          css: "",
          javascript: "",
        },
        editable: ["html"],
        requirements: [
          ["Every control has a connected label", labelledControls(), "label-connection"],
          ["Each field declares the kind of value it expects", attr("input", "type"), "control-types"],
          ["The field that must be completed is marked as required", attr("input", "required"), "control-types"],
          ["The consent question sits inside a fieldset", el("fieldset"), "grouped-choice"],
          ["The feedback can be announced without moving focus", statusRegion(), "live-feedback"],
        ],
      },
      {
        idea: "card-grid",
        title: "Repair the services grid that pushes the page sideways",
        brief: "The services section was built with a fixed width on every card and a plain block layout, so the third card pushes the page sideways on a phone. The navigation is a block rather than a row, the grid defines no tracks and the cards have no spacing between them. Repair the stylesheet so the body width follows the screen, the cards define three flexible grid tracks, the grid is spaced with a gap, the navigation is a flexible row, and a breakpoint from 600 pixels arranges the wider layout.",
        starter: {
          html: `<header><nav><a href="#services">Services</a></nav></header>
<main>
  <h1>Studio services</h1>
  <section id="services" class="cards">
    <article class="card"><h2>New site</h2><p>A one page site.</p></article>
    <article class="card"><h2>Refresh</h2><p>An existing site brought up to date.</p></article>
    <article class="card"><h2>Support</h2><p>Monthly reviews and repairs.</p></article>
  </section>
</main>`,
          css: `body { width: 1200px; }
nav { display: block; }
.cards { display: flex; }
.card { width: 400px; padding: 2rem; }`,
          javascript: "",
        },
        editable: ["css"],
        requirements: [
          ["The page width follows the space the browser gives it", fluidWidth(), "flexible-layout"],
          ["The cards define three flexible grid tracks", gridTracks(3), "card-grid"],
          ["The card grid is spaced with a gap", decl("gap", "gap", ".cards"), "card-grid"],
          ["The navigation is arranged as a flexible row", decl("display", "flex", "nav"), "flexible-layout"],
          ["A breakpoint changes the layout from 600 pixels", breakpoint(600), "layout-breakpoint"],
        ],
      },
      {
        idea: "fault-evidence",
        title: "Repair the availability message a script cannot reach",
        brief: "The availability message never appears on the page. The script writes the wording with innerHTML, so the markup is treated as code, and the page still prints a personal phone number in the footer as the way to make contact. Repair the script so it writes the message to the page as text, keep the decision that chooses between the two messages, and remove the personal contact detail from the page.",
        starter: {
          html: `<h1>Availability</h1>
<p id="availability">Checking</p>
<footer><p>Call the studio on 07 555 0142 for urgent work.</p></footer>`,
          css: "",
          javascript: `const availability = document.querySelector("#availability");
const openSlots = 3;

if (openSlots > 0) {
  availability.innerHTML = "<span>Three slots open this week</span>";
} else {
  availability.innerHTML = "<span>No slots open this week</span>";
}`,
        },
        editable: ["javascript", "html"],
        requirements: [
          ["The repaired script selects the element it updates", calls("querySelector"), "element-selection"],
          ["The message is written to the page as text", assigns("textContent"), "safe-output"],
          ["No value is written to the page as markup", avoids("innerhtml-assignment"), "safe-output"],
          ["The script still decides which message to show", js("conditional"), "branch-decisions"],
          ["The page publishes no personal contact detail", freeOf("personal-contact"), "private-detail"],
        ],
      },
    ],
    build: {
      idea: "tested-release",
      title: "Build the site for a decorating and repairs business",
      brief: "An unseen client brief. Build a complete one page website for a two person decorating and repairs business from the three files you write. Open with the purpose and the audience, list the services offered and give the visitor a clear call to action. It carries a labelled enquiry form that is checked before it is accepted and reports back in a region that can be announced, a layout that keeps a fluid width and reaches its wider arrangement from 700 pixels, and one JavaScript behaviour that responds when the enquiry is sent. The document carries a specific title, a responsive viewport and a meta description. Finish with handover notes that list at least three tested items, and publish no personal contact detail on the page.",
      requirements: buildRequirements,
    },
  },
};

export const adultsFinal: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  /* The module bank for this course lives in adults.ts and is merged by the manifest. */
  moduleForms: [],
  finalForms: buildFinalForms(courseId, forms, ideas),
  defence: [],
};
