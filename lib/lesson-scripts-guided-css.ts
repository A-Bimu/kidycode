import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The guided batch of the V3 lesson journey: the remaining CSS challenge
 * lessons of the ages 10 to 12 pathway.
 *
 * Each script names one idea, one concrete change in the learner's own
 * stylesheet, one small experiment and one independent fresh task with its own
 * starter, checks and worked solution. The wording is written for a ten to
 * twelve year old at the guided level, with balanced and independent wording
 * kept for a learner who overrides the level.
 */

export const guidedCssScripts: LessonScript[] = [
  {
    lessonId: "css-foundations-rules",
    courseIds: ["ages-10-12"],
    concept: "A rule names the element it affects with a selector, then lists property and value pairs inside braces.",
    make: "The learner writes one rule that changes the colour of a heading.",
    difficulty: 1,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The website's first colour rule gives the page a deliberate look.",
    stages: {
      hook: {
        lead: "Everything on the page is the same dark colour. No rule has told the browser what to change yet. What does a style rule look like?",
        variants: {
          guided: "The headings are plain black. Today you write one small rule that changes their colour.",
          balanced: "A rule is a small instruction: choose the part, then say what to change it to.",
          independent: "One selector, one or more declarations. Decide the selector before you decide the value.",
        },
      },
      model: {
        lead: "h1 { color: #4b1f63; }. The h1 names the element, the braces hold the instruction, and color: #4b1f63 says which property changes and to what.",
        variants: {
          guided: "Write h1, then open a brace, then color: #4b1f63, then close the brace.",
          balanced: "The selector names the target and every declaration ends with a semicolon.",
          independent: "The hash and six digits form a colour value; a missing hash makes the value invalid.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the rule for the heading and run the page to see the colour change.",
        variants: {
          guided: "Type h1 { first. Then add color: #4b1f63; inside and run the page.",
          balanced: "Write the whole rule, then run the page and check only the heading changed.",
          independent: "Type the rule, run once and confirm the value is exactly as given.",
        },
      },
      check: {
        lead: "Run the page. The heading's text colour should change while nothing else moves.",
        variants: {
          guided: "Look at the heading. Did its colour change?",
          balanced: "Check the declaration sits between the braces.",
          independent: "Read the rule back and confirm the selector and the value are both correct.",
        },
      },
      explain: {
        lead: "Now a different page: a sub heading needs the colour #5a2676. No example open.",
        variants: {
          guided: "Same rule shape, new element and new colour.",
          balanced: "Write a rule for the sub heading with the new colour.",
          independent: "Work with no example open and choose the selector yourself.",
        },
      },
      transfer: {
        lead: "Your website will use a handful of colour rules so the page looks like one place.",
        variants: {
          independent: "Keep colours in a small set so the site stays consistent as it grows.",
          guided: "Your website will have its own colours from rules like this.",
          balanced: "Deliberate colours make a page easier to read and easier to trust.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a sub heading and needs its text colour set to #5a2676 with one CSS rule.",
      observable: "The sub heading's colour changes and nothing else on the page is affected.",
      reflection: "In your own words, which part of the rule chooses the element and which part says what changes?",
      starterFiles: {
        html: "<h2>Chapter one</h2>",
        css: "/* Colour the sub heading */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "A rule targets the sub heading", pattern: "h2\\s*\\{" },
        { file: "css", label: "The rule sets the colour", pattern: "h2\\s*\\{[\\s\\S]*color\\s*:\\s*#5a2676" },
      ],
      workedSolution: {
        html: "<h2>Chapter one</h2>",
        css: "h2 {\n  color: #5a2676;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the colour can sit beside the selector instead of inside braces.",
        symptom: "The heading does not change because the instruction is not part of the rule.",
        hint: "Declarations live between the braces. Move color: #5a2676 inside the pair of braces that follows the selector.",
        file: "css",
        detect: "^(?![^{]*\\{)[\\s\\S]*color\\s*:",
        detectableExample: "h2 color: #5a2676;",
      },
      {
        wrong: "the hash before a hex colour is optional.",
        symptom: "The colour does not apply because the value is not a valid colour.",
        hint: "A colour written in hex needs the hash, as in #5a2676. Without it the browser ignores the declaration.",
        file: "css",
        detect: "color\\s*:\\s*[0-9a-f]{6}\\b",
        detectableExample: "h2 {\n  color: 5a2676;\n}",
      },
    ],
  },
  {
    lessonId: "css-foundations-type",
    courseIds: ["ages-10-12"],
    concept: "Readable text needs a large enough letter size and enough space between lines, and a width limit keeps the lines from running too long.",
    make: "The learner sets the size, the line spacing and a comfortable line length for a block of text.",
    difficulty: 2,
    prerequisites: ["css-foundations-rules"],
    projectStep: "The website's body text becomes comfortable to read.",
    stages: {
      hook: {
        lead: "A paragraph stretches the whole width of the screen and the lines sit tightly together. It is tiring to read. Which settings would fix it?",
        variants: {
          guided: "The lines are long and crowded. Today you make the text bigger and give the lines more room.",
          balanced: "Three settings decide readable text: letter size, line spacing and line length.",
          independent: "Readability is a set of trade-offs. Name the property that controls each one.",
        },
      },
      model: {
        lead: "p { font-size: 1.1rem; line-height: 1.7; max-width: 60ch; }. Each declaration changes one thing about how the text reads.",
        variants: {
          guided: "font-size makes letters bigger, line-height adds space between lines, max-width stops the line getting too long.",
          balanced: "The ch unit is about one character wide, so 60ch keeps lines near sixty characters.",
          independent: "max-width, not width, lets the text still shrink on a small screen.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the three declarations one at a time and run the page after each.",
        variants: {
          guided: "Add font-size first and run the page. Then line-height. Then max-width.",
          balanced: "Add all three, then run once and check the paragraph is easier to read.",
          independent: "Set the values, run once and narrow the preview to confirm the text still fits.",
        },
      },
      check: {
        lead: "Run the page. The letters should be larger, the lines less crowded, and the text should not touch the right edge.",
        variants: {
          guided: "Check three things: bigger letters, more space between lines, and a clear gap on the right.",
          balanced: "Compare the paragraph with how it looked before.",
          independent: "Narrow the preview and confirm the long line limit does not cause sideways scrolling.",
        },
      },
      explain: {
        lead: "Now a different page: a list of notes needs 1.1rem letters and 1.7 line spacing. No example open.",
        variants: {
          guided: "Same settings, new element. Put them in a rule for the list.",
          balanced: "Write a rule that sets both the size and the spacing for the list.",
          independent: "Work with no example open and choose the selector for the list.",
        },
      },
      transfer: {
        lead: "Your website's reading text will use the same three settings so every page is comfortable.",
        variants: {
          independent: "Keep one set of type settings for the whole site so pages stay consistent.",
          guided: "Your website text will be set the same way.",
          balanced: "Readable type is one of the easiest improvements to make and to notice.",
        },
      },
    },
    mastery: {
      freshTask: "A notes list needs larger letters of 1.1rem and more space between lines at 1.7. Write a rule for the list.",
      observable: "The list text is larger and its lines are more widely spaced than before.",
      reflection: "In your own words, what does line-height change that font-size does not?",
      starterFiles: {
        html: "<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>",
        css: "ul {\n  /* Type settings */\n}",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The text is large enough", pattern: "font-size\\s*:\\s*1\\.1rem" },
        { file: "css", label: "The lines are spaced apart", pattern: "line-height\\s*:\\s*1\\.7" },
      ],
      workedSolution: {
        html: "<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>",
        css: "ul {\n  font-size: 1.1rem;\n  line-height: 1.7;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "making the letters bigger is enough to make text readable.",
        symptom: "The letters are larger but the lines still crowd together.",
        hint: "Add line-height as well as font-size. The space between lines is a separate setting from the size of the letters.",
        file: "css",
        detect: "^(?![\\s\\S]*line-height)[\\s\\S]*font-size\\s*:",
        detectableExample: "ul {\n  font-size: 1.1rem;\n}",
      },
      {
        wrong: "a fixed width and a maximum width do the same job.",
        symptom: "The text stays narrow on a wide screen because the limit never lifts.",
        hint: "Use max-width so the text can still shrink on a small screen. A fixed width would stay the same size everywhere.",
        file: "css",
        detect: "(?:^|[^-a-z])width\\s*:",
        detectableExample: "ul {\n  width: 60ch;\n}",
      },
    ],
  },
  {
    lessonId: "css-foundations-cards",
    courseIds: ["ages-10-12"],
    concept: "A card is one reusable group made from a background, a border and rounded corners, all set on the same class.",
    make: "The learner turns a plain block of content into a card with three deliberate styles.",
    difficulty: 2,
    prerequisites: ["css-foundations-classes"],
    projectStep: "The website's content items become cards that share one rule.",
    stages: {
      hook: {
        lead: "A block of content sits flat on the page with no edge and no shape. Three settings would turn it into a card. Which three?",
        variants: {
          guided: "The words have no box around them. Today you add a background, an edge and rounded corners.",
          balanced: "A card is a group you can see: a surface, a line around it, and soft corners.",
          independent: "Each of the three declarations does one job; decide which before you type.",
        },
      },
      model: {
        lead: ".card { background: #fffdf8; border: 2px solid #18213f; border-radius: 12px; }. The class owns the look, so every card shares it.",
        variants: {
          guided: "background fills the box, border draws the edge, border-radius rounds the corners.",
          balanced: "Write the three declarations inside one .card rule, separated by semicolons.",
          independent: "The class name must match the HTML exactly; a difference in spelling styles nothing.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the three declarations to the card rule, running the page after each one.",
        variants: {
          guided: "Add background first and run the page. Then border. Then border-radius.",
          balanced: "Add all three, then run the page and check the block now reads as a card.",
          independent: "Set the values, run once and confirm the edge and corners are even.",
        },
      },
      check: {
        lead: "Run the page. The block should now have a surface, an edge and rounded corners.",
        variants: {
          guided: "Count what changed: a background, a line around it, and soft corners.",
          balanced: "Check each of the three effects is present.",
          independent: "Confirm the rule sits on the class, not on the element, so it can be reused.",
        },
      },
      explain: {
        lead: "Now a different page: a notice box needs a soft background and rounded corners. No example open.",
        variants: {
          guided: "Same two settings, new class name. Write a rule for the notice.",
          balanced: "Write a rule that gives the notice a background and rounded corners.",
          independent: "Work with no example open and choose the class selector with the dot.",
        },
      },
      transfer: {
        lead: "Every card on your website will share one rule, so a change in one place updates them all.",
        variants: {
          independent: "One class, many elements is the whole point: edit once, update everywhere.",
          guided: "Your website cards will all use this one rule.",
          balanced: "Reusable styles keep a growing site consistent.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a notice box that needs a soft background of #f0e6c8 and rounded corners of 10px, set on the notice class.",
      observable: "The notice box gains a surface colour and rounded corners without moving.",
      reflection: "In your own words, why is the style written on a class instead of on each element?",
      starterFiles: {
        html: "<aside class=\"notice\">Keep this</aside>",
        css: "/* Style the notice */",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The notice has a background", pattern: "\\.notice\\s*\\{[\\s\\S]*background\\s*:\\s*#f0e6c8" },
        { file: "css", label: "The corners are rounded", pattern: "\\.notice\\s*\\{[\\s\\S]*border-radius\\s*:\\s*10px" },
      ],
      workedSolution: {
        html: "<aside class=\"notice\">Keep this</aside>",
        css: ".notice {\n  background: #f0e6c8;\n  border-radius: 10px;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a background colour on its own already makes a card.",
        symptom: "The box has colour but no edge, so it does not read as a clear group.",
        hint: "Add border and border-radius as well. The edge and the rounded corners are what make the group read as one card.",
        file: "css",
        detect: "^(?![\\s\\S]*\\bborder)[\\s\\S]*background\\s*:",
        detectableExample: ".notice {\n  background: #f0e6c8;\n}",
      },
      {
        wrong: "a hex colour can be written without the hash.",
        symptom: "The background does not apply because the value is not a valid colour.",
        hint: "A hex colour needs the hash and six digits, as in #f0e6c8. Without the hash the declaration is ignored.",
        file: "css",
        detect: "background\\s*:\\s*[0-9a-f]{6}\\b",
        detectableExample: ".notice {\n  background: f0e6c8;\n}",
      },
    ],
  },
  {
    lessonId: "css-layout-box",
    courseIds: ["ages-10-12"],
    concept: "Every element is a box, and padding adds space inside the border while margin adds space outside it.",
    make: "The learner uses inner space and outer space to separate a heading from its content.",
    difficulty: 2,
    prerequisites: ["css-foundations-cards"],
    projectStep: "The website's spacing stops being random and starts being deliberate.",
    stages: {
      hook: {
        lead: "A heading sits tightly against the text below it and against its own top edge. Two kinds of space could fix this. Which two?",
        variants: {
          guided: "The heading is cramped. Today you add room inside its box and room below it.",
          balanced: "Space can be inside a box or outside it, and each has its own property.",
          independent: "Name where the space belongs before choosing the property; the side matters.",
        },
      },
      model: {
        lead: "h2 { padding-top: 0.5rem; margin-bottom: 1.5rem; }. Padding pushes the content in; margin pushes the next thing away.",
        variants: {
          guided: "padding-top gives room above the heading's own text. margin-bottom pushes the next line down.",
          balanced: "Padding lives inside the border; margin lives outside it.",
          independent: "A single direction, such as padding-top, keeps the space where you meant it.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the two declarations to the heading rule and run the page after each.",
        variants: {
          guided: "Add padding-top first and run the page. Then add margin-bottom.",
          balanced: "Add both, then run the page and check the heading has room above and below.",
          independent: "Set the values, run once and confirm the spacing matches the task.",
        },
      },
      check: {
        lead: "Run the page. The heading should have room above its text and a clear gap before the next line.",
        variants: {
          guided: "Look above the heading and below it. Both should have space now.",
          balanced: "Check the space is inside at the top and outside at the bottom.",
          independent: "Confirm the two kinds of space are doing different jobs.",
        },
      },
      explain: {
        lead: "Now a different page: a heading needs half a rem of space inside its top and one and a half rem of space below it. No example open.",
        variants: {
          guided: "Same two settings, new rule. Put them on the heading.",
          balanced: "Write the two declarations on the heading selector.",
          independent: "Work with no example open and keep each value on the side the task named.",
        },
      },
      transfer: {
        lead: "Your website's spacing will use the same two ideas, so gaps look planned rather than accidental.",
        variants: {
          independent: "Consistent spacing is a small system; keep the values you reuse.",
          guided: "Your website uses inner and outer space like this everywhere.",
          balanced: "Deliberate spacing makes a page calmer and easier to scan.",
        },
      },
    },
    mastery: {
      freshTask: "A heading needs 0.5rem of space inside its top and 1.5rem of space below it so it is not cramped against its text.",
      observable: "The heading has room above its own text and a clear gap before the following content.",
      reflection: "In your own words, which property adds space inside the border and which adds space outside it?",
      starterFiles: {
        html: "<h2>Next steps</h2>\n<p>Read the note below.</p>",
        css: "h2 { border-bottom: 2px solid #18213f; }",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The heading has space inside its top", pattern: "padding-top\\s*:\\s*0\\.5rem" },
        { file: "css", label: "The heading has space below it", pattern: "margin-bottom\\s*:\\s*1\\.5rem" },
      ],
      workedSolution: {
        html: "<h2>Next steps</h2>\n<p>Read the note below.</p>",
        css: "h2 {\n  border-bottom: 2px solid #18213f;\n  padding-top: 0.5rem;\n  margin-bottom: 1.5rem;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a border adds space around an element.",
        symptom: "The heading is still crowded even though it now has a line under it.",
        hint: "A border draws a line but adds no room. Add padding to create space inside the line.",
        file: "css",
        detect: "^(?![\\s\\S]*\\bpadding)[\\s\\S]*\\bborder\\b",
        detectableExample: "h2 {\n  border-bottom: 2px solid #18213f;\n}",
      },
      {
        wrong: "the one-value shorthand for padding lands on every side.",
        symptom: "Space appears on all sides, including the sides where none was wanted.",
        hint: "Name the side you mean, such as padding-top, when the space should appear in one direction only.",
        file: "css",
        detect: "padding\\s*:\\s*[^;]+;",
        detectableExample: "h2 {\n  padding: 0.5rem;\n}",
      },
    ],
  },
  {
    lessonId: "css-layout-responsive",
    courseIds: ["ages-10-12"],
    concept: "A media query applies rules only when a screen condition is true, so one page can change its layout on a narrow screen.",
    make: "The learner writes a narrow-screen rule that turns a two-column layout into one column.",
    difficulty: 3,
    prerequisites: ["css-layout-grid"],
    projectStep: "The website changes its layout on a small screen instead of scrolling sideways.",
    stages: {
      hook: {
        lead: "A grid of two columns looks fine on a wide screen but squeezes on a phone. The same page needs a different layout on that narrow screen. How can one stylesheet do both?",
        variants: {
          guided: "Two columns are too tight on a phone. Today you add a rule that applies only on small screens.",
          balanced: "A media query wraps rules that should apply only when a condition is true.",
          independent: "The condition is a screen width. Decide the breakpoint before writing the rule.",
        },
      },
      model: {
        lead: "@media (max-width: 700px) { .menu { grid-template-columns: 1fr; } }. The rule inside runs only while the screen is 700 pixels or narrower.",
        variants: {
          guided: "Write @media (max-width: 700px), then a brace, then a .menu rule that sets one column.",
          balanced: "The parenthesis holds the condition; everything inside the braces obeys it.",
          independent: "Only the declarations that need to change go inside the query; the rest stay outside.",
        },
      },
      build: {
        lead: "Work in the CSS file below the existing rule. Add the media query and put the one-column rule inside it.",
        variants: {
          guided: "Type the media query line first, then add the .menu rule inside the braces.",
          balanced: "Write the condition and its rule, then run the page and narrow the preview.",
          independent: "Set the breakpoint, run once and check the layout only changes when the screen is narrow.",
        },
      },
      check: {
        lead: "Run the page, then narrow the preview below the breakpoint. The two columns should become one.",
        variants: {
          guided: "Make the preview narrow. Do the columns stack? Then widen it again and check they return.",
          balanced: "Compare the layout just above and just below the breakpoint.",
          independent: "Confirm the one-column rule applies only under the condition.",
        },
      },
      explain: {
        lead: "Now a different page: at 700px or below a menu of two columns must become one. No example open.",
        variants: {
          guided: "Same idea, new breakpoint and new selector.",
          balanced: "Write the query for the menu at the new width.",
          independent: "Work with no example open and put only the changed declaration inside the query.",
        },
      },
      transfer: {
        lead: "Your website will change its layout on small screens with the same kind of rule.",
        variants: {
          independent: "Design the narrow layout first, then add the wider one, and nothing breaks on a phone.",
          guided: "Your website will fit phones as well as computers.",
          balanced: "A page that fits every screen reaches every visitor.",
        },
      },
    },
    mastery: {
      freshTask: "A menu shows two columns. At 700 pixels or below it must become one column, written as a media query.",
      observable: "Narrowing the preview below 700 pixels stacks the menu into a single column and widening it restores two.",
      reflection: "In your own words, when do the rules inside your media query apply?",
      starterFiles: {
        html: "<nav class=\"menu\"><a href=\"#one\">One</a><a href=\"#two\">Two</a></nav>",
        css: ".menu { display: grid; grid-template-columns: repeat(2, 1fr); }",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "A narrow-screen rule exists", pattern: "@media\\s*\\(max-width\\s*:\\s*700px\\)" },
        { file: "css", label: "The rule changes the menu to one column", pattern: "@media[\\s\\S]*\\.menu\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr" },
      ],
      workedSolution: {
        html: "<nav class=\"menu\"><a href=\"#one\">One</a><a href=\"#two\">Two</a></nav>",
        css: ".menu { display: grid; grid-template-columns: repeat(2, 1fr); }\n\n@media (max-width: 700px) {\n  .menu { grid-template-columns: 1fr; }\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the small-screen rule can sit in the stylesheet without a condition.",
        symptom: "The layout is one column on every screen, including wide ones.",
        hint: "Put the one-column rule inside the media query so it applies only while the screen is narrow. Outside the query it applies everywhere.",
        file: "css",
        detect: "^(?![\\s\\S]*@media)[\\s\\S]*\\.menu\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr",
        detectableExample: ".menu {\n  grid-template-columns: 1fr;\n}",
      },
      {
        wrong: "the condition is written without its parentheses.",
        symptom: "The media query never applies because the condition is not written correctly.",
        hint: "Write the condition inside parentheses, as in @media (max-width: 700px).",
        file: "css",
        detect: "@media\\s+max-width",
        detectableExample: "@media max-width: 700px { .menu { grid-template-columns: 1fr; } }",
      },
    ],
  },
];
