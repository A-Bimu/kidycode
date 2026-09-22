/*
 * Ages 16 to 18: Web Application Development.
 *
 * Three reviewed forms for every module of the most advanced young-adult course. Each
 * form asks five questions, one for each idea the module teaches, and then one practical
 * task with five marked requirements drawn from the same ideas, so the three forms
 * assess the same objectives at the same difficulty without repeating a question.
 *
 * The language here is the language of the lessons themselves: semantics, accessible
 * controls, a named design system, flexible layout, pure functions, one source of
 * application state, non-mutating collection updates, response.ok, try and catch and
 * finally, stale response guards, and textContent in place of innerHTML. A learner is
 * never asked to infer a rule that the course has not taught.
 *
 * Each module carries five idea slugs. The idea slugs, the difficulty profile and the
 * marked checks are identical in all three forms; only the wording of the questions,
 * the brief and the requirement labels changes, which is what makes the forms
 * equivalent rather than merely similar.
 */

import { buildModuleForms, type AuthoredModule } from "@/lib/assessment/bank/factory";
import {
  assigns,
  avoids,
  breakpoint,
  callback,
  calls,
  currentRequestGuard,
  decl,
  declaresFunction,
  documentMeta,
  el,
  fluidWidth,
  focusRing,
  fragmentLink,
  headingOrder,
  imageAlt,
  js,
  labelledControls,
  landmarks,
  namedValues,
  showsMessage,
  statusRegion,
  usesVar,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "ages-16-18" as const;

/* --------------------------------------------- 1. structure: meaningful HTML -- */

/* The module that turns a draft into a document: regions, a heading outline, links that
   resolve and the metadata a browser needs. */

const structure: AuthoredModule = {
  ideas: {
    landmarks: { slug: "landmarks", lesson: "landmarks", difficulty: "developing", cognitive: "apply" },
    headings: { slug: "headings", lesson: "headings", difficulty: "developing", cognitive: "understand" },
    links: { slug: "links", lesson: "links", difficulty: "developing", cognitive: "apply" },
    metadata: { slug: "metadata", lesson: "metadata", difficulty: "secure", cognitive: "understand" },
    "structure-project": { slug: "structure-project", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["landmarks", "Which element should hold the primary content of a page?", "main", "footer", "nav", "main contains the central content a visitor came for. header introduces the page and footer closes it.", "puts-content-in-the-footer|confuses-main-with-navigation"],
        ["headings", "Why should a page carry exactly one h1 element?", "It names the page and gives every section a level to sit under", "It is the only heading level the browser can style", "It removes the need for section headings", "One main heading names the whole page. Lower levels then describe the sections inside it.", "expects-heading-levels-to-be-sizes|removes-section-headings"],
        ["links", "What must match for a fragment link to reach a section?", "The href after the hash and the id of the destination element", "The link text and the section heading", "The number of links in the navigation", "A fragment link uses a hash and an element id, so the destination has to exist on the page.", "confuses-link-text-with-an-id|expects-a-count-to-match"],
        ["metadata", "What does a viewport meta element with width=device-width do?", "It lets the layout use the real device width instead of a fixed one", "It downloads the images at the correct size", "It sets the language of the document", "The viewport setting tells the browser how wide the layout may be, which is what makes responsive CSS work.", "expects-it-to-resize-images|confuses-viewport-with-language"],
        ["structure-project", "What should be complete before any CSS is written for the project?", "A meaningful outline that reads correctly in source order", "A full colour palette for every region", "A JavaScript file with the first function", "The words and their elements decide the structure. Styling only changes how that structure appears.", "styles-before-structuring|starts-with-scripting"],
      ],
      practical: {
        title: "Build the project structure",
        brief: "In the HTML file, keep the existing words and build the page regions: a header with navigation, a main region holding a topic section and a footer. Give the page one h1, connect a navigation link to a section that exists and put the title and viewport metadata in head.",
        focus: "structure-project",
        editable: ["html"],
        requirements: [
          ["Header, navigation, main and footer regions are present", landmarks("header", "nav", "main", "footer"), "landmarks"],
          ["The heading levels step down from one h1", headingOrder(), "headings"],
          ["A navigation link reaches a section on this page", fragmentLink(), "links"],
          ["The document declares a title and a responsive viewport", documentMeta(), "metadata"],
          ["The topic section holds three articles", el("article", 3), "structure-project"],
        ],
      },
    },
    B: {
      questions: [
        ["landmarks", "Which pair of regions introduces a page and closes it?", "header at the start and footer at the end", "main at the start and nav at the end", "section at the start and article at the end", "header introduces the page and footer closes it, which is exactly what their names promise.", "confuses-main-with-header|confuses-section-with-footer"],
        ["headings", "A section heading appears although the page has no h1. What is the problem?", "The outline starts below the page title, so the page has no stated subject", "The browser refuses to display the section", "The heading is turned into a paragraph", "An outline needs its main heading first, otherwise only the inner part of the subject is named.", "skips-the-page-heading|cuts-the-outline-short"],
        ["links", "What makes the words inside a navigation link useful?", "They name the destination so the link still makes sense read alone", "They say click here so the action is unmistakable", "They repeat the whole page title", "Some visitors read a list of links with no surrounding sentence, so each link has to name where it goes.", "uses-click-here|repeats-the-page-title"],
        ["metadata", "Where does document metadata belong?", "Inside the head element, before the visible content", "Inside the footer at the end of the page", "At the end of the stylesheet", "The head describes the document to the browser. Nothing in it is drawn as page content.", "puts-metadata-in-the-footer|puts-metadata-in-the-stylesheet"],
        ["structure-project", "Which content belongs in an article element?", "A self-contained item that would still make sense on its own", "The whole page introduction", "The navigation links between sections", "An article is one independent piece, which is exactly what a topic card is.", "wraps-the-whole-page|treats-navigation-as-an-article"],
      ],
      practical: {
        title: "Complete the page outline",
        brief: "In the HTML file, complete the outline of the project page: the regions, a heading order that steps down from one h1, a link that reaches a section which exists, three topic articles and the document metadata in head.",
        focus: "structure-project",
        editable: ["html"],
        requirements: [
          ["The page carries header, nav, main and footer regions", landmarks("header", "nav", "main", "footer"), "landmarks"],
          ["One h1 leads a heading order with no skipped level", headingOrder(), "headings"],
          ["A working navigation link reaches a section of this page", fragmentLink(), "links"],
          ["A specific title and the responsive viewport are declared", documentMeta(), "metadata"],
          ["Three articles hold the topic entries", el("article", 3), "structure-project"],
        ],
      },
    },
    C: {
      questions: [
        ["landmarks", "What does a nav element communicate about the links inside it?", "That these links move around this page or site", "That these links open a separate window", "That these are the longest links on the page", "A nav region is understood as the set of links used to move around, wherever it sits.", "expects-a-new-window|confuses-nav-with-link-length"],
        ["headings", "What does a sequence of h1 then h2 then h3 show?", "How the sections nest under one another", "How large each heading will be printed", "The order in which the files load", "Heading levels express relationships, not sizes. Styling decides how large each one looks.", "treats-heading-levels-as-sizes|confuses-headings-with-load-order"],
        ["links", "A link points at #topics but no element carries that id. What happens?", "The link does nothing, because its destination does not exist yet", "The browser creates the missing section automatically", "The link opens the home page instead", "A fragment link can only reach an id that is really on the page, so the id is part of the requirement.", "expects-the-browser-to-create-it|expects-a-fallback-page"],
        ["metadata", "Why write a specific title instead of a single word?", "The title names the page in the browser tab and in search results", "A longer title makes the page load faster", "The title is drawn as the main page heading", "The title is the document's name outside the page itself. The visible main heading is a separate element.", "expects-a-faster-load|confuses-title-with-h1"],
        ["structure-project", "The project page reads correctly in source order. What does that prove?", "The structure carries the meaning, so styling can only improve it", "The page is finished and needs no CSS", "The JavaScript file is no longer required", "A document that reads well before styling has a structure that assistive technology and search services can follow.", "treats-structure-as-finished|drops-the-behaviour"],
      ],
      practical: {
        title: "Structure the whole page",
        brief: "Give the project page its full structure in the HTML file: the large regions, a single h1 with headings that step down from it, a link to a section on the page, a section holding three articles, and the title and viewport metadata in head.",
        focus: "structure-project",
        editable: ["html"],
        requirements: [
          ["The large page regions are all present", landmarks("header", "nav", "main", "footer"), "landmarks"],
          ["The outline starts at one h1 and never skips a level", headingOrder(), "headings"],
          ["Navigation reaches a section that exists on the page", fragmentLink(), "links"],
          ["The document is named and given a responsive viewport", documentMeta(), "metadata"],
          ["A section holds three topic articles", el("article", 3), "structure-project"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------ 2. forms: accessible -- */

/* The module that teaches labels, suitable input types, grouped choices and feedback.
   Its accessibility requirement is mandatory, because a control without a connected
   label is unusable for part of the audience. */

const formsModule: AuthoredModule = {
  ideas: {
    labels: { slug: "labels", lesson: "labels", difficulty: "developing", cognitive: "apply", mandatory: "accessibility" },
    "input-types": { slug: "input-types", lesson: "types", difficulty: "developing", cognitive: "understand" },
    choices: { slug: "choices", lesson: "groups", difficulty: "developing", cognitive: "apply" },
    feedback: { slug: "feedback", lesson: "messages", difficulty: "secure", cognitive: "understand" },
    "form-project": { slug: "form-project", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["labels", "How does assistive technology know which label belongs to which input?", "The label for value matches the input id value", "The label is drawn directly above the input", "The label and the input share a colour", "The matching values create a real connection. Position and colour are not read as a relationship.", "relies-on-position|relies-on-colour"],
        ["input-types", "What does type=email ask the browser to do?", "Check that the value looks like an address and offer a suitable keyboard", "Send the value to a server when the field is finished", "Keep the value in the browser for the next visit", "The type describes the value the field expects. Sending and storing are separate decisions.", "thinks-the-type-sends-data|thinks-the-type-stores-data"],
        ["choices", "Which element names a group of related controls?", "A legend placed inside a fieldset", "A paragraph placed above the group", "An input with type=radio", "fieldset groups the controls and legend gives that whole group its name.", "uses-a-paragraph-as-a-name|treats-one-radio-as-the-group"],
        ["feedback", "Why give a changing message a role of status?", "The message can be announced when it changes, without moving focus", "The message becomes permanently visible on the page", "The form is submitted without a button", "A status region reports a result quietly, so the visitor keeps their place in the page.", "expects-focus-to-move|expects-an-automatic-submit"],
        ["form-project", "What should a project form ask the visitor for?", "Only the one value the project genuinely needs", "Every detail that might be useful later", "A password so the visitor can practise typing one", "A short form is easier to explain, easier to complete and safer to keep.", "collects-everything|requests-a-secret"],
      ],
      practical: {
        title: "Build the accessible form",
        brief: "In the HTML file, build the project form: one visible label connected to each control, a fieldset with a legend that names a related set of choices, and a status paragraph that can report the result of a submission.",
        focus: "form-project",
        editable: ["html"],
        requirements: [
          ["Every form control has a connected label", labelledControls(), "labels"],
          ["Related choices sit inside one fieldset", el("fieldset"), "choices"],
          ["The group carries a legend that names it", el("legend"), "choices"],
          ["Feedback has a region that can be announced", statusRegion(), "feedback"],
          ["The page holds one working form", el("form"), "form-project"],
        ],
      },
    },
    B: {
      questions: [
        ["labels", "A control has no connected label. What does a screen reader user hear?", "The control is announced without saying what it is for", "The control is removed from the page", "The control submits itself with an empty value", "Without a connection the control keeps its role but loses its meaning.", "expects-the-control-to-vanish|expects-an-empty-submit"],
        ["input-types", "Why pair a number input with a minimum and a maximum?", "The browser can warn when the value falls outside the useful range", "The value is rounded to the nearest whole number", "The field becomes required", "The minimum and maximum describe the useful range, which supports the visitor before submission.", "expects-rounding|confuses-a-range-with-required"],
        ["choices", "Why do the radio inputs of one question share a name value?", "Sharing the name ties them into a single choice", "Sharing the name gives them all the same label", "Sharing the name lets every option be chosen at once", "A shared name makes the browser treat the group as one answer with several options.", "expects-one-label-for-all|expects-multiple-answers"],
        ["feedback", "Where should instructions about a field be placed?", "Near the field and connected to it, so the words are read with the control", "Only in the footer of the page", "Inside the stylesheet as a comment", "Help that is attached to the control arrives at the moment it is needed.", "hides-help-in-the-footer|writes-help-as-a-comment"],
        ["form-project", "Which combination keeps a form usable with touch and keyboard?", "A visible label and a control the keyboard can reach", "A placeholder with no label at all", "A colour that marks which field is wrong", "The label names the control and the keyboard path proves it can be operated by anyone.", "uses-a-placeholder-as-a-label|relies-on-colour-only"],
      ],
      practical: {
        title: "Connect labels and feedback",
        brief: "In the HTML file, connect a visible label to each control, group the related choices in a fieldset with a legend, and give the form a status region so a result can be reported without moving the visitor out of the page.",
        focus: "form-project",
        editable: ["html"],
        requirements: [
          ["Every control is named by a label that is connected to it", labelledControls(), "labels"],
          ["A related set of choices is grouped in one fieldset", el("fieldset"), "choices"],
          ["The group is named by its legend", el("legend"), "choices"],
          ["A result can be reported in a live region", statusRegion(), "feedback"],
          ["The project collects information in one form", el("form"), "form-project"],
        ],
      },
    },
    C: {
      questions: [
        ["labels", "What does clicking a properly connected label do?", "It moves the focus into the control the label names", "It submits the form straight away", "It clears whatever was already typed", "The label becomes part of the control, so selecting it works like selecting the field.", "thinks-a-label-submits|thinks-a-label-clears"],
        ["input-types", "Which input type suits a field that expects a calendar date?", "type=date", "type=text with a written hint", "type=submit", "The narrowest suitable type gives the browser enough information to help the visitor.", "keeps-everything-as-text|confuses-a-field-with-a-button"],
        ["choices", "What does a fieldset group?", "The controls that answer one shared question", "Every control on the whole page", "The submit button and the status message", "One question with several answers is exactly what a fieldset names.", "groups-the-whole-form|groups-unrelated-parts"],
        ["feedback", "What belongs in a validation message?", "What is wrong and the next action the visitor can take", "The internal name of the function that stopped the code", "A reminder of the visitor's password", "A useful message states the problem in ordinary words and points at the next step.", "exposes-internal-detail|mentions-a-secret"],
        ["form-project", "Why is collecting less information better for this project?", "Fewer fields are easier to explain and safer to keep", "Fewer fields make the page load faster", "Fewer fields remove the need for a form", "Each field is a promise about why the value is needed, so the shortest honest form wins.", "justifies-fields-by-speed|treats-fields-as-unnecessary"],
      ],
      practical: {
        title: "Finish the accessible form",
        brief: "In the HTML file, finish the form so that every control is introduced by a connected label, the related choices sit in a fieldset with a legend, and the submission result is reported in a live region.",
        focus: "form-project",
        editable: ["html"],
        requirements: [
          ["No control is left without a connected label", labelledControls(), "labels"],
          ["The related choices share one fieldset", el("fieldset"), "choices"],
          ["A legend explains what the group asks for", el("legend"), "choices"],
          ["Submission feedback has a region to arrive in", statusRegion(), "feedback"],
          ["A form carries the project's one request", el("form"), "form-project"],
        ],
      },
    },
  },
};

/* ----------------------------------------- 3. css-system: a consistent system -- */

/* The module that turns a stylesheet into a system: component selectors, the box model,
   named design values and visible interaction states. Keyboard focus is marked as a
   mandatory accessibility requirement, because it is how a keyboard user finds their
   place on the page. */

const cssSystem: AuthoredModule = {
  ideas: {
    selectors: { slug: "selectors", lesson: "selectors", difficulty: "developing", cognitive: "apply" },
    "box-model": { slug: "box-model", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
    tokens: { slug: "tokens", lesson: "tokens", difficulty: "secure", cognitive: "apply" },
    "interactive-states": { slug: "interactive-states", lesson: "states", difficulty: "secure", cognitive: "evaluate", mandatory: "accessibility" },
    "css-project": { slug: "css-project", lesson: "project", difficulty: "secure", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["selectors", "When is a class selector better than styling an element by name?", "When several elements share one component style", "When exactly one element on the page exists", "When the rule must apply to every element", "A class is a reusable styling hook, so one rule can dress many components without repeating itself.", "styles-one-element-at-a-time|expects-a-rule-for-everything"],
        ["box-model", "Where does margin create space?", "Outside the element, separating it from its neighbours", "Between the content and the border", "Inside the text itself", "Margin is the space around a box. Padding is the space inside it.", "confuses-margin-and-padding|expects-margin-inside"],
        ["tokens", "Why define a design value once as a custom property?", "One edit then updates every rule that calls it", "It removes the need for a stylesheet", "It changes the names of the HTML elements", "A named value is a decision recorded in one place, which is what keeps a system consistent.", "expects-the-stylesheet-to-disappear|thinks-tokens-change-markup"],
        ["interactive-states", "What must a focus-visible rule provide?", "A clear outline that shows which control the keyboard has reached", "A subtle colour change that is easy to miss", "A larger font size for the focused control", "Focus is a position, so it needs an indicator that survives any colour choice.", "relies-on-a-colour-shift|confuses-focus-with-type-size"],
        ["css-project", "What makes a project look deliberate rather than random?", "A small set of repeated choices for colour, type and space", "A different style for every single element", "As many typefaces as the page can load", "A visual system is a few decisions applied consistently everywhere.", "styles-every-element-differently|adds-fonts-at-random"],
      ],
      practical: {
        title: "Create the visual system",
        brief: "In the CSS file, style the repeated card as a component, put the box model on a known footing, name the design values the page reuses, make keyboard focus clearly visible and call the named values from your rules.",
        focus: "css-project",
        editable: ["css"],
        requirements: [
          ["A component rule gives the repeated card inner space", decl("padding", "padding", ".card"), "selectors"],
          ["Every box counts its border inside its declared width", decl("box-sizing", "border-box"), "box-model"],
          ["Repeated design values are named once", namedValues(3), "tokens"],
          ["Keyboard focus is clearly visible", focusRing(), "interactive-states", "accessibility"],
          ["Rules reuse the values that were named", usesVar(2), "css-project"],
        ],
      },
    },
    B: {
      questions: [
        ["selectors", "Why is a class a stable styling hook for a component?", "The name stays with the element even when its position changes", "The name changes every time the page loads", "The name has to match the element tag", "A class travels with the element, which is why component styles survive a new layout.", "expects-the-name-to-change|confuses-a-class-with-a-tag"],
        ["box-model", "What does box-sizing: border-box keep true?", "The declared width includes the padding and the border", "Every element on the page becomes the same width", "Margins are ignored while the page is laid out", "Border-box sizing keeps the arithmetic honest, so a declared width means the whole box.", "expects-equal-widths|expects-margins-to-vanish"],
        ["tokens", "Where are shared custom properties usually defined?", "In a :root rule that every other rule can call", "Inside each component rule over and over", "In the HTML as an attribute value", "Defining the value once at the root makes it available to the whole stylesheet.", "repeats-the-value-per-rule|puts-values-in-markup"],
        ["interactive-states", "Why is colour alone a weak focus indicator?", "A visitor who cannot see that difference misses the position entirely", "Colour makes the page load slowly", "Colour cannot be written in a stylesheet", "An indicator has to work for everyone, so an outline carries the message as well.", "relies-on-colour-only|thinks-colour-is-unavailable"],
        ["css-project", "What should be checked before decorative detail is added?", "That the content stays readable and the spacing is consistent", "That the page uses at least six typefaces", "That every element has an animation", "Readability and rhythm come first. Decoration is added to a system that already works.", "decorates-before-reading|adds-motion-first"],
      ],
      practical: {
        title: "Style the project consistently",
        brief: "In the CSS file, build the visual system for the same project: a card component with inner space, border-box sizing, named values that are reused, and a visible keyboard focus state that a visitor can actually see.",
        focus: "css-project",
        editable: ["css"],
        requirements: [
          ["The card component has inner spacing", decl("padding", "padding", ".card"), "selectors"],
          ["Sizing counts the border inside the width", decl("box-sizing", "border-box"), "box-model"],
          ["Design decisions are recorded as named values", namedValues(3), "tokens"],
          ["A keyboard user can see where the focus is", focusRing(), "interactive-states", "accessibility"],
          ["Component rules call the named values", usesVar(2), "css-project"],
        ],
      },
    },
    C: {
      questions: [
        ["selectors", "What does choosing the least specific selector that does the job give you?", "A rule that cannot accidentally style unrelated content", "A rule that applies to every element on the page", "A rule the browser silently ignores", "Specificity is a cost. The smallest selector that names the job is the one that stays safe.", "expects-one-rule-for-all|expects-the-browser-to-ignore-it"],
        ["box-model", "An element has padding but no border. Where does the padding sit?", "Between the content and the outer edge of the element", "Outside the element, around its neighbours", "Behind the background only", "Padding always opens the inside of the box, whether or not a border is drawn.", "expects-padding-outside|expects-padding-behind"],
        ["tokens", "Which value deserves a name of its own?", "One that repeats across the project and would be painful to change", "One that is used exactly once and never again", "One that appears only in a comment", "A token earns its name by being reused, because that is where a single edit pays off.", "names-a-value-used-once|names-a-comment"],
        ["interactive-states", "When should a hover treatment be added?", "After the base control is readable and focus is clearly visible", "Before the base control has any style at all", "Instead of a focus style, to keep the stylesheet short", "Hover is an enhancement. Focus is a requirement, so it is never traded for a hover effect.", "styles-hover-first|replaces-focus-with-hover"],
        ["css-project", "How do you know a rule affected the intended part of the page?", "You change one rule, run the page and inspect that part", "You change many rules and hope the page improves", "You read the stylesheet again without running it", "One change plus one observation is what turns a guess into evidence.", "changes-everything-at-once|reads-without-running"],
      ],
      practical: {
        title: "Make the page look deliberate",
        brief: "In the CSS file, give the project its visual system: inner space on the repeated card, border-box sizing, three named values, a visible focus state and rules that call those named values instead of repeating raw numbers.",
        focus: "css-project",
        editable: ["css"],
        requirements: [
          ["The repeated card has inner space", decl("padding", "padding", ".card"), "selectors"],
          ["Declared widths include the border and the padding", decl("box-sizing", "border-box"), "box-model"],
          ["The system records its decisions as named values", namedValues(3), "tokens"],
          ["Focus is visible for a keyboard user", focusRing(), "interactive-states", "accessibility"],
          ["Rules read from the named values", usesVar(2), "css-project"],
        ],
      },
    },
  },
};

/* ------------------------------------------------- 4. responsive: flexible layout */

/* The module that starts from the narrow layout and adds flexible tracks, a wrapping
   navigation row and one meaningful breakpoint. */

const responsive: AuthoredModule = {
  ideas: {
    viewport: { slug: "viewport", lesson: "viewport", difficulty: "developing", cognitive: "understand" },
    "flex-row": { slug: "flex-row", lesson: "flex", difficulty: "developing", cognitive: "apply" },
    "grid-columns": { slug: "grid-columns", lesson: "grid", difficulty: "secure", cognitive: "apply" },
    "media-query": { slug: "media-query", lesson: "media", difficulty: "secure", cognitive: "evaluate" },
    "responsive-project": { slug: "responsive-project", lesson: "project", difficulty: "advanced", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["viewport", "What does a mobile-first stylesheet use as its default?", "The narrow layout that works before any media query applies", "The widest layout with every column already open", "A fixed width copied from a desktop screen", "The default rules protect the smallest supported screen. Wider layouts are added on top.", "starts-from-desktop|hard-codes-a-width"],
        ["flex-row", "Which element should receive display: flex for a navigation row?", "The parent that holds the links", "Each link in the row", "The body of the page", "The container becomes the flex container; its children are the items being arranged.", "styles-each-item|styles-the-body"],
        ["grid-columns", "What does 1fr mean in a track list?", "One equal share of the space that is available", "One fixed pixel width", "One row of content", "The fr unit divides available space, which is why it adapts without measuring.", "thinks-fr-is-fixed|confuses-a-track-with-a-row"],
        ["media-query", "How should the width of a breakpoint be chosen?", "Where the content starts to feel cramped", "From the age of the visitor", "At every width any device list mentions", "The layout announces where it needs more room, so the content chooses the width.", "chooses-by-device-list|adds-a-breakpoint-per-width"],
        ["responsive-project", "What must never appear when the page is narrow?", "Sideways scrolling to reach the content", "Text that wraps onto a second line", "A list that becomes taller than before", "Content wider than the viewport makes a page unpleasant to use on a phone.", "accepts-horizontal-scrolling|removes-content-instead"],
      ],
      practical: {
        title: "Build the responsive layout",
        brief: "In the CSS file, make the project fit the available space: keep the width fluid, arrange the navigation as a flexible row, give the card group flexible grid tracks, add a breakpoint where the layout changes and keep a consistent gap between the repeated parts.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The layout width stays tied to the available space", fluidWidth(), "viewport"],
          ["The navigation is arranged as a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["The card group uses flexible grid tracks", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["A breakpoint changes the layout", breakpoint(700), "media-query"],
          ["The repeated parts keep a consistent gap", decl("gap", "gap", ".cards"), "responsive-project"],
        ],
      },
    },
    B: {
      questions: [
        ["viewport", "Why keep a container width tied to the available space?", "The layout then stays inside the viewport on every screen", "The browser then downloads fewer images", "It removes the need for any media query", "A fluid width is the default that makes the narrow case work before enhancements arrive.", "expects-fewer-downloads|expects-no-breakpoints"],
        ["flex-row", "What allows a row of links to continue onto a second line?", "flex-wrap: wrap on the container", "A wider border on each link", "A media query on every link", "Wrapping lets a flex row move onto the next line instead of forcing the page wider.", "expects-borders-to-wrap|wraps-with-a-media-query"],
        ["grid-columns", "Which value lets Grid create as many usable columns as fit?", "repeat(auto-fit, minmax(15rem, 1fr))", "repeat(3, 240px)", "width: 50% on every card", "Auto-fit with minmax lets the browser decide the number of tracks from the space it has.", "fixes-the-column-count|sets-widths-instead"],
        ["media-query", "What belongs inside a media query?", "Only the rules that change at that width", "The whole stylesheet repeated for safety", "The HTML of the page", "A short media query shows exactly what changes at the breakpoint and why.", "repeats-the-stylesheet|puts-markup-inside"],
        ["responsive-project", "What stays the same when the layout changes at a breakpoint?", "The content and the actions a visitor can take", "The exact number of columns", "The fixed width of every card", "Only the arrangement may change. The meaning and the available actions must not.", "expects-the-content-to-shrink|removes-actions-on-phones"],
      ],
      practical: {
        title: "Arrange the project for every screen",
        brief: "In the CSS file, arrange the project so it survives every width: a fluid container, a navigation row that can wrap, flexible grid tracks for the cards, a gap that stays consistent and one breakpoint that changes the arrangement.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The container keeps its width tied to the viewport", fluidWidth(), "viewport"],
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["The cards are arranged in flexible grid tracks", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["The layout changes at a chosen breakpoint", breakpoint(700), "media-query"],
          ["The cards keep an even gap between them", decl("gap", "gap", ".cards"), "responsive-project"],
        ],
      },
    },
    C: {
      questions: [
        ["viewport", "Which value keeps a container fluid?", "A percentage, a min() or a maximum width in relative units", "A fixed pixel width chosen once", "A count of characters in the longest paragraph", "A fluid value follows the space it is given instead of assuming a particular screen.", "hard-codes-pixels|measures-the-text"],
        ["flex-row", "Which pair arranges navigation links with even space between them?", "display: flex with a gap on the container", "display: grid with no gap at all", "A fixed width on each link", "A flex container plus a gap spaces the row without hand measuring anything.", "expects-fixed-widths|omits-the-gap"],
        ["grid-columns", "What does Grid handle that a single Flexbox row does not do as well?", "Rows and columns at the same time", "The text inside each item", "The number of files in the project", "Two-dimensional arrangement is what Grid was designed for.", "expects-grid-to-edit-text|confuses-grid-with-files"],
        ["media-query", "Why begin with the narrow layout?", "The smallest screen is protected before any enhancement is added", "Narrow screens are the only screens supported", "Wide screens cannot read media queries", "Starting narrow means every wider case is an addition rather than a repair.", "supports-one-screen-only|thinks-wide-screens-ignore-queries"],
        ["responsive-project", "What should be checked at several widths?", "That nothing overflows and every control is still reachable", "That the colours stay byte for byte identical", "That the files stay below a size limit", "Overflow and unreachable controls are the two failures that break a phone layout.", "checks-colour-identity|checks-file-size"],
      ],
      practical: {
        title: "Make the project fit every width",
        brief: "In the CSS file, finish the responsive project: a fluid container width, a wrapping navigation row, flexible card tracks with a gap, and a breakpoint that rearranges the cards instead of shrinking them.",
        focus: "responsive-project",
        editable: ["css"],
        requirements: [
          ["The width follows the space that is available", fluidWidth(), "viewport"],
          ["Navigation sits in a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["Flexible tracks arrange the cards", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["A meaningfully chosen breakpoint adapts the layout", breakpoint(700), "media-query"],
          ["A gap separates the repeated cards", decl("gap", "gap", ".cards"), "responsive-project"],
        ],
      },
    },
  },
};

/* --------------------------------------- 5. javascript: application logic layer -- */

/* The module that separates logic from presentation: pure functions, records with named
   properties, a filtered collection derived without mutation and an ordered copy. */

const applicationLogic: AuthoredModule = {
  ideas: {
    "pure-functions": { slug: "pure-functions", lesson: "pure-functions", difficulty: "secure", cognitive: "apply" },
    records: { slug: "records", lesson: "objects", difficulty: "secure", cognitive: "understand" },
    filter: { slug: "filter", lesson: "filter", difficulty: "secure", cognitive: "apply" },
    sort: { slug: "sort", lesson: "sort", difficulty: "advanced", cognitive: "analyse" },
    "logic-project": { slug: "logic-project", lesson: "project", difficulty: "advanced", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["pure-functions", "What makes a function pure?", "It returns the same result for the same inputs and changes nothing outside itself", "It always updates the page when it runs", "It hides its parameters from the caller", "A pure function depends only on what it is given, which is why it can be tested without a page.", "expects-a-page-change|hides-the-inputs"],
        ["records", "Why give every record the same property names?", "One function can then read every record the same way", "The records then sort themselves automatically", "The property names become shorter in memory", "Consistent shapes are what let a single loop handle a whole collection.", "varies-the-property-names|expects-automatic-sorting"],
        ["filter", "What does filter return?", "A new array holding only the items that passed the test", "Only the first matching item", "The original array with items removed in place", "Filter derives a collection. The array it was called on is left untouched.", "returns-one-item|mutates-the-source"],
        ["sort", "Why copy an array before sorting it?", "Sort changes the array it runs on, so the original must be protected", "Sorting a copy is faster in every browser", "A copy removes any duplicate values", "The source of truth must survive an ordering step, which is why the copy comes first.", "sorts-the-source-in-place|expects-duplicates-removed"],
        ["logic-project", "What does a named function give the project?", "One job with a name that can be tested on its own", "A shorter file with fewer lines", "A reason to remove the HTML", "A named job can be called, tested and explained without reading the whole file.", "judges-a-function-by-length|expects-it-to-replace-markup"],
      ],
      practical: {
        title: "Build the logic layer",
        brief: "In the JavaScript file, build the logic the interface will use: a function that takes its inputs as parameters, one record modelled with named properties, a filtered collection derived through a tested callback, an ordered copy of the records, and the result written to the page as text.",
        focus: "logic-project",
        editable: ["javascript"],
        requirements: [
          ["A function takes the values it needs as parameters", declaresFunction(2), "pure-functions"],
          ["One record is modelled with named properties", js("object-literal"), "records"],
          ["A filtered collection comes from a tested callback", callback("filter", { needsReturn: true, needsComparison: true }), "filter"],
          ["An ordered copy is produced without changing the source", calls("sort"), "sort"],
          ["The result is written to the page as plain text", assigns("textContent"), "logic-project"],
        ],
      },
    },
    B: {
      questions: [
        ["pure-functions", "Which function can be tested with two pairs of inputs and no page at all?", "One that only calculates from its parameters and returns the result", "One that reads the clock and writes to the page", "One that waits for a click before doing anything", "No hidden inputs and no side effects means the result can be predicted from the arguments alone.", "depends-on-the-clock|waits-for-an-event"],
        ["records", "What keeps a record identifiable after sorting or filtering?", "A stable id that belongs to that record", "Its current position in the array", "The colour used to display it", "Position changes as a collection is reordered, so identity has to live in the data.", "trusts-the-position|uses-a-display-detail"],
        ["filter", "What must the callback passed to filter produce?", "A true or false result for each item", "A new array for each item", "A string of markup for each item", "Filter keeps the items whose callback answered true, so the callback returns a decision.", "returns-an-array-per-item|returns-markup"],
        ["sort", "What does spread syntax such as [...items] create?", "A new array holding the same items", "One string with every item joined together", "A copy of the page structure", "Spread copies the values into a new array, leaving the original where it is.", "joins-items-into-a-string|copies-the-page"],
        ["logic-project", "Where should the decision that chooses a message live?", "Inside a small function that produces one clear result", "Spread across several unrelated lines of the file", "In the stylesheet as a comment", "A decision inside a named function can be tested at both the true and the false boundary.", "scatters-the-decision|writes-it-as-a-comment"],
      ],
      practical: {
        title: "Separate logic from the page",
        brief: "In the JavaScript file, keep the application logic in its own functions: one function with parameters that returns a result, a record with named properties, a filter that keeps part of the collection, a sorted copy that leaves the source alone, and the finished value written as text.",
        focus: "logic-project",
        editable: ["javascript"],
        requirements: [
          ["A named function receives its inputs as parameters", declaresFunction(2), "pure-functions"],
          ["The records share one named shape", js("object-literal"), "records"],
          ["Part of the collection is kept by a comparison", callback("filter", { needsReturn: true, needsComparison: true }), "filter"],
          ["The records are ordered through a copied array", calls("sort"), "sort"],
          ["The page receives the value as text", assigns("textContent"), "logic-project"],
        ],
      },
    },
    C: {
      questions: [
        ["pure-functions", "A function writes to the page and also returns a value. Why is it harder to test?", "Its result depends on the page as well as its inputs", "It returns too many characters", "It cannot be called a second time", "A hidden dependency means the same inputs can produce different outcomes.", "confuses-length-with-testing|expects-a-single-call"],
        ["records", "What does one object represent in this module?", "A record whose related values have names", "One line of the stylesheet", "One HTML element only", "An object groups the fields of one record so other functions can read them by name.", "confuses-records-with-css|treats-a-record-as-markup"],
        ["filter", "Which call keeps only the records that are available?", "records.filter(function (record) { return record.available === true; })", "records.map(function (record) { return record.title; })", "records.sort(function (a, b) { return a.id - b.id; })", "Filter keeps the items whose callback answered true, and the strict comparison keeps that decision explicit.", "maps-instead-of-filtering|sorts-instead-of-filtering"],
        ["sort", "Which comparison orders records by title?", "a.title.localeCompare(b.title)", "a.title + b.title", "a.length - b.length", "The comparison function returns a negative, zero or positive number, which is exactly what an order needs.", "joins-the-titles|compares-the-wrong-fields"],
        ["logic-project", "What should be checked before a calculation is placed on the page?", "The function's returned value for a known pair of inputs", "The page colours at two screen widths", "The number of lines in the file", "The return value is the evidence. Rendering afterwards shows that the verified value travels.", "checks-presentation-first|counts-the-lines"],
      ],
      practical: {
        title: "Test the logic then render it",
        brief: "In the JavaScript file, write the logic for the project: a function that takes its values as parameters, a record with named properties, a filtered view of the collection, a sorted copy and the final value shown on the page as text.",
        focus: "logic-project",
        editable: ["javascript"],
        requirements: [
          ["A function is defined with the parameters it needs", declaresFunction(2), "pure-functions"],
          ["One record carries named properties", js("object-literal"), "records"],
          ["A callback decides which records are kept", callback("filter", { needsReturn: true, needsComparison: true }), "filter"],
          ["An ordered copy is made from the records", calls("sort"), "sort"],
          ["A value is written to the page as text", assigns("textContent"), "logic-project"],
        ],
      },
    },
  },
};

/* -------------------------------------- 6. data: application state and CRUD ------ */

/* The module that keeps one source of truth and changes it immutably: create with a new
   array, update by stable id, delete by deriving a collection without one id. */

const applicationState: AuthoredModule = {
  ideas: {
    state: { slug: "state", lesson: "state", difficulty: "advanced", cognitive: "understand" },
    create: { slug: "create", lesson: "create", difficulty: "advanced", cognitive: "apply" },
    update: { slug: "update", lesson: "update", difficulty: "advanced", cognitive: "analyse" },
    delete: { slug: "delete", lesson: "delete", difficulty: "advanced", cognitive: "apply" },
    "data-project": { slug: "data-project", lesson: "project", difficulty: "advanced", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["state", "Why keep one state object instead of several loose variables?", "The interface can be rebuilt from one trusted source of truth", "The values become impossible to change", "It removes the need for any testing", "One place that holds the current information is what keeps the interface from disagreeing with itself.", "scatters-state-everywhere|thinks-state-replaces-tests"],
        ["create", "What does an immutable create do?", "It assigns a new array holding the earlier records and the new one", "It pushes the new record into the existing array", "It replaces every earlier record with the new one", "A new array makes the change visible as a before and after, which is what makes it traceable.", "mutates-with-push|loses-the-earlier-records"],
        ["update", "Why update a record by id rather than by position?", "The record stays identifiable after sorting or filtering", "Ids are always shorter than positions", "Positions cannot be read in JavaScript", "Identity has to survive reordering, and only the id is guaranteed to travel with the record.", "trusts-the-index|thinks-indexes-are-unreadable"],
        ["delete", "Which method derives a collection with one record removed?", "filter, keeping every record whose id is not the removed id", "map, returning the record that should be removed", "sort, placing the removed record at the end", "Filter builds a new array from the records that pass one condition, which is exactly a delete.", "uses-map-to-delete|expects-sorting-to-remove"],
        ["data-project", "What should happen after a successful state change?", "The visible list is rendered again from the new state", "The page is reloaded by hand", "The HTML file is edited to match", "State first, then render, is the order that keeps the page and the data in agreement.", "reloads-the-page|edits-markup-instead"],
      ],
      practical: {
        title: "Build the state and CRUD layer",
        brief: "In the JavaScript file, keep one state object and change it immutably: add a record as a new array, replace one record by its stable id, derive a collection with a record removed, and render each remaining record into the page.",
        focus: "data-project",
        editable: ["javascript"],
        requirements: [
          ["The application keeps one state object", js("object-literal"), "state"],
          ["A new record is added as a new array", js("spread"), "create"],
          ["One record is replaced by its stable id", calls("map"), "update"],
          ["A record is removed without mutating the source", callback("filter", { needsReturn: true, needsComparison: true }), "delete"],
          ["Each remaining record is rendered into the page", js("append"), "data-project"],
        ],
      },
    },
    B: {
      questions: [
        ["state", "What does the state object hold in this module?", "The current records and any filter the interface is using", "The CSS rules of the page", "The browser history", "State is the information the interface is currently representing, nothing more.", "confuses-state-with-styling|stores-unrelated-information"],
        ["create", "Why validate a new record before adding it?", "An empty title should never become part of state", "Validation makes the array shorter", "Validation saves the record to the server", "The cheapest place to stop bad data is before it joins the source of truth.", "admits-invalid-records|expects-a-server"],
        ["update", "What does object spread such as { ...record, title } produce?", "A copy of the record with one property replaced", "The same record with its id removed", "A new array of records", "Object spread copies the existing fields, so only the named property changes.", "drops-the-other-fields|expects-a-new-array"],
        ["delete", "Why is a filter-based delete predictable?", "Every record except the chosen id is kept, whatever its position", "It removes whichever record sits last in the array", "It empties the whole collection first", "The condition is stated in terms of identity, so the result does not depend on ordering.", "removes-by-position|clears-then-restores"],
        ["data-project", "Which test proves the create step works?", "Adding a record and seeing one extra item rendered", "Changing the page colours", "Deleting the state object", "One more record in and one more item out is the evidence that create reached the page.", "judges-by-appearance|tests-by-removing-state"],
      ],
      practical: {
        title: "Change state and render it",
        brief: "In the JavaScript file, work through the create, update and delete steps on one state object: add a record with a new array, replace a record by id, derive a collection without one id, and render every remaining record into the page.",
        focus: "data-project",
        editable: ["javascript"],
        requirements: [
          ["The current information lives in one state object", js("object-literal"), "state"],
          ["A record joins the collection as a new array", js("spread"), "create"],
          ["A matching record is replaced by id", calls("map"), "update"],
          ["One id is left out of a derived collection", callback("filter", { needsReturn: true, needsComparison: true }), "delete"],
          ["Every remaining record reaches the page", js("append"), "data-project"],
        ],
      },
    },
    C: {
      questions: [
        ["state", "Which habit keeps a single source of truth?", "Changing state first and rendering the page from it", "Changing the rendered page and leaving state alone", "Storing the same list twice in two arrays", "One direction of flow means the page can always be rebuilt from the data.", "renders-then-forgets-state|keeps-two-copies"],
        ["create", "What should a create function return when the title is empty?", "A clear failure result the caller can act on", "A new record with an empty title", "The whole state object unchanged, with no explanation", "A refusal the caller can see is what lets the interface explain why nothing was added.", "admits-an-empty-record|fails-silently"],
        ["update", "Which array method suits an update by id?", "map, returning the updated copy for the match and the original for the rest", "filter, removing every record that does not match", "sort, ordering the records by id", "Map visits every record and returns a value for each, which is exactly one replaced and the rest untouched.", "filters-away-the-others|reorders-instead-of-updating"],
        ["delete", "What happens to the record that is removed?", "It is left out of the new array while the original array is left alone", "It is moved to the end of the array", "It is kept but given an empty title", "A derived array holds the survivors. The collection it came from is never edited in place.", "reorders-instead-of-removing|blanks-the-record"],
        ["data-project", "What is the strongest evidence that delete works?", "The count drops by one and every other record is unchanged", "The file becomes shorter", "The list is hidden from the page", "A count before and after, with the survivors intact, proves exactly one record left.", "judges-by-file-length|hides-the-list"],
      ],
      practical: {
        title: "Trace every state change",
        brief: "In the JavaScript file, make every change to the project state traceable: one state object, a create that assigns a new array, an update that replaces one record by id, a delete that derives a collection without an id, and a render step for the survivors.",
        focus: "data-project",
        editable: ["javascript"],
        requirements: [
          ["One object holds the current records", js("object-literal"), "state"],
          ["The new record arrives in a new array", js("spread"), "create"],
          ["The matching record is replaced through map", calls("map"), "update"],
          ["The removed id is excluded by a condition", callback("filter", { needsReturn: true, needsComparison: true }), "delete"],
          ["The survivors are appended to the page", js("append"), "data-project"],
        ],
      },
    },
  },
};

/* ---------------------------------------- 7. interaction: external data and states */

/* The module that treats a request as something that can be slow, empty or failed, and
   that can arrive out of order. */

const externalData: AuthoredModule = {
  ideas: {
    fetch: { slug: "fetch", lesson: "fetch", difficulty: "advanced", cognitive: "understand" },
    loading: { slug: "loading", lesson: "loading", difficulty: "advanced", cognitive: "apply" },
    errors: { slug: "errors", lesson: "errors", difficulty: "advanced", cognitive: "analyse" },
    "stale-results": { slug: "stale-results", lesson: "abort", difficulty: "advanced", cognitive: "evaluate" },
    "interaction-project": { slug: "interaction-project", lesson: "project", difficulty: "advanced", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["fetch", "Why check response.ok before reading the body?", "A completed request can still carry an error status", "JSON cannot be read without that check", "It creates the request in the first place", "A response is not the same thing as a success, so the status has to be inspected explicitly.", "assumes-completion-means-success|expects-json-to-self-check"],
        ["loading", "When should the loading message appear?", "Before the awaited request begins", "Only after the request fails", "After the results have been rendered", "Immediate feedback shows the action was received while the visitor waits.", "shows-loading-too-late|shows-it-only-on-error"],
        ["errors", "Which block receives an error thrown inside try?", "catch", "finally", "the next function in the file", "catch exists to receive the failure, while finally runs whatever the outcome was.", "confuses-catch-with-finally|expects-the-next-function"],
        ["stale-results", "Why can an older request overwrite newer results?", "Requests finish in whatever order the network allows", "HTML rewrites the order of the requests", "CSS caches the responses", "Completion order is not start order, so the code has to guard against a late arrival.", "expects-requests-to-finish-in-order|blames-the-stylesheet"],
        ["interaction-project", "What makes an asynchronous interface trustworthy?", "Loading, empty, success and error states are all shown explicitly", "Errors are hidden from the visitor", "Every request is assumed to succeed", "Each possible outcome has a visible message, so the visitor is never left guessing.", "hides-failures|assumes-success"],
      ],
      practical: {
        title: "Load data and show every state",
        brief: "In the JavaScript file, load the project data and show what is happening: request the data, show a message for the loading and outcome states, handle a failure with try and catch, ignore a stale response, and run the cleanup whatever the outcome.",
        focus: "interaction-project",
        editable: ["javascript"],
        requirements: [
          ["The data is requested from an address", calls("fetch"), "fetch"],
          ["A message reports what the interface is doing", showsMessage("Loading...", "No results", "Ready"), "loading"],
          ["A failed request is caught and explained", js("try-catch"), "errors"],
          ["An older response can never replace a newer one", currentRequestGuard(), "stale-results"],
          ["Cleanup runs whatever the outcome was", js("finally"), "interaction-project"],
        ],
      },
    },
    B: {
      questions: [
        ["fetch", "What does an asynchronous function return while it waits?", "A promise for the value that will arrive later", "The finished value immediately", "A string of JSON", "The promise is a placeholder for the result, which is why the value is awaited.", "expects-an-immediate-value|expects-a-string"],
        ["loading", "What should the interface show when a request succeeds with no records?", "A clear empty state that explains there is nothing to show", "The last loading message left on screen", "An error message about the network", "An empty result is a success with nothing in it, so it needs its own honest message.", "leaves-loading-on-screen|reports-an-empty-result-as-an-error"],
        ["errors", "When does the finally block run?", "After the work succeeds or after it fails", "Only when an error is thrown", "Before the try block starts", "Finally is for the work that must happen either way, such as restoring a control.", "assumes-finally-means-failure|runs-before-the-try"],
        ["stale-results", "What is the captured request id compared against after the await?", "The latest id, so an earlier request can be ignored", "The number of records that came back", "The length of the address", "Comparing the captured id with the current one is what identifies a stale response.", "compares-record-counts|compares-url-length"],
        ["interaction-project", "What should a failure message contain?", "A plain next step such as trying again", "The internal names of the functions that ran", "The visitor's private data", "A useful message tells the visitor what they can do next, not how the code is written.", "exposes-internal-names|reveals-private-data"],
      ],
      practical: {
        title: "Represent loading, empty and failure",
        brief: "In the JavaScript file, make every state of the request visible: request the data, show loading and outcome messages, catch and explain a failure, guard against a stale response and run the cleanup after success or failure.",
        focus: "interaction-project",
        editable: ["javascript"],
        requirements: [
          ["The data comes from a requested address", calls("fetch"), "fetch"],
          ["The interface says what state it is in", showsMessage("Loading...", "No results", "Ready"), "loading"],
          ["A failure is caught and given a message", js("try-catch"), "errors"],
          ["A stale response is recognised and ignored", currentRequestGuard(), "stale-results"],
          ["Work that must always happen is finished in finally", js("finally"), "interaction-project"],
        ],
      },
    },
    C: {
      questions: [
        ["fetch", "Which response must be treated as a failure even though the request completed?", "A response whose ok property is false", "A response that returns an empty array", "A response that took longer than a second", "An HTTP error still arrives as a completed request, so only the status can tell the difference.", "treats-an-empty-array-as-an-error|judges-by-speed"],
        ["loading", "Why set the loading state before awaiting?", "The visitor sees that the action was received while they wait", "It shortens the request", "It replaces the need for error handling", "Feedback before the wait is what separates a slow interface from a broken one.", "expects-a-faster-request|skips-error-handling"],
        ["errors", "What does catch receive?", "The error that was thrown inside try", "The value that try returned", "A copy of the request", "The error object carries what went wrong, which is what the message is built from.", "expects-a-return-value|expects-the-request-again"],
        ["stale-results", "Which guard ignores a stale response?", "Returning early when the captured id no longer matches the latest id", "Rendering the older response last so it is visible", "Sorting the responses by size before rendering", "The early return stops an old result before it can touch the page.", "renders-the-old-result|sorts-responses"],
        ["interaction-project", "Which states must a data-driven interface represent?", "Loading, empty, success and error", "Loading only, and then nothing", "Success and a colour change", "Every outcome a visitor can experience needs its own visible message.", "shows-only-loading|maps-outcomes-to-colour"],
      ],
      practical: {
        title: "Make the request trustworthy",
        brief: "In the JavaScript file, make the project's request trustworthy: fetch the data, show loading and outcome messages, catch a failure with a next step, ignore a response that arrived too late, and finish with the cleanup that always runs.",
        focus: "interaction-project",
        editable: ["javascript"],
        requirements: [
          ["A request is made for the project data", calls("fetch"), "fetch"],
          ["Loading and outcome messages are shown", showsMessage("Loading...", "No results", "Ready"), "loading"],
          ["Failure is handled where the interface can recover", js("try-catch"), "errors"],
          ["A late response cannot overwrite a newer one", currentRequestGuard(), "stale-results"],
          ["The cleanup step runs in every outcome", js("finally"), "interaction-project"],
        ],
      },
    },
  },
};

/* -------------------------------------- 8. quality: test, protect and release ---- */

/* The module that debugs from evidence, audits for access, treats outside text as
   untrusted and writes an honest release note. Two requirements are mandatory: the
   image description, because it is how the picture is available to everyone, and the
   refusal of markup input, because it is how outside text stays text. */

const quality: AuthoredModule = {
  ideas: {
    debug: { slug: "debug", lesson: "debug", difficulty: "advanced", cognitive: "analyse" },
    "access-audit": { slug: "access-audit", lesson: "accessibility", difficulty: "advanced", cognitive: "evaluate", mandatory: "accessibility" },
    "untrusted-text": { slug: "untrusted-text", lesson: "security", difficulty: "advanced", cognitive: "evaluate", mandatory: "privacy" },
    "release-note": { slug: "release-note", lesson: "release", difficulty: "advanced", cognitive: "understand" },
    "quality-project": { slug: "quality-project", lesson: "project", difficulty: "advanced", cognitive: "evaluate" },
  },
  forms: {
    A: {
      questions: [
        ["debug", "What is the first useful step when code behaves differently than expected?", "Reproduce the failure and record the expected and actual results", "Rewrite every file from the beginning", "Delete the stylesheet to simplify the page", "A recorded comparison is evidence, and evidence is what narrows the search.", "rewrites-everything|blames-the-stylesheet"],
        ["access-audit", "Which check belongs in an accessibility audit?", "That every control can be reached and used with the keyboard", "That the page uses at least three typefaces", "That every file stays below a size limit", "An audit asks whether people can perceive, understand and operate the interface.", "checks-appearance-only|checks-file-size-only"],
        ["untrusted-text", "Why is textContent safer than innerHTML for text that came from outside?", "The value stays text instead of being interpreted as markup", "It saves the text in browser storage", "It makes the text load faster", "Outside text is untrusted input, so it is never allowed to become part of the document's markup.", "trusts-the-input|expects-storage-or-speed"],
        ["release-note", "Why record a known limitation?", "It sets an honest boundary for the version being released", "It proves that the project is broken", "It removes the need for any testing", "A stated limit tells the next person what this version does not do yet.", "treats-limits-as-failures|expects-it-to-replace-tests"],
        ["quality-project", "What is the strongest evidence that the project is ready to show?", "Recorded tests plus an explanation of the decisions", "A large amount of code", "A design that nobody has tested yet", "Working, recorded checks and a clear explanation show both the product and the understanding.", "judges-by-code-size|skips-testing"],
      ],
      practical: {
        title: "Audit, protect and release",
        brief: "In the HTML and JavaScript files, finish the project: select the element the behaviour needs, describe the image in words, keep outside text as text rather than markup, name the version with its own heading and keep the page regions in place.",
        focus: "quality-project",
        editable: ["html", "javascript"],
        requirements: [
          ["The needed element is selected in one place", calls("querySelector"), "debug"],
          ["The image explains itself in words", imageAlt(), "access-audit"],
          ["Outside text is never treated as markup", avoids("innerhtml-assignment"), "untrusted-text"],
          ["The version is named with its own heading", el("h2"), "release-note"],
          ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "quality-project"],
        ],
      },
    },
    B: {
      questions: [
        ["debug", "A selector matches nothing. Which comparison is the most useful?", "The selector text against the ids and classes that exist in the HTML", "The file size against the other project files", "The number of functions against the number of lines", "The fault is between the selector and the markup, so those two are compared first.", "compares-unrelated-numbers|ignores-the-markup"],
        ["access-audit", "Why give changing feedback a live region?", "The message can be announced without moving the visitor's focus", "The message becomes permanent on the page", "The form submits without a button", "Feedback that arrives in a polite region is available without stealing the visitor's place.", "expects-focus-to-move|expects-an-automatic-submit"],
        ["untrusted-text", "How should a title that arrived from an outside service be rendered?", "As text, so any tags inside it stay visible characters", "As markup, so the tags take effect on the page", "By writing it into the document while the page loads", "Treating outside text as data keeps the document structure under the project's control.", "interprets-the-markup|writes-into-the-document"],
        ["release-note", "What does a release note tell another person?", "What the project does, which flows were tested and what is still limited", "Every line of code that was written", "The private details of the creator", "A release note is a short, honest account of the version, not a copy of the source.", "pastes-the-source-code|shares-private-details"],
        ["quality-project", "What should happen immediately after a repair?", "The same test is run again and the result is recorded", "Several unrelated features are changed", "The tests are deleted because they passed once", "Repeating the same test is what proves the repair and not a coincidence.", "changes-something-else|deletes-the-evidence"],
      ],
      practical: {
        title: "Check, protect and write the release",
        brief: "In the HTML and JavaScript files, finish the release: select the element the behaviour uses, describe the image, keep outside text as text, name the version heading and keep the large page regions so the project can be shown to another person.",
        focus: "quality-project",
        editable: ["html", "javascript"],
        requirements: [
          ["The behaviour selects the element it needs", calls("querySelector"), "debug"],
          ["The picture is described for someone who cannot see it", imageAlt(), "access-audit"],
          ["External values never become markup", avoids("innerhtml-assignment"), "untrusted-text"],
          ["The release names its version with a heading", el("h2"), "release-note"],
          ["The page keeps header, main and footer", landmarks("header", "main", "footer"), "quality-project"],
        ],
      },
    },
    C: {
      questions: [
        ["debug", "Why change one cause at a time?", "The next test then shows which change affected the result", "It makes the file longer and easier to read", "It hides the error from the browser", "One controlled change is what turns a repair into evidence.", "changes-many-things|expects-to-hide-the-error"],
        ["access-audit", "What does an accessibility audit cover besides appearance?", "Perceiving, understanding and operating the interface", "Only the colour contrast of headings", "Only the download size of the images", "An audit covers the whole experience, not only how the page looks.", "checks-colour-only|checks-download-size-only"],
        ["untrusted-text", "Which assignment should never receive an outside value?", "innerHTML, because tags inside the value would be interpreted", "textContent, because it escapes the value as text", "The length property of an array", "Only textContent keeps outside text as text. Markup from outside is a risk, not a feature.", "reaches-for-innerhtml|fears-textContent"],
        ["release-note", "Which sentence belongs in a release note?", "Tested: an empty form is rejected with a clear message", "The project is perfect and has no limits", "The creator's phone number for questions", "A tested flow with an honest boundary is the kind of sentence a release note is made of.", "claims-perfection|adds-personal-detail"],
        ["quality-project", "What should be checked before the finished page is shared?", "That no personal detail is visible and no unsafe markup is used", "That the page uses the largest images available", "That every variable has been renamed", "Two risks are checked at release: what the page says about a person, and how it handles outside text.", "checks-image-size-only|renames-variables-instead"],
      ],
      practical: {
        title: "Release the finished project",
        brief: "In the HTML and JavaScript files, prepare the project for release: select the element the behaviour needs, describe the image for everyone, keep outside text as text, give the version its own heading and keep the large page regions in place.",
        focus: "quality-project",
        editable: ["html", "javascript"],
        requirements: [
          ["The element is selected rather than guessed", calls("querySelector"), "debug"],
          ["The image carries a useful description", imageAlt(), "access-audit"],
          ["Outside text stays text in the document", avoids("innerhtml-assignment"), "untrusted-text"],
          ["A version heading names the release", el("h2"), "release-note"],
          ["The page regions are all still present", landmarks("header", "main", "footer"), "quality-project"],
        ],
      },
    },
  },
};

export const ages16to18Assessment: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: buildModuleForms(courseId, {
    "ages-16-18-structure": structure,
    "ages-16-18-forms": formsModule,
    "ages-16-18-css-system": cssSystem,
    "ages-16-18-responsive": responsive,
    "ages-16-18-javascript": applicationLogic,
    "ages-16-18-data": applicationState,
    "ages-16-18-interaction": externalData,
    "ages-16-18-quality": quality,
  }),
  finalForms: [],
  defence: [],
};
