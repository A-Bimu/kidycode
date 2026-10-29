import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 16 to 18, the quality half of the remaining content batch.
 *
 * Three challenge lessons that had no six-moment script: debugging from
 * evidence, the accessibility audit and the release note.
 *
 * The wording is written for a learner about to show the work to somebody else:
 * debugging is a controlled experiment rather than guesswork, the audit is a
 * list of things a real visitor meets, and the release note is an honest
 * boundary rather than a marketing paragraph. Every script carries the guided,
 * balanced and independent wording, a fresh task with its own checks, and two
 * misconception-specific hints with proved detectors.
 */

export const developerQualityScripts: LessonScript[] = [
  {
    lessonId: "ages-16-18-quality-debug",
    courseIds: ["ages-16-18"],
    concept: "Debugging is a controlled experiment: state what should happen, observe what did happen, change one cause and test again.",
    make: "The learner repairs a selector that names a missing id and a function that is never called, recording the evidence in the file.",
    difficulty: 4,
    prerequisites: ["ages-16-18-data-delete"],
    projectStep: "The project's faults become findable by whoever inherits it, because the reasoning is written beside the code rather than remembered.",
    stages: {
      hook: {
        lead: "A paragraph never changes from its starting text. Three fixes are attempted in one go, the page still does not change, and nobody can tell which of the three made any difference. The code is not the problem yet. What has to happen before the next edit?",
        variants: {
          guided: "Before changing anything, write down what should happen and what did happen. Today the difference between those two sentences is the whole method.",
          balanced: "A fix applied without a prediction produces no evidence, so a second fault can hide behind the first one indefinitely.",
          independent: "Treat a fault as a question with a measurable answer. One change, one observation, and only then the next change.",
        },
      },
      model: {
        lead: "The evidence is a pair of statements: Expected, the paragraph reads the new value; Actual, the paragraph stayed on the starting text. The next line names the smallest cause: the selector asked for an id the document does not contain. The repair changes that one string, and the retest confirms it.",
        variants: {
          guided: "Read the four steps in order: expected, actual, one cause, retest. The cause is written before the change, not after it.",
          balanced: "A cause is a statement you can test. Anything vaguer than a named line is a guess that will cost more time than the next observation.",
          independent: "The recorded evidence is also the report you hand to somebody else, which is why it belongs in the file rather than in a message.",
        },
      },
      build: {
        lead: "Work in the JavaScript file first. Compare the selector text with the id in the markup, repair only that string, then look for the call the function is missing.",
        variants: {
          guided: "Change the selector so it matches the id in the paragraph, then add the call at the end of the file.",
          balanced: "Repair one fault and run the page before touching the second, so each change can be attributed.",
          independent: "Write the expected and actual lines before the repair, and keep them in the file as the record of the investigation.",
        },
      },
      check: {
        lead: "Run the page and read the paragraph. It should now show the repaired value. Then read your two evidence lines: they should describe the fault you actually met rather than a general statement about the code.",
        variants: {
          guided: "Check the paragraph changed, then check both evidence lines are present.",
          balanced: "Check the two faults separately in the record, since a repaired page can still hide a second fault.",
          independent: "Confirm the cause you wrote names one line, because a cause that names a whole file cannot be tested.",
        },
      },
      explain: {
        lead: "Now a different page: a stock paragraph that never updates, with a selector that names an id the markup does not contain and a function that is never called. No example open. Repair both faults and record the expected and actual result.",
        variants: {
          guided: "The new file has the same two faults. Repair the selector, add the call and write the two evidence lines.",
          balanced: "Same method, new page. Write the evidence before the repair so the record describes the fault rather than the fix.",
          independent: "Work with no example open and name the smallest cause you can test, then confirm the repair against it.",
        },
      },
      transfer: {
        lead: "Every fault the project collects from here is recorded the same way, and the release note later states which flows were tested rather than that the project works.",
        variants: {
          independent: "Understand the fault rather than the fix, because the reasoning is what transfers to the next defect and the line of code does not.",
          guided: "Your project's faults will each be recorded as expected, actual and one cause.",
          balanced: "Evidence written beside the code is still readable when the memory of the session is gone.",
        },
      },
    },
    mastery: {
      freshTask: "A stock paragraph never leaves its starting text. The function that updates it selects an id the markup does not contain, and the function is never called. Repair both faults and record the expected and actual result in comments.",
      observable: "The paragraph shows the repaired value after the page runs, and the file records what was expected, what actually happened and which cause was repaired.",
      reflection: "In your own words, why does changing one cause at a time produce better evidence than repairing several at once?",
      starterFiles: {
        html: "<p id=\"stock\">No stock recorded</p>",
        css: "",
        javascript: "function showStock() {\n  document.querySelector(\"#totals\").textContent = \"Six items in stock\";\n}\n// Record the evidence in comments and run the function",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The selector names an id the markup contains", pattern: "querySelector\\(\\s*[\"']#stock[\"']" },
        { file: "javascript", label: "The repair function is actually called", pattern: "(?:\\n|\\s)showStock\\s*\\(\\s*\\)\\s*;" },
        { file: "javascript", label: "The expected result is recorded", pattern: "Expected\\s*:" },
        { file: "javascript", label: "The actual result is recorded", pattern: "Actual\\s*:" },
      ],
      workedSolution: {
        html: "<p id=\"stock\">No stock recorded</p>",
        css: "",
        javascript: "function showStock() {\n  document.querySelector(\"#stock\").textContent = \"Six items in stock\";\n}\n\n// Expected: the paragraph reads Six items in stock\n// Actual: the paragraph stayed on No stock recorded, because the selector named an id the markup does not contain\nshowStock();",
      },
    },
    misconceptions: [
      {
        wrong: "the paragraph is not updating because the assignment happens too early in the page's life.",
        symptom: "A delay is added to the code and the fault is still present, while the real cause has not been examined.",
        hint: "A delay changes when the line runs, not what it selects. Compare the selector text with the id in the markup before adding timing, because the mismatch is present in the file.",
        file: "javascript",
        detect: "setTimeout",
        detectableExample: "setTimeout(showStock, 500);",
      },
      {
        wrong: "a selector that matches nothing is safe, because the browser retries on the next frame.",
        symptom: "A second fault appears as a runtime error and the first one is still unresolved, so two causes are now mixed together.",
        hint: "A selector that matches nothing returns null and the next property access fails. Read the id from the markup and use exactly that string, so the lookup resolves before anything is assigned.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"']#(?!stock)[^\"']+[\"']",
        detectableExample: "document.querySelector(\"#totals\").textContent = \"Six items in stock\";",
      },
    ],
  },
  {
    lessonId: "ages-16-18-quality-accessibility",
    courseIds: ["ages-16-18"],
    concept: "An accessibility audit checks the paths a visitor takes rather than the appearance of the page, so it looks at names, alternatives, keyboard order and feedback.",
    make: "The learner repairs three barriers on a support page: a missing image description, an unbound label and a result that is not announced.",
    difficulty: 4,
    prerequisites: ["ages-16-18-forms-messages"],
    projectStep: "The project's audit becomes a repeatable list rather than a one-off opinion, which the final checkpoint records.",
    stages: {
      hook: {
        lead: "An audit is requested and the reviewer replies that the page looks accessible. Nothing was read with a keyboard, no image alternative was checked and no feedback region was found. The colours were measured and the fonts were measured. Which parts of the experience were never examined at all?",
        variants: {
          guided: "An audit is a set of paths through the page, not a set of measurements. Today you check the paths a keyboard visitor takes.",
          balanced: "Appearance is one visitor's experience. Names, alternatives and announcements belong to a different one, and both have to be checked.",
          independent: "Treat the audit as a list you can repeat on the next page, because an opinion cannot be repeated and a list can.",
        },
      },
      model: {
        lead: "<img src=\"dashboard.png\" alt=\"A dashboard showing three open tickets\"> replaces the picture with a description. <label for=\"newsletter\">Newsletter</label> binds the visible word to its field. <p id=\"feedback\" role=\"status\"></p> creates a region whose changes are announced without moving focus.",
        variants: {
          guided: "Three checks, three repairs: the image has a description, the label names its field, and the result has a region to speak in.",
          balanced: "Each repair removes a barrier for a visitor who cannot use the page the way it was designed, which is why the three sit in one audit.",
          independent: "The audit looks at what is missing rather than at what is present, because a barrier is invisible to the visitor who does not meet it.",
        },
      },
      build: {
        lead: "Work in the HTML file. Repair the image description first, then bind the label, then create the status region for the result.",
        variants: {
          guided: "Describe the image, add a for attribute matching the field's id, then add the status role to the result paragraph.",
          balanced: "Repair one barrier at a time and run the page, so each repair can be attributed to the experience it improves.",
          independent: "Decide what the image earns a description for before writing one, since a decorative image would need the opposite decision.",
        },
      },
      check: {
        lead: "Read the page without looking at it: the image should be announced with a useful description, the field should be named by its label, and the result region should be present and empty. Then reach the page with the keyboard and confirm the order makes sense.",
        variants: {
          guided: "Check the description is useful, the label is bound and the result region exists.",
          balanced: "Check the three repairs separately, because a page can pass two and still leave one visitor without a name for a field.",
          independent: "Confirm the description says something the surrounding text does not, since a description that repeats the caption adds nothing.",
        },
      },
      explain: {
        lead: "Now a different page: a support page with an undescribed image, an unbound label and a result paragraph that is never announced. No example open. Repair all three barriers and check the page with the keyboard.",
        variants: {
          guided: "The new page needs the same three repairs: a description, a bound label and a status region.",
          balanced: "Same audit, new page. Read what each element is for before deciding which barrier applies to it.",
          independent: "Work with no example open and decide from the page's purpose what each description should say.",
        },
      },
      transfer: {
        lead: "The project's audit is repeated at the final checkpoint, and any new image or field it gains has to pass the same three checks.",
        variants: {
          independent: "An audit performed once is a repair. An audit kept as a list is what stops the next page from reintroducing the same barriers.",
          guided: "Your project's pages will each pass the same three checks.",
          balanced: "The list is short enough to remember and specific enough to test.",
        },
      },
    },
    mastery: {
      freshTask: "A support page has an undescribed image, a label that is not bound to its field and a result paragraph that is never announced. Repair all three barriers so the page can be used with a keyboard and read out loud.",
      observable: "The image is announced with a useful description, the field is named by its bound label, and the result paragraph is present as a region that announces its changes.",
      reflection: "In your own words, what does an accessibility audit examine that a visual review of the page does not?",
      starterFiles: {
        html: "<img src=\"dashboard.png\">\n<label>Newsletter</label><input id=\"newsletter\">\n<p id=\"feedback\"></p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The image is announced with a useful description", pattern: "<img[^>]+alt=[\"'][^\"']{10,}[\"']" },
        { file: "html", label: "The label is bound to its field", pattern: "<label[^>]+for=[\"']newsletter[\"']" },
        { file: "html", label: "The result announces its changes", pattern: "<p[^>]+role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<img src=\"dashboard.png\" alt=\"A dashboard showing three open tickets\">\n<label for=\"newsletter\">Newsletter</label><input id=\"newsletter\">\n<p id=\"feedback\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "an image that sits beside text does not need a description of its own.",
        symptom: "A visitor who cannot see the picture hears nothing where the information was, so the sentence beside it reads as incomplete.",
        hint: "The text beside an image explains it and does not replace it. Add a description that states what the picture adds, so the information survives when the image does not.",
        file: "html",
        detect: "<img(?![^>]*\\balt=)[^>]*>",
        detectableExample: "<img src=\"dashboard.png\">",
      },
      {
        wrong: "a feedback region is only needed on a page that fetches data from a server.",
        symptom: "A result appears visually and is never announced, so a visitor using a screen reader has no way to know the action finished.",
        hint: "Any region whose text changes after an action needs to be announced, whether the data came from a server or was computed in the page. Add the status role to the result paragraph.",
        file: "html",
        detect: "^(?=[\\s\\S]*id=[\"']feedback[\"'])(?![\\s\\S]*role=[\"']status[\"'])",
        detectableExample: "<p id=\"feedback\"></p>",
      },
    ],
  },
  {
    lessonId: "ages-16-18-quality-release",
    courseIds: ["ages-16-18"],
    concept: "A release note states the purpose of the version, the behaviour that was tested and the limit that is still present.",
    make: "The learner writes change notes naming the project's purpose, two tested features and one known limitation.",
    difficulty: 3,
    prerequisites: ["ages-16-18-quality-accessibility"],
    projectStep: "The project gains its change notes section, which is the last item on the final checkpoint and the first thing a visitor reads when they want to know what changed.",
    stages: {
      hook: {
        lead: "A version is published with a list of features and nothing else. A visitor assumes their saved work is kept on a server, and it is kept in the browser on one device. Nothing in the release note was false. Which sentence was missing, and who needed it?",
        variants: {
          guided: "A release note says what the version does and what it does not do. Today you write both.",
          balanced: "The features describe an intention and the limitation describes the boundary. A note with only the first is a promise without an edge.",
          independent: "Treat the limitation as information for the next visitor rather than as a confession, because they need it before they rely on the feature.",
        },
      },
      model: {
        lead: "<section id=\"change-log\"><h2>Version 1.0</h2> names the version, <p>Tested: the status filter and the export button.</p> states behaviour that was actually exercised, and <p>Known limitation: the board keeps its filter only until the page is reloaded.</p> states the boundary.",
        variants: {
          guided: "Three parts: a heading with the version, a tested line with two named flows and a limitation line with one honest boundary.",
          balanced: "The tested line is a claim about behaviour rather than about code, so it should name something a person could try.",
          independent: "The limitation is the most useful sentence in the note, because it tells the next visitor where the feature stops working.",
        },
      },
      build: {
        lead: "Work in the HTML file. Create the section first, add the version heading, then the tested paragraph, then the limitation paragraph.",
        variants: {
          guided: "Add the section with its id, then the heading, then the two paragraphs in that order.",
          balanced: "Write the tested line from the work you actually performed, and the limitation from the one you decided not to fix yet.",
          independent: "Decide the limitation before writing the features, so the note is a boundary first and a description second.",
        },
      },
      check: {
        lead: "Read the note as a visitor. The purpose should be clear, at least two flows should be named as tested, and one limit should be stated. If every sentence describes a feature and none describes a limit, the note is still unfinished.",
        variants: {
          guided: "Check the version is named, two tested flows are listed and one limitation is stated.",
          balanced: "Check the tested line names something you could demonstrate rather than something the code merely contains.",
          independent: "Confirm the limitation is specific enough to be useful, because a vague boundary is the same as no boundary.",
        },
      },
      explain: {
        lead: "Now a different project: a status board with no change notes at all. No example open. Add a section that names the version, lists two tested flows and states one known limitation.",
        variants: {
          guided: "The new page needs the same four parts: a section, a version heading, a tested line and a limitation line.",
          balanced: "Same note, new project. Read the page's purpose before choosing which flows to name.",
          independent: "Work with no example open and write the limitation as something a future visitor should know before they depend on the feature.",
        },
      },
      transfer: {
        lead: "The project's change notes are updated with every release, and the note is what makes an honest claim about the mobile layout, the keyboard path and the data storage the project uses.",
        variants: {
          independent: "A release note that names its limits is more trustworthy than one that lists only features, because the reader can see where the thinking stopped.",
          guided: "Your project will carry change notes from its first release.",
          balanced: "The note is the shortest page of the project and the one a visitor reads first.",
        },
      },
    },
    mastery: {
      freshTask: "A status board has no change notes. Add a section that names the version, states the project's purpose, lists at least two tested flows and records one known limitation.",
      observable: "The page carries a change notes section with a version heading, a tested line naming real behaviour and a limitation line stating one honest boundary.",
      reflection: "In your own words, why does a known limitation belong in a release note, and who is it written for?",
      starterFiles: {
        html: "<main>\n  <h1>Status board</h1>\n  <!-- Describe this version in the notes. -->\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The notes sit in a section of their own", pattern: "id=[\"']change-log[\"']" },
        { file: "html", label: "The version is named in a heading", pattern: "<h2[\\s>][^<]*(?:Version|Release)[^<]*</h2>" },
        { file: "html", label: "The tested behaviour is listed", pattern: "Tested\\s*:" },
        { file: "html", label: "A limitation is stated", pattern: "Known limitation\\s*:" },
      ],
      workedSolution: {
        html: "<main>\n  <h1>Status board</h1>\n  <section id=\"change-log\">\n    <h2>Version 1.0</h2>\n    <p>Purpose: present the state of each service in one place.</p>\n    <p>Tested: the status filter and the export button.</p>\n    <p>Known limitation: the board keeps its filter only until the page is reloaded.</p>\n  </section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a release note only needs the list of features in the version.",
        symptom: "A visitor relies on a feature that stops working in a situation the note never mentioned.",
        hint: "A feature list describes an intention and says nothing about its edge. Add a limitation line naming the one boundary you already know about, so the reader meets it before they depend on the feature.",
        file: "html",
        detect: "^(?=[\\s\\S]*id=[\"']change-log[\"'])(?![\\s\\S]*Known limitation)",
        detectableExample: "<section id=\"change-log\"><p>Tested: the status filter.</p></section>",
      },
      {
        wrong: "unfinished work should be left out of the release note until it is complete.",
        symptom: "A placeholder note is published, and the reader cannot tell which parts of the version are finished.",
        hint: "Remove the placeholder rather than hiding it. Write a limitation line that states the real boundary of the version, because a note that admits a limit is more useful than one that admits nothing.",
        file: "html",
        detect: "(?:TODO|FIXME|unfinished|not finished)",
        detectableExample: "<p>Known limitation: TODO fix the export button.</p>",
      },
    ],
  },
];
