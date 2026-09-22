/*
 * Ages 10 to 12: Web Coding Foundations.
 *
 * Three reviewed forms for every module. Each form asks five questions, one for each
 * idea the module teaches, and then one practical task with five marked requirements
 * covering the same five ideas, so the three forms assess the same objectives at the
 * same difficulty without repeating a question.
 *
 * Every word here is written for a ten to twelve year old: the clearest instructions in
 * the product, one idea at a time, and no assumption that a learner can infer a rule.
 */

import { buildModuleForms, type AuthoredModule } from "@/lib/assessment/bank/factory";
import {
  assigns,
  breakpoint,
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
  labelledControls,
  landmarks,
  list,
  namedValues,
  readableText,
  statusRegion,
  usesVar,
} from "@/lib/assessment/bank/factory";
import { CONTENT_VERSION, type CourseAssessment } from "@/lib/assessment/types";

const courseId = "ages-10-12" as const;

/* -------------------------------------------------------------- 1. first HTML -- */

const htmlFoundations: AuthoredModule = {
  ideas: {
    elements: { slug: "elements", lesson: "elements", difficulty: "foundation", cognitive: "remember" },
    headings: { slug: "headings", lesson: "text", difficulty: "foundation", cognitive: "understand" },
    nesting: { slug: "nesting", lesson: "nesting", difficulty: "foundation", cognitive: "apply" },
    lists: { slug: "lists", lesson: "lists", difficulty: "foundation", cognitive: "apply" },
    "first-page": { slug: "first-page", lesson: "project", difficulty: "foundation", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["elements", "What does an opening tag such as <p> tell the browser?", "That an element starts here and what kind of content it holds", "That the element ends here", "How wide the text should be on the page", "An opening tag starts an element and names its type. A closing tag, with a forward slash, ends it.", "confuses-opening-and-closing|expects-tags-to-control-layout"],
        ["headings", "How does the browser treat words inside an h1 element?", "As the most important heading on the page", "As ordinary paragraph text", "As a link to another page", "h1 names the main heading of the page. Paragraph text belongs in p elements.", "treats-a-heading-as-a-paragraph|confuses-a-heading-with-a-link"],
        ["nesting", "Where does a nested element belong?", "Inside the element it belongs to, before that element closes", "After the closing tag of its parent", "In a separate file", "A nested element sits inside its parent so the browser can tell which content belongs together.", "puts-a-nested-element-after-its-parent|expects-a-separate-file"],
        ["lists", "Which pair of tags builds a bulleted list of several items?", "ul around several li elements", "ol around one p element", "li around one ul element", "ul is the list itself and each li is one item inside it.", "swaps-the-list-and-its-items|uses-paragraphs-for-items"],
        ["first-page", "What is the best first step for a new page?", "Write the content in reading order, then choose the right tags", "Choose the colours and fonts first", "Add JavaScript before any content exists", "The words decide which elements are needed, so write them first and tag them second.", "starts-with-styling|starts-with-scripting"],
      ],
      practical: {
        title: "Start your project page",
        brief: "Open the HTML file. Keep the heading and introduction, then add a section that holds a list of three items. Check the reading order before you finish.",
        focus: "first-page",
        editable: ["html"],
        requirements: [
          ["The page has one main heading", el("h1"), "headings"],
          ["The text is inside paragraphs", el("p", 2), "elements"],
          ["A list holds three items", list(3), "lists"],
          ["The list sits inside a section", el("section"), "nesting"],
          ["The whole page sits inside a main region", el("main"), "first-page"],
        ],
      },
    },
    B: {
      questions: [
        ["elements", "What can happen when a closing tag is missing?", "The browser may treat the following content as part of the same element", "The page refuses to open at all", "The text disappears from the screen", "A missing closing tag does not usually break the page: it changes which content belongs to which element.", "expects-the-page-to-break-completely|expects-text-to-vanish"],
        ["headings", "Which heading should appear only once on a page?", "The h1, because it names the whole page", "Every h2 heading", "The smallest heading on the page", "One page has one main heading. Lower levels introduce sections inside it.", "repeats-the-h1-on-one-page|thinks-heading-levels-are-sizes"],
        ["nesting", "Which line nests elements correctly?", "<section><h2>News</h2><p>Today</p></section>", "<section><h2>News</h2></section><p>Today</p>", "<section><h2>News</h2><p>Today</section></p>", "The paragraph belongs inside the section, and the section closes after everything it holds.", "closes-the-parent-too-early|misplaces-the-closing-tags"],
        ["lists", "What does one li element mean?", "One item inside a list", "A list of several items", "One line of ordinary text", "li is a single list item. The list itself is ul or ol.", "swaps-the-item-and-the-list|thinks-li-is-plain-text"],
        ["first-page", "Why write the content before the styling?", "The words decide which elements are really needed", "Styling cannot work without JavaScript", "An empty page loads faster", "Content first means the structure is decided by what the page has to say.", "styles-before-content|thinks-a-script-is-required"],
      ],
      practical: {
        title: "Build the page outline",
        brief: "In the HTML file, turn the plain text into a heading, two paragraphs and a list of three items. Keep every word that is already there.",
        focus: "first-page",
        editable: ["html"],
        requirements: [
          ["The page heading is the only h1", el("h1"), "headings"],
          ["Two paragraphs hold the introduction", el("p", 2), "elements"],
          ["Three list items are listed", list(3), "lists"],
          ["The list is inside a section", el("section"), "nesting"],
          ["The content sits inside main", el("main"), "first-page"],
        ],
      },
    },
    C: {
      questions: [
        ["elements", "What belongs between an opening tag and its closing tag?", "The content that the element describes", "Only other tags, never words", "The name of the file", "An element holds its content: words, other elements, or both.", "thinks-an-element-cannot-hold-words|confuses-a-tag-with-a-file-name"],
        ["headings", "Which heading level belongs directly under h1?", "h2", "h3", "h6", "Heading levels step down one at a time, so h2 follows h1.", "skips-a-heading-level|thinks-any-level-can-follow"],
        ["nesting", "Why does the order of nested elements matter?", "It shows which content belongs together", "It changes the colour of the page", "It hides content from other people", "Nesting is how the browser understands the shape of the content.", "thinks-nesting-is-only-visual|thinks-nesting-hides-content"],
        ["lists", "Which result shows a working list?", "Three items appear as a bulleted list", "One sentence appears with three commas", "The same image appears three times", "A list shows each item separately, which a sentence does not.", "writes-a-sentence-instead|expects-an-image-instead"],
        ["first-page", "What should the first working version of the page include?", "A title, an introduction and one organised list", "Every feature of the finished website", "Only the empty page structure", "A first version proves the structure works before more content is added.", "tries-every-feature-at-once|submits-an-empty-page"],
      ],
      practical: {
        title: "First working page",
        brief: "Build the smallest complete version of your project page: a main region, one heading, an introduction paragraph and a section with a list of three items.",
        focus: "first-page",
        editable: ["html"],
        requirements: [
          ["One heading names the page", el("h1"), "headings"],
          ["The introduction is a paragraph", el("p", 2), "elements"],
          ["A section groups related content", el("section"), "nesting"],
          ["The section holds three list items", list(3), "lists"],
          ["Everything sits inside a main region", el("main"), "first-page"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------- 2. links and content -- */

const htmlContent: AuthoredModule = {
  ideas: {
    links: { slug: "links", lesson: "links", difficulty: "developing", cognitive: "apply" },
    "image-alt": { slug: "image-alt", lesson: "images", difficulty: "developing", cognitive: "understand" },
    landmarks: { slug: "landmarks", lesson: "semantics", difficulty: "developing", cognitive: "apply" },
    "labelled-input": { slug: "labelled-input", lesson: "forms", difficulty: "developing", cognitive: "apply", mandatory: "accessibility" },
    "describe-content": { slug: "describe-content", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["links", "What does the href attribute hold?", "The destination the link goes to", "The words the visitor reads", "The colour of the link text", "href is the address. The words between the tags are the link text.", "puts-the-link-text-in-href|thinks-href-is-styling"],
        ["image-alt", "What should alternative text describe?", "The useful information the picture gives", "The size of the picture file", "The word image followed by the file name", "Alternative text replaces the picture for someone who cannot see it, so it states what matters.", "describes-the-file-instead|starts-with-image-of"],
        ["landmarks", "Which element holds the main content of the page?", "main", "footer", "head", "main holds the content a visitor came for. The head element holds information about the page, not page content.", "confuses-main-with-footer|confuses-main-with-head"],
        ["labelled-input", "How is a label connected to its input?", "The for value on the label matches the id on the input", "They are given the same colour", "They are placed side by side", "The matching values create a connection that assistive technology can follow.", "relies-on-position|relies-on-colour"],
        ["describe-content", "What makes a page easy to follow before any CSS is added?", "Clear headings, paragraphs and lists in a sensible order", "Large pictures at the very top", "One long paragraph with every detail", "Structure carries the meaning. Styling only makes that structure appear differently.", "relies-on-pictures|expects-styling-to-fix-structure"],
      ],
      practical: {
        title: "Complete the project structure",
        brief: "In the HTML file, build the page regions and connect the content: a header, a main region, a section with a described image, a list, a navigation link and a footer.",
        focus: "describe-content",
        editable: ["html"],
        requirements: [
          ["The page has header, main and footer regions", landmarks("header", "main", "footer"), "landmarks"],
          ["A navigation link reaches a section on this page", fragmentLink(), "links"],
          ["The image carries useful alternative text", imageAlt(), "image-alt"],
          ["A form control has a connected label", labelledControls(), "labelled-input", "accessibility"],
          ["The content section holds a list of three items", list(3), "describe-content"],
        ],
      },
    },
    B: {
      questions: [
        ["links", "What makes link text useful?", "It names the destination so it makes sense on its own", "It says click here", "It is as short as possible", "A visitor reads the link text by itself when skimming, so it must name where it goes.", "uses-click-here|uses-vague-text"],
        ["image-alt", "When is empty alternative text the right choice?", "When the picture adds nothing that the words do not already say", "Whenever the picture is small", "Whenever the learner likes the picture", "Empty alternative text tells assistive technology to skip a decorative picture, so it is a deliberate choice.", "empties-alt-always|decides-by-size"],
        ["landmarks", "What is the job of a footer region?", "It closes the page with information about it", "It holds the main content", "It holds the navigation only", "The footer carries closing information such as the creator note.", "puts-main-content-in-footer|thinks-footer-is-navigation"],
        ["labelled-input", "Why choose the email input type for an email field?", "The browser can offer the right keyboard and a basic check", "It sends the address somewhere for you", "It makes the field required", "The type describes the value the field expects. Sending data is a separate decision.", "thinks-type-sends-data|confuses-type-with-required"],
        ["describe-content", "Which page can be understood without any CSS?", "One with headings, paragraphs, lists and links in order", "One with coloured boxes only", "One with a single heading and no text", "Reading the page without styling is the clearest test of its structure.", "relies-on-colour|omits-the-content"],
      ],
      practical: {
        title: "Finish the page outline",
        brief: "Keep the words. Add the page regions, a link that reaches a section, a described image and a labelled field, then check the page reads well without CSS.",
        focus: "describe-content",
        editable: ["html"],
        requirements: [
          ["Header, main and footer are present", landmarks("header", "main", "footer"), "landmarks"],
          ["A link reaches a section that exists", fragmentLink(), "links"],
          ["The picture is described for someone who cannot see it", imageAlt(), "image-alt"],
          ["Every form control has a connected label", labelledControls(), "labelled-input", "accessibility"],
          ["A list holds three items", list(3), "describe-content"],
        ],
      },
    },
    C: {
      questions: [
        ["links", "Where should a fragment link point?", "To an id that exists on the same page", "To another website", "To a CSS class name", "A fragment link uses a hash and an id, so the destination must exist on the page.", "confuses-id-and-class|expects-an-external-address"],
        ["image-alt", "What is the difference between src and alt on an image?", "src is the picture file and alt is its description", "src is the description and alt is the file", "Both are descriptions of the picture", "src tells the browser which file to show. alt tells a person what it means.", "swaps-src-and-alt|thinks-both-are-descriptions"],
        ["landmarks", "Why use header, main and footer instead of generic div elements?", "They tell assistive technology what each region is for", "They make the page load faster", "They are required before CSS can work", "A named region is understood by browsers and screen readers. A div says nothing.", "thinks-it-is-performance|thinks-css-requires-them"],
        ["labelled-input", "What does an accessible form control need?", "A visible label that is connected to it", "A placeholder instead of a label", "A red border when it is wrong", "A label is always visible and readable. Colour alone cannot carry the message.", "uses-placeholder-as-a-label|relies-on-colour-only"],
        ["describe-content", "Why look at the page without any CSS?", "It shows whether the structure makes sense on its own", "It proves the page is finished", "It changes the order of the elements", "Reading the unstyled page shows whether the content is organised well.", "treats-the-test-as-finishing|expects-the-order-to-change"],
      ],
      practical: {
        title: "Structure the whole page",
        brief: "Give the project page its full structure: regions, a link to a section, a described picture, one labelled field and a list inside a section.",
        focus: "describe-content",
        editable: ["html"],
        requirements: [
          ["The page has header, main and footer regions", landmarks("header", "main", "footer"), "landmarks"],
          ["A working link reaches a section of this page", fragmentLink(), "links"],
          ["The image is described usefully", imageAlt(), "image-alt"],
          ["A labelled input is present", labelledControls(), "labelled-input", "accessibility"],
          ["A section holds a list of three items", list(3), "describe-content"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------------ 3. CSS basics ---- */

const cssFoundations: AuthoredModule = {
  ideas: {
    rules: { slug: "rules", lesson: "rules", difficulty: "foundation", cognitive: "remember" },
    "class-reuse": { slug: "class-reuse", lesson: "classes", difficulty: "developing", cognitive: "apply" },
    "readable-type": { slug: "readable-type", lesson: "type", difficulty: "developing", cognitive: "apply" },
    "card-component": { slug: "card-component", lesson: "cards", difficulty: "developing", cognitive: "apply" },
    "visual-system": { slug: "visual-system", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["rules", "Which part of a CSS rule chooses what to style?", "The selector before the braces", "The value after the colon", "The semicolon at the end", "The selector chooses elements. Inside the braces, each declaration is a property and a value.", "confuses-selector-and-value|thinks-semicolons-choose-elements"],
        ["class-reuse", "When is a class the right choice?", "When several elements share the same style", "When only one element exists on the page", "When the style needs to change on every visit", "A class is a reusable label, so one rule can style many elements.", "uses-a-class-for-one-element|expects-a-class-to-change-behaviour"],
        ["readable-type", "What makes a paragraph comfortable to read?", "A readable size with enough line height", "The smallest possible text", "Every sentence in bold", "Size and line height together decide whether a paragraph is easy to read.", "makes-text-tiny|thinks-bold-fixes-readability"],
        ["card-component", "What does a border do for a content card?", "It draws a clear edge around the card", "It changes the words inside it", "It moves the card to another page", "Padding, border and background make a card read as one piece.", "thinks-a-border-changes-content|expects-a-border-to-move-content"],
        ["visual-system", "Why reuse a few design choices everywhere?", "The page looks consistent and is easier to change later", "Each section becomes a separate website", "The page stops needing HTML", "A small set of repeated choices is what makes a page look deliberate.", "expects-every-section-to-differ|thinks-css-replaces-html"],
      ],
      practical: {
        title: "Create the visual system",
        brief: "In the CSS file, style the body text, the main heading and a reusable card so the page looks deliberate and is easy to read.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["The body text is readable", readableText(), "readable-type"],
          ["A card class has inner spacing", decl("padding", "padding", ".card"), "card-component"],
          ["A card class has a border", decl("border", "border", ".card"), "card-component"],
          ["A rule sets the page text colour", decl("color", "colour"), "rules"],
          ["A named design value is reused", usesVar(1), "visual-system"],
        ],
      },
    },
    B: {
      questions: [
        ["rules", "What does a CSS declaration contain?", "A property, a colon and a value", "A file name and a size", "Two selectors and a bracket", "One declaration changes one property, for example color: #111936.", "expects-a-declaration-to-name-a-file|puts-two-selectors-in-one-declaration"],
        ["class-reuse", "How is a class selector written?", "With a full stop before the class name", "With a hash before the class name", "With the element name only", "A full stop marks a class. A hash marks an id.", "confuses-class-and-id-syntax|uses-the-element-name"],
        ["readable-type", "Which unit keeps text readable on different screens?", "A relative unit such as rem", "A number of centimetres", "A fixed count of characters", "Relative units follow the visitor's own settings.", "uses-fixed-physical-units|thinks-character-count-is-a-unit"],
        ["card-component", "Which combination makes a card look like one unit?", "Background, border and padding together", "A different font for every line", "A border with no spacing inside", "The card reads as one piece when its background, edge and inner space agree.", "changes-the-font-per-line|adds-a-border-with-no-padding"],
        ["visual-system", "Why define colours once as named values?", "One change updates every place that uses the value", "It removes the need for a stylesheet", "It changes the HTML tags", "A named value keeps a design consistent and quick to adjust.", "expects-the-stylesheet-to-disappear|thinks-values-change-tags"],
      ],
      practical: {
        title: "Style the project consistently",
        brief: "Style the body, the heading and the card class with a small set of repeated choices. Run the page after each rule to see what changed.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["The paragraphs have a readable line height", decl("line-height", "line-height"), "readable-type"],
          ["The card has a border", decl("border", "border", ".card"), "card-component"],
          ["The card has outside spacing", decl("margin", "margin", ".card"), "card-component"],
          ["A style rule chooses a colour", decl("color", "colour"), "rules"],
          ["More than one design value is named", namedValues(2), "visual-system"],
        ],
      },
    },
    C: {
      questions: [
        ["rules", "What do the braces in a CSS rule contain?", "The declarations that apply to the selector", "The name of the HTML file", "The words shown on the page", "The selector chooses, and the braces hold the declarations.", "expects-markup-in-the-braces|puts-content-in-a-stylesheet"],
        ["class-reuse", "How many elements may share one class?", "As many as the developer chooses to label", "Exactly one element", "Two at the most", "A class is a reusable label, so it can appear many times.", "expects-one-element-per-class|limits-classes-to-two"],
        ["readable-type", "What happens when line height is too small?", "Lines of text crowd each other and become hard to read", "The page stops loading", "The text becomes a link", "Line height controls the space between lines of text.", "expects-the-page-to-break|confuses-line-height-with-links"],
        ["card-component", "What is the difference between padding and border?", "Padding is space inside the border", "Padding draws the edge and border fills the space", "Both are outside the element", "Padding creates inner space and the border draws the edge around it.", "swaps-padding-and-border|places-both-outside"],
        ["visual-system", "Which set of choices belongs to a visual system?", "Colour, readable type and repeated spacing", "One new style for every element", "The JavaScript used on the page", "A visual system is a small set of repeated decisions.", "styles-every-element-differently|confuses-css-with-javascript"],
      ],
      practical: {
        title: "Make the page look deliberate",
        brief: "Write the stylesheet for your project: body text, one heading rule and a reusable card. Add a named value you can reuse.",
        focus: "visual-system",
        editable: ["css"],
        requirements: [
          ["The body uses a readable line height", decl("line-height", "line-height"), "readable-type"],
          ["A card class has inner spacing", decl("padding", "padding", ".card"), "card-component"],
          ["A card class has an edge", decl("border", "border", ".card"), "card-component"],
          ["A rule states a property and a value", decl("color", "colour"), "rules"],
          ["Design values are named for reuse", namedValues(3), "visual-system"],
        ],
      },
    },
  },
};

/* --------------------------------------------------------------- 4. layouts --- */

const cssLayout: AuthoredModule = {
  ideas: {
    "box-model": { slug: "box-model", lesson: "box", difficulty: "developing", cognitive: "understand" },
    "flex-row": { slug: "flex-row", lesson: "flex", difficulty: "developing", cognitive: "apply" },
    "grid-columns": { slug: "grid-columns", lesson: "grid", difficulty: "developing", cognitive: "apply" },
    "media-query": { slug: "media-query", lesson: "responsive", difficulty: "developing", cognitive: "apply" },
    "responsive-page": { slug: "responsive-page", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["box-model", "Where does padding create space?", "Between the content and its border", "Outside the element, away from its neighbours", "Between two pages of a website", "Padding is the inner space of a box. Margin is the space around the outside.", "confuses-padding-and-margin|expects-padding-outside"],
        ["flex-row", "What does display flex do to a group of items?", "It lays them out in a row that can share the space", "It puts each item on its own page", "It changes the words inside them", "Flexbox arranges items along one line and can wrap them when space runs out.", "thinks-flex-hides-items|expects-flex-to-change-text"],
        ["grid-columns", "What does one fr unit mean in a grid?", "One share of the space that is available", "One fixed pixel width", "One form field", "Fraction units divide the available space between the tracks.", "thinks-fr-is-a-fixed-size|confuses-fr-with-form-fields"],
        ["media-query", "When does a media query apply?", "Only when its condition matches the screen", "On every screen at all times", "Only when JavaScript runs", "A media query is a condition: the rules inside apply when it is true.", "thinks-rules-always-apply|expects-a-script-to-trigger-it"],
        ["responsive-page", "What should stay the same on a narrow screen?", "The content and what a visitor can do", "The exact number of columns", "The fixed width of the page", "The arrangement may change, but the meaning and the actions must not.", "removes-content-on-phones|keeps-a-fixed-width"],
      ],
      practical: {
        title: "Build the responsive layout",
        brief: "In the CSS file, arrange the navigation as a row, the cards as a grid, and add one breakpoint so the cards become a single column on a narrow screen.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["The navigation is arranged as a row", decl("display", "flex", "nav"), "flex-row"],
          ["The navigation can wrap", decl("flex-wrap", "wrap", "nav"), "flex-row"],
          ["The card group uses Grid", decl("display", "grid", ".cards"), "grid-columns"],
          ["The grid uses flexible tracks", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["A breakpoint changes the layout", breakpoint(600), "media-query"],
        ],
      },
    },
    B: {
      questions: [
        ["box-model", "What does box-sizing border-box change?", "The declared width includes padding and border", "It removes every border on the page", "It changes the width of the screen", "Border-box sizing keeps the arithmetic simple: the declared width is the whole box.", "expects-borders-to-vanish|confuses-the-box-with-the-screen"],
        ["flex-row", "Which combination places links side by side with even space?", "display flex with a gap", "display grid with no gap", "A fixed width on each link", "Flexbox plus a gap arranges a row without hand-measured spacing.", "expects-fixed-widths-to-space|omits-the-gap"],
        ["grid-columns", "How do you ask Grid for three equal columns?", "repeat(3, minmax(0, 1fr))", "repeat(3px, minmax(0, 1fr))", "width 33 percent on every card", "Repeat creates the tracks and minmax with 1fr lets them share the space.", "uses-fixed-column-widths|repeats-a-pixel-value"],
        ["media-query", "How should the width in a breakpoint be chosen?", "Where the layout starts to feel cramped", "From the age of the visitor", "At every possible pixel width", "The content decides where it needs more room.", "picks-a-breakpoint-by-device-name|adds-a-breakpoint-per-pixel"],
        ["responsive-page", "What is the safest starting point for a layout?", "The narrow layout first, then wider enhancements", "The widest layout first", "A fixed desktop width", "Starting narrow protects the smallest screen and keeps the content readable.", "starts-from-desktop|uses-one-fixed-width"],
      ],
      practical: {
        title: "Arrange the project layout",
        brief: "Make the navigation a wrapping row and the cards a grid with a gap. Add a breakpoint where the layout gains a column.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["The navigation has a gap", decl("gap", "gap", "nav"), "flex-row"],
          ["The cards use Grid", decl("display", "grid", ".cards"), "grid-columns"],
          ["The cards use minmax tracks", decl("grid-template-columns", "minmax", ".cards"), "grid-columns"],
          ["A media query changes the layout", breakpoint(700), "media-query"],
        ],
      },
    },
    C: {
      questions: [
        ["box-model", "What is the difference between margin and padding?", "Margin is space outside the element, padding is inside", "Margin is inside the element, padding is outside", "Both add space inside the element", "Margin separates an element from its neighbours. Padding moves content in from its own edge.", "swaps-margin-and-padding|thinks-both-are-inner-space"],
        ["flex-row", "What allows items in a row to wrap onto the next line?", "flex-wrap wrap on the container", "A wider border on each item", "A media query on every item", "Wrapping lets a row continue on the next line instead of forcing the page wider.", "expects-borders-to-wrap-items|wraps-with-a-media-query"],
        ["grid-columns", "What does Grid arrange that Flexbox does not do as well?", "Rows and columns together", "Only one item at a time", "The text inside an item", "Grid controls two dimensions at once, which suits a card layout.", "expects-grid-to-edit-text|thinks-grid-handles-one-item"],
        ["media-query", "What belongs inside a media query?", "Only the rules that need to change at that width", "The whole stylesheet again", "The HTML of the page", "Keeping a breakpoint small makes it easy to see what changes and why.", "repeats-the-whole-stylesheet|puts-markup-in-the-stylesheet"],
        ["responsive-page", "What must never happen on a small screen?", "Sideways scrolling to reach the content", "Text wrapping onto two lines", "A list becoming taller", "Content that overflows the viewport makes a page hard to use on a phone.", "accepts-horizontal-scrolling|expects-content-to-be-removed"],
      ],
      practical: {
        title: "Make the project fit every screen",
        brief: "Set the box model, arrange the navigation and cards, and add the breakpoint. Then make the page narrower and check nothing scrolls sideways.",
        focus: "responsive-page",
        editable: ["css"],
        requirements: [
          ["Every box counts its border inside its width", decl("box-sizing", "border-box"), "box-model"],
          ["The navigation is a flexible row", decl("display", "flex", "nav"), "flex-row"],
          ["The cards use Grid with a gap", decl("gap", "gap", ".cards"), "grid-columns"],
          ["The cards have flexible tracks", decl("grid-template-columns", "fr", ".cards"), "grid-columns"],
          ["A breakpoint adapts the layout", breakpoint(600), "media-query"],
        ],
      },
    },
  },
};

/* ------------------------------------------------- 5. JavaScript foundations -- */

const javascriptFoundations: AuthoredModule = {
  ideas: {
    "dom-output": { slug: "dom-output", lesson: "output", difficulty: "developing", cognitive: "apply" },
    variables: { slug: "variables", lesson: "variables", difficulty: "developing", cognitive: "understand" },
    "strings-numbers": { slug: "strings-numbers", lesson: "types", difficulty: "developing", cognitive: "understand" },
    functions: { slug: "functions", lesson: "functions", difficulty: "developing", cognitive: "apply" },
    "page-information": { slug: "page-information", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["dom-output", "What does querySelector find?", "The first element that matches a CSS selector", "Every element on the page", "The text inside an element", "querySelector returns one element, which is why the selector must be precise.", "expects-every-element|expects-text-instead"],
        ["variables", "When should const be used instead of let?", "When the name keeps the same value", "When the value needs to change later", "When the value is a number", "const keeps one binding. let signals that the value is expected to change.", "uses-let-for-everything|chooses-by-value-type"],
        ["strings-numbers", "How is the number 7 different from the text \"7\"?", "One is a number the code can calculate with, the other is characters", "They are exactly the same to the browser", "The text version is always larger", "Text and numbers behave differently, so the type must match what the code does.", "treats-text-and-numbers-as-equal|expects-text-to-scroll"],
        ["functions", "What runs the instructions inside a function?", "Calling the function by name", "Naming the function", "Writing a comment above it", "Defining a function prepares it. Calling it runs the instructions.", "expects-definition-to-run|expects-a-comment-to-run"],
        ["page-information", "What should the page show after the code runs?", "Useful information a visitor can read", "The code itself on the page", "Nothing until the page is reloaded", "Visible, useful output is the point of the JavaScript in this project.", "prints-the-code|expects-a-reload"],
      ],
      practical: {
        title: "Show useful page information",
        brief: "In the JavaScript file, select the element you want to update, store a value, and use a function to put a useful message on the page.",
        focus: "page-information",
        editable: ["javascript"],
        requirements: [
          ["The output element is selected", calls("querySelector"), "dom-output"],
          ["A value is stored for later use", js("declaration"), "variables"],
          ["A text value is placed on the page", js("string-literal"), "strings-numbers"],
          ["A named function is defined", declaresFunction(0), "functions"],
          ["The visible text is updated", assigns("textContent"), "page-information"],
        ],
      },
    },
    B: {
      questions: [
        ["dom-output", "Which property changes the plain words inside an element?", "textContent", "querySelector", "addEventListener", "textContent replaces the visible text of an element safely.", "confuses-text-with-finding|confuses-text-with-events"],
        ["variables", "What does the equals sign do in let count = 3?", "It stores the value 3 under the name count", "It compares count with 3", "It prints 3 on the page", "A single equals sign stores a value. Comparison uses two or three.", "expects-a-comparison|expects-output"],
        ["strings-numbers", "What marks a text value in JavaScript?", "Quotation marks around it", "A full stop after it", "A hash before it", "Quotation marks tell the browser the value is text, not code.", "expects-a-full-stop|expects-a-hash"],
        ["functions", "What does a function name make easier?", "Reusing the same job in more than one place", "Hiding the code from the browser", "Changing the page colour", "A named job can be called whenever it is needed.", "expects-hiding|confuses-with-styling"],
        ["page-information", "Which order works best?", "Select the element, decide the value, then show it", "Show the value, then decide what it is", "Change the HTML file instead", "Working in that order means the element exists before it is updated.", "updates-before-deciding|edits-markup-instead"],
      ],
      practical: {
        title: "Add useful information",
        brief: "Update the page with JavaScript: select the output element, store a value in a variable, and show the value through a function you define and call.",
        focus: "page-information",
        editable: ["javascript"],
        requirements: [
          ["The output element is found", calls("querySelector"), "dom-output"],
          ["A value is kept in a variable", js("declaration"), "variables"],
          ["Text is used where text belongs", js("string-literal"), "strings-numbers"],
          ["A function with a name is defined", declaresFunction(0), "functions"],
          ["The visible text is set by the function", assigns("textContent"), "page-information"],
        ],
      },
    },
    C: {
      questions: [
        ["dom-output", "Why store the element in a const before changing it?", "The name can be reused without searching the page again", "It stops the element from moving", "It changes the element type", "One lookup with a clear name keeps the code shorter and easier to check.", "searches-again-every-time|expects-the-element-to-move"],
        ["variables", "What is the difference between defining and using a variable?", "Defining stores the value, using reads it somewhere else", "Both print the value", "Using changes the variable name", "The name is created once and then read wherever it is needed.", "thinks-using-value-prints-it|expects-renaming"],
        ["strings-numbers", "Which value can be added to another number?", "The number 5", "The text \"five\"", "The word total", "Only numbers can be calculated with, which is why text and numbers are kept apart.", "adds-text-to-numbers|expects-a-word-to-calculate"],
        ["functions", "What is the job of a function in this project?", "To do one clear job that can be tested", "To replace the HTML", "To make the page load", "One job per function makes the behaviour easy to test and to explain.", "expects-it-to-replace-markup|thinks-it-loads-the-page"],
        ["page-information", "How do you know the JavaScript worked?", "The page shows the information you expected", "The file became longer", "The page reloaded on its own", "Visible, predicted output is the evidence that the code ran.", "judges-by-file-length|expects-an-automatic-reload"],
      ],
      practical: {
        title: "Put information on the page",
        brief: "Use the JavaScript file to find the output element, keep a value, define one function and call it so a visitor sees useful information.",
        focus: "page-information",
        editable: ["javascript"],
        requirements: [
          ["The page element is selected", calls("querySelector"), "dom-output"],
          ["A named value is stored", js("declaration"), "variables"],
          ["Text and numbers are used correctly", js("string-literal"), "strings-numbers"],
          ["A function is defined", declaresFunction(0), "functions"],
          ["The page shows a result", assigns("textContent"), "page-information"],
        ],
      },
    },
  },
};

/* ------------------------------------------------------ 6. decisions and data -- */

const javascriptLogic: AuthoredModule = {
  ideas: {
    comparisons: { slug: "comparisons", lesson: "compare", difficulty: "developing", cognitive: "understand" },
    "if-else": { slug: "if-else", lesson: "conditions", difficulty: "developing", cognitive: "apply" },
    arrays: { slug: "arrays", lesson: "arrays", difficulty: "developing", cognitive: "apply" },
    "loops-render": { slug: "loops-render", lesson: "loops", difficulty: "developing", cognitive: "apply" },
    "data-content": { slug: "data-content", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["comparisons", "What does a comparison produce?", "A true or false result", "A new list of items", "A change to the page colour", "A comparison answers a yes or no question that code can act on.", "expects-a-list|expects-a-style-change"],
        ["if-else", "When does the else block run?", "When the if condition is false", "Before the condition is checked", "Every time the page loads", "if runs when the condition is true, and else runs when it is not.", "expects-else-always|expects-else-before-the-check"],
        ["arrays", "What does an array hold?", "An ordered group of values", "One single value only", "A CSS rule", "An array is a list, so repeated information can be processed together.", "expects-one-value|confuses-an-array-with-css"],
        ["loops-render", "How often does forEach run its function?", "Once for every item in the array", "Once for the whole page", "Only when a button is pressed", "forEach visits every item, one at a time, in order.", "expects-one-run|expects-a-click-to-start-it"],
        ["data-content", "Why keep the data in an array instead of writing each item in HTML?", "One set of instructions can show every item", "It changes the colour of the page", "It removes the need to test", "Data plus one rendering step makes the page easier to change.", "hand-writes-every-item|thinks-data-replaces-testing"],
      ],
      practical: {
        title: "Show a group of items",
        brief: "In the JavaScript file, store the items in an array, loop through them, and add one list item to the page for each item in the array.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["The items are stored in an array", js("array-literal"), "arrays"],
          ["Each item is processed in turn", calls("forEach"), "loops-render"],
          ["A list item is created for each item", js("create-element"), "loops-render"],
          ["The code compares values strictly", js("strict-equality"), "comparisons"],
          ["Each item is added to the page", js("append"), "data-content"],
        ],
      },
    },
    B: {
      questions: [
        ["comparisons", "Which comparison asks whether two values are the same?", "===", "=", "=>", "Three equals signs compare. A single equals sign stores.", "confuses-assignment-with-comparison|confuses-arrow-with-comparison"],
        ["if-else", "What is a good reason to use if and else?", "The page has two possible messages", "The page needs a new file", "The list must be sorted", "A condition picks between two outcomes, which is exactly two messages.", "expects-a-new-file|confuses-conditions-with-sorting"],
        ["arrays", "What is the first position in an array numbered as?", "0", "1", "-1", "Counting starts at zero, so the first item sits at position zero.", "starts-counting-at-one|expects-negative-index"],
        ["loops-render", "Which combination creates a visible list from an array?", "forEach, createElement, textContent and append", "querySelector and a CSS rule", "A media query and a border", "The loop creates one element per item and adds it to the page.", "expects-css-to-create-items|expects-a-media-query-to-render"],
        ["data-content", "What stays the same about every record in an array?", "The property names it uses", "The number of letters in its title", "The colour of its text", "Consistent property names let one loop handle every record.", "varies-property-names|judges-records-by-length"],
      ],
      practical: {
        title: "Build a list from data",
        brief: "Keep the items in an array, then loop through them and add one visible list item for each. Test with two items and then with four.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["A group of items is stored", js("array-literal"), "arrays"],
          ["The group is looped through", calls("forEach"), "loops-render"],
          ["Every item becomes an element", js("create-element"), "loops-render"],
          ["The code compares values strictly", js("strict-equality"), "comparisons"],
          ["Every element is added to the page", js("append"), "data-content"],
        ],
      },
    },
    C: {
      questions: [
        ["comparisons", "Why is a comparison useful before showing a message?", "It decides which message is true for the visitor", "It changes the font size", "It stores the message permanently", "The comparison is the decision behind the message.", "expects-a-comparison-to-store-data|expects-a-compare-to-style"],
        ["if-else", "What should each branch of an if and else do?", "Set one clear outcome", "Run every other function", "Change the HTML structure", "Each branch answers one case, which keeps the behaviour predictable.", "runs-everything|changes-the-structure"],
        ["arrays", "How do you find how many items an array holds?", "Read its length", "Count the commas by hand", "Open the stylesheet", "The length property reports the number of items.", "counts-by-hand|looks-in-the-stylesheet"],
        ["loops-render", "Why use textContent for record titles?", "It adds the words as text rather than as markup", "It saves the record forever", "It makes the list sort itself", "textContent treats the value as plain text, which is what a title is.", "expects-markup|expects-storage"],
        ["data-content", "What is the best test of the loop?", "Adding a fourth item and checking a fourth line appears", "Changing the page colour", "Deleting the array", "A new item appearing proves the loop handles a changing group.", "changes-css-instead|expects-the-loop-to-guess"],
      ],
      practical: {
        title: "Turn data into page content",
        brief: "Store your items in an array and render them: one element per item, added to a list on the page. Then add one more item and check it appears.",
        focus: "data-content",
        editable: ["javascript"],
        requirements: [
          ["The items live in an array", js("array-literal"), "arrays"],
          ["A loop visits every item", calls("forEach"), "loops-render"],
          ["An element is created for each item", js("create-element"), "loops-render"],
          ["The code compares values strictly", js("strict-equality"), "comparisons"],
          ["Each element is added to the list", js("append"), "data-content"],
        ],
      },
    },
  },
};

/* --------------------------------------------------------- 7. interactions ---- */

const domInteraction: AuthoredModule = {
  ideas: {
    selecting: { slug: "selecting", lesson: "select", difficulty: "developing", cognitive: "apply" },
    "click-events": { slug: "click-events", lesson: "events", difficulty: "developing", cognitive: "apply" },
    "class-toggle": { slug: "class-toggle", lesson: "classes", difficulty: "developing", cognitive: "apply" },
    "reading-input": { slug: "reading-input", lesson: "forms", difficulty: "developing", cognitive: "apply", mandatory: "accessibility" },
    "form-behaviour": { slug: "form-behaviour", lesson: "project", difficulty: "developing", cognitive: "apply" },
  },
  forms: {
    A: {
      questions: [
        ["selecting", "What does document.querySelector receive?", "A CSS selector such as #status", "A password", "A file name", "The selector finds the element, which is why the id in the HTML must match.", "passes-plain-text|passes-a-file-name"],
        ["click-events", "When does the function inside addEventListener run?", "When its event happens", "Before the page loads", "Every second", "The listener waits for the named event and then runs the function once per event.", "expects-it-to-run-immediately|expects-a-timer"],
        ["class-toggle", "What does classList.toggle do?", "Adds the class if it is missing and removes it if it is present", "Deletes the element", "Changes the element into a link", "Toggling switches one state on and off, which is what a switch is for.", "expects-deletion|expects-a-tag-change"],
        ["reading-input", "How do you read what a visitor typed?", "Read the value property of the input", "Read the label text", "Read the stylesheet", "The value property holds the current text in the field.", "reads-the-label|reads-the-stylesheet"],
        ["form-behaviour", "What should happen after a visitor sends a form?", "A clear message tells them what happened", "The page reloads silently", "The form disappears with no explanation", "Feedback confirms the action, and a status region makes it available to everyone.", "expects-silence|expects-the-form-to-vanish"],
      ],
      practical: {
        title: "Connect a control to the page",
        brief: "Add a labelled field and a button, then make the page show a clear message when it is used. Test with the keyboard as well as the mouse.",
        focus: "form-behaviour",
        editable: ["html", "javascript"],
        requirements: [
          ["A form control is labelled", labelledControls(), "reading-input", "accessibility"],
          ["The feedback area can be announced", statusRegion(), "form-behaviour"],
          ["An event listener is added", js("event-listener"), "click-events"],
          ["A visible state is switched on and off", calls("toggle"), "class-toggle"],
          ["The typed value is trimmed before use", calls("trim"), "reading-input"],
        ],
      },
    },
    B: {
      questions: [
        ["selecting", "Why store a selected element in a const?", "So the same element can be used again without searching twice", "So the element cannot be changed", "So the page loads faster", "One lookup with a descriptive name keeps the code clear.", "expects-it-to-be-unchangeable|expects-a-speed-gain"],
        ["click-events", "Which event suits a button being pressed?", "click", "scroll", "resize", "click is the event a button produces when it is activated.", "expects-scroll|expects-resize"],
        ["class-toggle", "What is a class toggle useful for?", "Switching a visible state such as open and closed", "Storing a value in the browser", "Creating a new page", "One class can carry one state, which the stylesheet then shows.", "expects-storage|expects-a-new-page"],
        ["reading-input", "Why trim the typed value before checking it?", "Spaces alone should not count as real input", "It changes the words into numbers", "It saves the value automatically", "trim removes surrounding spaces so an empty-looking entry is treated as empty.", "expects-a-number|expects-storage"],
        ["form-behaviour", "What makes feedback easy to understand?", "A specific message that names what happened", "A colour change with no words", "A silent update", "Words carry the meaning. Colour alone can never be the only signal.", "relies-on-colour|leaves-the-page-silent"],
      ],
      practical: {
        title: "Make the form respond",
        brief: "Connect a labelled field to the page: read the value, show a message and keep the feedback available to assistive technology.",
        focus: "form-behaviour",
        editable: ["html", "javascript"],
        requirements: [
          ["The field has a connected label", labelledControls(), "reading-input", "accessibility"],
          ["Feedback has a status role", statusRegion(), "form-behaviour"],
          ["The control responds to an event", js("event-listener"), "click-events"],
          ["The element is selected once and stored", calls("querySelector"), "selecting"],
          ["A class state is switched by the code", calls("toggle"), "class-toggle"],
        ],
      },
    },
    C: {
      questions: [
        ["selecting", "What happens if the selector does not match anything?", "The code has nothing to work with and the change fails", "The browser creates the element for you", "The stylesheet adds it", "A selector must match real HTML, which is why the id is checked first.", "expects-the-browser-to-invent-it|expects-css-to-add-it"],
        ["click-events", "Why add the listener to the element that has the job?", "The event belongs to that control", "It makes the page shorter", "It changes the HTML", "Attaching the listener to the right element keeps the behaviour predictable.", "attaches-to-the-document-always|expects-a-shorter-file"],
        ["class-toggle", "What carries the visual change when a class is toggled?", "The stylesheet rule for that class", "The JavaScript file", "A new HTML element", "JavaScript changes the state and CSS decides how that state looks.", "expects-script-to-style|expects-a-new-element"],
        ["reading-input", "What should happen when the field is empty?", "A friendly message explains what to enter", "Nothing at all happens", "The page closes", "A clear message tells the visitor what to do next.", "leaves-it-silent|expects-the-page-to-close"],
        ["form-behaviour", "Which test proves the interaction works?", "Use it with the mouse and then with the keyboard", "Look at the code once", "Change the page colour", "Keyboard and mouse together show the control works for more people.", "never-tests|tests-only-appearance"],
      ],
      practical: {
        title: "Build a working interaction",
        brief: "Give your project one labelled control and one clear response. Check that the message appears for both a mouse and the keyboard.",
        focus: "form-behaviour",
        editable: ["html", "javascript"],
        requirements: [
          ["The control is labelled", labelledControls(), "reading-input", "accessibility"],
          ["A live status region exists", statusRegion(), "form-behaviour"],
          ["An event listener is attached", js("event-listener"), "click-events"],
          ["A visible state can be toggled", calls("toggle"), "class-toggle"],
          ["The typed value is trimmed first", calls("trim"), "reading-input"],
        ],
      },
    },
  },
};

/* --------------------------------------------------------------- 8. quality --- */

const quality: AuthoredModule = {
  ideas: {
    "repair-html": { slug: "repair-html", lesson: "html", difficulty: "secure", cognitive: "analyse" },
    "repair-syntax": { slug: "repair-syntax", lesson: "syntax", difficulty: "secure", cognitive: "analyse" },
    "access-check": { slug: "access-check", lesson: "access", difficulty: "secure", cognitive: "evaluate", mandatory: "accessibility" },
    "safe-note": { slug: "safe-note", lesson: "sharing", difficulty: "secure", cognitive: "understand", mandatory: "privacy" },
    "finished-site": { slug: "finished-site", lesson: "project", difficulty: "secure", cognitive: "evaluate" },
  },
  forms: {
    A: {
      questions: [
        ["repair-html", "What is the first step when a page looks wrong?", "Find the first broken element in the reading order", "Rewrite the whole file", "Delete the stylesheet", "Working through the structure from the top finds the first real problem.", "rewrites-everything|blames-the-stylesheet"],
        ["repair-syntax", "What does a mismatched closing tag usually do?", "Changes which content belongs to which element", "Stops the page from opening", "Removes every image", "The browser keeps going, which is why the mistake can be hard to spot.", "expects-a-total-failure|expects-images-to-go"],
        ["access-check", "What should an accessibility check include?", "Keyboard use, labels, alternative text and feedback", "Only colours and fonts", "Only the file size", "Accessibility covers seeing, understanding and operating the page.", "checks-appearance-only|checks-file-size-only"],
        ["safe-note", "What is safe to put in a project credit?", "A nickname and the technologies used", "A full name and a school", "A phone number for questions", "A credit should show the work without identifying a young person.", "shares-a-full-name|shares-contact-detail"],
        ["finished-site", "What is the strongest evidence that the website is finished?", "Recorded tests showing each required part works", "A large amount of code", "A colourful design", "Test evidence with a clear explanation shows the work really works.", "judges-by-code-size|judges-by-appearance"],
      ],
      practical: {
        title: "Test and finish the website",
        brief: "Repair the broken element, add the keyboard focus style, describe the image and write a safe credit. Then record what you tested.",
        focus: "finished-site",
        editable: ["html", "css"],
        requirements: [
          ["The page structure is complete", landmarks("header", "main", "footer"), "repair-html"],
          ["A declaration uses a property and a value", decl("color", "colour"), "repair-syntax"],
          ["Keyboard focus is visible", focusRing(), "access-check", "accessibility"],
          ["The image is described in words", imageAlt(), "access-check"],
          ["The page shares no personal contact detail", freeOf("personal-contact"), "safe-note", "privacy"],
        ],
      },
    },
    B: {
      questions: [
        ["repair-html", "A closing tag is missing in the middle of a page. Which content is affected?", "The element that is missing its closing tag and what follows it", "Only the last element on the page", "Nothing, the browser ignores it", "The affected element may swallow the following content until the browser finds an end.", "assumes-no-effect|blames-the-final-element"],
        ["repair-syntax", "Which mistake stops a CSS declaration from working?", "Using an equals sign instead of a colon", "Writing the property in lowercase", "Ending the declaration with a semicolon", "CSS uses a colon between property and value. An equals sign is JavaScript.", "confuses-css-with-javascript-syntax|thinks-lowercase-breaks-rules"],
        ["access-check", "Why does colour alone never carry a message?", "Some visitors cannot see the difference between the colours", "Colours make the page load slowly", "Colour is not part of the web", "A message needs words as well as colour, or it disappears for some visitors.", "relies-on-colour|thinks-colour-is-unsupported"],
        ["safe-note", "Which detail should be left out of a project page?", "A home address or the name of a school", "A nickname chosen by the learner", "A description of the topic", "Personal details identify a young person, so they stay out of the page.", "includes-a-school-name|includes-a-home-address"],
        ["finished-site", "What should be recorded after a repair?", "What was expected, what happened and what fixed it", "Only that the page looks better", "Nothing, repairs do not need records", "A short record of expected and actual results shows the repair was tested.", "records-only-a-feeling|skips-the-record"],
      ],
      practical: {
        title: "Check and finish the page",
        brief: "Repair the structure, add visible keyboard focus, describe the picture and write a credit that shares nothing personal about you.",
        focus: "finished-site",
        editable: ["html", "css"],
        requirements: [
          ["Header, main and footer are present", landmarks("header", "main", "footer"), "repair-html"],
          ["A declaration uses a property and a value", decl("color", "colour"), "repair-syntax"],
          ["Keyboard users can see the focus", focusRing(), "access-check", "accessibility"],
          ["The credit contains no contact detail", freeOf("personal-contact"), "safe-note", "privacy"],
          ["The heading order steps down without gaps", headingOrder(), "finished-site"],
        ],
      },
    },
    C: {
      questions: [
        ["repair-html", "Which habit prevents broken structure?", "Writing an opening and closing tag together, then filling the content", "Writing all the opening tags first", "Writing the stylesheet first", "Pairing the tags as you write makes a mismatch visible immediately.", "writes-openers-first|starts-with-css"],
        ["repair-syntax", "A JavaScript file stops with an error. What is the best next step?", "Read the reported line and check that one line only", "Rewrite the whole file", "Delete the JavaScript", "One line at a time isolates the cause and keeps what already worked.", "rewrites-the-file|deletes-the-code"],
        ["access-check", "Why test with the keyboard?", "Some visitors cannot use a mouse", "The keyboard makes the page faster", "It changes the layout", "Keyboard access is how many people use the page at all.", "thinks-it-is-faster|expects-a-layout-change"],
        ["safe-note", "What should a learner do before sharing a page?", "Read it again to check that no personal detail is visible", "Add their school name for credit", "Add their email so people can reply", "Reviewing the page for personal details protects the learner.", "adds-a-school-name|adds-an-email"],
        ["finished-site", "What does a known limitation tell a reader?", "What this version does not do yet", "That the page is broken", "That the work is unfinished and should be ignored", "An honest limit sets expectations and shows the work was reviewed.", "treats-limits-as-failures|hides-the-limits"],
      ],
      practical: {
        title: "Repair, check and release",
        brief: "Repair the structure, make keyboard focus visible, describe the images and write a credit that a stranger could read without learning anything personal about you.",
        focus: "finished-site",
        editable: ["html", "css"],
        requirements: [
          ["The regions are all present", landmarks("header", "main", "footer"), "repair-html"],
          ["The stylesheet is written with a colon", decl("color", "colour"), "repair-syntax"],
          ["Images are described in words", imageAlt(), "access-check", "accessibility"],
          ["Focus is clearly visible", focusRing(), "access-check"],
          ["No personal contact detail is on the page", freeOf("personal-contact"), "safe-note", "privacy"],
        ],
      },
    },
  },
};

export const ages10to12Assessment: CourseAssessment = {
  courseId,
  contentVersion: CONTENT_VERSION,
  moduleForms: buildModuleForms(courseId, {
    "html-foundations": htmlFoundations,
    "html-content": htmlContent,
    "css-foundations": cssFoundations,
    "css-layout": cssLayout,
    "javascript-foundations": javascriptFoundations,
    "javascript-logic": javascriptLogic,
    "dom-interaction": domInteraction,
    quality,
  }),
  finalForms: [],
  defence: [],
};