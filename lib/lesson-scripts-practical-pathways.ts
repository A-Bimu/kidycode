import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The practical batch of the V3 lesson journey: the adult pathway.
 *
 * The default register here is balanced. The wording assumes an adult learner
 * building something real for work or for a community: an accessible form, a
 * panel that spaces itself correctly, and input that is checked before it is
 * accepted. Independent wording is available for a learner who asks for it.
 */

export const practicalPathwayScripts: LessonScript[] = [
  {
    lessonId: "adults-forms-labels",
    courseIds: ["adults"],
    concept: "A label is connected to its control by matching the label's for attribute with the control's id, so the two are linked for assistive technology and for every pointer.",
    make: "The learner connects two visible labels to their inputs so the field names are announced and clickable.",
    difficulty: 2,
    prerequisites: ["adults-structure-landmarks"],
    projectStep: "The project's enquiry form has fields a screen reader can name instead of two unlabelled boxes.",
    stages: {
      hook: {
        lead: "Two labels sit above two inputs and look perfectly correct. Read the markup: nothing connects them. What breaks first when the labels are not actually attached?",
        variants: {
          guided: "A label that only looks attached is not attached. The connection is written in the attributes.",
          balanced: "Visually next to is not the same as programmatically linked, and only the second one survives a screen reader or a click on the text.",
          independent: "This is a name to control relationship. Decide who owns the name, then make the link explicit in both directions.",
        },
      },
      model: {
        lead: "<label for=\"topic\">Topic</label> <input id=\"topic\">. The for value and the id value are the same string, and that match is the whole connection.",
        variants: {
          guided: "Give the input an id and give the label a for with exactly the same word.",
          balanced: "The for attribute points at an id. If the two ever drift apart, the link silently disappears.",
          independent: "A click on the label now focuses the control, which is also the cheapest way to check the link has survived an edit.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each input an id, then add the matching for attribute to its label.",
        variants: {
          guided: "Change one field first and click its label in the preview. The cursor should land in the input.",
          balanced: "Give each input an id, then add the matching for attribute to its label and test the pair.",
          independent: "Decide the ids before you type them, then check no two controls share one.",
        },
      },
      check: {
        lead: "Click each label. The matching input must take focus, and a screen reader must read the label text as the name of the field.",
        variants: {
          independent: "Check that no two controls share an id, because a duplicate breaks both links at once.",
          guided: "Click each label in the preview. The matching field should take the cursor.",
          balanced: "Click both labels and confirm each one focuses its own field.",
        },
      },
      explain: {
        lead: "Now a different form: connect the topic and budget labels to their inputs. No example open.",
        variants: {
          guided: "The new form has two fields. Give each input an id and connect its label.",
          balanced: "Same two steps on the new form: an id on the control, a for on the label.",
          independent: "Work with no example open and choose the ids yourself, keeping them unique.",
        },
      },
      transfer: {
        lead: "Every field the project adds later gets the same treatment, including the ones you add in a hurry.",
        variants: {
          independent: "Treat a placeholder as a hint, never as the name of a field. The label carries the name.",
          guided: "Every field you add to the project gets a label that is connected.",
          balanced: "Connected labels are what make a form usable without a mouse.",
        },
      },
    },
    mastery: {
      freshTask: "A form shows a Topic label over a text input and a Budget label over a number input. Connect each label to its own input so a click on the text focuses the field.",
      observable: "Clicking either label moves the cursor into its input, and the two ids are different.",
      reflection: "In your own words, what does the for attribute point at, and what happens if it points at nothing?",
      starterFiles: {
        html: "<form>\n  <label>Topic</label><input type=\"text\">\n  <label>Budget</label><input type=\"number\">\n</form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The topic label points at the topic input", pattern: "<label[^>]+for=[\"']topic[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']topic[\"']" },
        { file: "html", label: "The budget label points at the budget input", pattern: "<label[^>]+for=[\"']budget[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']budget[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"topic\">Topic</label><input type=\"text\" id=\"topic\">\n  <label for=\"budget\">Budget</label><input type=\"number\" id=\"budget\">\n</form>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the label is connected because it sits next to the input.",
        symptom: "The field looks labelled, but nothing is announced as its name and the label text is not clickable.",
        hint: "Add a for attribute to the label and an id to the input, using the same word in both places. Position on the page never creates the link.",
        file: "html",
        detect: "<label(?![^>]*\\bfor=)[^>]*>",
        detectableExample: "<label>Topic</label>",
      },
      {
        wrong: "the id belongs on the label rather than on the input.",
        symptom: "The label has a name of its own and the control still has none, so the link cannot be made.",
        hint: "The id names the control, and the label's for points at it. Move the id onto the input and put for on the label.",
        file: "html",
        detect: "<label[^>]+id=",
        detectableExample: "<label id=\"topic\">Topic</label>",
      },
    ],
  },
  {
    lessonId: "adults-quality-accessibility",
    courseIds: ["adults"],
    concept: "Accessibility work is a short audit: useful alt text for meaning, a real connection between a label and its control, and live regions for text that changes.",
    make: "The learner repairs three common barriers on one page and can say what each repair changed.",
    difficulty: 3,
    prerequisites: ["adults-forms-labels"],
    projectStep: "The project's images, search box and result line all become usable without a mouse and without sight of the screen.",
    stages: {
      hook: {
        lead: "An image with no description, a label that is not attached, and a result line that changes silently. None of them break the build. Which one is a real barrier, and to whom?",
        variants: {
          guided: "Three small repairs, and each one removes a barrier for somebody who is not using the page the way you are.",
          balanced: "All three are invisible in a screenshot, which is exactly why they survive review after review.",
          independent: "Audit before you repair: decide what each element is for, then check whether the markup says so.",
        },
      },
      model: {
        lead: "<img src=\"avatar.jpg\" alt=\"Profile photo of the course tutor\"> and <label for=\"members\">Members</label> and <p role=\"status\">. A description, a link, and an announcement.",
        variants: {
          guided: "Describe the meaning of the image, connect the label with for and id, and give the changing text role status.",
          balanced: "The alt text is not a filename. Write what a sighted visitor learns from the image.",
          independent: "Ask what information would be lost if the element were removed. That answer is the alt text.",
        },
      },
      build: {
        lead: "Work in the HTML file. Repair one barrier at a time and check the page after each repair.",
        variants: {
          guided: "Start with the image. Write the description, then move to the label, then to the result line.",
          balanced: "Repair the three barriers one at a time and check the page after each repair.",
          independent: "Audit each element in turn and decide what information would be lost without it.",
        },
      },
      check: {
        lead: "Navigate the page with the keyboard only. Every control must be reachable, and the changing line must announce itself when it changes.",
        variants: {
          independent: "Turn off images and read the page. The description should still make sense where the image was.",
          guided: "Use the keyboard only. Every control should be reachable and the result line should announce itself.",
          balanced: "Check the three repairs separately: description, connection, announcement.",
        },
      },
      explain: {
        lead: "Now a different page: a profile card that needs a description for its image, a connected Members label and an announced result line. No example open.",
        variants: {
          guided: "The new page has the same three barriers. Repair them in the same order.",
          balanced: "Same three repairs on the new page, in the same order as before.",
          independent: "Work with no example open and decide the description text yourself.",
        },
      },
      transfer: {
        lead: "Each later feature in the project should be audited the same way, before it is considered finished.",
        variants: {
          independent: "Keep the three checks short enough to run on every change: description, connection, announcement.",
          guided: "Every feature the project adds gets the same three checks.",
          balanced: "A short repeated audit is what keeps these barriers from coming back.",
        },
      },
    },
    mastery: {
      freshTask: "A profile page has an avatar image, a Members label with its input and a result paragraph that changes. Repair the three barriers: describe the image, connect the label, and announce the result.",
      observable: "The description explains the image, clicking the label focuses the input, and the result line is announced when it changes.",
      reflection: "In your own words, what does role status change about how the text is delivered?",
      starterFiles: {
        html: "<img src=\"avatar.jpg\">\n<label>Members</label><input id=\"members\">\n<p id=\"status-line\"></p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The image carries a useful description", pattern: "<img[^>]+alt=[\"'][^\"']{8,}[\"']" },
        { file: "html", label: "The members label is connected", pattern: "<label[^>]+for=[\"']members[\"']" },
        { file: "html", label: "The result is announced as a status region", pattern: "<p[^>]+role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<img src=\"avatar.jpg\" alt=\"Tutor of the beginner course smiling outdoors\">\n<label for=\"members\">Members</label><input id=\"members\">\n<p id=\"status-line\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "alt text can be a single generic word.",
        symptom: "The description is present, so the audit passes, but it tells a visitor nothing about the image.",
        hint: "Write what the image contributes to the page. If the word would fit any other image, it is not a description.",
        file: "html",
        detect: "alt=[\"'][^\"']*(?:image|picture)[^\"']*[\"']",
        detectableExample: "<img src=\"avatar.jpg\" alt=\"image\">",
      },
      {
        wrong: "a result line only needs to look like a status region.",
        symptom: "Text changes silently for a visitor who cannot see the screen, so they never learn the result arrived.",
        hint: "Add role status to the element that receives the message, so the change is announced without moving the visitor's focus.",
        file: "html",
        detect: "<p(?![^>]*role=)[^>]*id=[\"']status-line",
        detectableExample: "<p id=\"status-line\"></p>",
      },
    ],
  },
  {
    lessonId: "adults-css-system-box-model",
    courseIds: ["adults"],
    concept: "Every element is a box with content, padding inside the border and margin outside it, and border-box makes the declared width include the border and padding.",
    make: "The learner gives a notice panel correct internal spacing, a visible edge and separation from what follows it.",
    difficulty: 3,
    prerequisites: ["adults-css-system-selectors"],
    projectStep: "The project's panels stop touching each other and stop measuring wider than declared.",
    stages: {
      hook: {
        lead: "A panel is set to a comfortable width and still overflows its column, and the next panel is stuck to it with no gap. One box, two different complaints. Are they related?",
        variants: {
          guided: "Space inside the box and space outside the box are two different properties. Today you use both.",
          balanced: "The overflow is a sizing model problem and the sticking is a margin problem. They look like one bug and are two.",
          independent: "Decide the sizing model before you tune any width, because every later measurement depends on it.",
        },
      },
      model: {
        lead: "* { box-sizing: border-box; } then .panel { padding: 1.25rem; border: 1px solid #c9a84c; margin: 1rem 0; }. Padding pushes the content inwards, the border draws the edge, and the margin pushes other boxes away.",
        variants: {
          guided: "Padding is inside the panel. Margin is outside it. The border sits between the two.",
          balanced: "Before border-box, a declared width is the content only, so padding and border are added on top and the box overflows.",
          independent: "Apply border-box once at the top of the sheet rather than per component, so every component shares one measurement model.",
        },
      },
      build: {
        lead: "Work in the CSS file. Add the sizing rule first, then the panel rule with its three declarations.",
        variants: {
          guided: "Set box-sizing first and run the preview, then add padding, then the border, then the margin.",
          balanced: "Add the sizing rule, then the panel rule with its three declarations, then check the preview.",
          independent: "Decide the sizing model for the whole sheet first, then space the panel with all three measures.",
        },
      },
      check: {
        lead: "Narrow the preview. The panel must stay inside its column and keep a clear gap above and below it.",
        variants: {
          independent: "Measure the panel: with border-box the declared width must include the border and the padding, not exclude them.",
          guided: "Narrow the preview and check the panel stays inside its column with a gap above and below.",
          balanced: "Check the two complaints separately: overflow and the gap to the next block.",
        },
      },
      explain: {
        lead: "Now a different page: a notice panel that needs border-box sizing, inner spacing, a visible border and outside spacing. No example open.",
        variants: {
          guided: "The new panel needs the same four things. Add them one at a time.",
          balanced: "Same four declarations on the new panel, in the same order.",
          independent: "Work with no example open and choose the values for each measure yourself.",
        },
      },
      transfer: {
        lead: "Every panel in the project will use this spacing, so the page reads as a set of deliberate blocks.",
        variants: {
          independent: "Keep the outside space on the panel rather than on its neighbours, so the panel owns its own separation.",
          guided: "Every panel in the project will use this spacing.",
          balanced: "One spacing system across the page is what makes it read as deliberate blocks.",
        },
      },
    },
    mastery: {
      freshTask: "A notice panel overflows its column and touches the block below it. Give the page border-box sizing and give the panel inner spacing, a border and outside spacing.",
      observable: "The panel measures no wider than declared and has a clear gap above and below it.",
      reflection: "In your own words, what is the difference between the space inside the border and the space outside it?",
      starterFiles: {
        html: "<section class=\"notice\">Readable content</section>",
        css: "/* Give the notice its spacing */\n.notice {\n  background: #fff7e0;\n}\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The page uses border-box sizing", pattern: "box-sizing\\s*:\\s*border-box" },
        { file: "css", label: "The notice has inner spacing", pattern: "\\.notice\\s*\\{[\\s\\S]*padding\\s*:" },
        { file: "css", label: "The notice has a visible edge", pattern: "\\.notice\\s*\\{[\\s\\S]*border\\s*:" },
        { file: "css", label: "The notice has outside spacing", pattern: "\\.notice\\s*\\{[\\s\\S]*margin\\s*:" },
      ],
      workedSolution: {
        html: "<section class=\"notice\">Readable content</section>",
        css: "*, *::before, *::after {\n  box-sizing: border-box;\n}\n\n.notice {\n  padding: 1.25rem;\n  border: 1px solid #c9a84c;\n  margin: 1rem 0;\n}\n",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the sizing model can be left at its default, since widths look correct on a wide screen.",
        symptom: "The panel is wider than declared as soon as padding or a border is added, and only on the narrow screen.",
        hint: "Set box-sizing to border-box for every element once at the top of the sheet, so the declared width already includes the border and the padding.",
        file: "css",
        detect: "box-sizing\\s*:\\s*content-box",
        detectableExample: ".notice {\n  box-sizing: content-box;\n}",
      },
      {
        wrong: "extra padding will separate the panel from what follows it.",
        symptom: "The panel grows internally but still sits flush against the next block.",
        hint: "Padding is inside the border, so it can never create space between two elements. Add margin to the panel to push its neighbours away.",
        file: "css",
        detect: "^(?![\\s\\S]*margin)[\\s\\S]*padding\\s*:",
        detectableExample: ".notice {\n  padding: 1.25rem;\n}",
      },
    ],
  },
  {
    lessonId: "adults-interaction-validation",
    courseIds: ["adults"],
    concept: "Validation happens before the value is accepted: the raw value is trimmed and compared, and the visitor is told what is missing in the same place they typed it.",
    make: "The learner rejects an empty title with a clear message and confirms a real one.",
    difficulty: 3,
    prerequisites: ["adults-forms-messages"],
    projectStep: "The project's first input stops accepting silence and starts explaining what it needs.",
    stages: {
      hook: {
        lead: "A visitor presses save with an empty field. The page cheerfully accepts it and the list gains a blank row. What should have happened before the value was accepted?",
        variants: {
          guided: "An empty value is not a value. The code should check before it accepts, and say what it needs.",
          balanced: "Validation is a decision point, and the message belongs next to the thing that failed.",
          independent: "Treat the value as untrusted input from a person, not from a machine. Decide what a valid value is before you read one.",
        },
      },
      model: {
        lead: "const value = field.value.trim(); then if (value === \"\") { note.textContent = \"Add a title\"; } else { note.textContent = \"Title saved\"; }. Trim first, then compare, then report.",
        variants: {
          guided: "Read the value, trim the spaces, then compare with an empty string.",
          balanced: "The trim matters because a field holding one space looks filled and is not.",
          independent: "Keep the check where the value is read, so no later code path can accept an unvalidated value.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Read and trim the value first, then write the two branches with their own messages.",
        variants: {
          guided: "Store the trimmed value in a name, then write the if and the else.",
          balanced: "Read the value, trim it, then branch on the result and report.",
          independent: "Decide where the check belongs before writing it, so no later path can skip it.",
        },
      },
      check: {
        lead: "Type a space and press save. The empty message must still appear, because the trimmed value is empty.",
        variants: {
          independent: "Check both branches deliberately, including the boundary of what you consider valid input.",
          guided: "Type a space and check the empty message still appears.",
          balanced: "Test both cases: a value with text and a value with only spaces.",
        },
      },
      explain: {
        lead: "Now a different page: a title field that shows Add a title when empty and Title saved when it has text. No example open.",
        variants: {
          guided: "The new page has one field and one message area. Check the value before you report success.",
          balanced: "Same order on the new page: read, trim, check, then report.",
          independent: "Work with no example open and choose the message text yourself.",
        },
      },
      transfer: {
        lead: "Every later form in the project will validate in the same order: read, trim, check, then report.",
        variants: {
          independent: "Keep the messages specific. A message that could apply to any field is no help to the person reading it.",
          guided: "Every form the project adds will validate in the same order.",
          balanced: "Read, trim, check, report is the order to reuse in every later form.",
        },
      },
    },
    mastery: {
      freshTask: "A page has a title field and a message area. Reject an empty or whitespace only value with the message Add a title, and confirm a real value with the message Title saved.",
      observable: "A field containing only spaces is rejected, and a field with text is confirmed.",
      reflection: "In your own words, why is the value trimmed before it is compared?",
      starterFiles: {
        html: "<input id=\"title\"><p id=\"note\" role=\"status\"></p>",
        css: "",
        javascript: "const field = document.querySelector(\"#title\");\nconst note = document.querySelector(\"#note\");\n// Validate the value\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The value is trimmed before use", pattern: "field\\.value\\.trim\\s*\\(" },
        { file: "javascript", label: "An empty value is rejected", pattern: "textContent\\s*=\\s*[\"']Add a title[\"']" },
        { file: "javascript", label: "A real value is confirmed", pattern: "textContent\\s*=\\s*[\"']Title saved[\"']" },
      ],
      workedSolution: {
        html: "<input id=\"title\"><p id=\"note\" role=\"status\"></p>",
        css: "",
        javascript: "const field = document.querySelector(\"#title\");\nconst note = document.querySelector(\"#note\");\nconst value = field.value.trim();\nif (value === \"\") {\n  note.textContent = \"Add a title\";\n} else {\n  note.textContent = \"Title saved\";\n}\n",
      },
    },
    misconceptions: [
      {
        wrong: "the raw value can be compared without trimming it.",
        symptom: "A field holding only spaces is accepted as a real title.",
        hint: "Trim the value as soon as it is read, then compare the trimmed result. Spaces are not content, and only the trimmed value should be judged.",
        file: "javascript",
        detect: "=\\s*field\\.value\\s*;",
        detectableExample: "const value = field.value;",
      },
      {
        wrong: "the success message is enough, since an empty field is rare.",
        symptom: "The page confirms every submission, including the ones with nothing in them.",
        hint: "The empty case is the one that produces blank rows. Write the branch for it first, then let else handle everything that has content.",
        file: "javascript",
        detect: "^(?![\\s\\S]*\\bif\\s*\\()[\\s\\S]*note\\.textContent",
        detectableExample: "note.textContent = \"Title saved\";",
      },
    ],
  },
];
