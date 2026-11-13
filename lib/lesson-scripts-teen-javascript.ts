import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 13 to 15, the JavaScript half of the remaining content batch.
 *
 * Four challenge lessons that had no six-moment script: showing a calculated
 * result, storing element references, waiting for a form submission and
 * validating a value before it is accepted. Each script is written for a 13 to
 * 15 year old with the learner's own page as the example, and keeps the
 * balanced and independent wording for a learner who overrides the level.
 */

export const teenJavascriptScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-javascript-dom-output",
    courseIds: ["ages-13-15"],
    concept: "The page is an object tree: querySelector finds one element and textContent replaces its plain text.",
    make: "The learner shows a calculated canteen total in the element the page already has.",
    difficulty: 2,
    prerequisites: ["ages-13-15-javascript-values"],
    projectStep: "The project stops showing placeholder numbers and starts showing values that the code calculated.",
    stages: {
      hook: {
        lead: "The page shows a total of zero. The calculation is already written above it and the number never appears. What is missing between the sum and the screen?",
        variants: {
          guided: "The maths is done, but nobody told the page. Today you connect a calculated value to the element that shows it.",
          balanced: "A value that only exists in a variable is invisible. Something has to carry it across to the document.",
          independent: "Name the two steps between a calculation and a visible number, in order.",
        },
      },
      model: {
        lead: "const totalOutput = document.querySelector(\"#total\"); selects the element once. totalOutput.textContent = \"Total: \" + meals * price; writes plain text into it.",
        variants: {
          guided: "Read the selector as an address: the hash means an id, so #total is the element whose id is total.",
          balanced: "The selector string is matched exactly against the document, which is why a missing hash finds nothing.",
          independent: "textContent treats the value as text, so anything a visitor typed cannot become markup.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Select the element into a constant, then assign the calculated text. Run the preview after each line.",
        variants: {
          guided: "Write the select line first and run the page. Nothing changes yet. Then write the assignment and run it again.",
          balanced: "Write both lines, then run the page once and compare the number with your own arithmetic.",
          independent: "Decide the variable name and the exact text before you type, then check the page shows the number you predicted.",
        },
      },
      check: {
        lead: "Change the number of meals and run the page again. The visible total has to change with it. If the element still shows the old number, the selector is not finding it.",
        variants: {
          guided: "Try two different values of meals and watch the total change each time.",
          balanced: "Test the calculation with a value you can do in your head, then trust it for the others.",
          independent: "Check the boundary case as well, such as zero meals, and decide what the page should show.",
        },
      },
      explain: {
        lead: "Now a different page: a school canteen that shows the cost of three meals. No example open. Calculate the total and show it in the element the page already has.",
        variants: {
          guided: "The new page has one element and two numbers. Write the select line, then the line that shows the total.",
          balanced: "Same two steps, new data. Decide the selector from the id the HTML carries.",
          independent: "Work with no example open and choose how the number is presented.",
        },
      },
      transfer: {
        lead: "Every later project checkpoint that shows a value reuses these two steps: find the element, then write into it.",
        variants: {
          independent: "Keep the select lines together at the top of the file, so the set of elements the page uses is visible in one place.",
          guided: "Your project will keep showing calculated values this way.",
          balanced: "The same pair of steps appears in every script that follows.",
        },
      },
    },
    mastery: {
      freshTask: "A school canteen page shows a total of zero. Calculate the cost of three meals at forty five shillings each and show the total in the element the page already has.",
      observable: "The page shows the calculated total instead of the starting zero.",
      reflection: "In your own words, what did the selector have to match for the number to appear?",
      starterFiles: {
        html: "<p id=\"total\">0</p>",
        css: "",
        javascript: "const meals = 3;\nconst price = 45;\n// Show the total\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The total element is selected by its id", pattern: "const\\s+totalOutput\\s*=\\s*document\\.querySelector\\(\\s*[\"']#total[\"']" },
        { file: "javascript", label: "The calculated total reaches the page", pattern: "totalOutput\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"total\">0</p>",
        css: "",
        javascript: "const meals = 3;\nconst price = 45;\nconst totalOutput = document.querySelector(\"#total\");\ntotalOutput.textContent = \"Total: \" + meals * price;\n",
      },
    },
    misconceptions: [
      {
        wrong: "the element is found by its name, so the hash is optional.",
        symptom: "The selector returns nothing and the page keeps showing the starting value.",
        hint: "querySelector takes a CSS selector, not a name. Keep the hash in front of the id, so #total, because total alone looks for an element with that tag.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"'](?!\\s*[.#])",
        detectableExample: "const totalOutput = document.querySelector(\"total\");",
      },
      {
        wrong: "innerHTML is the safe way to write a plain number onto the page.",
        symptom: "It works for a number and becomes a security problem the moment the value comes from a visitor.",
        hint: "A plain value belongs in textContent. innerHTML reads its value as markup, so anything a visitor typed could be treated as code.",
        file: "javascript",
        detect: "innerHTML\\s*=",
        detectableExample: "totalOutput.innerHTML = \"Total: \" + meals * price;",
      },
    ],
  },
  {
    lessonId: "ages-13-15-interaction-select",
    courseIds: ["ages-13-15"],
    concept: "A reliable interface stores its element references once, before any behaviour is attached to them.",
    make: "The learner stores a form, a select and a status paragraph from a timetable page.",
    difficulty: 2,
    prerequisites: ["ages-13-15-javascript-dom-output"],
    projectStep: "The project's controls get named references, so every later listener works with a stable handle instead of a fresh lookup.",
    stages: {
      hook: {
        lead: "A page has a form, a select and a status paragraph. Before any behaviour is written, what does the script need to hold on to, and why hold it at all?",
        variants: {
          guided: "Today you give three elements names in the script, so later code has something to talk about.",
          balanced: "A lookup repeated inside every listener is wasted work and hides mistakes. Do it once, at the top.",
          independent: "Decide where the references belong and what happens to them if a lookup runs before the document is ready.",
        },
      },
      model: {
        lead: "const routeSelect = document.querySelector(\"#route-select\"); stores the element under a name. The name is chosen by the learner; the selector string must match the id in the HTML exactly.",
        variants: {
          guided: "One line per element. The const name is yours, the selector is the browser's.",
          balanced: "Read the pair: a name you invented on the left, a query that must be true on the right.",
          independent: "Name each constant after what it is, not after where it sits on the page, because the page will change and the element will not.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write one lookup per element and run the page after each one. Nothing visible should change yet.",
        variants: {
          guided: "Type the select lookup, the status lookup and the form lookup, then run the page and check no errors appear.",
          balanced: "Write all three, then open the console and confirm no lookup returned nothing.",
          independent: "Write the three lookups, then prove each one found an element by logging its id during development.",
        },
      },
      check: {
        lead: "Change the id of one element in the HTML and run the page. The matching lookup should now fail, which proves it was really doing the finding.",
        variants: {
          guided: "Break one id on purpose, run the page, then put it back. Watching it fail is how you know it worked.",
          balanced: "Test one lookup at a time and keep the other two untouched.",
          independent: "Decide what a failing lookup should do before you test it, then confirm the page behaves that way.",
        },
      },
      explain: {
        lead: "Now a different page: a bus timetable with a route form, a route select and a status paragraph. No example open. Store a reference to each of the three.",
        variants: {
          guided: "The new page has the same three kinds of element. Write three lookups.",
          balanced: "Same step, new ids. Read the ids from the HTML before you type the selectors.",
          independent: "Work with no example open and choose names that describe the elements' jobs.",
        },
      },
      transfer: {
        lead: "The project's next checkpoints attach events to these references, so the names you choose now are the names the logic will use.",
        variants: {
          independent: "A block of lookups at the top of a file is the smallest form of structure a script can have, and the cheapest to read.",
          guided: "Your project will start every script the same way, with the lookups together at the top.",
          balanced: "Keeping lookups in one block makes a missing element obvious at a glance.",
        },
      },
    },
    mastery: {
      freshTask: "A bus timetable page has a route form, a route select and a status paragraph. Store a reference to each of the three elements before any behaviour is added.",
      observable: "Three constants hold the elements, and each one can be traced back to an id on the page.",
      reflection: "In your own words, why store the element once instead of looking it up every time it is used?",
      starterFiles: {
        html: "<form id=\"route-form\">\n  <label for=\"route-select\">Route</label>\n  <select id=\"route-select\"><option>14</option></select>\n  <button type=\"submit\">Check</button>\n</form>\n<p id=\"route-status\" role=\"status\"></p>",
        css: "",
        javascript: "// Store the three timetable elements\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The form is stored under a name", pattern: "querySelector\\(\\s*[\"']#route-form[\"']" },
        { file: "javascript", label: "The select is stored under a name", pattern: "querySelector\\(\\s*[\"']#route-select[\"']" },
        { file: "javascript", label: "The status paragraph is stored under a name", pattern: "querySelector\\(\\s*[\"']#route-status[\"']" },
      ],
      workedSolution: {
        html: "<form id=\"route-form\">\n  <label for=\"route-select\">Route</label>\n  <select id=\"route-select\"><option>14</option></select>\n  <button type=\"submit\">Check</button>\n</form>\n<p id=\"route-status\" role=\"status\"></p>",
        css: "",
        javascript: "const routeForm = document.querySelector(\"#route-form\");\nconst routeSelect = document.querySelector(\"#route-select\");\nconst routeStatus = document.querySelector(\"#route-status\");\n",
      },
    },
    misconceptions: [
      {
        wrong: "the selector text is a name rather than a query.",
        symptom: "The lookup returns nothing, and the later code fails with a message about a missing property.",
        hint: "The string inside querySelector is a CSS selector. Add the hash so #route-form, matching the id exactly as it is written in the HTML.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"']route-form[\"']\\)",
        detectableExample: "const routeForm = document.querySelector(\"route-form\");",
      },
      {
        wrong: "one lookup can serve every element, because they sit on the same page.",
        symptom: "Only the first element is usable and the rest of the interface silently does nothing.",
        hint: "Each element needs its own lookup. Store three constants, one per id, so every control has a handle of its own.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*querySelector\\(\\s*[\"']#route-form[\"']\\))(?![\\s\\S]*querySelector\\(\\s*[\"']#route-status[\"']\\))",
        detectableExample: "const routeForm = document.querySelector(\"#route-form\");",
      },
    ],
  },
  {
    lessonId: "ages-13-15-interaction-events",
    courseIds: ["ages-13-15"],
    concept: "A form's submit event is the moment the whole form is sent, and it fires for a mouse and a keyboard alike.",
    make: "The learner stops a newsletter form from reloading and shows a confirmation instead.",
    difficulty: 3,
    prerequisites: ["ages-13-15-interaction-select"],
    projectStep: "The project's form stops throwing away what the visitor typed, because the submission is handled in the page.",
    stages: {
      hook: {
        lead: "A visitor types an email and presses the button. The page reloads and the field is empty again. Nothing was wrong with the form. What happened to the moment before the reload?",
        variants: {
          guided: "The page refreshes before your code can say anything. Today you take control of that moment.",
          balanced: "A browser's default action for a form is to send the page away. The listener runs first and can stop it.",
          independent: "Decide which event represents the whole action, and what the page should do instead of leaving.",
        },
      },
      model: {
        lead: "signupForm.addEventListener(\"submit\", function (event) { event.preventDefault(); signupStatus.textContent = \"Thanks, check your inbox\"; });. The listener names the moment, the function holds the work, and preventDefault stops the reload.",
        variants: {
          guided: "Three parts: the element, the event name in quotes, and the function to run. Inside the function, stop the reload first.",
          balanced: "The event object arrives as the function's parameter. preventDefault is a method on it, so the parameter must have a name.",
          independent: "The listener is registered once at load. The function runs on every submission, so keep it short and repeatable.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. The lookups are already written. Add the listener with the function inside it, then run the page and submit the form.",
        variants: {
          guided: "Type the listener call, then the function, then the preventDefault line inside it, then the confirmation text.",
          balanced: "Write the listener and the function body, then run the page and submit to see whether the reload is gone.",
          independent: "Decide the message text before you type, then confirm the reload is gone by watching the address bar.",
        },
      },
      check: {
        lead: "Submit the form with an empty field. The page must stay where it is. Then submit it with the keyboard only, pressing Enter inside the field, and check the same thing happens.",
        variants: {
          guided: "Two tests: press the button, then press Enter in the field. Both must keep the page still.",
          balanced: "The keyboard test is the one that catches a listener attached to the wrong event.",
          independent: "Compare a submit listener with a click listener and say which input each one misses.",
        },
      },
      explain: {
        lead: "Now a different page: a newsletter signup that reloads and loses the typed address. No example open. Wait for the submission, stop the reload and show a confirmation.",
        variants: {
          guided: "The new page has the same form and the same problem. Write the listener and the confirmation.",
          balanced: "Same shape, new ids. Decide which element owns the event before you type.",
          independent: "Work with no example open and choose where the confirmation message is written.",
        },
      },
      transfer: {
        lead: "Every form the project gains later is handled this way, so the visitor never loses what they typed.",
        variants: {
          independent: "Handled submissions are the prerequisite for saving anything, because an unhandled one throws the page away first.",
          guided: "Your project's forms will all wait for submit and stop the reload.",
          balanced: "The same three parts appear on every form you build.",
        },
      },
    },
    mastery: {
      freshTask: "A newsletter signup form reloads the page and loses the typed address. Wait for the form to be submitted, stop the reload and show a confirmation in the status paragraph.",
      observable: "Submitting the form leaves the page in place and shows the confirmation text.",
      reflection: "In your own words, what would the visitor see if the listener ran but preventDefault was missing?",
      starterFiles: {
        html: "<form id=\"signup\">\n  <label for=\"email\">Email</label>\n  <input id=\"email\" type=\"email\">\n  <button type=\"submit\">Join</button>\n</form>\n<p id=\"signup-status\" role=\"status\"></p>",
        css: "",
        javascript: "const signupForm = document.querySelector(\"#signup\");\nconst signupStatus = document.querySelector(\"#signup-status\");\n// Wait for the submission\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The form waits for the submit event", pattern: "signupForm\\.addEventListener\\(\\s*[\"']submit[\"']" },
        { file: "javascript", label: "The normal reload is prevented", pattern: "event\\.preventDefault\\s*\\(" },
        { file: "javascript", label: "The visitor sees a confirmation", pattern: "signupStatus\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<form id=\"signup\">\n  <label for=\"email\">Email</label>\n  <input id=\"email\" type=\"email\">\n  <button type=\"submit\">Join</button>\n</form>\n<p id=\"signup-status\" role=\"status\"></p>",
        css: "",
        javascript: "const signupForm = document.querySelector(\"#signup\");\nconst signupStatus = document.querySelector(\"#signup-status\");\nsignupForm.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  signupStatus.textContent = \"Thanks, check your inbox\";\n});\n",
      },
    },
    misconceptions: [
      {
        wrong: "the button's click event does the same job as submitting the form.",
        symptom: "Pressing the button works and pressing Enter inside the field reloads the page.",
        hint: "A form can be submitted from the keyboard as well. Listen for submit on the form rather than click on the button, and both inputs are covered.",
        file: "javascript",
        detect: "addEventListener\\(\\s*[\"']click[\"']",
        detectableExample: "signupForm.addEventListener(\"click\", function (event) {\n  event.preventDefault();\n});",
      },
      {
        wrong: "the reload is stopped by an attribute on the form element.",
        symptom: "The behaviour is hidden in the markup, where the script cannot reuse or test it.",
        hint: "The reload is a property of the event, so stop it inside the listener with event.preventDefault and keep the HTML free of inline handlers.",
        file: "html",
        detect: "<(?:form|button)[^>]*onsubmit",
        detectableExample: "<form id=\"signup\" onsubmit=\"return false\">",
      },
    ],
  },
  {
    lessonId: "ages-13-15-interaction-validation",
    courseIds: ["ages-13-15"],
    concept: "Validation compares the value the visitor actually typed, after trimming, and answers with a message that says what to do.",
    make: "The learner stops a lunch order form accepting a name made only of spaces.",
    difficulty: 3,
    prerequisites: ["ages-13-15-interaction-events"],
    projectStep: "The project's form stops storing empty values, because the check runs before anything is accepted.",
    stages: {
      hook: {
        lead: "The order form refuses to submit when it is empty. A visitor types four spaces, presses send, and the order is accepted. The field was not empty, so what went wrong with the test?",
        variants: {
          guided: "Spaces look empty but they are characters. Today you test the trimmed value instead.",
          balanced: "trim removes the surrounding spaces, so the test can ask whether anything useful is left.",
          independent: "Separate the value from its whitespace before deciding what counts as empty.",
        },
      },
      model: {
        lead: "const name = orderInput.value.trim(); if (name === \"\") { orderStatus.textContent = \"Enter your name\"; } else { orderStatus.textContent = \"Order saved\"; }. Read the value once, clean it once, then choose between two messages.",
        variants: {
          guided: "Two outcomes, two lines. The if holds the refusal and the else holds the confirmation.",
          balanced: "Comparisons use === so the type is checked as well as the text.",
          independent: "Decide what a valid value is before writing the comparison, including the awkward cases like spaces and mixed case.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Read the value into a constant, trim it, then write the if and else messages. Run the page and test both paths.",
        variants: {
          guided: "Add the trimmed constant first and run the page. Then add the if line, then the else line.",
          balanced: "Write both paths, then test each one deliberately rather than only the one you expect.",
          independent: "Write the two branches before running, then test a valid value, an empty one and a spaces-only one.",
        },
      },
      check: {
        lead: "Type four spaces and submit. The refusal message must appear. Then type a real name and submit again; the confirmation must appear. If both paths show the same text, one branch is missing.",
        variants: {
          guided: "Test the spaces case first, because that is the one that used to fail.",
          balanced: "Check the two messages are different and that each one appears for its own case.",
          independent: "Test a name with spaces at both ends and confirm the stored value is the trimmed one.",
        },
      },
      explain: {
        lead: "Now a different page: a lunch order form that accepts a name made only of spaces. No example open. Trim the value, refuse an empty name with a clear message and confirm the order when a name is present.",
        variants: {
          guided: "The new page has the same field and the same problem. Write the trim, then the two messages.",
          balanced: "Same shape, new wording. Decide both messages before you type either.",
          independent: "Work with no example open and choose what counts as a valid name.",
        },
      },
      transfer: {
        lead: "The project's form reuses this pattern for every field it collects, so no checkpoint ever stores an empty value.",
        variants: {
          independent: "Client-side validation protects the quality of the interaction, never the safety of the data, so the server check still exists later.",
          guided: "Every field in your project will be checked this way before it is saved.",
          balanced: "The two-message shape is what makes a form feel answered rather than silent.",
        },
      },
    },
    mastery: {
      freshTask: "A lunch order form accepts a name made only of spaces. Trim the value, refuse an empty name with a clear message and confirm the order when a name is present.",
      observable: "Submitting spaces shows the refusal message, and submitting a real name shows the confirmation instead.",
      reflection: "In your own words, why does the comparison fail to notice a value made only of spaces?",
      starterFiles: {
        html: "<label for=\"order-name\">Name</label>\n<input id=\"order-name\">\n<p id=\"order-status\" role=\"status\"></p>",
        css: "",
        javascript: "const orderInput = document.querySelector(\"#order-name\");\nconst orderStatus = document.querySelector(\"#order-status\");\n// Check the name before accepting the order\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The value is trimmed before it is checked", pattern: "orderInput\\.value\\.trim\\s*\\(" },
        { file: "javascript", label: "An empty name is refused with a message", pattern: "textContent\\s*=\\s*[\"']Enter your name[\"']" },
        { file: "javascript", label: "A real name is confirmed", pattern: "textContent\\s*=\\s*[\"']Order saved[\"']" },
      ],
      workedSolution: {
        html: "<label for=\"order-name\">Name</label>\n<input id=\"order-name\">\n<p id=\"order-status\" role=\"status\"></p>",
        css: "",
        javascript: "const orderInput = document.querySelector(\"#order-name\");\nconst orderStatus = document.querySelector(\"#order-status\");\nconst name = orderInput.value.trim();\nif (name === \"\") {\n  orderStatus.textContent = \"Enter your name\";\n} else {\n  orderStatus.textContent = \"Order saved\";\n}\n",
      },
    },
    misconceptions: [
      {
        wrong: "the browser removes spaces already, so trimming is optional.",
        symptom: "A value made only of spaces passes the empty check and is accepted.",
        hint: "Read the value into a constant, trim it, then compare that constant. Spaces are characters, so the untrimmed value is not empty.",
        file: "javascript",
        detect: "if\\s*\\(\\s*orderInput\\.value\\s*===",
        detectableExample: "if (orderInput.value === \"\") {\n  orderStatus.textContent = \"Enter your name\";\n}",
      },
      {
        wrong: "one message covers both the empty case and the accepted case.",
        symptom: "The visitor cannot tell whether the order went through, because the same text appears either way.",
        hint: "The two outcomes need different messages. Keep the refusal inside the if and the confirmation inside else, so the visitor knows which one happened.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*orderStatus\\.textContent)(?![\\s\\S]*else)",
        detectableExample: "const name = orderInput.value.trim();\norderStatus.textContent = \"Order saved\";",
      },
    ],
  },
];
