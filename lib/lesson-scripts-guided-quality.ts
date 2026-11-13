import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The guided batch of the V3 lesson journey: the remaining quality and
 * finishing challenge lessons of the ages 10 to 12 pathway.
 *
 * Repair and accessibility lessons still take the six moments: the hook shows
 * the wrong behaviour, the worked example is the smallest complete repair, and
 * the fresh task is a different page with the same defect class. The sharing
 * lesson's fresh task is deliberately about privacy, because the safe habit is
 * the concept and not the sentence.
 */

export const guidedQualityScripts: LessonScript[] = [
  {
    lessonId: "quality-html",
    courseIds: ["ages-10-12"],
    concept: "A mismatched closing tag changes the structure of the page, so the repair is to match each closing tag to its opening tag.",
    make: "The learner repairs two mismatched closing tags by comparing what the page should show with what it does.",
    difficulty: 3,
    prerequisites: ["html-foundations-nesting"],
    projectStep: "The website's HTML stays well formed as it grows.",
    stages: {
      hook: {
        lead: "A heading and a paragraph look almost right, but the page breaks below them. Two closing tags do not match their openings. What tells you which is wrong?",
        variants: {
          guided: "Something is broken on the page. Today you compare the opening and closing tags and repair the two that do not match.",
          balanced: "A closing tag must match its opening tag; when it does not, the page structure shifts.",
          independent: "Compare the expected structure with the actual one before changing anything.",
        },
      },
      model: {
        lead: "An h2 opens, so </h2> closes it. A p opens, so </p> closes it. A closing tag with the wrong name swallows the content after it.",
        variants: {
          guided: "Read each pair aloud: h2 opens, so h2 closes. p opens, so p closes.",
          balanced: "Work outward: fix the inner element's closing tag first.",
          independent: "The browser hides the error and guesses, so trust the pair names rather than the picture.",
        },
      },
      build: {
        lead: "Work in the HTML file. Repair one closing tag at a time and run the page after each repair.",
        variants: {
          guided: "Fix the heading's closing tag first and run the page. Then fix the paragraph's.",
          balanced: "Repair both, then run the page and check the structure returned.",
          independent: "Change only the mismatched tags, then run once and confirm nothing else moved.",
        },
      },
      check: {
        lead: "Run the page. The heading and paragraph should each end where they should, with nothing swallowed.",
        variants: {
          guided: "Check the heading ends after its words, then the paragraph after its words.",
          balanced: "Compare each opening tag with its closing tag name.",
          independent: "Read the whole section and confirm the nesting is still correct.",
        },
      },
      explain: {
        lead: "Now a different page: a shop page has a heading and a paragraph with wrong closing tags. Repair both. No example open.",
        variants: {
          guided: "Same repair, new words. Match each closing tag to its opening.",
          balanced: "Find the two mismatched tags and correct them.",
          independent: "Work with no example open and change only what is broken.",
        },
      },
      transfer: {
        lead: "Your website will grow, and one broken tag can break everything under it, so repairing quickly matters.",
        variants: {
          independent: "A well formed document is the foundation every later layer depends on.",
          guided: "Keep your website tags matched as it grows.",
          balanced: "Small repairs now prevent bigger confusion later.",
        },
      },
    },
    mastery: {
      freshTask: "A shop page has a heading and a paragraph whose closing tags do not match their openings. Repair both so the structure is correct.",
      observable: "Each element closes with the tag that matches its opening, and the page structure is intact.",
      reflection: "In your own words, how did you find which closing tag was wrong?",
      starterFiles: {
        html: "<section>\n  <h2>Opening hours</h3>\n  <p>We open at nine.</span>\n</section>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The heading closes correctly", pattern: "<h2>Opening hours</h2>" },
        { file: "html", label: "The paragraph closes correctly", pattern: "<p>We open at nine\\.</p>" },
      ],
      workedSolution: {
        html: "<section>\n  <h2>Opening hours</h2>\n  <p>We open at nine.</p>\n</section>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a mismatched closing tag can stay because it looks nearly right.",
        symptom: "The heading or the paragraph swallows the content after it.",
        hint: "Match each closing tag to its opening tag: an h2 opens, so </h2> closes it, and a p opens, so </p> closes it.",
        file: "html",
        detect: "</h3>",
        detectableExample: "<h2>Opening hours</h3>",
      },
      {
        wrong: "another opening tag will fix a broken close.",
        symptom: "The tags nest in the wrong order and the page breaks further.",
        hint: "Repair the closing tag instead of adding an opening one. Change the wrong closing name to match the opening name.",
        file: "html",
        detect: "</span>",
        detectableExample: "<p>We open at nine.</span>",
      },
    ],
  },
  {
    lessonId: "quality-syntax",
    courseIds: ["ages-10-12"],
    concept: "Small punctuation and spelling mistakes stop code, so a repair reads the exact line and changes one thing at a time.",
    make: "The learner repairs one CSS declaration and one misspelled method name.",
    difficulty: 3,
    prerequisites: ["css-foundations-rules", "javascript-foundations-output"],
    projectStep: "The website's styles and script run cleanly again.",
    stages: {
      hook: {
        lead: "A style does not apply and a script throws an error. Neither file looks far wrong. What kind of mistake stops code without changing its meaning?",
        variants: {
          guided: "A colon and a spelling are wrong. Today you find both and repair them.",
          balanced: "Punctuation and spelling are part of the language; the wrong symbol changes everything.",
          independent: "Read the exact line and name the smallest change that would fix it.",
        },
      },
      model: {
        lead: "CSS joins a property to its value with a colon: color: #111936. JavaScript spells the method exactly: querySelector.",
        variants: {
          guided: "In CSS the colon replaces an equals sign. In JavaScript the method name must be spelled exactly.",
          balanced: "An equals sign belongs to JavaScript values, not to CSS declarations.",
          independent: "A near miss on a method name is a runtime error, not a style choice.",
        },
      },
      build: {
        lead: "Work in the CSS file first, then the JavaScript file. Repair one mistake at a time and run after each.",
        variants: {
          guided: "Fix the CSS colon first and run the page. Then fix the method spelling.",
          balanced: "Repair both, then run the page and confirm the error is gone.",
          independent: "Read each line and change only the broken piece.",
        },
      },
      check: {
        lead: "Run the page. The style should apply and the script should run without an error in the console.",
        variants: {
          guided: "Check the colour applied and no red error appears.",
          balanced: "Compare each repaired line with the correct spelling from earlier lessons.",
          independent: "Confirm the page behaviour, not just the absence of red text.",
        },
      },
      explain: {
        lead: "Now a different page: a card style uses an equals sign and a script misspells querySelector. Repair both. No example open.",
        variants: {
          guided: "Same two repairs, new words.",
          balanced: "Find the wrong symbol and the wrong spelling.",
          independent: "Work with no example open and keep the rest of each line unchanged.",
        },
      },
      transfer: {
        lead: "Most errors on your website will be small like these, so reading the exact line is a skill worth keeping.",
        variants: {
          independent: "Debugging is reading carefully, then changing one thing and observing the result.",
          guided: "Small repairs keep your website working.",
          balanced: "One change at a time tells you which change fixed the problem.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a CSS declaration written with an equals sign and a script that misspells querySelector. Repair both mistakes.",
      observable: "The style applies and the script runs with no error.",
      reflection: "In your own words, why change one thing and run again instead of repairing both at once?",
      starterFiles: {
        html: "<article class=\"card\">Fixed</article>",
        css: ".card { background = #fffdf8; }",
        javascript: "const card = document.querySelecter(\".card\");\ncard.textContent = \"Fixed\";",
      },
      editableFiles: ["css", "javascript"],
      checks: [
        { file: "css", label: "The CSS uses a colon", pattern: "background\\s*:\\s*#fffdf8" },
        { file: "javascript", label: "querySelector is spelled correctly", pattern: "document\\.querySelector\\(" },
      ],
      workedSolution: {
        html: "<article class=\"card\">Fixed</article>",
        css: ".card { background: #fffdf8; }",
        javascript: "const card = document.querySelector(\".card\");\ncard.textContent = \"Fixed\";",
      },
    },
    misconceptions: [
      {
        wrong: "a CSS property and its value are joined with an equals sign.",
        symptom: "The style does not apply because the declaration is not valid CSS.",
        hint: "CSS joins a property and its value with a colon, as in background: #fffdf8. An equals sign belongs to JavaScript.",
        file: "css",
        detect: "[a-z-]+\\s*=\\s*#",
        detectableExample: ".card { background = #fffdf8; }",
      },
      {
        wrong: "the method name is close enough to work.",
        symptom: "The script throws an error because the method does not exist.",
        hint: "Method names must be exact. Check the spelling: querySelector has a capital S in the middle and no extra letters.",
        file: "javascript",
        detect: "querySelecter",
        detectableExample: "document.querySelecter(\".card\")",
      },
    ],
  },
  {
    lessonId: "quality-access",
    courseIds: ["ages-10-12"],
    concept: "Accessible code gives every image a description, connects every label to its control and shows where keyboard focus is.",
    make: "The learner adds a description, connects a label and styles visibly focusable controls.",
    difficulty: 4,
    prerequisites: ["html-content-images", "html-content-forms"],
    projectStep: "The website becomes usable by more people, including keyboard users.",
    stages: {
      hook: {
        lead: "A picture has no words, a label does not reach its box, and a keyboard user cannot see where they are. Three small additions would fix all of this. Which three?",
        variants: {
          guided: "Some visitors cannot use the page yet. Today you add a description, connect a label and make focus visible.",
          balanced: "Accessibility is a set of small, concrete checks, not a single switch.",
          independent: "Each fix removes a specific barrier; name the barrier before the fix.",
        },
      },
      model: {
        lead: "An image gets alt, a label gets for matching the input's id, and a button gets a :focus-visible outline.",
        variants: {
          guided: "alt describes the picture, for connects the label, and the outline shows the selected control.",
          balanced: "The label's for value and the input's id must be spelled the same.",
          independent: "Focus styling is a visible outline, not just a colour change.",
        },
      },
      build: {
        lead: "Work in the HTML file for the description and the label, then the CSS file for the focus style.",
        variants: {
          guided: "Add alt first, then for, then the focus style. Run the page after each.",
          balanced: "Do the two HTML fixes, then the CSS one, and run the page between them.",
          independent: "Add all three, then test by tabbing through the controls with the keyboard.",
        },
      },
      check: {
        lead: "Run the page, then press the Tab key. The selected control should show a clear outline, and clicking the label should focus the input.",
        variants: {
          guided: "Tab through the controls. Can you see which one is selected?",
          balanced: "Click the label and check the box gets the cursor.",
          independent: "Confirm the outline is visible against the page, not just present in the code.",
        },
      },
      explain: {
        lead: "Now a different page: a sign-up area needs a described image, a connected label and a visible focus style. No example open.",
        variants: {
          guided: "Same three fixes, new page.",
          balanced: "Add the description, the connection and the focus style.",
          independent: "Work with no example open and choose the values yourself.",
        },
      },
      transfer: {
        lead: "Your website will keep these three habits, so it stays usable by keyboard and by people who cannot see the pictures.",
        variants: {
          independent: "Accessibility is easiest when it is built in from the start rather than added at the end.",
          guided: "Your website will be usable by more people.",
          balanced: "These small habits reach visitors you would otherwise lose.",
        },
      },
    },
    mastery: {
      freshTask: "A sign-up area has an image with no description, a label that is not connected and a button with no visible focus. Fix all three.",
      observable: "The image has a description, clicking the label focuses the input, and Tab shows a clear outline on the control.",
      reflection: "In your own words, why show an outline when a control is selected by keyboard?",
      starterFiles: {
        html: "<img src=\"logo.png\">\n<label>Newsletter</label><input id=\"newsletter\">\n<button>Join</button>",
        css: "/* Focus style */",
        javascript: "",
      },
      editableFiles: ["html", "css"],
      checks: [
        { file: "html", label: "The image has a description", pattern: "<img[^>]+alt=[\"'][^\"']{5,}[\"']" },
        { file: "html", label: "The label connects to the input", pattern: "<label[^>]+for=[\"']newsletter[\"']" },
        { file: "css", label: "Button focus is visible", pattern: "button:focus-visible\\s*\\{[\\s\\S]*outline\\s*:" },
      ],
      workedSolution: {
        html: "<img src=\"logo.png\" alt=\"The club logo\">\n<label for=\"newsletter\">Newsletter</label><input id=\"newsletter\">\n<button>Join</button>",
        css: "button:focus-visible {\n  outline: 3px solid #ee9d2b;\n}",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the label is close to the input, so it is already connected.",
        symptom: "Clicking the words does nothing and the field has no name for a screen reader.",
        hint: "Add for=\"newsletter\" to the label and id=\"newsletter\" to the input so they are connected by value, not just by position.",
        file: "html",
        detect: "<label(?![^>]*for=)[^>]*>",
        detectableExample: "<label>Newsletter</label>",
      },
      {
        wrong: "focus styling is only about looks.",
        symptom: "A keyboard user cannot tell which control is selected.",
        hint: "Style :focus-visible with a visible outline so the selected control is obvious when moving with the keyboard.",
        file: "css",
        detect: "^(?![\\s\\S]*:focus-visible)[\\s\\S]*\\bbutton\\b",
        detectableExample: "button {\n  color: #111936;\n}",
      },
    ],
  },
  {
    lessonId: "quality-sharing",
    courseIds: ["ages-10-12"],
    concept: "A safe project note credits the work with a nickname and the tools used, and leaves out anything that identifies the child.",
    make: "The learner writes a credit that names the tools without naming the person.",
    difficulty: 2,
    prerequisites: ["quality-access"],
    projectStep: "The website ends with an honest, safe credit.",
    stages: {
      hook: {
        lead: "A finished page should say who made it and what it was made with. But some details should never appear on a public page. What belongs and what does not?",
        variants: {
          guided: "A credit is a good idea, but it should not tell strangers who you are. Today you write a safe one.",
          balanced: "Credit the skills without identifying the person.",
          independent: "Decide what a stranger may safely read before you write a word.",
        },
      },
      model: {
        lead: "Built by SkyCoder using HTML, CSS and JavaScript. A nickname, the three tools, and no personal details.",
        variants: {
          guided: "Start with Built by, add a nickname, then name HTML, CSS and JavaScript.",
          balanced: "The note names the tools so a reader can tell what was used.",
          independent: "Leave out a full name, a school, a phone number and an address.",
        },
      },
      build: {
        lead: "Work in the HTML file, inside the footer. Write the credit with a nickname and the three technology names.",
        variants: {
          guided: "Type Built by, your nickname, then the three tool names.",
          balanced: "Write the sentence inside the footer and run the page to read it back.",
          independent: "Draft the note, then check it for anything that could identify you.",
        },
      },
      check: {
        lead: "Read your note back. Ask whether a stranger could find out who you are from it. If not, it is safe.",
        variants: {
          guided: "Check the note has a nickname and the three tools, and nothing more personal.",
          balanced: "Confirm no real name, school or address appears.",
          independent: "Treat the note as public and remove anything that would not be safe to post.",
        },
      },
      explain: {
        lead: "Now a different page: write a footer credit using a nickname and naming all three technologies. No example open.",
        variants: {
          guided: "Same note, new page. Use a nickname and the three tool names.",
          balanced: "Write the credit and name HTML, CSS and JavaScript.",
          independent: "Work with no example open and keep the note free of personal details.",
        },
      },
      transfer: {
        lead: "Your website ends with this credit, and it is the one line a stranger will read, so keep it safe.",
        variants: {
          independent: "A safe note shows your skill without exposing you, which is the whole point.",
          guided: "Your website will end with a safe note like this.",
          balanced: "Honest credit without private detail is the right habit for anything public.",
        },
      },
    },
    mastery: {
      freshTask: "Write a footer credit for a finished page that uses a nickname and names HTML, CSS and JavaScript, with nothing that identifies the child.",
      observable: "The footer shows a nickname and the three tools, and no personal detail.",
      reflection: "In your own words, which details would you never put in a public credit, and why?",
      starterFiles: {
        html: "<footer>\n  <!-- Write the credit -->\n</footer>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The note credits a nickname", pattern: "Built by\\s+[A-Za-z]" },
        { file: "html", label: "The note names HTML", pattern: "\\bHTML\\b" },
        { file: "html", label: "The note names the three tools", pattern: "<footer[\\s\\S]*HTML[\\s\\S]*CSS[\\s\\S]*JavaScript[\\s\\S]*</footer>" },
      ],
      workedSolution: {
        html: "<footer>\n  <p>Built by SkyCoder using HTML, CSS and JavaScript.</p>\n</footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a full name and a school make the credit stronger.",
        symptom: "The note identifies the child, which puts them at risk.",
        hint: "Use a nickname instead of a real name, and leave out the school, the phone number and the address.",
        file: "html",
        detect: "\\b(?:School|school|phone|Phone|Address|address)\\b",
        detectableExample: "<footer><p>Built by Annette at Riverside School.</p></footer>",
      },
      {
        wrong: "the credit only needs to say who made it.",
        symptom: "The note does not say which tools were used, so a reader cannot tell what was built.",
        hint: "Name the three technologies as well, so the note explains both who built the page and what it uses.",
        file: "html",
        detect: "^(?![\\s\\S]*\\b(?:HTML|CSS|JavaScript)\\b)[\\s\\S]*\\S",
        detectableExample: "<footer><p>Built by SkyCoder.</p></footer>",
      },
    ],
  },
];
