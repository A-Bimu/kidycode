import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 16 to 18, the CSS half of the remaining content batch.
 *
 * Six challenge lessons that had no six-moment script: the selector lesson, the
 * box model, the named design values, the interactive states, the fluid width
 * and the breakpoint.
 *
 * The wording addresses a learner who will maintain the stylesheet later: a
 * repeated literal value is treated as a maintenance defect, a missing focus
 * indicator as a keyboard defect, and a fixed width as a layout defect. Every
 * script carries the guided, balanced and independent wording, a fresh task
 * with its own checks, and two misconception-specific hints with proved
 * detectors.
 */

export const developerCssScripts: LessonScript[] = [
  {
    lessonId: "ages-16-18-css-system-selectors",
    courseIds: ["ages-16-18"],
    concept: "A selector is a query over the document, and the choice between an element selector and a class selector decides how many elements one rule controls.",
    make: "The learner styles every heading with a rule of its own and gives one reusable class the treatment it needs.",
    difficulty: 2,
    prerequisites: ["ages-16-18-structure-metadata"],
    projectStep: "The project's stylesheet starts with rules that can be reused by later components instead of rules tied to one position in one page.",
    stages: {
      hook: {
        lead: "Three headings need the same underline and only one of them has it. The rule exists, it validates, and two headings are untouched. The class was added to one element and the other two were given ids. Which selector would have covered all three without being repeated?",
        variants: {
          guided: "One rule can style many elements, but only if it describes what they have in common. Today you choose a selector by how many elements it should reach.",
          balanced: "An id describes one element, a class describes a reusable component and an element selector describes a tag. The choice is really a decision about reuse.",
          independent: "Write the selector last, after deciding which elements share the treatment, because a selector is a scope statement rather than a name.",
        },
      },
      model: {
        lead: "h2 { border-bottom: 1px solid #111936; } reaches every second level heading on the page, and .tag { padding: 0.25rem 0.5rem; } reaches every element carrying that class. An id selector reaches exactly one element, which is why it cannot be the basis of a system.",
        variants: {
          guided: "Read the two selectors as questions. The first asks for every h2, the second asks for every element with that class, and both are answered by the browser.",
          balanced: "A class is a component name, so a rule written against it survives the element being moved, restyled or rebuilt.",
          independent: "Specificity follows from the selector you choose, so a stylesheet built from classes stays predictable as it grows.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the element rule first, run the preview and watch every heading respond. Then write the class rule and compare the two effects.",
        variants: {
          guided: "Start with h2 and the bottom border. Then add .tag with its padding and background.",
          balanced: "Write one rule at a time so each can be attributed to the elements it actually reached.",
          independent: "Decide both selectors and their properties before typing, then check the rendered result against your prediction.",
        },
      },
      check: {
        lead: "Count the elements each rule reached. The heading rule should touch all three headings, including the two that were previously ignored. The class rule should touch every element carrying the class and nothing else.",
        variants: {
          guided: "Check all three headings carry the underline, then check the tag elements changed colour.",
          balanced: "Check the two rules separately, because a rule that reaches too far is harder to spot than one that reaches nothing.",
          independent: "Confirm no id selector replaced the class rule, because a rule tied to one element cannot be reused by the next component.",
        },
      },
      explain: {
        lead: "Now a different stylesheet: a resource list with plain headings and tag elements carrying a class. No example open. Give every heading a bottom border and give the tag class inner spacing and a background.",
        variants: {
          guided: "The new file has the same two jobs. Write the heading rule, then the class rule.",
          balanced: "Same two rules, new content. Read the markup before choosing which elements share the treatment.",
          independent: "Work with no example open and keep every rule reusable by the next component the page gains.",
        },
      },
      transfer: {
        lead: "Every rule the project's stylesheet gains from here should be reusable, because the same components reappear in each module and only the content changes.",
        variants: {
          independent: "A stylesheet of class rules can be moved between projects, while a stylesheet of id rules has to be rewritten for each one.",
          guided: "Your project's components will each be styled through a class.",
          balanced: "Reuse is what keeps the stylesheet shorter as the project grows rather than longer.",
        },
      },
    },
    mastery: {
      freshTask: "A resource list has plain headings and tag elements carrying a class. Give every heading a bottom border, and give the tag class inner spacing and a background so the treatment can be reused by later tags.",
      observable: "Every heading on the page shows a bottom border, and every element carrying the tag class gains padding and a background.",
      reflection: "In your own words, why does a class selector describe a reusable component while an id selector cannot?",
      starterFiles: {
        html: "<h2>Reading</h2>\n<span class=\"tag\">Guide</span>\n<h2>Tools</h2>\n<span class=\"tag\">Reference</span>",
        css: "/* Style the list so the rules can be reused */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Every heading is styled by one rule", pattern: "h2\\s*\\{[\\s\\S]*border-bottom\\s*:" },
        { file: "css", label: "The tag class has inner spacing", pattern: "\\.tag\\s*\\{[\\s\\S]*padding\\s*:" },
        { file: "css", label: "The tag class has a background", pattern: "\\.tag\\s*\\{[\\s\\S]*background\\s*:" },
      ],
      workedSolution: {
        html: "<h2>Reading</h2>\n<span class=\"tag\">Guide</span>\n<h2>Tools</h2>\n<span class=\"tag\">Reference</span>",
        css: "h2 {\n  border-bottom: 1px solid #111936;\n}\n\n.tag {\n  padding: 0.25rem 0.5rem;\n  background: #f0ece2;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "every style belongs on an id, because an id is the most specific choice available.",
        symptom: "The rule works on one element and has to be copied for the next one, so the stylesheet grows with the markup.",
        hint: "An id names one element, so a rule written against it cannot be reused. Use a class for anything that appears more than once and reserve ids for the elements a link needs to reach.",
        file: "css",
        detect: "#\\w+\\s*\\{",
        detectableExample: "#tags {\n  padding: 0.25rem 0.5rem;\n}",
      },
      {
        wrong: "a class selector can be written without the leading full stop.",
        symptom: "The rule validates and reaches nothing at all, because it is read as an element name that does not exist.",
        hint: "A class selector always begins with a full stop, which is what tells the browser to match the class attribute rather than a tag name. Add the full stop before the class name.",
        file: "css",
        detect: "(?:\\n|^)\\s*(?:tag|tags|card|panel|board|notice)\\s*\\{",
        detectableExample: "tag {\n  padding: 0.25rem 0.5rem;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-css-system-box-model",
    courseIds: ["ages-16-18"],
    concept: "The box model decides where space is created, and border-box sizing makes the declared width include padding and border rather than adding to it.",
    make: "The learner applies border-box sizing and gives a notice block inner spacing, a marked edge and outer separation.",
    difficulty: 3,
    prerequisites: ["ages-16-18-css-system-selectors"],
    projectStep: "The project's components become measurable, so a panel that declares a width keeps that width once padding and a border are added.",
    stages: {
      hook: {
        lead: "Two blocks declare the same width, the same padding and the same border, and one of them is visibly wider than the other. Nothing else differs between them. Which property decides whether the declared width includes the space around the content?",
        variants: {
          guided: "A block has four layers: content, padding, border and margin. Today you decide which of them the declared width counts.",
          balanced: "The default sizing adds padding and border to the declared width, so a two column layout can overflow by exactly the amount of its own styling.",
          independent: "Treat sizing as part of the component contract. A component that declares a width should keep it once it is styled.",
        },
      },
      model: {
        lead: "* { box-sizing: border-box; } makes every declared width include padding and border. Padding pushes the content inwards from its own border, a border marks the edge of the block, and margin creates the space between this block and its neighbours.",
        variants: {
          guided: "Read the four layers in order from the outside: margin, border, padding, content. Only two of them create space inside the block.",
          balanced: "The universal rule is applied once at the top of the stylesheet, so no component has to remember it later.",
          independent: "Padding and margin answer different questions. Padding separates content from its own edge, margin separates the block from everything else.",
        },
      },
      build: {
        lead: "Work in the CSS file. Apply the sizing rule first, then give the notice its padding, then its marked edge, then its outer separation.",
        variants: {
          guided: "Write the sizing rule, then .notice with padding, then a border, then a margin.",
          balanced: "Add one layer at a time and run the preview, so each property's effect is visible on its own.",
          independent: "Decide all four values before typing, then check the rendered block matches the declared width.",
        },
      },
      check: {
        lead: "Read the block outwards. The text should sit away from the border rather than touching it, the border should be visible on the side that marks the block, and there should be a gap before the next block begins. If the border touches the neighbouring text, the outer space is missing.",
        variants: {
          guided: "Check the inner spacing first and the outer gap second, because the two are easy to confuse.",
          balanced: "Check that the block still measures the width you declared, now that padding and border are present.",
          independent: "Confirm the gap belongs to this block rather than to the neighbour, because only one of the two should own it.",
        },
      },
      explain: {
        lead: "Now a different component: a notice block on an account page with no spacing of its own. No example open. Apply border-box sizing and give the notice inner spacing, a marked left edge and separation from the next block.",
        variants: {
          guided: "The new block needs the same four decisions: sizing, padding, a left border and a bottom margin.",
          balanced: "Same pattern, new component. Read the block's wording before deciding how much inner space it needs.",
          independent: "Work with no example open and choose values that would still hold if the block were placed inside a narrow column.",
        },
      },
      transfer: {
        lead: "Every panel the project gains inherits the sizing rule, and the responsive lessons later assume that a declared width can be trusted.",
        variants: {
          independent: "A single sizing rule at the top of a stylesheet removes a whole class of overflow defects before they are written.",
          guided: "Your project's components will all measure the width they declare.",
          balanced: "Sizing is a decision made once for the whole project rather than per component.",
        },
      },
    },
    mastery: {
      freshTask: "A notice block on an account page has no spacing of its own. Apply border-box sizing, then give the notice inner spacing, a marked left edge and separation from the block beneath it.",
      observable: "The notice text sits clear of a visible left border, and a gap separates the block from the content below it.",
      reflection: "In your own words, which two layers of the box model are counted inside a declared width once border-box sizing is applied?",
      starterFiles: {
        html: "<aside class=\"notice\">Keep a copy of your reference number.</aside>\n<p>You can use it to follow up at any time.</p>",
        css: "/* Give the notice its own space */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Sizing includes the padding and the border", pattern: "box-sizing\\s*:\\s*border-box" },
        { file: "css", label: "The notice has inner spacing", pattern: "\\.notice\\s*\\{[\\s\\S]*padding\\s*:" },
        { file: "css", label: "The notice has a marked left edge", pattern: "\\.notice\\s*\\{[\\s\\S]*border-left\\s*:" },
        { file: "css", label: "The notice is separated from the next block", pattern: "\\.notice\\s*\\{[\\s\\S]*margin-bottom\\s*:" },
      ],
      workedSolution: {
        html: "<aside class=\"notice\">Keep a copy of your reference number.</aside>\n<p>You can use it to follow up at any time.</p>",
        css: "* {\n  box-sizing: border-box;\n}\n\n.notice {\n  padding: 0.75rem 1rem;\n  border-left: 4px solid #5a2676;\n  margin-bottom: 1rem;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a border is enough to separate a block from the content around it, so no margin is needed.",
        symptom: "The border and the following paragraph touch, so the block reads as part of the next section instead of its own.",
        hint: "A border marks where a block ends and does not create space beyond itself. Add a bottom margin so the block owns a gap before the next element begins.",
        file: "css",
        detect: "\\.notice\\s*\\{(?![^}]*margin)",
        detectableExample: ".notice {\n  padding: 1rem;\n  border-left: 4px solid #5a2676;\n}",
      },
      {
        wrong: "box-sizing can be left at its default because the padding values are small.",
        symptom: "A component is wider than the width it declares, and a two column layout overflows by the width of its own styling.",
        hint: "The default sizing adds padding and border to the declared width. Set box-sizing to border-box, applied to every element, so a declared width means the width the component occupies.",
        file: "css",
        detect: "^(?![\\s\\S]*box-sizing)",
        detectableExample: "* {\n  margin: 0;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-css-system-tokens",
    courseIds: ["ages-16-18"],
    concept: "A custom property names a design decision once, so every rule that uses it changes together when the decision changes.",
    make: "The learner defines three named values on the document root and uses all three in one component rule.",
    difficulty: 3,
    prerequisites: ["ages-16-18-css-system-box-model"],
    projectStep: "The project's colours and spacing become named values, which is what makes a later theme change a single edit rather than a search through the stylesheet.",
    stages: {
      hook: {
        lead: "The same purple appears in eleven rules and the same grey in nine. A colour change is requested and the request needs forty edits across a stylesheet nobody fully remembers. Nothing about the design is wrong. Which single decision would have made the change cheap?",
        variants: {
          guided: "A value written many times has to be changed many times. Today you give each repeated decision a name and use the name instead.",
          balanced: "A literal colour is data. A named value is a decision, and decisions should exist in one place.",
          independent: "Treat the named values as the project's design surface, because everything downstream reads from them.",
        },
      },
      model: {
        lead: ":root { --brand: #5a2676; --muted: #555c74; --gap: 1rem; } declares the values once at the document root. A rule then reads them with var(--brand), var(--muted) and var(--gap), and changing the declaration changes every rule that reads it.",
        variants: {
          guided: "Declaration first with two hyphens before the name, then use the name inside var() wherever the value is needed.",
          balanced: "The declaration lives on the root element, so it is inherited by every other element and remains available to the whole stylesheet.",
          independent: "A custom property is not a shortcut for a shorter name. It is the place where a repeated decision is recorded and later reviewed.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the root block with all three declarations first, then write the component rule using var() three times.",
        variants: {
          guided: "Create the root block, then use the three names in the component: border, text colour and padding.",
          balanced: "Declare every value before it is used, because a name that does not exist silently resolves to nothing.",
          independent: "Choose the three names before typing, and reject any name that describes where the value is used rather than what it is.",
        },
      },
      check: {
        lead: "Change one declared value and run the preview. Every rule that reads it should change at once and nothing else should move. If one element stays behind, it is still holding a literal value of its own.",
        variants: {
          guided: "Change the brand value and confirm both the border and any other use of it followed.",
          balanced: "Check the declarations and their uses separately, since a missing declaration shows up as a rule with no effect.",
          independent: "Confirm no literal colour remains in the component rules, because a single leftover literal breaks the promise of one edit.",
        },
      },
      explain: {
        lead: "Now a different component: a banner with no named values at all. No example open. Define a brand colour, a muted text colour and a spacing value in one place, then use all three in the banner rule.",
        variants: {
          guided: "The new file needs a root block with three declarations and a banner rule that reads all three.",
          balanced: "Same pattern, new component. Decide what each named value means before choosing its name.",
          independent: "Work with no example open and choose names that would still make sense if the whole palette were replaced.",
        },
      },
      transfer: {
        lead: "The named values become the project's palette and spacing scale, and every later component reads from them instead of inventing a colour.",
        variants: {
          independent: "A stylesheet built on named values can be restyled without reading a single component rule, which is the point of the exercise.",
          guided: "Your project's colours and spacing will be named in one root block.",
          balanced: "The root block is the shortest part of the stylesheet and the most read.",
        },
      },
    },
    mastery: {
      freshTask: "A banner component holds literal values in its rule. Define a brand colour, a muted text colour and a spacing value on the document root, then use all three inside the banner rule.",
      observable: "Changing the brand declaration once changes every rule that reads it, and the banner picks up all three named values.",
      reflection: "In your own words, what makes a named design value cheaper to change than a literal one repeated across a stylesheet?",
      starterFiles: {
        html: "<article class=\"banner\">Term dates are published today.</article>",
        css: "/* Name the values this component needs */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Three values are declared in one place", pattern: ":root\\s*\\{(?:[\\s\\S]*--[a-z-]+\\s*:){3}" },
        { file: "css", label: "The banner reads the brand value", pattern: "var\\(\\s*--brand\\s*\\)" },
        { file: "css", label: "The banner reads the muted value", pattern: "var\\(\\s*--muted\\s*\\)" },
        { file: "css", label: "The banner reads the spacing value", pattern: "var\\(\\s*--gap\\s*\\)" },
      ],
      workedSolution: {
        html: "<article class=\"banner\">Term dates are published today.</article>",
        css: ":root {\n  --brand: #5a2676;\n  --muted: #555c74;\n  --gap: 1rem;\n}\n\n.banner {\n  border: 2px solid var(--brand);\n  color: var(--muted);\n  padding: var(--gap);\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a custom property is written with a single hyphen before its name.",
        symptom: "The declaration is ignored as invalid and every use of the name resolves to nothing.",
        hint: "A custom property name begins with two hyphens, which is what marks it as a custom property rather than a standard one. Write two hyphens before the name and leave the rest unchanged.",
        file: "css",
        detect: "(?:^|[^-\\w])-[a-z][a-z-]*\\s*:",
        detectableExample: "-brand: #5a2676;",
      },
      {
        wrong: "a var() reference can name the value directly instead of the property.",
        symptom: "The rule validates and the property quietly falls back to its initial value, so the component shows none of the intended styling.",
        hint: "var() takes the name of a custom property, including its leading two hyphens. Write var(--brand) rather than the bare name, so the reference resolves to the declared value.",
        file: "css",
        detect: "var\\(\\s*[a-z][a-z-]*\\s*\\)",
        detectableExample: "color: var(brand);",
      },
    ],
  },
  {
    lessonId: "ages-16-18-css-system-states",
    courseIds: ["ages-16-18"],
    concept: "An interactive control has more than one state, and a visible focus indicator is what makes the keyboard path usable rather than merely possible.",
    make: "The learner adds a hover treatment and a strong focus-visible outline to a link and a select control.",
    difficulty: 4,
    prerequisites: ["ages-16-18-css-system-tokens"],
    projectStep: "The project's buttons and links become usable without a mouse, which the accessibility pass records as tested behaviour rather than an assumption.",
    stages: {
      hook: {
        lead: "A visitor tabs through a form and cannot tell where the cursor is. The outline was removed because it clashed with the design, and the hover colour was kept because it looks good. Everything still works if you already know where you are. Who has lost the ability to use the page?",
        variants: {
          guided: "A keyboard user moves through the page blind when nothing highlights the current control. Today you make the current position visible.",
          balanced: "A hover state answers a mouse pointer. Focus answers a keyboard, and the two audiences are not the same.",
          independent: "Treat the focus ring as part of the control rather than as decoration, because removing it removes the only position marker a keyboard user has.",
        },
      },
      model: {
        lead: "a:hover { color: #37134d; } responds while a pointer is over the link. a:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; } responds while the control is reached by keyboard, and the offset keeps the ring clear of the control's own edge.",
        variants: {
          guided: "Two states, two rules. The hover rule changes colour, the focus rule draws a ring that stands slightly away from the control.",
          balanced: "focus-visible is deliberately narrow: it appears for keyboard users and stays out of the way of a mouse click, which is why it is preferred to focus alone.",
          independent: "An outline is drawn outside the box and does not affect layout, so a thick ring costs nothing in space.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the hover rule first, then the focus-visible rule with an outline and an offset. Run the preview and reach both controls with the Tab key.",
        variants: {
          guided: "Write the hover rule, then group the link and the select in one focus-visible rule with a 3px outline.",
          balanced: "Add the states after the base rule, so the base look and the interactive look stay readable as separate decisions.",
          independent: "Decide the ring thickness and offset before typing, then confirm the ring is visible against the surrounding background.",
        },
      },
      check: {
        lead: "Move the pointer over each control and confirm the colour changes. Then put the mouse aside, press Tab until each control is reached, and confirm a ring appears around it and stays visible.",
        variants: {
          guided: "Test the hover colour with the mouse, then test the ring with the keyboard only.",
          balanced: "Check the two states separately, because a page can pass the hover test and fail the keyboard one completely.",
          independent: "Confirm the ring is visible at the edge of a dark background as well as a light one, since a thin dark outline disappears on a dark surface.",
        },
      },
      explain: {
        lead: "Now a different set of controls: a link and a select with a base colour and no states at all. No example open. Give both a hover treatment and a strong focus-visible ring that stands off from the control.",
        variants: {
          guided: "The new file needs the same two rules: one hover, one focus-visible with an outline and an offset.",
          balanced: "Same states, new controls. Read the base rule before choosing colours that remain visible against it.",
          independent: "Work with no example open and write the focus rule so it would survive a change of palette.",
        },
      },
      transfer: {
        lead: "Every control the project gains needs both states, and the release note can only claim the keyboard path was tested if this rule is in place.",
        variants: {
          independent: "A focus rule written once for a group of controls is easier to keep consistent than a rule repeated for each one.",
          guided: "Your project's links and buttons will each show their keyboard focus.",
          balanced: "Two short rules decide whether the project is usable without a mouse.",
        },
      },
    },
    mastery: {
      freshTask: "A link and a select control have a base colour and no interactive states. Give both a hover treatment and a strong focus-visible ring that stands clear of the control's own edge.",
      observable: "The controls change colour under the pointer, and a thick ring appears around each one when it is reached with the Tab key.",
      reflection: "In your own words, why is a visible focus ring a requirement rather than a decoration, and why is focus-visible preferred to focus alone?",
      starterFiles: {
        html: "<a href=\"#main\">Skip to main content</a>\n<label for=\"sort\">Sort by</label>\n<select id=\"sort\"><option>Newest</option><option>Oldest</option></select>",
        css: "a,\nselect {\n  color: #111936;\n}\n/* Add the interactive states */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The link responds to the pointer", pattern: "a:hover" },
        { file: "css", label: "Keyboard focus is styled separately", pattern: ":focus-visible(?:[\\s,{]|$)" },
        { file: "css", label: "The focus ring is thick enough to see", pattern: "outline\\s*:\\s*3px" },
        { file: "css", label: "The ring stands clear of the control", pattern: "outline-offset\\s*:" },
      ],
      workedSolution: {
        html: "<a href=\"#main\">Skip to main content</a>\n<label for=\"sort\">Sort by</label>\n<select id=\"sort\"><option>Newest</option><option>Oldest</option></select>",
        css: "a,\nselect {\n  color: #111936;\n}\n\na:hover,\nselect:hover {\n  color: #37134d;\n}\n\na:focus-visible,\nselect:focus-visible {\n  outline: 3px solid #ee9d2b;\n  outline-offset: 3px;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "hover is enough, because most visitors arrive with a mouse.",
        symptom: "A keyboard visitor can reach every control and cannot see which one is active, so the page is usable only by luck.",
        hint: "Hover answers a pointer and says nothing about the keyboard. Add a focus-visible rule for the same controls, so the current position is visible however it was reached.",
        file: "css",
        detect: "^(?=[\\s\\S]*:hover\\s*\\{)(?![\\s\\S]*:focus-visible)",
        detectableExample: "a:hover {\n  color: #37134d;\n}",
      },
      {
        wrong: "the focus outline can be removed once a custom colour has been added.",
        symptom: "Nothing at all changes on screen when a keyboard visitor reaches the control, because the browser's own indicator was suppressed.",
        hint: "Replacing the browser outline with a colour leaves no position marker at all. Keep an outline and give it a visible width, then use the offset to separate it from the control's edge.",
        file: "css",
        detect: "outline\\s*:\\s*(?:none|0)",
        detectableExample: "select:focus-visible {\n  outline: none;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-responsive-viewport",
    courseIds: ["ages-16-18"],
    concept: "A fluid width is measured against the space available, and a maximum keeps the line length readable on a wide screen.",
    make: "The learner gives a listing a viewport-relative width with a readable maximum and stops its thumbnails overflowing.",
    difficulty: 3,
    prerequisites: ["ages-16-18-css-system-states"],
    projectStep: "The project stops scrolling sideways on a narrow screen, which is the first requirement the responsive checkpoint records.",
    stages: {
      hook: {
        lead: "A listing page is fine on a desktop and scrolls sideways on a phone. The layout uses a fixed pixel width from a design file, and one photograph is wider than the screen it sits in. Which two values would remove both faults?",
        variants: {
          guided: "A fixed width cannot fit every screen. Today the width is measured against the space available and capped at a readable size.",
          balanced: "A maximum width protects the line length on a large screen and does nothing on a small one, which is exactly the behaviour needed.",
          independent: "Treat horizontal scrolling as a defect with two likely causes: a declared width that is too large, and content that refuses to shrink.",
        },
      },
      model: {
        lead: ".listing { width: min(100% - 2rem, 60rem); margin-inline: auto; } takes the full width minus a small gutter and never exceeds sixty rem. .thumb { max-width: 100%; height: auto; } lets an image shrink below its natural size while keeping its proportions.",
        variants: {
          guided: "Width at least the available space and at most a readable maximum, then an image rule that allows shrinking.",
          balanced: "The declaration is read as an allowed range rather than as a single number, so the browser resolves it differently on each screen.",
          independent: "An image with a width and an automatic height keeps its proportions, while an image with only a width can be squashed by a distorted container.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the listing rule first and drag the preview narrower, then add the image rule and drag it narrower again.",
        variants: {
          guided: "Write the width and margin for the listing, then the maximum width and automatic height for the thumbnail.",
          balanced: "Change the container first and the contents second, so the overflow that remains can be attributed to one of them.",
          independent: "Decide the maximum and the gutter before typing, then test at the narrowest width you can.",
        },
      },
      check: {
        lead: "Narrow the preview to a phone width and look for a horizontal scrollbar. Then widen it to a desktop width and check the text still stops at the maximum rather than running the full width of the screen.",
        variants: {
          guided: "Check the narrow screen first for sideways scrolling, then the wide screen for an over long line.",
          balanced: "Check the two rules separately, because a fluid container can still be broken by one oversized child.",
          independent: "Confirm no element extends past the viewport edge, since one overflowing element brings the scrollbar back whatever the container does.",
        },
      },
      explain: {
        lead: "Now a different page: a product listing with a fixed pixel width and thumbnails that keep their intrinsic size. No example open. Give the listing a viewport-relative width with a readable maximum, and let the thumbnails shrink.",
        variants: {
          guided: "The new file needs the same two rules: a fluid capped width for the listing and a maximum for the thumbnails.",
          balanced: "Same pattern, new content. Read the container's natural width before choosing a maximum for it.",
          independent: "Work with no example open and choose a maximum that keeps a paragraph to a comfortable line length.",
        },
      },
      transfer: {
        lead: "Every page of the project inherits this base, and the breakpoint lesson later changes only the arrangement rather than the width ceiling.",
        variants: {
          independent: "A fluid base means the project has one layout at every width and one adjustment where the arrangement changes.",
          guided: "Your project's pages will each fit the width they are given.",
          balanced: "Two rules protect every screen size that the project will ever be opened on.",
        },
      },
    },
    mastery: {
      freshTask: "A product listing uses a fixed pixel width and its thumbnails keep their natural size, so a phone shows a horizontal scrollbar. Give the listing a viewport-relative width with a readable maximum and let each thumbnail shrink.",
      observable: "No horizontal scrollbar appears at a phone width, and at a desktop width the content stops at its maximum rather than filling the screen.",
      reflection: "In your own words, what does the maximum width protect on a large screen, and why does an image need a rule of its own?",
      starterFiles: {
        html: "<main class=\"listing\">\n  <img class=\"thumb\" src=\"trainers.jpg\" alt=\"Running trainers\">\n  <p>In stock in three sizes.</p>\n</main>",
        css: "/* Make the listing fluid */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The listing width follows the available space", pattern: "\\.listing\\s*\\{[\\s\\S]*width\\s*:\\s*min\\(" },
        { file: "css", label: "The listing stops at a readable maximum", pattern: "\\.listing\\s*\\{[\\s\\S]*min\\([^,]+,\\s*60rem\\s*\\)" },
        { file: "css", label: "Thumbnails cannot overflow the listing", pattern: "\\.thumb\\s*\\{[\\s\\S]*max-width\\s*:\\s*100%" },
      ],
      workedSolution: {
        html: "<main class=\"listing\">\n  <img class=\"thumb\" src=\"trainers.jpg\" alt=\"Running trainers\">\n  <p>In stock in three sizes.</p>\n</main>",
        css: ".listing {\n  width: min(100% - 2rem, 60rem);\n  margin-inline: auto;\n}\n\n.thumb {\n  max-width: 100%;\n  height: auto;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a fixed pixel width is more predictable than a fluid one.",
        symptom: "The page scrolls sideways on any screen narrower than the declared width, because the layout never shrinks.",
        hint: "A fixed width states one number for every screen. Use a viewport-relative width with a readable maximum so the layout fits a small screen and still stops at a comfortable line length on a large one.",
        file: "css",
        detect: "width\\s*:\\s*\\d{3,}px",
        detectableExample: ".listing {\n  width: 960px;\n}",
      },
      {
        wrong: "an image only needs a width, because its height follows automatically.",
        symptom: "The image keeps its natural width and pushes the layout wider than the screen it sits in.",
        hint: "An image does not shrink unless it is allowed to. Give the thumbnail a maximum width of one hundred percent so it can become smaller than its natural size while keeping its proportions.",
        file: "css",
        detect: "\\.thumb\\s*\\{(?![^}]*max-width)",
        detectableExample: ".thumb {\n  width: 40rem;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-responsive-media",
    courseIds: ["ages-16-18"],
    concept: "A breakpoint is a change of arrangement, and it should be introduced where the content stops working rather than where a device list says so.",
    make: "The learner keeps a board in one column by default and switches it to a wider main column with a side column from nine hundred pixels.",
    difficulty: 4,
    prerequisites: ["ages-16-18-responsive-viewport"],
    projectStep: "The project's desktop arrangement is added as an enhancement, so the narrow layout stays the tested default and the wider one is an adjustment on top of it.",
    stages: {
      hook: {
        lead: "A dashboard is built as two columns and looks wrong at every width below a tablet. A student adds one breakpoint for each device in a design file: six in total. At most of them nothing changes at all. What is a breakpoint actually for?",
        variants: {
          guided: "A breakpoint should change the arrangement, and only where the current one stops working. Today you add one and explain why it belongs there.",
          balanced: "A device list is not a reason. The reason is a width at which the content, not the hardware, needs a different arrangement.",
          independent: "Design the narrow layout as the default and treat the wide arrangement as the enhancement, because the narrow one is what most visitors meet first.",
        },
      },
      model: {
        lead: ".board { display: grid; grid-template-columns: 1fr; gap: 1rem; } is the base and works at any width. @media (min-width: 900px) { .board { grid-template-columns: 3fr 1fr; } } adds a wider main column and a narrower side column once there is room for both.",
        variants: {
          guided: "Write the one column base first, then a query that starts at nine hundred pixels and changes only the track list.",
          balanced: "A minimum width query applies from that width upwards, so the wider arrangement inherits everything the base already declared.",
          independent: "Change one property inside the query. A query that restates the whole component is harder to maintain than the base rule it extends.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the base rule with one column, then add the media query and change only the track list inside it.",
        variants: {
          guided: "Base rule first with display grid and one column, then the query with three fractions and one fraction.",
          balanced: "Run the preview before and after the query so the change in arrangement is visible on its own.",
          independent: "Decide the breakpoint from where the two columns stop fitting before you type the number.",
        },
      },
      check: {
        lead: "Drag the preview from narrow to wide and watch for a single change of arrangement at the breakpoint. There should be one column below it and two above it, and no intermediate state in between.",
        variants: {
          guided: "Check the narrow width shows one column, then check the wide width shows two.",
          balanced: "Confirm the gap survives the change, because a track list rewritten inside a query can easily drop the spacing with it.",
          independent: "Confirm the breakpoint sits where the content needed it, since a value copied from a device list usually lands in the wrong place.",
        },
      },
      explain: {
        lead: "Now a different layout: a dashboard that is one column by default with no wider arrangement at all. No example open. Keep the single column as the base and add a wider arrangement with a large main column and a smaller side column from nine hundred pixels.",
        variants: {
          guided: "The new file needs the base one column rule and one query that changes the tracks at nine hundred pixels.",
          balanced: "Same pattern, new arrangement. Read what the two regions contain before deciding their proportion.",
          independent: "Work with no example open and justify the nine hundred pixel value from the content rather than from a device.",
        },
      },
      transfer: {
        lead: "The project's wide arrangement is added here, and every later module relies on the narrow layout being the one that already works.",
        variants: {
          independent: "One breakpoint that changes one thing is far easier to keep working than six that each change nothing measurable.",
          guided: "Your project will have a narrow arrangement and one wider one.",
          balanced: "The base rule is the version the project is tested against; the query is the enhancement.",
        },
      },
    },
    mastery: {
      freshTask: "A dashboard is one column on every screen. Keep the single column as the base and add a wider arrangement from nine hundred pixels with a large main column and a smaller side column.",
      observable: "Below the breakpoint the two regions stack in one column, and at nine hundred pixels and above they sit side by side with the main region wider.",
      reflection: "In your own words, how should the width of a breakpoint be chosen, and why is the narrow layout written first?",
      starterFiles: {
        html: "<main class=\"board\">\n  <section>Summary of this week</section>\n  <aside>Notes and reminders</aside>\n</main>",
        css: "/* Build the board from one column */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The narrow arrangement is one column", pattern: "\\.board\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr" },
        { file: "css", label: "The wider arrangement waits for nine hundred pixels", pattern: "@media\\s*\\(min-width\\s*:\\s*900px\\)" },
        { file: "css", label: "The wider arrangement has a main and a side column", pattern: "@media[\\s\\S]*grid-template-columns\\s*:\\s*3fr\\s+1fr" },
      ],
      workedSolution: {
        html: "<main class=\"board\">\n  <section>Summary of this week</section>\n  <aside>Notes and reminders</aside>\n</main>",
        css: ".board {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n@media (min-width: 900px) {\n  .board {\n    grid-template-columns: 3fr 1fr;\n  }\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the wide arrangement can be the default and the narrow one added with a maximum width query.",
        symptom: "The narrow screen is served the wide arrangement first and then corrected, so the layout flickers and the default is the wrong one.",
        hint: "Write the arrangement that works everywhere as the base, then add the wider one with a minimum width query. A maximum width query builds the layout backwards and leaves the default wrong for most visitors.",
        file: "css",
        detect: "@media\\s*\\(\\s*max-width",
        detectableExample: "@media (max-width: 600px) {\n  .board {\n    grid-template-columns: 1fr;\n  }\n}",
      },
      {
        wrong: "every breakpoint in the design file should be copied into the stylesheet.",
        symptom: "Several queries exist and most of them change nothing, so the stylesheet carries decisions that cannot be tested.",
        hint: "Add a query only where the arrangement has to change and the change can be observed. One query that alters one property is easier to justify than six that alter nothing.",
        file: "css",
        detect: "@media[\\s\\S]*@media[\\s\\S]*@media",
        detectableExample: "@media (min-width: 480px) {\n  .board { gap: 1rem; }\n}\n@media (min-width: 768px) {\n  .board { gap: 1rem; }\n}\n@media (min-width: 1024px) {\n  .board { gap: 1rem; }\n}",
      },
    ],
  },
];
