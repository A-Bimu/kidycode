import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The creative batch of the V3 lesson journey: the ages 13 to 15 pathway.
 *
 * The default register for this course is balanced, where the learner decides
 * when to open the example. The wording here treats the work as designing and
 * experimenting: a breakpoint is a decision about content, a custom property is a
 * name for a value that will otherwise drift, and storage is a small promise to
 * the visitor. Independent wording is present for a learner who asks for less
 * support than the course default.
 */

export const creativePathwayScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-responsive-media",
    courseIds: ["ages-13-15"],
    concept: "A media query is a rule that only applies when the available width crosses a boundary you chose, so the layout can change where the content needs it.",
    make: "The learner gives their gallery a single column by default and two equal columns on a wider screen.",
    difficulty: 3,
    prerequisites: ["ages-13-15-responsive-viewport"],
    projectStep: "The project's card area stops being cramped on a wide screen without disturbing the phone layout.",
    stages: {
      hook: {
        lead: "The same gallery is comfortable on a phone and cramped on a laptop, where every card is squeezed into one tall column. Should the layout change, or should the cards get smaller?",
        variants: {
          guided: "One column is right on a phone and wasteful on a laptop. A media query lets you keep both.",
          balanced: "A breakpoint is a decision about the content, not a common device size. Choose where the layout stops working and change it there.",
          independent: "Name the failure before you name the number: at which width does the single column waste more space than it saves?",
        },
      },
      model: {
        lead: "@media (min-width: 640px) { .gallery { grid-template-columns: 1fr 1fr; } }. The base rule still applies everywhere; the query overrides one declaration once the width is reached.",
        variants: {
          guided: "Keep the base rule as it is. Add the query below it and change only the column count inside.",
          balanced: "Read the query as a condition on the whole block: everything inside applies only when the screen is at least that wide.",
          independent: "Note the direction. min-width builds up from small, max-width tears down from large, and mixing the two is how layouts start fighting each other.",
        },
      },
      build: {
        lead: "Work in the CSS file. Leave the base rule alone, then add the media query below it with only the declaration that changes.",
        variants: {
          guided: "Type @media (min-width: 640px) and then the braces. Inside, repeat the selector and change the columns.",
          balanced: "Add the query below the base rule and change only the column count inside it, then run the preview at two widths.",
          independent: "Write the query first and decide the boundary from the content, then confirm the base rule still holds when narrow.",
        },
      },
      check: {
        lead: "Narrow the preview and widen it again. The gallery must be one column when narrow and two when wide, with nothing else moved.",
        variants: {
          independent: "Move the boundary twenty pixels and confirm the change follows the boundary rather than the device you are testing on.",
          guided: "Narrow the preview and widen it again. Count the columns in each case.",
          balanced: "Test the two widths deliberately: one below the boundary and one above it.",
        },
      },
      explain: {
        lead: "Now a different page: a layout that is one column by default and two equal columns from 700 pixels. No example open.",
        variants: {
          guided: "The new page starts as one column. Add one query with one changed declaration.",
          balanced: "Same decision, new page: one base layout and one query that changes a single declaration.",
          independent: "Work with no example open, pick the boundary yourself and be ready to say why you chose it.",
        },
      },
      transfer: {
        lead: "Every later part of the project can reuse this shape: one base layout, then one query for the wider screen.",
        variants: {
          independent: "Keep one breakpoint per real change. A long list of queries is usually a base layout that was never decided.",
          guided: "Your gallery keeps both layouts from now on.",
          balanced: "One base rule and one query is the whole pattern to reuse.",
        },
      },
    },
    mastery: {
      freshTask: "A gallery page is a single column by default. Add a media query so that from 640 pixels wide it becomes two equal columns, and leave the default layout as it is.",
      observable: "The gallery is one column in a narrow preview and two equal columns in a wide one.",
      reflection: "In your own words, why is the base rule kept outside the media query?",
      starterFiles: {
        html: "<main class=\"gallery\">\n  <article>First</article>\n  <article>Second</article>\n</main>",
        css: ".gallery {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 0.75rem;\n}\n/* Add the wider layout */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The wider layout uses a 640 pixel boundary", pattern: "@media\\s*\\(\\s*min-width\\s*:\\s*640px\\s*\\)" },
        { file: "css", label: "The wider rule targets the gallery", pattern: "@media[\\s\\S]*\\.gallery\\s*\\{[\\s\\S]*grid-template-columns" },
        { file: "css", label: "The wider layout has two equal tracks", pattern: "@media[\\s\\S]*grid-template-columns\\s*:\\s*1fr\\s+1fr" },
      ],
      workedSolution: {
        html: "<main class=\"gallery\">\n  <article>First</article>\n  <article>Second</article>\n</main>",
        css: ".gallery {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 0.75rem;\n}\n\n@media (min-width: 640px) {\n  .gallery {\n    grid-template-columns: 1fr 1fr;\n  }\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the breakpoint belongs on the base rule instead of a query.",
        symptom: "The wider layout applies to the phone too, so the base rule has no effect.",
        hint: "Put the new declaration inside the media query and leave the narrow layout in the rule above it. The query should hold only what changes.",
        file: "css",
        detect: "^(?![\\s\\S]*@media)[\\s\\S]*grid-template-columns\\s*:\\s*1fr\\s+1fr",
        detectableExample: ".gallery {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n}",
      },
      {
        wrong: "max-width and min-width can be picked at random.",
        symptom: "The wide layout and the narrow layout fight each other and the last one in the file always wins.",
        hint: "Pick one direction and stay with it. Starting from the small screen with min-width is the simplest rule to reason about.",
        file: "css",
        detect: "@media\\s*\\(\\s*max-width",
        detectableExample: "@media (max-width: 640px) {\n  .gallery {\n    grid-template-columns: 1fr 1fr;\n  }\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-css-system-tokens",
    courseIds: ["ages-13-15"],
    concept: "A custom property names a design value once at the top of the stylesheet, and the rest of the sheet refers to the name instead of repeating the value.",
    make: "The learner defines the ink, rule and gap values once and uses all three in one component rule.",
    difficulty: 3,
    prerequisites: ["ages-13-15-css-system-box-model"],
    projectStep: "The project's colours and spacing stop being scattered literals and become three named values the whole site shares.",
    stages: {
      hook: {
        lead: "The same colour appears in four rules and the same spacing in six. Change your mind about either and you must find every copy. What would make it a single edit?",
        variants: {
          guided: "One value written many times is hard to change. Naming it once fixes that.",
          balanced: "A repeated literal is a decision with no name. Giving it a name is what lets you change it once.",
          independent: "This is the difference between a palette and a pile of hex codes. The name is the contract the rest of the sheet relies on.",
        },
      },
      model: {
        lead: ":root { --ink: #1f2937; --gap: 1rem; } then .footer { color: var(--ink); padding: var(--gap); }. The :root block is where the names are declared; var() is how another rule reads them.",
        variants: {
          guided: "Every custom property name starts with two hyphens. Declare them in :root, then use var() with the same name.",
          balanced: "The name lives on one rule and is readable everywhere below it. That is why the declaration goes at the top of the sheet.",
          independent: "Name the role and not the value: --ink outlives --dark-grey when the palette changes.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the :root block first with three names, then use each name once in the component rule below it.",
        variants: {
          guided: "Add the three names in :root and run the preview. Then replace one literal with var() and run it again.",
          balanced: "Write the root block with three names, then use each name once in the rule below it.",
          independent: "Name the roles before the values, write the root block once, and read from it everywhere below.",
        },
      },
      check: {
        lead: "Change one value inside :root and run the preview. Every place that uses the name must change together.",
        variants: {
          independent: "Check that no literal remains where the name should be used. A single stray hex code breaks the whole point of the exercise.",
          guided: "Change one value in the root block and run the preview. Count how many places changed.",
          balanced: "Edit one named value and confirm the change reaches every use of it.",
        },
      },
      explain: {
        lead: "Now a different page: a footer that names its ink, its rule line and its gap, then uses all three. No example open.",
        variants: {
          guided: "Do the same three steps on the new page: declare, then use, then check.",
          balanced: "The new page needs the same three declarations and three uses.",
          independent: "Work with no example open and choose both the names and the values yourself.",
        },
      },
      transfer: {
        lead: "The project's own palette will be these names, so a later lesson can restyle the whole site from one block.",
        variants: {
          independent: "Keep the names few. A sheet with thirty custom properties is the same problem in a different shape.",
          guided: "Your site will use these names everywhere.",
          balanced: "Named values are what let the whole site change from one place.",
        },
      },
    },
    mastery: {
      freshTask: "A footer page needs three named values declared once: an ink colour, a rule colour and a gap. Use the ink for the text, the rule for the top border and the gap for the padding.",
      observable: "Changing one value in the named block changes every place that uses it, and the rule contains no repeated colour.",
      reflection: "In your own words, what changed when the colour moved out of the rule and into a named value?",
      starterFiles: {
        html: "<footer class=\"footer\">Project footer</footer>",
        css: "/* Name the colours and use them */\n\n.footer {\n  padding: 1rem;\n}\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Three values are named once at the root", pattern: ":root\\s*\\{(?:[\\s\\S]*--[a-z-]+\\s*:){3}" },
        { file: "css", label: "The footer text reads the ink value", pattern: "var\\(\\s*--ink\\s*\\)" },
        { file: "css", label: "The padding reads the gap value", pattern: "padding\\s*:\\s*var\\(\\s*--gap\\s*\\)" },
      ],
      workedSolution: {
        html: "<footer class=\"footer\">Project footer</footer>",
        css: ":root {\n  --ink: #1f2937;\n  --rule: #c9a84c;\n  --gap: 1rem;\n}\n\n.footer {\n  color: var(--ink);\n  border-top: 2px solid var(--rule);\n  padding: var(--gap);\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the colour can be typed again in each rule instead of named.",
        symptom: "The sheet works, but changing the colour still means editing every rule that repeats it.",
        hint: "Give the value a name in the root block and replace each literal with var() and that name. Do one rule at a time and run the preview after each.",
        file: "css",
        detect: "\\.footer\\s*\\{[\\s\\S]*#[0-9a-f]{3,6}",
        detectableExample: ".footer {\n  color: #1f2937;\n}",
      },
      {
        wrong: "a custom property can be used by writing its name on its own.",
        symptom: "The declaration is ignored and the property falls back to its default value.",
        hint: "A custom property is read with var() and the name in parentheses. Write color: var(--ink) rather than the name by itself.",
        file: "css",
        detect: "(?:color|padding|border-top)\\s*:\\s*--",
        detectableExample: ".footer {\n  color: --ink;\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-javascript-conditions",
    courseIds: ["ages-13-15"],
    concept: "A condition is a question with two outcomes, and the else branch is the answer for every case the question did not match.",
    make: "The learner makes a booking page choose between a morning and an afternoon slot from one value.",
    difficulty: 2,
    prerequisites: ["ages-13-15-javascript-values"],
    projectStep: "The project shows a different message depending on data the visitor brought with them.",
    stages: {
      hook: {
        lead: "A value at the top of the file decides what the page should say. There are two possibilities and only one may appear. Where does the decision belong?",
        variants: {
          guided: "One value, two possible messages, and only one of them shown.",
          balanced: "A condition is the only way to make the page choose. Writing both messages one after the other shows both.",
          independent: "Name the question, the boundary and both outcomes before you write a line. Ambiguity here shows up as the wrong message in front of a user.",
        },
      },
      model: {
        lead: "if (hour < 12) { slot = \"Morning\"; } else { slot = \"Afternoon\"; }. The else has no question of its own: it covers everything the if did not.",
        variants: {
          guided: "If the hour is under twelve, set Morning. Otherwise set Afternoon.",
          balanced: "Read the comparison as the boundary. Changing the number or the direction changes who lands in which branch.",
          independent: "Prefer two clear branches over several nested questions. Each added level is a case nobody will test.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the question first, put the first outcome inside its braces, then add else and the second outcome.",
        variants: {
          guided: "Add the if and its message, run the page, then add else and its message.",
          balanced: "Write the question, then both outcomes, then run once and check the slot.",
          independent: "Write both branches before running, then test just above and just below the boundary.",
        },
      },
      check: {
        lead: "Change the value to the other side of the boundary and run again. The page must swap cleanly, never show both and never show neither.",
        variants: {
          independent: "Check the value exactly on the boundary as well as either side of it, because that is where off by one errors live.",
          guided: "Change the hour to the other side of the boundary and count the slots shown. It should be one.",
          balanced: "Move the value across the boundary and confirm exactly one slot appears.",
        },
      },
      explain: {
        lead: "Now a different page: a ticket desk that gives full price from sixteen and half price below. No example open.",
        variants: {
          guided: "The new page has one number and two prices. Write the question and both outcomes.",
          balanced: "Same shape, new data. Decide the boundary before writing either outcome.",
          independent: "Work with no example open and choose the comparison yourself.",
        },
      },
      transfer: {
        lead: "The project will keep using this shape to decide what a visitor sees.",
        variants: {
          independent: "Keep both branches short and symmetrical. Two branches that look alike are much easier to trust.",
          guided: "Your booking page will keep choosing between two outcomes.",
          balanced: "This two branch shape is the one to reuse whenever the page must choose.",
        },
      },
    },
    mastery: {
      freshTask: "A booking page holds an hour value. Set the slot to Morning when the hour is before twelve and to Afternoon otherwise, then show the chosen slot on the page.",
      observable: "Changing the hour in the file swaps the page between the two slots, and only one is shown at a time.",
      reflection: "In your own words, what does the else branch cover?",
      starterFiles: {
        html: "<p id=\"slot\"></p>",
        css: "",
        javascript: "const hour = 15;\nlet slot = \"\";\n// Choose the slot\n// Show the slot\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The question compares the hour", pattern: "if\\s*\\(\\s*hour\\s*<\\s*12\\s*\\)" },
        { file: "javascript", label: "The morning outcome is set", pattern: "slot\\s*=\\s*[\"']Morning[\"']" },
        { file: "javascript", label: "The alternative is set in the else branch", pattern: "else\\s*\\{[\\s\\S]*slot\\s*=\\s*[\"']Afternoon[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"slot\"></p>",
        css: "",
        javascript: "const hour = 15;\nlet slot = \"\";\nif (hour < 12) {\n  slot = \"Morning\";\n} else {\n  slot = \"Afternoon\";\n}\ndocument.querySelector(\"#slot\").textContent = slot;\n",
      },
    },
    misconceptions: [
      {
        wrong: "both outcomes can be written one after the other and the last one wins.",
        symptom: "The page always shows the same slot because both lines run.",
        hint: "Put each outcome inside its own branch. The browser runs every line it finds, so a branch is the only thing that stops a line from running.",
        file: "javascript",
        detect: "^(?![\\s\\S]*\\bif\\s*\\()[\\s\\S]*slot\\s*=",
        detectableExample: "slot = \"Morning\";\nslot = \"Afternoon\";",
      },
      {
        wrong: "the else keyword needs a condition in parentheses.",
        symptom: "The page reports a syntax error or the second branch never runs.",
        hint: "The else has no question of its own: it covers everything the if did not match. Remove the parentheses and keep only the braces.",
        file: "javascript",
        detect: "else\\s*\\(\\s*hour",
        detectableExample: "else (hour < 12) {\n  slot = \"Morning\";\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-interaction-storage",
    courseIds: ["ages-13-15"],
    concept: "localStorage writes a named value for this browser and reads it back, and the same key must be used for both, with a fallback for the first visit.",
    make: "The learner saves a chosen theme and restores it on the next visit, with sensible text when nothing was saved.",
    difficulty: 4,
    prerequisites: ["ages-13-15-interaction-events"],
    projectStep: "The project remembers one small preference between visits instead of asking again every time.",
    stages: {
      hook: {
        lead: "The visitor chose a colour scheme and it vanished when they came back. The page has no memory of its own. What is the smallest thing you could give it?",
        variants: {
          guided: "The browser can remember one small value for you. Today you save one and read it back.",
          balanced: "Storage gives the page a memory, and it also introduces a first visit where nothing is stored yet.",
          independent: "A stored value is state that outlives the page. Handle the missing case first, because that is the case every new visitor sees.",
        },
      },
      model: {
        lead: "localStorage.setItem(\"site-theme\", picked); then const saved = localStorage.getItem(\"site-theme\") || \"light\";. The key is the same string in both calls, and the fallback covers the first visit.",
        variants: {
          guided: "Save with setItem, read with getItem, and use the same key name both times.",
          balanced: "getItem returns null when the key was never saved, so the || fallback is what a first time visitor sees.",
          independent: "Storage holds text only. Keep the key stable and versioned by name, because the same origin shares all of it.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Save the value first, then read it back into a new name, then show that name on the page.",
        variants: {
          guided: "Write the setItem line first, run the page, then add the getItem line with its fallback.",
          balanced: "Save the value, read it back into a new name with a fallback, then show it.",
          independent: "Decide the key name and the fallback before writing either call, then reload the preview to check both paths.",
        },
      },
      check: {
        lead: "Reload the preview twice. The first run shows the fallback, and the second shows what was saved, because the memory survives a reload.",
        variants: {
          independent: "Check the missing key case deliberately, before anything is saved, rather than assuming the fallback works.",
          guided: "Run the preview once before saving anything and check something sensible shows.",
          balanced: "Test both cases: nothing saved yet, and something already saved.",
        },
      },
      explain: {
        lead: "Now a different page: save a theme under site-theme, read it back with a fallback and show it. No example open.",
        variants: {
          guided: "The new page saves one preference. Use the key name in the task exactly as written.",
          balanced: "The new page saves and restores one value with a fallback.",
          independent: "Work with no example open and choose the fallback text yourself.",
        },
      },
      transfer: {
        lead: "The project keeps one small preference this way. Anything private or personal does not belong in storage.",
        variants: {
          independent: "Storage is visible to every script on the origin. Keep it to presentation choices and never to anything a visitor would mind sharing.",
          guided: "Your page can remember one small choice for the visitor.",
          balanced: "Keep the stored value small and never personal.",
        },
      },
    },
    mastery: {
      freshTask: "A settings page lets the visitor pick a theme. Save the choice under the key site-theme, read it back with a fallback for the first visit, and show the restored theme on the page.",
      observable: "The first load shows the fallback and a reload shows the saved theme, with the same key used for both calls.",
      reflection: "In your own words, what does the fallback do, and when would it be used?",
      starterFiles: {
        html: "<p id=\"theme\"></p>",
        css: "",
        javascript: "const picked = \"dusk\";\nconst themeOut = document.querySelector(\"#theme\");\n// Save and restore\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The theme is saved under the shared key", pattern: "localStorage\\.setItem\\s*\\(\\s*[\"']site-theme[\"']" },
        { file: "javascript", label: "The same key is read back", pattern: "localStorage\\.getItem\\s*\\(\\s*[\"']site-theme[\"']" },
        { file: "javascript", label: "A fallback covers the first visit", pattern: "(?:\\|\\||\\?\\?)" },
        { file: "javascript", label: "The restored theme is shown", pattern: "themeOut\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"theme\"></p>",
        css: "",
        javascript: "const picked = \"dusk\";\nconst themeOut = document.querySelector(\"#theme\");\nlocalStorage.setItem(\"site-theme\", picked);\nconst saved = localStorage.getItem(\"site-theme\") || \"light\";\nthemeOut.textContent = saved;\n",
      },
    },
    misconceptions: [
      {
        wrong: "the saved value is read back under a different key name.",
        symptom: "The page always shows the fallback, even after the value was saved.",
        hint: "A key is an exact string, not a description. Use the same text in setItem and getItem so the second call finds what the first one wrote.",
        file: "javascript",
        detect: "setItem\\s*\\(\\s*[\"']site-theme[\"'][\\s\\S]*getItem\\s*\\(\\s*[\"'](?!site-theme)",
        detectableExample: "localStorage.setItem(\"site-theme\", picked);\nconst saved = localStorage.getItem(\"theme\");",
      },
      {
        wrong: "a value always comes back, so no fallback is needed.",
        symptom: "The page shows undefined or blank the first time somebody visits it.",
        hint: "getItem returns null when nothing was ever saved. Add the fallback after the read so the first visit shows something sensible.",
        file: "javascript",
        detect: "=[\\s\\S]*localStorage\\.getItem\\s*\\(\\s*[\"']site-theme[\"']\\s*\\)\\s*;",
        detectableExample: "const saved = localStorage.getItem(\"site-theme\");",
      },
    ],
  },
];
