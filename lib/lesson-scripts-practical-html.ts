import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The adults remaining-content batch, HTML module.
 *
 * The default register is balanced. The wording assumes an adult learner
 * building something real for work or for a small business: a homepage with a
 * real outline, navigation that reaches its sections, a described image, and a
 * form that asks for the right kind of value. Independent wording is available
 * for a learner who asks for it.
 */

export const practicalHtmlScripts: LessonScript[] = [
  {
    lessonId: "adults-structure-landmarks",
    courseIds: ["adults"],
    concept: "Semantic HTML names the job of each large region of a page, so header, nav, main, section and footer describe structure instead of divs that say nothing.",
    make: "The learner replaces generic div wrappers with the five landmark elements so the page has a real outline before any styling.",
    difficulty: 2,
    prerequisites: [],
    projectStep: "The project's opening page gains a header, navigation, main region, a topic section and a footer that assistive technology can jump between.",
    stages: {
      hook: {
        lead: "A business homepage is built entirely from div elements. It looks finished, but the outline has no landmarks. What is actually missing when every region is a div?",
        variants: {
          guided: "Every part of this page is a div, so the names tell you nothing about the job of each block. Landmark elements fix that.",
          balanced: "The page reads well to the eye and reads as nothing to a screen reader, because a div announces no role at all.",
          independent: "Treat the outline as an interface of its own. Decide what each region is for before you decide how it looks.",
        },
      },
      model: {
        lead: "<header> holds the page title and navigation, <main> holds the primary content, <section> groups one themed block, and <footer> closes the page. Each name describes a job, not a position.",
        variants: {
          guided: "Use header for the top, main for the middle, section for one themed part, and footer for the ending.",
          balanced: "A landmark is a role, so the element is chosen by what the block does rather than by where it sits on the screen.",
          independent: "One main per document. Everything that is not the primary content stays outside it, including the navigation and the footer.",
        },
      },
      build: {
        lead: "Work in the HTML file. Replace one pair of div tags at a time, keeping the content inside unchanged, and check the preview after each swap.",
        variants: {
          guided: "Start with the outer div that wraps the title and the links. Turn it into a header.",
          balanced: "Rename one region, run the preview, then move to the next. A swap that breaks the page is easier to spot on its own.",
          independent: "Choose the region boundaries first, then rename them. The nesting should follow the reading order, not the design.",
        },
      },
      check: {
        lead: "Read the element names alone. Can you tell the introduction, the navigation, the main content and the ending apart without seeing the page?",
        variants: {
          guided: "Check that header, main and footer all appear, and that the navigation sits inside the header.",
          balanced: "Check that exactly one main region exists and that the section is inside it.",
          independent: "Confirm no landmark is nested inside another where it does not belong, such as a main inside a footer.",
        },
      },
      explain: {
        lead: "Now a clinic homepage built from divs. Give it a header, a navigation region, a main region with one section, and a footer. No example open.",
        variants: {
          guided: "The new page has the same five regions to find. Rename them in reading order.",
          balanced: "Same five regions on the new page, chosen by the job each block does.",
          independent: "Work with no example open and decide the region boundaries yourself.",
        },
      },
      transfer: {
        lead: "These regions become the frame of the whole project, so every later section slots into a named part rather than another div.",
        variants: {
          guided: "Every block you add to the project will go inside one of these named regions.",
          balanced: "One frame of named regions is what keeps the project understandable as it grows.",
          independent: "Keep the frame stable. A new feature should join an existing region before it earns a new one.",
        },
      },
    },
    mastery: {
      freshTask: "A clinic homepage is built from nested div elements. Give it a real outline: a header, a navigation region, a main region with one section, and a footer.",
      observable: "Reading only the element names tells you which region is the header, the navigation, the main content and the footer.",
      reflection: "In your own words, what does a landmark element tell a visitor that a div does not?",
      starterFiles: {
        html: "<div><h1>Riverside Clinic</h1><div><a href=\"#hours\">Opening hours</a></div></div>\n<div id=\"hours\"><h2>When we are open</h2><p>Weekdays only.</p></div>\n<div>Updated this week</div>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The clinic page has a header", pattern: "<header[\\s>]" },
        { file: "html", label: "The page has a main region", pattern: "<main[\\s>]" },
        { file: "html", label: "The page has a footer", pattern: "<footer[\\s>]" },
      ],
      workedSolution: {
        html: "<header>\n  <h1>Riverside Clinic</h1>\n  <nav><a href=\"#hours\">Opening hours</a></nav>\n</header>\n<main>\n  <section id=\"hours\">\n    <h2>When we are open</h2>\n    <p>Weekdays only.</p>\n  </section>\n</main>\n<footer>Updated this week</footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a div with a descriptive class name is the same as a landmark element.",
        symptom: "The page still has no regions a screen reader can jump between, even though the class names read clearly.",
        hint: "A class is a styling hook and a landmark is a document structure. Replace the wrapper div with the element that names the job, such as header or main.",
        file: "html",
        detect: "<div[^>]*class=[\"'][^\"']*(?:header|footer|main|nav)[^\"']*[\"']",
        detectableExample: "<div class=\"page-header\">Welcome</div>",
      },
      {
        wrong: "the whole page can sit inside one section.",
        symptom: "The outline shows a section but no main region, so the primary content is never identified.",
        hint: "A section groups one themed block, not the entire page. Wrap the page content in main and keep section for a single themed part inside it.",
        file: "html",
        detect: "^(?![\\s\\S]*<main[\\s>])[\\s\\S]*<section[\\s>]",
        detectableExample: "<section><h2>When we are open</h2></section>",
      },
    ],
  },
  {
    lessonId: "adults-structure-links",
    courseIds: ["adults"],
    concept: "A fragment link works when the href after # matches the id of a destination element, and the link text names where it goes.",
    make: "The learner writes navigation links that reach real sections and read sensibly on their own.",
    difficulty: 2,
    prerequisites: ["adults-structure-landmarks"],
    projectStep: "The project navigation points at real section ids so a visitor can jump straight to the services list or the enquiry form.",
    stages: {
      hook: {
        lead: "A navigation bar shows two words that look like links but do nothing. Clicking them leaves the visitor where they are. What has to exist for a link to actually move them?",
        variants: {
          guided: "The words look like links but nothing is connected. A link needs a destination that exists on the page.",
          balanced: "A fragment link is a promise to reach a place. The promise is kept by an id, not by the styling of the text.",
          independent: "Think of it as a two-part contract: the href names a target and the target has to answer to that name.",
        },
      },
      model: {
        lead: "href=\"#contact\" sends the browser to the element with id=\"contact\". The # lives only in the href, and the id carries the same word without it.",
        variants: {
          guided: "Put an id on the section and a matching href with a # on the link.",
          balanced: "The two values are the same word, and the leading # belongs to the href alone.",
          independent: "Keep the link text descriptive too, so a reader listing the links still knows where each one goes.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each destination section a unique id, then point a link at it with # and the same word.",
        variants: {
          guided: "Add the id to the section first, then write the link. Test it in the preview before moving on.",
          balanced: "Give each destination a unique id, then point a link at it and click to confirm the jump.",
          independent: "Decide the ids before you type them, and keep them unique across the page.",
        },
      },
      check: {
        lead: "Read each link text on its own, without the surrounding sentence. Does it name the destination clearly enough to be useful?",
        variants: {
          guided: "Click each link and check the page moves to the matching section.",
          balanced: "Check the link text names the destination and that no two elements share an id.",
          independent: "Confirm the link text would still make sense if every other link were removed.",
        },
      },
      explain: {
        lead: "Now a studio page with a navigation area and two sections, Services and Enquiries, whose links do not reach them. Give the sections ids and write descriptive links. No example open.",
        variants: {
          guided: "The new page needs two ids and two links. Add them in the same order as before.",
          balanced: "Same two steps on the new page: an id on each section, a matching href on each link.",
          independent: "Work with no example open and choose the ids and the link text yourself.",
        },
      },
      transfer: {
        lead: "Every section the project adds later gets a stable id, so navigation can always reach it.",
        variants: {
          guided: "Every section you add to the project gets an id so it can be linked to.",
          balanced: "Stable ids are what let the project's navigation keep working as the page grows.",
          independent: "Treat an id as part of the section's public name, because other parts of the page depend on it.",
        },
      },
    },
    mastery: {
      freshTask: "A studio page has a navigation area and two sections, Services and Enquiries, but the links do not reach them. Give the sections ids and write descriptive links that jump to each one.",
      observable: "Clicking each link scrolls to its section, and reading the link text alone tells you where it goes.",
      reflection: "In your own words, which part of a fragment link has to match an id, and which part does not?",
      starterFiles: {
        html: "<nav>Services Enquiries</nav>\n<main>\n  <section><h2>Services</h2></section>\n  <section><h2>Enquiries</h2></section>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The services section has a destination id", pattern: "id=[\"']services[\"']" },
        { file: "html", label: "The enquiries section has a destination id", pattern: "id=[\"']enquiries[\"']" },
        { file: "html", label: "The services link text is descriptive", pattern: "<a[^>]+href=[\"']#services[\"'][^>]*>[^<]{4,}</a>" },
      ],
      workedSolution: {
        html: "<nav>\n  <a href=\"#services\">View our services</a>\n  <a href=\"#enquiries\">Send an enquiry</a>\n</nav>\n<main>\n  <section id=\"services\"><h2>Services</h2></section>\n  <section id=\"enquiries\"><h2>Enquiries</h2></section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the link text can be a repeated phrase like click here.",
        symptom: "Every navigation item reads the same, so the links are useless when read out of context.",
        hint: "Name the destination in the link text, for example View our services. A reader listing the links should know where each one goes.",
        file: "html",
        detect: ">[\\s]*(?:click here|read more|here)[\\s]*<",
        detectableExample: "<a href=\"#services\">click here</a>",
      },
      {
        wrong: "the id belongs on the link instead of on the destination.",
        symptom: "The href points at a word that no element carries, so nothing moves when the link is clicked.",
        hint: "The id goes on the element being jumped to and the href carries the same word with a leading #. Put the id on the section, not on the anchor.",
        file: "html",
        detect: "<a[^>]+id=[\"']",
        detectableExample: "<a href=\"#services\" id=\"services\">Services</a>",
      },
    ],
  },
  {
    lessonId: "adults-structure-metadata",
    courseIds: ["adults"],
    concept: "Alternative text describes the information an image contributes to the page, so a visitor who cannot see the picture still receives what matters.",
    make: "The learner writes a description for an image that names its purpose instead of repeating the filename.",
    difficulty: 1,
    prerequisites: ["adults-structure-landmarks"],
    projectStep: "The project's images gain descriptions that carry their meaning, so the page still works when the pictures do not load.",
    stages: {
      hook: {
        lead: "An image on a services page carries no description. On a fast connection it looks fine. What is lost the moment the picture does not load, or the visitor cannot see it?",
        variants: {
          guided: "A picture can carry meaning that nothing else on the page carries. Without a description that meaning disappears.",
          balanced: "The description is not decoration. It is the only version of the image that survives a slow connection or a screen reader.",
          independent: "Decide what the image contributes before you describe it. An image that adds nothing should not be on the page at all.",
        },
      },
      model: {
        lead: "<img src=\"team.jpg\" alt=\"Two advisers reviewing a client's plan\">. The alt text says what the picture contributes, and it is never the file name.",
        variants: {
          guided: "Write what a sighted visitor learns from the picture, in a short sentence.",
          balanced: "If the description would fit any other photograph, it is not a description yet.",
          independent: "Ask what information would be lost if the image were removed. That answer is the alt text.",
        },
      },
      build: {
        lead: "Work in the HTML file. Ask what information would be missing if the picture disappeared, then write only that in the alt attribute.",
        variants: {
          guided: "Add an alt attribute to the image and describe the most important thing in it.",
          balanced: "Describe the purpose, not the pixels. One clear sentence is usually enough.",
          independent: "Keep the description short enough to be read in full without interrupting the page.",
        },
      },
      check: {
        lead: "Turn the image off in your mind and read the description. Does the sentence still make sense, and does it tell you something the surrounding text does not?",
        variants: {
          guided: "Check the description does not repeat the file name and does not start with the word image.",
          balanced: "Read the description without the picture. If it still makes sense, it is doing its job.",
          independent: "Confirm the description adds information rather than restating the caption.",
        },
      },
      explain: {
        lead: "Now a workshop page with a photograph of a hands-on session and no description. Write an alt description that explains what the picture contributes. No example open.",
        variants: {
          guided: "The new page has one image to describe. Say what a visitor would learn from it.",
          balanced: "Same job on the new page: describe what the picture adds to the page.",
          independent: "Work with no example open and write the description in your own words.",
        },
      },
      transfer: {
        lead: "Every meaningful image the project adds later gets the same treatment, and a purely decorative image gets an empty alt.",
        variants: {
          guided: "Every picture you add to the project gets a description of what it shows.",
          balanced: "A described image is what keeps the project usable when images fail to load.",
          independent: "Decide deliberately whether an image is meaningful or decorative, and set its alt accordingly.",
        },
      },
    },
    mastery: {
      freshTask: "A workshop page shows a photograph of a hands-on session with no description. Write an alt description that explains what the picture contributes to the page.",
      observable: "Reading the description without the image tells you what the photograph shows and why it is on the page.",
      reflection: "In your own words, how do you decide what belongs in alt text and what does not?",
      starterFiles: {
        html: "<h1>Weekend workshop</h1>\n<img src=\"session.jpg\">\n<p>Book a place for Saturday.</p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The image carries a description", pattern: "<img[^>]+alt=[\"'][^\"']{12,}[\"']" },
        { file: "html", label: "The description does not repeat the file name", pattern: "<img[^>]+alt=[\"'](?![^\"']*(?:\\.jpg|\\.png|\\.jpeg))[^\"']{12,}[\"']" },
      ],
      workedSolution: {
        html: "<h1>Weekend workshop</h1>\n<img src=\"session.jpg\" alt=\"A group building their first web page together\">\n<p>Book a place for Saturday.</p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the file name is a good enough description.",
        symptom: "The description reads like session.jpg, which tells a visitor nothing about the picture.",
        hint: "Describe what the picture contributes, not what it is called. If the text could describe any photograph, it is not a description.",
        file: "html",
        detect: "alt=[\"'][^\"']*\\.(?:jpg|jpeg|png|webp)[\"']",
        detectableExample: "<img src=\"session.jpg\" alt=\"session.jpg\">",
      },
      {
        wrong: "alt can be left out because the picture speaks for itself.",
        symptom: "A visitor who cannot see the image receives nothing where the picture is, and the surrounding sentence loses its subject.",
        hint: "Add an alt attribute to every meaningful image and describe its purpose. Only a purely decorative image should carry an empty alt.",
        file: "html",
        detect: "<img(?![^>]*\\balt=)[^>]*>",
        detectableExample: "<img src=\"session.jpg\">",
      },
    ],
  },
  {
    lessonId: "adults-forms-types",
    courseIds: ["adults"],
    concept: "The input type tells the browser what kind of value a field expects, so it can offer the right keyboard and refuse obvious mistakes before the form is sent.",
    make: "The learner gives an email field and a number field the correct types and sensible limits.",
    difficulty: 2,
    prerequisites: ["adults-forms-labels"],
    projectStep: "The project's enquiry form asks for an email and a number of guests with types that help the visitor enter each one correctly.",
    stages: {
      hook: {
        lead: "A visitor types an email address on a phone and gets a full letter keyboard. The field is meant for an address. What single attribute would have handed them the right keys?",
        variants: {
          guided: "The keyboard a phone shows depends on the type of the field. Choosing the right type helps the visitor enter the value.",
          balanced: "The browser already knows what an address looks like. The type is how you tell it to help.",
          independent: "Choose the narrowest type that fits the value. A type is a promise about the data, not a decoration.",
        },
      },
      model: {
        lead: "<input type=\"email\"> brings up an address keyboard and checks the shape of the value. <input type=\"number\" min=\"1\" max=\"10\"> limits a quantity to a sensible range.",
        variants: {
          guided: "Set type to email for an address and type to number for a quantity, then add a minimum and a maximum.",
          balanced: "The type changes the keyboard and the basic check. The label and your own validation still carry the meaning.",
          independent: "Set the limits from the real world, not from the input. Six seats is a decision about the business, not about the code.",
        },
      },
      build: {
        lead: "Work in the HTML file. Choose the narrowest type that fits the information, then add min and max to the number field.",
        variants: {
          guided: "Set the email field's type first, then the number field's type, then its limits.",
          balanced: "Set each type, then add min and max to the number field and run the preview.",
          independent: "Decide the limits before you type them, so they reflect a real constraint.",
        },
      },
      check: {
        lead: "Test each field: does the right keyboard appear, and does the browser refuse a value outside the limits you set?",
        variants: {
          guided: "Check the email field offers an address keyboard and the number field rejects a value below the minimum.",
          balanced: "Try a value below the minimum and one above the maximum. Both should be refused.",
          independent: "Confirm the type is the narrowest that fits, and that a human could still enter a wrong but plausible value.",
        },
      },
      explain: {
        lead: "Now a booking form with a field for a guest's email and a field for the number of seats. Give each field a suitable type and limit the seats to between 1 and 6. No example open.",
        variants: {
          guided: "The new form has two fields. Set an email type and a number type, then add the limits.",
          balanced: "Same steps on the new form: a type for each field, limits for the number.",
          independent: "Work with no example open and decide the limits from the scenario.",
        },
      },
      transfer: {
        lead: "Every field the project adds later gets the type that fits its value, so the browser can help before the form is submitted.",
        variants: {
          guided: "Every field you add to the project gets a type that matches what it collects.",
          balanced: "The right types are what make the project's forms quicker to fill in on a phone.",
          independent: "Treat the type as part of the field's contract, and keep the real validation in the code as well.",
        },
      },
    },
    mastery: {
      freshTask: "A booking form has a field for the guest's email and a field for the number of seats. Give each field a suitable type and limit the seats to between 1 and 6.",
      observable: "The email field requests an address keyboard, and the seat field refuses a value below 1 or above 6.",
      reflection: "In your own words, what does the input type change, and what does it not protect you from?",
      starterFiles: {
        html: "<label for=\"guest-email\">Email</label><input id=\"guest-email\">\n<label for=\"seats\">Seats</label><input id=\"seats\">",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The email field uses the email type", pattern: "<input[^>]+type=[\"']email[\"']" },
        { file: "html", label: "The seat field uses the number type", pattern: "<input[^>]+type=[\"']number[\"']" },
        { file: "html", label: "The seats have a minimum", pattern: "<input[^>]+min=[\"']?1" },
        { file: "html", label: "The seats have a maximum", pattern: "<input[^>]+max=" },
      ],
      workedSolution: {
        html: "<label for=\"guest-email\">Email</label><input id=\"guest-email\" type=\"email\">\n<label for=\"seats\">Seats</label><input id=\"seats\" type=\"number\" min=\"1\" max=\"6\">",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the type is only about appearance, so text is always fine.",
        symptom: "The phone shows a full letter keyboard for an address field, and obvious mistakes are not caught before submission.",
        hint: "Choose the type that matches the value, such as email for an address or number for a quantity, so the device can help the visitor enter it.",
        file: "html",
        detect: "<input(?![^>]*\\btype=)[^>]*>",
        detectableExample: "<input id=\"seats\">",
      },
      {
        wrong: "the number limits can be left to the visitor to respect.",
        symptom: "Someone books zero seats or two hundred, and the form accepts it.",
        hint: "Add min and max to the number field so the browser refuses an impossible quantity. The limits belong on the input, not only in the label.",
        file: "html",
        detect: "<input[^>]+type=[\"']number[\"'](?![^>]*\\b(?:min|max)=)",
        detectableExample: "<input id=\"seats\" type=\"number\">",
      },
    ],
  },
  {
    lessonId: "adults-forms-groups",
    courseIds: ["adults"],
    concept: "A fieldset groups controls that answer one question, and its legend names that question for everyone.",
    make: "The learner wraps a set of related choices in a fieldset with a legend and gives the radios one shared name.",
    difficulty: 2,
    prerequisites: ["adults-forms-types"],
    projectStep: "The project's contact-preference question becomes a named group, so a visitor knows the three choices belong together.",
    stages: {
      hook: {
        lead: "Three radio buttons sit under a line of text that looks like a heading. Nothing ties the choices to the question. What breaks for a keyboard or screen reader visitor?",
        variants: {
          guided: "The question and the choices need to be linked, so the group is announced with its name.",
          balanced: "Looking like a heading is not being a heading. Only a real group carries its question with it.",
          independent: "Decide which controls answer one question, then make that relationship explicit in the markup.",
        },
      },
      model: {
        lead: "<fieldset><legend>Preferred contact</legend> ... </fieldset>. The legend names the whole group, and one shared name attribute makes the radios a single choice.",
        variants: {
          guided: "Wrap the choices in a fieldset, put the question in a legend, and give every radio the same name.",
          balanced: "The legend is announced with the group, and a shared name is what turns three radios into one choice.",
          independent: "The legend belongs inside the fieldset and before the first control, so it is read first.",
        },
      },
      build: {
        lead: "Work in the HTML file. Wrap the choices in a fieldset, move the question into a legend, and give every radio the same name.",
        variants: {
          guided: "Add the fieldset first, then the legend, then the shared name on each radio.",
          balanced: "Wrap the choices, name the group, then make the radios a single choice and check in the preview.",
          independent: "Choose a name that describes the group, then apply it to every control in the set.",
        },
      },
      check: {
        lead: "Tab through the group. The legend should be announced with the group, and choosing one option should clear the others.",
        variants: {
          guided: "Check the legend appears with the group and that selecting one radio deselects the rest.",
          balanced: "Confirm the group is read as one question with three answers, not three separate controls.",
          independent: "Verify no two unrelated groups share a name, because that would merge them into one.",
        },
      },
      explain: {
        lead: "Now a support page with three delivery options and a question above them that is not grouped. Wrap them in a fieldset, name the group with a legend and make the three radios a single choice. No example open.",
        variants: {
          guided: "The new page has the same three things to add. Group the choices and name them.",
          balanced: "Same three steps on the new page: fieldset, legend, shared name.",
          independent: "Work with no example open and choose the group name yourself.",
        },
      },
      transfer: {
        lead: "Every set of related choices the project adds later gets the same treatment, so no question is left floating above its answers.",
        variants: {
          guided: "Every group of choices you add to the project gets a fieldset and a legend.",
          balanced: "Named groups are what keep the project's longer forms understandable.",
          independent: "Treat a shared name as the boundary of a question, and never reuse it for a different one.",
        },
      },
    },
    mastery: {
      freshTask: "A support page lists three delivery options with a question above them, but the choices are not grouped. Wrap them in a fieldset, name the group with a legend and make the three radios a single choice.",
      observable: "The group is announced with its legend, and selecting one option deselects the others.",
      reflection: "In your own words, what does the legend name that a paragraph of text cannot?",
      starterFiles: {
        html: "<p>Delivery speed</p>\n<label><input type=\"radio\"> Standard</label>\n<label><input type=\"radio\"> Express</label>\n<label><input type=\"radio\"> Same day</label>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The choices are grouped in a fieldset", pattern: "<fieldset[\\s>]" },
        { file: "html", label: "The group is named with a legend", pattern: "<legend[\\s>][^<]+</legend>" },
        { file: "html", label: "The radios share one name", pattern: "(?:type=[\"']radio[\"'][^>]+name=[\"']delivery[\"']|name=[\"']delivery[\"'][^>]+type=[\"']radio[\"'])" },
      ],
      workedSolution: {
        html: "<fieldset>\n  <legend>Delivery speed</legend>\n  <label><input type=\"radio\" name=\"delivery\" value=\"standard\"> Standard</label>\n  <label><input type=\"radio\" name=\"delivery\" value=\"express\"> Express</label>\n  <label><input type=\"radio\" name=\"delivery\" value=\"same-day\"> Same day</label>\n</fieldset>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a paragraph above the radios is the same as a legend.",
        symptom: "The question floats above the group and is not announced when a visitor reaches the choices.",
        hint: "Move the question inside the fieldset as a legend so it is tied to the group. A paragraph is read once and then left behind.",
        file: "html",
        detect: "^(?![\\s\\S]*<legend)[\\s\\S]*<fieldset",
        detectableExample: "<fieldset><label><input type=\"radio\"></label></fieldset>",
      },
      {
        wrong: "each radio needs its own name so they do not interfere.",
        symptom: "All three options can be selected at once, so the answer is not a single choice.",
        hint: "Give every radio in the group the same name attribute. A shared name is what makes them one choice instead of three independent ones.",
        file: "html",
        detect: "name=[\"'][^\"']*(?:standard|express|same-day)[\"']",
        detectableExample: "<input type=\"radio\" name=\"standard\">",
      },
    ],
  },
  {
    lessonId: "adults-forms-messages",
    courseIds: ["adults"],
    concept: "A form explains its requirements before submission and reports the result afterwards, and a status region announces changing feedback without moving focus.",
    make: "The learner adds help text connected to a field and an empty status region for the result.",
    difficulty: 3,
    prerequisites: ["adults-forms-groups"],
    projectStep: "The project's form gains a short instruction next to a field and a live region for its result message.",
    stages: {
      hook: {
        lead: "A visitor submits an enquiry and nothing on the page changes. The data may have been sent, but the visitor cannot tell. What is missing from the form?",
        variants: {
          guided: "A form should explain what it needs before submission and confirm what happened afterwards.",
          balanced: "Silence after a submission is a real defect, because the visitor has no way to know whether it worked.",
          independent: "Treat the result as part of the interface. Feedback that is not announced has not really been delivered.",
        },
      },
      model: {
        lead: "<p id=\"email-help\">Use a work address we can reply to.</p> and <input id=\"email\" aria-describedby=\"email-help\"> and <p id=\"result\" role=\"status\"></p>. Help before, announcement after.",
        variants: {
          guided: "Add a short help paragraph, connect it with aria-describedby, then add an empty status region for the result.",
          balanced: "The help text is connected by an id, and the result region announces changes without stealing focus.",
          independent: "Keep the help text about one field and the status region for the outcome of the whole form.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the help paragraph, connect it with aria-describedby, then add an empty status region.",
        variants: {
          guided: "Write the help paragraph with an id first, then reference it from the field.",
          balanced: "Add the help text, connect it, then add the status region and run the preview.",
          independent: "Choose the help text so it answers the question the field raises, not the one you wish it raised.",
        },
      },
      check: {
        lead: "Focus the field and check the help is announced with it. Then confirm the result region is empty until a message arrives.",
        variants: {
          guided: "Check the field references its help text and that a status region exists.",
          balanced: "Confirm the help is tied to the field and the result region is separate from it.",
          independent: "Verify the status region is empty at the start, so the first message is a real change.",
        },
      },
      explain: {
        lead: "Now a quote request with a phone field that has no guidance and no place to show the result. Add a short help line connected to the field, and an empty status region. No example open.",
        variants: {
          guided: "The new form needs the same two additions: a help line and a result region.",
          balanced: "Same two additions on the new form: help text, then a status region.",
          independent: "Work with no example open and write the help text yourself.",
        },
      },
      transfer: {
        lead: "Every form the project adds later gets a short instruction and a place to report its result.",
        variants: {
          guided: "Every form you add to the project gets help text and a status region.",
          balanced: "Clear instructions and announced results are what make the project's forms feel finished.",
          independent: "Keep the result region empty until a message exists, so it never announces stale text.",
        },
      },
    },
    mastery: {
      freshTask: "A quote request has a phone field with no guidance and no place to show the result. Add a short help line connected to the field, and an empty status region for the confirmation.",
      observable: "The help text is announced with the phone field, and the result region stays empty until a message is written into it.",
      reflection: "In your own words, why is a status region better than a plain paragraph for feedback that changes?",
      starterFiles: {
        html: "<form><label for=\"phone\">Phone</label><input id=\"phone\" type=\"tel\"><button>Request</button></form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The field has a help line", pattern: "id=[\"']phone-help[\"']" },
        { file: "html", label: "The field references its help line", pattern: "aria-describedby=[\"']phone-help[\"']" },
        { file: "html", label: "There is a status region for the result", pattern: "role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"phone\">Phone</label>\n  <input id=\"phone\" type=\"tel\" aria-describedby=\"phone-help\">\n  <p id=\"phone-help\">A number we can call back on during office hours.</p>\n  <button>Request</button>\n</form>\n<p id=\"result\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the help text only has to be visible near the field.",
        symptom: "The instruction is on screen but is not announced when a visitor reaches the field.",
        hint: "Give the help paragraph an id and reference it from the field with aria-describedby, so the two are connected for assistive technology.",
        file: "html",
        detect: "^(?![\\s\\S]*aria-describedby)[\\s\\S]*id=[\"']phone-help[\"']",
        detectableExample: "<p id=\"phone-help\">Call us during office hours.</p>",
      },
      {
        wrong: "the result can appear in an ordinary paragraph.",
        symptom: "The confirmation appears visually but is never announced, so a visitor who cannot see the change assumes nothing happened.",
        hint: "Add role status to the element that receives the result. The role is what turns a visible change into an announced one.",
        file: "html",
        detect: "<p(?![^>]*role=)[^>]*id=[\"']result[\"']",
        detectableExample: "<p id=\"result\"></p>",
      },
    ],
  },
];
