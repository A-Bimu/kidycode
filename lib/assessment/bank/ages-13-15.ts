/*
 * Ages 13 to 15: Practical Web Development.
 *
 * Three reviewed forms for every module, following the same contract as the first course:
 * five questions and five marked practical requirements per form, one for each idea the
 * module teaches, so the three forms cover the same objectives at the same difficulty
 * without repeating a question.
 *
 * The language here is older than the 10 to 12 bank: the learner is expected to reason
 * about why a choice is right, not only to recognise the right tag, while every
 * instruction stays plain and every task starts from the module's own project code.
 */

import {
  assigns,
  attr,
  breakpoint,
  buildModuleForms,
  calls,
  decl,
  declaresFunction,
  el,
  fluidWidth,
  focusRing,
  fragmentLink,
  freeOf,
  headingOrder,
  imageAlt,
  js,
  labelledControls,
  landmarks,
  namedValues,
  statusRegion,
  storage,
  usesVar,
  type AuthoredModule,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "ages-13-15" as const;

/* ------------------------------------------------------------- 1. structure ---- */

const structure: AuthoredModule = {
  ideas: {
    landmarks: { slug: "landmarks", lesson: "landmarks", difficulty: "foundation", cognitive: "understand" },
    headings: { slug: "headings", lesson: "headings", difficulty: "foundation", cognitive: "apply" },
    links: { slug: "links", lesson: "links", difficulty: "developing", cognitive: "apply" },
    "image-alt": { slug: "image-alt", lesson: "metadata", difficulty: "developing", cognitive: "understand" },
    "page-structure": { slug: "page-structure", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["landmarks", "What does a landmark element such as main tell a browser?", "Which region of the page holds a particular kind of content", "How wide the region should be drawn", "Where the stylesheet is stored", "Landmarks name the job of each large region, so a browser and a screen reader can both navigate them.", "expects-a-landmark-to-style|confuses-a-landmark-with-a-file"],
        ["headings", "Why is a skipped heading level a problem?", "The outline no longer describes the structure of the page", "The page loads more slowly", "The heading loses its colour", "Assistive technology and readers both rely on a heading sequence that steps down one level at a time.", "assumes-speed-is-affected|expects-styling-to-break"],
        ["links", "What makes link text work on its own?", "It names its destination clearly without the surrounding sentence", "It is as short as possible", "It matches the page colour", "A link is often read alone when scanning, so its words must carry the destination.", "uses-vague-short-text|treats-a-link-as-styling"],
        ["image-alt", "What should alternative text communicate?", "The purpose the image serves in this page", "The camera model used", "The exact file path of the image", "Alternative text replaces the image's contribution to the page, not the file's details.", "describes-the-file|describes-the-equipment"],
        ["page-structure", "Which order builds a reliable page?", "Regions first, then headings and content inside them", "Content first, then regions around it", "Styles first, then markup", "Building from the regions inward keeps each piece of content inside the right part of the page.", "wraps-regions-around-finished-content|styles-before-markup"],
      ],
      practical: {
        title: "Plan the page regions",
        brief: "Rebuild the project page from its regions inward: header, main and footer, with a section that holds a described image, a link that reaches that section and a heading order that steps down one level at a time.",
        focus: "page-structure",
        editable: ["html"],
        requirements: [
          ["Header, main and footer regions are present", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading order steps down without gaps", headingOrder(), "headings"],
          ["A link reaches a section on this page", fragmentLink(), "links"],
          ["The image carries useful alternative text", imageAlt(), "image-alt"],
          ["A section groups related content", el("section"), "page-structure"],
        ],
      },
    },
    B: {
      questions: [
        ["landmarks", "What is the difference between main and footer?", "main holds the primary content and footer closes the page", "footer holds the primary content", "main is only for navigation", "Each landmark has one job, which is why content belongs in the region that matches its purpose.", "swaps-main-and-footer|confuses-main-with-navigation"],
        ["headings", "How many h1 elements should one page have?", "One, naming the page itself", "One for every section", "As many as the page has images", "A single h1 names the page, and lower levels introduce the sections inside it.", "repeats-the-h1|ties-headings-to-images"],
        ["links", "Where must a fragment link point?", "To an id that exists on the same page", "To a class used elsewhere", "To an external website", "A fragment link resolves against an id, so the destination has to exist for the link to work.", "confuses-id-and-class|expects-an-external-target"],
        ["image-alt", "When is empty alternative text correct?", "When the picture is decorative and adds no information", "When the picture is small", "When the learner cannot describe it", "Decorative images are skipped deliberately so assistive technology does not read out noise.", "empties-alt-by-size|empties-alt-when-unsure"],
        ["page-structure", "What should be checked before adding any CSS?", "That the page reads in a sensible order without styling", "That every colour has been chosen", "That JavaScript has been written", "The unstyled page is the clearest test of whether the structure carries the meaning.", "checks-styling-first|expects-scripting-first"],
      ],
      practical: {
        title: "Structure the project page",
        brief: "Give the page its regions and its outline, then connect a navigation link to a section and describe the image in words.",
        focus: "page-structure",
        editable: ["html"],
        requirements: [
          ["The page uses header, main and footer", landmarks("header", "main", "footer"), "landmarks"],
          ["One h1 names the page and levels step down", headingOrder(), "headings"],
          ["A navigation link reaches a real section", fragmentLink(), "links"],
          ["The image is described for someone who cannot see it", imageAlt(), "image-alt"],
          ["The main region holds a section", el("section"), "page-structure"],
        ],
      },
    },
    C: {
      questions: [
        ["landmarks", "Why is a div a poor replacement for a named region?", "It tells the browser nothing about the content's job", "It cannot contain other elements", "It cannot be styled", "A div is anonymous. A named region carries meaning that other software can use.", "thinks-divs-cannot-nest|thinks-divs-cannot-be-styled"],
        ["headings", "What happens to a section with no heading?", "It disappears from the page outline", "It becomes a link", "It moves to the footer", "Sections are found through the outline, so an unheaded section is effectively invisible to navigation.", "expects-an-outline-without-headings|confuses-sections-with-links"],
        ["links", "Why give navigation links descriptive text?", "A visitor scanning the page understands where each one goes", "It makes the page shorter", "It changes the heading order", "Navigation is scanned rather than read, so each link must explain itself.", "assumes-shorter-is-better|expects-headings-to-change"],
        ["image-alt", "How long should alternative text be?", "As long as it needs to convey the image's purpose, and no longer", "Always one word", "Always the full file name", "The right length is the shortest wording that still carries the image's contribution.", "forces-one-word-alt|copies-the-file-name"],
        ["page-structure", "What is the value of a consistent page structure?", "The learner can add features later without moving content around", "It removes the need for headings", "It makes CSS optional", "A page whose regions are already right is easy to extend and easy to test.", "expects-headings-to-be-optional|thinks-css-becomes-optional"],
      ],
      practical: {
        title: "Build the page outline",
        brief: "Rebuild the page from its regions: header, main and footer, one h1, sections with headings, a working link and a described image.",
        focus: "page-structure",
        editable: ["html"],
        requirements: [
          ["The regions are all present", landmarks("header", "main", "footer"), "landmarks"],
          ["The heading outline has no gaps", headingOrder(), "headings"],
          ["A link reaches a section that exists", fragmentLink(), "links"],
          ["Every image is described", imageAlt(), "image-alt"],
          ["A section holds the main content", el("section"), "page-structure"],
        ],
      },
    },
  },
};

/* ----------------------------------------------------------------- 2. forms ---- */

const forms: AuthoredModule = {
  ideas: {
    labels: { slug: "labels", lesson: "labels", difficulty: "foundation", cognitive: "apply", mandatory: "accessibility" },
    "input-types": { slug: "input-types", lesson: "types", difficulty: "developing", cognitive: "apply" },
    "fieldset-legend": { slug: "fieldset-legend", lesson: "groups", difficulty: "developing", cognitive: "apply" },
    "form-guidance": { slug: "form-guidance", lesson: "messages", difficulty: "developing", cognitive: "understand" },
    "form-checkpoint": { slug: "form-checkpoint", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["labels", "What creates the connection between a label and its input?", "Matching for and id values", "Placing them next to each other", "Giving them the same colour", "The matching values create a programmatic label that assistive technology can follow.", "relies-on-position|relies-on-colour"],
        ["input-types", "What does an input type give the browser?", "A description of the value the field expects", "A guarantee that the value is correct", "A place to store the value", "The type supports suitable keyboards and basic checks, but the value still has to be validated.", "expects-type-to-guarantee-correctness|confuses-type-with-storage"],
        ["fieldset-legend", "What does a legend label?", "The whole group of controls inside its fieldset", "Only the first control", "The submit button", "Legend names the shared question, so each control in the group has context.", "labels-one-control-only|confuses-legend-with-a-button"],
        ["form-guidance", "Why connect help text with aria-describedby?", "The help is announced as part of the field it describes", "It makes the help text bold", "It hides the help from the page", "Describing a field with its help keeps the instruction available wherever the field is used.", "expects-visual-change-only|expects-help-to-be-hidden"],
        ["form-checkpoint", "What should a form ask for?", "Only the information its stated purpose needs", "Everything about the visitor", "Whatever is easiest to collect", "Collecting less is clearer for the visitor and safer for the data.", "collects-everything|collects-what-is-easy"],
      ],
      practical: {
        title: "Build the accessible form",
        brief: "Add the project form: a connected label for every control, a suitable input type, a fieldset with a legend for a related group, and a status paragraph that can be announced.",
        focus: "form-checkpoint",
        editable: ["html"],
        requirements: [
          ["Every control has a connected label", labelledControls(), "labels", "accessibility"],
          ["The email field uses the email input type", attr("input", "type", undefined, ["email"]), "input-types"],
          ["A fieldset groups related controls", el("fieldset"), "fieldset-legend"],
          ["The group has a legend", el("legend"), "fieldset-legend"],
          ["A status region is present for feedback", statusRegion(), "form-guidance"],
        ],
      },
    },
    B: {
      questions: [
        ["labels", "Why is a placeholder not a label?", "It disappears once the visitor starts typing", "It cannot be styled", "It is always too long", "A label has to stay visible while the field is being filled in.", "uses-placeholder-as-a-label|thinks-placeholders-cannot-be-styled"],
        ["input-types", "Which type suits a quantity of places?", "number, with sensible minimum and maximum values", "text, always", "email", "The narrowest suitable type supports the right keyboard and basic range checks.", "uses-text-for-numbers|uses-an-unrelated-type"],
        ["fieldset-legend", "When is a fieldset appropriate?", "When several controls answer one shared question", "When a form has only one field", "When the form needs a submit button", "A fieldset expresses that a group of controls belongs together.", "adds-fieldsets-everywhere|confuses-a-fieldset-with-a-button"],
        ["form-guidance", "Why give requirements before submission?", "The visitor can meet them without guessing", "It shortens the form", "It removes the need for validation", "Clear instructions reduce errors, but they never replace checking the value.", "expects-instructions-to-replace-validation|assumes-a-shorter-form"],
        ["form-checkpoint", "What proves a form works?", "Every control is labelled and the result is announced", "The form looks complete", "The form has many fields", "Labels and announced feedback are the evidence that people can actually use the form.", "judges-by-appearance|judges-by-field-count"],
      ],
      practical: {
        title: "Complete the form structure",
        brief: "Build the project form properly: labels connected to every control, the right input type, a grouped choice with a legend, and a live status message.",
        focus: "form-checkpoint",
        editable: ["html"],
        requirements: [
          ["Every control is labelled", labelledControls(), "labels", "accessibility"],
          ["The email control uses the correct type", attr("input", "type", undefined, ["email"]), "input-types"],
          ["Related controls are grouped", el("fieldset"), "fieldset-legend"],
          ["The group carries a legend", el("legend"), "fieldset-legend"],
          ["Feedback can be announced", statusRegion(), "form-guidance"],
        ],
      },
    },
    C: {
      questions: [
        ["labels", "What happens to a control with no label?", "It is announced without saying what it is for", "It cannot be typed into", "It is removed from the form", "A control without a label is unusable to someone who cannot see the surrounding layout.", "expects-the-control-to-be-removed|expects-typing-to-fail"],
        ["input-types", "Why keep a sensible maximum on a number field?", "The browser can flag an impossible value early", "It stores the value for you", "It makes the number smaller", "Range hints catch obvious mistakes before the value is used.", "expects-the-browser-to-store-it|thinks-it-changes-the-value"],
        ["fieldset-legend", "What does a radio group need to work correctly?", "One shared name on every radio in the group", "A different name on each radio", "A colour for each option", "A shared name makes the controls behave as one choice.", "gives-each-radio-its-own-name|relies-on-colour"],
        ["form-guidance", "What makes an error message useful?", "It names the problem and the next step", "It only changes the border colour", "It clears the field", "A message that says what to do next is more useful than a colour change.", "relies-on-colour-only|clears-the-value"],
        ["form-checkpoint", "Why validate on the server as well as in the browser?", "Browser checks can be bypassed", "Server checks are always faster", "It removes the need for labels", "Client checks help the visitor, but only the server can be relied on.", "trusts-the-browser-alone|thinks-validation-replaces-labels"],
      ],
      practical: {
        title: "Finish the form",
        brief: "Add the labelled controls, the correct input type, a grouped choice and a live status region to the project form, then check it with the keyboard.",
        focus: "form-checkpoint",
        editable: ["html"],
        requirements: [
          ["Each control has its own label", labelledControls(), "labels", "accessibility"],
          ["A typed field matches its input type", attr("input", "type", undefined, ["email"]), "input-types"],
          ["A related group is wrapped in a fieldset", el("fieldset"), "fieldset-legend"],
          ["The fieldset has a legend", el("legend"), "fieldset-legend"],
          ["A live status region exists", statusRegion(), "form-guidance"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------ 3. CSS system ---- */

const cssSystem: AuthoredModule = {
  ideas: {
    selectors: { slug: "selectors", lesson: "selectors", difficulty: "foundation", cognitive: "apply" },
    "box-model": { slug: "box-model", lesson: "box-model", difficulty: "developing", cognitive: "understand" },
    tokens: { slug: "tokens", lesson: "tokens", difficulty: "developing", cognitive: "apply" },
    "interactive-states": { slug: "interactive-states", lesson: "states", difficulty: "developing", cognitive: "apply", mandatory: "accessibility" },
    "visual-system": { slug: "visual-system", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["selectors", "When is a class selector better than an id?", "When the same style should apply to more than one element", "When only one element exists", "When the style must never change", "A class is reusable, and an id is unique, so a repeated component needs a class.", "uses-an-id-for-repeated-components|expects-a-class-to-be-unique"],
        ["box-model", "What does box-sizing border-box change?", "Width includes padding and border", "It removes the border", "It doubles the padding", "Border-box sizing makes the declared width the whole box, which keeps layouts predictable.", "thinks-it-removes-borders|expects-padding-to-double"],
        ["tokens", "Why name a design value such as the text colour?", "One change updates every rule that uses it", "It reduces the file size", "It removes the need for classes", "Named values keep a visual system consistent and quick to adjust.", "expects-a-smaller-file|thinks-tokens-replace-classes"],
        ["interactive-states", "Why does a focus state need an outline rather than a colour change?", "A colour difference alone can be invisible to some visitors", "Outlines load faster", "Colour cannot be used in CSS", "Focus has to be unmistakable for keyboard users, and colour alone is not enough.", "relies-on-colour-for-focus|thinks-outlines-are-faster"],
        ["visual-system", "What makes a visual system maintainable?", "A small set of repeated values used everywhere", "A separate style for every element", "Styling written inline in the HTML", "Repeated decisions are what make a design consistent and easy to change.", "styles-every-element-separately|puts-styles-in-markup"],
      ],
      practical: {
        title: "Build the CSS system",
        brief: "Style the project from one place: border-box sizing, inner spacing for a panel, a small set of named values used by the rules, and a visible keyboard focus state.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["Boxes count their border inside their width", decl("box-sizing", "border-box"), "box-model"],
          ["The panel has inner spacing", decl("padding", "padding", ".panel"), "box-model"],
          ["Named design values are defined", namedValues(3), "tokens"],
          ["The rules use the named values", usesVar(2), "tokens"],
          ["Keyboard focus is clearly visible", focusRing(), "interactive-states", "accessibility"],
        ],
      },
    },
    B: {
      questions: [
        ["selectors", "Which selector is the least specific that does the job?", "The one that expresses the design intention most directly", "The longest chain of elements", "The one using an id", "Specificity is a cost: the simplest selector that works is the easiest to maintain.", "chains-selectors-for-precision|defaults-to-ids"],
        ["box-model", "Where does margin create space?", "Outside the element, separating it from its neighbours", "Between the content and the border", "Inside the border only", "Margin is outer space, and padding is the inner space of the same box.", "confuses-margin-with-padding|thinks-margin-is-inner"],
        ["tokens", "Where should a design value be declared once?", "On the root of the document", "Inside every rule that uses it", "In the HTML file", "One declaration on the root is available to every rule that refers to it.", "repeats-the-value-everywhere|puts-values-in-markup"],
        ["interactive-states", "What should hover and focus have in common?", "Both should be visible and clearly different from the resting state", "Both should change the text", "Both should hide the control", "A state that cannot be seen is not a state at all.", "changes-content-on-hover|hides-the-control"],
        ["visual-system", "What is the risk of inconsistent spacing?", "The page looks unplanned and is harder to change later", "The page loads more slowly", "The content becomes unreadable to screen readers", "Spacing is part of the visual system: random values make the design feel unfinished.", "assumes-speed-is-affected|assumes-accessibility-is-affected"],
      ],
      practical: {
        title: "Consolidate the stylesheet",
        brief: "Consolidate the project stylesheet: border-box sizing, a panel with inner spacing, three or more named values used by the rules, and a focus state that is easy to see.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["Sizing uses border-box", decl("box-sizing", "border-box"), "box-model"],
          ["A panel has inner padding", decl("padding", "padding", ".panel"), "box-model"],
          ["More than two design values are named", namedValues(3), "tokens"],
          ["Rules refer to the named values", usesVar(2), "tokens"],
          ["The focus ring is visible on the controls", focusRing(), "interactive-states", "accessibility"],
        ],
      },
    },
    C: {
      questions: [
        ["selectors", "What does a type selector such as p affect?", "Every paragraph on the page", "One paragraph only", "Nothing until a class is added", "A type selector gives sensible defaults to every element of that type.", "expects-one-element|thinks-a-class-is-required"],
        ["box-model", "Why add padding and border to the same component?", "Padding moves the content in and the border draws the edge around it", "Both draw the edge", "Both create space outside the element", "The box model separates inner space from the edge, and each has its own job.", "thinks-both-draw-the-edge|thinks-both-are-outer-space"],
        ["tokens", "What should a named value describe?", "Its purpose, such as the text colour or the standard spacing", "The exact value it happens to hold", "The element it is used on", "A name that states a purpose survives a redesign, when the value changes.", "names-values-after-their-settings|names-values-after-elements"],
        ["interactive-states", "Which controls need a visible focus state?", "Every control a keyboard user can reach", "Only buttons", "Only links", "Anything reachable by keyboard must show where the focus currently is.", "adds-focus-to-buttons-only|adds-focus-to-links-only"],
        ["visual-system", "What should a design deliberately avoid?", "A different treatment for every single element", "A small set of repeated values", "A named text colour", "Variety without a system is what makes a page feel unfinished.", "expects-unlimited-variety|avoids-named-values"],
      ],
      practical: {
        title: "Make the system reusable",
        brief: "Write the stylesheet so the whole page shares one set of decisions: border-box sizing, spaced panels, named values reused by the rules and a visible focus state.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["The box model is border-box", decl("box-sizing", "border-box"), "box-model"],
          ["Panels have inner spacing", decl("padding", "padding", ".panel"), "box-model"],
          ["Three design values are named", namedValues(3), "tokens"],
          ["The values are reused by the rules", usesVar(2), "tokens"],
          ["Focus is visible on every control", focusRing(), "interactive-states", "accessibility"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------ 4. responsive ---- */

const responsive: AuthoredModule = {
  ideas: {
    viewport: { slug: "viewport", lesson: "viewport", difficulty: "developing", cognitive: "apply" },
    "flex-nav": { slug: "flex-nav", lesson: "flex", difficulty: "developing", cognitive: "apply" },
    "grid-cards": { slug: "grid-cards", lesson: "grid", difficulty: "developing", cognitive: "apply" },
    breakpoint: { slug: "breakpoint", lesson: "media", difficulty: "developing", cognitive: "apply" },
    "responsive-page": { slug: "responsive-page", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["viewport", "Why start with the narrow layout?", "The smallest screen is protected before enhancements are added", "It loads faster on phones", "It removes the need for media queries", "A mobile-first base keeps the content usable even if no wider rule ever applies.", "thinks-mobile-first-is-a-speed-trick|expects-media-queries-to-be-unneeded"],
        ["flex-nav", "What does flex-wrap do for a navigation row?", "It lets the items continue on the next line instead of widening the page", "It hides items that do not fit", "It makes every item the same width", "Wrapping protects the layout when there is not enough room in one line.", "expects-items-to-be-hidden|expects-equal-widths"],
        ["grid-cards", "What does minmax(0, 1fr) prevent?", "A track from growing wider than its share because of long content", "A track from shrinking at all", "The grid from having a gap", "The zero minimum lets a track shrink, which is what stops long content widening the page.", "thinks-it-locks-the-width|thinks-it-removes-the-gap"],
        ["breakpoint", "What should decide where a breakpoint sits?", "Where the layout starts to feel cramped", "The device model of a popular phone", "A round number", "The content shows where it needs more room, which is where the breakpoint belongs.", "picks-breakpoints-by-device|picks-breakpoints-by-habit"],
        ["responsive-page", "What must never happen at a narrow width?", "The page scrolling sideways", "Text wrapping onto another line", "A list becoming taller", "Horizontal scrolling means content is wider than the screen, which breaks the page.", "accepts-sideways-scrolling|expects-content-to-be-removed"],
      ],
      practical: {
        title: "Make the layout fit the screen",
        brief: "Set the project layout to work from the smallest screen up: a fluid width, a wrapping navigation row, a flexible card grid and one useful breakpoint.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["The layout keeps its width tied to the screen", fluidWidth(), "viewport"],
          ["The navigation is a wrapping row", decl("display", "flex", "nav"), "flex-nav"],
          ["The cards use Grid", decl("display", "grid", ".cards"), "grid-cards"],
          ["The grid uses flexible tracks", decl("grid-template-columns", "fr", ".cards"), "grid-cards"],
          ["A breakpoint changes the layout", breakpoint(700), "breakpoint"],
        ],
      },
    },
    B: {
      questions: [
        ["viewport", "What does a fluid width such as min(100% - 2rem, 70rem) do?", "It follows the screen up to a sensible maximum", "It fixes the page to 70rem", "It removes the page margin", "Fluid widths fit the screen, and the maximum stops lines becoming uncomfortably long.", "expects-a-fixed-width|expects-no-margin"],
        ["flex-nav", "Which combination arranges navigation links neatly?", "display flex with a gap and aligned items", "display grid with one column", "A fixed width on each link", "Flexbox with a gap arranges a row without hand-measured spacing.", "uses-one-column-grid|expects-fixed-widths"],
        ["grid-cards", "What does repeat(auto-fit, minmax(15rem, 1fr)) do?", "It fits as many usable tracks as the container allows", "It always creates three tracks", "It fixes each track at 15rem", "Auto-fit with a minimum lets the browser choose the number of tracks for the space.", "expects-a-fixed-track-count|fixes-tracks-at-the-minimum"],
        ["breakpoint", "Why keep a media query focused on what changes?", "It shows what the breakpoint actually alters", "It reduces the file size", "It prevents layout mistakes", "A small media query is easy to read and easy to test.", "expects-a-smaller-file|thinks-it-prevents-mistakes"],
        ["responsive-page", "How should the layout be tested?", "At several widths, starting from the narrowest", "Only at the widest setting", "Only on the developer's own device", "Testing from narrow to wide is what catches overflow and cramped layouts.", "tests-one-width-only|trusts-one-device"],
      ],
      practical: {
        title: "Build the responsive layout",
        brief: "Arrange the project so it works from 320px upward: a fluid page width, a flexible navigation row, a card grid with minmax tracks and a breakpoint that adds a column.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["The page width is fluid", fluidWidth(), "viewport"],
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flex-nav"],
          ["The cards use Grid with minmax tracks", decl("grid-template-columns", "minmax", ".cards"), "grid-cards"],
          ["The card grid flexes", decl("display", "grid", ".cards"), "grid-cards"],
          ["A media query adds a column", breakpoint(700), "breakpoint"],
        ],
      },
    },
    C: {
      questions: [
        ["viewport", "What happens if content is wider than the screen?", "The page scrolls sideways and the layout breaks", "The content is scaled down automatically", "The extra width is wrapped automatically", "Overflow is the most common phone layout failure, so widths must stay tied to the screen.", "expects-automatic-scaling|expects-automatic-wrapping"],
        ["flex-nav", "When is Grid a better choice than Flexbox?", "When rows and columns both need controlling", "When items sit in one line", "When there is only one item", "Grid works in two dimensions, which is what a card layout needs.", "uses-grid-for-one-item|expects-grid-to-align-a-row"],
        ["grid-cards", "Why add a gap to a grid?", "It separates the tracks without margins on every card", "It widens the tracks", "It removes the page padding", "The gap belongs to the layout, so each card does not need its own outer spacing.", "adds-margins-to-every-card|expects-wider-tracks"],
        ["breakpoint", "Which change belongs inside a breakpoint?", "Only the layout rules that differ at that width", "Every rule in the stylesheet", "The HTML structure", "A breakpoint should express one deliberate difference in the layout.", "repeats-the-whole-stylesheet|changes-structure-in-css"],
        ["responsive-page", "What stays the same at every width?", "The content and the available actions", "The number of columns", "The exact spacing", "Responsive design changes arrangement, never meaning.", "removes-content-at-narrow-widths|keeps-exact-spacing"],
      ],
      practical: {
        title: "Adapt the project to every width",
        brief: "Make the project work at every width: fluid page width, wrapping navigation, a grid of cards and a breakpoint where the layout gains space.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["The page is not fixed to one width", fluidWidth(), "viewport"],
          ["Navigation arranges itself as a row", decl("display", "flex", "nav"), "flex-nav"],
          ["The cards form a grid", decl("display", "grid", ".cards"), "grid-cards"],
          ["The tracks are flexible", decl("grid-template-columns", "fr", ".cards"), "grid-cards"],
          ["A breakpoint adapts the layout", breakpoint(600), "breakpoint"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------ 5. JavaScript ---- */

const javascript: AuthoredModule = {
  ideas: {
    values: { slug: "values", lesson: "values", difficulty: "foundation", cognitive: "understand" },
    functions: { slug: "functions", lesson: "functions", difficulty: "developing", cognitive: "apply" },
    conditions: { slug: "conditions", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
    "dom-output": { slug: "dom-output", lesson: "dom-output", difficulty: "developing", cognitive: "apply" },
    "behaviour-checkpoint": { slug: "behaviour-checkpoint", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["values", "Why does const fail when the same name is reassigned?", "The binding was declared as stable", "The value is too large", "It only works with numbers", "const protects a name from being reassigned, so a changing value needs let.", "expects-a-size-limit|thinks-const-is-for-numbers-only"],
        ["functions", "What does return do for a function?", "It hands a result back to whatever called it", "It prints the value on the page", "It stops the whole page", "A returned value can be stored, tested and used anywhere, which a printed value cannot.", "expects-return-to-print|expects-return-to-stop-the-page"],
        ["conditions", "What does a condition evaluate to?", "True or false", "A new element", "A stylesheet rule", "The condition is the decision, and the branches act on it.", "expects-a-condition-to-build-elements|confuses-conditions-with-styling"],
        ["dom-output", "Why update textContent rather than innerHTML?", "Text is inserted as text rather than as markup", "It makes the page faster", "It stores the value", "Text content cannot be interpreted as markup, which is why it is the safe choice for ordinary values.", "expects-an-innerhtml-speed-gain|confuses-output-with-storage"],
        ["behaviour-checkpoint", "What does a focused function make easier?", "Testing one outcome at a time", "Removing the need for HTML", "Changing the page colour", "One job per function means each outcome can be checked on its own.", "expects-functions-to-replace-markup|confuses-functions-with-styling"],
      ],
      practical: {
        title: "Add the programmed behaviour",
        brief: "Write the project's JavaScript: store a value, define a focused function that returns a result, make one condition choose between two outcomes and show the result as text.",
        focus: "behaviour-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["A value is stored with a clear name", js("declaration"), "values"],
          ["A function with a parameter is defined", declaresFunction(1), "functions"],
          ["A condition chooses between outcomes", js("conditional"), "conditions"],
          ["The result is shown as text", assigns("textContent"), "dom-output"],
          ["A text value is used in the message", js("string-literal"), "behaviour-checkpoint"],
        ],
      },
    },
    B: {
      questions: [
        ["values", "What is the difference between const and let?", "const cannot be reassigned, let can", "const is faster, let is slower", "let only holds numbers", "The choice is about whether the binding is expected to change, not about performance.", "expects-a-performance-difference|thinks-let-is-numbers-only"],
        ["functions", "What is a parameter for?", "Receiving the input the function needs", "Naming the file", "Storing the result forever", "A parameter is the function's input, which makes its behaviour predictable and testable.", "confuses-parameters-with-filenames|expects-parameters-to-store"],
        ["conditions", "When does the else branch run?", "When the condition is false", "Before the condition is evaluated", "Every time the function is called", "else handles the alternative outcome, and it is only reached when the condition fails.", "expects-else-always|expects-else-first"],
        ["dom-output", "Why select the element before calculating the result?", "The element must exist before it can be updated", "It makes the calculation faster", "It changes the element type", "Selection order matters: the reference must exist before it is used.", "calculates-before-selecting|expects-selection-to-change-the-element"],
        ["behaviour-checkpoint", "What is the evidence that the behaviour works?", "The predicted result appears on the page", "The file is longer", "The page has more colours", "Predicted output that matches what appears is the evidence.", "judges-by-file-size|judges-by-appearance"],
      ],
      practical: {
        title: "Program the page behaviour",
        brief: "Add the project's behaviour: a stored value, a function that takes a parameter, a condition with two outcomes and the result written onto the page as text.",
        focus: "behaviour-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["A named value is declared", js("declaration"), "values"],
          ["A function takes at least one parameter", declaresFunction(1), "functions"],
          ["A condition picks one outcome", js("conditional"), "conditions"],
          ["The page text is set", assigns("textContent"), "dom-output"],
          ["A message string is used", js("string-literal"), "behaviour-checkpoint"],
        ],
      },
    },
    C: {
      questions: [
        ["values", "Why choose a descriptive name for a value?", "The code explains itself when it is read later", "It runs faster", "It uses less memory", "A clear name removes the need for a comment explaining what the value is.", "expects-a-speed-gain|expects-memory-savings"],
        ["functions", "Why test both outcomes of a function?", "One branch can work while the other is wrong", "It is required by JavaScript", "It changes the return value", "Both branches are part of the function's behaviour, so both need evidence.", "tests-one-branch-only|expects-testing-to-change-the-result"],
        ["conditions", "What is a common mistake with a comparison?", "Using a single equals sign instead of a comparison", "Using a named function", "Adding a comment", "A single equals sign assigns, so the condition silently stops testing anything.", "confuses-assignment-with-comparison|blames-naming-or-comments"],
        ["dom-output", "What should happen when the selector matches nothing?", "The update fails, so the selector needs checking", "The browser creates the element", "The page reloads", "A selector must match real markup, and a mismatch is the cause to investigate first.", "expects-the-browser-to-create-it|expects-a-reload"],
        ["behaviour-checkpoint", "Why keep the page logic out of the markup?", "Behaviour can be changed and tested without editing the content", "It makes the page shorter", "It removes the need for CSS", "Separating behaviour from content keeps both easier to change and to test.", "expects-a-shorter-page|thinks-css-becomes-optional"],
      ],
      practical: {
        title: "Connect the logic to the page",
        brief: "Write the JavaScript for the project page: a stored value, one function with a parameter, one condition and a visible text result.",
        focus: "behaviour-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["A value is stored under a clear name", js("declaration"), "values"],
          ["A function receives a parameter", declaresFunction(1), "functions"],
          ["A condition has two possible outcomes", js("conditional"), "conditions"],
          ["The visible text is updated safely", assigns("textContent"), "dom-output"],
          ["The message uses a text value", js("string-literal"), "behaviour-checkpoint"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------------ 6. data ---- */

const data: AuthoredModule = {
  ideas: {
    arrays: { slug: "arrays", lesson: "arrays", difficulty: "developing", cognitive: "apply" },
    records: { slug: "records", lesson: "objects", difficulty: "developing", cognitive: "apply" },
    "foreach-records": { slug: "foreach-records", lesson: "foreach", difficulty: "developing", cognitive: "apply" },
    "safe-render": { slug: "safe-render", lesson: "render", difficulty: "developing", cognitive: "apply" },
    "data-checkpoint": { slug: "data-checkpoint", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["arrays", "What does an array keep together?", "Related values in a known order", "One value at a time", "The styles for a component", "An ordered collection lets one set of instructions handle every item.", "expects-one-value|confuses-arrays-with-styling"],
        ["records", "What does a record's property name give you?", "A stable way to read the same field on every record", "The position of the record in the array", "The colour of the item", "Stable property names mean one function can process every record of the same shape.", "relies-on-array-position|expects-properties-to-style"],
        ["foreach-records", "What does forEach give its callback?", "The current record for that pass through the array", "The whole array every time", "The length of the page", "The callback receives one item at a time, which is what makes repeated work simple.", "expects-the-whole-array|confuses-length-with-page-size"],
        ["safe-render", "Why create an element per record rather than building markup text?", "Each record becomes a real element with its text set safely", "It is shorter to write", "It avoids needing a list", "Creating elements keeps the data as data instead of turning it into markup.", "builds-markup-from-strings|expects-to-skip-the-list"],
        ["data-checkpoint", "Why keep data separate from the code that shows it?", "The same display code can handle any number of records", "It removes the need to test", "It changes the data type", "Separation means changing the data does not mean rewriting the page logic.", "hard-codes-every-item|thinks-separation-replaces-testing"],
      ],
      practical: {
        title: "Render the records",
        brief: "Store the project records in an array of objects, process each record with forEach, create one list item per record and add it to the page with its text set safely.",
        focus: "data-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["The records live in an array", js("array-literal"), "arrays"],
          ["Each record is an object with named properties", js("object-literal"), "records"],
          ["Every record is processed in turn", calls("forEach"), "foreach-records"],
          ["A list item is created for each record", js("create-element"), "safe-render"],
          ["Each item is added to the page", js("append"), "data-checkpoint"],
        ],
      },
    },
    B: {
      questions: [
        ["arrays", "How do you read the first item of an array?", "With index zero", "With index one", "With the length property", "Indexing starts at zero, and the length property gives the count instead.", "uses-index-one|confuses-brackets-with-length"],
        ["records", "Why give every record the same properties?", "One function can process them all the same way", "It sorts them automatically", "It makes them shorter", "A consistent shape is what allows one rendering function to handle every record.", "expects-sorting-to-be-automatic|thinks-consistency-is-size"],
        ["foreach-records", "What does the callback do inside forEach?", "It carries out the repeated work for the current record", "It returns the whole array", "It stops the loop", "The callback is the repeated instruction, run once per record.", "expects-the-callback-to-return-the-array|expects-it-to-stop-the-loop"],
        ["safe-render", "Which property sets the visible words of an element safely?", "textContent", "innerHTML", "append", "textContent treats the value as text, so it cannot be interpreted as markup.", "expects-markup-to-be-set|confuses-appending-with-setting-text"],
        ["data-checkpoint", "What happens when the data changes?", "The same rendering code shows the new records", "The page must be rewritten", "The array becomes an object", "Because the display code reads the data, new records appear without new markup.", "rewrites-the-page-per-change|expects-the-data-type-to-change"],
      ],
      practical: {
        title: "Build a rendered list",
        brief: "Turn the project data into page content: an array of records, each record processed with forEach, one element created per record and the record's title set as text.",
        focus: "data-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["An array holds the records", js("array-literal"), "arrays"],
          ["The records are objects", js("object-literal"), "records"],
          ["forEach processes every record", calls("forEach"), "foreach-records"],
          ["One element is created per record", js("create-element"), "safe-render"],
          ["The created element is added to the page", js("append"), "data-checkpoint"],
        ],
      },
    },
    C: {
      questions: [
        ["arrays", "What does the length property report?", "How many items the array currently holds", "The last index of the array", "The size of the page", "Length is the count, which is why the last index is one less.", "confuses-length-with-last-index|confuses-length-with-page-size"],
        ["records", "What is an object in this project?", "One record with named properties", "A list of several records", "A function that renders items", "An object models one thing, and an array holds many of them.", "confuses-a-record-with-a-list|confuses-a-record-with-a-function"],
        ["foreach-records", "When should a loop not be used?", "When the page needs no repeated output", "When the array is short", "When the array holds objects", "A loop earns its place only when something repeats.", "loops-without-a-reason|avoids-loops-for-objects"],
        ["safe-render", "What is the risk of building markup from record text?", "Text could be treated as markup instead of as words", "The list becomes unsorted", "The records are deleted", "Treating data as markup is exactly how unsafe content gets into a page.", "expects-sorting-to-break|expects-records-to-be-deleted"],
        ["data-checkpoint", "Which test proves the rendering works?", "Add a record and check a matching item appears", "Read the code once", "Change the page colours", "Changing the data is the only test that shows the rendering reads it.", "changes-styling-instead|skips-testing-the-change"],
      ],
      practical: {
        title: "Render data safely",
        brief: "Build the record list for the project: the records in an array, processed one at a time, each becoming an element whose text is set as text and added to the page.",
        focus: "data-checkpoint",
        editable: ["javascript"],
        requirements: [
          ["The data is an array", js("array-literal"), "arrays"],
          ["Each item is an object with properties", js("object-literal"), "records"],
          ["The array is processed with forEach", calls("forEach"), "foreach-records"],
          ["An element is created for each item", js("create-element"), "safe-render"],
          ["Every element is appended to the page", js("append"), "data-checkpoint"],
        ],
      },
    },
  },
};

/* ----------------------------------------------------------- 7. interaction ---- */

const interaction: AuthoredModule = {
  ideas: {
    "dom-select": { slug: "dom-select", lesson: "select", difficulty: "developing", cognitive: "apply" },
    "user-events": { slug: "user-events", lesson: "events", difficulty: "developing", cognitive: "apply" },
    validation: { slug: "validation", lesson: "validation", difficulty: "developing", cognitive: "apply", mandatory: "accessibility" },
    storage: { slug: "storage", lesson: "storage", difficulty: "developing", cognitive: "apply" },
    "form-behaviour": { slug: "form-behaviour", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["dom-select", "Why store element references before adding behaviour?", "The behaviour then works with a known element instead of searching repeatedly", "It changes the element type", "It removes the need for a selector", "One clear reference is easier to test and avoids repeated lookups.", "searches-every-time|expects-a-selector-to-be-unnecessary"],
        ["user-events", "Why listen for submit instead of a button click?", "It also covers the form being submitted from the keyboard", "It runs faster", "It prevents validation", "The submit event represents the form action however it was started.", "expects-a-speed-gain|thinks-it-skips-validation"],
        ["validation", "Why trim the value before checking it?", "Spaces alone do not count as real input", "It converts the value to a number", "It clears the field", "Trimming removes surrounding spaces so an apparently empty entry is treated as empty.", "expects-a-number-conversion|expects-the-field-to-clear"],
        ["storage", "What belongs in browser storage?", "A small non-sensitive preference", "A password", "A private identity document", "Device storage is not a safe place for anything secret.", "stores-secrets|stores-documents"],
        ["form-behaviour", "Why use a status region for feedback?", "The message can be announced without moving focus", "It makes the message bold", "It stores the message", "Feedback should reach everyone, including people who cannot see the change happen.", "expects-styling-only|expects-storage"],
      ],
      practical: {
        title: "Connect the project form",
        brief: "Select the elements once, add a submit listener, trim and check the value, show a clear message in a live region and keep one safe preference in browser storage.",
        focus: "form-behaviour",
        editable: ["javascript", "html"],
        requirements: [
          ["The elements are selected and stored", calls("querySelector"), "dom-select"],
          ["A listener responds to the submission", js("event-listener"), "user-events"],
          ["The value is trimmed before it is checked", calls("trim"), "validation", "accessibility"],
          ["One safe preference is saved", storage("setItem"), "storage"],
          ["The page feedback is announced", statusRegion(), "form-behaviour", "accessibility"],
        ],
      },
    },
    B: {
      questions: [
        ["dom-select", "What does querySelector return?", "The first element that matches the selector", "Every matching element", "The element's text", "One element is returned, which is why an id selector is reliable for a single control.", "expects-all-matches|expects-text-instead"],
        ["user-events", "What does preventDefault do in a submit handler?", "It stops the page reloading so the code can respond", "It clears the form", "It disables the button", "The browser would otherwise leave the page before the feedback could be shown.", "expects-the-form-to-clear|expects-the-button-to-disable"],
        ["validation", "What should an empty submission do?", "Show a specific message about what is needed", "Submit the empty value", "Silently do nothing", "A clear message tells the visitor what to do next.", "submits-empty-values|stays-silent"],
        ["storage", "What does getItem return for a key that was never saved?", "null", "An empty string", "An error", "A missing key returns null, so the code needs a sensible default.", "expects-an-empty-string|expects-an-error"],
        ["form-behaviour", "What should be tested with the keyboard?", "That the control can be reached and used without a mouse", "That the mouse still works", "That the page is colourful", "Keyboard use is a real requirement, not an optional extra.", "tests-mouse-only|tests-appearance-only"],
      ],
      practical: {
        title: "Complete the form behaviour",
        brief: "Store the element references, handle the submit event, validate the trimmed value, save one safe preference and announce the result in a live region.",
        focus: "form-behaviour",
        editable: ["javascript", "html"],
        requirements: [
          ["Element references are stored", calls("querySelector"), "dom-select"],
          ["The submission is handled", js("event-listener"), "user-events"],
          ["The value is trimmed first", calls("trim"), "validation", "accessibility"],
          ["A preference is restored or saved", storage("getItem"), "storage"],
          ["Feedback is announced in a status region", statusRegion(), "form-behaviour", "accessibility"],
        ],
      },
    },
    C: {
      questions: [
        ["dom-select", "What happens when the same element is selected repeatedly?", "The page is searched again for no benefit", "The element is duplicated", "The selector stops working", "Storing the reference once keeps the code shorter and faster to read.", "expects-duplication|expects-the-selector-to-break"],
        ["user-events", "Which event fits a control that changes a value?", "change or input, depending on when feedback is needed", "submit", "load", "The right event is the one that matches the moment the code needs to react to.", "uses-submit-for-every-control|uses-load-for-controls"],
        ["validation", "Why validate on the server too?", "Client-side checks can be bypassed", "Server checks are simpler", "It removes the need for labels", "Only the server can be relied on, so browser checks are for helping the visitor.", "trusts-the-client|thinks-validation-replaces-labels"],
        ["storage", "Why use a project-specific storage key?", "It avoids clashing with another page on the same device", "It stores more data", "It encrypts the value", "A specific key keeps one project's data separate from everything else.", "expects-more-capacity|expects-encryption"],
        ["form-behaviour", "What should the page do when something fails?", "Explain what happened and offer the next step", "Show nothing", "Reload silently", "Recovery needs a message the visitor can act on.", "hides-the-failure|reloads-silently"],
      ],
      practical: {
        title: "Build the interaction",
        brief: "Make the project form respond: stored element references, a handled submission, trimmed validation, one safe saved preference and announced feedback.",
        focus: "form-behaviour",
        editable: ["javascript", "html"],
        requirements: [
          ["The form elements are stored once", calls("querySelector"), "dom-select"],
          ["An event listener is attached", js("event-listener"), "user-events"],
          ["The input is trimmed before use", calls("trim"), "validation", "accessibility"],
          ["A safe value is stored", storage("setItem"), "storage"],
          ["The result is announced", statusRegion(), "form-behaviour", "accessibility"],
        ],
      },
    },
  },
};

/* --------------------------------------------------------------- 8. quality ---- */

const quality: AuthoredModule = {
  ideas: {
    "debug-evidence": { slug: "debug-evidence", lesson: "debug", difficulty: "secure", cognitive: "analyse" },
    "accessibility-audit": { slug: "accessibility-audit", lesson: "accessibility", difficulty: "secure", cognitive: "evaluate", mandatory: "accessibility" },
    "privacy-note": { slug: "privacy-note", lesson: "security", difficulty: "secure", cognitive: "understand", mandatory: "privacy" },
    "release-note": { slug: "release-note", lesson: "release", difficulty: "secure", cognitive: "apply" },
    "final-release": { slug: "final-release", lesson: "project", difficulty: "secure", cognitive: "evaluate" },
  },
  forms: {
    A: {
      questions: [
        ["debug-evidence", "What is the first step in debugging?", "Reproduce the same failure every time", "Change several lines at once", "Rewrite the file", "A reproducible failure is the evidence that any repair can be tested against.", "changes-many-lines|rewrites-before-understanding"],
        ["accessibility-audit", "What does an accessibility audit cover?", "Keyboard use, labels, alternative text and announced feedback", "Only colour contrast", "Only file size", "Accessibility is about whether people can perceive, understand and operate the page.", "checks-contrast-only|checks-performance-only"],
        ["privacy-note", "What should never appear in a learner's project credit?", "A school, address or contact detail", "A chosen display name", "A short description of the topic", "Identifying details about a young person have no place on a public page.", "shares-a-school-name|shares-contact-detail"],
        ["release-note", "What does a release note record?", "The purpose, what was tested and the known limits", "The number of lines of code", "The colours used", "A useful release note is evidence of testing and an honest statement of limits.", "records-code-size|records-the-palette"],
        ["final-release", "What shows the project is finished?", "Recorded tests for every required part", "A large file", "A polished look", "Evidence that each requirement was tested is stronger than any impression.", "judges-by-size|judges-by-appearance"],
      ],
      practical: {
        title: "Audit and release the project",
        brief: "Repair the page, make keyboard focus visible, describe the images, remove any personal detail and add a release notes section that records your testing.",
        focus: "final-release",
        editable: ["html", "css"],
        requirements: [
          ["The page regions are all present", landmarks("header", "main", "footer"), "debug-evidence"],
          ["Every image is described in words", imageAlt(), "accessibility-audit", "accessibility"],
          ["Keyboard focus is clearly visible", focusRing(), "accessibility-audit", "accessibility"],
          ["No personal contact detail is on the page", freeOf("personal-contact"), "privacy-note", "privacy"],
          ["Release notes record the testing", attr("section", "id", undefined, ["release-notes"]), "release-note"],
        ],
      },
    },
    B: {
      questions: [
        ["debug-evidence", "Why change one cause at a time?", "It shows which change affected the result", "It makes the file longer", "It avoids testing", "Controlled changes give evidence; several changes at once do not.", "changes-everything-at-once|avoids-testing"],
        ["accessibility-audit", "Why is a colour-only message a barrier?", "Some visitors cannot distinguish the colours", "Colour makes the page slower", "Colour is not allowed in HTML", "Every status needs words as well as colour.", "relies-on-colour|thinks-colour-is-unsupported"],
        ["privacy-note", "Why is a nickname safer than a full name?", "It does not identify the learner", "It is shorter", "It looks more professional", "The credit should show the work, not identify the person.", "thinks-shortness-is-the-reason|confuses-style-with-safety"],
        ["release-note", "Why record a known limitation?", "It sets an honest boundary for this version", "It hides unfinished work", "It removes the need for tests", "Naming a limit is what makes the rest of the release note trustworthy.", "hides-limits|thinks-limits-replace-testing"],
        ["final-release", "What should be done after a repair?", "Rerun the same test and record the result", "Change something unrelated", "Delete the test", "A consistent retest is what proves the repair worked.", "changes-unrelated-code|skips-the-retest"],
      ],
      practical: {
        title: "Finish and document the page",
        brief: "Check the page against the audit list: regions, described images, visible focus, no personal detail and a release notes section.",
        focus: "final-release",
        editable: ["html", "css"],
        requirements: [
          ["Header, main and footer are present", landmarks("header", "main", "footer"), "debug-evidence"],
          ["Images have useful alternative text", imageAlt(), "accessibility-audit", "accessibility"],
          ["Focus is visible for keyboard users", focusRing(), "accessibility-audit", "accessibility"],
          ["No contact detail appears in the page", freeOf("personal-contact"), "privacy-note", "privacy"],
          ["A release notes section exists", attr("section", "id", undefined, ["release-notes"]), "release-note"],
        ],
      },
    },
    C: {
      questions: [
        ["debug-evidence", "What should be recorded when a fault is found?", "What was expected, what happened and what fixed it", "Only that it works now", "Nothing until release", "Expected and actual results are the evidence that the repair was tested.", "records-only-a-feeling|defers-all-recording"],
        ["accessibility-audit", "What is the quickest useful accessibility check?", "Using the page with the keyboard only", "Reading the stylesheet", "Counting the images", "Keyboard use exposes focus, labels and reachability problems quickly.", "reads-css-instead|counts-images-instead"],
        ["privacy-note", "When should a page be reviewed for personal detail?", "Before it is shared with anyone", "After it has been shared", "Only if someone complains", "The review has to happen before the page leaves the learner's control.", "reviews-after-sharing|waits-for-a-complaint"],
        ["release-note", "What makes a release note credible?", "Naming what was tested and what was not", "Listing every line of code", "Claiming everything works", "Naming the limits is what makes the tested claims believable.", "claims-everything-works|lists-code-instead"],
        ["final-release", "Who is a release note written for?", "Someone who has to use or continue the project", "The learner alone", "Nobody in particular", "The note exists so another person can trust and continue the work.", "writes-for-nobody|writes-for-themselves-only"],
      ],
      practical: {
        title: "Repair, audit and release",
        brief: "Repair the page, run the audit, remove anything personal and write the release notes section with what you tested.",
        focus: "final-release",
        editable: ["html", "css"],
        requirements: [
          ["The regions are complete", landmarks("header", "main", "footer"), "debug-evidence"],
          ["Images are described", imageAlt(), "accessibility-audit", "accessibility"],
          ["Keyboard focus is visible", focusRing(), "accessibility-audit", "accessibility"],
          ["No personal detail is published", freeOf("personal-contact"), "privacy-note", "privacy"],
          ["Release notes are present", attr("section", "id", undefined, ["release-notes"]), "release-note"],
        ],
      },
    },
  },
};

export const ages13to15Assessment: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: buildModuleForms(courseId, {
    "ages-13-15-structure": structure,
    "ages-13-15-forms": forms,
    "ages-13-15-css-system": cssSystem,
    "ages-13-15-responsive": responsive,
    "ages-13-15-javascript": javascript,
    "ages-13-15-data": data,
    "ages-13-15-interaction": interaction,
    "ages-13-15-quality": quality,
  }),
  finalForms: [],
  defence: [],
};