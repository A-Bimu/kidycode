import type { CodeFile, Lesson, PracticeQuestion, WorkspaceFiles } from "@/lib/course";
import { pathwayConceptRules } from "@/lib/tutor-concepts";

/*
 * Adaptive tutor engine.
 *
 * This module is deliberately free of database and browser access so it can be
 * reasoned about and tested on its own. It turns graded evidence into the
 * smallest useful piece of support, and it never reveals a complete answer on
 * the first failure.
 */

export type RequirementResult = { label: string; file: CodeFile; concept: string; passed: boolean };

export type StruggleEntry = { concept: string; label: string; fails: number };

export type TutorLevel = 1 | 2 | 3;

export type TutorNudge = {
  concept: string;
  focus: string;
  level: TutorLevel;
  message: string;
  example: string;
  requirement: string;
};

export type ConceptRule = {
  key: string;
  focus: string;
  match: RegExp;
  hint: string;
  explanation: string;
  example: string;
  acknowledgement: string;
};

export const MAX_STRUGGLES = 6;
export const MAX_REQUESTS_PER_LESSON = 40;

/*
 * Concept rules are matched against the requirement label the course already
 * uses for automatic checks. The label is the tutor's source of truth, so the
 * support always points at the real requirement rather than a guessed one.
 * The first rule that matches wins, so more specific rules come first.
 */
export const conceptRules: ConceptRule[] = [
  {
    key: "image-description",
    focus: "Image description",
    match: /alt|alternative text/i,
    hint: "Your image element is in the right place. The browser still needs to know what the picture shows when it cannot be seen. Look for the attribute that describes the image.",
    explanation: "An img element needs a second attribute called alt. Its value is a short description of what matters in the picture, so the information still reaches someone who cannot view the image.",
    example: '<img src="camera.jpg" alt="A camera beside a notebook">',
    acknowledgement: "You described the image with alt, so the picture now carries meaning even when it cannot load.",
  },
  {
    key: "image-source",
    focus: "Image address",
    match: /\bsrc\b|image source|picture comes from|image address/i,
    hint: "The image element is there, but the browser has not been told which picture to open. Look for the attribute that provides the image address.",
    explanation: "An img element finds its picture through the src attribute. The value is the address of the image file, written inside the opening tag.",
    example: '<img src="photo.jpg" alt="A clear description">',
    acknowledgement: "You gave the image its address with src, which is what lets the browser fetch the picture.",
  },
  {
    key: "link-destination",
    focus: "Link destination",
    match: /href|link(s)? to|destination/i,
    hint: "The link element is in place, but the browser does not yet know where it should go. Name the attribute that stores an address on a link.",
    explanation: "An a element stores its destination in the href attribute. Writing the full address inside href is what makes the words clickable.",
    example: '<a href="https://example.com">Read more</a>',
    acknowledgement: "You set the link destination with href, so the words now lead somewhere real.",
  },
  {
    key: "label-input-connection",
    focus: "Label and input connection",
    match: /label|input|for=|id=/i,
    hint: "The label and the input are both on the page, but they are not connected yet. Look for the two matching words that join them.",
    explanation: "The label's for value and the input's id value must be exactly the same word. That shared word is what links the description to the control.",
    example: '<label for="email">Email address</label>\n<input id="email" type="email">',
    acknowledgement: "You connected the label to its input with a matching for and id, which is what makes the control understandable.",
  },
  {
    key: "input-type",
    focus: "Input type",
    match: /input type|type attribute|email type/i,
    hint: "The input exists, but the browser has not been told what kind of answer to expect. Look for the attribute that describes the value.",
    explanation: "The type attribute tells the browser which kind of answer the control should accept, which is why type=\"email\" receives email checking.",
    example: '<input id="email" type="email">',
    acknowledgement: "You set the input type, so the browser now knows what kind of answer belongs there.",
  },
  {
    key: "list-items",
    focus: "List items",
    match: /list item|list contains|three-item|three items|at least three/i,
    hint: "The list container is correct. It still has fewer items than the task asks for. Look at which element repeats for each item in a list.",
    explanation: "Every entry in a list is its own li element. A three item list needs three li elements, each opened and closed inside the list.",
    example: "<ul>\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>",
    acknowledgement: "You built the list from repeating list items, which is how a list stays readable and predictable.",
  },
  {
    key: "list-element",
    focus: "List element",
    match: /unordered list|list groups|topic list|ol |ul /i,
    hint: "The items are written, but they are not inside a list container yet. Look for the element that groups items when the order does not matter.",
    explanation: "A ul element groups items whose order does not matter, and an ol groups items where order matters. List items belong inside one of those containers.",
    example: "<ul>\n  <li>Notebook</li>\n</ul>",
    acknowledgement: "You grouped the items with a list element, so the browser now presents them as one list.",
  },
  {
    key: "main-heading",
    focus: "Main heading",
    match: /main heading|h1|page title|main title/i,
    hint: "Your content is on the page. The browser still needs to know which line is the main heading. Look at the heading level that means the most important title.",
    explanation: "The h1 element names the page. There is usually one of them, and it wraps the words in an opening and a closing tag.",
    example: "<h1>My First Website</h1>",
    acknowledgement: "You marked the main heading with h1, which is what tells the browser which title leads the page.",
  },
  {
    key: "section-heading",
    focus: "Section heading",
    match: /section heading|h2|section title/i,
    hint: "The section exists. The browser still needs a heading that introduces it. Look at the heading level one step below the page title.",
    explanation: "An h2 element introduces a section inside the page. It sits below h1 in importance and is written with its own opening and closing tag.",
    example: "<h2>About this page</h2>",
    acknowledgement: "You introduced the section with h2, so the page now has a clear structure to follow.",
  },
  {
    key: "paragraph",
    focus: "Paragraph",
    match: /paragraph|intro|has an introduction/i,
    hint: "The words are on the page, but the browser has not been told they are a normal sentence. Look for the element that holds running text.",
    explanation: "The p element holds a paragraph of normal text. Plain words sitting outside an element have no meaning attached to them.",
    example: "<p>This page shares useful ideas.</p>",
    acknowledgement: "You wrapped the words in a paragraph element, which is what gives normal text its job.",
  },
  {
    key: "nesting",
    focus: "Nesting",
    match: /nest|contains the heading|inside a section|section contains|hav(e|es) a .* parent|grouped/i,
    hint: "The elements are all present. The browser still needs them grouped in the right order. Check which tag opens first and which one closes last.",
    explanation: "Nesting means an element sits inside another one. The inner element closes before the outer element, so the parent still contains everything it holds.",
    example: "<section>\n  <h2>About</h2>\n  <p>This content belongs together.</p>\n</section>",
    acknowledgement: "You nested the elements so the group closes in the right order, which is what keeps the structure valid.",
  },
  {
    key: "semantic-region",
    focus: "Meaningful page regions",
    match: /header|main region|footer|semantic|three div/i,
    hint: "The page has the right content. The region names still need to say what each part does. Check the tag that introduces a page, holds its central content, and ends it.",
    explanation: "Semantic elements name the job of a region: header introduces the page, main holds the central content and footer closes it.",
    example: "<header><h1>Guide</h1></header>\n<main><p>Main information.</p></main>\n<footer><p>Practice project.</p></footer>",
    acknowledgement: "You used semantic region names, so each part of the page now states its own job.",
  },
  {
    key: "class-usage",
    focus: "Class reuse",
    match: /class=|card class|featured class|uses the .* class/i,
    hint: "The element is there, but it does not carry the reusable name yet. Look for the attribute that connects an element to a class style.",
    explanation: "The class attribute holds a name that HTML and CSS share. Adding the class name to an element is what lets an existing rule style it.",
    example: '<article class="card">Useful information</article>',
    acknowledgement: "You attached the class name in the HTML, which is what lets one rule style several elements.",
  },
  {
    key: "class-selector",
    focus: "Class selector",
    match: /selects the .* class|class selector|\.card|\.featured|\.note|\.grid|\.cards/i,
    hint: "The HTML is ready for this style. The stylesheet still needs a rule that chooses it. Check the character that begins a class selector.",
    explanation: "A class selector starts with a full stop and then the class name, for example .card. Without the full stop the browser reads it as an element name instead.",
    example: ".card {\n  padding: 1rem;\n}",
    acknowledgement: "You selected the class with a full stop, which is exactly how CSS finds a class name.",
  },
  {
    key: "colour-property",
    focus: "Colour property",
    match: /colou?r is #|colou?r of|text colou?r/i,
    hint: "The rule is in the right place. The browser still needs the property that changes text colour. Look for the declaration name that pairs with a colour value.",
    explanation: "The color property sets the text colour of the elements a selector chooses. The value is written after a colon and ends with a semicolon.",
    example: "h1 {\n  color: #4b1f63;\n}",
    acknowledgement: "You set the colour with the color property, which is the declaration that changes text appearance.",
  },
  {
    key: "typography",
    focus: "Readable text",
    match: /font size|line height|maximum width|max-width|1\.6|60ch|readable/i,
    hint: "One of the text measurements is still missing. Check each declaration name separately: letter size, line spacing and a comfortable line length.",
    explanation: "font-size sets the letter size, line-height sets the space between lines and max-width keeps a paragraph from stretching too wide for comfortable reading.",
    example: "p { font-size: 1rem; line-height: 1.6; max-width: 60ch; }",
    acknowledgement: "You set the text measurements deliberately, which is what makes a paragraph comfortable to read.",
  },
  {
    key: "box-spacing",
    focus: "Box spacing",
    match: /inner space|space below|padding|margin|box model/i,
    hint: "Both kinds of space are asked for here. Check which property adds space inside the border and which one adds space outside it.",
    explanation: "Padding adds space inside an element's border, and margin adds space outside it. Choosing the right one depends on where the gap belongs.",
    example: ".card { padding: 1rem; margin-bottom: 2rem; }",
    acknowledgement: "You placed the space on the correct side of the border, which is the point of the box model.",
  },
  {
    key: "surface-styling",
    focus: "Card surface",
    match: /background|border|radius|corner|off-white/i,
    hint: "The card rule exists but is still missing one of its three surface declarations. Check background, border and corner shape against the example.",
    explanation: "background fills the surface, border draws the edge and border-radius rounds the corners. Each one is a separate declaration inside the same rule.",
    example: ".card { background: #fffdf8; border: 2px solid #18213f; border-radius: 12px; }",
    acknowledgement: "You built the card surface from background, border and radius, so the group now reads as one object.",
  },
  {
    key: "flexbox",
    focus: "Flexbox row",
    match: /flexbox|display: flex|flex container|navigation uses flex/i,
    hint: "The container is chosen. The browser still needs to be told how to arrange its children. Look for the display value that creates a flexible row.",
    explanation: "Setting display: flex on a parent arranges its children along one direction, which is how a row of navigation links stops stacking.",
    example: "nav { display: flex; gap: 1rem; }",
    acknowledgement: "You turned the parent into a flex container, which is what arranges its children in a row.",
  },
  {
    key: "grid-layout",
    focus: "Grid columns",
    match: /grid|columns|1fr|repeat\(/i,
    hint: "The grid needs one more decision. Check the declaration that describes how many columns exist and how wide each one is.",
    explanation: "grid-template-columns describes the columns of a grid. repeat(2, 1fr) means two columns, and each 1fr takes one equal share of the available width.",
    example: ".cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }",
    acknowledgement: "You described the columns with grid-template-columns, which is what gives the grid its shape.",
  },
  {
    key: "gap",
    focus: "Layout spacing",
    match: /gap/i,
    hint: "The layout direction is set. The items still need consistent space between them. Look for the property that spaces items in Flexbox and Grid.",
    explanation: "The gap property adds even space between items in a flex or grid container, so you do not need margins on each child.",
    example: "nav { display: flex; gap: 1rem; }",
    acknowledgement: "You separated the items with gap, which keeps the spacing consistent without extra margins.",
  },
  {
    key: "media-query",
    focus: "Small screen layout",
    match: /media query|650px|600px|narrow screen|small screen/i,
    hint: "The page needs a rule that only applies on a narrow screen. Look for the at-rule that begins with a screen condition.",
    explanation: "A media query wraps rules in a screen condition, such as @media (max-width: 650px). The rules inside only apply when that condition is true.",
    example: "@media (max-width: 650px) {\n  .cards { grid-template-columns: 1fr; }\n}",
    acknowledgement: "You used a media query, so the layout now adapts instead of forcing a narrow screen to scroll sideways.",
  },
  {
    key: "css-rule",
    focus: "CSS rule",
    match: /selector|css rule|chooses the html|braces/i,
    hint: "The stylesheet needs a rule that targets the right element first. Check the part before the braces, then the declarations inside them.",
    explanation: "A CSS rule starts with a selector that chooses HTML, then declarations inside braces. Each declaration is a property, a colon, a value and a semicolon.",
    example: "p {\n  color: #2d1948;\n}",
    acknowledgement: "You wrote a complete rule with a selector and declarations, which is the shape every stylesheet follows.",
  },
  {
    key: "variable-declaration",
    focus: "Storing values",
    match: /const|let |stores text|stores a number|begins at|increases by/i,
    hint: "One of the stored values is still missing or written differently. Check the keyword you used and whether the value needs quotation marks.",
    explanation: "const keeps a value that will not be reassigned, and let allows the value to change later. Text values need quotation marks, and numbers do not.",
    example: 'const topicName = "Space";\nlet topicCount = 3;',
    acknowledgement: "You chose const and let deliberately, so each stored value now matches how it will be used.",
  },
  {
    key: "value-type",
    focus: "Value types",
    match: /stores a number|stores text|string|number|data type/i,
    hint: "The value is stored. Check whether the one that should count is written without quotation marks, because quotes turn a number into text.",
    explanation: "A string holds text and is written inside quotation marks. A number is written without them so JavaScript can count with it.",
    example: 'const topic = "Robotics";\nconst minutes = 15;',
    acknowledgement: "You matched each value to its data type, which is what lets JavaScript count with numbers and read text as text.",
  },
  {
    key: "element-selection",
    focus: "Finding the element",
    match: /queryselector|stores the matching element|find #|selects|finds an html element/i,
    hint: "JavaScript needs to find the element before it can change it. Check the selector you passed in and whether it matches the element in the HTML.",
    explanation: "document.querySelector finds the first element that matches a CSS selector. An id selector is written with a hash, so #status finds the element with id=\"status\".",
    example: 'const status = document.querySelector("#status");',
    acknowledgement: "You selected the element by its selector, which is the step that lets later code reach the right part of the page.",
  },
  {
    key: "changing-text",
    focus: "Changing visible text",
    match: /textcontent|changes the status|updates the text|change its text/i,
    hint: "The element is found. The browser still needs to be told to replace the words inside it. Look for the property that holds an element's visible text.",
    explanation: "After an element is selected, its textContent property can be assigned new words. Assigning with the equals sign replaces what the visitor sees.",
    example: 'document.querySelector("#message").textContent = "Welcome";',
    acknowledgement: "You replaced the visible text with textContent, which changes what the visitor reads on the page.",
  },
  {
    key: "function-shape",
    focus: "Defining and calling a function",
    match: /function|defined|is called|call the function/i,
    hint: "A function only runs when it is called. Check that the braces close, and that the final line calls the function by name.",
    explanation: "Defining a function prepares the job and calling it runs the job. The call is the function name followed by a pair of brackets.",
    example: "function showTopic() {\n  topic.textContent = \"Space\";\n}\nshowTopic();",
    acknowledgement: "You defined the function and then called it, which is the pair of steps every function needs to run.",
  },
  {
    key: "event-handling",
    focus: "Responding to events",
    match: /event|click|addEventListener|listener/i,
    hint: "The code needs to wait for something the visitor does. Look for the method that listens for an event, and check the event name inside it.",
    explanation: "addEventListener attaches a function to an event name, so the function runs when that event happens, such as \"click\".",
    example: 'button.addEventListener("click", showSummary);',
    acknowledgement: "You listened for the event and attached the right function, which is what makes the page respond to the visitor.",
  },
  {
    key: "condition",
    focus: "Making a decision",
    match: /condition|if |else|comparison|true or false/i,
    hint: "The code needs a question whose answer is true or false. Check the comparison inside the brackets.",
    explanation: "An if statement runs its block only when the condition is true, and else covers the other case. Comparisons such as === produce that true or false answer.",
    example: 'if (count === 3) {\n  status.textContent = "Three items";\n}',
    acknowledgement: "You wrote a condition that produces true or false, which is how the code decides which block to run.",
  },
  {
    key: "state-storage",
    focus: "Remembering state",
    match: /state|localstorage|store|save the|remember/i,
    hint: "The page needs to remember something between actions. Check where the value is kept and whether it is read back before it is used.",
    explanation: "State is the information the page keeps while the visitor works. Reading it back before updating is what stops an action from wiping earlier work.",
    example: 'const saved = localStorage.getItem("items");',
    acknowledgement: "You stored and read the value back, which is what lets the page remember state between actions.",
  },
];

const fallbackRule: ConceptRule = {
  key: "general-requirement",
  focus: "This requirement",
  match: /./,
  hint: "Your code is close. The exact requirement is checked against the worked example, so compare your line with the example one detail at a time.",
  explanation: "Open the notes for this lesson and read the worked example again. It shows the shape that passes, while your own words and values can stay different.",
  example: "",
  acknowledgement: "You met the requirement, so this part of the task is now working.",
};

const allConceptRules: ConceptRule[] = [...conceptRules, ...pathwayConceptRules];

export function conceptFor(label: string): ConceptRule {
  return allConceptRules.find((candidate) => candidate.match.test(label)) || fallbackRule;
}

export function conceptKeyFor(label: string): string {
  return conceptFor(label).key;
}

export function conceptFocusFor(label: string): string {
  return conceptFor(label).focus;
}

/* Grading happens here so the server, the tests and the interface all read the
 * same rules. A learner's own regex never decides whether a requirement passed. */
export function gradeRequirements(lesson: Lesson, workspace: WorkspaceFiles): RequirementResult[] {
  return lesson.tests.map((codeTest) => {
    let passed = false;
    try {
      passed = new RegExp(codeTest.pattern, "i").test(workspace[codeTest.file] || "");
    } catch {
      passed = false;
    }
    return {
      label: codeTest.label,
      file: codeTest.file,
      concept: conceptKeyFor(codeTest.label),
      passed,
    };
  });
}

export function requirementsPassed(results: RequirementResult[]): boolean {
  return results.length > 0 && results.every((result) => result.passed);
}

/* Graduated support: level 1 names the exact requirement, level 2 explains it
 * more clearly, level 3 shows a small related example. The level comes from how
 * often this concept has already failed for this learner, never from a label
 * such as a learning style. */
export function levelForFails(fails: number): TutorLevel {
  if (fails <= 0) return 1;
  if (fails === 1) return 2;
  return 3;
}

export function nudgeFor(requirement: RequirementResult, fails: number): TutorNudge {
  const rule = conceptFor(requirement.label);
  const level = levelForFails(fails);
  const message = level === 1
    ? rule.hint
    : level === 2
      ? rule.explanation
      : rule.example
        ? `${rule.explanation} A small related example looks like this: ${rule.example}`
        : rule.explanation;
  return {
    concept: rule.key,
    focus: rule.focus,
    level,
    message,
    example: level === 3 ? rule.example : "",
    requirement: requirement.label,
  };
}

export function acknowledgementFor(requirement: RequirementResult): string {
  return conceptFor(requirement.label).acknowledgement;
}

/* The first failed requirement is the one worth talking about: fixing it is the
 * smallest useful next step, so support stays focused instead of overwhelming. */
export function firstFailure(results: RequirementResult[]): RequirementResult | null {
  return results.find((result) => !result.passed) || null;
}

export function failsFor(struggles: StruggleEntry[], concept: string): number {
  return struggles.find((entry) => entry.concept === concept)?.fails || 0;
}

export function mergeStruggles(struggles: StruggleEntry[], results: RequirementResult[]): StruggleEntry[] {
  const next = new Map(struggles.map((entry) => [entry.concept, { ...entry }]));
  for (const result of results) {
    if (result.passed) {
      next.delete(result.concept);
      continue;
    }
    const existing = next.get(result.concept);
    next.set(result.concept, {
      concept: result.concept.slice(0, 60),
      label: result.label.slice(0, 140),
      fails: Math.min((existing?.fails || 0) + 1, 99),
    });
  }
  return [...next.values()].slice(0, MAX_STRUGGLES);
}

/* A lesson term found in a question is the most specific focus a learner can be
 * pointed at, because it is the same word the notes already used. */
export function termFocus(lesson: Lesson, text: string): string {
  const lower = text.toLowerCase();
  return lesson.keyTerms.find((term) => lower.includes(term.toLowerCase())) || "";
}

/* A short related example taken from the lesson the learner is already in. */
export function lessonExample(lesson: Lesson, maxLines = 3): string {
  return lesson.exampleCode.split("\n").slice(0, maxLines).join("\n").trim();
}

export function focusArea(struggles: StruggleEntry[]): string {
  if (struggles.length === 0) return "";
  const ordered = [...struggles].sort((left, right) => right.fails - left.fails);
  return conceptFocusFor(ordered[0].label);
}

/*
 * Mastery rises only when a real new milestone is reached. A repeated success
 * on a requirement that already passed changes nothing, so learners cannot
 * inflate mastery by submitting the same working code again.
 *
 * The score is measured against the checks this activity actually offers, so a
 * lesson without a module check can still reach full mastery instead of being
 * capped below it. Weights describe the relative value of each check, not a
 * fixed ceiling.
 */
export type MasteryInput = {
  requirementsPassed: boolean;
  quickCheckPassed: boolean;
  bestQuizScore: number;
  quizTotal: number;
  alreadyPassedCode: boolean;
  alreadyPassedQuickCheck: boolean;
  codeOffered: boolean;
  quickCheckOffered: boolean;
};

export const MASTERY_WEIGHTS = { code: 60, quickCheck: 20, quiz: 20 } as const;

export function masteryFrom(input: MasteryInput): number {
  let earned = 0;
  let available = 0;
  if (input.codeOffered) {
    available += MASTERY_WEIGHTS.code;
    if (input.alreadyPassedCode || input.requirementsPassed) earned += MASTERY_WEIGHTS.code;
  }
  if (input.quickCheckOffered) {
    available += MASTERY_WEIGHTS.quickCheck;
    if (input.alreadyPassedQuickCheck || input.quickCheckPassed) earned += MASTERY_WEIGHTS.quickCheck;
  }
  if (input.quizTotal > 0) {
    available += MASTERY_WEIGHTS.quiz;
    earned += MASTERY_WEIGHTS.quiz * (Math.min(input.bestQuizScore, input.quizTotal) / input.quizTotal);
  }
  if (available === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((earned / available) * 100)));
}

export function checkCount(input: {
  codePassed: boolean;
  quickCheckPassed: boolean;
  bestQuizScore: number;
  quizTotal: number;
  quickCheckOffered: boolean;
  quizOffered: boolean;
}): number {
  let count = 0;
  if (input.codePassed) count += 1;
  if (input.quickCheckOffered && input.quickCheckPassed) count += 1;
  if (input.quizOffered && input.quizTotal > 0 && input.bestQuizScore >= Math.ceil(input.quizTotal * 0.8)) count += 1;
  return count;
}

export function masteryLabel(mastery: number): string {
  if (mastery >= 100) return "Mastered";
  if (mastery >= 60) return "Secure";
  if (mastery >= 30) return "Developing";
  if (mastery > 0) return "Started";
  return "Not started";
}

/* Quiz feedback points at the idea behind each missed answer, using the lesson
 * terminology so the words match the notes the learner already read. */
export function quizFeedback(
  lesson: Lesson,
  questions: PracticeQuestion[],
  answers: number[],
): { correct: number[]; missed: number[]; focus: string[] } {
  const correct: number[] = [];
  const missed: number[] = [];
  const focus: string[] = [];
  questions.forEach((question, index) => {
    if (answers[index] === question.answer) {
      correct.push(index);
      return;
    }
    missed.push(index);
    const text = `${question.prompt} ${question.explanation}`.toLowerCase();
    const term = lesson.keyTerms.find((candidate) => text.includes(candidate.toLowerCase()));
    const label = term || question.explanation.split(".")[0] || "this question";
    if (!focus.includes(label)) focus.push(label);
  });
  return { correct, missed, focus: focus.slice(0, 3) };
}

/* Quick check feedback names the idea that was missed instead of repeating the
 * instruction to try again. */
export function quickCheckFeedback(question: PracticeQuestion, answer: number): { correct: boolean; message: string } {
  if (answer === question.answer) {
    return { correct: true, message: `Correct. ${question.explanation}` };
  }
  return {
    correct: false,
    message: `That answer describes something else in this lesson. ${question.explanation} Look again at the sentence in the notes that defines it.`,
  };
}

export function safeMessageLength(value: string, limit: number): string {
  return value.length <= limit ? value : value.slice(0, limit);
}
