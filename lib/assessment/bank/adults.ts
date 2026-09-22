/*
 * Adults: Web Skills for Work and Business.
 *
 * Three reviewed forms for every module, built with the shared factory so no piece of
 * metadata can be forgotten by hand. Each form asks five questions, one for each idea
 * the module teaches, and then one practical task with five marked requirements
 * covering the same five ideas, so all three forms assess the same objectives at the
 * same difficulty without repeating a question anywhere in the file.
 *
 * Every word here is written for an adult learning for work, business or an
 * independent project. The tone is professional and the examples are client websites:
 * a clear purpose and audience, services, calls to action, a labelled and validated
 * enquiry form, a responsive layout, useful JavaScript behaviour, testing evidence and
 * short handover notes. Nothing childish, nothing about school.
 *
 * The lesson ids, module ids and taught files all come from the real course catalogue.
 */

import { buildModuleForms, type AuthoredModule } from "@/lib/assessment/bank/factory";
import {
  assigns,
  attr,
  breakpoint,
  calls,
  decl,
  declaresFunction,
  el,
  focusRing,
  fluidWidth,
  fragmentLink,
  freeOf,
  gridTracks,
  headingOrder,
  imageAlt,
  js,
  labelledControls,
  landmarks,
  list,
  namedValues,
  statusRegion,
  storage,
  usesVar,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "adults" as const;

/* ------------------------------------------------- 1. meaningful structure ------- */

/* Purpose, audience, page regions, headings, navigation and described images: the
 * foundation every client can review before any styling exists. */

const structure: AuthoredModule = {
  ideas: {
    landmarks: { slug: "landmarks", lesson: "landmarks", difficulty: "foundation", cognitive: "remember" },
    headings: { slug: "headings", lesson: "headings", difficulty: "foundation", cognitive: "understand" },
    links: { slug: "links", lesson: "links", difficulty: "developing", cognitive: "apply" },
    images: { slug: "images", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
    "site-foundation": { slug: "site-foundation", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["landmarks", "Which element should hold the main content of a business page?", "The main element", "The footer element", "A plain div with a class named content", "The main element names the primary content region, so the browser and assistive technology can find it without guessing.", "uses-a-plain-div|puts-main-content-in-the-footer"],
        ["headings", "How many h1 headings should one page carry?", "One, naming the whole page", "One for every section", "As many as the page has paragraphs", "One h1 names the page. Section titles belong in lower heading levels so the outline stays readable.", "repeats-the-h1|confuses-heading-levels-with-paragraphs"],
        ["links", "What makes navigation link text useful to a client?", "It names the destination so it makes sense on its own", "It says click here", "It is as short as possible", "A visitor skims the link text by itself, so the words must say where the link goes.", "uses-click-here|uses-vague-text"],
        ["images", "What should alternative text for a service photograph describe?", "The useful information the picture gives", "The size of the image file", "The words image of followed by the file name", "Alternative text replaces the picture for someone who cannot see it, so it states what matters.", "describes-the-file|starts-with-image-of"],
        ["site-foundation", "What belongs in the first working version of a business website?", "A named purpose, the services and one clear action", "Every feature the client may want later", "Only the empty page framework", "A first version proves the structure and the message before more content is added.", "tries-every-feature-at-once|submits-an-empty-page"],
      ],
      practical: {
        title: "Build the foundation of the client site",
        brief: "Work in the HTML file. Keep the existing words, add a header, a main region and a footer, name the page with one h1, link the navigation to a section on the page, describe the photograph you add and list at least three services.",
        focus: "site-foundation",
        editable: ["html"],
        requirements: [
          ["The page has header, main and footer regions", landmarks("header", "main", "footer"), "landmarks"],
          ["One h1 names the page and the heading levels step down", headingOrder(), "headings"],
          ["A navigation link reaches a section of this page", fragmentLink(), "links"],
          ["The photograph carries useful alternative text", imageAlt(), "images"],
          ["The services are listed as at least three items", list(3), "site-foundation"],
        ],
      },
    },
    B: {
      questions: [
        ["landmarks", "Why use header, main and footer instead of generic div elements?", "They tell the browser and assistive technology what each region is for", "They make the page load faster", "They are required before CSS can work", "A named region is understood by screen readers. A plain div says nothing about its content.", "thinks-it-is-performance|thinks-css-requires-them"],
        ["headings", "Which heading level belongs directly under h1?", "h2", "h3", "h6", "Heading levels step down one at a time, so a section title inside the main heading is h2.", "skips-a-heading-level|thinks-any-level-can-follow"],
        ["links", "Where must a fragment link point?", "To an id that exists on the same page", "To another website", "To a CSS class name", "A fragment link uses a hash and an id, so the destination element must exist on the page.", "confuses-id-and-class|expects-an-external-address"],
        ["images", "When is empty alternative text the right choice?", "When the picture repeats information the words already give", "Whenever the picture is small", "Whenever the designer likes the picture", "Empty alternative text tells assistive technology to skip a decorative picture, so it is a deliberate decision.", "empties-alt-always|decides-by-size"],
        ["site-foundation", "What is the most useful thing to decide before writing any code?", "The purpose and the audience of the site", "The exact shade of every colour", "The folder names on the server", "Purpose and audience decide the content, the tone and the calls to action.", "starts-with-colour|starts-with-server-setup"],
      ],
      practical: {
        title: "Shape the page structure for a client",
        brief: "In the HTML file, give the page a header, a navigation, a main region and a footer. Keep one h1, link a menu item to a section of this page, describe the image you add and place the services inside a section.",
        focus: "site-foundation",
        editable: ["html"],
        requirements: [
          ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "landmarks"],
          ["The page keeps one main heading", el("h1"), "headings"],
          ["A working link reaches a section of this page", fragmentLink(), "links"],
          ["The image is described for someone who cannot see it", imageAlt(), "images"],
          ["A section groups the services", el("section"), "site-foundation"],
        ],
      },
    },
    C: {
      questions: [
        ["landmarks", "What is the job of the footer region on a business site?", "It closes the page with information about the site", "It holds the main services", "It holds the navigation only", "The footer carries closing information such as the credit or the release note.", "puts-main-content-in-footer|thinks-footer-is-navigation"],
        ["headings", "Why does the heading order matter for a client?", "It shows how the page is organised before any styling is added", "It controls the width of the page", "It sorts the links alphabetically", "Headings form an outline that a reader or a screen reader can follow from top to bottom.", "thinks-headings-control-layout|expects-headings-to-sort-links"],
        ["links", "What does the href attribute hold?", "The destination the link goes to", "The words the visitor reads", "The colour of the link text", "The href value is the address. The words between the tags are the link text.", "puts-the-link-text-in-href|thinks-href-is-styling"],
        ["images", "What is the difference between the src and alt values on an image?", "The src is the file to show and the alt is its description", "The src is the description and the alt is the file", "Both are descriptions of the picture", "The src tells the browser which file to display. The alt tells a person what the picture means.", "swaps-src-and-alt|thinks-both-are-descriptions"],
        ["site-foundation", "Which page can be understood without any CSS?", "One with regions, headings, paragraphs and links in a sensible order", "One with coloured boxes only", "One with a single heading and no text", "Reading the page without styling is the clearest test of its structure.", "relies-on-colour|omits-the-content"],
      ],
      practical: {
        title: "Complete the project structure",
        brief: "In the HTML file, build the page regions, keep one h1 with a stepped heading order, link the navigation to a section, describe the image you add and give each service its own article block.",
        focus: "site-foundation",
        editable: ["html"],
        requirements: [
          ["The page regions are all present", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading order steps down without gaps", headingOrder(), "headings"],
          ["A link reaches a section that exists", fragmentLink(), "links"],
          ["The image is described usefully", imageAlt(), "images"],
          ["One element stands on its own for each service entry", el("article", 3), "site-foundation"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------ 2. accessible forms ------ */

/* The enquiry form: a connected label for every field, a sensible type, grouped
 * choices, clear instructions, and feedback that can be announced. */

const forms: AuthoredModule = {
  ideas: {
    labels: { slug: "labels", lesson: "labels", difficulty: "developing", cognitive: "understand" },
    "input-types": { slug: "input-types", lesson: "types", difficulty: "developing", cognitive: "apply" },
    groups: { slug: "groups", lesson: "groups", difficulty: "developing", cognitive: "understand" },
    messages: { slug: "messages", lesson: "messages", difficulty: "developing", cognitive: "apply" },
    "enquiry-form": { slug: "enquiry-form", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["labels", "How is a label connected to the field it describes?", "The for value on the label matches the id on the field", "They are given the same colour", "They are placed side by side", "The matching values create a connection that assistive technology can follow.", "relies-on-position|relies-on-colour"],
        ["input-types", "Why choose the email input type for an email field?", "The browser can offer the right keyboard and a basic check", "It sends the address somewhere for you", "It makes the field required", "The type describes the value the field expects. Sending data is a separate decision.", "thinks-type-sends-data|confuses-type-with-required"],
        ["groups", "What does a fieldset group on a form?", "Controls that answer one shared question", "Every field on the page", "The submit buttons only", "A fieldset gathers related controls so one question applies to the whole group.", "groups-every-field|thinks-fieldset-is-layout-only"],
        ["messages", "Why use a status region for form feedback?", "It lets changing feedback be announced without moving focus", "It stores the visitor answer", "It creates a media query", "A status region makes dynamic results available to more visitors.", "thinks-it-stores-data|expects-a-media-query"],
        ["enquiry-form", "What should an enquiry form ask for?", "Only the information the business needs to reply", "Every detail about the visitor", "A password for the enquiry", "Collecting less information keeps the form clear and respects the visitor.", "asks-for-everything|asks-for-a-password"],
      ],
      practical: {
        title: "Build the enquiry form",
        brief: "In the HTML file, connect every label to its field, declare the type of each field, group the related choices, keep a status region for feedback and leave a form with a button the visitor can send.",
        focus: "enquiry-form",
        editable: ["html"],
        requirements: [
          ["Every form control has a connected label", labelledControls(), "labels", "accessibility"],
          ["Each field declares the kind of value it expects", attr("input", "type"), "input-types"],
          ["The related choices sit in a fieldset", el("fieldset"), "groups"],
          ["The feedback area can be announced", statusRegion(), "messages"],
          ["The form can be sent by the visitor", el("form"), "enquiry-form"],
        ],
      },
    },
    B: {
      questions: [
        ["labels", "What does an accessible form field need?", "A visible label that is connected to the field", "A placeholder instead of a label", "A red border while it is empty", "A label stays visible and readable. Colour alone cannot carry the instruction.", "uses-placeholder-as-a-label|relies-on-colour-only"],
        ["input-types", "What does the input type tell the browser?", "What kind of value the field expects", "Which stylesheet to load", "Which heading is the largest", "A suitable type supports entry and gives basic validation for free.", "expects-it-to-load-css|confuses-type-with-headings"],
        ["groups", "What does a legend label?", "The whole group of related controls", "Only the submit button", "The stylesheet for the form", "A legend gives the fieldset one name that stays visible and available to assistive technology.", "labels-the-button-only|confuses-legend-with-styles"],
        ["messages", "What should happen after a visitor sends an enquiry?", "A clear message tells them what happened next", "The page reloads with no explanation", "The form disappears silently", "Feedback confirms the action, and a status region makes it available to everyone.", "expects-silence|expects-the-form-to-vanish"],
        ["enquiry-form", "Which field does a business enquiry form genuinely need?", "A way to reach the visitor, such as an email field", "A home address field", "A field for the visitor password", "A form should request only what its stated purpose needs.", "asks-for-private-detail|asks-for-a-password"],
      ],
      practical: {
        title: "Finish the accessible form",
        brief: "In the HTML file, connect each label to its input, mark the field that must be filled in, name the group with a legend, keep a status region and leave one button that sends the form.",
        focus: "enquiry-form",
        editable: ["html"],
        requirements: [
          ["Every field has a connected label", labelledControls(), "labels", "accessibility"],
          ["The required field is marked as required", attr("input", "required"), "input-types"],
          ["The group of choices has a name", el("legend"), "groups"],
          ["The feedback region can be announced", statusRegion(), "messages"],
          ["A button the visitor can use is present", el("button"), "enquiry-form"],
        ],
      },
    },
    C: {
      questions: [
        ["labels", "What happens to a field whose label is not connected?", "The connection is only visual and assistive technology may miss it", "The browser removes the field", "The form cannot be submitted at all", "Without matching for and id values the label describes the field only to people who can see it.", "assumes-visual-is-enough|expects-the-field-to-be-removed"],
        ["input-types", "Why set a number input type for a quantity field?", "The browser checks the value and offers a suitable keypad", "It calculates the total for you", "It stores the number for later visits", "The type supports entry and basic validation. Calculation and storage are separate jobs.", "expects-it-to-calculate|expects-it-to-store"],
        ["groups", "How do related radio buttons share one question?", "They share the same name value", "They are given the same colour", "They are placed in one paragraph", "One shared name makes the browser treat the buttons as a single choice.", "shares-a-colour|relies-on-position"],
        ["messages", "What makes form feedback easy to understand?", "A specific message that names what happened", "A colour change with no words", "A silent update of the page", "Words carry the meaning. Colour alone can never be the only signal.", "relies-on-colour|leaves-the-page-silent"],
        ["enquiry-form", "What should the form do before it accepts a required value?", "Check that it is not empty and explain any problem", "Reload the page immediately", "Remove the label", "Validation with a clear message protects the quality of the enquiry.", "reloads-instead-of-checking|removes-the-label"],
      ],
      practical: {
        title: "Make the form clear and complete",
        brief: "In the HTML file, connect every label, set the field types, name the group of choices, keep the feedback region and leave a form the visitor can send.",
        focus: "enquiry-form",
        editable: ["html"],
        requirements: [
          ["Every control carries a connected label", labelledControls(), "labels", "accessibility"],
          ["The fields declare the value they expect", attr("input", "type"), "input-types"],
          ["The group of related choices is named", el("legend"), "groups"],
          ["Feedback has a live region", statusRegion(), "messages"],
          ["The form is present and can be sent", el("form"), "enquiry-form"],
        ],
      },
    },
  },
};

/* ------------------------------------------------- 3. a consistent CSS system ----- */

/* Selectors, the box model, named design values, visible interaction states: the
 * visual system a client can review and a developer can maintain. */

const cssSystem: AuthoredModule = {
  ideas: {
    selectors: { slug: "selectors", lesson: "selectors", difficulty: "foundation", cognitive: "remember" },
    "box-model": { slug: "box-model", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
    tokens: { slug: "tokens", lesson: "tokens", difficulty: "developing", cognitive: "apply" },
    states: { slug: "states", lesson: "states", difficulty: "secure", cognitive: "apply" },
    "visual-system": { slug: "visual-system", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["selectors", "When is a class selector the right choice?", "When several elements share one component style", "When only one element exists on the page", "When the style must change on every visit", "A class is a reusable label, so one rule can style every card of the same kind.", "styles-one-element-with-a-class|expects-a-class-to-change-behaviour"],
        ["box-model", "Where does padding create space?", "Between the content and its border", "Outside the element, away from its neighbours", "Between two pages of the site", "Padding is the inner space of a box. Margin is the space around the outside.", "confuses-padding-and-margin|expects-padding-outside"],
        ["tokens", "Why name a design value once, such as the ink colour?", "One change updates every place that uses the value", "It removes the need for a stylesheet", "It changes the HTML tags", "A named value keeps the visual system consistent and quick to adjust.", "expects-the-stylesheet-to-disappear|thinks-values-change-tags"],
        ["states", "Why must a keyboard focus state be visible?", "Keyboard users need to see which control is active", "It stores the form value", "It changes the meaning of the page", "A clear focus outline is how many visitors move through a form at all.", "thinks-focus-stores-data|expects-focus-to-change-meaning"],
        ["visual-system", "What is a visual system made of?", "A small set of repeated choices for colour, type and spacing", "One new style for every element", "The JavaScript used on the page", "Repeated decisions are what make a site look deliberate and easy to maintain.", "styles-every-element-differently|confuses-css-with-javascript"],
      ],
      practical: {
        title: "Write the visual system",
        brief: "In the CSS file, style paragraphs with a readable line height, keep border-box sizing for every box, name at least three design values, add a visible keyboard focus state and use your named values in the rules.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["Paragraphs get a readable line height", decl("line-height", "line-height", "p"), "selectors"],
          ["Every box counts its border inside its width", decl("box-sizing", "border-box"), "box-model"],
          ["At least three design values are named", namedValues(3), "tokens"],
          ["Keyboard focus is visible", focusRing(), "states", "accessibility"],
          ["Named values are used in the rules", usesVar(2), "visual-system"],
        ],
      },
    },
    B: {
      questions: [
        ["selectors", "What does a CSS selector choose?", "The elements a rule applies to", "The colour of the text", "The file the rule is saved in", "The selector chooses, and the declarations inside the braces describe the change.", "confuses-selector-and-value|expects-a-selector-to-name-a-file"],
        ["box-model", "What does box-sizing border-box change?", "The declared width includes padding and border", "It removes every border on the page", "It changes the width of the screen", "Border-box sizing keeps the arithmetic simple: the declared width is the whole box.", "expects-borders-to-vanish|confuses-the-box-with-the-screen"],
        ["tokens", "Where do shared design values belong in a stylesheet?", "In one block at the top that the rest of the rules read", "Repeated in every rule that needs them", "In the HTML file as attributes", "One block of named values is easier to change than copies scattered through the file.", "repeats-values-everywhere|puts-design-values-in-html"],
        ["states", "What does a focus outline do for a client form?", "It shows where the keyboard is before the visitor types", "It submits the form", "It hides the field label", "Visible focus keeps the form usable without a mouse.", "thinks-focus-submits|expects-focus-to-hide-labels"],
        ["visual-system", "What makes a page look consistent?", "The same limited set of colours, type and spacing everywhere", "A different font in every section", "A border on every element", "Consistency comes from repeating a few decisions rather than inventing new ones.", "varies-the-font-per-section|borders-everything"],
      ],
      practical: {
        title: "Style the project components",
        brief: "In the CSS file, set a readable font size for paragraphs, give the cards outside spacing, use a named value for the card text colour, make keyboard focus visible and use a named value in a rule.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["Paragraphs get a readable font size", decl("font-size", "font-size", "p"), "selectors"],
          ["The cards have outside spacing", decl("margin", "margin", ".card"), "box-model"],
          ["The card text colour uses a named value", decl("color", "custom-property", ".card"), "tokens"],
          ["Keyboard users can see the focus", focusRing(), "states", "accessibility"],
          ["A named value is used in a rule", usesVar(1), "visual-system"],
        ],
      },
    },
    C: {
      questions: [
        ["selectors", "Which selector is the most reusable for a card component?", "A class such as card", "A selector that depends on position, such as the first article", "An id that belongs to one card only", "A class gives repeated components a stable styling hook that does not depend on position.", "styles-by-position|uses-an-id-for-a-repeated-component"],
        ["box-model", "What is the difference between margin and padding?", "Margin is space outside the element and padding is inside", "Margin is inside the element and padding is outside", "Both add space inside the element", "Margin separates a box from its neighbours, while padding moves content in from its own edge.", "swaps-margin-and-padding|thinks-both-are-inner-space"],
        ["tokens", "What happens when a design value is written out by hand in ten places?", "Changing the design means finding and editing all ten by hand", "The browser keeps them in step automatically", "The stylesheet stops working", "A named value exists so one decision can be changed in one place.", "expects-the-browser-to-sync|believes-the-stylesheet-breaks"],
        ["states", "Which states should an interactive control show?", "A visible hover state and a visible keyboard focus state", "Only a colour that changes on hover", "A state that appears after the form is sent", "Both states show what is available and where the keyboard is.", "relies-on-hover-only|expects-a-submission-state"],
        ["visual-system", "Why keep the visual system small?", "A few repeated choices read as deliberate design", "It reduces the file size to nothing", "It removes the need for a stylesheet", "A small set of decisions is what a client can review and approve.", "judges-design-by-file-size|expects-no-stylesheet"],
      ],
      practical: {
        title: "Make the page look deliberate",
        brief: "In the CSS file, style paragraphs with a readable line height, give each card inner spacing, name at least two design values, make keyboard focus visible and use your named values in the rules.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["The body text keeps a readable line height", decl("line-height", "line-height", "p"), "selectors"],
          ["The cards have inner spacing", decl("padding", "padding", ".card"), "box-model"],
          ["Design values are named for reuse", namedValues(2), "tokens"],
          ["Focus is clearly visible", focusRing(), "states", "accessibility"],
          ["More than one named value is used", usesVar(2), "visual-system"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------- 4. responsive ----- */

/* Mobile first, a wrapping navigation, flexible service cards and a breakpoint chosen
 * where the content needs more room. */

const responsive: AuthoredModule = {
  ideas: {
    viewport: { slug: "viewport", lesson: "viewport", difficulty: "developing", cognitive: "apply" },
    "flex-row": { slug: "flex-row", lesson: "flex", difficulty: "developing", cognitive: "apply" },
    "grid-columns": { slug: "grid-columns", lesson: "grid", difficulty: "developing", cognitive: "apply" },
    breakpoints: { slug: "breakpoints", lesson: "media", difficulty: "developing", cognitive: "apply" },
    "responsive-project": { slug: "responsive-project", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["viewport", "What does mobile first mean for a business site?", "The narrow layout is the default and wider layouts add to it", "Only phones may open the site", "All the text must be smaller", "Starting narrow protects the smallest screen and keeps the content readable.", "blocks-wider-devices|shrinks-all-text"],
        ["flex-row", "What does display flex do to a group of links?", "It lays them out in one direction where they can share the space", "It puts each link on its own page", "It changes the words in each link", "Flexbox arranges items along one line and can wrap them when the space runs out.", "expects-one-link-per-page|expects-flex-to-change-text"],
        ["grid-columns", "What does one fr unit mean in a grid?", "One share of the space that is available", "One fixed pixel width", "One form field", "Fraction units divide the available space between the tracks.", "thinks-fr-is-a-fixed-size|confuses-fr-with-form-fields"],
        ["breakpoints", "How should the width of a breakpoint be chosen?", "Where the layout starts to feel cramped", "From the age of the visitor", "At every possible pixel width", "The content decides where it needs more room, not a device name.", "picks-a-breakpoint-by-device-name|adds-a-breakpoint-per-pixel"],
        ["responsive-project", "What must stay the same on a narrow screen?", "The content and the actions a visitor can take", "The exact number of columns", "The fixed width of the page", "The arrangement may change, but the meaning and the actions must not.", "removes-content-on-phones|keeps-a-fixed-width"],
      ],
      practical: {
        title: "Build the responsive layout",
        brief: "In the CSS file, keep the page width tied to the available space, arrange the navigation as a row, give the service cards flexible grid columns, add a breakpoint that changes the layout and space the cards with a gap.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The page width follows the available space", fluidWidth(), "viewport"],
          ["The navigation is arranged as a row", decl("display", "flex", "nav"), "flex-row"],
          ["The service cards use flexible columns", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["A breakpoint changes the layout", breakpoint(600), "breakpoints"],
          ["The card grid is spaced with a gap", decl("gap", "gap", ".cards"), "responsive-project"],
        ],
      },
    },
    B: {
      questions: [
        ["viewport", "Why use relative sizes rather than fixed pixel widths?", "The layout adapts to the screen that is available", "The page loads faster", "Fixed widths are invalid in CSS", "Relative sizes keep the content inside the viewport on smaller screens.", "thinks-it-is-performance-only|believes-pixels-are-invalid"],
        ["flex-row", "What allows links in a row to wrap onto the next line?", "flex-wrap wrap on the container", "A wider border on each link", "A media query on every link", "Wrapping lets the row continue on a new line instead of forcing the page wider.", "expects-borders-to-wrap-items|wraps-with-a-media-query"],
        ["grid-columns", "What does Grid arrange that Flexbox does less well?", "Rows and columns together", "Only one item at a time", "The text inside an item", "Grid controls two dimensions at once, which suits a row of service cards.", "expects-grid-to-edit-text|thinks-grid-handles-one-item"],
        ["breakpoints", "What belongs inside a media query?", "Only the rules that need to change at that width", "The whole stylesheet again", "The HTML of the page", "Keeping a breakpoint small makes it clear what changes and why.", "repeats-the-whole-stylesheet|puts-markup-in-the-stylesheet"],
        ["responsive-project", "What must never happen on a small screen?", "Sideways scrolling to reach the content", "Text wrapping onto two lines", "A list becoming taller", "Content wider than the viewport makes a page hard to use on a phone.", "accepts-horizontal-scrolling|expects-content-to-be-removed"],
      ],
      practical: {
        title: "Arrange the project for every screen",
        brief: "In the CSS file, keep the layout fluid, arrange the navigation as a row with a gap, give the cards three grid tracks, and add a breakpoint at 700 pixels where the layout changes.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The layout keeps its width tied to the space", fluidWidth(), "viewport"],
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["The cards have three grid tracks", gridTracks(3), "grid-columns"],
          ["A media query changes the layout", breakpoint(700), "breakpoints"],
          ["The navigation row has a gap", decl("gap", "gap", "nav"), "responsive-project"],
        ],
      },
    },
    C: {
      questions: [
        ["viewport", "What is the safest starting point for a layout?", "The narrow layout first, then wider enhancements", "The widest layout first", "One fixed desktop width", "The narrow base is what most visitors see first, so it must work on its own.", "starts-from-desktop|uses-one-fixed-width"],
        ["flex-row", "Which combination places navigation links side by side with even space?", "display flex with a gap", "display grid with no gap", "A fixed width on each link", "Flexbox with a gap arranges a row without hand measured spacing.", "expects-fixed-widths-to-space|omits-the-gap"],
        ["grid-columns", "Why avoid a fixed pixel width on every card?", "The cards cannot fit a narrower or wider container", "Pixels are not part of CSS", "Fixed widths stop images loading", "Flexible tracks let the same cards arrange themselves in the space available.", "believes-pixels-are-invalid|blames-fixed-widths-for-images"],
        ["breakpoints", "When does the code inside a media query apply?", "Only when its condition matches the screen", "On every screen at all times", "Only when JavaScript runs", "A media query is a condition: the rules inside apply when it is true.", "thinks-rules-always-apply|expects-a-script-to-trigger-it"],
        ["responsive-project", "What is the best way to test a responsive layout?", "Resize the page and check each width for overflow and readability", "Look at the stylesheet once", "Change the page colours", "Testing at several widths is the only way to see what a visitor really gets.", "never-tests|tests-only-appearance"],
      ],
      practical: {
        title: "Make the project fit every screen",
        brief: "In the CSS file, make the width fluid, let the navigation row wrap, give the cards three grid tracks with a gap, and add a breakpoint so wider screens get the row layout.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The layout keeps a fluid width", fluidWidth(), "viewport"],
          ["The navigation row can wrap", decl("flex-wrap", "wrap", "nav"), "flex-row"],
          ["The cards have three grid tracks", gridTracks(3), "grid-columns"],
          ["A breakpoint adapts the layout", breakpoint(700), "breakpoints"],
          ["The card grid is spaced with a gap", decl("gap", "gap", ".cards"), "responsive-project"],
        ],
      },
    },
  },
};

/* --------------------------------------------------------- 5. JavaScript decisions */

/* Stored values, a named function, one clear condition and a visible result on the
 * page: the smallest amount of JavaScript a client site needs. */

const javascriptDecisions: AuthoredModule = {
  ideas: {
    values: { slug: "values", lesson: "values", difficulty: "developing", cognitive: "understand" },
    functions: { slug: "functions", lesson: "functions", difficulty: "developing", cognitive: "apply" },
    conditions: { slug: "conditions", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
    "dom-output": { slug: "dom-output", lesson: "dom-output", difficulty: "developing", cognitive: "apply" },
    "scripted-behaviour": { slug: "scripted-behaviour", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["values", "When should const be used instead of let?", "When the name keeps the same value", "When the value must change later", "When the value is a number", "The const keyword keeps one binding. let signals that the stored value is expected to change.", "uses-let-for-everything|chooses-by-value-type"],
        ["functions", "What runs the instructions inside a function?", "Calling the function by name", "Naming the function", "Writing a comment above it", "Defining a function prepares it. Calling it runs the instructions.", "expects-definition-to-run|expects-a-comment-to-run"],
        ["conditions", "When does the else block run?", "When the condition in the if is false", "Before the condition is checked", "Every time the page loads", "The if block runs when the condition is true, and else provides the alternative.", "expects-else-always|expects-else-before-the-check"],
        ["dom-output", "What does querySelector find?", "The first element that matches a CSS selector", "Every element on the page", "The text inside an element", "querySelector returns one element, so the selector must be precise.", "expects-every-element|expects-text-instead"],
        ["scripted-behaviour", "What should the page show after the script runs?", "Useful information a visitor can read", "The code itself on the page", "Nothing until the page is reloaded", "Visible and useful output is the point of the JavaScript in this project.", "prints-the-code|expects-a-reload"],
      ],
      practical: {
        title: "Add a decision to the site",
        brief: "In the JavaScript file, store the value you need, define a named function with one parameter, make one decision inside it, select the element you update and set its visible text.",
        focus: "scripted-behaviour",
        editable: ["javascript"],
        requirements: [
          ["A value is stored for later use", js("declaration"), "values"],
          ["A named function takes one parameter", declaresFunction(1), "functions"],
          ["The code makes one decision", js("conditional"), "conditions"],
          ["The visible text of an element is set", assigns("textContent"), "dom-output"],
          ["The element to update is selected first", calls("querySelector"), "scripted-behaviour"],
        ],
      },
    },
    B: {
      questions: [
        ["values", "What does the equals sign do in a statement such as let count = 3?", "It stores the value 3 under the name count", "It compares count with 3", "It shows 3 on the page", "A single equals sign stores a value. Comparison uses two or three.", "expects-a-comparison|expects-output"],
        ["functions", "What does a named function make easier when the site grows?", "Reusing the same job in more than one place", "Hiding the code from the browser", "Changing the page colour", "A named job can be called wherever it is needed, which keeps the script short.", "expects-hiding|confuses-with-styling"],
        ["conditions", "What is a good reason to use if and else on a business site?", "The page has two possible messages to choose between", "The page needs a new file", "The list must be sorted", "A condition picks between two outcomes, which suits a page with two messages.", "expects-a-new-file|confuses-conditions-with-sorting"],
        ["dom-output", "Which property changes the plain words inside an element?", "textContent", "querySelector", "addEventListener", "textContent replaces the visible text of an element safely.", "confuses-text-with-finding|confuses-text-with-events"],
        ["scripted-behaviour", "Which order works best when the script updates the page?", "Select the element, decide the value, then show it", "Show the value, then decide what it is", "Change the HTML file instead of the script", "Working in that order means the element exists before it is updated.", "updates-before-deciding|edits-markup-instead"],
      ],
      practical: {
        title: "Make the page show a result",
        brief: "In the JavaScript file, keep a stored value, define a function that takes one parameter, use if and else for two outcomes, set the visible text and write the message as a text value.",
        focus: "scripted-behaviour",
        editable: ["javascript"],
        requirements: [
          ["A value is kept in a variable", js("declaration"), "values"],
          ["A function with one parameter is defined", declaresFunction(1), "functions"],
          ["Two outcomes are decided in the code", js("conditional"), "conditions"],
          ["The page text is updated by the script", assigns("textContent"), "dom-output"],
          ["The written message is a text value", js("string-literal"), "scripted-behaviour"],
        ],
      },
    },
    C: {
      questions: [
        ["values", "What is the difference between defining and using a variable?", "Defining stores the value, using reads it somewhere else", "Both print the value", "Using changes the name", "The name is created once and then read wherever it is needed.", "thinks-using-a-value-prints-it|expects-renaming"],
        ["functions", "What is the job of a function in this project?", "To do one clear job that can be tested", "To replace the HTML structure", "To make the page load", "One job per function makes the behaviour easy to test and easy to explain to a client.", "expects-it-to-replace-markup|thinks-it-loads-the-page"],
        ["conditions", "What should each branch of an if and else set?", "One clear outcome", "Every other function on the page", "A change to the HTML structure", "Each branch answers one case, which keeps the behaviour predictable.", "runs-everything|changes-the-structure"],
        ["dom-output", "Why store the selected element in a const before changing it?", "The name can be reused without searching the page again", "It stops the element from moving", "It changes the element type", "One lookup with a clear name keeps the script shorter and easier to read.", "searches-again-every-time|expects-the-element-to-move"],
        ["scripted-behaviour", "How do you know the script worked?", "The page shows the information you expected", "The file became longer", "The page reloaded on its own", "Visible and predicted output is the evidence that the code ran.", "judges-by-file-length|expects-an-automatic-reload"],
      ],
      practical: {
        title: "Put a useful result on the page",
        brief: "In the JavaScript file, store at least two values, define a named function, decide the outcome with a condition, select the element on the page and set its text.",
        focus: "scripted-behaviour",
        editable: ["javascript"],
        requirements: [
          ["At least two values are stored", js("declaration", 2), "values"],
          ["A named function is defined", declaresFunction(1), "functions"],
          ["A condition chooses the outcome", js("conditional"), "conditions"],
          ["The visible text is set on the page", assigns("textContent"), "dom-output"],
          ["The element on the page is selected", calls("querySelector"), "scripted-behaviour"],
        ],
      },
    },
  },
};

/* ---------------------------------------------------- 6. structured data --------- */

/* Records kept once and rendered into the page: an array of objects, one loop and one
 * safe list item for every record. */

const data: AuthoredModule = {
  ideas: {
    arrays: { slug: "arrays", lesson: "arrays", difficulty: "developing", cognitive: "understand" },
    objects: { slug: "objects", lesson: "objects", difficulty: "developing", cognitive: "understand" },
    foreach: { slug: "foreach", lesson: "foreach", difficulty: "developing", cognitive: "apply" },
    render: { slug: "render", lesson: "render", difficulty: "secure", cognitive: "apply" },
    "data-content": { slug: "data-content", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["arrays", "What does an array hold?", "An ordered group of values", "One single value only", "A CSS rule", "An array is a list, so repeated information can be processed together.", "expects-one-value|confuses-an-array-with-css"],
        ["objects", "What does an object describe?", "One record with named properties", "One style rule", "One page region", "Named properties make each record readable and consistent.", "confuses-object-with-style|confuses-object-with-markup"],
        ["foreach", "How often does forEach run its function?", "Once for every item in the array", "Once for the whole page", "Only when a button is pressed", "forEach visits every item, one at a time, in order.", "expects-one-run|expects-a-click-to-start-it"],
        ["render", "Which combination creates a visible list from records?", "createElement, textContent and append inside the loop", "querySelector and a CSS rule", "A media query and a border", "The loop creates one element per record and adds it to the page.", "expects-css-to-create-items|expects-a-media-query-to-render"],
        ["data-content", "Why keep the services in an array instead of writing each one in HTML?", "One set of instructions can show every service", "It changes the colour of the page", "It removes the need to test", "Data plus one rendering step is easier to change when the client adds a service.", "hand-writes-every-item|thinks-data-replaces-testing"],
      ],
      practical: {
        title: "Render the services from data",
        brief: "In the JavaScript file, keep the service records in an array of objects, loop through them with forEach, create one list item for each record and add each item to the page.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["The records live in an array", js("array-literal"), "arrays"],
          ["At least one record is an object", js("object-literal"), "objects"],
          ["A loop visits every record", calls("forEach"), "foreach"],
          ["An element is created for each record", js("create-element"), "render"],
          ["Every element is added to the page", js("append"), "data-content"],
        ],
      },
    },
    B: {
      questions: [
        ["arrays", "What is the first position in an array numbered as?", "0", "1", "-1", "Counting starts at zero, so the first item sits at position zero.", "starts-counting-at-one|expects-a-negative-index"],
        ["objects", "What stays the same about every record in an array?", "The property names it uses", "The number of letters in its title", "The colour of its text", "Consistent property names let one loop handle every record.", "varies-property-names|judges-records-by-length"],
        ["foreach", "Why name the callback parameter clearly?", "It shows which single record the loop is working on", "It changes the order of the array", "It saves the value in the browser", "A clear name makes the repeated instruction easy to check.", "expects-it-to-reorder|expects-it-to-store"],
        ["render", "Why use textContent for a service title?", "It adds the words as text rather than as markup", "It saves the title permanently", "It makes the list sort itself", "textContent treats the value as plain text, which is what a title is.", "expects-markup|expects-storage"],
        ["data-content", "What is the best test of a rendering loop?", "Add a fourth record and check that a fourth item appears", "Change the page colour", "Delete the array", "A new item appearing proves the loop handles a changing group.", "changes-css-instead|expects-the-loop-to-guess"],
      ],
      practical: {
        title: "Build a list from records",
        brief: "In the JavaScript file, store at least three records in one array, visit every record with forEach, create an element for each and append it to the existing list.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["The records are stored in an array", js("array-literal"), "arrays"],
          ["Each record is written as an object", js("object-literal"), "objects"],
          ["The array is looped through", calls("forEach"), "foreach"],
          ["An element is created for every record", js("create-element"), "render"],
          ["The created elements are appended to the page", js("append"), "data-content"],
        ],
      },
    },
    C: {
      questions: [
        ["arrays", "How many values can an array hold?", "As many as the data needs, including none at all", "Exactly three", "One", "An array grows and shrinks with the data, so the loop must cope with any count.", "expects-a-fixed-count|expects-one-value-only"],
        ["objects", "Why give every record the same shape?", "The same code can process each record without special cases", "It makes the file smaller", "It fixes the order of the records", "A consistent shape is what makes one loop enough.", "judges-by-file-size|expects-a-fixed-order"],
        ["foreach", "What does the callback parameter represent during one iteration?", "The current item being processed", "The whole array", "The number of items", "The parameter is the single item for that turn of the loop.", "passes-the-whole-array|confuses-item-with-count"],
        ["render", "Where should the created element be added?", "To the list element that already exists on the page", "To the stylesheet", "To a new file", "Appending to the existing list is what makes the record visible.", "appends-to-the-stylesheet|expects-a-new-file"],
        ["data-content", "Why separate the data from the instructions that display it?", "The display can change without rewriting every record", "It removes the need for JavaScript", "It stops the page from reloading", "Keeping data apart from presentation makes both easier to change.", "thinks-it-removes-javascript|confuses-it-with-page-reload"],
      ],
      practical: {
        title: "Show every record on the page",
        brief: "In the JavaScript file, keep the records in an array, loop through them, set the visible text of a new element for each record and add every element to the page.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["A group of records is stored", js("array-literal"), "arrays"],
          ["The records use named properties", js("object-literal"), "objects"],
          ["Every record is visited by the loop", calls("forEach"), "foreach"],
          ["Each item gets its visible text", assigns("textContent"), "render"],
          ["Every item is added to the list on the page", js("append"), "data-content"],
        ],
      },
    },
  },
};

/* ----------------------------------------------------------- 7. interactions ------ */

/* Select the elements, respond to a real event, validate before accepting input and
 * keep only one small non-sensitive value in the browser. */

const interaction: AuthoredModule = {
  ideas: {
    select: { slug: "select", lesson: "select", difficulty: "developing", cognitive: "apply" },
    events: { slug: "events", lesson: "events", difficulty: "developing", cognitive: "apply" },
    validation: { slug: "validation", lesson: "validation", difficulty: "secure", cognitive: "analyse" },
    storage: { slug: "storage", lesson: "storage", difficulty: "developing", cognitive: "apply" },
    "form-interaction": { slug: "form-interaction", lesson: "project", difficulty: "advanced", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["select", "What does document.querySelector receive?", "A CSS selector such as one that names an id", "A password", "A file name", "The selector finds the element, so the id in the HTML must match.", "passes-plain-text|passes-a-file-name"],
        ["events", "When does the function inside addEventListener run?", "When its event happens", "Before the page loads", "Every second", "The listener waits for the named event and then runs the function once per event.", "expects-it-to-run-immediately|expects-a-timer"],
        ["validation", "Why trim a typed value before checking it?", "Spaces alone should not count as real input", "It changes the words into numbers", "It saves the value automatically", "Trimming removes surrounding spaces so an entry of spaces is treated as empty.", "expects-a-number|expects-storage"],
        ["storage", "What may be kept in browser storage for this project?", "A small non-sensitive preference the interface needs", "A password", "A client private document", "Device storage is not a place for secrets or private records.", "stores-secrets|stores-private-records"],
        ["form-interaction", "What is the clearest sign that the interaction works?", "The message a visitor sees matches the value they entered", "The script file is long", "The page changed colour", "Visible behaviour that matches the input is the evidence.", "judges-by-file-length|tests-only-appearance"],
      ],
      practical: {
        title: "Connect the form to the page",
        brief: "In the JavaScript file, select the form and the field, listen for the form being sent, trim the typed value before use, save one non-sensitive value in browser storage and show a message in the feedback region.",
        focus: "form-interaction",
        editable: ["javascript"],
        requirements: [
          ["The elements are selected before use", calls("querySelector"), "select"],
          ["The script listens for the form being sent", js("event-listener"), "events"],
          ["The typed value is trimmed before use", calls("trim"), "validation"],
          ["One non-sensitive value is saved", storage("setItem"), "storage"],
          ["A message is shown on the page", assigns("textContent"), "form-interaction"],
        ],
      },
    },
    B: {
      questions: [
        ["select", "Why store a selected element in a const?", "So the same element can be used again without searching twice", "So the element can never change", "So the page loads faster", "One lookup with a descriptive name keeps the script clear.", "expects-it-to-be-unchangeable|expects-a-speed-gain"],
        ["events", "Which event suits a form being sent?", "submit", "scroll", "resize", "The submit event covers both a button press and the keyboard, so it is the right choice.", "expects-scroll|expects-resize"],
        ["validation", "What should happen when a required field is left empty?", "A specific message explains what to enter", "Nothing at all happens", "The page closes", "A clear message tells the visitor what to do next.", "leaves-it-silent|expects-the-page-to-close"],
        ["storage", "What can a storage read return on a first visit?", "A null value, so the code needs a safe default", "The stylesheet", "A form element", "A missing key returns null, so a fallback value keeps the page sensible.", "expects-a-style-value|expects-an-element"],
        ["form-interaction", "Why handle the submit event rather than only a button click?", "It also works when the form is sent from the keyboard", "It removes the need for labels", "It stores the value in CSS", "The submit event represents the whole form action for every input method.", "skips-keyboard-users|confuses-events-with-storage"],
      ],
      practical: {
        title: "Make the enquiry form respond",
        brief: "In the JavaScript file, select the form and the field, prevent the page from reloading when the form is sent, trim the typed value, restore a saved preference with a safe default and show the result as text.",
        focus: "form-interaction",
        editable: ["javascript"],
        requirements: [
          ["The form and field are selected", calls("querySelector"), "select"],
          ["The page reload is prevented", js("prevent-default"), "events"],
          ["The typed value is trimmed", calls("trim"), "validation"],
          ["A saved preference is read back", storage("getItem"), "storage"],
          ["The result is shown as page text", assigns("textContent"), "form-interaction"],
        ],
      },
    },
    C: {
      questions: [
        ["select", "What happens if a selector matches nothing?", "The code has nothing to work with and the change fails", "The browser creates the element for you", "The stylesheet adds it", "A selector must match real HTML, which is why the id is checked first.", "expects-the-browser-to-invent-it|expects-css-to-add-it"],
        ["events", "Why attach the listener to the element that has the job?", "The event belongs to that control", "It makes the file shorter", "It changes the HTML", "Attaching the listener to the right element keeps the behaviour predictable.", "attaches-to-the-document-always|expects-a-shorter-file"],
        ["validation", "What makes a validation message useful to a client visitor?", "It names the problem and the next action", "It says only the word error", "It appears in a colour with no words", "A message that names the next action lets the visitor finish the task.", "uses-a-bare-error-word|relies-on-colour"],
        ["storage", "Why save only one non-sensitive value?", "It is the smallest amount the interface genuinely needs", "It keeps a full copy of the visitor identity", "It replaces the need for a form", "Storing less protects the visitor and keeps the code simple.", "copies-identity-data|thinks-storage-replaces-forms"],
        ["form-interaction", "Which test proves the interaction works for more visitors?", "Use it with the mouse and then with the keyboard", "Look at the code once", "Change the page colour", "Mouse and keyboard together show the control works for more people.", "never-tests|tests-only-appearance"],
      ],
      practical: {
        title: "Build one working interaction",
        brief: "In the JavaScript file, select the field and the feedback element, listen for the form being sent, trim the typed value, save one non-sensitive value and show a clear message on the page.",
        focus: "form-interaction",
        editable: ["javascript"],
        requirements: [
          ["The field and feedback element are selected", calls("querySelector"), "select"],
          ["A listener responds to the form", js("event-listener"), "events"],
          ["The typed value is trimmed first", calls("trim"), "validation"],
          ["One small value is saved in the browser", storage("setItem"), "storage"],
          ["The page shows a message to the visitor", assigns("textContent"), "form-interaction"],
        ],
      },
    },
  },
};

/* ------------------------------------------------- 8. test, protect and release -- */

/* Repair from evidence, audit accessibility, keep personal detail off the page, write
 * honest handover notes and prove the work with recorded tests. */

const quality: AuthoredModule = {
  ideas: {
    debug: { slug: "debug", lesson: "debug", difficulty: "secure", cognitive: "analyse" },
    "access-check": { slug: "access-check", lesson: "accessibility", difficulty: "secure", cognitive: "evaluate" },
    "safe-details": { slug: "safe-details", lesson: "security", difficulty: "secure", cognitive: "understand" },
    "release-note": { slug: "release-note", lesson: "release", difficulty: "developing", cognitive: "understand" },
    "tested-release": { slug: "tested-release", lesson: "project", difficulty: "advanced", cognitive: "evaluate" },
  },
  forms: {
    A: {
      questions: [
        ["debug", "What is the first step when a page stops behaving as expected?", "Reproduce the fault and note what you expected to see", "Rewrite the whole file", "Delete the stylesheet", "Reproducing the fault and stating the expected result is what makes a cause findable.", "rewrites-everything|blames-the-stylesheet"],
        ["access-check", "What should an accessibility check cover on a business site?", "Keyboard use, labels, alternative text and visible feedback", "Only the colours and fonts", "Only the file size", "Accessibility covers seeing, understanding and operating the site.", "checks-appearance-only|checks-file-size-only"],
        ["safe-details", "Which detail should stay off a public business page?", "A personal home address or private mobile number", "The general service area you cover", "A description of your services", "Personal contact and location details stay private. Use a general contact route instead.", "publishes-private-detail|thinks-ordinary-content-is-private"],
        ["release-note", "What belongs in a short handover note?", "The purpose, what was tested and one known limit", "A promise that nothing can ever fail", "Every line of code rewritten by hand", "A handover note tells the next person what works and what is still outside this version.", "claims-perfection|repeats-the-whole-code"],
        ["tested-release", "What is the strongest evidence that the site is ready to hand over?", "Recorded tests showing each required part works", "A large amount of code", "A colourful design", "Test evidence with a clear explanation shows the work really works.", "judges-by-code-size|judges-by-appearance"],
      ],
      practical: {
        title: "Repair, protect and prepare the handover",
        brief: "Repair the script so it selects the element that exists, add a described image, publish no personal contact detail, list at least three tested items in your handover notes and keep the header, main and footer regions.",
        focus: "tested-release",
        editable: ["html", "javascript"],
        requirements: [
          ["The repaired script selects the element that exists", calls("querySelector"), "debug"],
          ["The image carries useful alternative text", imageAlt(), "access-check", "accessibility"],
          ["The page publishes no personal contact detail", freeOf("personal-contact"), "safe-details", "privacy"],
          ["The handover notes list at least three tested items", list(3), "release-note"],
          ["The page keeps header, main and footer regions", landmarks("header", "main", "footer"), "tested-release"],
        ],
      },
    },
    B: {
      questions: [
        ["debug", "Which habit finds a broken selector fastest?", "Compare the selector with the id used in the HTML", "Change several lines at once", "Rewrite the page from the start", "One comparison and one change at a time shows which change affected the result.", "changes-many-lines-at-once|restarts-the-page"],
        ["access-check", "Why does colour alone never carry a message?", "Some visitors cannot see the difference between the colours", "Colours make the page load slowly", "Colour is not part of the web", "A message needs words as well as colour, or it disappears for some visitors.", "relies-on-colour|thinks-colour-is-unsupported"],
        ["safe-details", "A visitor asks you to publish their full contact details on a public page. What is the responsible answer?", "Explain that personal contact detail stays off the page and offer a general contact route", "Add everything they asked for at once", "Add the details because they asked quickly", "Protecting personal information is part of the professional service you provide.", "publishes-on-request|avoids-the-question"],
        ["release-note", "What should the note say about a feature that is not finished?", "State it as a known limit of this version", "Leave it out so the site looks finished", "Describe it as broken and unusable", "An honest limit sets expectations and shows the work was reviewed.", "hides-the-limits|treats-limits-as-failures"],
        ["tested-release", "What should be recorded after a repair?", "What was expected, what happened and what fixed it", "Only that the page looks better", "Nothing, repairs need no record", "A short record of expected and actual results shows the repair was tested.", "records-only-a-feeling|skips-the-record"],
      ],
      practical: {
        title: "Check the site and write the notes",
        brief: "Repair the script by storing the element you use, make keyboard focus clearly visible, keep personal contact detail off the page, list at least three tested items and keep one h1 with headings that step down in order.",
        focus: "tested-release",
        editable: ["html", "css", "javascript"],
        requirements: [
          ["The repaired script stores the element it uses", js("declaration"), "debug"],
          ["Keyboard focus is clearly visible", focusRing(), "access-check", "accessibility"],
          ["No personal contact detail is published", freeOf("personal-contact"), "safe-details", "privacy"],
          ["The handover notes list at least three tested items", list(3), "release-note"],
          ["One h1 leads and the heading order steps down", headingOrder(), "tested-release"],
        ],
      },
    },
    C: {
      questions: [
        ["debug", "Which habit prevents broken structure in the first place?", "Writing an opening and closing tag together, then filling the content", "Writing all the opening tags first", "Writing the stylesheet before the HTML", "Pairing the tags as you write makes a mismatch visible immediately.", "writes-openers-first|starts-with-css"],
        ["access-check", "Why test the whole site with the keyboard before handover?", "Many visitors navigate without a mouse at all", "The keyboard makes the page faster", "It changes the layout", "Keyboard access is how many people use the site, so it must be tested deliberately.", "thinks-it-is-faster|expects-a-layout-change"],
        ["safe-details", "What should you check before publishing the site?", "Read the page again to confirm no personal detail is visible", "Add your home address for credibility", "Publish a private mobile number for enquiries", "Reviewing the page for personal detail protects you and the people in the photographs.", "adds-a-home-address|adds-a-private-number"],
        ["release-note", "What does a clear version heading help the reader do?", "See which version of the work they are reading", "Change the stylesheet of the site", "Send the enquiry form", "A version heading ties the note to the work it describes.", "confuses-note-with-stylesheet|confuses-note-with-form"],
        ["tested-release", "What does a complete test checklist include?", "Each required part, tested one at a time with a recorded result", "Only the parts that look correct", "A list of features you have not built", "Testing one requirement at a time shows exactly where a failure starts.", "tests-only-the-easy-parts|lists-unbuilt-features"],
      ],
      practical: {
        title: "Repair, verify and release",
        brief: "Repair the script so it selects the real id, describe every image, publish no personal contact detail, list at least three tested items in the notes and keep the page regions including the navigation.",
        focus: "tested-release",
        editable: ["html", "javascript"],
        requirements: [
          ["The repaired script selects the real id", calls("querySelector"), "debug"],
          ["Every image is described in words", imageAlt(), "access-check", "accessibility"],
          ["The page shares no personal contact detail", freeOf("personal-contact"), "safe-details", "privacy"],
          ["The handover notes list at least three tested items", list(3), "release-note"],
          ["The page keeps header, navigation, main and footer", landmarks("header", "nav", "main", "footer"), "tested-release"],
        ],
      },
    },
  },
};

export const adultsAssessment: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: buildModuleForms(courseId, {
    "adults-structure": structure,
    "adults-forms": forms,
    "adults-css-system": cssSystem,
    "adults-responsive": responsive,
    "adults-javascript": javascriptDecisions,
    "adults-data": data,
    "adults-interaction": interaction,
    "adults-quality": quality,
  }),
  finalForms: [],
  defence: [],
};