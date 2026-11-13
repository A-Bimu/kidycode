import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 13 to 15, the quality half of the remaining content batch.
 *
 * Four challenge lessons: debugging from evidence, the accessibility audit, the
 * privacy decision about a public credit, and the release note. These are the
 * lessons that leave the learner with evidence rather than a finished look, so
 * each script asks for something observable and something written down.
 */

export const teenQualityScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-quality-debug",
    courseIds: ["ages-13-15"],
    concept: "Debugging is a controlled investigation: compare the selector with the document, change one cause, then rerun the same test.",
    make: "The learner finds the selector that does not match the page and proves the repair by running it.",
    difficulty: 4,
    prerequisites: ["ages-13-15-javascript-functions"],
    projectStep: "The project's faults stop being mysteries, because every repair is followed by the same test that failed before it.",
    stages: {
      hook: {
        lead: "A score function runs and the label on the page never changes. There is no error message. The function looks right. Before rewriting anything, what single comparison would tell you where the fault is?",
        variants: {
          guided: "The code runs and nothing happens. Today you find the one line that does not match the page.",
          balanced: "A selector that finds nothing is silent. Comparing the selector with the HTML is the fastest evidence available.",
          independent: "Decide the layer you are testing before you change anything, so one run tells you something true.",
        },
      },
      model: {
        lead: "document.querySelector(\"#scorelabel\") finds nothing when the id is score-label. The repair is #score-label, and the evidence is the id attribute in the HTML written beside the selector in the script.",
        variants: {
          guided: "Read the two names side by side, character by character. One has a hyphen and the other does not.",
          balanced: "The browser never warns about a selector that matches nothing, so the comparison has to be made by hand.",
          independent: "Record the expected result and the actual result before the repair, because that pair is what proves the cause.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Read the id in the HTML, compare it with the selector, change only the selector, then run the page.",
        variants: {
          guided: "Fix the selector first and run the page. Change nothing else until the label moves.",
          balanced: "Change one thing, run the page, and keep the Expected and Actual comments in step with what you saw.",
          independent: "Write both comments before the repair, then confirm the run matches the expected line.",
        },
      },
      check: {
        lead: "Run the page again. The label must change. Then check your two comments describe what was true before the repair rather than what you hope to see.",
        variants: {
          guided: "Two checks: the label changes, and the comments record the expected and actual result.",
          balanced: "Confirm the retest is the same test you ran before, otherwise the repair is unproved.",
          independent: "Decide what evidence would convince someone else that the cause was the selector, and record that.",
        },
      },
      explain: {
        lead: "Now a different page: a quiz score page where the label never updates. No example open. Find the selector that does not match, repair it, record the expected and actual result, and run the function.",
        variants: {
          guided: "The new page has the same kind of fault. Compare the selector with the id, fix it, then run it.",
          balanced: "Same method, new names. Write the evidence before the repair.",
          independent: "Work with no example open and change exactly one thing per run.",
        },
      },
      transfer: {
        lead: "Every later repair in the project uses this method, which is why the release note asks for a failure, its evidence and its cause.",
        variants: {
          independent: "A bug report without the actual result is a guess, and a repair without a retest is a hope.",
          guided: "Your project's faults will all be found this way.",
          balanced: "One change, one run, one recorded result is the whole method.",
        },
      },
    },
    mastery: {
      freshTask: "A quiz score page never updates. Find the selector that does not match the HTML, repair it, write down the expected and actual result, and run the function.",
      observable: "Running the page shows the score in the label, and the comments record what was expected before the repair.",
      reflection: "In your own words, what evidence showed that the selector, rather than the function, was the cause?",
      starterFiles: {
        html: "<p id=\"score-label\">No score</p>",
        css: "",
        javascript: "function recordScore() {\n  document.querySelector(\"#scorelabel\").textContent = \"7 out of 10\";\n}\n// Record the expected and actual result, then run the function\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The selector matches the id in the HTML", pattern: "querySelector\\(\\s*[\"']#score-label[\"']" },
        { file: "javascript", label: "The expected result is recorded", pattern: "Expected\\s*:" },
        { file: "javascript", label: "The actual result is recorded", pattern: "Actual\\s*:" },
        { file: "javascript", label: "The function is called after the repair", pattern: "recordScore\\s*\\(\\s*\\)\\s*;" },
      ],
      workedSolution: {
        html: "<p id=\"score-label\">No score</p>",
        css: "",
        javascript: "function recordScore() {\n  document.querySelector(\"#score-label\").textContent = \"7 out of 10\";\n}\n// Expected: the label reads 7 out of 10\n// Actual: the label stayed at No score\nrecordScore();\n",
      },
    },
    misconceptions: [
      {
        wrong: "the function must be broken, so it needs rewriting.",
        symptom: "Time is spent rewriting working code while the selector still matches nothing.",
        hint: "Compare the selector with the id in the HTML character by character. The id carries a hyphen, so #score-label is the selector that matches.",
        file: "javascript",
        detect: "document\\.querySelector\\(\\s*[\"']#scorelabel[\"']",
        detectableExample: "document.querySelector(\"#scorelabel\").textContent = \"7 out of 10\";",
      },
      {
        wrong: "the retest can be skipped once the code looks correct.",
        symptom: "The repair is claimed but never run, so a second fault can hide behind the first.",
        hint: "A repair is only proved by running the same page again. Add the call after the comments and confirm the label changes.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*Expected\\s*:)(?![\\s\\S]*recordScore\\s*\\(\\s*\\)\\s*;)",
        detectableExample: "// Expected: the label reads 7 out of 10\n// Actual: the label stayed at No score",
      },
    ],
  },
  {
    lessonId: "ages-13-15-quality-accessibility",
    courseIds: ["ages-13-15"],
    concept: "An accessibility audit checks that the same information reaches every visitor: described images, connected labels and announced results.",
    make: "The learner repairs three barriers on a rehoming page: an undescribed photograph, an unconnected label and a silent result.",
    difficulty: 3,
    prerequisites: ["ages-13-15-forms-messages"],
    projectStep: "The project passes its own audit before the release note is written, so the checklist has evidence behind it.",
    stages: {
      hook: {
        lead: "A rehoming page looks complete. The photograph of the dog says nothing to a screen reader, the filter label does not activate its field, and the result text changes silently. Three small repairs, one shared cause. What is it?",
        variants: {
          guided: "Three parts of the page carry information that only some visitors receive. Today you make all three reach everyone.",
          balanced: "Every barrier here is a missing connection rather than missing content.",
          independent: "Decide what information is conveyed visually only, and give each piece an equivalent that a machine can read.",
        },
      },
      model: {
        lead: "alt on the image describes its purpose, for on the label names its field, and role=\"status\" on the result paragraph announces a change. Each attribute carries meaning that the visual design already carried.",
        variants: {
          guided: "One attribute per barrier, and each one names something an id, a description or a region for changes.",
          balanced: "The attributes are the equivalent of the visual information, not decoration on top of it.",
          independent: "The audit is about equivalence: for each piece of information, what reaches a visitor who cannot see the screen?",
        },
      },
      build: {
        lead: "Work in the HTML file. Repair one barrier at a time and run the preview after each, so you can say which fix produced which change.",
        variants: {
          guided: "Describe the picture first, then connect the label, then mark the result region.",
          balanced: "Work in reading order down the page, which is the order a screen reader will follow.",
          independent: "Decide all three repairs before you type, then apply them and audit the page once.",
        },
      },
      check: {
        lead: "Focus each control in turn and read the page as a machine would: the photograph should be described, the label should activate its field, and the result should have a region of its own.",
        variants: {
          guided: "Check three things: the description, the connected label and the announced result.",
          balanced: "Test each repair with the input it is meant for, rather than reading the code back.",
          independent: "Confirm the description is specific enough to be useful if the picture were missing.",
        },
      },
      explain: {
        lead: "Now a different page: a rehoming page with an undescribed photograph, a filter field whose label is not connected and a result message that is not announced. No example open. Repair all three.",
        variants: {
          guided: "The new page has the same three barriers. Repair one at a time.",
          balanced: "Same audit, new page. Decide which attribute belongs on which element.",
          independent: "Work with no example open and choose the id names yourself.",
        },
      },
      transfer: {
        lead: "The project's release checklist includes this audit, so the same three checks run before every release rather than once.",
        variants: {
          independent: "An audit is a habit rather than a task, because new content reopens the same barriers.",
          guided: "Your project will be audited this way before it is released.",
          balanced: "The three repairs cover the barriers most small sites still have.",
        },
      },
    },
    mastery: {
      freshTask: "A rehoming page shows a photograph of a dog, a filter field and a result message. Describe the photograph, connect the filter label to its field and make the result message a region that is announced.",
      observable: "The photograph announces its purpose, the label activates its field, and the result text has a region of its own.",
      reflection: "In your own words, why is missing equivalent information a defect rather than a missing feature?",
      starterFiles: {
        html: "<h1>Rehoming</h1>\n<img src=\"dog.jpg\">\n<label>Filter by animal</label>\n<input id=\"animal-filter\">\n<p id=\"animal-result\"></p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The photograph describes its purpose", pattern: "<img[^>]+alt=[\"'][^\"']{12,}[\"']" },
        { file: "html", label: "The filter label is connected to its field", pattern: "<label[^>]+for=[\"']animal-filter[\"']" },
        { file: "html", label: "The result is a status region", pattern: "role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<h1>Rehoming</h1>\n<img src=\"dog.jpg\" alt=\"A brown dog waiting beside an empty bowl\">\n<label for=\"animal-filter\">Filter by animal</label>\n<input id=\"animal-filter\">\n<p id=\"animal-result\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "alternative text should name what the file is.",
        symptom: "The description repeats the file name or the word photo, so it adds nothing.",
        hint: "Describe what the picture adds rather than that it exists. Say what the animal is doing, as you would to someone on the phone.",
        file: "html",
        detect: "alt=[\"'][^\"']*(?:photo|image|picture)[^\"']*[\"']",
        detectableExample: "<img src=\"dog.jpg\" alt=\"dog photo\">",
      },
      {
        wrong: "the visible label text already tells the browser which field it belongs to.",
        symptom: "Choosing the label does nothing and the field is announced without a name.",
        hint: "Visibility is not the connection. Give the label a for attribute holding the field's id, so both a mouse and a screen reader use the link.",
        file: "html",
        detect: "<label(?![^>]*\\bfor=)[^>]*>",
        detectableExample: "<label>Filter by animal</label>",
      },
    ],
  },
  {
    lessonId: "ages-13-15-quality-security",
    courseIds: ["ages-13-15"],
    concept: "A published page is public, so a credit uses a nickname and the simplest contact route rather than personal identifiers.",
    make: "The learner replaces a full name, school and phone number with a safe credit.",
    difficulty: 3,
    prerequisites: ["ages-13-15-quality-accessibility"],
    projectStep: "The project's footer becomes safe to publish, which is the last thing that has to be true before the site is shared.",
    stages: {
      hook: {
        lead: "The footer says Made by a full name, a school and a phone number. The page works perfectly. Why is that paragraph the riskiest line on the site?",
        variants: {
          guided: "A page on the internet can be read by anyone. Today you change the footer so it proves the work without identifying a person.",
          balanced: "The information in a credit is public forever, so the question is what is needed rather than what is available.",
          independent: "Decide the smallest credit that still shows authorship, and remove everything that identifies a place or a person.",
        },
      },
      model: {
        lead: "<footer><p>Site by SkyCoder. Built with HTML, CSS and JavaScript.</p></footer> uses a nickname and names the technologies, which is all a credit needs to do.",
        variants: {
          guided: "A nickname and the three languages used. No full name, no school, no phone number, no address.",
          balanced: "The technologies are the interesting part for a reader. The identity is the part that cannot be taken back.",
          independent: "Treat the footer as a permanent public statement, because search engines copy it and caches keep it.",
        },
      },
      build: {
        lead: "Work in the HTML file. Delete the personal details first, run the preview, then write the replacement credit.",
        variants: {
          guided: "Remove the full name, the school and the phone number, then write the nickname and the three technologies.",
          balanced: "Rewrite rather than edit piece by piece, so nothing personal is left behind in the markup.",
          independent: "Decide the nickname before you type, then read the whole page again for the same details elsewhere.",
        },
      },
      check: {
        lead: "Read the whole page, not only the footer. Any full name, school, phone number, photograph of a uniform or exact location is a detail to remove before the page is shared.",
        variants: {
          guided: "Check the footer, then scan the rest of the page for the same details.",
          balanced: "Look for place names and contact details as well as names.",
          independent: "Decide what a stranger could do with each remaining detail, and remove the ones that identify a person.",
        },
      },
      explain: {
        lead: "Now a different page: a game review site whose footer credits a full name, a school and a phone number. No example open. Replace it with a credit that proves the work and removes the personal details.",
        variants: {
          guided: "The new footer has the same problem. Remove the personal details and add the nickname and the three technologies.",
          balanced: "Same decision, new wording. Keep the technologies and drop the identity.",
          independent: "Work with no example open and decide how the author should be named.",
        },
      },
      transfer: {
        lead: "Every page the project publishes uses this footer, so one safe credit protects the whole site.",
        variants: {
          independent: "A footer is the right place for a professional name or a nickname, and never for an address or a phone number.",
          guided: "Your project's footer will name the technologies and a nickname only.",
          balanced: "Authorship and identity are different things, and a published page only needs the first.",
        },
      },
    },
    mastery: {
      freshTask: "A game review site credits its author by full name, school and phone number. Replace the footer credit with a nickname and the three technologies, and remove the personal details.",
      observable: "The footer names HTML, CSS and JavaScript, and no school name or phone number remains on the page.",
      reflection: "In your own words, what does the reader actually need from a credit, and what does the author risk by adding more?",
      starterFiles: {
        html: "<footer>\n  <p>Made by Amina Otieno, Riverside Secondary School. Call 0712 345 678.</p>\n</footer>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The credit names the three technologies", pattern: "<footer[\\s\\S]*HTML[\\s\\S]*CSS[\\s\\S]*JavaScript[\\s\\S]*</footer>" },
        { file: "html", label: "No school is named in the credit", pattern: "^(?![\\s\\S]*(?:School|Academy|College))[\\s\\S]*$" },
        { file: "html", label: "No phone number is published", pattern: "^(?![\\s\\S]*(?:\\+\\d|0\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}))[\\s\\S]*$" },
      ],
      workedSolution: {
        html: "<footer>\n  <p>Site by SkyCoder. Built with HTML, CSS and JavaScript.</p>\n</footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a full name and school make the credit more trustworthy.",
        symptom: "The published page carries a name, a school and a way to contact a young person directly.",
        hint: "A nickname is enough to show authorship. Keep the personal details in your account, not on a page anyone can copy.",
        file: "html",
        detect: "(?:Made|Built|Created) by [A-Z][a-z]+ [A-Z][a-z]+",
        detectableExample: "<p>Made by Amina Otieno.</p>",
      },
      {
        wrong: "a phone number is fine because only people who know the school will see it.",
        symptom: "The contact details are indexed and copied within days of publishing.",
        hint: "A published page is public whatever the intention was. Remove the phone number and any other contact detail and let the project carry the credit.",
        file: "html",
        detect: "(?:\\+\\d|0\\s?\\d{3}\\s?\\d{3}\\s?\\d{3})",
        detectableExample: "<p>Call 0712 345 678 to book a stall.</p>",
      },
    ],
  },
  {
    lessonId: "ages-13-15-quality-release",
    courseIds: ["ages-13-15"],
    concept: "A release note records the purpose, the behaviours that were tested and one honest limitation of the current version.",
    make: "The learner writes release notes for a revision timetable, with evidence rather than a promise.",
    difficulty: 3,
    prerequisites: ["ages-13-15-quality-security"],
    projectStep: "The project ends with a note a reader can trust, which is what the final checkpoint asks for.",
    stages: {
      hook: {
        lead: "A page says everything works. A visitor submits an empty form, the page accepts it, and nothing warns them. The claim was not a lie, it was a guess. What would have made the note useful?",
        variants: {
          guided: "A release note says what was tested, not only that the project is finished. Today you write the version your reader can check.",
          balanced: "Evidence beats confidence. Name the behaviour you exercised and the one you did not finish.",
          independent: "A note is a contract with the next person. Decide what they would need to know before trusting the page.",
        },
      },
      model: {
        lead: "A section with id=\"timetable-notes\" holds a Version 1 heading, a line beginning Tested: and a line beginning Known limitation:. Each line names something specific.",
        variants: {
          guided: "Three parts: what the page is for, what was tested, and what it does not do yet.",
          balanced: "Vague evidence is worse than none, so name the flows you exercised rather than how confident you feel.",
          independent: "The limitation is the most valuable line, because it is the one a reader cannot discover without being told.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the section and its heading first, then the tested line, then the limitation. Run the preview between changes.",
        variants: {
          guided: "Write the heading, then Tested with two real behaviours, then Known limitation with one honest gap.",
          balanced: "Write the evidence lines from work you actually did rather than from what you intended.",
          independent: "Decide the limitation before you type, because it should be the thing you would want told to you.",
        },
      },
      check: {
        lead: "Read the note as a stranger. Every claim should name something you actually tested, and the limitation should be one you know about.",
        variants: {
          guided: "Check three things: the heading, the tested line and the limitation line.",
          balanced: "Check each claim against a test you really ran, and cut the ones you did not.",
          independent: "Confirm the note names a tested flow and a limit, in that order, so a reader can weigh the version.",
        },
      },
      explain: {
        lead: "Now a different page: a revision timetable site that is ready to hand in. No example open. Add a release notes section that states the purpose, two tested behaviours and one known limitation.",
        variants: {
          guided: "The new page needs the same three lines under a version heading of its own.",
          balanced: "Same structure, new project. Read what the page does before writing the tested line.",
          independent: "Work with no example open and choose which limitation is worth naming.",
        },
      },
      transfer: {
        lead: "The final project checkpoint asks for exactly this note, so the release lesson is the checklist written down.",
        variants: {
          independent: "Documenting a version is how a project becomes reviewable by anybody other than its author.",
          guided: "Your project will end with release notes like these.",
          balanced: "One honest limitation is worth more than a page of confident wording.",
        },
      },
    },
    mastery: {
      freshTask: "A revision timetable site is ready to hand in. Add a release notes section that states the purpose, two tested behaviours and one known limitation.",
      observable: "A reader can tell what the site does, what was tested and what the current version does not do.",
      reflection: "In your own words, why does a known limitation make a release note more trustworthy?",
      starterFiles: {
        html: "<main>\n  <h1>Revision timetable</h1>\n  <p>Built for my class.</p>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The notes have their own named section", pattern: "id=[\"']timetable-notes[\"']" },
        { file: "html", label: "The tested behaviours are listed", pattern: "Tested\\s*:" },
        { file: "html", label: "A known limitation is stated", pattern: "Known limit(?:ation)?\\s*:" },
      ],
      workedSolution: {
        html: "<main>\n  <h1>Revision timetable</h1>\n  <p>Built for my class.</p>\n  <section id=\"timetable-notes\">\n    <h2>Version 1</h2>\n    <p>Tested: adding a subject and switching to a phone-sized layout.</p>\n    <p>Known limitation: planning is not saved between visits.</p>\n  </section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a release note can claim that the project is finished.",
        symptom: "The first visitor to try an untested path finds the claim was never checked.",
        hint: "Name the boundary instead of claiming perfection. One honest limitation tells a reader more than a promise that everything works.",
        file: "html",
        detect: "(?:everything works|no (?:known )?(?:issues|bugs)|perfect)",
        detectableExample: "<p>Everything works and there are no known issues.</p>",
      },
      {
        wrong: "vague evidence is enough because the testing was done by hand.",
        symptom: "The note names no behaviour, so the next reader has to repeat all of the testing.",
        hint: "Describe the exact behaviours you exercised, such as submitting an empty order or switching to a phone-sized layout.",
        file: "html",
        detect: "Tested\\s*:\\s*(?:it works|everything|all of it)",
        detectableExample: "<p>Tested: it works.</p>",
      },
    ],
  },
];
