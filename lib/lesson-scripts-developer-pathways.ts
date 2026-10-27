import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The developer batch of the V3 lesson journey: the ages 16 to 18 pathway.
 *
 * The default register for this course is independent, so the example is hidden
 * until the learner asks for it and hints wait for two attempts. The wording
 * treats the work as engineering: a function with one job, a single source of
 * state, an honest loading state, and untrusted text. Each script keeps the same
 * six moments and a fresh mastery task on a different scenario.
 */

export const developerPathwayScripts: LessonScript[] = [
  {
    lessonId: "ages-16-18-javascript-pure-functions",
    courseIds: ["ages-16-18"],
    concept: "A pure function takes its inputs as parameters and produces its result with return, so the same inputs always give the same output.",
    make: "The learner replaces a calculation that reaches outside itself with one function that returns its result.",
    difficulty: 3,
    prerequisites: ["ages-16-18-structure-headings"],
    projectStep: "The project's price formatting becomes one predictable function the rest of the script can call and test.",
    stages: {
      hook: {
        lead: "A calculation is written twice and reaches for a variable defined somewhere else on the page. Changing that variable quietly changes both results. What would make the calculation dependable?",
        variants: {
          guided: "A calculation that reads from outside itself is hard to trust. Give it everything it needs as input.",
          balanced: "The same inputs must give the same output, or the function cannot be reasoned about, only run and observed.",
          independent: "A function that reads or writes outside itself is a hidden dependency. Name the inputs, produce one result, and let the caller decide what to do with it.",
        },
      },
      model: {
        lead: "function calculateTotal(price, quantity) { return price * quantity; }. Everything the function needs arrives as a parameter and everything it produces leaves through return.",
        variants: {
          guided: "Read the function as a promise: give me these two numbers and I will give you one number back.",
          balanced: "Nothing inside the function touches the document, the clock or a global, which is what makes it repeatable.",
          independent: "Notice the call sites: the result is stored or displayed by the caller. That separation is what makes the function testable in isolation.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the function first with both parameters and a single return line, then call it twice with different values.",
        variants: {
          independent: "Call it with the same values twice and confirm the two results match before you move on.",
          guided: "Write the function first, then call it once with two numbers and store the result.",
          balanced: "Write the function, then call it twice with different values and check each result.",
        },
      },
      check: {
        lead: "Change one input and run again. Only the result that uses it may change, and no other part of the page should move.",
        variants: {
          independent: "Trace the data: parameters in, one returned value out, and no assignment to anything declared outside the function.",
          guided: "Change one input and run again. Only the result that uses it should change.",
          balanced: "Call the function twice with different inputs and check each result matches what you expected.",
        },
      },
      explain: {
        lead: "Now a different page: a function that formats a price from cents and is called twice. No example open.",
        variants: {
          independent: "Decide the return type before writing the body, then check the call sites use it the same way.",
          guided: "The new page needs a function that returns a label and is called twice.",
          balanced: "Same shape, new page: one input, one returned value, two call sites.",
        },
      },
      transfer: {
        lead: "The project's calculations will all be functions of this shape, so later code can reuse them without repeating the arithmetic.",
        variants: {
          independent: "Keep the returned value free of presentation. Formatting belongs to the caller, not to the calculation.",
          guided: "The project will use this function wherever it needs the calculation.",
          balanced: "One function, one result, and the caller decides what to do with it.",
        },
      },
    },
    mastery: {
      freshTask: "A shop page needs formatPrice(cents) that returns a label beginning with KSh followed by the amount. Call it with two different amounts and store each result.",
      observable: "Both calls return the expected labels, and the function never touches the page itself.",
      reflection: "In your own words, what makes this function predictable, and what would break that?",
      starterFiles: {
        html: "<p>Check the results in JavaScript.</p>",
        css: "",
        javascript: "// Define formatPrice and two results\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Defines formatPrice with one parameter", pattern: "function\\s+formatPrice\\s*\\(\\s*cents\\s*\\)" },
        { file: "javascript", label: "Builds the label with return", pattern: "return\\s+[\"']KSh [\"']\\s*\\+\\s*cents" },
        { file: "javascript", label: "Stores two call results", pattern: "(?:=\\s*formatPrice\\s*\\([^)]*\\)[\\s\\S]*){2}" },
      ],
      workedSolution: {
        html: "<p>Check the results in JavaScript.</p>",
        css: "",
        javascript: "function formatPrice(cents) {\n  return \"KSh \" + cents;\n}\nconst first = formatPrice(250);\nconst second = formatPrice(90);\n",
      },
    },
    misconceptions: [
      {
        wrong: "the function can show its result on the page instead of returning it.",
        symptom: "The calling line receives nothing, and the page updates as a side effect of the call.",
        hint: "Keep the document out of the function. Return the value and let the line that called it decide where the value goes.",
        file: "javascript",
        detect: "function\\s+formatPrice[\\s\\S]*\\bdocument\\.",
        detectableExample: "function formatPrice(cents) {\n  document.querySelector(\"#price\").textContent = cents;\n}",
      },
      {
        wrong: "the function can read the amount from a variable outside itself.",
        symptom: "Changing the outside variable changes the result, even though the function was called with the same argument.",
        hint: "A parameter is the only input the function should need. Pass the outside value in at the call site and use the parameter inside the body.",
        file: "javascript",
        detect: "function\\s+formatPrice\\s*\\(\\s*cents\\s*\\)\\s*\\{[^}]*\\bbasePrice\\b",
        detectableExample: "function formatPrice(cents) {\n  return basePrice + cents;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-data-state",
    courseIds: ["ages-16-18"],
    concept: "One state object holds the data and the filters that describe the screen, so there is a single thing to read and a single thing to update.",
    make: "The learner replaces scattered variables with one state object and a render function that reads from it.",
    difficulty: 4,
    prerequisites: ["ages-16-18-javascript-objects"],
    projectStep: "The project's list and its filter are declared together, so a later change cannot update one and forget the other.",
    stages: {
      hook: {
        lead: "The records live in one array, the search text in another variable, and the render function reads whichever it can find. Adding a third piece of information means remembering where to put it. What would remove that guesswork?",
        variants: {
          guided: "One object can hold everything the screen depends on. Today you create that object.",
          balanced: "Scattered state is a memory test. A single object makes the screen a function of one value.",
          independent: "Name the shape before you write it: which fields describe the data, and which describe the view over that data?",
        },
      },
      model: {
        lead: "const state = { records: [], query: \"\" }; then function render() { ... state.records ... state.query ... }. The object is declared once and every read goes through it.",
        variants: {
          guided: "Put the records and the query inside one object, then read them with dot notation in the render function.",
          balanced: "The render function should only read state. If it writes to state, the update path needs naming too.",
          independent: "Keep a copy available for the next render: replacing the object rather than editing fields is what makes the change detectable.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Declare the object first with both fields, then write the render function below it and read from the object inside.",
        variants: {
          independent: "Write the render function so it would still work with an empty records array, then try it.",
          guided: "Create the object with both fields, then write the render function that reads them.",
          balanced: "Declare the object first, then the function, and read both fields inside it.",
        },
      },
      check: {
        lead: "Change one field in the object and run. Everything that reads that field must follow from the single edit.",
        variants: {
          independent: "Grep your own file for the field names: every read should be prefixed with the object, and there should be no stray copy.",
          guided: "Change one field in the object and run the page. The function should follow the change.",
          balanced: "Edit one field and confirm every read of it follows from that single edit.",
        },
      },
      explain: {
        lead: "Now a different page: one state object holding items and a filter, with a render function that reads both. No example open.",
        variants: {
          independent: "Choose field names that match the vocabulary of the interface, not the names of the variables you replaced.",
          guided: "The new page needs one object and one function that reads it.",
          balanced: "Same shape, new page: one object holding both fields and a function that reads them.",
        },
      },
      transfer: {
        lead: "The project's later features, sorting and filtering, will all be edits to this one object rather than new variables.",
        variants: {
          independent: "Adding a feature should mean adding a field and a read path, never adding another place where the truth is kept.",
          guided: "The project will read everything from this one object from now on.",
          balanced: "One object means one place to look when the screen and the data disagree.",
        },
      },
    },
    mastery: {
      freshTask: "A list page keeps its items and its filter in one state object, and a render function that reads both fields. The function must not keep its own copy of either.",
      observable: "Editing one field of the object changes what the render function reads, with no second variable involved.",
      reflection: "In your own words, what problem does one state object solve compared with separate variables?",
      starterFiles: {
        html: "<p id=\"count\"></p>",
        css: "",
        javascript: "// Define appState and renderCount\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Creates one state object", pattern: "const\\s+appState\\s*=\\s*\\{" },
        { file: "javascript", label: "Stores the items in it", pattern: "items\\s*:" },
        { file: "javascript", label: "Stores the filter in it", pattern: "filter\\s*:" },
        { file: "javascript", label: "The render function reads the object", pattern: "function\\s+renderCount\\s*\\([\\s\\S]*appState\\." },
      ],
      workedSolution: {
        html: "<p id=\"count\"></p>",
        css: "",
        javascript: "const appState = {\n  items: [\"First\", \"Second\"],\n  filter: \"all\",\n};\nfunction renderCount() {\n  const visible = appState.items.length;\n  document.querySelector(\"#count\").textContent = String(visible);\n}\n",
      },
    },
    misconceptions: [
      {
        wrong: "the array can live in its own variable beside the state object.",
        symptom: "The render function reads two places, and one of them can be updated while the other is forgotten.",
        hint: "Move the array inside the object as a field. Everything the screen depends on belongs in the same declaration so there is one thing to update.",
        file: "javascript",
        detect: "const\\s+items\\s*=",
        detectableExample: "const items = [\"First\"];\nconst appState = { filter: \"all\" };",
      },
      {
        wrong: "the render function can keep its own copy of the count.",
        symptom: "The count drifts from the data, because two places now claim to know the total.",
        hint: "Read the total from the object each time the function runs instead of holding a running value. Delete the local counter and derive the number.",
        file: "javascript",
        detect: "function\\s+renderCount[\\s\\S]*\\blet\\s+",
        detectableExample: "function renderCount() {\n  let total = 0;\n  return total;\n}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-interaction-loading",
    courseIds: ["ages-16-18"],
    concept: "An asynchronous call has at least three honest outcomes to show: waiting, a result, and an empty result that is not a failure.",
    make: "The learner gives a status line a loading state before the await and both finished states after it.",
    difficulty: 4,
    prerequisites: ["ages-16-18-javascript-pure-functions"],
    projectStep: "The project stops freezing silently while it waits and tells the visitor what is happening.",
    stages: {
      hook: {
        lead: "The page goes quiet for two seconds and then shows nothing, because the request returned an empty list. Is the screen broken, still working, or finished with no results? Nobody can tell.",
        variants: {
          guided: "Three things can happen: waiting, results, no results. Today the page says which one it is.",
          balanced: "The empty result is the one that gets forgotten, and it is the one that looks most like a bug.",
          independent: "Enumerate the states before you code them: pending, value, empty, failure. Anything you do not name will look like a freeze.",
        },
      },
      model: {
        lead: "statusText.textContent = \"Loading\"; then const found = await findTopics(); then if (found.length === 0) { ... } else { ... }. The loading line runs before the await, so the visitor sees it while the work happens.",
        variants: {
          guided: "Write the loading line above the await. After it, check the length and set one of the two finished messages.",
          balanced: "The order of the lines is the whole lesson: anything after the await runs late.",
          independent: "Awaiting suspends the function, not the browser. The line before the await is what the visitor sees in the meantime.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Set the loading state first, then await the helper, then branch on what came back.",
        variants: {
          independent: "Keep the three states in one function so a reader can compare them side by side.",
          guided: "Write the loading line first, then the await, then the two finished messages.",
          balanced: "Set the loading state, await the helper, then branch on what came back.",
        },
      },
      check: {
        lead: "Run the page and watch the order. The status must read loading before anything arrives, and must finish with exactly one of the two results.",
        variants: {
          independent: "Empty the source and confirm the page still says something useful rather than showing a blank panel.",
          guided: "Run the page and watch the badge. It should say Loading first, then one finished message.",
          balanced: "Check the order of the messages and then check the empty case.",
        },
      },
      explain: {
        lead: "Now a different page: a status badge that shows Loading, then Ready when there are results and No results when there are none. No example open.",
        variants: {
          independent: "Write the empty branch first, because it is the one you will be tempted to skip.",
          guided: "The new page needs the same three messages on its status badge.",
          balanced: "Same shape, new page: loading, then one of the two finished messages.",
        },
      },
      transfer: {
        lead: "The project's data screens will all show these three states, so the pattern is worth getting right once.",
        variants: {
          independent: "A failure state is the fourth case. It is out of scope here but the same branching shape covers it.",
          guided: "Every screen that loads data in the project will show these three states.",
          balanced: "The same three states cover every request the project makes later.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a status badge. Show Loading before awaiting findTopics, then show Ready when the result has entries and No results when it does not.",
      observable: "The badge reads Loading while the work is in flight, then exactly one of the two finished messages.",
      reflection: "In your own words, why must the loading state be written before the await?",
      starterFiles: {
        html: "<p id=\"badge\" role=\"status\">Waiting</p>",
        css: "",
        javascript: "const badge = document.querySelector(\"#badge\");\nconst topics = [];\nasync function loadTopics() {\n  // Add the states\n}\nfunction findTopics() {\n  return topics;\n}\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Shows the loading state", pattern: "textContent\\s*=\\s*[\"']Loading[\"']" },
        { file: "javascript", label: "Awaits the helper", pattern: "await\\s+findTopics\\s*\\(" },
        { file: "javascript", label: "Shows the empty state", pattern: "textContent\\s*=\\s*[\"']No results[\"']" },
        { file: "javascript", label: "Shows the finished state", pattern: "textContent\\s*=\\s*[\"']Ready[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"badge\" role=\"status\">Waiting</p>",
        css: "",
        javascript: "const badge = document.querySelector(\"#badge\");\nconst topics = [];\nasync function loadTopics() {\n  badge.textContent = \"Loading\";\n  const found = await findTopics();\n  if (found.length === 0) {\n    badge.textContent = \"No results\";\n  } else {\n    badge.textContent = \"Ready\";\n  }\n}\nfunction findTopics() {\n  return topics;\n}\n",
      },
    },
    misconceptions: [
      {
        wrong: "the loading state can be written after the data arrives.",
        symptom: "The visitor never sees the loading message, because it is replaced in the same instant it appears.",
        hint: "Write the loading line above the await. Everything below the await runs after the work is already done, so nothing there can announce it.",
        file: "javascript",
        detect: "await\\s+findTopics\\s*\\([\\s\\S]*Loading",
        detectableExample: "const found = await findTopics();\nbadge.textContent = \"Loading\";",
      },
      {
        wrong: "an empty result can be treated as success.",
        symptom: "The page reports Ready and then shows an empty panel, so the visitor assumes the page is broken.",
        hint: "Check the length before reporting success and give the empty case its own message. An empty list is a finished request, not a failure.",
        file: "javascript",
        detect: "textContent\\s*=\\s*[\"']Ready[\"'][\\s\\S]*No results",
        detectableExample: "badge.textContent = \"Ready\";\nbadge.textContent = \"No results\";",
      },
    ],
  },
  {
    lessonId: "ages-16-18-quality-security",
    courseIds: ["ages-16-18"],
    concept: "External text is data, not markup, so it belongs in textContent rather than in a string that the browser will parse as HTML.",
    make: "The learner replaces an HTML string built from external text with a created element carrying that text.",
    difficulty: 4,
    prerequisites: ["ages-16-18-data-create"],
    projectStep: "The project can display a title that came from outside the page without any of it being treated as code.",
    stages: {
      hook: {
        lead: "A title arrives from outside the page and is pasted into an HTML string. Nothing looks wrong with the title you were testing. What else could arrive in that same string?",
        variants: {
          guided: "Text from outside the page can contain anything, including tags. Treat it as text, not as page structure.",
          balanced: "The difference is who gets to decide what the browser builds. With an HTML string, the incoming text decides.",
          independent: "This is a trust boundary. Anything the page did not author is data, and data must never be parsed as markup.",
        },
      },
      model: {
        lead: "const row = document.createElement(\"li\"); row.textContent = message.subject; feed.append(row);. The element is created, the text is assigned as text, and the element is added to the page.",
        variants: {
          guided: "Create the item, put the text inside it, then add it to the list. Never join the text into an HTML string.",
          balanced: "textContent cannot contain markup, so it cannot contain a tag, which is exactly why it is the safe place for outside text.",
          independent: "Reach for textContent by default for any external string. innerHTML is a deliberate choice that needs a reason.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Delete the innerHTML line, create the item, set its text and append it.",
        variants: {
          independent: "Change one step at a time and run the preview, so you can see the element appear rather than assume it did.",
          guided: "Create the item, set its text, then add it to the list. Remove the old line.",
          balanced: "Replace the HTML string with three steps: create, set the text, append.",
        },
      },
      check: {
        lead: "Read your file and look for any place a string is joined into markup. If the only route to the page is textContent, the boundary is closed.",
        variants: {
          independent: "Search the file for innerHTML. After this task there should be no occurrence at all in your answer.",
          guided: "Check that the item shows the subject as text and that no HTML string is left.",
          balanced: "Confirm the text is assigned as text and that nothing builds markup any more.",
        },
      },
      explain: {
        lead: "Now a different page: an external subject line that must appear as text in a new list item, with no HTML string anywhere. No example open.",
        variants: {
          independent: "Notice the shape: create, assign text, append. It is the same three steps every time.",
          guided: "The new page needs a list item built from the subject line, as text.",
          balanced: "Same three steps on the new page: create the item, set the text, append it.",
        },
      },
      transfer: {
        lead: "Every later feature that shows external content in the project will use this same three step shape.",
        variants: {
          independent: "Keep the pattern recognisable in your code. The next person to read it should not have to decide whether a string is trusted.",
          guided: "Everything the project shows from outside the page will use these three steps.",
          balanced: "External text always goes in as text, in every later feature.",
        },
      },
    },
    mastery: {
      freshTask: "A page shows a subject line that came from outside the page. Create a list item, put the text in it as text and append it to the list, with no HTML string.",
      observable: "The item appears in the list, and no assignment to innerHTML remains anywhere in the file.",
      reflection: "In your own words, what could go wrong if the external text were joined into an HTML string instead?",
      starterFiles: {
        html: "<ul id=\"feed\"></ul>",
        css: "",
        javascript: "const message = { subject: \"Bus timetable update\" };\nconst feed = document.querySelector(\"#feed\");\nfeed.innerHTML = \"<li>\" + message.subject + \"</li>\";\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Creates a list item with the DOM", pattern: "createElement\\s*\\(\\s*[\"']li[\"']" },
        { file: "javascript", label: "Puts the subject in as text", pattern: "textContent\\s*=\\s*message\\.subject" },
        { file: "javascript", label: "Appends the item to the list", pattern: "feed\\.append\\s*\\(" },
        { file: "javascript", label: "No HTML string remains", pattern: "^(?![\\s\\S]*innerHTML)[\\s\\S]*$" },
      ],
      workedSolution: {
        html: "<ul id=\"feed\"></ul>",
        css: "",
        javascript: "const message = { subject: \"Bus timetable update\" };\nconst feed = document.querySelector(\"#feed\");\nconst row = document.createElement(\"li\");\nrow.textContent = message.subject;\nfeed.append(row);\n",
      },
    },
    misconceptions: [
      {
        wrong: "stripping the angle brackets out of the string is enough.",
        symptom: "The code still builds markup from outside text, and the next unexpected character finds a way through.",
        hint: "Do not filter the string, avoid the string altogether. Create the element and assign the external text with textContent, which cannot carry markup.",
        file: "javascript",
        detect: "\\.replace\\s*\\(",
        detectableExample: "feed.innerHTML = \"<li>\" + message.subject.replace(/</g, \"\") + \"</li>\";",
      },
      {
        wrong: "textContent is only for short pieces of text.",
        symptom: "The element is created safely and then filled with markup anyway, so the boundary is reopened.",
        hint: "Assign the external text with textContent whatever its length. If you need nested elements, create them one at a time and append them.",
        file: "javascript",
        detect: "createElement\\s*\\([\\s\\S]*innerHTML\\s*=",
        detectableExample: "const row = document.createElement(\"li\");\nrow.innerHTML = message.subject;",
      },
    ],
  },
];
