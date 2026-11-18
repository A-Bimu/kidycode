export type ProjectId = "interest" | "club" | "magazine";
export type CourseId = "ages-10-12" | "ages-13-15" | "ages-16-18" | "adults";
export type CodeFile = "html" | "css" | "javascript";
export type ActivityType = "challenge" | "project" | "quiz";

export type PracticeQuestion = {
  prompt: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
};

export type CodeTest = {
  file: CodeFile;
  label: string;
  pattern: string;
};

export type WorkspaceFiles = { html: string; css: string; javascript: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  objective: string;
  activityType: ActivityType;
  activityNumber: number;
  language: "HTML" | "CSS" | "JavaScript" | "Web project";
  explanation: string[];
  keyTerms: string[];
  exampleTitle: string;
  exampleCode: string;
  exampleExplanation: string;
  task: string;
  starterFiles: WorkspaceFiles;
  editableFiles: CodeFile[];
  tests: CodeTest[];
  hints: [string, string, string];
  question?: PracticeQuestion;
  questions?: PracticeQuestion[];
  reflection?: string;
};

export type Stage = {
  id: string;
  number: number;
  title: string;
  description: string;
  outcome: string;
  lessons: Lesson[];
};

export type ProjectChoice = {
  id: ProjectId;
  title: string;
  pitch: string;
  siteTitle: string;
  intro: string;
  items: [string, string, string];
};

export type CourseFacts = {
  id: CourseId;
  title: string;
  ageRange: string;
  ages: number[];
  lessonCount: number;
  stageCount: number;
  estimatedHours: string;
  passMark: number;
};

export type PracticalExamDefinition = {
  title: string;
  language: string;
  brief: string;
  starterCode: string;
  requiredPatterns: string[];
};

export type CourseBundle = {
  courseFacts: CourseFacts;
  stages: Stage[];
  lessons: Lesson[];
  projectChoices: ProjectChoice[];
  finalExam: PracticeQuestion[];
  practicalExam: PracticalExamDefinition;
};

export function detailedExplanation(input: Pick<Lesson, "language" | "objective" | "task" | "explanation">): string[] {
  const notes = input.explanation.filter((paragraph) => paragraph.trim().length > 0);
  const practicalNote: Record<Lesson["language"], string> = {
    HTML: `Before typing, find the opening tag, its content and its closing tag. Work on one element at a time, run the page and check whether the browser gives the content the job described in this task: ${input.task}`,
    CSS: `Run the page before changing the stylesheet so you have a result to compare. Add one declaration at a time, check the selector carefully and confirm that the visible change solves this task: ${input.task}`,
    JavaScript: `Read the starter code from top to bottom and name what each value or element represents. Add one instruction, run it and compare the visible result with the task before adding the next instruction: ${input.task}`,
    "Web project": `Keep the parts that already work and add only the new requirement. Test the HTML structure, CSS layout and JavaScript behaviour separately so you can identify exactly which change produced the result: ${input.task}`,
  };
  if (notes.length < 2 || notes.join(" ").length < 190) notes.push(practicalNote[input.language]);
  return notes;
}

export const projectChoices: ProjectChoice[] = [
  { id: "interest", title: "Interest Guide", pitch: "Teach visitors about a topic you enjoy.", siteTitle: "The Interest Guide", intro: "A clear guide to a topic worth exploring.", items: ["What it is", "Why it matters", "Where to begin"] },
  { id: "club", title: "Club Website", pitch: "Create a home page for a fictional club or team.", siteTitle: "The Saturday Club", intro: "A place for people who enjoy learning together.", items: ["About the club", "Weekly activities", "How to take part"] },
  { id: "magazine", title: "Mini Magazine", pitch: "Publish short articles about a subject you choose.", siteTitle: "The Small Magazine", intro: "Short articles, useful ideas and thoughtful recommendations.", items: ["Latest article", "Editor picks", "Reader notes"] },
];

const files = (html: string, css = "", javascript = ""): WorkspaceFiles => ({ html, css, javascript });
const q = (prompt: string, correct: string, wrongOne: string, wrongTwo: string, explanation: string): PracticeQuestion => {
  const answer = Array.from(prompt).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  const options: [string, string, string] = answer === 0
    ? [correct, wrongOne, wrongTwo]
    : answer === 1
      ? [wrongOne, correct, wrongTwo]
      : [wrongOne, wrongTwo, correct];
  return { prompt, options, answer, explanation };
};
const t = (file: CodeFile, label: string, pattern: string): CodeTest => ({ file, label, pattern });

export const languageGuidance: Record<Lesson["language"], { purpose: string; next: string; reading: string }> = {
  HTML: {
    purpose: "HTML gives every piece of content a job. It tells the browser which text is a heading, paragraph, list, link or other page part.",
    next: "On the practice screen, you will work in the HTML file. Focus on the tags and words inside them. You do not need to change the CSS or JavaScript yet.",
    reading: "In HTML, code inside angle brackets is a tag. Text between an opening tag and a closing tag is the content. A forward slash shows where most elements end.",
  },
  CSS: {
    purpose: "CSS controls how the HTML looks and fits on a screen. It can change colour, spacing, size and layout without changing the meaning of the content.",
    next: "On the practice screen, you will work in the CSS file. The HTML is already there so you can see what each style changes.",
    reading: "A CSS rule starts with a selector. The declarations sit inside braces. Each declaration has a property, a colon, a value and usually a semicolon.",
  },
  JavaScript: {
    purpose: "JavaScript gives the webpage behaviour. It can store information, make decisions and respond when a visitor clicks or types.",
    next: "On the practice screen, you will work in the JavaScript file. The HTML gives your code something on the page to use, and the CSS keeps it readable.",
    reading: "JavaScript is read as a series of instructions. Names store values, brackets group code, and punctuation helps the browser understand where each instruction begins and ends.",
  },
  "Web project": {
    purpose: "This project step joins earlier skills in one real website. You will keep the work you already made and add the new part carefully.",
    next: "On the practice screen, open only the file named in the task first. Run the current website before changing it, then make and test one small change at a time.",
    reading: "Read the example as a plan for your own project. Your words and design can be different, but your code still needs the same clear structure and behaviour.",
  },
};

export const termDefinitions: Record<string, string> = {
  ":root": "A CSS selector that represents the whole page and is often used to store reusable custom properties.",
  CRUD: "The four common data actions: create, read, update and delete.",
  "CSS Grid": "A CSS layout system for arranging content in rows and columns.",
  DOM: "The browser's code version of the webpage that JavaScript can read and change.",
  Flexbox: "A CSS layout system for arranging items in a row or column.",
  Grid: "A layout made from rows and columns.",
  JavaScript: "The language that adds behaviour and decisions to a webpage.",
  accessibility: "Making a webpage usable by as many people as possible.",
  "accessibility audit": "A planned check for barriers that could stop someone using a webpage.",
  "accessible content": "Information that people can understand and use in different ways.",
  "actual result": "What the code really does when you run it.",
  "alternative text": "A short image description used when the image cannot be seen.",
  anchor: "The HTML element used to create a link.",
  append: "A JavaScript method that places a new element inside another element at the end.",
  "application state": "The information an application currently remembers and uses to decide what to show.",
  "aria-describedby": "An HTML attribute that connects a control to extra instructions or an error message.",
  array: "An ordered group of values stored together.",
  article: "A self-contained piece of HTML content that could make sense on its own.",
  assignment: "Putting a value into a variable.",
  attribute: "Extra information written inside an HTML opening tag.",
  background: "The colour or image behind an element's content.",
  boolean: "A value that can only be true or false.",
  border: "A visible line around an element.",
  "border radius": "The CSS property that rounds corners.",
  "box model": "The way content, padding, border and margin form an element's box.",
  breakpoint: "A screen width where a layout changes.",
  "browser validation": "Checks the browser performs on form input before allowing it to be submitted.",
  call: "Telling a function to run.",
  callback: "A function given to another piece of code so it can be run at the right time.",
  cascade: "The CSS rules that decide which style wins when several rules affect the same element.",
  catch: "The part of try and catch that handles an error if the try block fails.",
  child: "An element placed inside another element.",
  ch: "A CSS length unit based on the approximate width of one text character.",
  class: "A reusable name that connects HTML elements to CSS or JavaScript.",
  "class selector": "A CSS selector that begins with a full stop and chooses a class.",
  classList: "A JavaScript tool for adding, removing or switching an element's classes.",
  click: "An event made when a visitor selects a control.",
  "closing tag": "The tag that ends most HTML elements and includes a forward slash.",
  column: "A vertical group of items in a layout.",
  comparison: "Checking how two values relate to each other.",
  "comparison operator": "A symbol such as ===, > or >= that compares two values and produces true or false.",
  component: "A reusable part of an interface with one clear job.",
  const: "A JavaScript keyword for a variable that will not be assigned a different value later.",
  condition: "A question in code that produces true or false.",
  content: "The words, images and information inside a webpage.",
  "content model": "The HTML rules that describe which kinds of content may go inside an element.",
  contrast: "The visible difference between colours that helps text and controls stand out clearly.",
  createElement: "A JavaScript method that creates a new HTML element in memory.",
  credit: "A note that says who made or helped make something.",
  data: "Information stored or used by a program.",
  "data model": "A planned structure that gives each piece of stored information a clear name and shape.",
  "data type": "The kind of value, such as text, a number or true and false.",
  debugging: "Finding the reason code is not working and repairing it.",
  define: "Creating something in code so it can be used later.",
  delete: "Removing a stored item or record from an application.",
  element: "One complete piece of HTML, usually made from tags and content.",
  "element reference": "A JavaScript variable that points to an element in the webpage.",
  else: "The block that runs when an if condition is false.",
  error: "A problem that stops code or makes it behave differently than expected.",
  event: "Something that happens in the browser, such as a click or submission.",
  "event listener": "Code that waits for an event and then runs a function.",
  "expected result": "What you think the code should do.",
  explanation: "A clear account of what the code does and why.",
  feedback: "A visible result that tells the visitor what happened.",
  fetch: "A JavaScript function that asks another address for data.",
  fieldset: "An HTML element that groups related form controls.",
  filter: "A JavaScript array method that keeps only items which pass a condition.",
  "final build": "The tested version of a project that is ready to show.",
  "flex container": "The parent element whose children are arranged by Flexbox.",
  "focus-visible": "A CSS state used to show which control a keyboard user has selected.",
  "font size": "The CSS property that controls how large text appears.",
  footer: "The HTML region at the end of a page.",
  forEach: "A JavaScript method that runs once for every item in an array.",
  fr: "A CSS Grid unit meaning one fraction of the available space.",
  form: "A group of controls used to collect information.",
  "form control": "An input, button, select or other element a visitor can use in a form.",
  "fragment identifier": "The part of a link beginning with # that points to an element id on a page.",
  function: "A named or reusable group of instructions.",
  gap: "The CSS space between items in a layout.",
  header: "The HTML region that introduces a page or section.",
  heading: "A title that introduces a page or section.",
  "heading hierarchy": "The organised order of h1, h2 and later heading levels that shows how sections relate.",
  href: "The HTML attribute that stores a link's destination.",
  id: "A unique name for one HTML element.",
  if: "The block that runs when its condition is true.",
  image: "A picture placed on a webpage with the img element.",
  "immutable update": "Creating a changed copy of data instead of changing the original value directly.",
  index: "The numbered position of an item in an array, starting at zero.",
  input: "A form control where a visitor can enter information.",
  "input type": "The type attribute value that tells the browser what information an input should collect.",
  interaction: "An action between the visitor and the webpage.",
  "interactive state": "The way a control looks or behaves during an action such as hover, focus or press.",
  item: "One value inside a list or array.",
  iteration: "One run of a repeated loop.",
  "keyboard focus": "The control currently selected by the keyboard.",
  label: "Text that explains what a form control is for.",
  landmark: "A meaningful page region, such as header, nav, main or footer, that helps people move around a page.",
  layout: "The way content is arranged on the screen.",
  legend: "The caption that explains a group of form controls inside a fieldset.",
  length: "A property that reports how many items an array contains or how many characters a string contains.",
  let: "A JavaScript keyword for a variable whose value can change.",
  "line height": "The amount of vertical space between lines of text.",
  "list item": "One entry inside an HTML list.",
  loop: "Code that repeats instructions.",
  "loop variable": "The temporary name that represents the current item during one run of a loop.",
  main: "The HTML region that contains the page's central content.",
  margin: "Space outside an element's border.",
  "max width": "A CSS limit that stops an element becoming too wide.",
  "media query": "CSS that applies when a screen matches a condition, such as its width.",
  metadata: "Information in the head of an HTML document that describes the page to browsers and search services.",
  minmax: "A CSS Grid function that gives a track a smallest and largest allowed size.",
  "mobile first": "Designing the smallest layout first, then adding changes for wider screens.",
  mutation: "Changing an existing value or data structure directly.",
  nesting: "Placing one HTML element inside another.",
  number: "A JavaScript value used for counting or calculating.",
  object: "A JavaScript value that stores related information as named properties.",
  "object spread": "The ... syntax used inside an object to copy properties into a new object.",
  "opening tag": "The tag that begins most HTML elements.",
  "ordered list": "A numbered HTML list made with the ol element.",
  output: "The result a program shows after working with input.",
  outline: "A line drawn around a focused element without changing its size.",
  overflow: "Content that does not fit inside the available width or height.",
  padding: "Space between an element's content and border.",
  "page structure": "The organised HTML parts that give a webpage meaning.",
  paragraph: "Normal written text placed inside a p element.",
  parameter: "A named value that a function receives when it runs.",
  parent: "An element that contains another element.",
  preventDefault: "A JavaScript method that stops a browser's usual action.",
  privacy: "Keeping personal information safe and choosing what not to share.",
  "project note": "A short description of what was built and which tools were used.",
  property: "The part of a CSS declaration that names what will change.",
  Promise: "A JavaScript object that represents work which will finish successfully or fail later.",
  querySelector: "A JavaScript method that finds an HTML element with a CSS selector.",
  "race condition": "A bug where the result depends on which of two tasks finishes first.",
  "radio group": "A set of radio inputs where a visitor chooses one option.",
  record: "One complete stored item made from related fields.",
  "release note": "A short explanation of what a published version includes and what is still limited.",
  render: "To turn data into visible interface content.",
  "render function": "A function whose job is to update visible content from the current data.",
  repeat: "A CSS Grid function that writes the same track size a chosen number of times.",
  "request id": "A unique value used to recognise which network request produced a result.",
  responsive: "Able to work well at different screen sizes.",
  "responsive design": "Design that changes to suit phones, tablets and computers.",
  return: "A JavaScript keyword that sends a value back from a function and ends that function call.",
  reuse: "Using the same code for more than one item or job.",
  "runtime error": "An error that happens while a program is running.",
  sanitization: "Checking and cleaning untrusted information before it is used in a webpage.",
  "section heading": "A heading that names the content in one section of a page.",
  selector: "The part of a CSS rule that chooses which HTML to style.",
  "semantic HTML": "HTML elements whose names explain the job of their content.",
  "semantic structure": "A page organised with meaningful HTML regions.",
  src: "The HTML attribute that gives the location of an image.",
  "source of truth": "The one trusted place where an application keeps its current data.",
  specificity: "The CSS scoring system used to decide which matching selector has priority.",
  "spread syntax": "The ... syntax that copies values from an array or properties from an object.",
  "stable id": "An identifier that continues to belong to the same record even when its position changes.",
  "stale result": "An older result that arrives after a newer request and should not replace it.",
  state: "The current condition or stored value of part of a webpage.",
  statement: "One JavaScript instruction.",
  "strict equality": "The JavaScript === check that compares both value and data type.",
  string: "Text stored inside quotation marks.",
  structure: "The organised order and relationship of page parts.",
  stylesheet: "A file containing CSS rules.",
  submit: "The form event that happens when information is sent.",
  "submit event": "The browser event created when a visitor sends a form.",
  syntax: "The writing rules a coding language must follow.",
  test: "A check that compares code or behaviour with a requirement.",
  "test case": "One planned input, action and expected result used to check behaviour.",
  testing: "Running code and checking whether it behaves as expected.",
  textContent: "A JavaScript property for reading or changing an element's text.",
  title: "Metadata that gives a webpage its name in a browser tab and search results.",
  toggle: "To switch something on when it is off and off when it is on.",
  trim: "A JavaScript string method that removes extra space from the beginning and end of text.",
  try: "A JavaScript block used to run code that might fail so an error can be handled.",
  "untrusted input": "Information from a visitor or outside service that must be checked before the program uses or displays it.",
  "unordered list": "A bulleted HTML list made with the ul element.",
  value: "A piece of information stored in code or entered in a control.",
  validation: "Checking whether input or data follows the required rules.",
  var: "An older JavaScript keyword for declaring a variable. Modern beginner code usually uses const or let.",
  variable: "A named place that stores a value.",
  viewport: "The visible area of a webpage inside the browser window.",
  "visual system": "A small set of reusable design rules for a project.",
  "CSS custom property": "A reusable CSS value whose name begins with two hyphens.",
  "email input": "An input with type email that asks the browser to check for an email-shaped value.",
  "empty state": "The helpful content shown when there are no records to display yet.",
  "error message": "Clear text that explains what went wrong and how the visitor can fix it.",
  finally: "A block that runs after try and catch whether the work succeeded or failed.",
  "flex-wrap": "A CSS property that lets flex items move onto another line when space is limited.",
  "getItem": "A localStorage method that reads a saved string by its key.",
  "grid track": "One row or column in a CSS Grid layout.",
  h1: "The HTML heading used for the main title of a page.",
  JSON: "A text format for storing and sending structured data.",
  "keyboard navigation": "Moving through and using controls with a keyboard instead of a pointer.",
  "known limitation": "A behaviour the creator knows is not supported or complete yet.",
  "loading state": "The interface shown while an application is waiting for data.",
  localStorage: "Browser storage that keeps string values on the same device after the page closes.",
  map: "A JavaScript array method that creates a new array by changing every item.",
  "setItem": "A localStorage method that saves a string under a chosen key.",
  sort: "A JavaScript array method that arranges items in an order.",
  "status message": "Text that tells a visitor whether an action is waiting, successful or unsuccessful.",
};

type LessonSeed = Omit<Lesson, "id" | "activityType" | "activityNumber"> & { id: string };

function makeStage(input: {
  id: string;
  number: number;
  title: string;
  description: string;
  outcome: string;
  challenges: LessonSeed[];
  project: LessonSeed;
  projectQuestion: PracticeQuestion;
}): Stage {
  const challenges = input.challenges.map((lesson, index): Lesson => ({ ...lesson, explanation: detailedExplanation(lesson), id: `${input.id}-${lesson.id}`, activityType: "challenge", activityNumber: index + 1 }));
  const project: Lesson = { ...input.project, explanation: detailedExplanation(input.project), id: `${input.id}-project`, activityType: "project", activityNumber: 5 };
  const questions = [...challenges.map((lesson) => lesson.question!), input.projectQuestion];
  const quiz: Lesson = {
    id: `${input.id}-quiz`, title: `${input.title} check`, minutes: 8, objective: "Check the ideas you used before opening the next module.", activityType: "quiz", activityNumber: 6,
    language: challenges[0].language, explanation: ["Answer five questions. Four correct answers unlock the next module."], keyTerms: Array.from(new Set(challenges.flatMap((lesson) => lesson.keyTerms))),
    exampleTitle: "Review first", exampleCode: "Read the question, predict an answer, then choose.", exampleExplanation: "Every answer was taught and used in this module.", task: "Answer all five questions.",
    starterFiles: files(""), editableFiles: [], tests: [], hints: ["Return to the lesson that introduced the term.", "Read each code example again.", "Try a fresh attempt after reviewing."], questions,
  };
  return { id: input.id, number: input.number, title: input.title, description: input.description, outcome: input.outcome, lessons: [...challenges, project, quiz] };
}

const shared = {
  htmlProject: "<header><h1>{{TITLE}}</h1></header>\n<main>\n  <p>{{INTRO}}</p>\n  <section class=\"cards\">\n    <article class=\"card\"><h2>{{ITEM1}}</h2><p>Add useful information here.</p></article>\n    <article class=\"card\"><h2>{{ITEM2}}</h2><p>Add useful information here.</p></article>\n    <article class=\"card\"><h2>{{ITEM3}}</h2><p>Add useful information here.</p></article>\n  </section>\n</main>\n<footer><p>Built while learning web development.</p></footer>",
  cssProject: "body { margin: 0; padding: 2rem; background: #f7f3ea; color: #111936; font-family: Arial, sans-serif; }\nh1 { color: #4b1f63; }\n.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }\n.card { padding: 1rem; border: 2px solid #111936; border-radius: 12px; }\n@media (max-width: 650px) { .cards { grid-template-columns: 1fr; } }",
};

export const stages: Stage[] = [
  makeStage({
    id: "html-foundations", number: 1, title: "Write your first HTML", description: "Use tags to turn plain text into a structured webpage.", outcome: "A page with a title, introduction and organised list.",
    challenges: [
      { id: "elements", title: "Create an HTML element", minutes: 8, objective: "Write an opening tag, content and a closing tag.", language: "HTML", explanation: ["HTML gives a webpage structure. Most elements have an opening tag, content and a closing tag.", "The tag name tells the browser what the content means. h1 means the main heading."], keyTerms: ["element", "opening tag", "closing tag"], exampleTitle: "A paragraph element", exampleCode: "<p>I am learning to build websites.</p>", exampleExplanation: "The first p tag starts the paragraph and the second one closes it.", task: "Replace the plain text with an h1 element that says My First Website.", starterFiles: files("My First Website"), editableFiles: ["html"], tests: [t("html", "Your page has the required h1", "<h1[^>]*>\\s*My First Website\\s*</h1>")], hints: ["A main heading begins with <h1>.", "Put the words between the two tags.", "Use <h1>My First Website</h1>."], question: q("What marks the main heading?", "The h1 element", "The file name", "The space bar", "h1 represents the main heading." ) },
      { id: "text", title: "Add headings and paragraphs", minutes: 10, objective: "Use headings for titles and paragraphs for normal text.", language: "HTML", explanation: ["Headings organise the page. h1 names the page and h2 introduces an important section.", "Paragraphs hold normal sentences. Choosing the right element gives content meaning."], keyTerms: ["heading", "paragraph", "structure"], exampleTitle: "Two levels of content", exampleCode: "<h1>Photography</h1>\n<h2>First tip</h2>\n<p>Use light to make the subject clear.</p>", exampleExplanation: "Each element has a different job.", task: "Add an h2 saying About this page and a paragraph below it.", starterFiles: files("<h1>My First Website</h1>\n\n<!-- Add your section -->"), editableFiles: ["html"], tests: [t("html", "The page has an About this page heading", "<h2[^>]*>\\s*About this page\\s*</h2>"), t("html", "The section has a paragraph", "<p[^>]*>[^<]+</p>")], hints: ["Add the h2 before the paragraph.", "A paragraph uses p tags.", "Write <h2>About this page</h2>, then add your paragraph."], question: q("Which element is best for a normal sentence?", "p", "h1", "img", "The p element represents a paragraph.") },
      { id: "nesting", title: "Nest related elements", minutes: 10, objective: "Put related elements inside a section correctly.", language: "HTML", explanation: ["Nesting means placing an element inside another. It groups content that belongs together.", "Close the inner element before the outer element. Indentation makes the relationship easier to see."], keyTerms: ["nesting", "parent", "child"], exampleTitle: "A section containing text", exampleCode: "<section>\n  <h2>About</h2>\n  <p>This content belongs together.</p>\n</section>", exampleExplanation: "The heading and paragraph are children of the section.", task: "Place the h2 and paragraph inside a section element.", starterFiles: files("<h2>About this page</h2>\n<p>This page shares useful ideas.</p>"), editableFiles: ["html"], tests: [t("html", "A section contains the heading and paragraph", "<section[^>]*>[\\s\\S]*<h2[^>]*>[\\s\\S]*</h2>[\\s\\S]*<p[^>]*>[\\s\\S]*</p>[\\s\\S]*</section>")], hints: ["Add <section> before the h2.", "Close the section after the paragraph.", "Indent the h2 and p inside the section."], question: q("What does nesting show?", "Which elements belong inside another", "How fast a page loads", "The browser colour", "Nesting shows parent and child relationships.") },
      { id: "lists", title: "Build a useful list", minutes: 10, objective: "Create an unordered list with three list items.", language: "HTML", explanation: ["A list groups related items. Use ul when the order does not matter and ol when it does.", "Every item belongs inside an li element."], keyTerms: ["unordered list", "ordered list", "list item"], exampleTitle: "Three materials", exampleCode: "<ul>\n  <li>Notebook</li>\n  <li>Pencil</li>\n  <li>Ruler</li>\n</ul>", exampleExplanation: "The ul groups three li elements.", task: "Complete the list by adding two more li elements.", starterFiles: files("<h2>What you will find</h2>\n<ul>\n  <li>Clear explanations</li>\n</ul>"), editableFiles: ["html"], tests: [t("html", "The list contains at least three items", "<ul[^>]*>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*</ul>")], hints: ["Add new li elements before </ul>.", "Every item needs opening and closing li tags.", "Follow the example using your own words."], question: q("Where do li elements belong?", "Inside a ul or ol", "Inside an img", "Outside the page", "List items belong inside a list.") },
    ],
    project: { id: "project", title: "Build the page introduction", minutes: 18, objective: "Create the first working version of your website.", language: "Web project", explanation: ["This is your project file. Later modules will improve the same website."], keyTerms: ["page structure", "content"], exampleTitle: "Required structure", exampleCode: "<main>\n  <h1>Page title</h1>\n  <p>Introduction</p>\n  <h2>Inside this site</h2>\n  <ul>...</ul>\n</main>", exampleExplanation: "The main element contains the important page content.", task: "Create a title, introduction and three-item list for your chosen website.", starterFiles: files("<main>\n  <h1>{{TITLE}}</h1>\n  <p>{{INTRO}}</p>\n  <!-- Add an h2 and a three-item list -->\n</main>"), editableFiles: ["html"], tests: [t("html", "The project has one main heading", "<h1[^>]*>[^<]+</h1>"), t("html", "The project has an introduction", "<p[^>]*>[^<]+</p>"), t("html", "The project has a section heading", "<h2[^>]*>[^<]+</h2>"), t("html", "The project has a three-item list", "<ul[^>]*>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*<li[^>]*>[\\s\\S]*</li>[\\s\\S]*</ul>")], hints: ["Build one requirement at a time.", "Keep visible text inside HTML elements.", "Compare the structure with the example."], question: q("What does this first version prove?", "The learner can structure real content", "The page has animation", "The page uses a database", "The checkpoint proves basic HTML structure."), reflection: "Which element organised your page most clearly?" },
    projectQuestion: q("Which element should contain the main page content?", "main", "title", "script", "main holds the primary content."),
  }),
  makeStage({
    id: "html-content", number: 2, title: "Connect and describe content", description: "Add links, images and meaningful page regions.", outcome: "A complete HTML page that works before styling.",
    challenges: [
      { id: "links", title: "Create a working link", minutes: 9, objective: "Use an anchor and href attribute.", language: "HTML", explanation: ["The a element creates a link. Its href attribute stores the destination.", "Good link text explains where the link goes."], keyTerms: ["anchor", "attribute", "href"], exampleTitle: "A descriptive link", exampleCode: "<a href=\"https://example.com\">Read the guide</a>", exampleExplanation: "href contains the address and the visible words describe it.", task: "Turn Read more into a link to https://example.com.", starterFiles: files("<p>Find another useful explanation.</p>\n<p>Read more</p>"), editableFiles: ["html"], tests: [t("html", "Read more links to the correct address", "<a[^>]+href=[\"']https://example\\.com/?[\"'][^>]*>\\s*Read more\\s*</a>")], hints: ["Replace the second p with an a element.", "Add href inside the opening tag.", "Use <a href=\"https://example.com\">Read more</a>."], question: q("Which attribute holds a link destination?", "href", "alt", "class", "href tells the link where to go.") },
      { id: "images", title: "Describe an image", minutes: 10, objective: "Use src and alt attributes correctly.", language: "HTML", explanation: ["img displays an image from its src address.", "Alternative text communicates the image's meaning when it cannot be seen or loaded."], keyTerms: ["image", "src", "alternative text"], exampleTitle: "Useful alternative text", exampleCode: "<img src=\"camera.jpg\" alt=\"A camera beside a notebook\">", exampleExplanation: "The description communicates the important information.", task: "Add a useful alt description to the image.", starterFiles: files("<img src=\"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800\">"), editableFiles: ["html"], tests: [t("html", "The image has a useful alt description", "<img[^>]+alt=[\"'][^\"']{5,}[\"'][^>]*>")], hints: ["Add alt inside the img element.", "Describe what matters in the picture.", "For example: alt=\"A laptop open on a desk\"."], question: q("Why does an image need alt text?", "To communicate its meaning when it cannot be seen", "To download it twice", "To make it a heading", "Alternative text makes image information available.") },
      { id: "semantics", title: "Use meaningful page regions", minutes: 11, objective: "Structure a page with header, main and footer.", language: "HTML", explanation: ["Semantic elements name the job of each page region.", "A header introduces the page, main contains central content and footer ends the page."], keyTerms: ["semantic HTML", "header", "main", "footer"], exampleTitle: "A meaningful outline", exampleCode: "<header><h1>Guide</h1></header>\n<main><p>Main information.</p></main>\n<footer><p>Practice project.</p></footer>", exampleExplanation: "The tag names explain the purpose of each region.", task: "Replace the three div elements with header, main and footer.", starterFiles: files("<div><h1>My Guide</h1></div>\n<div><p>The main information.</p></div>\n<div><p>Made for practice.</p></div>"), editableFiles: ["html"], tests: [t("html", "The page has a header", "<header[\\s>]"), t("html", "The page has a main region", "<main[\\s>]"), t("html", "The page has a footer", "<footer[\\s>]")], hints: ["Change only the tag names first.", "Match every opening and closing tag.", "Use header, then main, then footer."], question: q("Which element contains the central information?", "main", "footer", "style", "main contains the primary content.") },
      { id: "forms", title: "Label an input", minutes: 12, objective: "Connect a label and input, then choose the correct input type.", language: "HTML", explanation: ["A form collects information through controls such as inputs and buttons. Every input needs a visible label so the visitor knows what to enter.", "The label's for value must be exactly the same as the input's id. The type attribute tells the browser what kind of answer to expect. For example, type=\"email\" lets the browser check whether the answer looks like an email address."], keyTerms: ["form", "label", "input", "id", "input type", "email input"], exampleTitle: "A connected email input", exampleCode: "<label for=\"email\">Email address</label>\n<input id=\"email\" type=\"email\">", exampleExplanation: "The shared word email connects the two elements. The input type explains what the visitor should enter.", task: "Add for=\"email\" to the label. Give the input id=\"email\" and type=\"email\".", starterFiles: files("<label>Email address</label>\n<input>"), editableFiles: ["html"], tests: [t("html", "The label points to email", "<label[^>]+for=[\"']email[\"'][^>]*>"), t("html", "The input has matching id and email type", "<input[^>]+(?:id=[\"']email[\"'][^>]+type=[\"']email[\"']|type=[\"']email[\"'][^>]+id=[\"']email[\"'])[^>]*>")], hints: ["Add for=\"email\" inside the label opening tag.", "Add id=\"email\" inside the input tag so the two values match.", "Add type=\"email\" to tell the browser what answer to expect."], question: q("What does an input's type attribute explain?", "The kind of information the input collects", "The colour of the whole page", "The link destination", "The type attribute tells the browser what kind of value the control should accept.") },
    ],
    project: { id: "project", title: "Complete the HTML structure", minutes: 20, objective: "Turn the first project into a complete semantic page.", language: "Web project", explanation: ["Keep the title, introduction and list you built in Module 1. Move them into meaningful header, main and footer regions instead of starting a different website.", "Inside main, add one link, one image with useful alternative text and one email input. Use for=\"email\", id=\"email\" and type=\"email\" so the label and input stay connected in later modules."], keyTerms: ["semantic structure", "accessible content", "input type"], exampleTitle: "A complete outline", exampleCode: "<header><h1>Page title</h1></header>\n<main>\n  <img src=\"photo.jpg\" alt=\"A clear description\">\n  <a href=\"https://example.com\">Learn more</a>\n  <label for=\"email\">Email</label>\n  <input id=\"email\" type=\"email\">\n</main>\n<footer><p>Practice project</p></footer>", exampleExplanation: "The page keeps its original content and adds meaningful regions and accessible controls.", task: "Keep your existing content. Add header, main and footer, then add one link, one described image and a labelled email input with id=\"email\" and type=\"email\".", starterFiles: files(shared.htmlProject), editableFiles: ["html"], tests: [t("html", "The project uses header, main and footer", "<header[\\s>][\\s\\S]*<main[\\s>][\\s\\S]*<footer[\\s>]"), t("html", "The project has a working link", "<a[^>]+href=[\"'][^\"']+[\"'][^>]*>"), t("html", "The image has alternative text", "<img[^>]+alt=[\"'][^\"']{5,}[\"'][^>]*>"), t("html", "The email label and input stay connected", "<label[^>]+for=[\"']email[\"'][^>]*>[\\s\\S]*<input[^>]+(?:id=[\"']email[\"'][^>]+type=[\"']email[\"']|type=[\"']email[\"'][^>]+id=[\"']email[\"'])[^>]*>")], hints: ["Wrap the page title in header, the useful content in main and the final note in footer.", "Add the link and image inside main, then run the page before adding the form control.", "Use the exact word email for the label's for value and the input's id. Add type=\"email\" too."], question: q("Why finish HTML before design?", "Clear structure gives CSS meaningful content to style", "CSS deletes HTML", "Design works without text", "Strong HTML supports styling and accessibility."), reflection: "Which change made the page easier to understand?" },
    projectQuestion: q("Which feature explains an unseen image?", "Alternative text", "A larger margin", "A loop", "Alternative text communicates the image's meaning."),
  }),
  makeStage({
    id: "css-foundations", number: 3, title: "Style with CSS", description: "Use selectors and declarations to control presentation.", outcome: "A consistent colour, type and component style.",
    challenges: [
      { id: "rules", title: "Write a CSS rule", minutes: 9, objective: "Use a selector, property and value.", language: "CSS", explanation: ["A CSS rule begins with a selector that chooses HTML.", "Declarations sit inside braces and contain a property and value."], keyTerms: ["selector", "property", "value"], exampleTitle: "Style every paragraph", exampleCode: "p {\n  color: #2d1948;\n}", exampleExplanation: "p selects paragraphs and color changes their text.", task: "Change every h1 to #4b1f63.", starterFiles: files("<h1>Style this heading</h1>", "/* Write CSS here */"), editableFiles: ["css"], tests: [t("css", "The h1 colour is #4b1f63", "h1\\s*\\{[\\s\\S]*color\\s*:\\s*#4b1f63")], hints: ["Start with h1.", "Put the declaration inside braces.", "Use color: #4b1f63;."], question: q("What chooses the HTML element in CSS?", "The selector", "The value", "The semicolon", "The selector chooses the elements to style.") },
      { id: "classes", title: "Reuse a class", minutes: 10, objective: "Style selected elements with a class.", language: "CSS", explanation: ["A class lets several elements share one style.", "HTML uses class and CSS selects it with a full stop."], keyTerms: ["class", "class selector", "reuse"], exampleTitle: "A highlighted note", exampleCode: "<p class=\"note\">Remember this.</p>\n\n.note { font-weight: bold; }", exampleExplanation: "The class name connects the HTML and CSS.", task: "Create a .featured class for the second article.", starterFiles: files("<article>First</article>\n<article class=\"featured\">Second</article>", "/* Style only .featured */"), editableFiles: ["css", "html"], tests: [t("html", "An element uses the featured class", "class=[\"'][^\"']*featured"), t("css", "CSS selects the featured class", "\\.featured\\s*\\{")], hints: ["The HTML already has the class.", "Select it with .featured.", "Add a declaration inside the rule."], question: q("How does CSS select class card?", ".card", "#card", "<card>", "A full stop begins a class selector.") },
      { id: "type", title: "Make text readable", minutes: 11, objective: "Set font size, line height and a comfortable text width.", language: "CSS", explanation: ["Readable text needs letters that are large enough and enough vertical space between each line. font-size controls the letter size and line-height controls the line spacing.", "Very long lines are hard to follow. max-width can limit a paragraph. The ch unit is close to the width of one text character, so 60ch creates a comfortable line of about 60 characters."], keyTerms: ["font size", "line height", "max width", "ch"], exampleTitle: "Readable paragraph settings", exampleCode: "p { font-size: 1rem; line-height: 1.6; max-width: 65ch; }", exampleExplanation: "The paragraph has readable type and cannot stretch across the whole screen.", task: "Set paragraphs to 1rem, line-height 1.6 and max-width 60ch.", starterFiles: files("<p>Good typography makes content easier to understand.</p>", "p {\n  /* Add three declarations */\n}"), editableFiles: ["css"], tests: [t("css", "Font size is 1rem", "font-size\\s*:\\s*1rem"), t("css", "Line height is 1.6", "line-height\\s*:\\s*1\\.6"), t("css", "Maximum width is 60ch", "max-width\\s*:\\s*60ch")], hints: ["Add font-size: 1rem; first.", "Add line-height: 1.6; on the next line.", "Add max-width: 60ch; so the line length stays comfortable."], question: q("What does the ch unit help measure?", "A width based on text characters", "The number of images", "The link destination", "The ch unit is based on the approximate width of a text character.") },
      { id: "cards", title: "Style a content card", minutes: 12, objective: "Combine background, border and corners.", language: "CSS", explanation: ["A card groups related information without changing its meaning.", "Background, border and border-radius define that group."], keyTerms: ["background", "border", "border radius"], exampleTitle: "A simple card", exampleCode: ".card { background: #fffdf8; border: 2px solid #18213f; border-radius: 12px; }", exampleExplanation: "Three properties create a clear card surface.", task: "Give .card the three styles shown in the example.", starterFiles: files("<article class=\"card\">Useful information</article>", ".card {\n  /* Add the styles */\n}"), editableFiles: ["css"], tests: [t("css", "The card has an off-white background", "background(?:-color)?\\s*:\\s*#fffdf8"), t("css", "The card has a 2px solid border", "border\\s*:\\s*2px\\s+solid\\s+#18213f"), t("css", "Corners use a 12px radius", "border-radius\\s*:\\s*12px")], hints: ["Put all declarations inside .card.", "Copy the values exactly.", "Check every colon and semicolon."], question: q("What rounds an element's corners?", "border-radius", "font-size", "href", "border-radius controls corner shape.") },
    ],
    project: { id: "project", title: "Create the visual system", minutes: 22, objective: "Apply a consistent design to the same project.", language: "Web project", explanation: ["Keep all the HTML from Modules 1 and 2. Add class=\"card\" to at least one useful content item so you have a real component to style.", "In CSS, create reusable rules for the body, h1, links and .card. Run the website after each rule and check that the intended part changes without removing any content."], keyTerms: ["stylesheet", "visual system", "class"], exampleTitle: "A small design system", exampleCode: "body { background: #f7f3ea; color: #111936; }\nh1 { color: #4b1f63; }\n.card { padding: 1rem; border: 2px solid #111936; }\na { color: #4b1f63; }", exampleExplanation: "A few deliberate rules style the page while the reusable card class can be used on several content items.", task: "Keep your existing page. Add class=\"card\" to at least one content item, then style the body, h1, links and .card in CSS.", starterFiles: files(shared.htmlProject, "/* Build your visual system */"), editableFiles: ["html", "css"], tests: [t("html", "A real content item uses the card class", "class=[\"'][^\"']*card[^\"']*[\"']"), t("css", "The page has a background", "body\\s*\\{[\\s\\S]*background"), t("css", "The main heading has its own rule", "h1\\s*\\{"), t("css", "Links have their own rule", "a(?:[\\s:{.#]|$)[\\s\\S]*\\{"), t("css", "A card class is styled", "\\.card\\s*\\{")], hints: ["Add class=\"card\" to one useful HTML item before styling it.", "Begin the stylesheet with body and h1 rules, then run the page.", "Add separate a and .card rules and check the change after each one."], question: q("Why use a class for repeated cards?", "One rule styles several elements", "It changes HTML into JavaScript", "It removes the text", "Classes make styles reusable."), reflection: "Which CSS choice improved readability most?" },
    projectQuestion: q("What connects class=card to CSS?", "The .card selector", "The href attribute", "A loop", ".card matches the HTML class."),
  }),
  makeStage({
    id: "css-layout", number: 4, title: "Build flexible layouts", description: "Control spacing and arrange content for different screens.", outcome: "A responsive page for phones and larger screens.",
    challenges: [
      { id: "box", title: "Use the box model", minutes: 11, objective: "Use padding and margin for different space.", language: "CSS", explanation: ["Content sits inside a box. Padding adds inner space and margin adds outer space.", "Choose the property based on where the space belongs."], keyTerms: ["box model", "padding", "margin"], exampleTitle: "Inner and outer space", exampleCode: ".card { padding: 1rem; margin-bottom: 1.5rem; }", exampleExplanation: "Padding opens the inside and margin separates the next card.", task: "Add 1rem padding and 2rem bottom margin.", starterFiles: files("<article class=\"card\">A card needs space.</article>", ".card { border: 2px solid #18213f; }"), editableFiles: ["css"], tests: [t("css", "The card has 1rem inner space", "padding\\s*:\\s*1rem"), t("css", "The card has 2rem space below", "margin-bottom\\s*:\\s*2rem")], hints: ["Both declarations go inside .card.", "Padding is inner space.", "margin-bottom is outside and below."], question: q("What adds space inside a border?", "padding", "margin", "display", "Padding creates inner space.") },
      { id: "flex", title: "Arrange a row with Flexbox", minutes: 12, objective: "Place navigation links in a row.", language: "CSS", explanation: ["Flexbox arranges items along one main direction.", "Set display: flex on the parent and gap for consistent spacing."], keyTerms: ["Flexbox", "flex container", "gap"], exampleTitle: "A navigation row", exampleCode: "nav { display: flex; gap: 1rem; }", exampleExplanation: "The nav becomes the flex container.", task: "Make nav a flex container with a 1rem gap.", starterFiles: files("<nav><a href=\"#one\">One</a><a href=\"#two\">Two</a></nav>", "nav {\n  /* Add two declarations */\n}"), editableFiles: ["css"], tests: [t("css", "Navigation uses Flexbox", "nav\\s*\\{[\\s\\S]*display\\s*:\\s*flex"), t("css", "Navigation has a 1rem gap", "nav\\s*\\{[\\s\\S]*gap\\s*:\\s*1rem")], hints: ["The parent is nav.", "Use display: flex first.", "Add gap in the same rule."], question: q("Where does display:flex belong?", "On the parent of the items", "Inside href", "In the address bar", "The parent becomes the flex container.") },
      { id: "grid", title: "Create a card grid", minutes: 13, objective: "Use CSS Grid for equal columns.", language: "CSS", explanation: ["CSS Grid arranges content in rows and columns. After display: grid turns the parent into a grid, grid-template-columns describes the columns.", "The repeat function avoids writing the same size more than once. repeat(2, 1fr) means two columns, and each 1fr column receives one equal fraction of the available width."], keyTerms: ["CSS Grid", "column", "repeat", "fr"], exampleTitle: "Three equal columns", exampleCode: ".grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }", exampleExplanation: "The parent has three equal columns with clear space between them.", task: "Make .grid two equal columns with a 1rem gap.", starterFiles: files("<section class=\"grid\"><article>A</article><article>B</article></section>", ".grid {\n  /* Build the grid */\n}"), editableFiles: ["css"], tests: [t("css", "The section uses Grid", "\\.grid\\s*\\{[\\s\\S]*display\\s*:\\s*grid"), t("css", "The grid has two equal columns", "grid-template-columns\\s*:\\s*repeat\\(2\\s*,\\s*1fr\\)"), t("css", "The grid has a 1rem gap", "gap\\s*:\\s*1rem")], hints: ["Start with display: grid; on the parent.", "Add grid-template-columns: repeat(2, 1fr); for two equal columns.", "Add gap: 1rem; to keep the cards apart."], question: q("What does 1fr mean?", "One equal fraction of available space", "One pixel", "One form", "fr shares available grid space.") },
      { id: "responsive", title: "Adapt to small screens", minutes: 14, objective: "Use a media query for a narrow screen.", language: "CSS", explanation: ["Responsive design lets one page work on different screens.", "A media query applies rules when its condition is true."], keyTerms: ["responsive design", "media query", "breakpoint"], exampleTitle: "One narrow column", exampleCode: "@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }", exampleExplanation: "The grid becomes one column at 600px or below.", task: "At 650px or below, change .grid to one column.", starterFiles: files("<section class=\"grid\"><article>One</article><article>Two</article></section>", ".grid { display: grid; grid-template-columns: repeat(2, 1fr); }\n\n/* Add the media query */"), editableFiles: ["css"], tests: [t("css", "A 650px media query creates one column", "@media\\s*\\(max-width\\s*:\\s*650px\\)[\\s\\S]*\\.grid\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr")], hints: ["Begin with @media (max-width: 650px).", "Add a .grid rule inside it.", "Set grid-template-columns: 1fr."], question: q("What does a media query do?", "Applies styles when a screen condition is true", "Stores a password", "Creates a heading", "Media queries adapt the layout to conditions.") },
    ],
    project: { id: "project", title: "Make the project responsive", minutes: 26, objective: "Use spacing, Flexbox, Grid and a media query on the same project.", language: "Web project", explanation: ["Keep the content and visual system already built. In the header, add a nav containing at least two links. Put the repeated card items inside one parent with class=\"cards\".", "Use Flexbox for nav and Grid for .cards. Give both layouts a gap, then add a media query that changes .cards to one column at 650px or below."], keyTerms: ["layout", "Flexbox", "Grid", "responsive design"], exampleTitle: "A layout plan", exampleCode: "nav { display: flex; gap: 1rem; }\n.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }\n@media (max-width: 650px) { .cards { grid-template-columns: 1fr; } }", exampleExplanation: "Flexbox arranges the link row, Grid arranges the cards and the media query protects the small-screen layout.", task: "Keep your page. Add a nav with two links and a parent with class=\"cards\" around the card items. Style nav with Flexbox, .cards with Grid and gap, then change .cards to one column inside a 650px media query.", starterFiles: files("<header><h1>{{TITLE}}</h1><nav><a href=\"#learn\">Learn</a><a href=\"#about\">About</a></nav></header>\n<main><p>{{INTRO}}</p><section class=\"cards\"><article class=\"card\">{{ITEM1}}</article><article class=\"card\">{{ITEM2}}</article><article class=\"card\">{{ITEM3}}</article></section></main>", "body { padding: 2rem; background: #f7f3ea; color: #111936; font-family: Arial, sans-serif; } .card { padding: 1rem; border: 2px solid #111936; }\n/* Add layout rules */"), editableFiles: ["html", "css"], tests: [t("html", "The project has navigation links", "<nav[\\s>][\\s\\S]*<a[\\s>][\\s\\S]*<a[\\s>]"), t("html", "The card items have a cards parent", "class=[\"'][^\"']*cards[^\"']*[\"']"), t("css", "Navigation uses Flexbox", "nav\\s*\\{[\\s\\S]*display\\s*:\\s*flex"), t("css", "Cards use Grid", "\\.cards\\s*\\{[\\s\\S]*display\\s*:\\s*grid"), t("css", "The layout uses gap", "gap\\s*:"), t("css", "A media query creates one column", "@media[\\s\\S]*\\.cards\\s*\\{[\\s\\S]*grid-template-columns\\s*:\\s*1fr")], hints: ["Add nav inside header and place two existing or new links inside it.", "Wrap the repeated card items in an element with class=\"cards\" before writing layout CSS.", "Use separate nav and .cards rules, then put the one-column .cards rule inside @media (max-width: 650px)."], question: q("What should happen on a narrow screen?", "The layout should adapt and stay readable", "The page should force sideways scrolling", "The content should disappear", "Responsive layouts protect usability."), reflection: "What changed when you made the preview narrow?" },
    projectQuestion: q("What is best for a row of navigation links?", "Flexbox", "Alternative text", "A JavaScript number", "Flexbox suits a one-dimensional row."),
  }),
  makeStage({
    id: "javascript-foundations", number: 5, title: "Start programming with JavaScript", description: "Store information, calculate values and organise instructions.", outcome: "JavaScript that updates useful page information.",
    challenges: [
      { id: "output", title: "Connect JavaScript to HTML", minutes: 11, objective: "Use the DOM, querySelector and textContent to change visible text.", language: "JavaScript", explanation: ["When the browser reads HTML, it creates the DOM. The DOM is a code version of the page that JavaScript can read and change.", "document.querySelector finds the first element that matches a CSS selector. After the element is found, its textContent property can replace the words shown on the page. The hash in #status means an id selector."], keyTerms: ["JavaScript", "DOM", "querySelector", "textContent", "statement"], exampleTitle: "Find an element and change its words", exampleCode: "document.querySelector(\"#message\").textContent = \"JavaScript is running\";", exampleExplanation: "querySelector finds the element with id message. textContent changes only the words inside it.", task: "Use querySelector to find #status, then set its textContent to JavaScript is running.", starterFiles: files("<p id=\"status\">Waiting for code...</p>", "", "// Find #status and change its text"), editableFiles: ["javascript"], tests: [t("javascript", "JavaScript changes the status", "document\\.querySelector\\([\"']#status[\"']\\)\\.textContent\\s*=\\s*[\"']JavaScript is running[\"']")], hints: ["Begin with document.querySelector(\"#status\").", "Add textContent after the full stop.", "Assign the exact text with = \"JavaScript is running\";."], question: q("What does querySelector do?", "Finds an HTML element using a CSS selector", "Changes the browser address", "Creates a new CSS file", "querySelector lets JavaScript find an element in the DOM.") },
      { id: "variables", title: "Store values with const and let", minutes: 12, objective: "Choose const for a fixed value and let for a value that changes.", language: "JavaScript", explanation: ["A variable gives a value a useful name. Use const when the name will keep the same value. Use let when the value needs to change later.", "The equals sign assigns the value on the right to the name on the left. A const variable cannot be assigned a different value later, but a let variable can."], keyTerms: ["variable", "const", "let", "assignment"], exampleTitle: "A fixed name and a changing count", exampleCode: "const topicName = \"Space\";\nlet articleCount = 2;\narticleCount = articleCount + 1;", exampleExplanation: "topicName stays the same. articleCount starts at 2 and then changes to 3.", task: "Create const topicName with text of your choice. Create let topicCount as 3, then increase topicCount by 1.", starterFiles: files("<p>Open JavaScript and store two values.</p>", "", "// Create topicName\n// Create and update topicCount"), editableFiles: ["javascript"], tests: [t("javascript", "topicName is stored with const", "const\\s+topicName\\s*=\\s*[\"'][^\"']+[\"']"), t("javascript", "topicCount begins at 3", "let\\s+topicCount\\s*=\\s*3"), t("javascript", "topicCount increases by 1", "topicCount\\s*=\\s*topicCount\\s*\\+\\s*1")], hints: ["Use const topicName = and put the text inside quotes.", "Use let topicCount = 3; because this number will change.", "On the next line, assign topicCount + 1 back to topicCount."], question: q("When should you use const?", "When the variable will keep the same value", "When an input needs a label", "When a border needs space", "const declares a variable that cannot be assigned a different value later.") },
      { id: "types", title: "Use strings and numbers", minutes: 11, objective: "Distinguish text values from numbers.", language: "JavaScript", explanation: ["A string stores text inside quotation marks. A number is written without quotation marks so JavaScript can count or calculate with it.", "The kind of value is called its data type. The text \"12\" is a string, but 12 is a number. Choosing the correct type helps the program behave as expected."], keyTerms: ["string", "number", "data type", "const"], exampleTitle: "Two value types", exampleCode: "const topic = \"Robotics\";\nconst minutes = 15;", exampleExplanation: "topic is a string because it uses quotes. minutes is a number because it does not.", task: "Create const sectionName containing a string and const itemCount containing a number.", starterFiles: files("<p id=\"result\"></p>", "", "// Create the two values with const"), editableFiles: ["javascript"], tests: [t("javascript", "sectionName stores text", "const\\s+sectionName\\s*=\\s*[\"'][^\"']+[\"']"), t("javascript", "itemCount stores a number", "const\\s+itemCount\\s*=\\s*\\d+")], hints: ["Begin with const sectionName = and put the text in quotes.", "Begin the next line with const itemCount =.", "Write the itemCount number without quotation marks."], question: q("Which is a number?", "12", "\"12\"", "\"twelve\"", "Numbers do not use quotation marks.") },
      { id: "functions", title: "Organise code with a function", minutes: 13, objective: "Define and call a function.", language: "JavaScript", explanation: ["A function groups instructions that perform one job.", "Defining prepares it. Calling the function runs it."], keyTerms: ["function", "define", "call"], exampleTitle: "Show a welcome message", exampleCode: "function showWelcome() {\n  document.querySelector(\"#message\").textContent = \"Welcome\";\n}\nshowWelcome();", exampleExplanation: "The final line calls the function.", task: "Complete showTopic, then call it.", starterFiles: files("<p id=\"topic\">No topic selected</p>", "", "function showTopic() {\n  // Change #topic text\n}\n\n// Call the function"), editableFiles: ["javascript"], tests: [t("javascript", "showTopic is defined", "function\\s+showTopic\\s*\\("), t("javascript", "The function changes #topic", "querySelector\\([\"']#topic[\"']\\)[\\s\\S]*textContent\\s*="), t("javascript", "showTopic is called", "showTopic\\s*\\(\\s*\\)\\s*;?\\s*$")], hints: ["Write textContent inside the braces.", "Close the function before calling it.", "Add showTopic(); on the final line."], question: q("What runs a defined function?", "Calling it", "Naming the HTML file", "Adding a CSS class", "A function runs when it is called.") },
    ],
    project: { id: "project", title: "Add useful page information", minutes: 24, objective: "Use the DOM, variables and a function in the same website.", language: "Web project", explanation: ["Keep the HTML and CSS from the earlier checkpoints. In the HTML, add a paragraph with id=\"summary\" where the visitor can see a short summary.", "In JavaScript, select #summary and store that element in a variable. Create a fixed pageTitle and itemCount with const. Then write and call showSummary so it places useful text in the summary paragraph."], keyTerms: ["DOM", "variable", "const", "function", "output"], exampleTitle: "A complete project function", exampleCode: "const summary = document.querySelector(\"#summary\");\nconst itemCount = 3;\nfunction showSummary() {\n  summary.textContent = itemCount;\n}\nshowSummary();", exampleExplanation: "The element is selected once, a value is stored and the function shows the value on the page.", task: "Keep your current website. Add <p id=\"summary\">Summary loading...</p> to the HTML. In JavaScript, select it, create const pageTitle and const itemCount, define showSummary, update summary.textContent and call the function.", starterFiles: files("<header><h1>{{TITLE}}</h1></header><main><p>{{INTRO}}</p><p id=\"summary\">Summary loading...</p><section class=\"cards\"><article class=\"card\">{{ITEM1}}</article><article class=\"card\">{{ITEM2}}</article><article class=\"card\">{{ITEM3}}</article></section></main>", shared.cssProject, "const summary = document.querySelector(\"#summary\");\n// Add pageTitle and itemCount\n// Define and call showSummary"), editableFiles: ["html", "css", "javascript"], tests: [t("html", "The page has a visible summary area", "<p[^>]+id=[\"']summary[\"'][^>]*>"), t("javascript", "summary stores the matching element", "const\\s+summary\\s*=\\s*document\\.querySelector\\([\"']#summary[\"']\\)"), t("javascript", "pageTitle stores text", "const\\s+pageTitle\\s*=\\s*[\"'][^\"']+[\"']"), t("javascript", "itemCount stores a number", "const\\s+itemCount\\s*=\\s*\\d+"), t("javascript", "showSummary updates the summary and is called", "function\\s+showSummary\\s*\\([\\s\\S]*summary\\.textContent\\s*=[\\s\\S]*showSummary\\s*\\(")], hints: ["Add the summary paragraph to the HTML before writing JavaScript.", "At the top of JavaScript, select #summary and create pageTitle and itemCount with const.", "Inside showSummary, assign a useful value to summary.textContent. Close the function, then call showSummary();."], question: q("Why store the selected summary element?", "So later instructions can update the same element clearly", "So CSS stops running", "So the id becomes an image", "An element reference lets later JavaScript read or change the selected part of the page."), reflection: "What value did JavaScript place on the page?" },
    projectQuestion: q("Which line calls showSummary?", "showSummary();", "function showSummary", "#showSummary", "A name followed by parentheses calls the function."),
  }),
  makeStage({
    id: "javascript-logic", number: 6, title: "Make decisions and repeat work", description: "Use comparisons, conditions, arrays and loops.", outcome: "Code that chooses an outcome and handles several values.",
    challenges: [
      { id: "compare", title: "Compare values", minutes: 11, objective: "Use comparison operators to create a boolean result.", language: "JavaScript", explanation: ["A comparison asks a question and produces the boolean value true or false. Strict equality uses === to ask whether two values have the same value and data type.", "Other comparison operators check size. > means greater than, while >= means greater than or equal to. Read lessonCount >= 4 as: is lessonCount at least four?"], keyTerms: ["comparison", "comparison operator", "boolean", "strict equality"], exampleTitle: "Check a total", exampleCode: "const count = 3;\nconst exactlyThree = count === 3;\nconst hasItems = count > 0;", exampleExplanation: "Both variables become true because count is exactly 3 and is also greater than 0.", task: "Create isReady by checking if lessonCount is exactly 4. Then create hasLessons by checking whether lessonCount is greater than 0.", starterFiles: files("<p>Check the value.</p>", "", "const lessonCount = 4;\n// Create isReady\n// Create hasLessons"), editableFiles: ["javascript"], tests: [t("javascript", "isReady compares lessonCount with 4", "const\\s+isReady\\s*=\\s*lessonCount\\s*===\\s*4"), t("javascript", "hasLessons checks for more than zero", "const\\s+hasLessons\\s*=\\s*lessonCount\\s*>\\s*0")], hints: ["Begin the first line with const isReady =.", "Use lessonCount === 4 for the exact check.", "Use const hasLessons = lessonCount > 0; for the second check."], question: q("What does >= mean?", "Greater than or equal to", "Exactly equal to text", "Create a new element", ">= checks whether the left value is greater than or equal to the right value.") },
      { id: "conditions", title: "Choose with if and else", minutes: 12, objective: "Run one block when a condition is true and another when it is false.", language: "JavaScript", explanation: ["An if statement reads a condition inside parentheses. When the condition is true, JavaScript runs the instructions inside the first pair of braces.", "else provides the other path. In score >= 5, the >= comparison means at least 5, so a score of 5 or more receives Ready and every smaller score receives Keep going."], keyTerms: ["if", "else", "condition", "comparison operator"], exampleTitle: "Choose one message", exampleCode: "if (count > 0) {\n  message = \"Available\";\n} else {\n  message = \"Nothing yet\";\n}", exampleExplanation: "JavaScript checks the condition and chooses only one of the two blocks.", task: "Set message to Ready when score is 5 or higher. Otherwise set it to Keep going. The final line will show your chosen message.", starterFiles: files("<p id=\"message\"></p>", "", "const score = 5;\nlet message = \"\";\n// Add if and else\ndocument.querySelector(\"#message\").textContent = message;"), editableFiles: ["javascript"], tests: [t("javascript", "The condition checks score", "if\\s*\\(\\s*score\\s*>=\\s*5"), t("javascript", "The true result is Ready", "message\\s*=\\s*[\"']Ready[\"']"), t("javascript", "The else result is Keep going", "else\\s*\\{[\\s\\S]*message\\s*=\\s*[\"']Keep going[\"']")], hints: ["Place the if statement before the textContent line.", "Use if (score >= 5) and set message inside its braces.", "After the first closing brace, add else and set message to Keep going inside the second block."], question: q("When does an if block run?", "When its condition is true", "Whenever CSS loads", "Only when an image fails", "if runs when its condition evaluates to true.") },
      { id: "arrays", title: "Store a group in an array", minutes: 12, objective: "Create an array, read one item and check its length.", language: "JavaScript", explanation: ["An array stores an ordered group of values inside square brackets. Each value is an item, and commas separate the items.", "An index is an item's position and starts at 0, so index 1 is the second item. The length property tells you how many items are in the whole array. For three items, tools.length is 3."], keyTerms: ["array", "item", "index", "length"], exampleTitle: "Read an item and the length", exampleCode: "const topics = [\"Design\", \"Science\", \"Music\"];\nconst first = topics[0];\nconst topicCount = topics.length;", exampleExplanation: "topics[0] reads the first item and topics.length counts all three items.", task: "Create a three-item tools array. Store its second item in chosenTool and store its length in toolCount.", starterFiles: files("<p>Use an array.</p>", "", "// Create tools\n// Read the second item\n// Store the number of items"), editableFiles: ["javascript"], tests: [t("javascript", "tools has at least three values", "const\\s+tools\\s*=\\s*\\[[^\\]]+,[^\\]]+,[^\\]]+\\]"), t("javascript", "chosenTool reads index 1", "const\\s+chosenTool\\s*=\\s*tools\\s*\\[\\s*1\\s*\\]"), t("javascript", "toolCount uses array length", "const\\s+toolCount\\s*=\\s*tools\\.length")], hints: ["Use const tools = [ and separate three quoted values with commas.", "The second item is tools[1] because counting starts at 0.", "Use const toolCount = tools.length; to count every item."], question: q("What does an array's length property give you?", "The number of items in the array", "The first item only", "The colour of each item", "length reports how many items an array contains.") },
      { id: "loops", title: "Create elements with a loop", minutes: 16, objective: "Use forEach, createElement, textContent and append for every array item.", language: "JavaScript", explanation: ["forEach runs the same function once for every item in an array. The function's parameter, such as skill, is the loop variable. It represents the current item during that one run.", "document.createElement(\"li\") creates a new list item in memory. Set its textContent to the loop variable, then use append to place the new li inside the list. This makes visible output without joining HTML strings."], keyTerms: ["loop", "forEach", "loop variable", "createElement", "textContent", "append"], exampleTitle: "Create one list item for every topic", exampleCode: "const list = document.querySelector(\"#topic-list\");\ntopics.forEach(function (topic) {\n  const item = document.createElement(\"li\");\n  item.textContent = topic;\n  list.append(item);\n});", exampleExplanation: "On each run, topic is the current value. JavaScript creates, fills and appends one li.", task: "Select #skill-list. Use skills.forEach with skill as the loop variable. Inside the loop, create an li, set its textContent to skill and append it to the list.", starterFiles: files("<ul id=\"skill-list\"></ul>", "", "const skills = [\"HTML\", \"CSS\", \"JavaScript\"];\nconst list = document.querySelector(\"#skill-list\");\n// Add the loop"), editableFiles: ["javascript"], tests: [t("javascript", "forEach uses skill as the current item", "skills\\.forEach\\s*\\(\\s*function\\s*\\(\\s*skill\\s*\\)"), t("javascript", "The loop creates an li", "forEach[\\s\\S]*document\\.createElement\\(\\s*[\"']li[\"']\\s*\\)"), t("javascript", "The li receives the current skill", "(?:item|listItem)\\.textContent\\s*=\\s*skill"), t("javascript", "The li is appended to the list", "list\\.append\\(\\s*(?:item|listItem)\\s*\\)")], hints: ["Begin with skills.forEach(function (skill) { and remember to close it with });.", "Inside the loop, create const item = document.createElement(\"li\"); and set item.textContent = skill;.", "Still inside the loop, use list.append(item); to make the new li visible."], question: q("What does the loop variable skill represent?", "The current array item during one loop run", "Every item at the same time", "The CSS file", "A loop variable represents one current item as the loop repeats.") },
    ],
    project: { id: "project", title: "Generate content from data", minutes: 27, objective: "Use an array, length check and loop to add visible content.", language: "Web project", explanation: ["Keep your existing website. Add a paragraph with id=\"message\" and an empty ul with id=\"topic-list\" where JavaScript can place the project topics.", "Store the three topics in an array. If topics.length is greater than 0, show a helpful message. Then loop through topics and create, fill and append one li for each topic."], keyTerms: ["data", "array", "length", "condition", "loop", "createElement", "append"], exampleTitle: "Build a list safely from data", exampleCode: "const list = document.querySelector(\"#topic-list\");\ntopics.forEach(function (topic) {\n  const item = document.createElement(\"li\");\n  item.textContent = topic;\n  list.append(item);\n});", exampleExplanation: "The array stores the values and the loop turns each value into a real li element.", task: "Keep your current website. Add #message and #topic-list to the HTML. In JavaScript, create three topics, check topics.length > 0, show a message, then use forEach, createElement, textContent and append to build the list.", starterFiles: files("<header><h1>{{TITLE}}</h1></header><main><p>{{INTRO}}</p><p id=\"message\"></p><ul id=\"topic-list\"></ul></main><footer><p>Built while learning web development.</p></footer>", shared.cssProject, "const topics = [\"{{ITEM1}}\", \"{{ITEM2}}\", \"{{ITEM3}}\"];\nconst message = document.querySelector(\"#message\");\nconst list = document.querySelector(\"#topic-list\");\n// Add the condition and loop"), editableFiles: ["html", "css", "javascript"], tests: [t("html", "The page has a message area", "id=[\"']message[\"']"), t("html", "The page has a topic list", "<ul[^>]+id=[\"']topic-list[\"'][^>]*>"), t("javascript", "The project stores three topics", "const\\s+topics\\s*=\\s*\\[[^\\]]+,[^\\]]+,[^\\]]+\\]"), t("javascript", "A condition checks the array length", "if\\s*\\(\\s*topics\\.length\\s*>\\s*0\\s*\\)"), t("javascript", "The condition shows a message", "if\\s*\\([^)]*topics\\.length[^)]*\\)[\\s\\S]*message\\.textContent\\s*=\\s*[\"'][^\"']+[\"']"), t("javascript", "A loop processes topics", "topics\\.forEach\\s*\\(\\s*function\\s*\\(\\s*topic\\s*\\)"), t("javascript", "The loop creates a list item", "document\\.createElement\\(\\s*[\"']li[\"']\\s*\\)"), t("javascript", "The current topic becomes visible text", "(?:item|listItem)\\.textContent\\s*=\\s*topic"), t("javascript", "The new item is appended", "list\\.append\\(\\s*(?:item|listItem)\\s*\\)")], hints: ["Add <p id=\"message\"></p> and <ul id=\"topic-list\"></ul> without removing your earlier content.", "Use if (topics.length > 0) to update message.textContent before the loop.", "Inside topics.forEach, create an li, set its textContent to topic and append it to list."], question: q("Why use createElement and append?", "They create real elements and place them in the page", "They turn CSS into HTML", "They delete the array", "createElement makes a new element and append places it inside a parent."), reflection: "Which repeated instruction did your loop remove?" },
    projectQuestion: q("What builds several list items from data?", "An array and loop", "A border and margin", "A heading and image", "The array stores values and the loop processes them."),
  }),
  makeStage({
    id: "dom-interaction", number: 7, title: "Make the page interactive", description: "Connect buttons and fields to JavaScript.", outcome: "Controls that respond with clear feedback.",
    challenges: [
      { id: "select", title: "Select an element", minutes: 10, objective: "Find and store an HTML element.", language: "JavaScript", explanation: ["The DOM represents the page as objects JavaScript can use.", "querySelector accepts a CSS selector and returns the matching element."], keyTerms: ["DOM", "querySelector", "element"], exampleTitle: "Store a button", exampleCode: "const openButton = document.querySelector(\"#open-button\");", exampleExplanation: "The variable now refers to that button.", task: "Store #details in a variable named details.", starterFiles: files("<section id=\"details\">Details</section>", "", "// Select the section"), editableFiles: ["javascript"], tests: [t("javascript", "details stores the #details element", "(?:const|let)\\s+details\\s*=\\s*document\\.querySelector\\([\"']#details[\"']\\)")], hints: ["Begin with const details =.", "Call document.querySelector.", "Pass #details inside quotes."], question: q("What does querySelector receive?", "A CSS selector", "A password", "A file download", "querySelector uses a CSS selector.") },
      { id: "events", title: "Respond to a click", minutes: 13, objective: "Run code after a button click.", language: "JavaScript", explanation: ["An event is something that happens in the browser.", "addEventListener connects an event to a function."], keyTerms: ["event", "event listener", "click"], exampleTitle: "A working button", exampleCode: "button.addEventListener(\"click\", function () { message.textContent = \"Button used\"; });", exampleExplanation: "The function waits for the click.", task: "Make the button change #message to Details opened.", starterFiles: files("<button id=\"open-button\">Open</button><p id=\"message\">Waiting</p>", "", "const button = document.querySelector(\"#open-button\");\nconst message = document.querySelector(\"#message\");\n// Add the click listener"), editableFiles: ["javascript"], tests: [t("javascript", "The button listens for click", "button\\.addEventListener\\s*\\(\\s*[\"']click[\"']"), t("javascript", "The click changes the message", "addEventListener[\\s\\S]*message\\.textContent\\s*=\\s*[\"']Details opened[\"']")], hints: ["Call addEventListener on button.", "The event name is click.", "Change message.textContent inside the function."], question: q("When does the listener function run?", "When its event happens", "Before HTML exists", "When CSS has an error", "The listener waits for its event.") },
      { id: "classes", title: "Toggle a class", minutes: 12, objective: "Use classList.toggle to change state.", language: "JavaScript", explanation: ["JavaScript can change classes while CSS controls their appearance.", "toggle adds a class when missing and removes it when present."], keyTerms: ["classList", "toggle", "state"], exampleTitle: "Switch a class", exampleCode: "details.classList.toggle(\"is-open\");", exampleExplanation: "Each call switches is-open on or off.", task: "Toggle is-highlighted on the article after a click.", starterFiles: files("<button id=\"highlight\">Highlight</button><article id=\"article\">Important</article>", ".is-highlighted { background: #f2bf62; }", "const button = document.querySelector(\"#highlight\");\nconst article = document.querySelector(\"#article\");\nbutton.addEventListener(\"click\", function () {\n  // Toggle the class\n});"), editableFiles: ["javascript"], tests: [t("javascript", "The click toggles is-highlighted", "article\\.classList\\.toggle\\s*\\(\\s*[\"']is-highlighted[\"']")], hints: ["Use article inside the click function.", "Call classList.toggle.", "Pass is-highlighted as text."], question: q("What does classList.toggle do?", "Adds or removes one class", "Deletes HTML", "Changes a number to an image", "toggle switches a named class.") },
      { id: "forms", title: "Read visitor input", minutes: 14, objective: "Read a text input after form submission.", language: "JavaScript", explanation: ["An input's value property contains the text currently typed into that control. The input keeps type=\"text\" because this form asks for a topic name.", "Submitting a form normally reloads the page. The event parameter describes that submission, and event.preventDefault() stops the reload so JavaScript can show the answer in #result."], keyTerms: ["value", "submit", "submit event", "preventDefault", "input type"], exampleTitle: "Read a submitted value", exampleCode: "form.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  result.textContent = input.value;\n});", exampleExplanation: "The listener waits for submission, keeps the page open and then shows the typed value.", task: "On submit, prevent the reload and show input.value in #result.", starterFiles: files("<form id=\"topic-form\"><label for=\"topic\">Topic</label><input id=\"topic\" type=\"text\"><button type=\"submit\">Show</button></form><p id=\"result\"></p>", "", "const form = document.querySelector(\"#topic-form\");\nconst input = document.querySelector(\"#topic\");\nconst result = document.querySelector(\"#result\");\n// Handle the form"), editableFiles: ["javascript"], tests: [t("javascript", "The form listens for submit", "form\\.addEventListener\\s*\\(\\s*[\"']submit[\"']"), t("javascript", "Submission is prevented", "event\\.preventDefault\\s*\\("), t("javascript", "The result uses input.value", "result\\.textContent\\s*=\\s*input\\.value")], hints: ["Call form.addEventListener and use submit as the event name.", "Name the function parameter event, then call event.preventDefault(); first.", "Assign input.value to result.textContent inside the listener."], question: q("Where is typed input text stored?", "Its value property", "Its border", "Its href", "value provides the current input text.") },
    ],
    project: { id: "project", title: "Build a working interaction", minutes: 30, objective: "Add a labelled form and connect it to useful behaviour.", language: "Web project", explanation: ["Keep everything already built. Add a new form with id=\"topic-form\", a label for=\"topic\", an input id=\"topic\" with type=\"text\", a submit button and a paragraph id=\"result\".", "In JavaScript, select those three ids. Listen for the form's submit event, prevent the reload, place input.value in result.textContent and add the is-ready class so the visitor receives clear feedback."], keyTerms: ["interaction", "submit event", "input type", "feedback"], exampleTitle: "A complete interaction flow", exampleCode: "const form = document.querySelector(\"#topic-form\");\nconst input = document.querySelector(\"#topic\");\nconst result = document.querySelector(\"#result\");\nform.addEventListener(\"submit\", function (event) {\n  event.preventDefault();\n  result.textContent = input.value;\n  result.classList.add(\"is-ready\");\n});", exampleExplanation: "The ids connect the HTML to JavaScript. The listener reads the visitor's answer and shows feedback without leaving the page.", task: "Keep your current website. Add #topic-form with a connected text input #topic, a submit button and #result. Then select the ids and make submission show input.value in #result and add is-ready.", starterFiles: files("<header><h1>{{TITLE}}</h1></header><main><p>{{INTRO}}</p><form id=\"topic-form\"><label for=\"topic\">Choose a topic</label><input id=\"topic\" type=\"text\"><button type=\"submit\">Update page</button></form><p id=\"result\">Your choice appears here.</p></main><footer><p>Built while learning web development.</p></footer>", shared.cssProject + "\n.is-ready { border-left: 5px solid #5a2676; padding-left: 1rem; }", "const form = document.querySelector(\"#topic-form\");\nconst input = document.querySelector(\"#topic\");\nconst result = document.querySelector(\"#result\");\n// Build the interaction"), editableFiles: ["html", "css", "javascript"], tests: [t("html", "The page has the project form", "<form[^>]+id=[\"']topic-form[\"'][^>]*>"), t("html", "The text input has a connected label", "<label[^>]+for=[\"']topic[\"'][^>]*>[\\s\\S]*<input[^>]+(?:id=[\"']topic[\"'][^>]+type=[\"']text[\"']|type=[\"']text[\"'][^>]+id=[\"']topic[\"'])[^>]*>"), t("html", "The page has a result area", "id=[\"']result[\"']"), t("javascript", "The form listens for submit", "form\\.addEventListener\\s*\\(\\s*[\"']submit[\"']"), t("javascript", "Submission is prevented", "event\\.preventDefault\\s*\\("), t("javascript", "The result uses the input value", "result\\.textContent\\s*=[^;]*input\\.value"), t("javascript", "The result receives is-ready", "result\\.classList\\.(?:add|toggle)\\s*\\(\\s*[\"']is-ready[\"']")], hints: ["Add the complete form and result paragraph to the HTML without deleting the earlier topic list.", "Select #topic-form, #topic and #result at the top of JavaScript.", "Inside the submit listener, prevent the reload, update result.textContent and add the is-ready class."], question: q("What should feedback do?", "Show the result of an action clearly", "Hide the control", "Reload every second", "Feedback confirms what happened."), reflection: "What can a visitor do on your page now?" },
    projectQuestion: q("Which event handles a completed form?", "submit", "colour", "margin", "Forms produce a submit event."),
  }),
  makeStage({
    id: "quality", number: 8, title: "Test and finish the website", description: "Repair errors, improve access and prepare a safe final version.", outcome: "A tested website the learner can demonstrate and explain.",
    challenges: [
      { id: "html", title: "Repair broken HTML", minutes: 11, objective: "Fix mismatched closing tags.", language: "HTML", explanation: ["Debugging starts by comparing expected and actual results.", "Check opening tags, closing tags and nesting before changing unrelated code."], keyTerms: ["debugging", "expected result", "actual result"], exampleTitle: "Matched tags", exampleCode: "<section><h2>News</h2></section>", exampleExplanation: "The h2 closes before the section.", task: "Repair the heading and paragraph tags.", starterFiles: files("<section>\n  <h2>Latest article</h3>\n  <p>Read the new story.</div>\n</section>"), editableFiles: ["html"], tests: [t("html", "The h2 closes correctly", "<h2>Latest article</h2>"), t("html", "The paragraph closes correctly", "<p>Read the new story\\.</p>")], hints: ["Compare each opening and closing tag.", "The heading begins with h2.", "The paragraph begins with p."], question: q("What should you compare first?", "Expected and actual behaviour", "Two random colours", "Age and nickname", "The difference guides the repair.") },
      { id: "syntax", title: "Repair CSS and JavaScript", minutes: 13, objective: "Fix one error in each language.", language: "JavaScript", explanation: ["Small punctuation and spelling mistakes can stop code.", "Read the exact line, change one thing and run again."], keyTerms: ["syntax", "error", "test"], exampleTitle: "Two repairs", exampleCode: ".card { color: #111936; }\nconst card = document.querySelector(\".card\");", exampleExplanation: "CSS uses a colon and querySelector is spelled correctly.", task: "Repair the CSS declaration and querySelector spelling.", starterFiles: files("<article class=\"card\">Test</article>", ".card { color = #111936; }", "const card = document.querySelecter(\".card\");\ncard.textContent = \"Repair complete\";"), editableFiles: ["css", "javascript"], tests: [t("css", "CSS uses a colon", "color\\s*:\\s*#111936"), t("javascript", "querySelector is correct", "document\\.querySelector\\(")], hints: ["CSS uses a colon between property and value.", "Compare the method name with earlier lessons.", "Repair only the two broken pieces."], question: q("Why change one thing before running?", "It identifies which change solved the problem", "It makes the file longer", "It hides the error", "Small changes give useful evidence.") },
      { id: "access", title: "Check accessibility", minutes: 13, objective: "Use alt text, labels and keyboard focus.", language: "CSS", explanation: ["Accessible code helps more people use a webpage.", "Images need descriptions, inputs need labels and controls need visible focus."], keyTerms: ["accessibility", "keyboard focus", "focus-visible"], exampleTitle: "Visible keyboard focus", exampleCode: "button:focus-visible { outline: 3px solid #ee9d2b; }", exampleExplanation: "The outline shows the currently selected control.", task: "Add alt text, connect the label and style button focus.", starterFiles: files("<img src=\"photo.jpg\">\n<label>Search</label><input id=\"search\">\n<button>Search</button>", "/* Add focus style */"), editableFiles: ["html", "css"], tests: [t("html", "The image has alt text", "<img[^>]+alt=[\"'][^\"']{5,}[\"']"), t("html", "The label connects to search", "<label[^>]+for=[\"']search[\"']"), t("css", "Button focus is visible", "button:focus-visible\\s*\\{[\\s\\S]*outline\\s*:")], hints: ["Describe the image with alt.", "Add for=search to the label.", "Use button:focus-visible with outline."], question: q("Why show keyboard focus?", "It shows which control is selected", "It reloads the page", "It replaces labels", "A focus indicator helps keyboard users follow position.") },
      { id: "sharing", title: "Write a safe project note", minutes: 10, objective: "Describe the work without personal details.", language: "HTML", explanation: ["A project note should state what was built and which technologies were used.", "Use a nickname. Do not publish a full name, school, phone number, home address or exact location."], keyTerms: ["project note", "privacy", "credit"], exampleTitle: "A safe creator note", exampleCode: "<footer><p>Built by SkyCoder using HTML, CSS and JavaScript.</p></footer>", exampleExplanation: "It credits the skill without identifying the child.", task: "Write a footer note with a nickname and all three technologies.", starterFiles: files("<footer>\n  <!-- Add the safe note -->\n</footer>"), editableFiles: ["html"], tests: [t("html", "The note mentions HTML", "HTML"), t("html", "The note mentions CSS", "CSS"), t("html", "The note mentions JavaScript", "JavaScript"), t("html", "The note is in a footer", "<footer[\\s>][\\s\\S]+</footer>")], hints: ["Begin with Built by and a nickname.", "Name HTML, CSS and JavaScript.", "Keep the sentence inside footer."], question: q("What stays off a public child project?", "School and exact location", "Technologies used", "Project title", "Identifying location details should stay private.") },
    ],
    project: { id: "project", title: "Complete the final website", minutes: 38, objective: "Finish, test and explain the responsive interactive website built across all eight modules.", language: "Web project", explanation: ["This is the final version of the same website you started in Module 1. Keep its title, content, design, generated topic list and form interaction. Do not replace the project with a new page.", "Add a button with id=\"welcome-button\" and a paragraph with id=\"welcome-message\". Select both elements in JavaScript and make a click show a welcome message. Finish with visible keyboard focus and a safe footer note naming HTML, CSS and JavaScript."], keyTerms: ["final build", "testing", "accessibility", "explanation"], exampleTitle: "Final evidence", exampleCode: "const welcomeButton = document.querySelector(\"#welcome-button\");\nconst welcomeMessage = document.querySelector(\"#welcome-message\");\nwelcomeButton.addEventListener(\"click\", function () {\n  welcomeMessage.textContent = \"Thanks for visiting\";\n});", exampleExplanation: "The final interaction uses exact ids, gives visible feedback and is simple enough to explain line by line.", task: "Keep every earlier feature. Add #welcome-button and #welcome-message, connect their click interaction, keep the responsive media query and focus style, and end with a safe footer that names HTML, CSS and JavaScript.", starterFiles: files("<header><h1>{{TITLE}}</h1><nav><a href=\"#topics\">Topics</a><a href=\"#contact\">Choose a topic</a></nav></header>\n<main>\n  <p>{{INTRO}}</p>\n  <section id=\"topics\" class=\"cards\"><article class=\"card\">{{ITEM1}}</article><article class=\"card\">{{ITEM2}}</article><article class=\"card\">{{ITEM3}}</article></section>\n  <ul id=\"topic-list\"></ul>\n  <form id=\"topic-form\"><label for=\"topic\">Choose a topic</label><input id=\"topic\" type=\"text\"><button type=\"submit\">Show topic</button></form>\n  <p id=\"result\"></p>\n  <button id=\"welcome-button\" type=\"button\">Welcome me</button>\n  <p id=\"welcome-message\"></p>\n</main>\n<footer><p>Built by SkyCoder using HTML, CSS and JavaScript.</p></footer>", shared.cssProject + "\nnav { display: flex; gap: 1rem; }\nbutton:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }", "const welcomeButton = document.querySelector(\"#welcome-button\");\nconst welcomeMessage = document.querySelector(\"#welcome-message\");\nwelcomeButton.addEventListener(\"click\", function () {\n  welcomeMessage.textContent = \"Thanks for visiting\";\n});"), editableFiles: ["html", "css", "javascript"], tests: [t("html", "The page uses semantic regions", "<header[\\s>][\\s\\S]*<main[\\s>][\\s\\S]*<footer[\\s>]"), t("html", "The final welcome button has the required id", "<button[^>]+id=[\"']welcome-button[\"'][^>]*>"), t("html", "The page has a welcome message area", "id=[\"']welcome-message[\"']"), t("css", "The layout has a media query", "@media\\s*\\("), t("css", "Keyboard focus remains visible", ":focus-visible\\s*\\{[\\s\\S]*outline\\s*:"), t("javascript", "welcomeButton selects the exact button", "const\\s+welcomeButton\\s*=\\s*document\\.querySelector\\([\"']#welcome-button[\"']\\)"), t("javascript", "The welcome button listens for a click", "welcomeButton\\.addEventListener\\s*\\(\\s*[\"']click[\"']"), t("javascript", "The interaction updates the welcome message", "welcomeMessage\\.textContent\\s*=\\s*[\"'][^\"']+[\"']"), t("html", "The footer names all three technologies", "<footer[\\s\\S]*HTML[\\s\\S]*CSS[\\s\\S]*JavaScript[\\s\\S]*</footer>")], hints: ["Run the current version first and keep the features that already pass.", "Add the exact ids welcome-button and welcome-message before writing the new JavaScript.", "Check HTML, CSS and JavaScript separately, then explain one repair in your reflection."], question: q("What proves practical coding skill?", "A working website the learner can explain", "The number of pages opened", "A badge alone", "A working, tested and explained product proves skill."), reflection: "What can you build now that you could not build before?" },
    projectQuestion: q("What is the strongest final evidence?", "Working code, passed checks and an explanation", "A long activity total", "A colourful screen without working controls", "The product, tests and explanation show understanding."),
  }),
];

export const lessons = stages.flatMap((stage) => stage.lessons);

export const finalExam: PracticeQuestion[] = [
  q("Which element is the main page heading?", "h1", "p", "a", "h1 represents the main heading."),
  q("Which attribute describes an image?", "alt", "href", "className", "alt provides an alternative description."),
  q("How does CSS select class card?", ".card", "#card", "<card>", "A class selector begins with a full stop."),
  q("What creates space inside a border?", "padding", "margin", "display", "Padding creates inner space."),
  q("What is useful for a row of links?", "Flexbox", "alt text", "querySelector", "Flexbox controls one-dimensional layouts."),
  q("What declares a changing JavaScript variable?", "let", "href", "style", "let creates a reassignable variable."),
  q("What does a condition produce?", "A true or false decision", "An image", "A border", "A condition evaluates to true or false."),
  q("What is the first array index?", "0", "1", "10", "Array indexing begins at 0."),
  q("What connects a click to JavaScript?", "An event listener", "An h1", "A media query", "An event listener runs code after a click."),
  q("What should happen first when code fails?", "Compare expected and actual behaviour", "Rewrite every file", "Add random code", "A clear comparison guides repair."),
];

export const practicalExam = {
  title: "Repair a small webpage",
  language: "HTML and JavaScript",
  brief: "Repair the heading tag, correct querySelector and make the button change the message to Ready.",
  starterCode: "<h2>Final check</h3>\n<button id=\"check\">Check work</button>\n<p id=\"message\">Waiting</p>\n\n<script>\nconst button = document.querySelecter(\"#check\");\nconst message = document.querySelector(\"#message\");\nbutton.addEventListener(\"click\", function () {\n  message.textContent = \"\";\n});\n</script>",
  requiredPatterns: [
    "</h2>",
    "querySelector\\(\\s*[\"']#check[\"']\\s*\\)",
    "textContent\\s*=\\s*[\"']Ready[\"']",
  ],
};

export const courseFacts: CourseFacts = { id: "ages-10-12", title: "Web Coding Foundations", ageRange: "Ages 10 to 12", ages: [10, 11, 12], lessonCount: lessons.length, stageCount: stages.length, estimatedHours: "18 to 22 hours", passMark: 7 };

export const course10to12: CourseBundle = { courseFacts, stages, lessons, projectChoices, finalExam, practicalExam };
