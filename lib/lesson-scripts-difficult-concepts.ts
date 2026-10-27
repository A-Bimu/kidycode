import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The difficult-concept batch of the V3 lesson journey. It sits beside
 * lib/lesson-scripts.ts, which owns the LessonScript model and the first three
 * samples, and is spread into the same exported list so every contract check,
 * the presenter and the course gate see one set of scripts.
 *
 * The batch covers the concepts the curriculum audit ranked as the most likely
 * to be passed by pattern matching: const and let, functions with parameters and
 * return, array indexes and length, CSS Grid tracks, records modelled as
 * objects, and deriving a collection with filter. Each script carries:
 *
 * - six moments of framing, with per-mode wording, so the lesson itself is not
 *   restated and the course keeps owning the task, hints, checks and question;
 * - a mastery gate on a fresh scenario, kept out of the lesson's own starter and
 *   check patterns, so transfer is independent rather than repeated; and
 * - misconception-specific hints: the wrong mental model, what the learner sees
 *   while it is in play, and a detector that fires only on code that shows it.
 */

export const difficultConceptScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-javascript-values",
    courseIds: ["ages-13-15", "adults"],
    courseLessonIds: { adults: "adults-javascript-values" },
    companionLessonIds: { "ages-10-12": ["javascript-foundations-variables"] },
    concept: "A binding gives one value a name: const for a value the code never reassigns and let for a value that is meant to change.",
    make: "The learner stores their own website's name once as a constant and a count of what the page lists as a value that changes.",
    difficulty: 2,
    prerequisites: [],
    projectStep: "The website name is written once, and the number of items the page lists becomes a value the page can update instead of retyping.",
    misconceptions: [
      {
        wrong: "let is the safe choice for every value.",
        symptom: "Nothing in the file marks which value is meant to stay the same, so the reader has to guess.",
        hint: "Ask one question about each name: will the code ever put a new value into it? If the answer is no, that name is a const. Change one line, run the page, then decide the next name.",
        file: "javascript",
        detect: "^(?![\\s\\S]*\\bconst\\b)",
        detectableExample: "let stallName = \"Sunrise Stall\";\nlet customers = 4;\ncustomers = customers + 1;",
      },
      {
        wrong: "the count is a piece of text.",
        symptom: "The page shows 41 when one customer was added to 4.",
        hint: "Quotes make text, and adding text joins it. Write the count without quotes so the plus sign adds numbers, then compare the page with another run.",
        file: "javascript",
        detect: "customers\\s*=\\s*[\"']\\d+[\"']",
        detectableExample: "let customers = \"4\";\ncustomers = customers + 1;",
      },
      {
        wrong: "the same name can be declared again to change it.",
        symptom: "The page keeps the first number and the new line appears to do nothing.",
        hint: "One name, one declaration. Keep the let line where it is and put the new number into the same name on a later line.",
        file: "javascript",
        detect: "(?:let|const)\\s+customers\\b[\\s\\S]*?\\b(?:let|const)\\s+customers\\b",
        detectableExample: "let customers = 4;\nlet customers = customers + 1;",
      },
    ],
    stages: {
      hook: {
        lead: "Two lines that look almost the same. One names a value the page will never change and one names a value that grows with every visit. Which should the code be allowed to replace?",
        variants: {
          guided: "Some values stay the same and some change. Today you choose the right word for each one.",
          balanced: "A name is a promise about the value behind it. The promise is either that it never changes or that it will.",
          independent: "Bindings are contracts. A reader should be able to tell from the declaration alone whether reassignment is intended.",
        },
      },
      model: {
        lead: "const siteName = \"Kite Club\"; then let visitCount = 0; then visitCount = visitCount + 1;. The first value can never be pointed at something else. The second can, and the last line puts the new number into the same name.",
        variants: {
          guided: "Use const when the value is written once. Use let when a later line gives the name a new value.",
          independent: "Read each line as a decision: does the name receive a second value anywhere in the file? If it never does, const states that fact and stops accidental reassignment.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Store the page's own name once with const, then name a count with let and increase it by one. Run the page after each line.",
        variants: {
          guided: "Add the const line first and run it. Then add the let line. Add the increase last.",
          independent: "Choose the names from the information the page actually shows, not from the example.",
        },
      },
      check: {
        lead: "Read each name back. Does the name written with const ever appear on the left of an equals sign later in the file? If it does, the wrong word was chosen.",
        variants: {
          guided: "Check two things: the page still shows one name, and the count is one more than the number you typed.",
          independent: "The automatic checks read the text of the file. Prove the behaviour yourself by changing the starting number and running the page again.",
        },
      },
      explain: {
        lead: "Now do it for a different page: name a group's next meeting once and a number of places left that drops by one. No example open.",
        variants: {
          guided: "The fresh task has two values like before. One is written once, one changes.",
          independent: "The fresh task uses different names and a count that goes down. Decide each binding from its use.",
        },
      },
      transfer: {
        lead: "These two bindings are the first lines of the project's own script, and the array in a later lesson stores the values the count is counting.",
        variants: {
          independent: "Keep the distinction visible in the project: fixed values are named once, changing values are named with let and updated in one place.",
        },
      },
    },
    mastery: {
      freshTask: "A market stall page needs a small script: name the stall once, name a number of customers that goes up by one, then show the name and the new number on the page.",
      observable: "The page shows one more customer than the number written in the file, and the stall name is never given a second value.",
      reflection: "In your own words, why was one value a const and the other a let?",
      starterFiles: {
        html: "<p id=\"stall\"></p>",
        css: "",
        javascript: "// Name the stall\n// Name the customers, then add one\nconst stall = document.querySelector(\"#stall\");\n// Show the name and the number\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The stall name is a constant", pattern: "const\\s+stallName\\s*=\\s*[\"'][^\"']+[\"']" },
        { file: "javascript", label: "The customer count is a let binding", pattern: "let\\s+customers\\s*=\\s*\\d+" },
        { file: "javascript", label: "The count increases by one", pattern: "customers\\s*=\\s*customers\\s*\\+\\s*1" },
        { file: "javascript", label: "The page shows the name and the count", pattern: "stall\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"stall\"></p>",
        css: "",
        javascript: "const stallName = \"Sunrise Stall\";\nlet customers = 4;\nconst stall = document.querySelector(\"#stall\");\ncustomers = customers + 1;\nstall.textContent = stallName + \": \" + customers + \" customers\";\n",
      },
    },
  },
  {
    lessonId: "ages-13-15-javascript-functions",
    courseIds: ["ages-13-15", "adults"],
    courseLessonIds: { adults: "adults-javascript-functions" },
    companionLessonIds: { "ages-10-12": ["javascript-foundations-functions"] },
    concept: "A function names one job: the values in its parentheses are what it receives and return is the value it hands back to the line that called it.",
    make: "The learner writes one function that labels a title and uses it twice instead of repeating the same line.",
    difficulty: 3,
    prerequisites: ["ages-13-15-javascript-values"],
    projectStep: "The project's repeated title formatting becomes one named job, so two places on the page can label an item without copying the same line.",
    misconceptions: [
      {
        wrong: "writing to the page inside the function is the same as returning a value.",
        symptom: "The page updates while the value the calling line asked for is undefined.",
        hint: "A function that shows something has not handed anything back. Keep the page update on the calling line and use return inside the function for the value itself.",
        file: "javascript",
        detect: "function\\s+labelFor\\s*\\([^)]*\\)\\s*\\{[^}]*document\\.",
        detectableExample: "function labelFor(title) {\n  document.querySelector(\"#label\").textContent = title;\n}",
      },
      {
        wrong: "the call does not need the value it produces.",
        symptom: "The page shows nothing even though the function clearly ran.",
        hint: "Calling a function on its own throws the answer away. Put the call on the right of the equals sign so its value reaches the page.",
        file: "javascript",
        detect: "\\n\\s*labelFor\\s*\\([^)]*\\)\\s*;",
        detectableExample: "function labelFor(title) {\n  return \"Book: \" + title;\n}\nlabelFor(\"Atlas\");",
      },
      {
        wrong: "the parameter name is a value that already exists outside the function.",
        symptom: "ReferenceError: title is not defined, reported from the line that calls the function.",
        hint: "The name in the parentheses only exists inside the function. Pass the text in the call and use the parameter inside the braces.",
        file: "javascript",
        detect: "labelFor\\s*\\(\\s*\\)",
        detectableExample: "function labelFor(title) {\n  return \"Book: \" + title;\n}\ndocument.querySelector(\"#label\").textContent = labelFor();",
      },
    ],
    stages: {
      hook: {
        lead: "The same labelling line is written twice, once for each heading. Change the word in one place and the two headings no longer match. What would let one change reach both?",
        variants: {
          guided: "The same instruction is copied. Today you give it a name so it is written once.",
          balanced: "Repetition is not just longer: two copies drift apart. One named job keeps them together.",
          independent: "Duplication is a defect waiting to happen. Name the job, take its input as a parameter and return its result.",
        },
      },
      model: {
        lead: "function labelFor(title) { return \"Topic: \" + title; }. The parameter title is the value handed in. Return ends the function and gives the answer back, so a line like const heading = labelFor(\"Web\") receives the text Topic: Web.",
        variants: {
          guided: "Read the function in three parts: its name, the value it receives, and the value it returns.",
          independent: "The function reads only its parameter and returns one value. It touches nothing else, which is what makes it callable from anywhere.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the function first with one parameter and one return line, then call it once and show the result on the page.",
        variants: {
          guided: "Write the function and run the page before adding any call.",
          independent: "Decide the input and the output before the code. The call line then has nothing left to invent.",
        },
      },
      check: {
        lead: "Run the file. If the page shows undefined, the function was called but nothing came back: read the return line before touching the call.",
        variants: {
          guided: "Check two things: the page shows the label, and the words around your own title are still there.",
          independent: "The checks match text, not behaviour. Change the argument in the call and run the page to prove the result is computed rather than written by hand.",
        },
      },
      explain: {
        lead: "Now write a function that returns an amount with a currency word in front of it, and use it for two different amounts. No example open.",
        variants: {
          guided: "The fresh task is the same shape as the example with different words.",
          independent: "The fresh task must be called at least twice, so a hard-coded answer cannot pass.",
        },
      },
      transfer: {
        lead: "The project's repeated title formatting becomes one named job, and the next lesson's decision can call it on whichever value the visitor chooses.",
        variants: {
          independent: "Keep the function free of page updates so the project's later rendering code can reuse it unchanged.",
        },
      },
    },
    mastery: {
      freshTask: "A library page needs a function that returns a book's label, then shows that label on the page.",
      observable: "Changing the title passed to the function changes the page, and the function itself is written once.",
      reflection: "In your own words, what did return do that updating the page inside the function would not do?",
      starterFiles: {
        html: "<p id=\"label\"></p>",
        css: "",
        javascript: "// Write one function with a parameter and a return\n// Call it and show the result\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The function takes one parameter", pattern: "function\\s+labelFor\\s*\\(\\s*title\\s*\\)" },
        { file: "javascript", label: "The function returns a label", pattern: "return\\s*[\"'][^\"']*[\"']\\s*\\+\\s*title" },
        { file: "javascript", label: "The result reaches the page", pattern: "textContent\\s*=\\s*labelFor\\s*\\(" },
      ],
      workedSolution: {
        html: "<p id=\"label\"></p>",
        css: "",
        javascript: "function labelFor(title) {\n  return \"Book: \" + title;\n}\ndocument.querySelector(\"#label\").textContent = labelFor(\"Atlas\");\n",
      },
    },
  },
  {
    lessonId: "ages-13-15-data-arrays",
    courseIds: ["ages-13-15", "adults"],
    courseLessonIds: { adults: "adults-data-arrays" },
    companionLessonIds: { "ages-10-12": ["javascript-logic-arrays"] },
    concept: "An array keeps values in order: an index is a position that starts at 0 and length is how many items the array holds.",
    make: "The learner stores their project's three repeated values in one array and reads the first item and the count from it.",
    difficulty: 3,
    prerequisites: ["ages-13-15-javascript-values"],
    projectStep: "The project's repeated values move into one array, ready for the loop that will walk through them.",
    misconceptions: [
      {
        wrong: "the last item sits at the array's length.",
        symptom: "Reading the last price gives undefined, even though the count looks right.",
        hint: "Positions start at 0, so the last position is one less than length. Read length minus 1, or read index 0 first and count the rest from there.",
        file: "javascript",
        detect: "prices\\s*\\[\\s*prices\\.length\\s*\\]",
        detectableExample: "const lastPrice = prices[prices.length];",
      },
      {
        wrong: "the whole array is the same as one of its items.",
        symptom: "The page shows the three prices joined by commas instead of one.",
        hint: "An array is the whole group. Choose one position with square brackets before anything is placed on the page.",
        file: "javascript",
        detect: "(?:textContent|innerText)\\s*=\\s*prices\\s*;",
        detectableExample: "price.textContent = prices;",
      },
      {
        wrong: "the count is a number kept by hand.",
        symptom: "The page still says three after a fourth price is added to the array.",
        hint: "Let the array answer the question. length always reports the current number of items, so nothing has to be updated by hand when the data changes.",
        file: "javascript",
        detect: "=\\s*[\"']?3[\"']?\\s*;",
        detectableExample: "count.textContent = 3;",
      },
    ],
    stages: {
      hook: {
        lead: "Three prices are typed as three separate values. Ask for the first, the last and how many there are, and the code needs three different answers that can disagree. What single thing could hold all three?",
        variants: {
          guided: "Three values belong together. One box can keep them in order.",
          balanced: "Separate names cannot report a count you can trust. A collection can.",
          independent: "Parallel values cannot be counted, sorted or looped reliably. Model the group, then ask the group questions.",
        },
      },
      model: {
        lead: "const prices = [30, 50, 70]; then const first = prices[0]; then const total = prices.length;. The first slot is index 0, not 1. Reading a slot hands back one value. length reports how many items there are.",
        variants: {
          guided: "The first value is at position 0. The count is length, and it counts the items rather than naming a position.",
          independent: "Read the brackets as a position and length as a total. They are different questions with different answers.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Put the three values in one array, read the first item into a named value, then store the count.",
        variants: {
          guided: "Write the array first and run the page. Then read index 0. Then store length.",
          independent: "Keep the array and the two reads on separate lines so each result can be checked on its own.",
        },
      },
      check: {
        lead: "Run the code and compare. The item you read should be the value you wrote first, and the count should match what you typed.",
        variants: {
          guided: "Check two things: the first price, and the number of prices.",
          independent: "The checks read the text of the file. Prove the count follows the data by adding a fourth value and running the page again.",
        },
      },
      explain: {
        lead: "Now do the same for three meeting places: read the first one and store how many there are. No example open.",
        variants: {
          guided: "The fresh task is the same shape with different values.",
          independent: "The fresh task must read a position and a total from the same array, so a hand-written count cannot pass.",
        },
      },
      transfer: {
        lead: "The project's repeated values move into one array, which is exactly what the loop in the next lesson walks through.",
        variants: {
          independent: "Keep the collection and the display code apart: the array is the data, and nothing about the page belongs inside it.",
        },
      },
    },
    mastery: {
      freshTask: "A market page lists three prices. Store them in one array, read the first price into a named value, store how many prices there are, then show both on the page.",
      observable: "The page shows the first price you typed and the number of prices, and adding a fourth price changes the count with no other edit.",
      reflection: "In your own words, why does the first price live at index 0, and what does length tell you?",
      starterFiles: {
        html: "<p id=\"price\"></p><p id=\"count\"></p>",
        css: "",
        javascript: "// Store the three prices in one array\nconst price = document.querySelector(\"#price\");\nconst count = document.querySelector(\"#count\");\n// Read the first price and the number of prices, then show both\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Three prices are stored in one array", pattern: "const\\s+prices\\s*=\\s*\\[[^\\]]+,[^\\]]+,[^\\]]+\\]" },
        { file: "javascript", label: "The first price is read from index 0", pattern: "prices\\s*\\[\\s*0\\s*\\]" },
        { file: "javascript", label: "The count uses the array length", pattern: "prices\\.length" },
        { file: "javascript", label: "Both values reach the page", pattern: "price\\.textContent\\s*=[\\s\\S]*count\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"price\"></p><p id=\"count\"></p>",
        css: "",
        javascript: "const prices = [30, 50, 70];\nconst price = document.querySelector(\"#price\");\nconst count = document.querySelector(\"#count\");\nconst firstPrice = prices[0];\nprice.textContent = firstPrice;\ncount.textContent = prices.length;\n",
      },
    },
  },
  {
    lessonId: "ages-13-15-responsive-grid",
    courseIds: ["ages-13-15", "ages-16-18", "adults"],
    courseLessonIds: { "ages-16-18": "ages-16-18-responsive-grid", adults: "adults-responsive-grid" },
    companionLessonIds: { "ages-10-12": ["css-layout-grid"] },
    concept: "Grid arranges children in rows and columns, and a track measured in fr takes an equal share of the space left after the gaps.",
    make: "The learner turns the row of cards on their own website into a grid that keeps equal columns and stays readable on a narrow screen.",
    difficulty: 3,
    prerequisites: ["ages-13-15-responsive-flex", "css-layout-flex"],
    projectStep: "The project's card row becomes a grid, so the cards line up in columns instead of wrapping unevenly.",
    misconceptions: [
      {
        wrong: "fr is a fixed size measured in pixels.",
        symptom: "The columns stay the same width on a narrow screen and the page scrolls sideways.",
        hint: "1fr is a share of the space left after the gaps, so it shrinks with the container. Ask for a share, and save pixels for a size that must never change.",
        file: "css",
        detect: "grid-template-columns\\s*:[^;]*\\d+px",
        detectableExample: ".gallery {\n  display: grid;\n  grid-template-columns: 200px 200px 200px;\n}",
      },
      {
        wrong: "the grid belongs on the cards themselves.",
        symptom: "Each card becomes a one-column grid and nothing lines up with its neighbour.",
        hint: "The element that decides the layout is the parent holding the cards. Move display: grid to the container and let the cards stay ordinary children.",
        file: "css",
        detect: "(?:^|\\n)\\s*img\\s*\\{[^}]*display\\s*:\\s*grid",
        detectableExample: "img {\n  display: grid;\n}",
      },
      {
        wrong: "columns are enough without any gap.",
        symptom: "The cards touch each other and the column shares look uneven.",
        hint: "Add gap to the container. One declaration spaces every row and column and keeps the shares working from the space that is actually left. The column track alone is not enough to see whether the layout is right.",
        file: "css",
        detect: "^(?![\\s\\S]*\\bgap\\s*:)[\\s\\S]*grid-template-columns\\s*:",
        detectableExample: ".cards {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n}",
      },
    ],
    stages: {
      hook: {
        lead: "Three cards sit in one long line. On a laptop they stretch across the page and on a phone they are cut in half. The cards are not the problem: the element that holds them decides where each one starts and ends.",
        variants: {
          guided: "The cards need a shape that has rows and columns. Today you give their container that shape.",
          balanced: "A row is one dimension. Cards that must sit beside and below each other need two.",
          independent: "Two axes are the requirement. Grid gives you explicit tracks, so the layout is stated rather than hoped for.",
        },
      },
      model: {
        lead: ".cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }. The parent becomes a grid, repeat(2, 1fr) asks for two columns of equal share, and gap keeps a fixed space between cards so each share is calculated from the space that is left.",
        variants: {
          guided: "Add the three declarations one at a time and run the preview after each one.",
          independent: "Read each declaration as a decision: is the parent a grid, how many tracks, and what space is removed before the tracks are shared.",
        },
      },
      build: {
        lead: "Work in the CSS file only. Decide the parent first, then add display, the column track and the gap in that order, running the preview after each line.",
        variants: {
          guided: "Start with display: grid; and run the preview. It will look wrong, and that is the expected first step.",
          independent: "A rule on each card will not create a grid. Put the decision on the container.",
        },
      },
      check: {
        lead: "Compare your prediction with the preview: two cards on the first row, the third below, and the same gap between every card and every row.",
        variants: {
          guided: "Check two things: the cards line up in columns, and narrowing the preview keeps them equal.",
          independent: "The checks read the text of the file. Narrow the preview yourself to prove the tracks are shares rather than fixed widths.",
        },
      },
      explain: {
        lead: "Now give a gallery of four pictures three equal columns and a fixed gap. No example open.",
        variants: {
          guided: "The fresh task uses a different class name and the same three decisions.",
          independent: "The fresh task names a new container. Diagnose which element owns the layout before writing the rule.",
        },
      },
      transfer: {
        lead: "The project's cards use this grid, and the media query in the next lesson changes the number of tracks instead of changing the layout.",
        variants: {
          independent: "Keep the tracks written once so the later breakpoint only has to restate the count.",
        },
      },
    },
    mastery: {
      freshTask: "A gallery page holds four pictures in a section called gallery. Arrange them as a grid with three equal columns and a 1rem gap.",
      observable: "Three pictures sit on the first row and the fourth wraps below, and narrowing the preview keeps the columns equal instead of fixed.",
      reflection: "In your own words, what does 1fr measure, and why does that keep the columns equal on a narrow screen?",
      starterFiles: {
        html: "<section class=\"gallery\">\n  <img src=\"one.jpg\" alt=\"First picture\">\n  <img src=\"two.jpg\" alt=\"Second picture\">\n  <img src=\"three.jpg\" alt=\"Third picture\">\n  <img src=\"four.jpg\" alt=\"Fourth picture\">\n</section>",
        css: "/* Arrange the gallery */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The gallery is a grid", pattern: "\\.gallery\\s*\\{[\\s\\S]*display\\s*:\\s*grid" },
        { file: "css", label: "The grid asks for three equal columns", pattern: "grid-template-columns\\s*:\\s*repeat\\(\\s*3\\s*,\\s*1fr\\s*\\)" },
        { file: "css", label: "The columns have a fixed gap", pattern: "gap\\s*:\\s*1rem" },
      ],
      workedSolution: {
        html: "<section class=\"gallery\">\n  <img src=\"one.jpg\" alt=\"First picture\">\n  <img src=\"two.jpg\" alt=\"Second picture\">\n  <img src=\"three.jpg\" alt=\"Third picture\">\n  <img src=\"four.jpg\" alt=\"Fourth picture\">\n</section>",
        css: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}\n",
        javascript: "",
      },
    },
  },
  {
    lessonId: "ages-16-18-javascript-objects",
    courseIds: ["ages-16-18"],
    companionLessonIds: { "ages-13-15": ["ages-13-15-data-objects"], adults: ["adults-data-objects"] },
    concept: "An object groups values under named properties, so one record keeps its fields together and every record of the same kind uses the same names.",
    make: "The learner models one record with named properties and reads a single field from it instead of tracking parallel values.",
    difficulty: 4,
    prerequisites: ["ages-16-18-javascript-pure-functions"],
    projectStep: "The project's repeated values become records, so one shape describes every entry the page displays.",
    misconceptions: [
      {
        wrong: "properties are read by position, like an array.",
        symptom: "Reading record[0] gives undefined even though the object clearly holds four fields.",
        hint: "An object has names, not positions. Read the property with a dot, and use square brackets only when the name itself lives in a value.",
        file: "javascript",
        detect: "\\bbook\\s*\\[\\s*\\d+\\s*\\]",
        detectableExample: "const name = book[0];",
      },
      {
        wrong: "one record can be split into separate names.",
        symptom: "A second record means a second set of names and no single shape for the render code to read.",
        hint: "Keep the fields inside one object so every record has the same shape. The code that displays it then reads one thing, whatever the values are.",
        file: "javascript",
        detect: "const\\s+title\\s*=",
        detectableExample: "const title = \"Atlas\";\nconst author = \"Ada\";",
      },
      {
        wrong: "a property can be read before it is written.",
        symptom: "The page shows undefined for a field that was never put into the record.",
        hint: "Compare the spelling in the record with the spelling on the read line. A missing property does not throw an error, it quietly returns undefined.",
        file: "javascript",
        detect: "book\\.(?!id\\b|title\\b|author\\b|available\\b)[a-z]+",
        detectableExample: "const pages = book.pageCount;",
      },
    ],
    stages: {
      hook: {
        lead: "One booking needs four values. Held in four separate names, the code has to remember that they belong together, and a second booking turns four names into eight. What could keep the fields of one record together?",
        variants: {
          guided: "Four values describe one thing. A record can keep them together under names.",
          balanced: "Separate names have no shape to share. One record shape can describe every entry.",
          independent: "Positional data forces the reading code to depend on order. Named properties make the shape explicit and stable across records.",
        },
      },
      model: {
        lead: "const record = { id: 7, title: \"Atlas\", category: \"Science\", available: true }; then record.title. The braces hold named properties. Reading one uses a dot and the name, not a number.",
        variants: {
          guided: "Read the record as a list of names and values. To read one back, write the record name, a dot, then the property name.",
          independent: "The same property names are the contract between the data and every function that reads it. Order is irrelevant; names are not.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write one record with the four fields, then read its title into a named value and show it.",
        variants: {
          guided: "Write the record and run the page before reading anything from it.",
          independent: "Decide the field names from what the interface must show, not from what is easiest to type.",
        },
      },
      check: {
        lead: "Run the file and read the value back. The title you read should be the title you typed, and no numeric index should be needed to reach it.",
        variants: {
          guided: "Check two things: the record exists with all four fields, and the page shows the title.",
          independent: "Confirm the read by removing one field from the record and predicting what the page will show before you run it.",
        },
      },
      explain: {
        lead: "Now model one workshop with a name, a place, a number of places and whether it is full, then read the place. No example open.",
        variants: {
          guided: "The fresh task uses different field names and the same shape.",
          independent: "The fresh task must read one named property, so a positional read cannot pass.",
        },
      },
      transfer: {
        lead: "Records are what the project's list will display, and filtering that list by one property is the next step.",
        variants: {
          independent: "Keep one record shape for the project so the render and filter code can be written once and reused.",
        },
      },
    },
    mastery: {
      freshTask: "A book club page needs one record for a book: an id, a title, an author and an available value. Read the title from the record and show it on the page.",
      observable: "The page shows the title that is inside the record, and changing that property changes the page with no other edit.",
      reflection: "In your own words, why does one record beat four separate names once there is more than one entry?",
      starterFiles: {
        html: "<p id=\"book\"></p>",
        css: "",
        javascript: "// Model one book record\nconst output = document.querySelector(\"#book\");\n// Read the title from the record and show it\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "A record is created with braces", pattern: "const\\s+book\\s*=\\s*\\{" },
        { file: "javascript", label: "The record names a title", pattern: "\\btitle\\s*:" },
        { file: "javascript", label: "The record names an author", pattern: "\\bauthor\\s*:" },
        { file: "javascript", label: "The title is read with a dot", pattern: "book\\.title" },
      ],
      workedSolution: {
        html: "<p id=\"book\"></p>",
        css: "",
        javascript: "const book = { id: 1, title: \"Atlas\", author: \"Ada Njoroge\", available: true };\nconst output = document.querySelector(\"#book\");\noutput.textContent = book.title;\n",
      },
    },
  },
  {
    lessonId: "ages-16-18-javascript-filter",
    courseIds: ["ages-16-18"],
    concept: "Filter returns a new array holding only the items whose callback returned true, and the original collection is left unchanged.",
    make: "The learner derives a shortlist from their project's records without editing the collection itself.",
    difficulty: 5,
    prerequisites: ["ages-16-18-javascript-objects"],
    projectStep: "The project can show a derived list, which is what a filter control will drive in the next module.",
    misconceptions: [
      {
        wrong: "filter changes the collection in place.",
        symptom: "Clearing the filter cannot bring the missing records back.",
        hint: "Filter returns a new array and never edits the source. Store the result in a new name and keep the original collection exactly as it was.",
        file: "javascript",
        detect: "\\brecords\\s*=\\s*records\\.filter\\s*\\(",
        detectableExample: "records = records.filter(function (record) {\n  return record.available;\n});",
      },
      {
        wrong: "the callback returns the record that should be kept.",
        symptom: "Every record survives, because a record object is always truthy.",
        hint: "The callback answers a yes-or-no question about one record. Return the test itself, such as record.available, and filter keeps the records where the answer was true.",
        file: "javascript",
        detect: "filter\\s*\\([^)]*\\)?[\\s\\S]{0,120}?return\\s+record\\s*;",
        detectableExample: "const shortlist = records.filter(function (record) {\n  return record;\n});",
      },
      {
        wrong: "the count should be read from the full collection.",
        symptom: "The page shows four even though the shortlist is shorter.",
        hint: "Reading length from the collection counts everything. Read the length of the new array the filter returned so the number matches what is on screen.",
        file: "javascript",
        detect: "textContent\\s*=\\s*records\\.length",
        detectableExample: "count.textContent = records.length;",
      },
    ],
    stages: {
      hook: {
        lead: "The page shows every entry, including the unavailable ones. Deleting them from the collection would appear to work until the visitor clears the filter, and then the data is gone. What could produce a second list without touching the first?",
        variants: {
          guided: "The page needs a smaller list made from the big one. The big one should still be there afterwards.",
          balanced: "A filter that destroys its source cannot be undone. Derive the shorter list and keep the original.",
          independent: "Destructive filtering breaks reversibility. Treat the collection as a source of truth and derive views from it.",
        },
      },
      model: {
        lead: "const shortlist = records.filter(function (record) { return record.available; });. Filter calls the callback once per item, keeps the items where the callback returned true, and returns a new array. The collection still holds every record afterwards.",
        variants: {
          guided: "The callback is a question about one record. Return true to keep it and false to leave it out.",
          independent: "Separate the test from the data: the callback returns a boolean, and the return value of filter is a new array you name yourself.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the callback so it returns the test rather than the item, store the result under a new name, then read its length.",
        variants: {
          guided: "Write the callback first and run the page. Then read the length of the new array.",
          independent: "Name the derived array for what it contains, not for what it excludes.",
        },
      },
      check: {
        lead: "Run the code and compare the two counts. The shortlist should be shorter than the collection, and the collection should still hold every record.",
        variants: {
          guided: "Check two things: the page shows the smaller number, and changing a record's available value changes that number.",
          independent: "The checks match text. Prove non-destruction yourself by reading the collection length after the filter runs.",
        },
      },
      explain: {
        lead: "Now derive a shortlist of entries that cost less than a limit you choose and show how many there are. No example open.",
        variants: {
          guided: "The fresh task uses a different property and a comparison instead of a true or false field.",
          independent: "The fresh task must not mutate the source, and the count must come from the derived array.",
        },
      },
      transfer: {
        lead: "The project can now show a derived list, which is what a filter control will drive in the next module.",
        variants: {
          independent: "Keep the derived array separate from the collection so a later search can derive a different view from the same source.",
        },
      },
    },
    mastery: {
      freshTask: "An opportunity directory stores four records with a title, a category and an available value. Derive a shortlist of the available records and show how many there are.",
      observable: "The shortlist count is smaller than four, and the collection still holds all four records afterwards.",
      reflection: "In your own words, what does the callback return, and what happens to the original array?",
      starterFiles: {
        html: "<p id=\"count\"></p>",
        css: "",
        javascript: "const records = [\n  { title: \"Atlas\", category: \"Science\", available: true },\n  { title: \"Beacon\", category: \"Art\", available: false },\n  { title: \"Cinder\", category: \"Science\", available: true },\n  { title: \"Delta\", category: \"Music\", available: false },\n];\nconst count = document.querySelector(\"#count\");\n// Derive the shortlist and show how many records it holds\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The collection is filtered", pattern: "records\\.filter\\s*\\(" },
        { file: "javascript", label: "The callback returns the test", pattern: "return\\s+record\\.available" },
        { file: "javascript", label: "The shortlist reports its own size", pattern: "shortlist\\.length" },
        { file: "javascript", label: "The page shows the shortlist size", pattern: "count\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"count\"></p>",
        css: "",
        javascript: "const records = [\n  { title: \"Atlas\", category: \"Science\", available: true },\n  { title: \"Beacon\", category: \"Art\", available: false },\n  { title: \"Cinder\", category: \"Science\", available: true },\n  { title: \"Delta\", category: \"Music\", available: false },\n];\nconst count = document.querySelector(\"#count\");\nconst shortlist = records.filter(function (record) {\n  return record.available;\n});\ncount.textContent = shortlist.length;\n",
      },
    },
  },
];
