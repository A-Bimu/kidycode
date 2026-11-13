import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * The guided batch of the V3 lesson journey: the remaining HTML challenge
 * lessons of the ages 10 to 12 pathway.
 *
 * A challenge lesson takes the six-moment journey with a typed-code change, so
 * it is the unit this batch converts. A quiz has no code and a project lesson
 * carries the reflection-only completion rule, so both keep their own
 * presentation and are deliberately not scripted here.
 *
 * Every script carries guided wording for a ten to twelve year old: short
 * sentences, the learner's own page as the example, one change at a time. The
 * balanced and independent wording is kept for a learner who overrides the
 * level, and the fresh task is always a different scenario from the worked
 * example, with its own starter, its own checks and its own worked solution.
 */

export const guidedHtmlScripts: LessonScript[] = [
  {
    lessonId: "html-foundations-elements",
    courseIds: ["ages-10-12"],
    concept: "An element is an opening tag, its content and a closing tag, and the tag name tells the browser what the content means.",
    make: "The learner turns a line of plain text into a real heading element.",
    difficulty: 1,
    prerequisites: [],
    projectStep: "The page title stops being plain text and becomes the first real element of the website.",
    stages: {
      hook: {
        lead: "Plain words sit on a page with nothing around them. The browser shows them but does not know they are a title. What would give the words a job?",
        variants: {
          guided: "Plain words on a page are just letters. Today you put tags around them so the browser knows they are the page title.",
          balanced: "Text without a tag carries no meaning. The element gives the words a job the browser can read.",
          independent: "Markup is meaning. The tag you choose decides whether the words are a title, a paragraph or a list item.",
        },
      },
      model: {
        lead: "<h1>My First Website</h1>. The tag opens, the words sit inside, and the closing tag carries a slash at the end.",
        variants: {
          guided: "Write <h1>. Type your words. Write </h1> to finish. The h1 name is repeated in the closing tag with a slash.",
          balanced: "Read the pair as a container: an opening tag names the content, and the matching closing tag ends it.",
          independent: "The tag name is the same at both ends; only the closing tag carries the slash and no attributes.",
        },
      },
      build: {
        lead: "Work in the HTML file. Put an opening h1 tag before the words and a closing h1 tag after them. Run the page to see the change.",
        variants: {
          guided: "Add <h1> first and run the page. Then add </h1> and run it again.",
          balanced: "Wrap the words in one pair of h1 tags, then run the page once and check the words became a title.",
          independent: "Type the whole element in one edit, then run it and confirm nothing else on the page moved.",
        },
      },
      check: {
        lead: "Run the page. The words should now show as a large title instead of ordinary text.",
        variants: {
          guided: "Look at the words. Are they big and bold like a title now?",
          balanced: "Compare the words before and after: the size and weight should change.",
          independent: "Check the element closes properly: a missing closing tag turns the rest of the page into a title.",
        },
      },
      explain: {
        lead: "Now a different page: the plain words Book Club need to become the main heading. No example open.",
        variants: {
          guided: "Same job, new words. Put an h1 around Book Club.",
          balanced: "The new page has one plain line. Decide which element turns it into a title.",
          independent: "Work with no example open and choose the tag yourself.",
        },
      },
      transfer: {
        lead: "This heading is the first element of your own website, and every later element follows the same three-part shape.",
        variants: {
          independent: "Every element you add later repeats this shape: open, content, close.",
          guided: "Your website grows one element at a time.",
          balanced: "Keep the tag names matched and the page stays predictable.",
        },
      },
    },
    mastery: {
      freshTask: "A page shows the plain words Book Club. Make them a main heading so the browser treats them as the page title.",
      observable: "The words Book Club appear as a large heading instead of ordinary text.",
      reflection: "In your own words, what are the three parts of the element you wrote?",
      starterFiles: {
        html: "<div>Book Club</div>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The heading opens the element", pattern: "<h1[^>]*>" },
        { file: "html", label: "The words sit inside the heading", pattern: "<h1[^>]*>\\s*Book Club\\s*</h1>" },
      ],
      workedSolution: {
        html: "<h1>Book Club</h1>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the words are enough and the tags are only decoration.",
        symptom: "The page still shows plain text and nothing looks like a heading.",
        hint: "An element needs its tags. Put <h1> before the words and </h1> after them so the browser knows the words are a heading.",
        file: "html",
        detect: "^(?![\\s\\S]*<h1)[\\s\\S]*\\S",
        detectableExample: "Book Club",
      },
      {
        wrong: "a closing tag is a second copy of the opening tag.",
        symptom: "The triangle brackets open twice and the heading never ends.",
        hint: "The closing tag carries a forward slash and no content: write </h1> after the words, not another <h1>.",
        file: "html",
        detect: "<h1[^>]*>[^<]*<h1",
        detectableExample: "<h1>Book Club<h1>",
      },
    ],
  },
  {
    lessonId: "html-foundations-lists",
    courseIds: ["ages-10-12"],
    concept: "A list groups related items, and every entry is its own list item inside one list element.",
    make: "The learner turns a one-item list into a real three-item list.",
    difficulty: 1,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The website list gains the three real items a visitor can read.",
    stages: {
      hook: {
        lead: "One bullet sits alone under a heading. The page promised a list, but one item is not a list yet. What is missing?",
        variants: {
          guided: "One item is lonely. Today you add two more items so the page has a real list of three.",
          balanced: "A list earns its name from its items. One entry is a start, not a list.",
          independent: "Decide what belongs in the list before typing. Each entry needs its own list item element.",
        },
      },
      model: {
        lead: "<ul> opens the list. Inside it, each entry is wrapped in <li> tags. The list closes with </ul> after the last item.",
        variants: {
          guided: "Keep the one ul already there. Add a new <li>Some words</li> line for every extra item, before </ul>.",
          balanced: "The ul is the container and each li is one row. Add rows inside the same container.",
          independent: "The list element owns the group; the item element owns one entry. Do not confuse the two.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add two more li elements inside the existing ul, then run the page and count the bullets.",
        variants: {
          guided: "Add one li and run the page. Add the second li and run it again.",
          balanced: "Add both items in one edit, then run the page and count three bullets.",
          independent: "Add the two items, then run once and check the list still has a single container.",
        },
      },
      check: {
        lead: "Run the page. Three bullets should now appear under the heading.",
        variants: {
          guided: "Count the bullets. There should be three.",
          balanced: "Check the bullets share one list rather than sitting in separate groups.",
          independent: "Confirm every entry is a real list item, not plain text on its own line.",
        },
      },
      explain: {
        lead: "Now a different page: a recipe needs a heading called Ingredients and a list of three ingredients. No example open.",
        variants: {
          guided: "Add the heading, then add three items inside one list.",
          balanced: "The new page needs a heading and a list of three entries under it.",
          independent: "Work with no example open and build the heading and list yourself.",
        },
      },
      transfer: {
        lead: "Your website's list of things will follow the same rule: one list element, one item per line.",
        variants: {
          independent: "Lists are the first data your page holds, and the same shape returns in every later module.",
          guided: "Your website will keep using lists like this.",
          balanced: "A tidy list is easier to read and easier to style later.",
        },
      },
    },
    mastery: {
      freshTask: "A recipe page needs a heading called Ingredients with a list of three ingredients underneath it.",
      observable: "The page shows the heading Ingredients and three bullets below it.",
      reflection: "In your own words, why does each entry need its own list item element?",
      starterFiles: {
        html: "<ul>\n  <li>Flour</li>\n</ul>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The list has its own heading", pattern: "<h2[^>]*>\\s*Ingredients" },
        { file: "html", label: "The list has three items", pattern: "<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li" },
      ],
      workedSolution: {
        html: "<h2>Ingredients</h2>\n<ul>\n  <li>Flour</li>\n  <li>Sugar</li>\n  <li>Butter</li>\n</ul>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "each item needs its own list element.",
        symptom: "The page shows several separate lists instead of one list with several items.",
        hint: "One ul holds every item. Keep a single pair of ul tags and put all the li elements inside that one container.",
        file: "html",
        detect: "</ul>[\\s\\S]*<ul",
        detectableExample: "<ul>\n  <li>Flour</li>\n</ul>\n<ul>\n  <li>Sugar</li>\n</ul>",
      },
      {
        wrong: "an entry can be plain words on their own line.",
        symptom: "The words sit inside the list but show no bullet.",
        hint: "Wrap each entry in its own li element. Words directly inside the ul that are not inside an li are not a list item.",
        file: "html",
        detect: "<ul[^>]*>\\s*[^<\\s]",
        detectableExample: "<ul>\n  Flour\n</ul>",
      },
    ],
  },
  {
    lessonId: "html-content-links",
    courseIds: ["ages-10-12"],
    concept: "A link is an anchor element whose href attribute holds the destination and whose text tells the visitor where it goes.",
    make: "The learner turns a line of text into a working link.",
    difficulty: 2,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The website gains its first link to another page.",
    stages: {
      hook: {
        lead: "A line of text says Read more but nothing happens when it is clicked. What turns ordinary words into a clickable link?",
        variants: {
          guided: "The words Read more do nothing. Today you wrap them in a link so they can be clicked.",
          balanced: "A link needs two things: the words the visitor reads and the address they travel to.",
          independent: "Separate the visible label from the destination. Both belong in one element with different jobs.",
        },
      },
      model: {
        lead: "<a href=\"https://example.com\">Read more</a>. The a tag makes the link, href holds the address, and the words inside are what the visitor sees.",
        variants: {
          guided: "Write <a href=\"\"> with the address inside the quotes, then the words Read more, then </a>.",
          balanced: "href is an attribute with a name, an equals sign and the address in quotes.",
          independent: "The attribute is written inside the opening tag, never between the tags.",
        },
      },
      build: {
        lead: "Work in the HTML file. Replace the plain words with an anchor that carries the address and keeps the same visible text.",
        variants: {
          guided: "Add the a tags first, then the href address inside the opening tag.",
          balanced: "Write the whole anchor in one edit, then run the page and check the words are clickable.",
          independent: "Decide the destination first, then keep the link text short and descriptive.",
        },
      },
      check: {
        lead: "Run the page, then move the pointer over the words. The pointer should change and the address should be visible somewhere.",
        variants: {
          guided: "Point at the words. If the pointer turns into a hand, the link is working.",
          balanced: "Check the address matches the one the task named.",
          independent: "Confirm the words are inside the anchor and the address is only in the attribute.",
        },
      },
      explain: {
        lead: "Now a different page: the words See the timetable must link to https://example.org/times. No example open.",
        variants: {
          guided: "Same job, new words and a new address.",
          balanced: "Write the anchor with the new address and the same visible words.",
          independent: "Work with no example open and keep the address exactly as given.",
        },
      },
      transfer: {
        lead: "Your website's navigation will be built from links like this, each pointing at a page or a section.",
        variants: {
          independent: "The anchor shape never changes: destination in the attribute, label between the tags.",
          guided: "Your website will use links just like this one.",
          balanced: "Descriptive link text also helps people who cannot see the page.",
        },
      },
    },
    mastery: {
      freshTask: "A guide page shows the words See the timetable. Make those words a link to https://example.org/times.",
      observable: "The words See the timetable are clickable and their address is https://example.org/times.",
      reflection: "In your own words, which part of the link is the address and which part is the words the visitor reads?",
      starterFiles: {
        html: "<p>See the timetable</p>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The link has a destination", pattern: "<a[^>]+href=[\"']https://example\\.org/times[\"']" },
        { file: "html", label: "The visible words are inside the link", pattern: "<a[^>]*>\\s*See the timetable\\s*</a>" },
      ],
      workedSolution: {
        html: "<p><a href=\"https://example.org/times\">See the timetable</a></p>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the address can sit as plain text after the words.",
        symptom: "The words are not clickable and the address shows on the page.",
        hint: "The address belongs in the href attribute inside the opening tag, not as visible text. Keep only the words as the link text.",
        file: "html",
        detect: ">[^<]*https?://",
        detectableExample: "<p>See the timetable at https://example.org/times</p>",
      },
      {
        wrong: "an anchor without an address is already a link.",
        symptom: "The words look like a link but nothing happens when they are clicked.",
        hint: "An anchor needs href to travel anywhere. Add href=\"\" with the full address inside the opening a tag.",
        file: "html",
        detect: "<a(?![^>]*href)[^>]*>",
        detectableExample: "<a>See the timetable</a>",
      },
    ],
  },
  {
    lessonId: "html-content-images",
    courseIds: ["ages-10-12"],
    concept: "An image element shows a picture from its src address, and its alt attribute describes the picture for anyone who cannot see it.",
    make: "The learner gives a real picture a useful written description.",
    difficulty: 2,
    prerequisites: ["html-foundations-elements"],
    projectStep: "The website gains a picture with a description that works when the image cannot load.",
    stages: {
      hook: {
        lead: "A picture appears on the page but carries no words. If the picture fails to load, the visitor sees nothing at all. What could carry its meaning?",
        variants: {
          guided: "The picture has no description. Today you write a short sentence that describes what the picture shows.",
          balanced: "An image without a description is empty for anyone who cannot see it.",
          independent: "Alternative text is content, not decoration. Write what matters, not what is obvious.",
        },
      },
      model: {
        lead: "<img src=\"mountain.jpg\" alt=\"A mountain at sunrise\">. src points at the picture and alt describes it in words.",
        variants: {
          guided: "The img tag has no closing tag. Add alt=\"\" and write your description inside the quotes.",
          balanced: "src and alt are two attributes on the same tag, separated by a space.",
          independent: "alt should describe the information the picture carries, not repeat the file name.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add an alt attribute to the image and write a short description inside it.",
        variants: {
          guided: "Type alt=\" after the src part, write your sentence, then close the quote.",
          balanced: "Add the attribute, then run the page and check the picture still shows.",
          independent: "Write the description first, then place it in alt and run the page once.",
        },
      },
      check: {
        lead: "Run the page. The picture should still show, and the description should be readable in the code.",
        variants: {
          guided: "Check the picture is still there and that your words sit inside alt.",
          balanced: "Read your description back and ask whether it explains the picture.",
          independent: "Confirm the description stands alone, without needing the picture to make sense.",
        },
      },
      explain: {
        lead: "Now a different page: a gallery shows a picture of a river and it needs a description. No example open.",
        variants: {
          guided: "The new page has one picture with no description. Add a short sentence for it.",
          balanced: "Same attribute, new picture. Write a description that fits this one.",
          independent: "Work with no example open and describe only what matters in the picture.",
        },
      },
      transfer: {
        lead: "Every picture on your website will carry a description so no visitor is left without its meaning.",
        variants: {
          independent: "A missing description is a real barrier, so treat alt as required, not optional.",
          guided: "Your website pictures will all have descriptions.",
          balanced: "Short, honest descriptions are more useful than long ones.",
        },
      },
    },
    mastery: {
      freshTask: "A gallery page shows a picture of a mountain. Give the image a useful written description so it makes sense when the picture cannot be seen.",
      observable: "The image keeps its source and now carries a short description in words.",
      reflection: "In your own words, why does an image need a description as well as a source?",
      starterFiles: {
        html: "<img src=\"mountain.jpg\">",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The image has a description", pattern: "<img[^>]+alt=" },
        { file: "html", label: "The description is written in words", pattern: "alt=[\"'][A-Za-z][^\"']{4,}" },
      ],
      workedSolution: {
        html: "<img src=\"mountain.jpg\" alt=\"A mountain at sunrise\">",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the file name is a good enough description.",
        symptom: "The description reads like a file name and tells the visitor nothing useful.",
        hint: "Describe the picture in a short sentence, not the file. Replace mountain.jpg with words such as A mountain at sunrise.",
        file: "html",
        detect: "alt=[\"'][^\"']*\\.(?:jpg|jpeg|png|gif|webp)",
        detectableExample: "<img src=\"mountain.jpg\" alt=\"mountain.jpg\">",
      },
      {
        wrong: "a description with one short word is enough.",
        symptom: "The description is so short it does not explain anything.",
        hint: "Write a few words that state what is in the picture and what matters about it, such as A mountain at sunrise.",
        file: "html",
        detect: "alt=[\"']\\s*[A-Za-z]{1,3}\\s*[\"']",
        detectableExample: "<img src=\"mountain.jpg\" alt=\"pic\">",
      },
    ],
  },
  {
    lessonId: "html-content-semantics",
    courseIds: ["ages-10-12"],
    concept: "Semantic regions name the job of each page part, so header introduces the page, main holds the central content and footer closes it.",
    make: "The learner replaces three plain containers with meaningful page regions.",
    difficulty: 2,
    prerequisites: ["html-foundations-nesting"],
    projectStep: "The website's parts get names that say what they are for.",
    stages: {
      hook: {
        lead: "Three plain boxes hold the page, but every box has the same name. A reader cannot tell which part is the top, which is the middle and which is the end. What would name them?",
        variants: {
          guided: "All three boxes look the same. Today you give each one a name that says its job.",
          balanced: "Plain containers say nothing about their role. Named regions do.",
          independent: "A region name is a promise about its content; choose it by the job, not the position.",
        },
      },
      model: {
        lead: "<header> introduces the page, <main> holds the central content and <footer> closes it. Each is a container with a clear job.",
        variants: {
          guided: "Change the first box to header, the middle to main and the last to footer.",
          balanced: "The three names replace the plain container name without changing the content inside.",
          independent: "There should be one main region per page; header and footer may repeat.",
        },
      },
      build: {
        lead: "Work in the HTML file. Change one container name at a time, keeping the content and the matching closing tags.",
        variants: {
          guided: "Change the first box and run the page. Then the second, then the third.",
          balanced: "Rename the three containers, then run the page once and check nothing moved.",
          independent: "Change the names and confirm each opening tag still has its matching closing tag.",
        },
      },
      check: {
        lead: "Run the page. The content should look the same but each part now has a name that describes it.",
        variants: {
          guided: "Check the three parts are still in order: top, middle, end.",
          balanced: "Read the region names aloud and ask whether they match their content.",
          independent: "Confirm no plain container is left where a named region belongs.",
        },
      },
      explain: {
        lead: "Now a different page: a weather page made of plain boxes needs a header, a main and a footer. No example open.",
        variants: {
          guided: "Same job, three new boxes. Give each one the right name.",
          balanced: "The new page repeats the same three roles.",
          independent: "Work with no example open and decide which content belongs in main.",
        },
      },
      transfer: {
        lead: "Your website will use these regions as its skeleton, and later lessons style each region by name.",
        variants: {
          independent: "Meaningful regions also help assistive technology move around the page.",
          guided: "Your website is built from these named parts.",
          balanced: "Named regions make the page easier for people and for search services to understand.",
        },
      },
    },
    mastery: {
      freshTask: "A weather page is built from three plain boxes. Give it a header, a main region and a footer without changing the words inside.",
      observable: "The page shows three named regions in order, with the same content as before.",
      reflection: "In your own words, what does the name main tell a reader that a plain box does not?",
      starterFiles: {
        html: "<div><h1>Weather</h1></div>\n<div><p>Today is sunny.</p></div>\n<div><p>Made for practice.</p></div>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The page opens with a header", pattern: "<header[\\s>][\\s\\S]*</header>" },
        { file: "html", label: "The main region holds the central content", pattern: "<main[\\s>][\\s\\S]*</main>" },
        { file: "html", label: "A footer closes the page", pattern: "<footer[\\s>][\\s\\S]*</footer>" },
      ],
      workedSolution: {
        html: "<header><h1>Weather</h1></header>\n<main><p>Today is sunny.</p></main>\n<footer><p>Made for practice.</p></footer>",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the plain boxes are fine because content already sits in them.",
        symptom: "Every part of the page has the same name, so no region states its job.",
        hint: "Replace the plain container name with the region that matches its content: header at the top, main in the middle, footer at the end.",
        file: "html",
        detect: "<div[\\s>]",
        detectableExample: "<div><h1>Weather</h1></div>",
      },
      {
        wrong: "the main region should wrap the whole page.",
        symptom: "Everything, including the header and footer, sits inside main.",
        hint: "main holds only the central content. Keep the header and the footer outside it so the page has clear parts.",
        file: "html",
        detect: "<main[\\s>][\\s\\S]*<header",
        detectableExample: "<main>\n  <header><h1>Weather</h1></header>\n</main>",
      },
    ],
  },
  {
    lessonId: "html-content-forms",
    courseIds: ["ages-10-12"],
    concept: "A form control needs a visible label connected to it by a matching id, and the input type tells the browser what answer to expect.",
    make: "The learner connects a label to an input and chooses the right input type.",
    difficulty: 2,
    prerequisites: ["html-content-semantics"],
    projectStep: "The website gains its first input, connected to a label so a visitor knows what to type.",
    stages: {
      hook: {
        lead: "A box asks for an answer but the words beside it are not connected to the box. A visitor cannot tell what to type, and neither can a screen reader. What joins them?",
        variants: {
          guided: "The label and the box sit apart. Today you connect them with matching names.",
          balanced: "A label that is not connected is just text; the connection is what makes it a label.",
          independent: "The connection is the shared value, writing the same word in the label and the input.",
        },
      },
      model: {
        lead: "<label for=\"email\">Email address</label> then <input id=\"email\" type=\"email\">. The for value matches the id, and the type tells the browser what to expect.",
        variants: {
          guided: "Put for=\"email\" in the label and id=\"email\" in the input. Add type=\"email\" so the browser checks the answer.",
          balanced: "Read the pair as two halves of one control joined by the shared word email.",
          independent: "The browser uses the type to validate the answer before the form is sent.",
        },
      },
      build: {
        lead: "Work in the HTML file. Add for to the label, then id and type to the input, keeping the same word in both.",
        variants: {
          guided: "Add for first, then id, then type. Run the page after each.",
          balanced: "Add all three values, then run the page and click the label to check it focuses the box.",
          independent: "Choose the type that matches the answer you expect, then run once and test the connection.",
        },
      },
      check: {
        lead: "Run the page, then click the label words. The cursor should jump into the box, which proves they are connected.",
        variants: {
          guided: "Click the words. Does the box get the cursor?",
          balanced: "Check the for value and the id value are spelled the same.",
          independent: "Type something that is not an email and confirm the browser warns you.",
        },
      },
      explain: {
        lead: "Now a different page: a club sign-up needs a label and an input joined by the word club-email. No example open.",
        variants: {
          guided: "Write the label, then the input, using the same word in both.",
          balanced: "The new page needs the same connection with the word club-email.",
          independent: "Work with no example open and choose the input type that fits an email.",
        },
      },
      transfer: {
        lead: "Every field on your website will carry a label, so a visitor always knows what to enter.",
        variants: {
          independent: "A visible label is easier to use than placeholder text, which disappears once typing starts.",
          guided: "Your website fields will all have labels.",
          balanced: "Connected labels help every visitor, including those using a keyboard.",
        },
      },
    },
    mastery: {
      freshTask: "A club sign-up page needs the word Club email written as a label connected to an input that expects an email address.",
      observable: "Clicking the label focuses the input, and the browser recognises the field as an email.",
      reflection: "In your own words, what does the matching id and for value actually do?",
      starterFiles: {
        html: "<label>Club email</label>\n<input>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The label points to the input", pattern: "<label[^>]+for=[\"']club-email[\"']" },
        { file: "html", label: "The input has a matching id", pattern: "<input[^>]+id=[\"']club-email[\"']" },
        { file: "html", label: "The input expects an email", pattern: "<input[^>]+type=[\"']email[\"']" },
      ],
      workedSolution: {
        html: "<label for=\"club-email\">Club email</label>\n<input id=\"club-email\" type=\"email\">",
        css: "",
        javascript: "",
      },
    },
    misconceptions: [
      {
        wrong: "the label only needs to sit near the input.",
        symptom: "The words are close to the box but clicking them does nothing.",
        hint: "A label is connected by values, not by position. Add for=\"club-email\" to the label and id=\"club-email\" to the input, using the same word in both.",
        file: "html",
        detect: "<label(?![^>]*for=)[^>]*>",
        detectableExample: "<label>Club email</label>",
      },
      {
        wrong: "the input type does not matter for text fields.",
        symptom: "The browser cannot check the answer because the field has no type.",
        hint: "Add type=\"email\" so the browser knows the answer should be an email address and can check it.",
        file: "html",
        detect: "<input(?![^>]*type=)[^>]*>",
        detectableExample: "<input id=\"club-email\">",
      },
    ],
  },
];
