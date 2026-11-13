import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The adults remaining-content batch, quality module.
 *
 * The register is balanced, aimed at an adult learner finishing something for
 * work: debug from evidence rather than guesswork, publish without personal
 * details, and hand over with honest release notes. Independent wording is
 * available for a learner who asks for it.
 */

export const practicalQualityScripts: LessonScript[] = [
  {
    lessonId: "adults-quality-debug",
    courseIds: ["adults"],
    concept: "Debugging is a controlled investigation: the expected result, the actual result and the smallest reproducible case give better evidence than changing lines at random.",
    make: "The learner repairs a wrong selector and a missing call, and records the expected and actual result.",
    difficulty: 3,
    prerequisites: ["adults-interaction-storage"],
    projectStep: "The project's faults get found by evidence, so each repair is a decision rather than a guess.",
    stages: {
      hook: {
        lead: "A status line stays blank. Three lines are changed at once and the line starts working, but nobody knows which change fixed it. What was lost?",
        variants: {
          guided: "Changing several lines at once hides which one caused the fix.",
          balanced: "A repair you cannot explain is a repair you cannot repeat when the fault returns.",
          independent: "Treat the fault as a claim to test, not a mess to clear up. Record what you expected before you change anything.",
        },
      },
      model: {
        lead: "Expected: the status reads Online. Actual: it stays Offline. Check: the selector says #online but the HTML id is presence. Repair: use #presence, then retest.",
        variants: {
          guided: "Write what you expected, what happened, and the smallest case that shows it.",
          balanced: "The selector and the HTML id are compared character by character to find the mismatch.",
          independent: "Fix one cause, rerun the same test and record the result before touching anything else.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Compare the selector with the HTML id, fix one cause, record the evidence in comments and run the function.",
        variants: {
          guided: "Fix the selector first, then call the function, then record the expected and actual result.",
          balanced: "Repair one cause, add the evidence comments, then run the function and check.",
          independent: "Decide the expected result before you change anything, so the repair can be judged against it.",
        },
      },
      check: {
        lead: "Rerun the same test after the repair. The expected result must now match the actual result, and the comment must say so.",
        variants: {
          guided: "Check the label shows the repaired text and that both comments are present.",
          balanced: "Confirm the function runs and the selector matches the id in the HTML.",
          independent: "Verify only the intended change was made, so the result can be attributed to it.",
        },
      },
      explain: {
        lead: "Now a page whose label should read Online but stays Offline. The selector points at an id the page does not use and the function is never called. Repair both and record the expected and actual result. No example open.",
        variants: {
          guided: "The new page has the same two faults: a wrong selector and a missing call.",
          balanced: "Same two repairs on the new page, with the evidence recorded in comments.",
          independent: "Work with no example open and write the evidence in your own words.",
        },
      },
      transfer: {
        lead: "Every fault the project develops later is found the same way: expected, actual, smallest case, one repair, retest.",
        variants: {
          guided: "Every fault you find in the project is recorded before it is repaired.",
          balanced: "Evidence-based repairs are what keep the project from developing the same fault twice.",
          independent: "Keep the record short enough to write on every repair, so the habit survives a busy day.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a label that should read Online but stays Offline. The selector points at an id the page does not use and the function is never called. Repair both and record the expected and actual result.",
      observable: "The label shows Online, the selector matches the HTML id, and the function runs.",
      reflection: "In your own words, why change one cause at a time when debugging?",
      starterFiles: {
        html: "<p id=\"presence\">Offline</p>",
        css: "",
        javascript: "function showOnline() {\n  document.querySelector(\"#online\").textContent = \"Online\";\n}\n// Record evidence and run the function\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The selector matches the page id", pattern: "querySelector\\(\\s*[\"']#presence[\"']" },
        { file: "javascript", label: "The function is called", pattern: "(?<!function\\s)showOnline\\s*\\(\\s*\\)" },
        { file: "javascript", label: "The expected result is recorded", pattern: "Expected\\s*:" },
        { file: "javascript", label: "The actual result is recorded", pattern: "Actual\\s*:" },
      ],
      workedSolution: {
        html: "<p id=\"presence\">Offline</p>",
        css: "",
        javascript: "function showOnline() {\n  document.querySelector(\"#presence\").textContent = \"Online\";\n}\n// Expected: the label reads Online\n// Actual: it showed Offline\nshowOnline();\n",
      },
    },
    misconceptions: [
      {
        wrong: "several changes at once speed up the repair.",
        symptom: "The fault disappears but the cause is unknown, so the same mistake returns somewhere else.",
        hint: "Change one cause, rerun the same test and record the result. A repair you cannot explain is a repair you cannot repeat.",
        file: "javascript",
        detect: "^(?![\\s\\S]*Expected\\s*:)[\\s\\S]*querySelector",
        detectableExample: "document.querySelector(\"#presence\").textContent = \"Online\";",
      },
      {
        wrong: "the selector text is close enough to the id.",
        symptom: "The selector returns null and the next line throws, because no element carries that id.",
        hint: "Compare the selector with the HTML id exactly. An id that differs by one letter matches nothing and fails silently until it is used.",
        file: "javascript",
        detect: "querySelector\\(\\s*[\"']#online[\"']",
        detectableExample: "document.querySelector(\"#online\")",
      },
    ],
  },
  {
    lessonId: "adults-quality-security",
    courseIds: ["adults"],
    concept: "A public page should show the work without publishing identifying details, so a credit names a nickname and the technologies instead of a full name or a place.",
    make: "The learner writes a footer credit that is safe to publish.",
    difficulty: 2,
    prerequisites: ["adults-quality-debug"],
    projectStep: "The project's footer credits the work with a nickname and the three technologies, and carries no personal details.",
    stages: {
      hook: {
        lead: "A page is ready to share, and its footer says Built by and a full name, a school and a home town. Nothing is broken. Why is that a problem?",
        variants: {
          guided: "A credit only needs to describe the work, not identify the person behind it.",
          balanced: "The page will be public, so anything in the footer can be read by anyone who finds it.",
          independent: "Treat every published word as permanent and searchable. Decide what belongs before you share the link.",
        },
      },
      model: {
        lead: "<footer><p>Built by SkyCoder using HTML, CSS and JavaScript.</p></footer>. A nickname and the technologies are enough to credit the work.",
        variants: {
          guided: "Write the credit inside the footer, name the three technologies and leave out anything that identifies a person.",
          balanced: "A nickname names the work and the technologies show what it is built with, which is all a credit needs.",
          independent: "Review the credit as a stranger would, and remove anything you would not want a stranger to keep.",
        },
      },
      build: {
        lead: "Work in the HTML file. Write the credit inside the footer, name the three technologies and leave out anything that identifies a person.",
        variants: {
          guided: "Start with Built by and a nickname, then name the three technologies.",
          balanced: "Write the credit in the footer and remove any names, schools or places.",
          independent: "Decide what the credit is for before writing it, so nothing extra creeps in.",
        },
      },
      check: {
        lead: "Read the footer as a stranger. Does it credit the work without telling you where the person lives or studies?",
        variants: {
          guided: "Check the footer names the three technologies and no personal details.",
          balanced: "Confirm the credit still reads well with every identifying detail removed.",
          independent: "Verify nothing in the credit could locate or contact a real person.",
        },
      },
      explain: {
        lead: "Now a shared portfolio that needs a footer credit. Add a footer that names a nickname and the three technologies, and leaves out any personal details. No example open.",
        variants: {
          guided: "The new page needs the same safe credit in its footer.",
          balanced: "Same credit on the new page: a nickname, the three technologies, no personal details.",
          independent: "Work with no example open and choose the nickname yourself.",
        },
      },
      transfer: {
        lead: "Every page the project publishes carries a credit that describes the work and identifies no one.",
        variants: {
          guided: "Every page you publish from the project uses a safe credit.",
          balanced: "A safe credit is what lets the project be shared without exposing anyone.",
          independent: "Keep the credit about the work, so it survives being copied and re-posted.",
        },
      },
    },
    mastery: {
      freshTask: "A shared portfolio needs a footer credit. Add a footer that names a nickname and the three technologies, and leaves out any personal details.",
      observable: "The footer credits the work with a nickname and the three technologies, and names no real person, school or place.",
      reflection: "In your own words, what makes a public credit safe to share?",
      starterFiles: {
        html: "<main><h1>My portfolio</h1></main>\n<footer><!-- Add a safe credit --></footer>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The credit sits in a footer", pattern: "<footer[\\s>][\\s\\S]*Built by" },
        { file: "html", label: "The credit names the three technologies", pattern: "<footer[\\s\\S]*HTML[\\s\\S]*CSS[\\s\\S]*JavaScript[\\s\\S]*</footer>" },
      ],
      workedSolution: {
        html: "<main><h1>My portfolio</h1></main>\n<footer><p>Built by WebStarter using HTML, CSS and JavaScript.</p></footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a full name makes the work look more professional.",
        symptom: "The published page ties a real person to a location or a school, which is more than the work needs.",
        hint: "Use a nickname and name the technologies instead. A credit is meant to describe the work, not to identify the person behind it.",
        file: "html",
        detect: "(?:School|Academy|Road|Estate|Street)\\b",
        detectableExample: "<p>Built by Amina at Riverside School, Nairobi</p>",
      },
      {
        wrong: "personal details can stay if they are small.",
        symptom: "A phone number or an exact location is published with the work and can be found by anyone.",
        hint: "Remove anything that identifies a person: full names, schools, addresses, phone numbers. If the credit still reads well without it, it was not needed.",
        file: "html",
        detect: "(?:\\+?\\d[\\d\\s-]{7,}\\d|@[\\w.-]+\\.\\w+)",
        detectableExample: "<p>Contact me on 0712 345 678</p>",
      },
    ],
  },
  {
    lessonId: "adults-quality-release",
    courseIds: ["adults"],
    concept: "A release note states what the project does, what was tested and one honest limitation, so the next person knows the current boundary.",
    make: "The learner writes a release note with a version heading, a tested section and a known limitation.",
    difficulty: 3,
    prerequisites: ["adults-quality-security"],
    projectStep: "The project ends with release notes that record what works and what is deliberately left out.",
    stages: {
      hook: {
        lead: "A project is handed over with no note. The next person asks which features were tested and what does not work yet. What should have been written down?",
        variants: {
          guided: "A finished project should say what was tested and what it does not do yet.",
          balanced: "A note that only lists features tells the next person nothing about the limits.",
          independent: "Treat a limitation as information, not an admission. The next person needs it to make decisions.",
        },
      },
      model: {
        lead: "<section id=\"release-notes\"><h2>Version 1</h2><p>Tested: the enquiry form and the phone layout.</p><p>Known limitation: saved data stays on this device.</p></section>. Tested work and an honest boundary.",
        variants: {
          guided: "Create the release-notes section, add a version heading, list two tested features and name one limitation.",
          balanced: "The tested section names real flows and the limitation names a real boundary.",
          independent: "Write concrete evidence rather than a claim of completeness.",
        },
      },
      build: {
        lead: "Work in the HTML file. Create the release-notes section, add a version heading, list two tested features and name one limitation.",
        variants: {
          guided: "Add the section first, then the version heading, then the tested and limitation lines.",
          balanced: "Create the section, then name the tested flows and one limitation.",
          independent: "Decide the limitation before you write the note, so it reflects the real state of the project.",
        },
      },
      check: {
        lead: "Read the note as a stranger. You should know what was tested and what the current version does not do.",
        variants: {
          guided: "Check the section, the version heading, the tested line and the limitation are all present.",
          balanced: "Confirm the tested line names real flows and the limitation names a real boundary.",
          independent: "Verify a reader could repeat the tests from what you wrote.",
        },
      },
      explain: {
        lead: "Now a services website ready to hand over. Add release notes with a version heading, at least two tested features and one known limitation. No example open.",
        variants: {
          guided: "The new page needs the same four parts in its release notes.",
          balanced: "Same four parts on the new page, in the same order.",
          independent: "Work with no example open and write the tested flows and the limitation yourself.",
        },
      },
      transfer: {
        lead: "Every project the learner finishes later ends with release notes, so the boundary of each version is written down.",
        variants: {
          guided: "Every project you finish gets release notes with a limitation.",
          balanced: "An honest note is what lets the next person pick up the project without guessing.",
          independent: "Keep the note short enough to write on every release, so the habit survives a deadline.",
        },
      },
    },
    mastery: {
      freshTask: "A services website is ready to hand over. Add release notes with a version heading, at least two tested features and one known limitation.",
      observable: "The note names what was tested and states one limitation, so a reader knows the boundary of the current version.",
      reflection: "In your own words, why is an honest limitation more useful than a claim that everything works?",
      starterFiles: {
        html: "<main><h1>Services</h1><!-- Add release notes --></main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "There is a release notes section", pattern: "id=[\"']release-notes[\"']" },
        { file: "html", label: "Tested work is named", pattern: "Tested\\s*:" },
        { file: "html", label: "A limitation is named", pattern: "Known limit(?:ation)?\\s*:" },
        { file: "html", label: "There is a version heading", pattern: "<h2[\\s>][^<]*(?:Version|Release)[^<]*</h2>" },
      ],
      workedSolution: {
        html: "<main>\n  <h1>Services</h1>\n  <section id=\"release-notes\">\n    <h2>Version 1</h2>\n    <p>Tested: the enquiry form and the phone layout.</p>\n    <p>Known limitation: saved data stays on this device.</p>\n  </section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the release note can say that everything works.",
        symptom: "A limitation that is known is left out, so the next person trusts a boundary that does not exist.",
        hint: "Name one thing the current version does not do. An honest boundary is more useful than a claim of completeness.",
        file: "html",
        detect: "^(?![\\s\\S]*Known limit)[\\s\\S]*Tested\\s*:",
        detectableExample: "<p>Tested: form validation.</p>",
      },
      {
        wrong: "testing can be described in general terms.",
        symptom: "The note says it was checked but not what was checked, so it gives the next person nothing to repeat.",
        hint: "Name the flows you tested, such as the enquiry form and the phone layout. A vague claim cannot be verified or repeated.",
        file: "html",
        detect: "Tested\\s*:\\s*(?:everything|all|it works)",
        detectableExample: "<p>Tested: everything works.</p>",
      },
    ],
  },
];
