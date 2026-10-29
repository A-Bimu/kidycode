import type { LessonScript } from "@/lib/lesson-scripts";
import { guidedHtmlScripts } from "@/lib/lesson-scripts-guided-html";
import { guidedCssScripts } from "@/lib/lesson-scripts-guided-css";
import { guidedJavascriptScripts } from "@/lib/lesson-scripts-guided-javascript";
import { guidedQualityScripts } from "@/lib/lesson-scripts-guided-quality";

/*
 * The guided batch of the V3 lesson journey: the ages 10 to 12 pathway.
 *
 * It sits beside lib/lesson-scripts.ts (which owns the LessonScript model) and
 * lib/lesson-scripts-difficult-concepts.ts (the first widening batch), and is
 * spread into the same exported list so every contract check, the presenter and
 * the course gate see one set of scripts.
 *
 * These four lessons are the ones a ten to twelve year old meets first after the
 * samples: nesting, reusing a class, choosing with if and else, and responding to
 * a click. Each script carries guided wording written for that age: short
 * sentences, one change at a time, the learner's own page as the example. The
 * balanced and independent wording is kept for a learner who asks for it, so the
 * same lesson can carry an older sibling without a second copy of the content.
 *
 * Every script also carries at least two misconception-specific hints. A hint is
 * shown only when the learner's own file shows the wrong turn, because the
 * detector is matched against what they wrote rather than offered as one more
 * wall of general advice.
 */

const guidedExistingScripts: LessonScript[] = [
  {
    lessonId: "html-foundations-nesting",
    courseIds: ["ages-10-12"],
    concept: "A section is a container: the elements that belong together go inside it, and the closing tag ends the group.",
    make: "The learner groups a heading and its paragraph into one section so the page has real parts.",
    difficulty: 1,
    prerequisites: [],
    projectStep: "The page stops being a flat list of lines and gains its first real section, which every later layout rule can target.",
    stages: {
      hook: {
        lead: "Open your page and read it. A heading and a paragraph sit on their own with nothing holding them together. What would let you move both of them as one piece later?",
        variants: {
          guided: "Two lines on your page belong together. Today you put them inside one box called a section.",
          balanced: "A page is easier to design when related lines live in one container instead of floating apart.",
          independent: "Grouping is structure, not decoration. The container is what a layout rule, a style or a script can move as one.",
        },
      },
      model: {
        lead: "A section opens with <section> and closes with </section>. Everything typed between those two tags is inside the group.",
        variants: {
          guided: "Write <section> above the heading. Write </section> after the last paragraph. The heading and paragraph now live inside.",
          balanced: "Read the tags as a pair: an opening tag starts the box and a matching closing tag ends it, with the content in the middle.",
          independent: "Note that the closing tag is not a copy of the opening tag: it carries a slash and no attributes, and it must come after the last child.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the opening section tag before the heading, then the closing tag after the last paragraph. Run the preview after each change.",
        variants: {
          guided: "Do it in two steps. Add <section> first and run the page. Then add </section> and run it again.",
          balanced: "Add the opening tag first and check the preview looks unchanged, then add the closing tag and check the group took hold.",
          independent: "Add both tags in one edit, then run the preview and confirm nothing else on the page moved.",
        },
      },
      check: {
        lead: "Look at the preview. If the heading and paragraph moved together when you changed the section, they are inside it.",
        variants: {
          guided: "Count the tags: one opening tag and one closing tag, with the heading and paragraph between them.",
          balanced: "Look at the preview and ask one question: do the two lines move together now?",
          independent: "Inspect the section and confirm both children sit inside it, with no stray copy outside.",
        },
      },
      explain: {
        lead: "Now do the same for a different page: a recipe with a title and a method paragraph that must sit in one section. No example open.",
        variants: {
          guided: "The new page has two lines that belong together, just like before. Put a section around them.",
          balanced: "Same idea, different words. Decide which two lines belong together before you type a tag.",
          independent: "Work with no example open and choose the container yourself.",
        },
      },
      transfer: {
        lead: "This is the first real section of your own website. Later lessons add more sections beside it and style them by name.",
        variants: {
          independent: "Keep every section closed properly. A missing closing tag swallows the rest of the page, and the browser will not warn you.",
          guided: "Your website grows one section at a time. Keep each one closed.",
          balanced: "Every later section follows the same rule: open, content, close.",
        },
      },
    },
    mastery: {
      freshTask: "A recipe page shows a title and a method paragraph. Put both of them inside one section so they can be moved together later.",
      observable: "The heading and the paragraph both sit between one opening and one closing section tag.",
      reflection: "In your own words, what does the section do that the heading and paragraph could not do on their own?",
      starterFiles: {
        html: "<main>\n  <h2>Simple pancakes</h2>\n  <p>Mix the batter, then cook it.</p>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "A section opens the group", pattern: "<section[^>]*>[\\s\\S]*<h2[^>]*>" },
        { file: "html", label: "The paragraph is inside the same section", pattern: "<section[^>]*>[\\s\\S]*</p>[\\s\\S]*</section>" },
      ],
      workedSolution: {
        html: "<main>\n  <section>\n    <h2>Simple pancakes</h2>\n    <p>Mix the batter, then cook it.</p>\n  </section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a section is just a line you type above the heading.",
        symptom: "The page shows an empty section and the heading is still outside it.",
        hint: "An opening and a closing tag make the container. Move the closing tag below the paragraph so the heading and the paragraph sit between the two tags.",
        file: "html",
        detect: "<section[^>]*>\\s*</section>",
        detectableExample: "<section></section>\n<h2>Simple pancakes</h2>",
      },
      {
        wrong: "the closing tag can go straight after the heading.",
        symptom: "Only the heading ended up inside the section, and the paragraph is still on its own.",
        hint: "Close the section after the last line that belongs in it. Cut the closing tag and paste it below the paragraph instead.",
        file: "html",
        detect: "</section>[\\s\\S]*<p[^>]*>",
        detectableExample: "<section>\n  <h2>Simple pancakes</h2>\n</section>\n<p>Mix the batter.</p>",
      },
    ],
  },
  {
    lessonId: "css-foundations-classes",
    courseIds: ["ages-10-12"],
    concept: "A class is a name a few elements share, and one rule that selects that name styles every one of them at once.",
    make: "The learner marks one item on their page with a class and styles only that item from a single rule.",
    difficulty: 2,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The project can now style one part of a list differently without repeating the rule or touching the other items.",
    stages: {
      hook: {
        lead: "Three items sit in a list. You want only the middle one to look different. Would you write three rules, or one rule that knows which item to pick?",
        variants: {
          guided: "You want one item to stand out. A class lets you name that item and style it on its own.",
          balanced: "Writing a rule per item means the next change has to be made in three places. A name that only some elements wear solves that.",
          independent: "A class is a shared label, not an identity. Decide what the label means before you decide which elements wear it.",
        },
      },
      model: {
        lead: "The HTML gets class=\"highlight\" on the one item. The CSS gets .highlight followed by braces. The dot means the rule looks for a name, not an element.",
        variants: {
          guided: "Put class=\"highlight\" inside the tag of the item you want. Then write .highlight { } in the CSS and add one declaration inside.",
          balanced: "Read the dot as a filter: items without the name are left alone.",
          independent: "The class name is case sensitive in your markup and matched literally in the stylesheet, so keep the spelling identical in both files.",
        },
      },
      build: {
        lead: "Work in the HTML first: add the class to one item. Then work in the CSS and write the rule. Run the preview after each file.",
        variants: {
          guided: "Add the class to the item first and run the page. Nothing changes yet, and that is expected. Then write the CSS rule.",
          balanced: "Add the class, then write the rule, then run the preview once and check only the named item changed.",
          independent: "Decide the class name before you touch either file, then keep the spelling identical in both.",
        },
      },
      check: {
        lead: "Look at the list. Only the item you named should have changed. If all of them changed, the rule is matching the element rather than the class.",
        variants: {
          guided: "Count the items that changed. It should be one.",
          balanced: "Only the named item should change. If the others changed, the selector is not matching the class.",
          independent: "Check the unnamed items directly and prove the rule never reached them.",
        },
      },
      explain: {
        lead: "Now a different page: a tag list where only the CSS tag wears the highlight class and only that tag changes. No example open.",
        variants: {
          guided: "The new page already has three items. Give one of them the class and style that class.",
          balanced: "The new page needs the same two steps: a class in the markup and a rule for it.",
          independent: "Reuse the pattern you already have instead of inventing a new name for every page.",
        },
      },
      transfer: {
        lead: "Your own website will use a few of these names, one per idea: what is featured, what is finished, what is new.",
        variants: {
          independent: "Name classes after meaning rather than appearance, because the appearance will change and the meaning will not.",
          guided: "Your website will use a few of these names.",
          balanced: "A small set of well named classes is easier to keep consistent than a rule per item.",
        },
      },
    },
    mastery: {
      freshTask: "A page shows a list of three tags. Give the CSS tag a highlight class and write one rule that changes only that tag. The other two must look untouched.",
      observable: "Only the middle tag changes appearance, and the rule is written once.",
      reflection: "In your own words, why does one class rule style a single item instead of all of them?",
      starterFiles: {
        html: "<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>",
        css: "/* Highlight one tag */\n",
        javascript: "",
      },
      editableFiles: ["css", "html"],
      checks: [
        { file: "html", label: "One tag wears the class", pattern: "class=[\"'][^\"']*highlight" },
        { file: "css", label: "The stylesheet names that class", pattern: "\\.highlight\\s*\\{" },
      ],
      workedSolution: {
        html: "<ul>\n  <li>HTML</li>\n  <li class=\"highlight\">CSS</li>\n  <li>JavaScript</li>\n</ul>",
        css: ".highlight {\n  background: #f0e6c8;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "every item needs its own copy of the rule.",
        symptom: "The same declaration is written several times and the items drift apart when one copy is edited.",
        hint: "Write the rule once for the class and let the named item pick it up. Delete the copies and keep the single rule.",
        file: "css",
        detect: "li\\s*\\{[\\s\\S]*li\\s*\\{",
        detectableExample: "li {\n  background: #f0e6c8;\n}\nli {\n  border: 1px solid;\n}",
      },
      {
        wrong: "the dot in the selector is a typo.",
        symptom: "Every list item changed, not just the one you named.",
        hint: "The dot tells the browser to look for a class name. Without it the rule matches the element itself, so add the dot and keep the name.",
        file: "css",
        detect: "(?:^|\\n)\\s*(?:ul|li)\\s*\\{",
        detectableExample: "ul {\n  background: #f0e6c8;\n}",
      },
    ],
  },
  {
    lessonId: "javascript-logic-conditions",
    courseIds: ["ages-10-12"],
    concept: "A condition asks one question, and the code runs the true branch or the else branch, never both.",
    make: "The learner makes the page decide between two messages from a value the script already holds.",
    difficulty: 2,
    prerequisites: ["javascript-foundations-variables"],
    projectStep: "The project stops showing the same text to everyone and starts choosing what to show.",
    stages: {
      hook: {
        lead: "One value sits at the top of the file. The page must say one thing when it is high and another when it is low. Two lines cannot both be the answer, so how does the page choose?",
        variants: {
          guided: "Today the page chooses between two messages. One value decides which one is shown.",
          balanced: "A choice needs a question and two answers, and only one answer may run.",
          independent: "Design the decision before you type it: what is the question, what is the boundary, and what happens on each side of it?",
        },
      },
      model: {
        lead: "if (score >= 5) { message = \"Ready\"; } else { message = \"Keep going\"; }. The value after the word else runs only when the question is false.",
        variants: {
          guided: "Read it as a sentence: if the score is five or more, set Ready, otherwise set Keep going.",
          balanced: "The braces hold one instruction each. The else belongs to the if above it, with no question of its own.",
          independent: "The comparison operator decides the boundary. Check both sides of it before running, because an off by one here shows the wrong message to everyone.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the if line first, set the first message inside the braces, then add else and set the second message.",
        variants: {
          guided: "Add the if line and its message. Run the page. Then add else and its message.",
          balanced: "Write the question, then both branches, then run once and check which message appears.",
          independent: "Write both branches before running, then test the value either side of the boundary.",
        },
      },
      check: {
        lead: "Change the value at the top and run again. The page must swap to the other message. If both lines ran, the braces are in the wrong place.",
        variants: {
          guided: "Try the value just above and just below the number in your question, and watch the message change.",
          balanced: "Move the value across the boundary and confirm the message swaps.",
          independent: "Check the boundary value itself as well as both sides of it.",
        },
      },
      explain: {
        lead: "Now a different page: a ticket price that is full price for sixteen and over and half price below. No example open.",
        variants: {
          guided: "The new page has one number and two prices. Write the question, then the two answers.",
          balanced: "Same shape, new data. Decide the question before you write either answer.",
          independent: "Work with no example open and choose the comparison operator yourself.",
        },
      },
      transfer: {
        lead: "The project will keep using this shape for what to show, what to hide, and what to warn about.",
        variants: {
          independent: "Keep the two branches short. A long branch is usually two decisions pretending to be one.",
          guided: "Your page will keep choosing what to show.",
          balanced: "This shape comes back every time the page has to decide something.",
        },
      },
    },
    mastery: {
      freshTask: "A cinema page shows a price. Set the price to Full price when the age is 16 or higher, and to Half price otherwise, then show the chosen price on the page.",
      observable: "Changing the age in the file swaps the page between the two prices, and only one of them shows at a time.",
      reflection: "In your own words, what does the else branch do, and when does it run?",
      starterFiles: {
        html: "<p id=\"price\"></p>",
        css: "",
        javascript: "const age = 15;\nlet price = \"\";\n// Choose the price\n// Show the price\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The question compares the age", pattern: "if\\s*\\(\\s*age\\s*>=\\s*16" },
        { file: "javascript", label: "The older price is the true branch", pattern: "if\\s*\\(\\s*age\\s*>=\\s*16[\\s\\S]*price\\s*=\\s*[\"']Full price[\"']" },
        { file: "javascript", label: "The younger price is in the else branch", pattern: "else\\s*\\{[\\s\\S]*price\\s*=\\s*[\"']Half price[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"price\"></p>",
        css: "",
        javascript: "const age = 15;\nlet price = \"\";\nif (age >= 16) {\n  price = \"Full price\";\n} else {\n  price = \"Half price\";\n}\ndocument.querySelector(\"#price\").textContent = price;\n",
      },
    },
    misconceptions: [
      {
        wrong: "the second answer is written for everyone, so the condition is optional.",
        symptom: "The page shows the same message whatever the value is, because the lines simply run one after another.",
        hint: "Put the first answer inside the if braces and the second inside the else braces. Only the branch that matches the question is allowed to run.",
        file: "javascript",
        detect: "^(?![\\s\\S]*\\bif\\s*\\()[\\s\\S]*price\\s*=",
        detectableExample: "price = \"Full price\";\nprice = \"Half price\";",
      },
      {
        wrong: "the wrong answer belongs in the first branch.",
        symptom: "An adult is charged half price and a child is charged full price.",
        hint: "Read your question out loud and check which branch it is true for. Put the answer for the true case first and the other one in else.",
        file: "javascript",
        detect: "if\\s*\\(\\s*age\\s*>=\\s*16\\s*\\)\\s*\\{\\s*price\\s*=\\s*[\"']Half price[\"']",
        detectableExample: "if (age >= 16) {\n  price = \"Half price\";\n}",
      },
    ],
  },
  {
    lessonId: "dom-interaction-events",
    courseIds: ["ages-10-12"],
    concept: "An event listener names the moment to wait for and the function to run when it happens, so the page reacts instead of running once.",
    make: "The learner makes a button change a line of text when it is clicked, rather than on load.",
    difficulty: 2,
    prerequisites: ["dom-interaction-select"],
    projectStep: "The project gains its first control: a button on the page that changes what the visitor sees.",
    stages: {
      hook: {
        lead: "A line of text is already on the page. You want it to change only when the visitor clicks, not as soon as the page opens. What has to wait?",
        variants: {
          guided: "Today the page waits for a click. Nothing happens until the visitor presses the button.",
          balanced: "Some code runs on load and some runs on an event. The listener is how you put code in the second group.",
          independent: "Separate the setup from the reaction. The listener call is setup; the function you hand it is the reaction.",
        },
      },
      model: {
        lead: "button.addEventListener(\"click\", function () { message.textContent = \"Details opened\"; });. The first part names the event, the second part is the job to do when it happens.",
        variants: {
          guided: "Two things go into the call: the word click in quotes, and the function that changes the text.",
          balanced: "The event name is a string. Misspell it and the function is stored but never called.",
          independent: "The listener registers once, at load. The function runs every time the event fires, so keep it short and repeatable.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Put the two element lookups at the top, then add the listener below them with the function inside it.",
        variants: {
          guided: "Type the button, a dot, addEventListener, then click in quotes, then the function. Change the text inside the function.",
          balanced: "Write the listener, then the function body, then run the page and press the button.",
          independent: "Decide what the handler must change before you type it, then run and press the button once.",
        },
      },
      check: {
        lead: "Run the page and press the button. If the text changed only after you clicked, the listener works. If it changed as the page opened, the line is outside the function.",
        variants: {
          guided: "Open the preview first and check the text has not changed yet. Then click and check it has.",
          balanced: "Watch the two moments separately: before the click and after it.",
          independent: "Prove the listener is registered by pressing the button twice and checking the change is repeatable.",
        },
      },
      explain: {
        lead: "Now a different page: a Show details button that changes its own paragraph to Now open when it is clicked. No example open.",
        variants: {
          guided: "The new page has a button and a paragraph. Change the paragraph when the button is clicked.",
          balanced: "The new page uses the same two steps: find the elements, then listen for the click.",
          independent: "Work with no example open and choose the elements to look up yourself.",
        },
      },
      transfer: {
        lead: "The project's controls will all use this shape: wait for a moment from the visitor, then change something.",
        variants: {
          independent: "Only the visitor's actions should trigger changes here. A listener that fires on load belongs outside the function, not inside it.",
          guided: "Your project's buttons will all work this way.",
          balanced: "Every control you add later follows the same pattern.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a Show details button and a paragraph. Make the paragraph read Now open when the button is clicked, and leave it unchanged until then.",
      observable: "The paragraph is empty on load and shows Now open after the click.",
      reflection: "In your own words, what would happen if the line that changes the text sat outside the function?",
      starterFiles: {
        html: "<button id=\"toggle\">Show details</button>\n<p id=\"details\"></p>",
        css: "",
        javascript: "const toggle = document.querySelector(\"#toggle\");\nconst details = document.querySelector(\"#details\");\n// Add the listener\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The button waits for a click", pattern: "toggle\\.addEventListener\\s*\\(\\s*[\"']click[\"']" },
        { file: "javascript", label: "The click changes the paragraph", pattern: "addEventListener[\\s\\S]*details\\.textContent\\s*=\\s*[\"']Now open[\"']" },
      ],
      workedSolution: {
        html: "<button id=\"toggle\">Show details</button>\n<p id=\"details\"></p>",
        css: "",
        javascript: "const toggle = document.querySelector(\"#toggle\");\nconst details = document.querySelector(\"#details\");\ntoggle.addEventListener(\"click\", function () {\n  details.textContent = \"Now open\";\n});\n",
      },
    },
    misconceptions: [
      {
        wrong: "the change happens as soon as the page loads and the click just repeats it.",
        symptom: "The paragraph already says Now open before the visitor has clicked anything.",
        hint: "Move the line that changes the text inside the function. Everything between the function braces waits for the click, and anything above it runs immediately.",
        file: "javascript",
        detect: "details\\.textContent\\s*=\\s*[\"']Now open[\"'][\\s\\S]*addEventListener",
        detectableExample: "details.textContent = \"Now open\";\ntoggle.addEventListener(\"click\", function () {});",
      },
      {
        wrong: "the button is the element that should receive the new text.",
        symptom: "The button label changes and the paragraph stays empty.",
        hint: "The lookup at the top already names the paragraph. Use that variable inside the function so the text lands in the right element.",
        file: "javascript",
        detect: "toggle\\.textContent\\s*=",
        detectableExample: "toggle.textContent = \"Now open\";",
      },
    ],
  },
];

/*
 * The four batches below widen the same pathway from the four hand-authored
 * scripts to every remaining ages 10 to 12 challenge lesson, one module per
 * language area. A quiz has no code and a project lesson carries its own
 * completion rule, so neither takes a six-moment script; the coverage report in
 * the validator prints exactly what is and is not scripted.
 */
export const guidedPathwayScripts: LessonScript[] = [
  ...guidedExistingScripts,
  ...guidedHtmlScripts,
  ...guidedCssScripts,
  ...guidedJavascriptScripts,
  ...guidedQualityScripts,
];
