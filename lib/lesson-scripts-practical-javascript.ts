import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The adults remaining-content batch, JavaScript module.
 *
 * The register is balanced, aimed at an adult learner wiring real behaviour into
 * a working page: a decision, a result written into the DOM, stored element
 * references, a submission handler, and one small saved preference. Independent
 * wording is available for a learner who asks for it.
 */

export const practicalJavascriptScripts: LessonScript[] = [
  {
    lessonId: "adults-javascript-conditions",
    courseIds: ["adults"],
    concept: "A condition compares a value to produce true or false, and if runs one branch while else handles the other.",
    make: "The learner writes a decision that sets one of two messages from a stored value.",
    difficulty: 3,
    prerequisites: ["adults-javascript-functions"],
    projectStep: "The project's availability message changes with a value instead of being typed by hand.",
    stages: {
      hook: {
        lead: "The same page shows the same message for a first-time visitor and a returning one. The code has the value it needs but never asks a question of it. What is missing?",
        variants: {
          guided: "The value is available but unused. The page needs a decision that chooses between two messages.",
          balanced: "One message for every situation is the same as no message. The code has to branch on the value.",
          independent: "Decide what input should change the output before you write the branch. A condition without a reason is noise.",
        },
      },
      model: {
        lead: "if (seats > 0) { message = \"Places available\"; } else { message = \"Waiting list\"; }. The comparison produces true or false and the two branches cover both outcomes.",
        variants: {
          guided: "Write the comparison in plain words first, then let if and else assign each message.",
          balanced: "The condition tests the value and the two branches set a different result for each outcome.",
          independent: "Choose the boundary deliberately, so the case exactly on the limit behaves as the business expects.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the comparison in plain words first, then let if and else assign each message.",
        variants: {
          guided: "Write the if line first, then the assignment inside it, then the else branch.",
          balanced: "Write the condition, then both branches, then run a value on each side.",
          independent: "Decide the boundary value before you write the comparison, so it is not an accident.",
        },
      },
      check: {
        lead: "Test a value on each side of the boundary. The correct branch must run for both, including exactly at the limit.",
        variants: {
          guided: "Check a positive value shows one message and zero shows the other.",
          balanced: "Test the boundary itself, not just the two obvious cases.",
          independent: "Verify both branches run, and that neither assignment can happen on the same path.",
        },
      },
      explain: {
        lead: "Now a booking page that shows one message whatever the number of seats. Set the message to Places available when seats is greater than zero, and Waiting list otherwise. No example open.",
        variants: {
          guided: "The new page has one value and two possible messages. Write the decision.",
          balanced: "Same decision on the new page: one condition and two branches.",
          independent: "Work with no example open and choose the boundary term yourself.",
        },
      },
      transfer: {
        lead: "Every later decision in the project follows the same shape: a comparison that is true or false and two branches that cover both.",
        variants: {
          guided: "Every decision you add to the project will use the same if and else shape.",
          balanced: "Consistent decisions are what make the project's behaviour predictable.",
          independent: "Keep the outcome of each branch explicit, so a later reader can trace every path.",
        },
      },
    },
    mastery: {
      freshTask: "A booking page shows one message whatever the number of seats. Set the message to Places available when seats is greater than zero, and Waiting list otherwise.",
      observable: "A positive number shows Places available, and zero or less shows Waiting list.",
      reflection: "In your own words, when does the else branch run?",
      starterFiles: {
        html: "<p id=\"seats-message\"></p>",
        css: "",
        javascript: "const seats = 3;\nlet seatsMessage = \"\";\n// Add the decision\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The condition checks the seat count", pattern: "if\\s*\\(\\s*seats\\s*>\\s*0" },
        { file: "javascript", label: "The available message is set", pattern: "seatsMessage\\s*=\\s*[\"']Places available[\"']" },
        { file: "javascript", label: "The alternative message is set", pattern: "else\\s*\\{[\\s\\S]*seatsMessage\\s*=\\s*[\"']Waiting list[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"seats-message\"></p>",
        css: "",
        javascript: "const seats = 3;\nlet seatsMessage = \"\";\nif (seats > 0) {\n  seatsMessage = \"Places available\";\n} else {\n  seatsMessage = \"Waiting list\";\n}\n",
      },
    },
    misconceptions: [
      {
        wrong: "both messages can be assigned in order, with the last one winning.",
        symptom: "The page always shows one message, because the second assignment overwrites the first.",
        hint: "Wrap the two assignments in if and else so only one runs. Two assignments in a row run both, and the last one always wins.",
        file: "javascript",
        detect: "^(?![\\s\\S]*\\bif\\s*\\()[\\s\\S]*seatsMessage\\s*=",
        detectableExample: "seatsMessage = \"Places available\";\nseatsMessage = \"Waiting list\";",
      },
      {
        wrong: "the condition can test the message instead of the value.",
        symptom: "The comparison is always false or always true, so one branch never runs.",
        hint: "Compare the value itself, such as seats > 0, not the empty message string. A condition on the output can never reflect the input.",
        file: "javascript",
        detect: "if\\s*\\(\\s*seatsMessage",
        detectableExample: "if (seatsMessage > 0) {",
      },
    ],
  },
  {
    lessonId: "adults-javascript-dom-output",
    courseIds: ["adults"],
    concept: "The DOM is the browser's live model of the page: querySelector finds an element and textContent changes only its text.",
    make: "The learner selects an element by id and writes a plain text result into it.",
    difficulty: 2,
    prerequisites: ["adults-javascript-conditions"],
    projectStep: "The project writes its first calculated result into the page instead of leaving it unseen.",
    stages: {
      hook: {
        lead: "A calculation is correct but the visitor never sees it, because the result stays out of sight. What has to happen between the calculation and the screen?",
        variants: {
          guided: "A result has to be placed into an element before a visitor can read it.",
          balanced: "The calculation and the display are two separate jobs, and only the second one reaches the page.",
          independent: "Decide which element owns the result before you write it, so the display has one obvious home.",
        },
      },
      model: {
        lead: "const statusText = document.querySelector(\"#service-status\"); statusText.textContent = \"Booking open\";. Select the element once, then set its text.",
        variants: {
          guided: "Select the element by id, then assign the message to its textContent.",
          balanced: "The selector finds the element and textContent replaces only the text inside it.",
          independent: "Use textContent for ordinary text, because it can never be interpreted as markup.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Select the element by id, then assign the result to textContent.",
        variants: {
          guided: "Write the selector first, then the line that sets the text.",
          balanced: "Select the element, set its text, then check the preview shows the message.",
          independent: "Choose the selector from the HTML id before you write it, so it cannot return null.",
        },
      },
      check: {
        lead: "Check the selector matches an id that exists in the HTML, and that the text you expect appears in the preview.",
        variants: {
          guided: "Check the message appears where the placeholder was.",
          balanced: "Confirm the selector and the HTML id match exactly.",
          independent: "Verify no HTML tags appear as visible text, which would mean the value was treated as markup.",
        },
      },
      explain: {
        lead: "Now a status line on a services page that still shows a placeholder. Select the element and write the message Booking open into its text. No example open.",
        variants: {
          guided: "The new page has one element to select and one message to write.",
          balanced: "Same two steps on the new page: select, then set the text.",
          independent: "Work with no example open and choose the constant name yourself.",
        },
      },
      transfer: {
        lead: "Every result the project shows later follows the same path: select the element once, then set its text.",
        variants: {
          guided: "Every result you show in the project is written into a selected element.",
          balanced: "One consistent way of showing results is what keeps the project's output predictable.",
          independent: "Keep one selected reference per element, so the display code stays short and readable.",
        },
      },
    },
    mastery: {
      freshTask: "A status line on a services page still shows a placeholder. Select the element and write the message Booking open into its text.",
      observable: "The preview shows Booking open where the placeholder was, and no HTML tags appear as text.",
      reflection: "In your own words, what does querySelector receive, and what does textContent change?",
      starterFiles: {
        html: "<p id=\"service-status\">Checking</p>",
        css: "",
        javascript: "// Select and update the status\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The status element is selected", pattern: "(?:const|let)\\s+statusText\\s*=\\s*document\\.querySelector\\(\\s*[\"']#service-status[\"']" },
        { file: "javascript", label: "The status text is written", pattern: "statusText\\.textContent\\s*=\\s*[\"']Booking open[\"']" },
      ],
      workedSolution: {
        html: "<p id=\"service-status\">Checking</p>",
        css: "",
        javascript: "const statusText = document.querySelector(\"#service-status\");\nstatusText.textContent = \"Booking open\";\n",
      },
    },
    misconceptions: [
      {
        wrong: "the element can be found without a selector prefix.",
        symptom: "The selection returns null and the next line throws, because querySelector expects a CSS selector.",
        hint: "Pass a real selector to querySelector, such as #service-status for an id. A bare id name matches an element type that does not exist.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"'][^\"'#.\\[]",
        detectableExample: "document.querySelector(\"service-status\")",
      },
      {
        wrong: "the result should be inserted as HTML so it can be styled inline.",
        symptom: "Text that contains angle brackets is interpreted as markup, and unexpected content can appear on the page.",
        hint: "Use textContent for ordinary results. It treats the value as plain text, which is both safer and enough for a status message.",
        file: "javascript",
        detect: "innerHTML\\s*=",
        detectableExample: "statusText.innerHTML = \"Booking open\";",
      },
    ],
  },
  {
    lessonId: "adults-interaction-select",
    courseIds: ["adults"],
    concept: "Behaviour starts by storing reliable references to the elements it needs, using one precise selector each.",
    make: "The learner selects a form, its field and a result element and stores each in a named constant.",
    difficulty: 2,
    prerequisites: ["adults-javascript-dom-output"],
    projectStep: "The project's search area gets the three element references every later interaction will reuse.",
    stages: {
      hook: {
        lead: "A form is about to get behaviour, but the script reaches into the page three times for the same elements. What would make that code shorter and safer?",
        variants: {
          guided: "Looking up the same element repeatedly is wasted work and one more place for a typo.",
          balanced: "Select once, name it clearly, and reuse the name everywhere it is needed.",
          independent: "Treat each element reference as a dependency, and gather the dependencies at the top of the script.",
        },
      },
      model: {
        lead: "const form = document.querySelector(\"#search-form\"); const field = document.querySelector(\"#search-field\"); const results = document.querySelector(\"#search-results\");. Select once, name clearly, reuse.",
        variants: {
          guided: "Give each element its own constant with a clear name.",
          balanced: "Each selector matches one id, and each constant holds one element.",
          independent: "Name the constants after the element's job, so the code reads as a list of dependencies.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Confirm each selector matches an id in the HTML, then store each element in a descriptive constant.",
        variants: {
          guided: "Write one constant per element, checking the id in the HTML as you go.",
          balanced: "Select each element and name the constant after what it is.",
          independent: "Decide the constant names before the selectors, so the script reads from the outside in.",
        },
      },
      check: {
        lead: "Check every selector against the HTML. A typo here returns null and the first use of it fails.",
        variants: {
          guided: "Check each selector matches an id in the HTML.",
          balanced: "Confirm no two constants point at the same element by mistake.",
          independent: "Verify each reference would still work after the page content changes.",
        },
      },
      explain: {
        lead: "Now a search area with a form, a text field and a results paragraph. Store a named reference to each element before any behaviour is added. No example open.",
        variants: {
          guided: "The new page has three elements to select, as before.",
          balanced: "Same three selectors on the new page, each in its own constant.",
          independent: "Work with no example open and choose the constant names yourself.",
        },
      },
      transfer: {
        lead: "Every interaction the project adds later begins by gathering the references it needs, in one place.",
        variants: {
          guided: "Every behaviour you add to the project starts by selecting the elements it needs.",
          balanced: "One block of references is what keeps the project's behaviour easy to follow.",
          independent: "Keep the references together at the top, so a reader sees the page's contract at a glance.",
        },
      },
    },
    mastery: {
      freshTask: "A search area has a form, a text field and a results paragraph. Store a named reference to each element before any behaviour is added.",
      observable: "Each constant holds the matching element, and no selector returns null.",
      reflection: "In your own words, why store the element once instead of selecting it again in every function?",
      starterFiles: {
        html: "<form id=\"search-form\"><input id=\"search-field\"><button>Search</button></form><p id=\"search-results\"></p>",
        css: "",
        javascript: "// Store the three elements\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The form is selected", pattern: "querySelector\\(\\s*[\"']#search-form[\"']" },
        { file: "javascript", label: "The field is selected", pattern: "querySelector\\(\\s*[\"']#search-field[\"']" },
        { file: "javascript", label: "The results element is selected", pattern: "querySelector\\(\\s*[\"']#search-results[\"']" },
      ],
      workedSolution: {
        html: "<form id=\"search-form\"><input id=\"search-field\"><button>Search</button></form><p id=\"search-results\"></p>",
        css: "",
        javascript: "const form = document.querySelector(\"#search-form\");\nconst field = document.querySelector(\"#search-field\");\nconst results = document.querySelector(\"#search-results\");\n",
      },
    },
    misconceptions: [
      {
        wrong: "a selector can be trusted without checking the id it names.",
        symptom: "The selector returns null, and the first line that uses the reference throws at runtime.",
        hint: "Compare the selector text with the HTML id character by character before you run it. A mismatch is silent until the reference is used.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"'][a-z][a-z-]*[\"']",
        detectableExample: "document.querySelector(\"search-form\")",
      },
      {
        wrong: "the same element should be re-selected inside every function.",
        symptom: "The code repeats the lookup, and a later rename of the id has to be fixed in several places.",
        hint: "Select once at the top and store it in a named constant, then reuse the constant. One lookup keeps one place to change.",
        file: "javascript",
        detect: "function[\\s\\S]*document\\.querySelector",
        detectableExample: "function update() {\n  const results = document.querySelector(\"#search-results\");\n}",
      },
    ],
  },
  {
    lessonId: "adults-interaction-events",
    courseIds: ["adults"],
    concept: "An event listener waits for a named browser event and runs a function when it happens; the submit event covers both the button and the keyboard.",
    make: "The learner attaches a submit listener to a form and prevents the default page reload.",
    difficulty: 3,
    prerequisites: ["adults-interaction-select"],
    projectStep: "The project's form responds to a submission in place instead of reloading the page.",
    stages: {
      hook: {
        lead: "A visitor presses send and the whole page reloads, wiping the form. The button works, but the wrong thing is happening. Which event should the code be listening for?",
        variants: {
          guided: "A form submission has its own event. Listening for it is what lets the page respond before it reloads.",
          balanced: "The reload is the browser's default action, and it happens unless the code stops it.",
          independent: "Decide which event represents the visitor's intent, then handle that rather than the button press.",
        },
      },
      model: {
        lead: "form.addEventListener(\"submit\", function (event) { event.preventDefault(); }). Listen on the form for submit and stop the default reload first.",
        variants: {
          guided: "Add the listener on the form, give the callback an event parameter, and call preventDefault inside.",
          balanced: "The submit event fires for the button and for the keyboard, so one listener covers both.",
          independent: "Call preventDefault as the first line, before the handler does any other work.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Add the listener to the form, give the callback an event parameter and call preventDefault inside it.",
        variants: {
          guided: "Write the addEventListener call first, then the callback with its event parameter.",
          balanced: "Add the listener, prevent the reload, then submit the form to check the page stays.",
          independent: "Decide what the handler will do after the reload is prevented before you write it.",
        },
      },
      check: {
        lead: "Submit with the button and with the keyboard. Neither should reload the page, and the listener should run both times.",
        variants: {
          guided: "Check the page does not reload when the form is submitted.",
          balanced: "Confirm the listener is on the form, not on the button alone.",
          independent: "Verify the default action is prevented before any other work in the handler runs.",
        },
      },
      explain: {
        lead: "Now a newsletter form that reloads the page on every submission. Add a submit listener to the form and stop the default reload. No example open.",
        variants: {
          guided: "The new form needs the same listener and the same preventDefault.",
          balanced: "Same listener on the new form: submit, an event parameter, and preventDefault.",
          independent: "Work with no example open and choose the constant name yourself.",
        },
      },
      transfer: {
        lead: "Every form the project adds later handles submission the same way, so no interaction wipes the page.",
        variants: {
          guided: "Every form you add to the project gets a submit listener.",
          balanced: "Handling submission properly is what makes the project's forms feel part of the page.",
          independent: "Keep the handler focused on the event, so the reload is prevented before anything else can run.",
        },
      },
    },
    mastery: {
      freshTask: "A newsletter form reloads the page on every submission. Add a submit listener to the form and stop the default reload so the page stays where it is.",
      observable: "Submitting with the button or the keyboard no longer reloads the page.",
      reflection: "In your own words, why listen for submit on the form rather than click on the button?",
      starterFiles: {
        html: "<form id=\"newsletter\"><input id=\"signup-email\" type=\"email\"><button>Join</button></form>",
        css: "",
        javascript: "const newsletter = document.querySelector(\"#newsletter\");\n// Listen for submission\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The form listens for submission", pattern: "newsletter\\.addEventListener\\(\\s*[\"']submit[\"']" },
        { file: "javascript", label: "The callback receives the event", pattern: "function\\s*\\(\\s*event\\s*\\)" },
        { file: "javascript", label: "The default reload is prevented", pattern: "event\\.preventDefault\\s*\\(" },
      ],
      workedSolution: {
        html: "<form id=\"newsletter\"><input id=\"signup-email\" type=\"email\"><button>Join</button></form>",
        css: "",
        javascript: "const newsletter = document.querySelector(\"#newsletter\");\nnewsletter.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n});\n",
      },
    },
    misconceptions: [
      {
        wrong: "listening for click on the button is the same as submit.",
        symptom: "Submitting the form with the keyboard does not run the code, because no click happens.",
        hint: "Listen for submit on the form itself. The submit event fires for the button and for the keyboard, while click fires for one path only.",
        file: "javascript",
        detect: "addEventListener\\(\\s*[\"']click[\"']",
        detectableExample: "newsletter.addEventListener(\"click\", function () {});",
      },
      {
        wrong: "the reload can be prevented after the handler has done its other work.",
        symptom: "The page reloads before the response is shown, so the prevented action never takes effect.",
        hint: "Call event.preventDefault() as the first line inside the listener. The default action starts as soon as the handler begins.",
        file: "javascript",
        detect: "^(?![\\s\\S]*preventDefault)[\\s\\S]*addEventListener\\(\\s*[\"']submit[\"']",
        detectableExample: "newsletter.addEventListener(\"submit\", function (event) {});",
      },
    ],
  },
  {
    lessonId: "adults-interaction-storage",
    courseIds: ["adults"],
    concept: "localStorage keeps a small non-sensitive value in the browser, and getItem can return null on a first visit so the code needs a fallback.",
    make: "The learner saves a preference under a project key, restores it with a fallback and shows it on the page.",
    difficulty: 3,
    prerequisites: ["adults-interaction-events"],
    projectStep: "The project remembers one small preference between visits without storing anything private.",
    stages: {
      hook: {
        lead: "A visitor sets a preference and returns the next day to find it gone. The page never saved it anywhere. Where could a small, non-sensitive preference live between visits?",
        variants: {
          guided: "Browser storage keeps a small value on the visitor's own device between visits.",
          balanced: "A preference that should survive a reload has to be written somewhere that outlives the page.",
          independent: "Decide what is worth remembering before you save it, and keep private values out of the browser entirely.",
        },
      },
      model: {
        lead: "localStorage.setItem(\"project-language\", value); const saved = localStorage.getItem(\"project-language\") || \"No language saved\";. Save under one key and restore with a fallback for a first visit.",
        variants: {
          guided: "Save the value under a project key, then read it back with a fallback for when it is missing.",
          balanced: "getItem returns null on a first visit, so the fallback is what keeps the page readable.",
          independent: "Use a key namespaced to the project, so two features on the same site never collide.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Save the value under a project key, then read it back with a default for when it is missing.",
        variants: {
          guided: "Write the setItem line first, then the getItem line, then show the result.",
          balanced: "Save the value, restore it with a fallback, then display it in the preview.",
          independent: "Decide the key before you write it, so both lines use exactly the same one.",
        },
      },
      check: {
        lead: "Test a first visit, when getItem returns null, and a returning visit, when it returns the saved value. Both must show sensible text.",
        variants: {
          guided: "Check the fallback text appears before anything has been saved.",
          balanced: "Confirm the saved value appears on a later visit and the fallback on the first.",
          independent: "Verify the key used to save and the key used to restore are identical.",
        },
      },
      explain: {
        lead: "Now a settings page that should remember a visitor's chosen language between visits. Save it under the key project-language and restore it with a fallback, then show it on the page. No example open.",
        variants: {
          guided: "The new page needs the same save, restore and display steps.",
          balanced: "Same three steps on the new page: save, restore with a fallback, then show.",
          independent: "Work with no example open and choose the fallback text yourself.",
        },
      },
      transfer: {
        lead: "Every small preference the project saves later uses one namespaced key and always restores with a fallback.",
        variants: {
          guided: "Every preference you save in the project uses a project key and a fallback.",
          balanced: "Saving with a fallback is what keeps the project from showing blanks on a first visit.",
          independent: "Keep private values out of storage entirely, because the page can read anything it wrote.",
        },
      },
    },
    mastery: {
      freshTask: "A settings page should remember a visitor's chosen language between visits. Save it under the key project-language and restore it with a fallback, then show it on the page.",
      observable: "On a first visit the fallback text appears, and on a return visit the saved language appears.",
      reflection: "In your own words, what does getItem return when the key has never been set, and why does that matter?",
      starterFiles: {
        html: "<p id=\"language-line\"></p>",
        css: "",
        javascript: "const chosenLanguage = \"Swahili\";\nconst languageLine = document.querySelector(\"#language-line\");\n// Save and restore\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The language is saved under the project key", pattern: "localStorage\\.setItem\\(\\s*[\"']project-language[\"']" },
        { file: "javascript", label: "The language is restored from the same key", pattern: "localStorage\\.getItem\\(\\s*[\"']project-language[\"']" },
        { file: "javascript", label: "A fallback covers a first visit", pattern: "(?:\\|\\||\\?\\?)" },
        { file: "javascript", label: "The restored value is shown", pattern: "languageLine\\.textContent\\s*=" },
      ],
      workedSolution: {
        html: "<p id=\"language-line\"></p>",
        css: "",
        javascript: "const chosenLanguage = \"Swahili\";\nconst languageLine = document.querySelector(\"#language-line\");\nlocalStorage.setItem(\"project-language\", chosenLanguage);\nconst savedLanguage = localStorage.getItem(\"project-language\") || \"No language saved\";\nlanguageLine.textContent = savedLanguage;\n",
      },
    },
    misconceptions: [
      {
        wrong: "a password or private detail can be kept in localStorage for convenience.",
        symptom: "Sensitive information is written to the device, where any script on the page can read it back.",
        hint: "Store only small, non-sensitive preferences. Private values do not belong in browser storage, because the page and anyone using the device can read them.",
        file: "javascript",
        detect: "setItem\\(\\s*[\"'][^\"']*(?:password|secret|token|pin)[^\"']*[\"']",
        detectableExample: "localStorage.setItem(\"account-password\", value);",
      },
      {
        wrong: "the restored value can be used without a fallback.",
        symptom: "On a first visit getItem returns null and the page shows nothing, or the word null.",
        hint: "Give getItem a fallback with || so a first visit shows sensible text. A missing key returns null, not an empty string.",
        file: "javascript",
        detect: "getItem\\(\\s*[\"'][^\"']+[\"']\\s*\\)\\s*;",
        detectableExample: "const saved = localStorage.getItem(\"project-language\");",
      },
    ],
  },
];
