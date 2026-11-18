import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The adults remaining-content batch, CSS module.
 *
 * The register is balanced, with an adult learner in mind: selectors that
 * survive a redesign, named design values, visible interaction states, and a
 * layout that starts narrow and grows. Independent wording is available for a
 * learner who asks for it.
 */

export const practicalCssScripts: LessonScript[] = [
  {
    lessonId: "adults-css-system-selectors",
    courseIds: ["adults"],
    concept: "A selector chooses which elements receive a rule; a type selector suits a broad default and a class selector gives one reusable component its own style.",
    make: "The learner styles every paragraph and gives a reusable panel class its own rule.",
    difficulty: 2,
    prerequisites: ["adults-structure-metadata"],
    projectStep: "The project's paragraphs get readable spacing and its panels get a shared style instead of one-off rules.",
    stages: {
      hook: {
        lead: "Two panels need the same treatment, but the rule is written against one element's position. Add a third panel and it looks wrong. What kind of selector would have survived that change?",
        variants: {
          guided: "A rule tied to a position breaks when the page order changes. A rule tied to a class keeps working.",
          balanced: "The design idea is the component, not the element's place on the page. The selector should say so.",
          independent: "Choose the selector from the design decision, not from the markup you happen to have today.",
        },
      },
      model: {
        lead: "p { line-height: 1.6; } styles every paragraph. .panel { padding: 1.25rem; border: 1px solid #c9a84c; } styles every element carrying that class, wherever it sits.",
        variants: {
          guided: "Use the element name for a broad default and a class for a reusable component.",
          balanced: "A class is a name you give a component, and the rule reaches every instance of that name.",
          independent: "Use the least specific selector that expresses the job, so the rule stays easy to override later.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the broad paragraph rule first, then a class rule for the panel component.",
        variants: {
          guided: "Write the paragraph rule, run the preview, then add the panel class rule.",
          balanced: "Add the broad rule, then the class rule, and check that both panels change.",
          independent: "Decide the selector for each rule before you write it, and avoid position-based selectors.",
        },
      },
      check: {
        lead: "Add a second element with the same class in your head. The class rule should reach it without a change; the position-based rule would not.",
        variants: {
          guided: "Check that both panels receive the style from the one class rule.",
          balanced: "Confirm the paragraph rule reaches every paragraph and the class rule reaches every panel.",
          independent: "Verify the class rule would still work if the panels moved to a different parent.",
        },
      },
      explain: {
        lead: "Now a services page with cramped paragraphs and two panels that need the same border and padding. Style every paragraph for readable line height and give the panel component its own reusable rule. No example open.",
        variants: {
          guided: "The new page needs the same two rules. Write the broad one first.",
          balanced: "Same two rules on the new page, chosen by the job each one does.",
          independent: "Work with no example open and choose the class name yourself.",
        },
      },
      transfer: {
        lead: "Every component the project adds later gets a class of its own, so a change to one rule reaches every instance at once.",
        variants: {
          guided: "Every repeated part you add to the project gets a class and one rule.",
          balanced: "Reusable classes are what keep the project's styles easy to change later.",
          independent: "Keep a class tied to one design idea, so a new instance never needs a new rule.",
        },
      },
    },
    mastery: {
      freshTask: "A services page has paragraphs with cramped line spacing and two panels that need the same border and padding. Style every paragraph for readable line height and give the panel component its own reusable rule.",
      observable: "Every paragraph gets the line spacing, and both panels receive the same style from one rule.",
      reflection: "In your own words, why is a class selector safer than a rule tied to one element's position?",
      starterFiles: {
        html: "<p>Introduction</p>\n<section class=\"panel\"><p>Panel text</p></section>\n<section class=\"panel\"><p>Second panel</p></section>",
        css: "/* Add the two rules */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Paragraphs get a readable line height", pattern: "p\\s*\\{[\\s\\S]*line-height\\s*:" },
        { file: "css", label: "The panel class gets inner spacing", pattern: "\\.panel\\s*\\{[\\s\\S]*padding\\s*:" },
        { file: "css", label: "The panel class gets a visible edge", pattern: "\\.panel\\s*\\{[\\s\\S]*border\\s*:" },
      ],
      workedSolution: {
        html: "<p>Introduction</p>\n<section class=\"panel\"><p>Panel text</p></section>\n<section class=\"panel\"><p>Second panel</p></section>",
        css: "p {\n  line-height: 1.6;\n}\n\n.panel {\n  padding: 1.25rem;\n  border: 1px solid #c9a84c;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the rule should target one specific element by its position.",
        symptom: "A second element with the same purpose is left unstyled, and the rule breaks as soon as the page order changes.",
        hint: "Give the repeated component a class and style the class, so every instance is reached by one rule regardless of where it sits.",
        file: "css",
        detect: "\\b(?:section|article|div)\\s*:\\s*(?:first|last|nth)-",
        detectableExample: "section:first-child {\n  padding: 1rem;\n}",
      },
      {
        wrong: "a broad element rule and a component class rule are the same kind of decision.",
        symptom: "Either every element gets the component padding, or the paragraphs lose their shared line spacing.",
        hint: "Keep the broad rule for a default that applies widely and use a class for the component. Mixing the two either over-reaches or leaves gaps.",
        file: "css",
        detect: "^(?![\\s\\S]*\\.panel)[\\s\\S]*\\b(?:section|article|div)\\s*\\{[\\s\\S]*padding\\s*:",
        detectableExample: "section {\n  padding: 1.25rem;\n}",
      },
    ],
  },
  {
    lessonId: "adults-css-system-tokens",
    courseIds: ["adults"],
    concept: "A CSS custom property gives a repeated design value a name, so one change updates every place that uses it.",
    make: "The learner names the text colour, the accent colour and a spacing value, then uses all three in a component rule.",
    difficulty: 3,
    prerequisites: ["adults-css-system-selectors"],
    projectStep: "The project's colours and spacing come from named values, so a brand change is one edit instead of many.",
    stages: {
      hook: {
        lead: "The same hex colour is typed in eleven places. Marketing asks for it a shade darker. What kind of change makes that a one-line edit?",
        variants: {
          guided: "When the same value is repeated, give it a name so it is written once.",
          balanced: "Eleven copies of a value are eleven chances to miss one. A name removes the copies.",
          independent: "Treat a repeated value as a maintenance defect, not a convenience. Name it once and reuse the name.",
        },
      },
      model: {
        lead: ":root { --text: #111936; --accent: #5a2676; --space: 1rem; } then .panel { color: var(--text); padding: var(--space); }. Name the value once and use the name everywhere.",
        variants: {
          guided: "Define the three properties in :root, then call each one with var().",
          balanced: "The definition lives in one place and every use points at it by name.",
          independent: "Name the purpose rather than the current value, so the name survives a redesign.",
        },
      },
      build: {
        lead: "Work in the CSS file. Define the three properties in :root, then use each one in the panel rule.",
        variants: {
          guided: "Add :root first, then the panel rule, and run the preview after each step.",
          balanced: "Define the values, then replace the raw colours and spacing with var() calls.",
          independent: "Decide the property names from their purpose before you write the values.",
        },
      },
      check: {
        lead: "Change one property value and watch every use follow. If a use stays the same, it was hard-coded instead of named.",
        variants: {
          guided: "Check all three properties are defined and that each is used with var().",
          balanced: "Confirm no raw value is left where a named one should be used.",
          independent: "Verify a single change to one property reaches every rule that references it.",
        },
      },
      explain: {
        lead: "Now a pricing page that repeats the same colour and spacing values. Name a text colour, an accent colour and a spacing value, then use all three in the price card rule. No example open.",
        variants: {
          guided: "The new page needs the same three names and the same three uses.",
          balanced: "Same three names on the new page, each used once in the card rule.",
          independent: "Work with no example open and choose the property names yourself.",
        },
      },
      transfer: {
        lead: "Every repeated value in the project becomes a name, so the visual system can be adjusted from one place.",
        variants: {
          guided: "Every repeated colour or spacing value in the project gets a name.",
          balanced: "Named values are what let the project's look change without hunting through the sheet.",
          independent: "Keep the names in one block at the top, so the whole system can be read at a glance.",
        },
      },
    },
    mastery: {
      freshTask: "A pricing page repeats the same colour and spacing values in several rules. Name a text colour, an accent colour and a spacing value, then use all three in the price card rule.",
      observable: "Changing one named value updates every rule that uses it, and the price card reads from the names rather than raw values.",
      reflection: "In your own words, what does a custom property make easier when the design changes?",
      starterFiles: {
        html: "<article class=\"price-card\">Monthly plan</article>",
        css: "/* Name and use the design values */\n.price-card {\n  background: #f7f3ea;\n}\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Three named values are defined", pattern: ":root\\s*\\{(?:[\\s\\S]*--[a-z-]+\\s*:){3}" },
        { file: "css", label: "The text colour is used by name", pattern: "var\\(\\s*--text\\s*\\)" },
        { file: "css", label: "The accent colour is used by name", pattern: "var\\(\\s*--accent\\s*\\)" },
        { file: "css", label: "The spacing value is used by name", pattern: "var\\(\\s*--space\\s*\\)" },
      ],
      workedSolution: {
        html: "<article class=\"price-card\">Monthly plan</article>",
        css: ":root {\n  --text: #111936;\n  --accent: #5a2676;\n  --space: 1rem;\n}\n\n.price-card {\n  color: var(--text);\n  border-color: var(--accent);\n  padding: var(--space);\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a custom property is just a shorter way to type a colour.",
        symptom: "The value is defined once but the rule still hard-codes the colour, so a change does not reach it.",
        hint: "Use var() wherever the decision applies, not just in the definition. A name that is never referenced changes nothing.",
        file: "css",
        detect: "^(?![\\s\\S]*var\\()[\\s\\S]*:root",
        detectableExample: ":root {\n  --accent: #5a2676;\n}",
      },
      {
        wrong: "the property name should describe the current appearance.",
        symptom: "The name reads --purple-two but the value is a spacing measure, so the name misleads the next person.",
        hint: "Name the purpose, such as --text or --space, not the current value. A purpose name survives a redesign and a colour name does not.",
        file: "css",
        detect: "--(?:purple|blue|pink|dark|light)[a-z-]*\\s*:",
        detectableExample: "--purple-two: 1rem;",
      },
    ],
  },
  {
    lessonId: "adults-css-system-states",
    courseIds: ["adults"],
    concept: "Interactive controls need visible states: a hover treatment and, more importantly, a focus indicator a keyboard visitor can see.",
    make: "The learner gives a button and links a hover state and a strong focus-visible outline.",
    difficulty: 3,
    prerequisites: ["adults-css-system-tokens"],
    projectStep: "The project's buttons and links show a clear keyboard focus outline, so the page can be used without a mouse.",
    stages: {
      hook: {
        lead: "A visitor tabs through a page and loses track of which control is active. Nothing on screen changes as focus moves. Which state is missing, and who is it for?",
        variants: {
          guided: "A control needs to show when it is hovered and, more importantly, when it has keyboard focus.",
          balanced: "Hover is a courtesy and focus is a requirement. One of them is missing here.",
          independent: "A focus indicator is an accessibility feature, not a style preference. Decide its contrast deliberately.",
        },
      },
      model: {
        lead: "button:hover { background: #37134d; } then button:focus-visible, a:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }. Hover is a courtesy and focus is a requirement.",
        variants: {
          guided: "Add a hover rule for the button, then a focus-visible rule with an outline and an offset.",
          balanced: "The outline draws the focus and the offset keeps it from sitting on the control.",
          independent: "Use focus-visible rather than focus, so the ring appears for keyboard users and not for every mouse click.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the hover rule first, then a focus-visible rule with an outline and an offset.",
        variants: {
          guided: "Write the hover rule, run the preview, then add the focus-visible rule.",
          balanced: "Add the hover treatment, then the focus outline, and tab through the page to check.",
          independent: "Choose the outline colour for contrast against the page before you write the rule.",
        },
      },
      check: {
        lead: "Tab through every control. Each one must show an outline that is easy to see and does not sit on top of the element.",
        variants: {
          guided: "Check the button hovers and that each control shows an outline when tabbed to.",
          balanced: "Confirm the outline is visible on both the button and the links.",
          independent: "Verify the outline has enough contrast against every background it appears on.",
        },
      },
      explain: {
        lead: "Now a contact page with a submit button and two links and no visible states. Add a hover treatment and a strong keyboard focus outline to the button and the links. No example open.",
        variants: {
          guided: "The new page needs the same two states on its button and links.",
          balanced: "Same two rules on the new page: a hover state and a focus outline.",
          independent: "Work with no example open and choose the outline style yourself.",
        },
      },
      transfer: {
        lead: "Every control the project adds later gets a visible focus state, so keyboard use never depends on guesswork.",
        variants: {
          guided: "Every button and link you add to the project gets a focus outline.",
          balanced: "Visible focus is what keeps the project usable for the visitors who never touch a mouse.",
          independent: "Keep the focus style consistent across the project, so a visitor learns it once.",
        },
      },
    },
    mastery: {
      freshTask: "A contact page has a submit button and two links with no visible states. Add a hover treatment and a strong keyboard focus outline to the button and the links.",
      observable: "Hovering changes the button, and tabbing to each control shows a clear outline with a little space around it.",
      reflection: "In your own words, why is a focus indicator more important than a hover effect?",
      starterFiles: {
        html: "<a href=\"#form\">Skip to the form</a>\n<button>Submit</button>",
        css: "button, a {\n  color: #111936;\n}\n/* Add the states */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The button has a hover state", pattern: "button:hover\\s*\\{" },
        { file: "css", label: "Controls show a keyboard focus state", pattern: ":focus-visible\\s*\\{" },
        { file: "css", label: "The focus state draws an outline", pattern: "outline\\s*:" },
        { file: "css", label: "The outline is offset from the control", pattern: "outline-offset\\s*:" },
      ],
      workedSolution: {
        html: "<a href=\"#form\">Skip to the form</a>\n<button>Submit</button>",
        css: "button, a {\n  color: #111936;\n}\n\nbutton:hover {\n  background: #37134d;\n  color: #ffffff;\n}\n\nbutton:focus-visible, a:focus-visible {\n  outline: 3px solid #ee9d2b;\n  outline-offset: 3px;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the browser's default focus ring is enough.",
        symptom: "Focus is technically visible but faint, and a keyboard visitor still loses their place.",
        hint: "Draw a clear outline with enough contrast and add outline-offset so it does not touch the control. A default ring is easy to miss on a busy background.",
        file: "css",
        detect: ":focus\\s*\\{[\\s\\S]*(?:outline\\s*:\\s*none|outline\\s*:\\s*0)",
        detectableExample: "button:focus {\n  outline: none;\n}",
      },
      {
        wrong: "removing the outline makes the design look cleaner.",
        symptom: "A keyboard visitor can no longer tell which control is active, so the page becomes unusable without a mouse.",
        hint: "Never remove focus without replacing it. If the default ring clashes, replace it with a stronger outline rather than deleting it.",
        file: "css",
        detect: "outline\\s*:\\s*(?:none|0)\\b",
        detectableExample: "a {\n  outline: none;\n}",
      },
    ],
  },
  {
    lessonId: "adults-responsive-viewport",
    courseIds: ["adults"],
    concept: "A mobile-first layout starts with the narrow screen: fluid widths and images that shrink keep content inside the viewport without sideways scrolling.",
    make: "The learner gives the page a fluid maximum width and makes an image shrink inside its container.",
    difficulty: 3,
    prerequisites: ["adults-css-system-states"],
    projectStep: "The project stays readable at 320px with no horizontal scrolling, because the content is fluid rather than fixed.",
    stages: {
      hook: {
        lead: "A page is set to a fixed 1200px width. On a phone it scrolls sideways and the text runs off the screen. Which single decision caused that?",
        variants: {
          guided: "A width fixed in pixels cannot shrink, so a narrow screen has to scroll sideways.",
          balanced: "The layout was designed for one screen size and the visitor brought a different one.",
          independent: "Decide the width from the available space, not from a number that happened to look right on your screen.",
        },
      },
      model: {
        lead: ".gallery { width: min(100% - 2rem, 68rem); margin-inline: auto; } and img { max-width: 100%; height: auto; }. The width follows the viewport and the image can never exceed its container.",
        variants: {
          guided: "Give the page a width that follows the screen with a maximum, then cap the image at 100%.",
          balanced: "The min() call keeps a comfortable maximum while still allowing the layout to shrink.",
          independent: "Cap the image as well as the page, because an image keeps its own size until you limit it.",
        },
      },
      build: {
        lead: "Work in the CSS file. Give the page a fluid width with a maximum, then make the image shrink.",
        variants: {
          guided: "Add the page width first, then the image rule, and run the preview after each.",
          balanced: "Set the fluid width, then the image cap, then narrow the preview to check.",
          independent: "Choose the maximum width from the content's reading length before you write it.",
        },
      },
      check: {
        lead: "Narrow the preview to 320px. Nothing should scroll sideways and the image should fit inside the column.",
        variants: {
          guided: "Check the page has a fluid width and the image has a maximum of 100%.",
          balanced: "Confirm there is no horizontal scrolling at 320px.",
          independent: "Verify the layout still reads well at the widest and narrowest widths you support.",
        },
      },
      explain: {
        lead: "Now a gallery page fixed at a wide width with a photograph that overflows on a phone. Give the page a fluid maximum width and make the image shrink to fit. No example open.",
        variants: {
          guided: "The new page needs the same two rules: a fluid width and an image cap.",
          balanced: "Same two rules on the new page, in the same order.",
          independent: "Work with no example open and choose the maximum width yourself.",
        },
      },
      transfer: {
        lead: "Every page in the project uses a fluid width, so a new screen size never reintroduces sideways scrolling.",
        variants: {
          guided: "Every page you add to the project uses a fluid width.",
          balanced: "Fluid widths are what keep the project usable on the phone most visitors arrive with.",
          independent: "Treat a fixed pixel width as a defect unless the design genuinely requires one.",
        },
      },
    },
    mastery: {
      freshTask: "A gallery page is fixed at a wide width and its photograph overflows on a phone. Give the page a fluid maximum width and make the image shrink to fit its container.",
      observable: "At 320px there is no sideways scrolling, and the image sits inside the column instead of overflowing it.",
      reflection: "In your own words, why is a fluid width safer than a fixed pixel width?",
      starterFiles: {
        html: "<main class=\"gallery\"><img src=\"studio.jpg\" alt=\"Our studio\"><p>Recent work.</p></main>",
        css: "/* Make the content fluid */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The page uses a fluid width", pattern: "\\.gallery\\s*\\{[\\s\\S]*width\\s*:[^;]*(?:%|min\\()" },
        { file: "css", label: "The page has a maximum width", pattern: "(?:max-width\\s*:|width\\s*:\\s*min\\()" },
        { file: "css", label: "The image cannot overflow its container", pattern: "img\\s*\\{[\\s\\S]*max-width\\s*:\\s*100%" },
      ],
      workedSolution: {
        html: "<main class=\"gallery\"><img src=\"studio.jpg\" alt=\"Our studio\"><p>Recent work.</p></main>",
        css: ".gallery {\n  width: min(100% - 2rem, 68rem);\n  margin-inline: auto;\n}\n\nimg {\n  max-width: 100%;\n  height: auto;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a fixed pixel width guarantees the layout looks the same everywhere.",
        symptom: "The page scrolls sideways on a narrow screen and the content is cut off.",
        hint: "Tie the width to the available space with a percentage or min() and keep a maximum, so the layout adapts instead of overflowing.",
        file: "css",
        detect: "width\\s*:\\s*\\d{3,}px",
        detectableExample: ".gallery {\n  width: 1200px;\n}",
      },
      {
        wrong: "the image will shrink on its own because it sits inside the page.",
        symptom: "A large photograph pushes the column wider and reintroduces sideways scrolling.",
        hint: "Set img max-width to 100% and height to auto. An image keeps its intrinsic size until you cap it.",
        file: "css",
        detect: "^(?![\\s\\S]*max-width\\s*:\\s*100%)[\\s\\S]*img\\s*\\{",
        detectableExample: "img {\n  height: auto;\n}",
      },
    ],
  },
  {
    lessonId: "adults-responsive-media",
    courseIds: ["adults"],
    concept: "A media query applies rules only when its condition matches, and a good breakpoint comes from the layout needing more room rather than from a device model.",
    make: "The learner keeps a one-column layout as the default and adds a two-column layout from a 700px breakpoint.",
    difficulty: 3,
    prerequisites: ["adults-responsive-viewport"],
    projectStep: "The project's main content stays one column on a phone and becomes a two-column layout on a wider screen.",
    stages: {
      hook: {
        lead: "A two-column layout is applied to every screen. On a phone the columns are so narrow the words break. Where should the two-column rule actually live?",
        variants: {
          guided: "A wide layout should only apply when there is room for it. That condition belongs in a media query.",
          balanced: "The narrow layout is the honest default. The wide one is an enhancement added on top.",
          independent: "Choose the breakpoint where the content stops working, not where a device happens to sit.",
        },
      },
      model: {
        lead: ".story-layout { display: grid; grid-template-columns: 1fr; gap: 1rem; } and @media (min-width: 700px) { .story-layout { grid-template-columns: 2fr 1fr; } }. The narrow layout is the default and the wide one is added.",
        variants: {
          guided: "Keep the base rule one column, then add a media query that changes only the tracks.",
          balanced: "Inside the media query, change only what differs and leave the shared declarations in the base rule.",
          independent: "Pick the breakpoint from the content, so the layout changes when it needs to rather than at a round number.",
        },
      },
      build: {
        lead: "Work in the CSS file. Keep the base rule one column, then add a media query that changes only the track definition.",
        variants: {
          guided: "Leave the base rule as it is, then add the media query after it.",
          balanced: "Add the media query, set the wider tracks inside it, then resize across the breakpoint.",
          independent: "Decide the breakpoint width before you write it, based on where the single column becomes cramped.",
        },
      },
      check: {
        lead: "Resize across 700px. Below it the layout is one column, above it two, and nothing breaks at the boundary.",
        variants: {
          guided: "Check the default is one column and that the media query sets two.",
          balanced: "Confirm the shared declarations are not duplicated inside the media query.",
          independent: "Verify the layout is readable on both sides of the breakpoint, not just at the extremes.",
        },
      },
      explain: {
        lead: "Now a news page that shows one column on a phone but needs a wider two-column layout for a sidebar. Keep the single column as the default and switch to two columns from 700px. No example open.",
        variants: {
          guided: "The new page needs the same base rule and the same media query.",
          balanced: "Same base rule and same breakpoint on the new page.",
          independent: "Work with no example open and choose the two track sizes yourself.",
        },
      },
      transfer: {
        lead: "Every layout in the project starts narrow and adds a wider version inside a media query.",
        variants: {
          guided: "Every wider layout you add to the project goes inside a media query.",
          balanced: "Breakpoints chosen from the content are what keep the project readable at every width.",
          independent: "Keep the narrow layout as the default, so no screen is ever left without a usable version.",
        },
      },
    },
    mastery: {
      freshTask: "A news page shows one column on a phone but needs a wider two-column layout for a sidebar. Keep the single column as the default and switch to a two-column layout from 700px.",
      observable: "Below 700px the page is one column, and at 700px and above it becomes two columns with the sidebar narrower than the main content.",
      reflection: "In your own words, how do you decide where to place a breakpoint?",
      starterFiles: {
        html: "<main class=\"story-layout\"><section>Story</section><aside>Related</aside></main>",
        css: ".story-layout {\n  display: grid;\n  gap: 1rem;\n}\n/* Set the narrow default, then add the wider layout */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The default layout is a single column", pattern: "\\.story-layout\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr" },
        { file: "css", label: "A breakpoint is declared", pattern: "@media\\s*\\(min-width\\s*:\\s*700px\\)" },
        { file: "css", label: "The wide layout has two tracks", pattern: "@media[\\s\\S]*grid-template-columns\\s*:\\s*2fr\\s+1fr" },
      ],
      workedSolution: {
        html: "<main class=\"story-layout\"><section>Story</section><aside>Related</aside></main>",
        css: ".story-layout {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n@media (min-width: 700px) {\n  .story-layout {\n    grid-template-columns: 2fr 1fr;\n  }\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the wide layout can be the default, since most visitors are on a laptop.",
        symptom: "On a phone the two columns are too narrow, so the text wraps badly and the page is hard to read.",
        hint: "Start from the narrow layout and add the wide one inside a media query. The default should be the smallest screen you support.",
        file: "css",
        detect: "^(?![\\s\\S]*@media)[\\s\\S]*grid-template-columns\\s*:\\s*(?:2fr|1fr\\s+1fr|repeat\\()",
        detectableExample: ".story-layout {\n  grid-template-columns: 2fr 1fr;\n}",
      },
      {
        wrong: "the media query should repeat the whole component rule.",
        symptom: "The duplicated rule drifts from the base rule, and later changes have to be made twice.",
        hint: "Inside the media query, change only the declarations that differ, such as the track definition. Leave the shared declarations in the base rule.",
        file: "css",
        detect: "@media[\\s\\S]*\\{[\\s\\S]*display\\s*:\\s*grid[\\s\\S]*gap\\s*:",
        detectableExample: "@media (min-width: 700px) {\n  .story-layout {\n    display: grid;\n    gap: 1rem;\n  }\n}",
      },
    ],
  },
];
