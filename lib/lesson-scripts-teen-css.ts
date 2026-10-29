import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 13 to 15, the CSS half of the remaining content batch.
 *
 * These four scripts are the ages 13 to 15 challenge lessons that had no
 * six-moment script: the two foundation rules, the interactive states and the
 * fluid width lesson. The wording is written for a 13 to 15 year old: a named
 * component, a real browser symptom to look at, and one decision per step, with
 * the balanced and independent registers kept for a learner who asks for them.
 *
 * Every script carries its own fresh task, its own checks and its own worked
 * solution, and at least two misconception-specific hints whose detectors are
 * proved against a sample and against the correct answer.
 */

export const teenCssScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-css-system-selectors",
    courseIds: ["ages-13-15"],
    concept: "A selector decides which elements a rule reaches, and a class selector reaches exactly the elements that carry that name.",
    make: "The learner styles a list and a named card component on their own page from two rules.",
    difficulty: 2,
    prerequisites: ["ages-13-15-structure-headings"],
    projectStep: "The project gains its first two reusable rules, so one edit changes every list row and every card at once.",
    stages: {
      hook: {
        lead: "A notice board shows three list rows and one highlighted notice. The rows need space between them and the notice needs inner space and a border. Would you write four rules, or two rules that know what to reach?",
        variants: {
          guided: "Two shapes on the page: a list of rows and one card. Today you write the smallest set of rules that reaches both.",
          balanced: "A rule per element means the next spacing change has to be made in four places. A selector is the decision about which elements one rule reaches.",
          independent: "Before typing, decide the reach of each rule. A type selector reaches every element of that kind, a class selector reaches only the elements wearing the name.",
        },
      },
      model: {
        lead: "li { margin-bottom: 0.5rem; } reaches every list item. .notice { padding: 1rem; border: 2px solid #111936; } reaches only the element whose class is notice. The dot means the rule looks for a name rather than an element.",
        variants: {
          guided: "Write li and braces for the rows. Then write .notice and braces for the card, with padding and border inside.",
          balanced: "Read the dot as a filter. Without it, the rule matches the element itself and every article on the page changes.",
          independent: "Class names are matched literally, so the spelling in the markup and the stylesheet has to be identical.",
        },
      },
      build: {
        lead: "Work in the CSS file. Write the list rule first and run the preview, then the card rule and run it again. Change nothing in the HTML.",
        variants: {
          guided: "Add the li rule and run the page. Then add the .notice rule and run it again so you can see which rule caused which change.",
          balanced: "Write both rules, then run the preview once and check the rows and the card separately.",
          independent: "Decide the two selectors before you type, then confirm no other element on the page moved.",
        },
      },
      check: {
        lead: "Look at the page. All three rows should be separated by the same amount, and the notice should be the only element with a border. If every article gained the card treatment, the selector is not matching the class.",
        variants: {
          guided: "Count the elements with a border. It should be one.",
          balanced: "Check the unnamed elements directly and prove the card rule never reached them.",
          independent: "Read your two selectors back and state which elements each one must reach, then compare that with the page.",
        },
      },
      explain: {
        lead: "Now a different page: a debate club page with a list of meeting dates and a named announcement card. No example open. Style the whole list and the card only.",
        variants: {
          guided: "The new page has the same two shapes. Give the list rule and then the card rule, using the class name the HTML already carries.",
          balanced: "Same pattern, new content. Decide which rule should reach several elements and which should reach one.",
          independent: "Work with no example open, choose the selectors yourself and keep one rule per idea.",
        },
      },
      transfer: {
        lead: "Your own project will use a small set of these names, one per idea: what is featured, what is finished, what is new.",
        variants: {
          independent: "Name a class after meaning rather than appearance, because the appearance will change and the meaning will not.",
          guided: "Your project will use a few of these names, and every card you add later wears one.",
          balanced: "A short list of well named classes is easier to keep consistent than a rule per element.",
        },
      },
    },
    mastery: {
      freshTask: "A community notice board shows a list of three items and one highlighted notice. Give every list row space below it, and give the notice card inner space and a border, using the class the HTML already carries.",
      observable: "All three rows are separated by the same amount, and the notice is the only element with a border.",
      reflection: "In your own words, why did the card rule reach one element while the list rule reached three?",
      starterFiles: {
        html: "<h1>Notice board</h1>\n<ul class=\"board\">\n  <li>Bike for sale</li>\n  <li>Guitar lessons</li>\n  <li>Lost cat</li>\n</ul>\n<article class=\"notice\">Meeting moved to Friday</article>",
        css: "/* Style the rows and the notice card */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The list rows have space below them", pattern: "li\\s*\\{[\\s\\S]*margin(?:-bottom|-block-end)?\\s*:" },
        { file: "css", label: "The notice card has inner space and a border", pattern: "\\.[a-z-]+\\s*\\{[\\s\\S]*padding\\s*:[\\s\\S]*border\\s*:" },
      ],
      workedSolution: {
        html: "<h1>Notice board</h1>\n<ul class=\"board\">\n  <li>Bike for sale</li>\n  <li>Guitar lessons</li>\n  <li>Lost cat</li>\n</ul>\n<article class=\"notice\">Meeting moved to Friday</article>",
        css: "li {\n  margin-bottom: 0.5rem;\n}\n.notice {\n  padding: 1rem;\n  border: 2px solid #111936;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "every list row needs its own rule so each one stays easy to change.",
        symptom: "The same spacing is written three times and the rows drift apart as soon as one copy is edited.",
        hint: "One rule already reaches every list item. Keep the li rule and delete the copies, so the next spacing change is a single edit.",
        file: "css",
        detect: "li\\s*\\{[\\s\\S]*li\\s*\\{",
        detectableExample: "li {\n  margin-bottom: 0.5rem;\n}\nli {\n  padding-left: 1rem;\n}",
      },
      {
        wrong: "the selector should name the element rather than use the class the HTML carries.",
        symptom: "Every article on the page picked up the card treatment, not only the notice.",
        hint: "Match the name the HTML already uses. Write .notice so the rule reaches the one element wearing that class, and leave the plain element selector out.",
        file: "css",
        detect: "(?:^|\\n)\\s*(?:ul|article|section)\\s*\\{",
        detectableExample: "article {\n  padding: 1rem;\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-css-system-box-model",
    courseIds: ["ages-13-15"],
    concept: "Every element is a box made of content, padding, border and margin, and border-box sizing keeps a declared width honest.",
    make: "The learner builds one ticket card whose declared size includes its padding and border.",
    difficulty: 3,
    prerequisites: ["ages-13-15-css-system-selectors"],
    projectStep: "The project's cards stop growing when their padding changes, because the declared size now includes it.",
    stages: {
      hook: {
        lead: "One card is set to 20rem wide with 1rem of padding, and it measures wider than 20rem in the preview. The numbers in the stylesheet look right. Which box is the browser measuring?",
        variants: {
          guided: "The card is wider on screen than the width you typed. Today you make the declared width mean the whole card.",
          balanced: "Padding and border are added on top of a declared width until you change how the box is measured.",
          independent: "Name the property that changes the measurement, and say which two spaces are inside the border rather than outside it.",
        },
      },
      model: {
        lead: "content, then padding, then border, then margin. * { box-sizing: border-box; } makes a declared width cover content, padding and border together.",
        variants: {
          guided: "Read the box outwards: the text, the space around it, the line around that, then the gap to the next element.",
          balanced: "border-box is the measurement rule. Without it, padding and border are added to the width you declared.",
          independent: "Applying border-box once with the universal selector removes the whole class of sizing surprises for every component you build later.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the sizing rule first, then give the card padding, a border and space below it. Run the preview after each change.",
        variants: {
          guided: "Start with padding so the text stops touching the border. Run the page. Then add the border and the space below.",
          balanced: "Add one kind of space at a time and watch where it appears in the preview.",
          independent: "Decide the order of the four layers before you type, then confirm each one appears where you predicted.",
        },
      },
      check: {
        lead: "Change the padding value and run the page. With border-box in place the card's overall width stays as declared; without it the card grows. Margin is the only space that should sit outside the border.",
        variants: {
          guided: "Look at the gap between the card and the line below it, and the gap between the text and the border.",
          balanced: "Check both spaces separately: one is inside the border, one is outside it.",
          independent: "Predict the measurement before the browser computes it, then test that prediction with a padding change.",
        },
      },
      explain: {
        lead: "Now a different page: a ticket card for a rowing club. No example open. Make the declared size include padding and border, then add inner space, a border and space below.",
        variants: {
          guided: "The new page has one card and one line of text under it. Put the four layers on the card.",
          balanced: "Same box, new content. Decide which space belongs inside and which belongs outside before you type.",
          independent: "Work with no example open and choose where the sizing rule belongs so later components inherit it.",
        },
      },
      transfer: {
        lead: "The project's cards, panels and forms all reuse this measurement, which is why the sizing rule is written once for the whole page.",
        variants: {
          independent: "A component library only stays predictable if every box agrees on how widths are measured.",
          guided: "Every card you build later is measured the same way, so you set it once.",
          balanced: "One sizing rule at the top of the stylesheet removes the arithmetic from every component below it.",
        },
      },
    },
    mastery: {
      freshTask: "A rowing club page shows one ticket card and a line of text under it. Make the card's declared size include its padding and border, then give the card inner space, a border and space below it.",
      observable: "Changing the card padding does not change the card's overall width, and there is a visible gap between the card and the line below it.",
      reflection: "In your own words, which space belongs inside the border and which belongs outside it?",
      starterFiles: {
        html: "<h1>Rowing club tickets</h1>\n<article class=\"ticket\">Row 4, seat 12</article>\n<p>Gates open at 17:30.</p>",
        css: "/* Build the ticket card */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "Declared sizes include padding and border", pattern: "box-sizing\\s*:\\s*border-box" },
        { file: "css", label: "The card has inner space", pattern: "\\.ticket\\s*\\{[\\s\\S]*padding\\s*:" },
        { file: "css", label: "The card has space below it", pattern: "\\.ticket\\s*\\{[\\s\\S]*margin" },
      ],
      workedSolution: {
        html: "<h1>Rowing club tickets</h1>\n<article class=\"ticket\">Row 4, seat 12</article>\n<p>Gates open at 17:30.</p>",
        css: "* {\n  box-sizing: border-box;\n}\n.ticket {\n  padding: 1rem;\n  border: 2px solid #111936;\n  margin-bottom: 1.5rem;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "padding and margin are two names for the same space.",
        symptom: "The card's text sits against the border, and the next line still touches the card.",
        hint: "Padding is the space inside the border and margin is the space outside it. Add padding so the text stops touching the border, then add margin for the gap below the card.",
        file: "css",
        detect: "^(?=[\\s\\S]*\\.ticket\\s*\\{)(?![\\s\\S]*\\.ticket\\s*\\{[^}]*padding)",
        detectableExample: ".ticket {\n  border: 2px solid #111936;\n}",
      },
      {
        wrong: "a fixed width plus padding keeps the card at exactly that width.",
        symptom: "The card is wider than the number in the stylesheet, and the overflow grows with the padding.",
        hint: "The browser adds padding and border to a declared width unless the box is measured differently. Either set box-sizing: border-box or stop fixing the width at all.",
        file: "css",
        detect: "width\\s*:[^;]*(?:px|rem)[\\s\\S]*padding\\s*:",
        detectableExample: ".ticket {\n  width: 20rem;\n  padding: 1rem;\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-css-system-states",
    courseIds: ["ages-13-15"],
    concept: "Interactive states tell a visitor where they are: hover answers a pointer, and a visible focus ring answers the keyboard.",
    make: "The learner gives one link both a hover treatment and a keyboard focus ring that cannot be missed.",
    difficulty: 3,
    prerequisites: ["ages-13-15-css-system-selectors"],
    projectStep: "The project's controls stop being invisible to keyboard users, because every link and button now shows where focus is.",
    stages: {
      hook: {
        lead: "Tab through a page and the outline is gone, because the stylesheet removed it. A keyboard user now has no idea where they are. What is the smallest change that keeps the design and brings the signal back?",
        variants: {
          guided: "Today the page shows where the keyboard is. Nothing appears for a mouse hover unless you add it.",
          balanced: "A pointer and a keyboard are two different inputs, so one state cannot stand in for the other.",
          independent: "Separate the pointer state from the keyboard state, and decide which one needs the stronger signal.",
        },
      },
      model: {
        lead: "a:hover { background: #37134d; color: #f7f3ea; } answers the pointer. a:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; } answers the keyboard, with a ring that is offset from the text so it stays readable.",
        variants: {
          guided: "Two rules, two jobs. The hover rule changes colour, the focus rule draws a thick line around the link.",
          balanced: "focus-visible is the state a keyboard user produces. outline draws the ring and outline-offset moves it away from the text.",
          independent: "The outline needs enough contrast and enough offset to be unmistakable, on any background the page uses.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the hover rule and run the preview, then add the focus rule and press Tab to see it.",
        variants: {
          guided: "Type the hover rule first. Then type the focus rule with outline and outline-offset, and press Tab in the preview.",
          balanced: "Write both rules, then test each one with its own input: pointer for hover, Tab for focus.",
          independent: "Decide the ring thickness and offset before you type, then test the result against the page background.",
        },
      },
      check: {
        lead: "Press Tab until the link is focused. The ring should be obvious and should not sit on top of the text. Then move the pointer over it and check the hover colour appears.",
        variants: {
          guided: "Two checks: Tab shows a ring, and the pointer changes the link colour.",
          balanced: "Test the two states one after the other and describe what each input produced.",
          independent: "Confirm the ring is visible at the page's smallest width, where the link sits near an edge.",
        },
      },
      explain: {
        lead: "Now a different page: a magazine page with a single back-to-top link. No example open. Give it a hover treatment and a keyboard ring that is offset from the text.",
        variants: {
          guided: "The new page has one link. Write the same two rules for it.",
          balanced: "Same two states, new selector. Decide which one a keyboard user will see.",
          independent: "Work with no example open and keep the ring readable against the new page's background.",
        },
      },
      transfer: {
        lead: "Every control the project gains later reuses these two rules, so the keyboard signal stays consistent across the whole site.",
        variants: {
          independent: "A shared focus rule is what makes a site navigable by keyboard without a page-by-page audit.",
          guided: "Your project's links and buttons will all use these two rules.",
          balanced: "Write the rules once for the group of controls rather than per control.",
        },
      },
    },
    mastery: {
      freshTask: "A magazine page has one back-to-top link. Give the link a hover treatment, and give it a keyboard focus ring that is clearly visible and offset from the text.",
      observable: "Hovering changes the link's colour, and pressing Tab shows a thick outline that does not sit on top of the words.",
      reflection: "In your own words, why is a hover rule not enough for a visitor using a keyboard?",
      starterFiles: {
        html: "<main id=\"top\"><p>Page one of the story.</p></main>\n<p><a href=\"#top\">Back to top</a></p>",
        css: "a {\n  color: #111936;\n}\n/* Add the interaction states */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The link reacts to a pointer", pattern: "a:hover\\s*\\{" },
        { file: "css", label: "Keyboard focus draws an outline", pattern: "a:focus-visible\\s*\\{[\\s\\S]*outline\\s*:" },
        { file: "css", label: "The outline is offset from the text", pattern: "outline-offset\\s*:" },
      ],
      workedSolution: {
        html: "<main id=\"top\"><p>Page one of the story.</p></main>\n<p><a href=\"#top\">Back to top</a></p>",
        css: "a {\n  color: #111936;\n}\na:hover {\n  background: #37134d;\n  color: #f7f3ea;\n}\na:focus-visible {\n  outline: 3px solid #ee9d2b;\n  outline-offset: 3px;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "hover and focus are the same state, so one rule covers both inputs.",
        symptom: "The link reacts to a pointer, and a keyboard user sees nothing at all.",
        hint: "A keyboard does not hover. Keep a separate rule for :focus-visible so the same link answers both inputs.",
        file: "css",
        detect: ":focus(?!-visible)[^{]*\\{",
        detectableExample: "a:focus {\n  outline: none;\n}",
      },
      {
        wrong: "the browser already draws a focus ring, so the stylesheet should turn it off.",
        symptom: "Nothing marks the focused link, so a keyboard user cannot tell where they are.",
        hint: "Removing the outline removes the only signal a keyboard user has. Replace outline: none with a thick outline and an outline-offset.",
        file: "css",
        detect: "outline\\s*:\\s*(?:none|0)",
        detectableExample: "a:focus-visible {\n  outline: none;\n}",
      },
    ],
  },
  {
    lessonId: "ages-13-15-responsive-viewport",
    courseIds: ["ages-13-15"],
    concept: "A layout that starts from the smallest screen uses a flexible width with a sensible maximum, and images that never overflow it.",
    make: "The learner makes a photo gallery fit a phone screen without sideways scrolling.",
    difficulty: 3,
    prerequisites: ["ages-13-15-css-system-box-model"],
    projectStep: "The project's content column becomes fluid, so the whole site fits a phone before any media query is added.",
    stages: {
      hook: {
        lead: "A gallery page scrolls sideways on a phone and one photograph sticks out past the edge. The desktop preview looks perfect. Which two rules would stop both problems?",
        variants: {
          guided: "On a phone the page scrolls sideways. Today you make the gallery and its images fit the space that is there.",
          balanced: "A layout that only works at one width is not finished. The flexible width and the image rule solve it together.",
          independent: "Separate the container problem from the media problem, and say which rule fixes each one.",
        },
      },
      model: {
        lead: ".gallery { width: 100%; max-width: 68rem; margin-inline: auto; } keeps the column fluid and bounded. img { max-width: 100%; height: auto; } stops any photograph from being wider than its container.",
        variants: {
          guided: "The width is a share of the space and the max-width is the ceiling. The image rule repeats that idea for every picture.",
          balanced: "Read the two rules as a pair: the container adapts, and everything inside it is allowed to shrink.",
          independent: "A percentage width alone still overflows on a very large screen, so pair it with a maximum. The min() function expresses both in one declaration.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the gallery width first and run the preview narrow, then add the image rule and run it again.",
        variants: {
          guided: "Type the gallery rule, then narrow the preview until the page is phone sized and watch for sideways scrolling.",
          balanced: "Write both rules, then test at 320 pixels and at a wide window.",
          independent: "Decide the maximum before you type, then verify with one narrow and one wide preview.",
        },
      },
      check: {
        lead: "Narrow the preview to its smallest width. The gallery should fit with no sideways scrolling, and no image should cross the gallery edge.",
        variants: {
          guided: "Check two things: no sideways scrolling, and no image wider than the box it sits in.",
          balanced: "Compare the narrow and wide previews and name what changed and what stayed the same.",
          independent: "Test the widest image you have, because that is the one that overflows first.",
        },
      },
      explain: {
        lead: "Now a different page: a market photo gallery. No example open. Give the gallery a fluid width with a maximum, and stop its images from overflowing.",
        variants: {
          guided: "The new page has the same two images and the same problem. Write the two rules for it.",
          balanced: "Same pattern, new content. Decide the ceiling before you write the width.",
          independent: "Work with no example open and choose between max-width and the min() function yourself.",
        },
      },
      transfer: {
        lead: "The project's whole content column uses this fluid rule, so every later layout change starts from a page that already fits.",
        variants: {
          independent: "Mobile first is not a style, it is the order of work: make the narrow case correct before adding columns.",
          guided: "Your project will use one fluid column for every page.",
          balanced: "The ceiling keeps long lines readable while the percentage keeps the column inside the screen.",
        },
      },
    },
    mastery: {
      freshTask: "A photo gallery page is wider than a phone screen. Give the gallery a fluid width with a sensible maximum, and stop its images from overflowing.",
      observable: "At the smallest preview width the gallery fits with no sideways scrolling, and no image crosses the gallery edge.",
      reflection: "In your own words, what does the percentage width do that the maximum width cannot?",
      starterFiles: {
        html: "<main class=\"gallery\">\n  <img src=\"market.jpg\" alt=\"Market stalls at sunrise\">\n  <img src=\"bridge.jpg\" alt=\"Footbridge over the river\">\n  <p>Photos from the class trip.</p>\n</main>",
        css: "/* Make the gallery fluid */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The gallery width follows the space available", pattern: "\\.gallery\\s*\\{[\\s\\S]*width\\s*:[^;]*%" },
        { file: "css", label: "The gallery has a maximum width", pattern: "\\.gallery\\s*\\{[\\s\\S]*max-width\\s*:" },
        { file: "css", label: "Images cannot overflow the gallery", pattern: "img\\s*\\{[\\s\\S]*max-width\\s*:\\s*100%" },
      ],
      workedSolution: {
        html: "<main class=\"gallery\">\n  <img src=\"market.jpg\" alt=\"Market stalls at sunrise\">\n  <img src=\"bridge.jpg\" alt=\"Footbridge over the river\">\n  <p>Photos from the class trip.</p>\n</main>",
        css: ".gallery {\n  width: 100%;\n  max-width: 68rem;\n  margin-inline: auto;\n}\nimg {\n  max-width: 100%;\n  height: auto;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a fixed width in pixels keeps the layout predictable on every screen.",
        symptom: "Everything looks right on a laptop and the page scrolls sideways on a phone.",
        hint: "A fixed pixel width is wider than some screens. Use a percentage width with a max-width, or the min() function, so the gallery shrinks before it overflows.",
        file: "css",
        detect: "\\.gallery\\s*\\{[\\s\\S]*width\\s*:\\s*\\d{3,}px",
        detectableExample: ".gallery {\n  width: 960px;\n}",
      },
      {
        wrong: "the browser scales images by itself, so they never overflow.",
        symptom: "One photograph is wider than the gallery and the whole page gains a sideways scroll.",
        hint: "An image is drawn at its natural size until you stop it. Add img { max-width: 100%; height: auto; } so every picture shrinks with its container.",
        file: "css",
        detect: "^(?![\\s\\S]*img\\s*\\{[\\s\\S]*max-width)",
        detectableExample: "/* Make the gallery fluid */\n.gallery {\n  width: 100%;\n}",
      },
    ],
  },
];
