import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The guided batch of the V3 lesson journey: the remaining JavaScript challenge
 * lessons of the ages 10 to 12 pathway.
 *
 * JavaScript is where pattern matching a check is most tempting, so every fresh
 * task here is a different scenario from the worked example, with its own
 * starter, its own checks and a written reflection that asks the learner to say
 * what changed and what they saw.
 */

export const guidedJavascriptScripts: LessonScript[] = [
  {
    lessonId: "javascript-foundations-output",
    courseIds: ["ages-10-12"],
    concept: "The DOM lets JavaScript find an element and change its visible text, so the page updates without being rewritten.",
    make: "The learner finds a paragraph and changes the words the visitor sees.",
    difficulty: 2,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The website can now change its own text from code.",
    stages: {
      hook: {
        lead: "The page shows the words Waiting for code. The words are in the HTML and never change. What would let a script replace them?",
        variants: {
          guided: "The page says Waiting. Today your script finds that line and changes it.",
          balanced: "JavaScript can read and change the page, once it knows which part to touch.",
          independent: "The browser turns the HTML into a model the script can walk and edit.",
        },
      },
      model: {
        lead: "document.querySelector(\"#notice\").textContent = \"Loading complete\";. The first part finds the element, the second replaces its words.",
        variants: {
          guided: "querySelector finds the element by its id. textContent changes the words inside it.",
          balanced: "The hash in \"#notice\" selects by id, the same way CSS would.",
          independent: "querySelector returns one element; textContent replaces all of its text at once.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the lookup first, then set the text, and run the page after each line.",
        variants: {
          guided: "Type document.querySelector(\"#notice\") first. Then add .textContent = \"...\";",
          balanced: "Write the whole line, then run the page and check the words changed.",
          independent: "Select the element once, then reuse the reference rather than looking it up again.",
        },
      },
      check: {
        lead: "Run the page. The paragraph should now show your new words instead of the old ones.",
        variants: {
          guided: "Look at the paragraph. Did its words change?",
          balanced: "Check the selector matches the id in the HTML exactly.",
          independent: "Confirm the change is repeatable: edit the text and run again.",
        },
      },
      explain: {
        lead: "Now a different page: a notice must show the words Loading complete. No example open.",
        variants: {
          guided: "Same two steps, new id and new words.",
          balanced: "Find the notice, then set its text.",
          independent: "Work with no example open and keep the selector and the text exact.",
        },
      },
      transfer: {
        lead: "Your website will use this pair again and again: find an element, then change it.",
        variants: {
          independent: "Selecting once and reusing the reference keeps code clear as the page grows.",
          guided: "Your website text will change from code like this.",
          balanced: "This is the doorway between the page and your script.",
        },
      },
    },
    mastery: {
      freshTask: "A page shows a notice that says Waiting. Make the script change it to Loading complete by finding the notice and setting its text.",
      observable: "The notice paragraph shows Loading complete after the script runs.",
      reflection: "In your own words, what does querySelector find and what does textContent change?",
      starterFiles: {
        html: "<p id=\"notice\">Waiting</p>",
        css: "",
        javascript: "// Update the notice text",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The script selects the notice", pattern: "document\\.querySelector\\([\"']#notice[\"']\\)" },
        { file: "javascript", label: "The script sets the visible text", pattern: "textContent\\s*=\\s*[\"']Loading complete[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"notice\">Waiting</p>",
        css: "",
        javascript: "document.querySelector(\"#notice\").textContent = \"Loading complete\";",
      },
    },
    misconceptions: [
      {
        wrong: "the text can be changed without finding the element first.",
        symptom: "The script runs but nothing on the page changes.",
        hint: "Find the element before you change it: write document.querySelector(\"#notice\") so the script knows which element to update.",
        file: "javascript",
        detect: "^(?![\\s\\S]*querySelector)[\\s\\S]*textContent\\s*=",
        detectableExample: "notice.textContent = \"Loading complete\";",
      },
      {
        wrong: "the id is written in the selector without its hash.",
        symptom: "The script cannot find the element because the selector does not match.",
        hint: "An id selector starts with a hash. Write querySelector(\"#notice\"), not querySelector(\"notice\").",
        file: "javascript",
        detect: "querySelector\\([\"'][a-z][^\"']*[\"']\\)",
        detectableExample: "document.querySelector(\"notice\")",
      },
    ],
  },
  {
    lessonId: "javascript-foundations-types",
    courseIds: ["ages-10-12"],
    concept: "A value has a type: text is written inside quotation marks and a number is written without them, so the program knows how it can be used.",
    make: "The learner stores a piece of text and a number with the right type for each.",
    difficulty: 2,
    prerequisites: ["javascript-foundations-variables"],
    projectStep: "The website can hold both words and numbers as named values.",
    stages: {
      hook: {
        lead: "A script stores a shop name and a total. If the total is written like text, the script cannot add to it. How does the browser tell words from numbers?",
        variants: {
          guided: "Words and numbers are stored differently. Today you create one of each.",
          balanced: "The quotation marks decide the type; they are not just decoration.",
          independent: "The type decides what the value can do, so choose it on purpose.",
        },
      },
      model: {
        lead: "const shopName = \"Corner Shop\"; and const itemTotal = 5;. The text sits in quotation marks; the number does not.",
        variants: {
          guided: "Put text inside quotation marks. Write a number with nothing around it.",
          balanced: "Both use const, because neither value changes; only the type differs.",
          independent: "A number in quotation marks is text, even if it looks like a number.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Create the text value first, then the number, and check each line as you go.",
        variants: {
          guided: "Write const shopName = with your words in quotes. Then const itemTotal = with a number.",
          balanced: "Create both values, then read them back and name each one's type.",
          independent: "Decide the type of each value before typing it.",
        },
      },
      check: {
        lead: "Read your file. The text should be inside quotation marks and the number should stand alone.",
        variants: {
          guided: "Check the text has quotes and the number does not.",
          balanced: "Ask of each value: could the script do maths with this?",
          independent: "Confirm which value is a string and which is a number.",
        },
      },
      explain: {
        lead: "Now a different page: a shop needs const shopName holding text and const itemTotal holding a number. No example open.",
        variants: {
          guided: "Same two values, new names. Create them with the right type.",
          balanced: "Write one text value and one number value with const.",
          independent: "Work with no example open and choose the type for each.",
        },
      },
      transfer: {
        lead: "Your website will hold both words and numbers, and the type decides what you can do with each.",
        variants: {
          independent: "A wrong type is a common source of bugs, so name it as you store it.",
          guided: "Your website stores words and numbers both.",
          balanced: "Knowing the type now saves confusion later.",
        },
      },
    },
    mastery: {
      freshTask: "A shop page needs two values: const shopName holding a piece of text and const itemTotal holding a number.",
      observable: "The text value sits in quotation marks and the number value stands without them.",
      reflection: "In your own words, how does the browser know whether a value is text or a number?",
      starterFiles: {
        html: "<p id=\"shop\"></p>",
        css: "",
        javascript: "// Store the two values",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "shopName stores text", pattern: "const\\s+shopName\\s*=\\s*[\"'][^\"']+[\"']" },
        { file: "javascript", label: "itemTotal stores a number", pattern: "const\\s+itemTotal\\s*=\\s*\\d+" },
      ],
      workedSolution: {
        html: "<p id=\"shop\"></p>",
        css: "",
        javascript: "const shopName = \"Corner Shop\";\nconst itemTotal = 5;",
      },
    },
    misconceptions: [
      {
        wrong: "numbers go in quotation marks just like text.",
        symptom: "The total cannot be used in a calculation because it is text, not a number.",
        hint: "Leave the quotation marks off a number so JavaScript treats it as a number it can add and compare.",
        file: "javascript",
        detect: "const\\s+itemTotal\\s*=\\s*[\"']\\d+[\"']",
        detectableExample: "const itemTotal = \"5\";",
      },
      {
        wrong: "text can be written without quotation marks.",
        symptom: "The script fails because the words are read as a name it does not recognise.",
        hint: "Wrap text in quotation marks so JavaScript treats it as a string. Leave numbers without them.",
        file: "javascript",
        detect: "const\\s+shopName\\s*=\\s*[A-Za-z]",
        detectableExample: "const shopName = CornerShop;",
      },
    ],
  },
  {
    lessonId: "javascript-logic-compare",
    courseIds: ["ages-10-12"],
    concept: "A comparison asks a question about two values and produces true or false, and the operator you choose decides the boundary.",
    make: "The learner creates two boolean values from one number using two different comparisons.",
    difficulty: 2,
    prerequisites: ["javascript-foundations-types"],
    projectStep: "The website can test a value before deciding what to show.",
    stages: {
      hook: {
        lead: "A script holds a count of two. It needs to know whether the count is exactly two, and separately whether it is more than zero. How does code ask a question?",
        variants: {
          guided: "The script has a number and needs to check it. Today you write two questions with two answers.",
          balanced: "A comparison produces true or false, and it is stored like any other value.",
          independent: "Choose the operator that matches the boundary you mean before you type it.",
        },
      },
      model: {
        lead: "const isFull = ticketCount === 2; and const hasTickets = ticketCount > 0;. One asks if it is exactly two, the other asks if it is more than zero.",
        variants: {
          guided: "Three equals signs ask whether two values are the same. A greater-than sign asks which is bigger.",
          balanced: "The answer is a boolean: true or false, stored in a const.",
          independent: "Strict equality checks value and type; be sure that is the question you want.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the first comparison, then the second, and read each back as a question.",
        variants: {
          guided: "Write const isFull = first. Then const hasTickets = on the next line.",
          balanced: "Write both, then change the count and predict what each will become.",
          independent: "Write both, then test the boundary value itself.",
        },
      },
      check: {
        lead: "Read your two lines as questions. Ask whether the answer would change if the count changed.",
        variants: {
          guided: "Say each line out loud as a question, then decide its answer.",
          balanced: "Change the count in your head and see which value would flip.",
          independent: "Check the exact-boundary case as well as both sides of it.",
        },
      },
      explain: {
        lead: "Now a different page: const ticketCount holds 2 and needs isFull from === 2 and hasTickets from > 0. No example open.",
        variants: {
          guided: "Same two questions, new names and a new number.",
          balanced: "Create both comparisons with the correct operators.",
          independent: "Work with no example open and choose each operator yourself.",
        },
      },
      transfer: {
        lead: "Your website will ask questions like these before it decides what to show.",
        variants: {
          independent: "A comparison is the first half of every decision; the branch is the second.",
          guided: "Your website will check values before showing things.",
          balanced: "Comparisons turn raw values into choices.",
        },
      },
    },
    mastery: {
      freshTask: "A page holds const ticketCount as 2. Create const isFull by checking it is exactly 2 and const hasTickets by checking it is more than 0.",
      observable: "Both values become true, and changing the count would change them.",
      reflection: "In your own words, what is the difference between === and >?",
      starterFiles: {
        html: "<p>Check the tickets.</p>",
        css: "",
        javascript: "const ticketCount = 2;\n// Add the two checks",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "isFull compares the count", pattern: "const\\s+isFull\\s*=\\s*ticketCount\\s*===\\s*2" },
        { file: "javascript", label: "hasTickets checks for more than zero", pattern: "const\\s+hasTickets\\s*=\\s*ticketCount\\s*>\\s*0" },
      ],
      workedSolution: {
        html: "<p>Check the tickets.</p>",
        css: "",
        javascript: "const ticketCount = 2;\nconst isFull = ticketCount === 2;\nconst hasTickets = ticketCount > 0;",
      },
    },
    misconceptions: [
      {
        wrong: "the single equals sign compares two values.",
        symptom: "The check is not a question at all; it stores a value instead.",
        hint: "Use === to compare. A single = stores a value into a name instead of asking whether two values match.",
        file: "javascript",
        detect: "const\\s+isFull\\s*=\\s*ticketCount\\s*=[^=]",
        detectableExample: "const isFull = ticketCount = 2;",
      },
      {
        wrong: "greater than or equal is the same as greater than.",
        symptom: "A zero count still passes the check because the boundary is wrong.",
        hint: "Use > 0 to mean more than zero. Add the equals sign only when the boundary value itself should pass.",
        file: "javascript",
        detect: "const\\s+hasTickets\\s*=\\s*ticketCount\\s*>=",
        detectableExample: "const hasTickets = ticketCount >= 0;",
      },
    ],
  },
  {
    lessonId: "dom-interaction-select",
    courseIds: ["ages-10-12"],
    concept: "querySelector finds an element by a CSS selector and stores a reference to it, so later instructions can work with that exact element.",
    make: "The learner finds two elements on the page and keeps a reference to each.",
    difficulty: 2,
    prerequisites: ["javascript-foundations-output"],
    projectStep: "The website's script can hold references to the parts it will change.",
    stages: {
      hook: {
        lead: "A script needs to reach two parts of the page later, a tips section and a button. Looking them up every time would be slow and messy. What could it keep instead?",
        variants: {
          guided: "The script will need those parts again. Today you look each one up once and keep it.",
          balanced: "A reference is a name for an element, so you look it up once and reuse it.",
          independent: "Storing the reference separates finding from using, which keeps later code simple.",
        },
      },
      model: {
        lead: "const tips = document.querySelector(\"#tips\");. The name tips now refers to that element for the rest of the script.",
        variants: {
          guided: "Look up the element once and give it a name. Use that name from then on.",
          balanced: "Use the id with a hash so you select exactly the element you want.",
          independent: "A tag selector can grab the wrong element; choose an id when you mean a specific one.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Store the first element, then the second, giving each a clear name.",
        variants: {
          guided: "Write const tips = document.querySelector(\"#tips\"); then do the same for the button.",
          balanced: "Store both references, then run the page and check for errors.",
          independent: "Name the references after the elements so the code reads clearly.",
        },
      },
      check: {
        lead: "Run the page and open the console. There should be no error, which means both lookups succeeded.",
        variants: {
          guided: "Check nothing is underlined in red and the page still loads.",
          balanced: "Confirm each selector matches an id that exists in the HTML.",
          independent: "Ask what happens if an id is misspelled: the reference becomes null.",
        },
      },
      explain: {
        lead: "Now a different page: it has a tips section and a more button. Store each in a reference. No example open.",
        variants: {
          guided: "Same job, two new elements. Give each a name.",
          balanced: "Store both references with the correct selectors.",
          independent: "Work with no example open and choose a clear name for each.",
        },
      },
      transfer: {
        lead: "Your website's script will store the parts it works with, then reach for them by name.",
        variants: {
          independent: "References are the bridge between the page and the script; keep them tidy.",
          guided: "Your website keeps a name for each part it uses.",
          balanced: "Storing a reference once avoids repeating the lookup.",
        },
      },
    },
    mastery: {
      freshTask: "A help page has a tips section and a more button. Store each element in a named reference so the script can use it later.",
      observable: "Both lookups run without error and the references point at the right elements.",
      reflection: "In your own words, why store the element once instead of looking it up again each time?",
      starterFiles: {
        html: "<section id=\"tips\">Tips</section>\n<button id=\"more\">More</button>",
        css: "",
        javascript: "// Store both elements",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "tips stores the tips section", pattern: "(?:const|let)\\s+tips\\s*=\\s*document\\.querySelector\\([\"']#tips[\"']\\)" },
        { file: "javascript", label: "more stores the button", pattern: "(?:const|let)\\s+more\\s*=\\s*document\\.querySelector\\([\"']#more[\"']\\)" },
      ],
      workedSolution: {
        html: "<section id=\"tips\">Tips</section>\n<button id=\"more\">More</button>",
        css: "",
        javascript: "const tips = document.querySelector(\"#tips\");\nconst more = document.querySelector(\"#more\");",
      },
    },
    misconceptions: [
      {
        wrong: "the selector can name the tag instead of the id.",
        symptom: "The script may grab a different element or none, because it is not choosing by id.",
        hint: "Use the id with its hash so you select exactly the element you meant, rather than the first matching tag.",
        file: "javascript",
        detect: "querySelector\\([\"'](?:section|button|div|p)[\"']\\)",
        detectableExample: "document.querySelector(\"section\")",
      },
      {
        wrong: "the id is written in the selector without its hash.",
        symptom: "The lookup returns nothing because the selector does not match the id.",
        hint: "An id selector begins with a hash. Write querySelector(\"#tips\") so the script finds the element with that id.",
        file: "javascript",
        detect: "querySelector\\([\"'][A-Za-z][^\"']*[\"']\\)",
        detectableExample: "document.querySelector(\"tips\")",
      },
    ],
  },
  {
    lessonId: "dom-interaction-classes",
    courseIds: ["ages-10-12"],
    concept: "classList.toggle switches one class on and off on each click, so the same control can turn a style on and then off again.",
    make: "The learner makes a button switch a class on a card each time it is clicked.",
    difficulty: 3,
    prerequisites: ["dom-interaction-events"],
    projectStep: "The website gains a control that switches its own state.",
    stages: {
      hook: {
        lead: "A button already listens for a click. One click should mark the card as active; the next click should clear it. Adding the class once would not switch it back. What would?",
        variants: {
          guided: "The card should turn the style on and off. Today you use a switch instead of a one-way add.",
          balanced: "Adding a class is one way. Toggling is a switch that works both ways.",
          independent: "State means the page remembers which mode it is in; a toggle is how that state flips.",
        },
      },
      model: {
        lead: "card.classList.toggle(\"is-active\");. Each call adds the class if it is missing and removes it if it is present.",
        variants: {
          guided: "Put the toggle inside the click function so it runs on every click.",
          balanced: "The class name must match the one in the stylesheet exactly.",
          independent: "The toggle belongs on the element you want to change, not on the button.",
        },
      },
      build: {
        lead: "Work in the JavaScript file, inside the click function. Call the toggle on the card and run the page.",
        variants: {
          guided: "Type card.classList.toggle(\"is-active\"); inside the function braces.",
          balanced: "Add the toggle, then run the page and click twice to see it switch.",
          independent: "Decide which element should change before typing the toggle.",
        },
      },
      check: {
        lead: "Run the page and click the button twice. The card should change on the first click and change back on the second.",
        variants: {
          guided: "Click once, then click again. Does it switch off?",
          balanced: "Watch the card across two clicks, not just one.",
          independent: "Confirm the class is really removed on the second click, not just added twice.",
        },
      },
      explain: {
        lead: "Now a different page: a button must switch the class is-active on a card each time it is clicked. No example open.",
        variants: {
          guided: "Same toggle, new class name. Put it in the click function.",
          balanced: "Write the toggle so each click switches the class on or off.",
          independent: "Work with no example open and choose the element the class belongs to.",
        },
      },
      transfer: {
        lead: "Your website's controls will use this switch for states like open, hidden and chosen.",
        variants: {
          independent: "Keeping styles in CSS and the switch in JavaScript keeps each in its proper place.",
          guided: "Your website buttons will switch things on and off.",
          balanced: "A toggle gives one control two jobs.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a button and a card. Each click of the button must switch the class is-active on the card on and then off.",
      observable: "The card gains the class on the first click and loses it on the second.",
      reflection: "In your own words, how is a toggle different from adding a class once?",
      starterFiles: {
        html: "<button id=\"toggle-active\">Activate</button>\n<article id=\"card\">Note</article>",
        css: ".is-active { background: #f2bf62; }",
        javascript: "const button = document.querySelector(\"#toggle-active\");\nconst card = document.querySelector(\"#card\");\nbutton.addEventListener(\"click\", function () {\n  // Toggle the class on the card\n});",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The click toggles is-active", pattern: "card\\.classList\\.toggle\\s*\\(\\s*[\"']is-active[\"']" },
        { file: "javascript", label: "The toggle runs after the click", pattern: "addEventListener[\\s\\S]*card\\.classList\\.toggle" },
      ],
      workedSolution: {
        html: "<button id=\"toggle-active\">Activate</button>\n<article id=\"card\">Note</article>",
        css: ".is-active { background: #f2bf62; }",
        javascript: "const button = document.querySelector(\"#toggle-active\");\nconst card = document.querySelector(\"#card\");\nbutton.addEventListener(\"click\", function () {\n  card.classList.toggle(\"is-active\");\n});",
      },
    },
    misconceptions: [
      {
        wrong: "the class is added once and never removed.",
        symptom: "The card changes on the first click but never switches back.",
        hint: "Use classList.toggle so each click turns the class on or off, instead of add which only ever turns it on.",
        file: "javascript",
        detect: "classList\\.add\\s*\\(\\s*[\"']is-active[\"']",
        detectableExample: "card.classList.add(\"is-active\");",
      },
      {
        wrong: "the class goes on the button, not the card.",
        symptom: "The button changes appearance and the card does not.",
        hint: "Call the toggle on the element you wanted to change, the card, not on the button that was clicked.",
        file: "javascript",
        detect: "button\\.classList\\.toggle",
        detectableExample: "button.classList.toggle(\"is-active\");",
      },
    ],
  },
  {
    lessonId: "dom-interaction-forms",
    courseIds: ["ages-10-12"],
    concept: "A submitted form reloads the page by default, so the script stops that reload and reads the typed value to show the result.",
    make: "The learner makes a search form show what the visitor typed without leaving the page.",
    difficulty: 3,
    prerequisites: ["dom-interaction-events"],
    projectStep: "The website takes a real answer from the visitor and shows it back.",
    stages: {
      hook: {
        lead: "A form sends its answer and the page flickers, then everything resets. The visitor never sees the result. What would keep the page still?",
        variants: {
          guided: "The page reloads and the answer disappears. Today you stop the reload and show the answer.",
          balanced: "A form reloads by default; the script can stop that and use the answer instead.",
          independent: "Separate what the page does by default from what you want the script to do.",
        },
      },
      model: {
        lead: "searchForm.addEventListener(\"submit\", function (event) { event.preventDefault(); output.textContent = query.value; });. The event is stopped, then the typed value is shown.",
        variants: {
          guided: "preventDefault stops the reload. query.value is the words the visitor typed.",
          balanced: "Name the function parameter event so you can call preventDefault on it.",
          independent: "The input's text lives in its value; its label is not the typed answer.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Add the submit listener, call preventDefault first, then show the typed value.",
        variants: {
          guided: "Write the listener, then event.preventDefault();, then set the output text.",
          balanced: "Add the three steps, then run the page and type an answer.",
          independent: "Decide the order of the steps before typing them.",
        },
      },
      check: {
        lead: "Run the page, type an answer and submit. The page should stay still and show what you typed.",
        variants: {
          guided: "Does the page stay still? Does your answer appear?",
          balanced: "Check the page did not reload by watching for the flicker.",
          independent: "Confirm the shown text matches exactly what was typed.",
        },
      },
      explain: {
        lead: "Now a different page: a search form must stop the reload and show the typed value. No example open.",
        variants: {
          guided: "Same three steps, new ids.",
          balanced: "Write the listener that stops the reload and shows the value.",
          independent: "Work with no example open and read the value from the right element.",
        },
      },
      transfer: {
        lead: "Your website's form will use this flow: stop the reload, then show the answer.",
        variants: {
          independent: "Handling the submit event properly is the difference between a real tool and a toy.",
          guided: "Your website forms will work without reloading.",
          balanced: "Clear feedback after an action is what makes a form feel finished.",
        },
      },
    },
    mastery: {
      freshTask: "A search form must stop the page reloading on submit and show the visitor's typed value in the output paragraph.",
      observable: "On submit the page stays open and the output shows exactly what was typed.",
      reflection: "In your own words, what would happen to the shown answer if the page reloaded?",
      starterFiles: {
        html: "<form id=\"search-form\"><label for=\"query\">Search</label><input id=\"query\" type=\"text\"><button type=\"submit\">Go</button></form>\n<p id=\"output\"></p>",
        css: "",
        javascript: "const searchForm = document.querySelector(\"#search-form\");\nconst query = document.querySelector(\"#query\");\nconst output = document.querySelector(\"#output\");\n// Handle the submit",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The form waits for submit", pattern: "searchForm\\.addEventListener\\s*\\(\\s*[\"']submit[\"']" },
        { file: "javascript", label: "The reload is prevented", pattern: "preventDefault\\s*\\(\\s*\\)" },
        { file: "javascript", label: "The output shows the typed value", pattern: "output\\.textContent\\s*=[^;]*query\\.value" },
      ],
      workedSolution: {
        html: "<form id=\"search-form\"><label for=\"query\">Search</label><input id=\"query\" type=\"text\"><button type=\"submit\">Go</button></form>\n<p id=\"output\"></p>",
        css: "",
        javascript: "const searchForm = document.querySelector(\"#search-form\");\nconst query = document.querySelector(\"#query\");\nconst output = document.querySelector(\"#output\");\nsearchForm.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  output.textContent = query.value;\n});",
      },
    },
    misconceptions: [
      {
        wrong: "the typed text is read from the input's visible text rather than its value.",
        symptom: "The output shows something other than what the visitor typed.",
        hint: "Read the typed text from the input's value property, as in query.value, not from the label or the element's text.",
        file: "javascript",
        detect: "query\\.textContent",
        detectableExample: "output.textContent = query.textContent;",
      },
      {
        wrong: "the page reload is harmless and can be left in.",
        symptom: "The answer appears for a moment then vanishes because the page reloads.",
        hint: "Call preventDefault on the submit event so the page stays open and the result remains visible.",
        file: "javascript",
        detect: "^(?![\\s\\S]*preventDefault)[\\s\\S]*addEventListener\\s*\\(\\s*[\"']submit[\"']",
        detectableExample: "searchForm.addEventListener(\"submit\", function (event) {});",
      },
    ],
  },
];
