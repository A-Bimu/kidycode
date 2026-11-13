import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 16 to 18, the HTML half of the remaining content batch.
 *
 * Seven challenge lessons that had no six-moment script: the page regions, the
 * navigation links, the document metadata and the four form lessons on labels,
 * input types, grouped choices and status messages.
 *
 * The register is written for a learner preparing for further study or work:
 * the hook names a defect a reviewer would raise, the model gives the rule
 * behind the markup, and the check states what a keyboard or assistive
 * technology user would actually experience. Every script carries the guided,
 * balanced and independent wording, a fresh task with its own checks, and two
 * misconception-specific hints with proved detectors.
 */

export const developerHtmlScripts: LessonScript[] = [
  {
    lessonId: "ages-16-18-structure-landmarks",
    courseIds: ["ages-16-18"],
    concept: "A landmark element states the job of a region, and that statement is the page outline a browser and an assistive technology both read.",
    make: "The learner replaces generic containers on a directory page with header, nav, main, section and footer.",
    difficulty: 2,
    prerequisites: ["ages-16-18-structure-headings"],
    projectStep: "The project's four large regions become landmarks, which is what the keyboard order, the skip link and the responsive rearrangement are all built on.",
    stages: {
      hook: {
        lead: "A reviewer opens your directory page and lists the regions. The list is empty, although the page clearly has a top bar, a menu, a content area and an ending. Every block is a div with a tidy class name. What is the reviewer actually reading, and why does a class name not appear in it?",
        variants: {
          guided: "The page looks correct and the region list is still empty. Today you work out which part of the markup creates that list.",
          balanced: "A class name is a word you invented for your stylesheet. A landmark is a word the browser already understands, which is why one is listed and the other is not.",
          independent: "Treat the region list as a public interface of the page. Decide which regions belong in it before you change a single tag.",
        },
      },
      model: {
        lead: "<header> owns the top of the page, <nav> wraps a set of links, <main> holds the content unique to this page, <section> groups a titled part of that content and <footer> closes the page. Each element describes a job, so the choice is made from meaning rather than from appearance.",
        variants: {
          guided: "Read the five elements in page order. The first two sit at the top, main wraps the middle, section divides it, footer ends it.",
          balanced: "The elements are not decorative wrappers. Their names are the outline, so a wrong choice shows up as a wrong outline rather than as a wrong colour.",
          independent: "One page holds one main region. Sections and articles support it, so the landmark list stays short enough to be useful.",
        },
      },
      build: {
        lead: "Work in the HTML file. Convert one region at a time and run the preview after each conversion, so you can attribute any change in the outline to one edit.",
        variants: {
          guided: "Start at the top: give the first block a header element and run the page. Continue downwards in reading order.",
          balanced: "Change matching opening and closing tags together, because an unmatched pair moves the rest of the page into the wrong region.",
          independent: "Decide the boundaries of all four regions before you type, then convert them in one pass and inspect the resulting outline.",
        },
      },
      check: {
        lead: "Read the outline back. It should open with a header that contains the navigation, hold exactly one main region, and end with a footer. Two main regions is the defect that splits a page in half and is easiest to miss.",
        variants: {
          guided: "Count the main elements. There should be exactly one, and the section should sit inside it.",
          balanced: "Confirm the navigation sits inside the header, because that is where a visitor looks for it first.",
          independent: "Prove the outline is unique: one header, one navigation, one main, one footer, and no region inside itself.",
        },
      },
      explain: {
        lead: "Now a different page: a careers office page whose services, navigation and ending are all generic containers. No example open. Give it a header, its own navigation region, a main region with one article per service and a footer.",
        variants: {
          guided: "The new page has the same four parts written with div elements. Convert each one and mark the two services as articles.",
          balanced: "Same elements, different wording. Read what the block contains before choosing the region it belongs to.",
          independent: "Work with no example open and decide how many services the main region holds before you write the tags.",
        },
      },
      transfer: {
        lead: "The project's landmarks are the destinations the navigation points at and the areas the wide layout rearranges, so they need to be decided once and kept.",
        variants: {
          independent: "Keep the same landmark names on every page of the project, because consistency is what makes a site learnable rather than merely styled.",
          guided: "Your project will use these four regions on every page it grows.",
          balanced: "A landmark that appears on every page of a site becomes a place a visitor can trust without looking.",
        },
      },
    },
    mastery: {
      freshTask: "A careers office page describes its services with generic containers. Give it a header region, a navigation region and a main region that holds one article per service, then close the page with a footer region.",
      observable: "The page's region list opens with a header, holds one navigation and one main region containing two articles, and ends with a footer.",
      reflection: "In your own words, what can a visitor do on a page with landmarks that they cannot do on a page built only from styled containers?",
      starterFiles: {
        html: "<div>\n  <h1>Careers Office</h1>\n  <div><a href=\"#services\">Services</a></div>\n</div>\n<div id=\"services\">\n  <div><h2>CV review</h2><p>Book a thirty minute review.</p></div>\n  <div><h2>Interview practice</h2><p>Practise with a partner.</p></div>\n</div>\n<div>Updated this week</div>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The page opens with a header region", pattern: "<header[\\s>]" },
        { file: "html", label: "The navigation is a region of its own", pattern: "<nav[\\s>]" },
        { file: "html", label: "The services sit in one main region", pattern: "<main[\\s>]" },
        { file: "html", label: "Each service is an article", pattern: "<article[\\s>][\\s\\S]*<article[\\s>]" },
        { file: "html", label: "The page closes with a footer region", pattern: "<footer[\\s>]" },
      ],
      workedSolution: {
        html: "<header>\n  <h1>Careers Office</h1>\n  <nav><a href=\"#services\">Services</a></nav>\n</header>\n<main>\n  <section id=\"services\">\n    <article><h2>CV review</h2><p>Book a thirty minute review.</p></article>\n    <article><h2>Interview practice</h2><p>Practise with a partner.</p></article>\n  </section>\n</main>\n<footer>Updated this week</footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a container with a descriptive class name does the same job as a landmark element.",
        symptom: "The layout can be styled exactly as intended, and the page reports no regions at all.",
        hint: "A class is a name you invented for your own stylesheet. Only the semantic element creates the region, so use header, nav, main and footer where the class names say those jobs belong.",
        file: "html",
        detect: "<div[^>]*class=[\"'][^\"']*(?:header|nav|main|footer|section)[^\"']*[\"']",
        detectableExample: "<div class=\"page-header\"><h1>Careers Office</h1></div>",
      },
      {
        wrong: "every large block of the page deserves its own main region.",
        symptom: "The page reports two or three main regions, so there is no single place that holds its content.",
        hint: "One page holds one main region. Wrap the remaining blocks in section or article inside it, because a second main region tells a visitor the page has two separate bodies of content.",
        file: "html",
        detect: "<main[\\s\\S]*<main",
        detectableExample: "<main><h2>CV review</h2></main>\n<main><h2>Interview practice</h2></main>",
      },
    ],
  },
  {
    lessonId: "ages-16-18-structure-links",
    courseIds: ["ages-16-18"],
    concept: "A fragment link is a pair of matching strings: the destination after the hash and the id on the element it should reach.",
    make: "The learner turns two plain navigation phrases into links that reach the matching sections.",
    difficulty: 2,
    prerequisites: ["ages-16-18-structure-landmarks"],
    projectStep: "The project's navigation starts working, so a visitor can reach any region without scrolling to find it, and the link names become part of the interface contract.",
    stages: {
      hook: {
        lead: "The navigation reads Roles and Times, both sections exist lower on the page, and choosing either phrase does nothing at all. The words are right and the layout is right. What single relationship is missing?",
        variants: {
          guided: "A link needs something to arrive at. Today you give each section a name and point its link at that name.",
          balanced: "The address and the destination are two separate strings, and the browser only connects them when they match exactly.",
          independent: "Choose the destination word once and use it on both sides, because a mismatched fragment fails silently in every browser.",
        },
      },
      model: {
        lead: "<a href=\"#roles\">Roles</a> carries the address, and <section id=\"roles\"> carries the name it points at. The hash belongs to the href and is left out of the id, which is the one difference worth memorising.",
        variants: {
          guided: "Read both halves together. The href has the hash, the id does not, and the word between them is identical.",
          balanced: "Link text is read out of context, so it names the destination rather than describing the act of clicking.",
          independent: "An id names one element only, because a fragment link reaches the first element carrying the name and stops there.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each destination its id first, then wrap the navigation phrase in an anchor. Run the preview and use the link before moving to the second one.",
        variants: {
          guided: "Add the two ids, then add the two links, then click one and watch the page move.",
          balanced: "Write the destination before the link, so the address exists by the time you point at it.",
          independent: "Decide both names in advance, then use the navigation itself as the test for each one.",
        },
      },
      check: {
        lead: "Choose each link and watch the page travel. If nothing moves, compare the hash with the id character by character: a missing hash, a stray space or a different word is enough to break a link that looks correct.",
        variants: {
          guided: "Test both links and confirm the page moves to the section that matches the wording.",
          balanced: "Check the two halves in the order the browser resolves them: the address first, then the destination it names.",
          independent: "Confirm the ids are unique, because a repeated id sends a later link to the wrong place in the document.",
        },
      },
      explain: {
        lead: "Now a different page: a volunteer hub listing its roles and its opening times as plain phrases. No example open. Turn each phrase into a link that reaches its section, and give those sections the ids the links name.",
        variants: {
          guided: "The new page has two phrases and two sections. Write the ids first, then the links that point at them.",
          balanced: "Same pattern, new nouns. Read the section wording before choosing the hash values.",
          independent: "Work with no example open and choose names a visitor could guess from reading the link text.",
        },
      },
      transfer: {
        lead: "The project's navigation reuses these links on every page it grows, which is why a section name becomes a small published contract once a link points at it.",
        variants: {
          independent: "Renaming a section later means renaming every link to it, so choose a name that will still make sense when the project is finished.",
          guided: "Your project's menu will use these links on every page it has.",
          balanced: "The name after the hash is part of the interface, even when a visitor never types it.",
        },
      },
    },
    mastery: {
      freshTask: "A volunteer hub lists its roles and its opening times as plain phrases in the navigation. Turn each phrase into a link that reaches its matching section, and give those sections the ids the links name.",
      observable: "Choosing a navigation link moves the page to the section whose id matches the word after the hash.",
      reflection: "In your own words, which two strings have to match, and what does the browser do when they do not?",
      starterFiles: {
        html: "<nav>Roles Times</nav>\n<main>\n  <section><h2>Roles</h2><p>What volunteers do.</p></section>\n  <section><h2>Times</h2><p>When the hub opens.</p></section>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The roles link names its destination", pattern: "<a[^>]+href=[\"']#roles[\"'][^>]*>[^<]+</a>" },
        { file: "html", label: "The times link names its destination", pattern: "<a[^>]+href=[\"']#times[\"'][^>]*>[^<]+</a>" },
        { file: "html", label: "The roles section carries the matching id", pattern: "id=[\"']roles[\"']" },
        { file: "html", label: "The times section carries the matching id", pattern: "id=[\"']times[\"']" },
      ],
      workedSolution: {
        html: "<nav><a href=\"#roles\">Roles</a> <a href=\"#times\">Times</a></nav>\n<main>\n  <section id=\"roles\"><h2>Roles</h2><p>What volunteers do.</p></section>\n  <section id=\"times\"><h2>Times</h2><p>When the hub opens.</p></section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the section headings are enough, so the ids can be left out.",
        symptom: "The navigation looks correct and the page never moves when a link is chosen.",
        hint: "A link needs an element to arrive at. Add an id to each section using exactly the word that follows the hash, since the heading text and the id are separate strings.",
        file: "html",
        detect: "^(?=[\\s\\S]*href=[\"']#)(?![\\s\\S]*\\bid=)",
        detectableExample: "<nav><a href=\"#roles\">Roles</a></nav>\n<main><section><h2>Roles</h2></section></main>",
      },
      {
        wrong: "the link text can be a vague phrase, because the destination is on the same page.",
        symptom: "A visitor who reads only the collected list of links learns nothing about where any of them goes.",
        hint: "Link text is read on its own, out of the sentence around it. Name the destination, so Roles and Times instead of a phrase such as click here or read more.",
        file: "html",
        detect: ">\\s*(?:here|click here|read more|more)\\s*<",
        detectableExample: "<a href=\"#roles\">Click here</a>",
      },
    ],
  },
  {
    lessonId: "ages-16-18-structure-metadata",
    courseIds: ["ages-16-18"],
    concept: "Metadata is information about the document rather than content in it, and the two entries that matter most are the title and the viewport setting.",
    make: "The learner gives a bare document a specific title, a declared language and the standard viewport element.",
    difficulty: 2,
    prerequisites: ["ages-16-18-structure-links"],
    projectStep: "The project gains a specific tab title and behaves predictably on a phone, because a viewport element stops the browser from simulating a wide desktop screen.",
    stages: {
      hook: {
        lead: "A page opens in three tabs at once and all three are labelled with the file name. On a phone the whole layout appears shrunk to half size, as if the browser were pretending the screen is a metre wide. The page has no head section at all. What is the head responsible for that the body is not?",
        variants: {
          guided: "The tab label and the phone layout are both decided outside the visible content. Today you add the two lines that decide them.",
          balanced: "The title is what a search result, a bookmark and a browser tab all display. The viewport value is what tells a phone how wide the page really is.",
          independent: "Treat metadata as the document's outward-facing record. The words a visitor sees when the page is closed are chosen there.",
        },
      },
      model: {
        lead: "Inside head, <title>Revision timetable</title> names the document, and <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> tells a mobile browser to use the device width without inventing a wider canvas. The html element carries lang=\"en\" so the language is declared rather than guessed.",
        variants: {
          guided: "Three things to add: the language on the html element, a specific title, and the viewport meta element. All three belong in the document's opening.",
          balanced: "The viewport value is a fixed, standard pair. Copy it exactly rather than inventing a width in pixels.",
          independent: "The title is not decoration. It is the string a search result, a bookmark and every open tab will show, so it names the page rather than the file.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the language attribute first, then a specific title, then the viewport element. Run the preview and read the tab label after each change.",
        variants: {
          guided: "Add one line at a time in that order and watch the tab label change when the title appears.",
          balanced: "Keep the metadata inside head, because a title placed in the body is not what the browser displays.",
          independent: "Write both values before you open the file, then paste them in unchanged.",
        },
      },
      check: {
        lead: "Read the tab label. It should name this page and not repeat the file name. Then narrow the preview window to a phone width: the text should reflow at that size instead of shrinking as a whole.",
        variants: {
          guided: "Check the tab says something useful, then check the phone-width preview keeps the text readable.",
          balanced: "Check the two entries separately: the title is content for a human, the viewport is an instruction for the browser.",
          independent: "Confirm the title would still identify this page in a list of ten search results about the same subject.",
        },
      },
      explain: {
        lead: "Now a different document: a revision timetable file that was written as bare content with no head section at all. No example open. Declare the document language, give it a specific title and add the standard viewport element.",
        variants: {
          guided: "The new file needs all three additions, in the order language, title, viewport.",
          balanced: "Same three entries, different page. Decide the title wording from the page's content before typing.",
          independent: "Work with no example open and write a title a stranger could use to identify the page in a tab bar.",
        },
      },
      transfer: {
        lead: "Every page the project grows needs this pair, and the release note later records the mobile layout as tested, which is only honest once the viewport element is present.",
        variants: {
          independent: "A missing viewport entry is invisible on a desktop and unmistakable on a phone, which is exactly why it belongs in the release checklist.",
          guided: "Your project's pages will each carry a title and the same viewport element.",
          balanced: "Two short entries decide how the project is labelled and how it is measured on a small screen.",
        },
      },
    },
    mastery: {
      freshTask: "A revision timetable was written as bare content with no head section. Declare the document language as English, give the page a specific title and add the standard viewport element for responsive layout.",
      observable: "The tab shows a specific page title, and at a phone width the text reflows instead of shrinking to half size.",
      reflection: "In your own words, what does the viewport entry change for a visitor using a phone, and why can the page look correct without it on a desktop?",
      starterFiles: {
        html: "<h1>Revision timetable</h1>\n<p>Plan the next two weeks of study.</p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The document declares its language", pattern: "<html[^>]+lang=[\"']en[\"']" },
        { file: "html", label: "The title names this page", pattern: "<title>[^<]{8,}</title>" },
        { file: "html", label: "The viewport is set for responsive layout", pattern: "<meta[^>]+name=[\"']viewport[\"'][^>]+width=device-width" },
      ],
      workedSolution: {
        html: "<!doctype html>\n<html lang=\"en\">\n<head>\n  <title>Revision timetable</title>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n</head>\n<body>\n  <h1>Revision timetable</h1>\n  <p>Plan the next two weeks of study.</p>\n</body>\n</html>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the page title can be a generic word, because it only appears in the tab.",
        symptom: "Several open tabs all carry the same label, and a search result cannot be told apart from its neighbours.",
        hint: "The title is the document's name in every list that shows it. Replace the generic word with a specific phrase, such as Revision timetable, that identifies this page rather than any page.",
        file: "html",
        detect: "<title>\\s*(?:document|untitled|index|page|home)\\s*</title>",
        detectableExample: "<title>Document</title>",
      },
      {
        wrong: "the viewport entry is only needed once the page includes images.",
        symptom: "The layout is correct on a desktop and arrives on a phone zoomed out, with the text too small to read.",
        hint: "A mobile browser needs the viewport entry before it will use the device width, whatever the page contains. Add the standard meta element with name viewport and width=device-width.",
        file: "html",
        detect: "^(?=[\\s\\S]*<title)(?![\\s\\S]*name=[\"']viewport[\"'])",
        detectableExample: "<head><title>Revision timetable</title></head>",
      },
    ],
  },
  {
    lessonId: "ages-16-18-forms-labels",
    courseIds: ["ages-16-18"],
    concept: "A label is bound to its control by two matching values, the label's for attribute and the control's id, and that binding is what makes the pair one named field.",
    make: "The learner connects two visible labels to their fields on a placement request form.",
    difficulty: 2,
    prerequisites: ["ages-16-18-structure-metadata"],
    projectStep: "The project's form becomes usable with a keyboard and a screen reader, and its fields gain a larger clickable area, which the forms checkpoint records.",
    stages: {
      hook: {
        lead: "Two labels sit directly beside their fields and everything reads correctly on screen. Choosing the label does nothing, the cursor stays where it was, and a screen reader announces each field without saying what it wants. The word is visible and the fields are still unnamed. What has not been created?",
        variants: {
          guided: "A visible pairing is not a connected pairing. Today you create the connection the browser actually looks up.",
          balanced: "The layout puts the word beside the box. The browser needs a lookup key that ties the two together, and the lookup is by name.",
          independent: "Two strings create the binding. Decide which string belongs to the control and which to the label before you type either.",
        },
      },
      model: {
        lead: "<label for=\"manager\">Manager</label> then <input id=\"manager\" type=\"text\">. The for value and the id value are the same word, and that equality is the whole binding. Nothing else connects a label to a field.",
        variants: {
          guided: "Write the id on the field first, then repeat exactly the same word in the label's for attribute. Changing one without the other breaks it.",
          balanced: "The id must be unique in the document, because the binding is a lookup by name and a repeated name is ambiguous.",
          independent: "The label text and the id are different things. One is read aloud, the other is matched, so giving them identical wording is usually a mistake.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each field an id, add for to its label, then run the preview and choose the label text with the mouse.",
        variants: {
          guided: "Do the manager field first, run the page, choose its label, then repeat for the start date field.",
          balanced: "Add both bindings, then check each label focuses the field it names and not its neighbour.",
          independent: "Choose both id names before editing, then confirm every field carries exactly one label.",
        },
      },
      check: {
        lead: "Choose each label. The focus must land in the field that label names. Then read the two ids side by side: a repeated id binds two labels to the same control and leaves the other field unnamed.",
        variants: {
          guided: "Choose both labels and confirm the cursor moves into the matching field each time.",
          balanced: "Check the halves separately: the for value on the label, the id value on the control.",
          independent: "Confirm the ids are unique and that no field is described by two labels pointing at the same name.",
        },
      },
      explain: {
        lead: "Now a different form: a placement request that asks for a manager and a start date, with the labels visible and unconnected. No example open. Bind each label to its field so choosing the words puts the cursor in the right box.",
        variants: {
          guided: "The new form has the same two pairs. Add an id to each field and the matching for on its label.",
          balanced: "Same binding, new wording. Read each label before deciding an id name for its field.",
          independent: "Work with no example open and choose names that will still read well when the form is styled later.",
        },
      },
      transfer: {
        lead: "Every field the project's form gains needs this pair, and a connected label also enlarges the target a visitor can tap, which matters on a phone.",
        variants: {
          independent: "The binding is a correctness requirement and a usability improvement at the same time, which is rare enough to be worth remembering.",
          guided: "Each field in your project's form will carry one connected label.",
          balanced: "The same two strings appear on every field of the project's form.",
        },
      },
    },
    mastery: {
      freshTask: "A placement request form asks for a manager and a start date with visible but unconnected labels. Bind each label to its field so choosing the words moves the cursor into the field that label names.",
      observable: "Choosing the manager label focuses the manager field, and choosing the start date label focuses the date field.",
      reflection: "In your own words, which two values have to match, and what does the browser use the match for?",
      starterFiles: {
        html: "<form>\n  <label>Manager</label><input type=\"text\">\n  <label>Start date</label><input type=\"date\">\n  <button type=\"submit\">Send request</button>\n</form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The manager label is bound to its field", pattern: "<label[^>]+for=[\"']manager[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']manager[\"']" },
        { file: "html", label: "The start date label is bound to its field", pattern: "<label[^>]+for=[\"']start-date[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']start-date[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"manager\">Manager</label><input id=\"manager\" type=\"text\">\n  <label for=\"start-date\">Start date</label><input id=\"start-date\" type=\"date\">\n  <button type=\"submit\">Send request</button>\n</form>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a visible label beside a field is already connected to it.",
        symptom: "Choosing the words does nothing, and the field is announced without its name.",
        hint: "Visible is not connected. Add a for attribute to the label and give the field the same value as its id, because the browser binds the pair by matching those two strings.",
        file: "html",
        detect: "<label(?![^>]*\\bfor=)[^>]*>",
        detectableExample: "<label>Manager</label>",
      },
      {
        wrong: "a placeholder can stand in for the visible label.",
        symptom: "The field looks named until the visitor starts typing, and the name disappears at exactly the moment it is needed.",
        hint: "A placeholder is a hint inside the field, not a name for it, and it vanishes on the first keystroke. Keep a visible label element and bind it with for and id instead.",
        file: "html",
        detect: "<input[^>]+placeholder=",
        detectableExample: "<input id=\"manager\" placeholder=\"Manager name\">",
      },
    ],
  },
  {
    lessonId: "ages-16-18-forms-types",
    courseIds: ["ages-16-18"],
    concept: "The input type is a promise about the value, and the browser uses that promise to offer the right keyboard and to refuse a value that cannot be right.",
    make: "The learner chooses suitable types for a work email and a group size, and bounds the size to the range the activity could accept.",
    difficulty: 3,
    prerequisites: ["ages-16-18-forms-labels"],
    projectStep: "The project's form starts helping before submission, with keyboards and limits suited to each question, which is the second half of the forms checkpoint.",
    stages: {
      hook: {
        lead: "A workshop request form asks for a work email and a group size, and both are plain text boxes. On a phone the keyboard is identical for each, a mistyped address is accepted, and a visitor can request four hundred places. Which attribute would have prevented all three?",
        variants: {
          guided: "One field is an address and one is a small whole number. Today each field states which it is, and the number states its range.",
          balanced: "The type is not decoration. It changes the keyboard, the autofill suggestion and the checks the browser performs before submission.",
          independent: "Choose the narrowest type that still describes the value, and bound it where a range is meaningful.",
        },
      },
      model: {
        lead: "<input id=\"work-email\" type=\"email\"> tells the browser what kind of value to expect. <input id=\"group-size\" type=\"number\" min=\"2\" max=\"12\"> narrows it further with a range the activity can actually accommodate.",
        variants: {
          guided: "Two changes per field: the type, and for the group size the smallest and largest permitted value.",
          balanced: "Browser checks are help, not proof. The value is still validated again when it reaches the application, because a typed value can bypass the field entirely.",
          independent: "A range is a statement about the activity, so it belongs on the field and not on the form that contains several different questions.",
        },
      },
      build: {
        lead: "Work in the HTML file. Set the email type first and run the preview at a phone width, then set the number type and add its range.",
        variants: {
          guided: "Set the email type, then the number type, then add min and max to the group size.",
          balanced: "Change one attribute at a time so each effect can be attributed to a single edit.",
          independent: "Decide the range from the wording of the question before you type, then test both boundaries.",
        },
      },
      check: {
        lead: "Enter an address with no at sign and submit. The browser should object before the form leaves the page. Then enter a size outside the range and submit again: the browser should refuse that too.",
        variants: {
          guided: "Test one wrong value in each field and watch the browser refuse it.",
          balanced: "Describe what the browser did in each case, because the two refusals come from different attributes.",
          independent: "Test the boundary values themselves as well as the values outside them, since an off-by-one range is easy to write and hard to notice.",
        },
      },
      explain: {
        lead: "Now a different form: a workshop request asking for a work email and a group size between two and twelve people. No example open. Choose the types that suit each value and bound the size.",
        variants: {
          guided: "The new form has the same two questions. Set both types and add the smallest and largest group size.",
          balanced: "Same decision, new wording. Read what each field asks for before choosing its type.",
          independent: "Work with no example open and set the range from the business rule stated in the wording.",
        },
      },
      transfer: {
        lead: "Every field the project gains later gets the same treatment, and the release note records the validation as tested behaviour rather than as an intention.",
        variants: {
          independent: "A suitable type is the cheapest first line of defence and never the only one, because it can be removed from the markup in a second.",
          guided: "Your project's fields will each declare the kind of value they expect.",
          balanced: "One attribute removes a whole class of typing mistakes before the form is ever submitted.",
        },
      },
    },
    mastery: {
      freshTask: "A workshop request form asks for a work email and a group size, both currently plain text. Choose the type that suits each value and limit the group size to between two and twelve.",
      observable: "The email field refuses a value with no at sign, and the group size field refuses a count outside two to twelve.",
      reflection: "In your own words, why is a suitable input type useful on a phone, and why is it not the only validation the application needs?",
      starterFiles: {
        html: "<label for=\"work-email\">Work email</label><input id=\"work-email\" type=\"text\">\n<label for=\"group-size\">Group size</label><input id=\"group-size\" type=\"text\">",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The work email uses the email type", pattern: "<input[^>]+type=[\"']email[\"']" },
        { file: "html", label: "The group size uses the number type", pattern: "<input[^>]+type=[\"']number[\"']" },
        { file: "html", label: "The group size has a lower bound of two", pattern: "<input[^>]+min=[\"']?2" },
        { file: "html", label: "The group size has an upper bound of twelve", pattern: "<input[^>]+max=[\"']?12" },
      ],
      workedSolution: {
        html: "<label for=\"work-email\">Work email</label><input id=\"work-email\" type=\"email\">\n<label for=\"group-size\">Group size</label><input id=\"group-size\" type=\"number\" min=\"2\" max=\"12\">",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "text is the safest type because it accepts whatever the visitor types.",
        symptom: "Every field opens the same keyboard, and the browser cannot help with a value that cannot be right.",
        hint: "A text field accepts anything and therefore promises nothing. Use email for the address and number for the count, so the browser offers a suitable keyboard and checks the value as it is typed.",
        file: "html",
        detect: "type=[\"']text[\"']",
        detectableExample: "<input id=\"group-size\" type=\"text\">",
      },
      {
        wrong: "the accepted range belongs on the form element rather than on the field.",
        symptom: "The range never applies, because the form contains several questions and does not describe one value.",
        hint: "A range describes one question, so it belongs on that control. Put min and max on the group size field itself, alongside its type.",
        file: "html",
        detect: "<form[^>]+(?:min|max)=",
        detectableExample: "<form min=\"2\" max=\"12\">",
      },
    ],
  },
  {
    lessonId: "ages-16-18-forms-groups",
    courseIds: ["ages-16-18"],
    concept: "A fieldset groups controls that answer one question, and its legend states that question once for the whole group.",
    make: "The learner wraps three contact choices in a fieldset, adds a legend and gives the radios one shared name.",
    difficulty: 3,
    prerequisites: ["ages-16-18-forms-types"],
    projectStep: "The project's grouped questions become understandable as a single choice rather than as three unrelated switches, which the keyboard pass in the forms checkpoint checks.",
    stages: {
      hook: {
        lead: "Three contact choices sit under a line of text that reads Contact method. A screen reader user hears three separate options with no idea that they belong to one question, and the browser lets all three be selected at once. The wording is present and the grouping is not. Which element would fix both faults?",
        variants: {
          guided: "One question with three answers needs to be marked as one question. Today you wrap it and state what it asks.",
          balanced: "The shared name is what makes the options exclusive. The grouping element is what makes the question readable as a unit.",
          independent: "The paragraph above the choices is a visual hint only. A group needs a name the browser reads with the controls.",
        },
      },
      model: {
        lead: "<fieldset> wraps the whole question, <legend> carries the question text, and every radio inside shares one name. Sharing the name is what makes the options exclusive, and the legend is what a visitor hears when they reach the group.",
        variants: {
          guided: "Three parts: the wrapping element, the question inside the legend, and one name repeated on all three radios.",
          balanced: "The legend replaces the loose paragraph rather than repeating it, because the paragraph is not announced with the controls.",
          independent: "Different values under one shared name is the pattern for one choice from a set, and the value is what the application receives.",
        },
      },
      build: {
        lead: "Work in the HTML file. Wrap the choices first, then move the question text into the legend, then give every radio the same name.",
        variants: {
          guided: "Add the fieldset around the three labels, move Contact method into a legend, then set name on all three radios.",
          balanced: "Change the grouping first and run the preview, then handle the shared name, so each fault can be observed separately.",
          independent: "Decide the shared name before editing, because a name that describes one option will mislead later.",
        },
      },
      check: {
        lead: "Reach the group with the keyboard and choose each option in turn. Only one should stay selected. Then read the group's announcement: the question should be stated once, before the options rather than beside one of them.",
        variants: {
          guided: "Choose each option and confirm the previous one clears. Read the question once at the start of the group.",
          balanced: "Check the two mechanisms separately: the legend for the wording, the shared name for the exclusivity.",
          independent: "Confirm the three options sit inside the same group and that no option escaped the fieldset when it was wrapped.",
        },
      },
      explain: {
        lead: "Now a different form: a feedback form with three rating choices under a loose paragraph. No example open. Group the choices under one question and make them exclusive.",
        variants: {
          guided: "The new form has the same three choices. Wrap them, state the question in a legend and share one name.",
          balanced: "Same pattern, new wording. Read the question before deciding what the shared name should be.",
          independent: "Work with no example open and choose a shared name that describes the decision rather than one of its options.",
        },
      },
      transfer: {
        lead: "Any question with a small set of answers in the project uses this pattern, and the accessibility pass checks that each group was announced with its question.",
        variants: {
          independent: "A shared name is a data decision as well as a markup one, because the application receives the value and never the label.",
          guided: "Your project's choice questions will each use one group and one legend.",
          balanced: "The legend is the last place a visitor can read what the group is asking before they answer it.",
        },
      },
    },
    mastery: {
      freshTask: "A feedback form shows three rating choices under a loose paragraph. Wrap the choices in one group, state the shared question in a legend and make the choices exclusive under a single name.",
      observable: "Choosing one rating clears the others, and the group announces its question once before the options.",
      reflection: "In your own words, what does the shared name do, and what does the legend do, and why are those two different jobs?",
      starterFiles: {
        html: "<p>Overall rating</p>\n<label><input type=\"radio\"> Poor</label>\n<label><input type=\"radio\"> Fair</label>\n<label><input type=\"radio\"> Good</label>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The choices sit inside one group", pattern: "<fieldset[\\s>]" },
        { file: "html", label: "The group states its own question", pattern: "<legend[\\s>][^<]{5,}</legend>" },
        { file: "html", label: "The ratings share one name", pattern: "(?:type=[\"']radio[\"'][^>]+name=[\"']rating[\"']|name=[\"']rating[\"'][^>]+type=[\"']radio[\"'])" },
      ],
      workedSolution: {
        html: "<fieldset>\n  <legend>Overall rating</legend>\n  <label><input type=\"radio\" name=\"rating\" value=\"poor\"> Poor</label>\n  <label><input type=\"radio\" name=\"rating\" value=\"fair\"> Fair</label>\n  <label><input type=\"radio\" name=\"rating\" value=\"good\"> Good</label>\n</fieldset>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a paragraph above the options explains the question well enough.",
        symptom: "Each option is announced on its own with no question attached to it, so the visitor answers three unrelated prompts.",
        hint: "A loose paragraph is not read with the controls. Wrap the group in a fieldset and move the question into its legend, so the wording arrives with the options it describes.",
        file: "html",
        detect: "^(?=[\\s\\S]*type=[\"']radio[\"'])(?![\\s\\S]*<legend)",
        detectableExample: "<p>Overall rating</p>\n<label><input type=\"radio\"> Poor</label>",
      },
      {
        wrong: "each option can carry its own name, because the three choices are different answers.",
        symptom: "All three options can be selected at once, and the form receives three values for one question.",
        hint: "The shared name makes the options exclusive, because radios with the same name form one set. Give every option the same name and let the value distinguish them.",
        file: "html",
        detect: "type=[\"']radio[\"'][^>]*name=[\"']([^\"']+)[\"'][\\s\\S]*type=[\"']radio[\"'][^>]*name=[\"'](?!\\1)[^\"']+[\"']",
        detectableExample: "<input type=\"radio\" name=\"poor\">\n<input type=\"radio\" name=\"fair\">",
      },
    ],
  },
  {
    lessonId: "ages-16-18-forms-messages",
    courseIds: ["ages-16-18"],
    concept: "A form explains its requirements before submission and announces its result afterwards, and both messages belong in the markup rather than in a popup.",
    make: "The learner adds persistent help text to a reference field, connects it with aria-describedby and creates a status region for the result.",
    difficulty: 4,
    prerequisites: ["ages-16-18-forms-groups"],
    projectStep: "The project's form gains guidance that survives a page reload and feedback that a screen reader announces without moving focus, which is the release checklist item for its status message.",
    stages: {
      hook: {
        lead: "A support form accepts a reference number, and the format is only explained in a tooltip that appears on hover. A visitor who submits a wrong choice sees a short-lived browser bubble that vanishes with no record of what went wrong. Which information is missing from the page itself, and where would a visitor look for it?",
        variants: {
          guided: "Two messages are missing: what the field wants before submission, and what happened afterwards.",
          balanced: "A tooltip is not available to touch and keyboard users, and a browser bubble is not part of the page once it closes.",
          independent: "Treat form messaging as content. It should exist in the document, be readable before submission and remain readable after it.",
        },
      },
      model: {
        lead: "<p id=\"reference-help\">Include the reference from your letter.</p> carries the requirement, and aria-describedby=\"reference-help\" on the input attaches that same text to the field. A separate <p id=\"request-result\" role=\"status\"></p> states the outcome, and the status role is what makes the change announced without stealing focus.",
        variants: {
          guided: "Write three things: the help paragraph, the reference to it from the field, and an empty result paragraph with the status role.",
          balanced: "The connection runs from the field to the help text, so the id lives on the paragraph and the reference lives on the input.",
          independent: "A status region is announced politely, which means the message is spoken after the current task rather than interrupting it.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the help paragraph first and connect it, then add the empty result region after the form.",
        variants: {
          guided: "Add the help paragraph with its id, then reference that id from the input, then add the result paragraph.",
          balanced: "Connect the help text before writing the result region, because the first is read on arrival and the second only after an action.",
          independent: "Write each message for its own moment: the help text explains the requirement, the result states what happened.",
        },
      },
      check: {
        lead: "Focus the reference field and read what is announced: the label first, then the help text. Then read the document and confirm the result region exists, is empty, and carries the status role rather than being created on demand.",
        variants: {
          guided: "Check the help text arrives with the field, then check the result paragraph is present and empty.",
          balanced: "Check the two messages separately, because one explains a requirement and one reports an outcome.",
          independent: "Confirm the help text adds something the label does not, since a message that repeats the label wastes the visitor's attention.",
        },
      },
      explain: {
        lead: "Now a different form: a support request that asks for a reference number with no explanation of the format and no place to show a result. No example open. Add help text, connect it to the field, and create a status region for the outcome.",
        variants: {
          guided: "The new form needs the same three additions: the help paragraph, the reference to it and the empty result region.",
          balanced: "Same pattern, new wording. Decide what the visitor must know before typing, then state only that.",
          independent: "Work with no example open and write help text that would stop the most likely mistake rather than describing the whole field.",
        },
      },
      transfer: {
        lead: "The project's form reuses this pattern for every field that needs a rule, and the release note lists its status message as a tested behaviour.",
        variants: {
          independent: "A message that already exists in the markup can be read, translated and searched, which a browser bubble can never be.",
          guided: "Every field in your project with a rule will carry its own help text.",
          balanced: "The status region stays in the document, so the last result is still readable after the visitor looks away.",
        },
      },
    },
    mastery: {
      freshTask: "A support request asks for a reference number with no explanation and no place to show a result. Add help text that states the format, connect it to the field and create an empty status region for the outcome.",
      observable: "Focusing the reference field announces its label and then its help text, and an empty status region is present for the result.",
      reflection: "In your own words, why does a status region report a result differently from a browser error bubble?",
      starterFiles: {
        html: "<form>\n  <label for=\"reference\">Reference</label>\n  <input id=\"reference\" type=\"text\">\n  <button type=\"submit\">Send request</button>\n</form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The field has help text of its own", pattern: "id=[\"']reference-help[\"']" },
        { file: "html", label: "The field points at its help text", pattern: "aria-describedby=[\"']reference-help[\"']" },
        { file: "html", label: "The result is announced without moving focus", pattern: "role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"reference\">Reference</label>\n  <input id=\"reference\" type=\"text\" aria-describedby=\"reference-help\">\n  <p id=\"reference-help\">Include the reference from your letter.</p>\n  <button type=\"submit\">Send request</button>\n</form>\n<p id=\"request-result\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the requirement can live in a placeholder so the layout stays clean.",
        symptom: "The rule disappears the moment the visitor starts typing, which is exactly when it is needed.",
        hint: "A placeholder is a hint inside the field and vanishes on the first keystroke. Put the requirement in a paragraph with an id and point the field at it with aria-describedby, so the text stays on the page.",
        file: "html",
        detect: "<input[^>]+placeholder=",
        detectableExample: "<input id=\"reference\" placeholder=\"Reference from your letter\">",
      },
      {
        wrong: "the browser's own error message is enough, so no status region is needed.",
        symptom: "The result leaves no trace on the page, and a visitor using a screen reader may never hear that the attempt failed.",
        hint: "The browser message is transient and outside the document. Add a paragraph with the status role so the outcome is written into the page and announced politely when it changes.",
        file: "html",
        detect: "^(?=[\\s\\S]*<form)(?![\\s\\S]*role=[\"']status[\"'])",
        detectableExample: "<form><label for=\"reference\">Reference</label><input id=\"reference\"></form>",
      },
    ],
  },
];
