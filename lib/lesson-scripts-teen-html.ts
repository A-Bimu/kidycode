import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 13 to 15, the HTML half of the remaining content batch.
 *
 * Seven challenge lessons that had no six-moment script: the page regions, the
 * navigation links, the meaningful image description and the four form lessons
 * on labels, input types, grouped choices and status messages.
 *
 * The wording is written for a 13 to 15 year old: a named page, a symptom that
 * can be seen in the preview, and one decision per step. Every script keeps the
 * guided, balanced and independent wording, an independent fresh task with its
 * own checks, and two misconception-specific hints with proved detectors.
 */

export const teenHtmlScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-structure-landmarks",
    courseIds: ["ages-13-15"],
    concept: "Landmark elements name the large regions of a page, so a reader can jump between them and a machine can describe the outline.",
    make: "The learner gives a library page a header, a navigation region, a main region and a footer.",
    difficulty: 3,
    prerequisites: ["ages-13-15-structure-headings"],
    projectStep: "The project's large regions become landmarks, which is what the responsive layout and the keyboard order will be built on.",
    stages: {
      hook: {
        lead: "Two library pages with the same words. One is a stack of div elements. The other names its header, its navigation, its main content and its footer. A screen reader user can list the regions on the second page in a second and cannot on the first. What did the second page add?",
        variants: {
          guided: "The words are identical. Only the tags differ. One page can be navigated by region and the other cannot.",
          balanced: "A div says nothing about what it holds. A landmark element does, for a person using assistive technology and for the browser.",
          independent: "Landmarks are the page's table of contents. Decide which regions deserve one before you type a tag.",
        },
      },
      model: {
        lead: "<header> holds the page title and the navigation. <nav> wraps the links. <main> holds the content that is unique to this page. <footer> holds the ending note. Each element closes with its own closing tag.",
        variants: {
          guided: "Read it in page order: header first, nav inside the header, main around the content, footer at the end.",
          balanced: "The landmarks describe jobs rather than appearance, so they are chosen from meaning and not from layout.",
          independent: "One main region per page. Sections and articles live inside it, so the landmark list stays short and useful.",
        },
      },
      build: {
        lead: "Work in the HTML file. Convert one region at a time and run the preview between changes so you can see which lines moved.",
        variants: {
          guided: "Start with the top block: change the first div to header. Run the page. Then work downwards.",
          balanced: "Convert the regions in reading order, and keep every opening tag matched with its closing tag.",
          independent: "Decide the boundaries of each region before you type, then convert them in one pass and check the outline.",
        },
      },
      check: {
        lead: "Read the page's region list. It should open with a header, contain one navigation and one main region, and end with a footer. Two main regions is the most common mistake, and it splits the page in two.",
        variants: {
          guided: "Count the main regions. There should be exactly one.",
          balanced: "Check that the navigation sits in the header, where a reader expects it.",
          independent: "Confirm the outline is unique: one header, one main, one footer, and no region nested inside itself.",
        },
      },
      explain: {
        lead: "Now a different page: a community library page that uses div elements for every large part. No example open. Give it a header, a navigation region, a main region and a footer.",
        variants: {
          guided: "The new page has the same four parts, just written with divs. Convert each one.",
          balanced: "Same landmarks, different words. Read the content before choosing which region each block belongs to.",
          independent: "Work with no example open and decide where the main region starts and ends.",
        },
      },
      transfer: {
        lead: "Your project's landmarks are what the navigation links will point at and what the responsive layout will rearrange.",
        variants: {
          independent: "Keep the same landmarks on every page of the project, because consistency is what makes a site learnable.",
          guided: "Your project will use these four regions on every page.",
          balanced: "A landmark that appears on every page becomes a place a visitor can trust.",
        },
      },
    },
    mastery: {
      freshTask: "A neighbourhood library page uses div elements for every large part. Give the page a header region, a navigation region, a main region and a footer so each part can be reached directly.",
      observable: "The page's region list opens with a header, holds one navigation and one main region, and ends with a footer.",
      reflection: "In your own words, what can a visitor do on the second page that they cannot do on the first?",
      starterFiles: {
        html: "<div>\n  <h1>Sunrise Community Library</h1>\n  <p>Opening hours and borrowing</p>\n</div>\n<div>\n  <h2>Opening hours</h2>\n  <p>Monday to Friday, 9am to 6pm.</p>\n</div>\n<div>Updated this week</div>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The page opens with a header region", pattern: "<header[\\s>]" },
        { file: "html", label: "The navigation is its own region", pattern: "<nav[\\s>]" },
        { file: "html", label: "The content sits in a main region", pattern: "<main[\\s>]" },
        { file: "html", label: "The page ends with a footer region", pattern: "<footer[\\s>]" },
      ],
      workedSolution: {
        html: "<header>\n  <h1>Sunrise Community Library</h1>\n  <nav><a href=\"#hours\">Opening hours</a></nav>\n</header>\n<main>\n  <section>\n    <h2>Opening hours</h2>\n    <p>Monday to Friday, 9am to 6pm.</p>\n  </section>\n</main>\n<footer>Updated this week</footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a div with a class name does the same job as a landmark element.",
        symptom: "The layout can be styled, but the page's region list is empty and nothing can be jumped to.",
        hint: "A class is a name you invented. Only the semantic element creates the landmark, so use header, nav, main and footer where the class names say they belong.",
        file: "html",
        detect: "<div[^>]*class=[^>]*(?:header|nav|main|footer)",
        detectableExample: "<div class=\"header\"><h1>Library</h1></div>",
      },
      {
        wrong: "each large part of the page can be a main region.",
        symptom: "The page reports two or three main regions, so there is no single place that holds its content.",
        hint: "One page holds one main region. Wrap the remaining parts in section or article inside it and keep the landmark list unique.",
        file: "html",
        detect: "<main[\\s\\S]*<main",
        detectableExample: "<main><h2>Opening hours</h2></main>\n<main><h2>Borrowing</h2></main>",
      },
    ],
  },
  {
    lessonId: "ages-13-15-structure-links",
    courseIds: ["ages-13-15"],
    concept: "A fragment link needs two matching halves, the destination after the hash and the id on the element it should reach.",
    make: "The learner turns two plain navigation phrases into links that reach the right sections.",
    difficulty: 2,
    prerequisites: ["ages-13-15-structure-landmarks"],
    projectStep: "The project's navigation starts working, so a visitor can reach any region without scrolling to find it.",
    stages: {
      hook: {
        lead: "The navigation says Routes and Gear and nothing happens when either is chosen. The words are correct, the sections exist, and the page stays still. What is missing between the word and the section?",
        variants: {
          guided: "The link and its destination have to agree on one word. Today you connect them.",
          balanced: "A link has an address and the destination has a name, and the two strings must match exactly.",
          independent: "Decide the destination name once and use it in both places, because a mismatched hash fails silently.",
        },
      },
      model: {
        lead: "<a href=\"#routes\">Routes</a> carries the address, and <section id=\"routes\"> carries the name it points at. The hash stays in the href and is left out of the id.",
        variants: {
          guided: "Read both halves together: the href has the hash and the id does not. That is the one difference to remember.",
          balanced: "The link text is read out of context by a screen reader, so name the destination rather than saying click here.",
          independent: "An id must be unique on the page, because a fragment link reaches the first element that carries the name.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each destination its id first, then wrap the navigation phrase in an anchor. Run the preview and use the link.",
        variants: {
          guided: "Add the two ids, then add the two links. Run the page and click one.",
          balanced: "Write the destination first so the address already exists when the link is written.",
          independent: "Decide both destination names before you type, then use the navigation to test each one.",
        },
      },
      check: {
        lead: "Choose each link and watch the page jump. If nothing moves, compare the hash with the id character by character: a missing hash or a different word is enough to break it.",
        variants: {
          guided: "Test both links and check the page moves to the right section each time.",
          balanced: "Check the two halves in the order the browser does: address first, then destination.",
          independent: "Check the ids are unique, because a repeated id sends a link to the wrong place.",
        },
      },
      explain: {
        lead: "Now a different page: a hiking club page that lists its routes and its gear. No example open. Turn the two plain phrases into links that reach the matching sections, and give those sections ids.",
        variants: {
          guided: "The new page has two sections and two phrases. Write the ids first, then the links.",
          balanced: "Same pattern, new names. Read the section names before choosing the hash values.",
          independent: "Work with no example open and choose names a visitor could guess.",
        },
      },
      transfer: {
        lead: "The project's navigation reuses these links on every page, which is why the section names need to stay stable.",
        variants: {
          independent: "Renaming a section later means renaming every link to it, so choose a name that will still make sense next term.",
          guided: "Your project's menu will use these links on every page.",
          balanced: "The name in the URL is part of the interface, even when a visitor never types it.",
        },
      },
    },
    mastery: {
      freshTask: "A hiking club page lists its routes and its gear. Turn the two plain phrases in the navigation into links that reach the matching sections, and give those sections ids.",
      observable: "Choosing a navigation link moves the page to the section whose name matches the link.",
      reflection: "In your own words, which two strings must match for a fragment link to work?",
      starterFiles: {
        html: "<nav><p>Routes Gear</p></nav>\n<main>\n  <section><h2>Routes</h2><p>Three walks near the city.</p></section>\n  <section><h2>Gear</h2><p>What to carry.</p></section>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The route link points at a destination", pattern: "<a[^>]+href=[\"']#routes[\"'][^>]*>[^<]+</a>" },
        { file: "html", label: "The gear link points at a destination", pattern: "<a[^>]+href=[\"']#gear[\"'][^>]*>[^<]+</a>" },
        { file: "html", label: "The two destination ids exist", pattern: "(?:id=[\"']routes[\"'][\\s\\S]*id=[\"']gear[\"']|id=[\"']gear[\"'][\\s\\S]*id=[\"']routes[\"'])" },
      ],
      workedSolution: {
        html: "<nav><a href=\"#routes\">Routes</a> <a href=\"#gear\">Gear</a></nav>\n<main>\n  <section id=\"routes\"><h2>Routes</h2><p>Three walks near the city.</p></section>\n  <section id=\"gear\"><h2>Gear</h2><p>What to carry.</p></section>\n</main>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the section headings are enough, so the ids can be left out.",
        symptom: "The links look correct and the page never moves when one is chosen.",
        hint: "A fragment link needs something to arrive at. Add an id to each section, using exactly the word that follows the hash in the link.",
        file: "html",
        detect: "^(?=[\\s\\S]*href=[\"']#)(?![\\s\\S]*\\bid=)",
        detectableExample: "<nav><a href=\"#routes\">Routes</a></nav>\n<main><section><h2>Routes</h2></section></main>",
      },
      {
        wrong: "the link text can say click here, because the destination is on the same page.",
        symptom: "A screen reader user hears a list of links with no idea where any of them goes.",
        hint: "Link text is read on its own. Name the destination, so Routes and Gear rather than click here, because the list of links is often all a visitor hears.",
        file: "html",
        detect: ">\\s*(?:here|click here|more)\\s*<",
        detectableExample: "<a href=\"#routes\">Click here</a>",
      },
    ],
  },
  {
    lessonId: "ages-13-15-structure-metadata",
    courseIds: ["ages-13-15"],
    concept: "Alternative text states what an image adds, and an empty alternative hides an image that adds nothing.",
    make: "The learner describes the informative photograph on a market page and reduces the decorative one.",
    difficulty: 2,
    prerequisites: ["ages-13-15-structure-links"],
    projectStep: "The project's photographs become understandable to a visitor who cannot see them, which is a requirement of the release checklist.",
    stages: {
      hook: {
        lead: "A market page has two images, one photograph of the stall and one decorative divider. A visitor using a screen reader hears nothing useful for either. Should both images be described?",
        variants: {
          guided: "One picture carries information and one is decoration. Today you describe the first and hide the second.",
          balanced: "Alternative text is not a caption. It replaces the picture for someone who cannot see it.",
          independent: "Decide what information would be missing if the picture disappeared, and write only that.",
        },
      },
      model: {
        lead: "<img src=\"stall.jpg\" alt=\"Crates of tomatoes and peppers on a wooden stall\"> describes what the picture adds. <img src=\"divider.png\" alt=\"\"> tells a screen reader to skip an image that carries no information.",
        variants: {
          guided: "Describe the useful thing in the picture. For the decoration, leave the value empty on purpose.",
          balanced: "An empty alt is a decision, not a mistake. It says the image means nothing on its own.",
          independent: "Alternative text replaces the image rather than describing its technique, so the words would not mention that a photograph exists.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add alternative text to the photograph first and run the preview, then set the decorative image to an empty value.",
        variants: {
          guided: "Write the description of the stalls, then write alt with nothing between the quotes for the divider.",
          balanced: "Do the informative image first, because its wording is the part that takes judgement.",
          independent: "Write the description before you look at the file, then paste it in unchanged.",
        },
      },
      check: {
        lead: "Read your alternative text as if the picture were missing. It should tell you what mattered. Then check the divider has an empty value rather than a description.",
        variants: {
          guided: "Cover the picture in your mind and read the words. Do they still make sense?",
          balanced: "Check both images: one described, one deliberately silent.",
          independent: "Confirm the wording is specific, because a description that could fit any photograph helps nobody.",
        },
      },
      explain: {
        lead: "Now a different page: a farmers market page with a photograph of the stall and a decorative divider. No example open. Describe the photograph and keep the decoration out of the way.",
        variants: {
          guided: "The new page has the same two images. Describe the stalls and give the divider an empty value.",
          balanced: "Same decision, new pictures. Decide which one carries information before you write anything.",
          independent: "Work with no example open and decide the exact wording without seeing a sample.",
        },
      },
      transfer: {
        lead: "Every photograph the project gains later needs this decision, and the release lesson checks that it was made.",
        variants: {
          independent: "A description is part of the content, so it deserves the same care as the words beside the picture.",
          guided: "Your project's pictures will all be described this way.",
          balanced: "The two cases, informative and decorative, cover nearly every image a small site uses.",
        },
      },
    },
    mastery: {
      freshTask: "A farmers market page shows a photograph of the stall and a decorative divider. Describe what the photograph adds, and make the decorative image silent.",
      observable: "The photograph announces a useful description and the divider is skipped.",
      reflection: "In your own words, why is an empty alternative value a decision rather than an omission?",
      starterFiles: {
        html: "<h1>Farmers market</h1>\n<img src=\"stall.jpg\">\n<img src=\"divider.png\">\n<p>Every Saturday on the high street.</p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The photograph has a useful description", pattern: "<img[^>]+alt=[\"'][^\"']{12,}[\"']" },
        { file: "html", label: "The decorative image is silent", pattern: "alt=[\"']{2}" },
      ],
      workedSolution: {
        html: "<h1>Farmers market</h1>\n<img src=\"stall.jpg\" alt=\"Crates of tomatoes and peppers on a wooden stall\">\n<img src=\"divider.png\" alt=\"\">\n<p>Every Saturday on the high street.</p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the alternative text can repeat the file name.",
        symptom: "A visitor hears the file name read out, which tells them nothing they could not already guess.",
        hint: "Describe what the picture shows and why it is there. The file name is an address for the browser, not information for a reader.",
        file: "html",
        detect: "alt=[\"'][^\"']*\\.(?:jpg|jpeg|png|webp)[\"']",
        detectableExample: "<img src=\"stall.jpg\" alt=\"stall.jpg\">",
      },
      {
        wrong: "a decorative image needs a description as well.",
        symptom: "The screen reader announces a line about a decoration, interrupting the sentence it sits in.",
        hint: "A picture that adds no information should be skipped. Give it an empty value, alt with nothing between the quotes, instead of a description.",
        file: "html",
        detect: "divider[^>]*alt=[\"'][^\"']+[\"']",
        detectableExample: "<img src=\"divider.png\" alt=\"A line across the page\">",
      },
    ],
  },
  {
    lessonId: "ages-13-15-forms-labels",
    courseIds: ["ages-13-15"],
    concept: "A label is connected to its field by two matching values, the label's for attribute and the field's id.",
    make: "The learner connects two visible labels to their fields on a workshop signup form.",
    difficulty: 2,
    prerequisites: ["ages-13-15-structure-metadata"],
    projectStep: "The project's forms become usable with a screen reader and easier to click, which is the first checkpoint of the forms module.",
    stages: {
      hook: {
        lead: "Two fields, two labels, and clicking either label does nothing. The words are on screen. What has not happened between the word and the box?",
        variants: {
          guided: "Clicking a label should put the cursor in its field. Today you make that true.",
          balanced: "The visible pairing is for people looking at the screen. The programmatic pairing is what a screen reader and a mouse both use.",
          independent: "Two matching strings create the connection. Decide where each one belongs before you type.",
        },
      },
      model: {
        lead: "<label for=\"full-name\">Full name</label> then <input id=\"full-name\" type=\"text\">. The for value and the id value are the same word, and that equality is the whole connection.",
        variants: {
          guided: "Write the id on the field, then repeat exactly the same word in the label's for attribute.",
          balanced: "The id must be unique on the page, because the connection is a lookup by name.",
          independent: "The label text and the id are different things. One is read out, the other is matched, so naming them the same is usually a mistake.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give each field an id first, then add for to its label. Run the preview and click the label text.",
        variants: {
          guided: "Do the name field first, run the page, click the label, then repeat for the phone field.",
          balanced: "Add both connections, then click each label and check the cursor lands in the right field.",
          independent: "Decide both id names before you type, then verify every field has exactly one label.",
        },
      },
      check: {
        lead: "Click each label. The cursor must land in the field the label names. Then check the two ids are different, because a repeated id connects two labels to the same field.",
        variants: {
          guided: "Click both labels and check the cursor moves to the matching field each time.",
          balanced: "Check the two halves separately: the for value and the id value.",
          independent: "Confirm the ids are unique, and that no field has two labels pointing at it.",
        },
      },
      explain: {
        lead: "Now a different page: a workshop signup form that asks for a full name and a phone number. No example open. Connect each visible label to its field.",
        variants: {
          guided: "The new form has two labels and two fields. Add an id to each field, then the matching for.",
          balanced: "Same connection, new words. Read the labels before choosing id names.",
          independent: "Work with no example open and choose id names that will still read well in a later stylesheet.",
        },
      },
      transfer: {
        lead: "The project's form reuses this connection for every field, and the accessibility audit checks that none was skipped.",
        variants: {
          independent: "A connected label enlarges the clickable area as well as naming the field, so it helps every visitor.",
          guided: "Every field in your project will have a connected label.",
          balanced: "The same two strings appear on every field of the project's form.",
        },
      },
    },
    mastery: {
      freshTask: "A workshop signup form asks for a full name and a phone number. Connect each visible label to its field so choosing the label moves the cursor into the right box.",
      observable: "Choosing the words Full name focuses the name field, and choosing Phone focuses the number field.",
      reflection: "In your own words, which two values have to match, and what does the match create?",
      starterFiles: {
        html: "<form>\n  <label>Full name</label>\n  <input type=\"text\">\n  <label>Phone</label>\n  <input type=\"tel\">\n  <button type=\"submit\">Sign up</button>\n</form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The name label is connected to its field", pattern: "<label[^>]+for=[\"']full-name[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']full-name[\"']" },
        { file: "html", label: "The phone label is connected to its field", pattern: "<label[^>]+for=[\"']phone[\"'][^>]*>[\\s\\S]*<input[^>]+id=[\"']phone[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"full-name\">Full name</label>\n  <input id=\"full-name\" type=\"text\">\n  <label for=\"phone\">Phone</label>\n  <input id=\"phone\" type=\"tel\">\n  <button type=\"submit\">Sign up</button>\n</form>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the visible label text is enough for every user.",
        symptom: "Clicking the words does nothing and a screen reader reads the field as unlabelled.",
        hint: "Visible is not connected. Add a for attribute to the label and give the field the same value as its id, so the two are linked.",
        file: "html",
        detect: "<label(?![^>]*\\bfor=)[^>]*>",
        detectableExample: "<label>Full name</label>",
      },
      {
        wrong: "two fields can share one id because they sit in the same form.",
        symptom: "Choosing the second label focuses the first field, and the page has a duplicate id.",
        hint: "An id names one element only. Give the phone field its own id and point its label at that name instead.",
        file: "html",
        detect: "id=[\"']([^\"']+)[\"'][\\s\\S]*id=[\"']\\1[\"']",
        detectableExample: "<input id=\"field\">\n<input id=\"field\">",
      },
    ],
  },
  {
    lessonId: "ages-13-15-forms-types",
    courseIds: ["ages-13-15"],
    concept: "An input type is a promise about the value, and it lets the browser offer the right keyboard and basic checks.",
    make: "The learner chooses suitable types for an email address and a seat count, and bounds the count.",
    difficulty: 3,
    prerequisites: ["ages-13-15-forms-labels"],
    projectStep: "The project's form starts helping the visitor before submission, with keyboards and limits suited to each field.",
    stages: {
      hook: {
        lead: "A booking form asks for an email address and a number of seats, and both are plain text boxes. On a phone the keyboard is the same for each, and a visitor can ask for ninety nine seats. What would change if the fields described their values?",
        variants: {
          guided: "One field is an address and one is a small number. Today each field says which it is.",
          balanced: "The type is not decoration. It changes the keyboard, the autofill and the checks the browser performs.",
          independent: "Choose the narrowest type that describes the value, and bound it where a range makes sense.",
        },
      },
      model: {
        lead: "<input id=\"booking-email\" type=\"email\"> tells the browser what kind of value to expect. <input id=\"seats\" type=\"number\" min=\"1\" max=\"6\"> narrows it further with a range.",
        variants: {
          guided: "Two changes per field: the type, and for the seats, the smallest and largest allowed value.",
          balanced: "The browser checks are help, not proof. Clear labels and an application check still exist behind them.",
          independent: "A number input with a range still accepts typed text in some browsers, so the value is validated again before it is used.",
        },
      },
      build: {
        lead: "Work in the HTML file. Change the email field first and run the preview on a narrow window, then change the seat field and add its range.",
        variants: {
          guided: "Set the email type, then the number type, then add min and max to the seat field.",
          balanced: "Change one attribute at a time so you can see what each one does.",
          independent: "Decide the range before you type, based on what the business would actually allow.",
        },
      },
      check: {
        lead: "Enter an address with no at sign and try to submit. The browser should object. Then type seven in the seat field and submit again; the range should stop it.",
        variants: {
          guided: "Test one wrong value in each field and watch the browser refuse it.",
          balanced: "Check the two fields separately and describe what the browser did in each case.",
          independent: "Test the boundary values themselves, one and six, as well as the values outside them.",
        },
      },
      explain: {
        lead: "Now a different page: an event booking form that asks for an email address and a number of seats. No example open. Choose the types that suit each value and bound the count.",
        variants: {
          guided: "The new form has the same two fields. Set the types and add the smallest and largest seat count.",
          balanced: "Same decision, new labels. Read what each field asks for before choosing a type.",
          independent: "Work with no example open and decide the range from the wording of the question.",
        },
      },
      transfer: {
        lead: "Every field the project adds later gets the same treatment, because the type is the cheapest check available.",
        variants: {
          independent: "A suitable type is a first line of defence, never the only one, since it can be bypassed entirely.",
          guided: "Your project's fields will each name the kind of value they expect.",
          balanced: "One attribute removes a whole class of typing mistakes.",
        },
      },
    },
    mastery: {
      freshTask: "An event booking form asks for an email address and a number of seats. Choose the input types that suit each value and limit the seats to between one and six.",
      observable: "The email field refuses a value with no at sign, and the seat field refuses a count outside one to six.",
      reflection: "In your own words, what does the input type change for the visitor using a phone?",
      starterFiles: {
        html: "<label for=\"booking-email\">Email</label>\n<input id=\"booking-email\" type=\"text\">\n<label for=\"seats\">Seats</label>\n<input id=\"seats\" type=\"text\">",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The email field uses the email type", pattern: "<input[^>]+type=[\"']email[\"']" },
        { file: "html", label: "The seat field uses the number type", pattern: "<input[^>]+type=[\"']number[\"']" },
        { file: "html", label: "The seat count has a lower bound", pattern: "<input[^>]+min=[\"']?1" },
        { file: "html", label: "The seat count has an upper bound", pattern: "<input[^>]+max=" },
      ],
      workedSolution: {
        html: "<label for=\"booking-email\">Email</label>\n<input id=\"booking-email\" type=\"email\">\n<label for=\"seats\">Seats</label>\n<input id=\"seats\" type=\"number\" min=\"1\" max=\"6\">",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "every field is a text field and the label explains the rest.",
        symptom: "The phone keyboard is the same for every field, and the browser cannot help with a wrong value.",
        hint: "The type is a promise about the value. Use email for the address and number for the seat count so the browser can offer the right keyboard and check the value.",
        file: "html",
        detect: "type=[\"']text[\"']",
        detectableExample: "<input id=\"seats\" type=\"text\">",
      },
      {
        wrong: "the limits belong on the form element rather than the field.",
        symptom: "The range never applies, because the form element does not describe one question.",
        hint: "Limits describe one question, so they sit on that input. Put min and max on the seat field itself, next to its type.",
        file: "html",
        detect: "<form[^>]*(?:min|max)=",
        detectableExample: "<form min=\"1\" max=\"6\">",
      },
    ],
  },
  {
    lessonId: "ages-13-15-forms-groups",
    courseIds: ["ages-13-15"],
    concept: "A fieldset groups controls that answer one question, its legend names the group, and radios that share a name allow one answer.",
    make: "The learner groups a t-shirt size question so only one size can be chosen.",
    difficulty: 3,
    prerequisites: ["ages-13-15-forms-types"],
    projectStep: "The project's form gains a real choice question, which the later submission code reads as a single value.",
    stages: {
      hook: {
        lead: "Three size choices sit under a paragraph. A visitor can tick all three, and a screen reader reads them as three unrelated boxes. The words are fine. What has not been said about the group?",
        variants: {
          guided: "The three choices answer one question. Today you tell the browser that, so one answer is enough.",
          balanced: "A paragraph is ordinary text. Only a fieldset and a legend describe a group of controls as one question.",
          independent: "Separate the visible question from the naming that makes the choice exclusive, and decide which one controls the other.",
        },
      },
      model: {
        lead: "<fieldset> holds the group, <legend>Preferred size</legend> names it, and each radio carries the same name=\"size\" with a different value. The shared name is what makes them one question.",
        variants: {
          guided: "Read the three parts: the box around the group, the question at the top of the box, and the shared name on every choice.",
          balanced: "The legend is announced with every control in the group, which is why it must carry the question rather than a heading.",
          independent: "Different values, one name. Values are what the code reads later, the name is what makes the choice exclusive.",
        },
      },
      build: {
        lead: "Work in the HTML file. Wrap the group in a fieldset, move the question into a legend, then give all three radios the same name. Run the preview and choose two sizes.",
        variants: {
          guided: "Add the fieldset first, then the legend, then fix the names. Choosing a second size should clear the first.",
          balanced: "Add the group first, then the shared name, because the exclusivity is what a visitor notices.",
          independent: "Decide the name and the three values before you type, since the submission code depends on them.",
        },
      },
      check: {
        lead: "Choose Small and then Large. The first choice must clear. Then read the group with a screen reader if you can: the question should be announced before each choice.",
        variants: {
          guided: "Check two things: only one choice stays ticked, and the question text sits with the group.",
          balanced: "Test the exclusivity directly, because three independently tickable boxes is the usual failure.",
          independent: "Confirm the three values are different, since identical values make the later code unable to tell them apart.",
        },
      },
      explain: {
        lead: "Now a different page: a club shop that asks for a t-shirt size. No example open. Group the three choices under one question so only one can be chosen.",
        variants: {
          guided: "The new page has the same three choices. Add the group, the question and the shared name.",
          balanced: "Same pattern, new question. Decide the name before you type it three times.",
          independent: "Work with no example open and choose values that a later script could read.",
        },
      },
      transfer: {
        lead: "The project's submission code reads the chosen value of the group, so the shared name and the distinct values have to stay stable.",
        variants: {
          independent: "Radio groups are the smallest example of a decision made by the interface rather than by the code.",
          guided: "Your project's choice questions will all be grouped this way.",
          balanced: "One name, several values: that pair is what the later JavaScript will read.",
        },
      },
    },
    mastery: {
      freshTask: "A club shop page asks for a t-shirt size and offers three choices. Group the choices under one question so only one size can be chosen.",
      observable: "The question stays with the group, and choosing a second size clears the first.",
      reflection: "In your own words, what does the shared name do that the visible question cannot?",
      starterFiles: {
        html: "<p>Preferred size</p>\n<label><input type=\"radio\"> Small</label>\n<label><input type=\"radio\"> Medium</label>\n<label><input type=\"radio\"> Large</label>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The choices are grouped with a fieldset", pattern: "<fieldset[\\s>]" },
        { file: "html", label: "The group has a visible question", pattern: "<legend[\\s>][^<]+</legend>" },
        { file: "html", label: "The choices share one radio name", pattern: "(?:type=[\"']radio[\"'][^>]+name=[\"']size[\"']|name=[\"']size[\"'][^>]+type=[\"']radio[\"'])" },
      ],
      workedSolution: {
        html: "<fieldset>\n  <legend>Preferred size</legend>\n  <label><input type=\"radio\" name=\"size\" value=\"small\"> Small</label>\n  <label><input type=\"radio\" name=\"size\" value=\"medium\"> Medium</label>\n  <label><input type=\"radio\" name=\"size\" value=\"large\"> Large</label>\n</fieldset>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "a paragraph above the choices describes the group well enough.",
        symptom: "The question is read as ordinary text and each choice is announced on its own.",
        hint: "Wrap the whole question in a fieldset and move the words into a legend, so the group is named whenever any of its controls is reached.",
        file: "html",
        detect: "^(?![\\s\\S]*<fieldset)",
        detectableExample: "<p>Preferred size</p>\n<label><input type=\"radio\"> Small</label>",
      },
      {
        wrong: "each radio needs its own name so every choice can be picked.",
        symptom: "All three choices can be ticked at once, and the page has no single answer to read.",
        hint: "Radios that share a name form one question, so only one can be chosen. Give all three the same name and a different value each.",
        file: "html",
        detect: "name=[\"']([^\"']+)[\"'][\\s\\S]*type=[\"']radio[\"'][^>]*name=[\"'](?!\\1)",
        detectableExample: "<input type=\"radio\" name=\"small\">\n<input type=\"radio\" name=\"medium\">",
      },
    ],
  },
  {
    lessonId: "ages-13-15-forms-messages",
    courseIds: ["ages-13-15"],
    concept: "Help text is connected to the field it explains, and a status region carries a changing result without moving focus.",
    make: "The learner adds connected help text and a result region to a feedback form.",
    difficulty: 3,
    prerequisites: ["ages-13-15-forms-groups"],
    projectStep: "The project's form stops relying on the visitor noticing a change, because the result is announced where focus already is.",
    stages: {
      hook: {
        lead: "A form asks for a comment with no hint about how much to write, and the result appears far below the button. A visitor who cannot see the screen never learns that anything happened. Which two additions would fix both problems?",
        variants: {
          guided: "The field needs an explanation and the page needs a place to announce a result.",
          balanced: "Visible is not the same as connected, and a result that changes needs a region that is announced.",
          independent: "Separate the description of the field from the announcement of the result, and decide what each one is attached to.",
        },
      },
      model: {
        lead: "<p id=\"comment-help\">One or two sentences is enough.</p> plus <textarea id=\"comment\" aria-describedby=\"comment-help\"></textarea> connects the help text to the field. <p id=\"comment-result\" role=\"status\"></p> is a region that announces its changes.",
        variants: {
          guided: "The field names the help paragraph by id. The result paragraph carries role status.",
          balanced: "aria-describedby holds an id, not visible text, so the paragraph needs the id first.",
          independent: "A status region is polite by default, which is what you want for a message that is not an emergency.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add the help paragraph with its id, then point the field at it, then add the result region. Run the preview between changes.",
        variants: {
          guided: "Write the help paragraph first, then the aria-describedby attribute, then the status paragraph.",
          balanced: "Add the description first because it belongs to a field that already exists, then the result region.",
          independent: "Decide the wording of the help text before you type, since it should tell the visitor what a good answer looks like.",
        },
      },
      check: {
        lead: "Focus the field. The help text should be announced as its description. Then change the result text and check the region announces it without stealing focus from where the visitor is.",
        variants: {
          guided: "Check two things: the field knows about the help text, and the result has its own region.",
          balanced: "Test the description by focusing the field, and the region by reading the page's live regions.",
          independent: "Confirm the result region is empty until there is something to say, because an empty announcement is noise.",
        },
      },
      explain: {
        lead: "Now a different page: a feedback form that asks for a comment with no help text and no result region. No example open. Add connected help text and a region for the result.",
        variants: {
          guided: "The new form has the same field. Add the help paragraph, connect it, then add the result region.",
          balanced: "Same pattern, new page. Decide the help wording from what the field asks for.",
          independent: "Work with no example open and choose ids that describe their jobs.",
        },
      },
      transfer: {
        lead: "Every field the project adds later can carry a description, and one status region serves every message the page produces.",
        variants: {
          independent: "A described field is what makes an instruction arrive at the right moment instead of all at once.",
          guided: "Your project's form will explain its fields and announce its results.",
          balanced: "Descriptions and status regions are the two additions that make a form answer back.",
        },
      },
    },
    mastery: {
      freshTask: "A feedback form asks for a comment. Add a short piece of help text, connect it to the field, and create a region for the result that is announced without moving focus.",
      observable: "Focusing the field announces the help text as its description, and changing the result text is announced on its own.",
      reflection: "In your own words, why does the help text need an id when it is already visible on the page?",
      starterFiles: {
        html: "<form>\n  <label for=\"comment\">Your comment</label>\n  <textarea id=\"comment\"></textarea>\n  <button type=\"submit\">Send</button>\n</form>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The help text has its own id", pattern: "id=[\"']comment-help[\"']" },
        { file: "html", label: "The field points at the help text", pattern: "aria-describedby=[\"']comment-help[\"']" },
        { file: "html", label: "The result is a status region", pattern: "role=[\"']status[\"']" },
      ],
      workedSolution: {
        html: "<form>\n  <label for=\"comment\">Your comment</label>\n  <textarea id=\"comment\" aria-describedby=\"comment-help\"></textarea>\n  <p id=\"comment-help\">One or two sentences is enough.</p>\n  <button type=\"submit\">Send</button>\n</form>\n<p id=\"comment-result\" role=\"status\"></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "help text only needs to be visible next to the field.",
        symptom: "A screen reader user focuses the field and hears no instruction at all.",
        hint: "Visible is not connected. Give the help paragraph an id and name it from the field with aria-describedby, so the two are linked.",
        file: "html",
        detect: "^(?=[\\s\\S]*<textarea)(?![\\s\\S]*aria-describedby)",
        detectableExample: "<textarea id=\"comment\"></textarea>",
      },
      {
        wrong: "the result message can sit in a plain div anywhere on the page.",
        symptom: "The text changes and nothing is announced, so a visitor who cannot see it waits for an answer that already arrived.",
        hint: "A changing result needs a status region. Use a paragraph with role status next to the form instead of a plain div, so the change is announced.",
        file: "html",
        detect: "<div[^>]*>\\s*(?:Error|Please|Sorry)[^<]*</div>",
        detectableExample: "<div>Please enter a comment</div>",
      },
    ],
  },
];
