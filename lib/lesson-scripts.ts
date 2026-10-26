import type { CodeFile, CodeTest, CourseId, WorkspaceFiles } from "@/lib/course";

/*
 * The V3 presentation layer. A LessonScript sits beside the existing Lesson
 * contract and supplies framing for six moments. It never restates the lesson's
 * objective, task, hints, tests or question: those stay on the Lesson, so the
 * course gate continues to protect the same fields.
 *
 * The script is additive and optional. A lesson without a script renders its
 * existing content unchanged.
 */

export const guidanceModes = ["guided", "balanced", "independent"] as const;
export type GuidanceMode = (typeof guidanceModes)[number];

export const lessonStageIds = ["hook", "model", "build", "check", "explain", "transfer"] as const;
export type LessonStageId = (typeof lessonStageIds)[number];

export type StageSpec = {
  /** One short line the learner sees before acting in this moment. */
  lead: string;
  /** Optional per-mode wording. A missing mode falls back to lead. */
  variants?: Partial<Record<GuidanceMode, string>>;
};

export type MasterySpec = {
  /** The unprompted task. A different scenario from the worked example. */
  freshTask: string;
  /** Behaviour the learner must observe with their own eyes. */
  observable: string;
  /** The question the learner answers in their own words. */
  reflection: string;
  /** Starter files for the fresh task. Kept separate from the lesson starter. */
  starterFiles: WorkspaceFiles;
  /** Files the learner may edit during the fresh task. */
  editableFiles: CodeFile[];
  /** Original checks for the fresh task. They must fail on the starter and pass on the worked solution. */
  checks: CodeTest[];
  /** A complete reference answer, used only by the validator. */
  workedSolution: WorkspaceFiles;
};

export type LessonScript = {
  /** Must equal a real Lesson.id in the first course listed in courseIds. */
  lessonId: string;
  courseIds: CourseId[];
  /** Per-course lesson ids when a course names the same concept differently. */
  courseLessonIds?: Partial<Record<CourseId, string>>;
  /** Lessons in other courses that teach the same concept and should use this script. */
  companionLessonIds?: Partial<Record<CourseId, string[]>>;
  concept: string;
  make: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
  projectStep: string;
  stages: Record<LessonStageId, StageSpec>;
  mastery: MasterySpec;
};

export const lessonScripts: LessonScript[] = [
  {
    lessonId: "ages-13-15-structure-headings",
    courseIds: ["ages-13-15", "ages-16-18", "adults"],
    courseLessonIds: { "ages-16-18": "ages-16-18-structure-headings", adults: "adults-structure-headings" },
    companionLessonIds: { "ages-10-12": ["html-foundations-text"] },
    concept: "A heading level states how important a piece of text is, and the levels must form one outline.",
    make: "The learner turns their page's plain lines into a real heading outline.",
    difficulty: 1,
    prerequisites: [],
    projectStep: "The website name becomes the page heading and the three project items become its sections.",
    stages: {
      hook: {
        lead: "Two pages, one set of words. One reads as three flat paragraphs. The other has one big title and two section titles. Which could you understand in five seconds, and what changed?",
        variants: {
          guided: "Look at two pages with the same words. One has a big title and section titles. Which one is easier to read?",
          balanced: "A page with a clear outline is easier to design and easier to read. The words did not change, only the job each line was given.",
          independent: "Headings are the document outline. Assistive technology and search engines rely on it, so a broken outline is a real defect.",
        },
      },
      model: {
        lead: "Start with <h1>Study Planner</h1>. Under it, <h2>This week</h2>. Inside that section, <h3>Mathematics</h3>. The page is the h1, the week is a section, the subject is a topic inside it.",
        variants: {
          guided: "Use <h1>Study Planner</h1> for the page name. Use <h2>This week</h2> for a section. Use <h3>Mathematics</h3> for a topic inside that section.",
          independent: "Read the example as an outline: one h1 names the document, two h2 headings divide it, and one h3 sits inside the second division.",
        },
      },
      build: {
        lead: "Work in the HTML file. Give the page one h1 and turn the plain section lines into h2 headings. Put the topic line inside the second section as an h3.",
        variants: {
          guided: "Change one line at a time. Start with the page name and the h1, then add the section headings.",
        },
      },
      check: {
        lead: "Read only your headings in order. If that short outline explains the page, the hierarchy works.",
        variants: {
          guided: "Read the headings aloud in order. Does the page name come first, then the sections, then the topic?",
          independent: "Check the outline mechanically: no skipped level, no second h1, and the h3 nested inside the correct section.",
        },
      },
      explain: {
        lead: "Now mark up a three-part lost-and-found notice with no example open: a title, a section for where to look, and a sub-section for what to do if you find an item.",
        variants: {
          guided: "The fresh task has three parts. Use one heading for the notice title, one for where to look, and one smaller heading for what to do next.",
          independent: "The fresh task must work without the example. Choose the levels yourself and keep the outline logical.",
        },
      },
      transfer: {
        lead: "These headings become the sections of your own website. The next lesson adds links that point at them.",
        variants: {
          independent: "Keep the outline as the page's structure. Navigation in the next lesson will target these headings.",
        },
      },
    },
    mastery: {
      freshTask: "A community notice board needs a lost-and-found notice. Write the page so it has a title, a section called Where to look and a sub-section called If you find an item.",
      observable: "Reading only the headings in order tells the whole story of the notice.",
      reflection: "In your own words, what did the h1 do that the h2 headings could not do?",
      starterFiles: {
        html: "<main>\n  <p>Lost and found</p>\n  <p>Where to look</p>\n  <p>If you find an item</p>\n</main>",
        css: "",
        javascript: "",
      },
      editableFiles: ["html"],
      checks: [
        { file: "html", label: "The notice has a page title", pattern: "<h1[\\s>][\\s\\S]*</h1>" },
        { file: "html", label: "The notice has a section heading", pattern: "<h2[\\s>][\\s\\S]*</h2>" },
        { file: "html", label: "The notice has a sub-section heading", pattern: "<h3[\\s>][\\s\\S]*</h3>" },
      ],
      workedSolution: {
        html: "<main>\n  <h1>Lost and found</h1>\n  <h2>Where to look</h2>\n  <h3>If you find an item</h3>\n</main>",
        css: "",
        javascript: "",
      },
    },
  },
  {
    lessonId: "ages-13-15-responsive-flex",
    courseIds: ["ages-13-15", "ages-16-18", "adults"],
    courseLessonIds: { "ages-16-18": "ages-16-18-responsive-flex", adults: "adults-responsive-flex" },
    companionLessonIds: { "ages-10-12": ["css-layout-flex"] },
    concept: "Flexbox is a decision made on the parent element that arranges its children along one direction.",
    make: "The learner turns the row of navigation links on their own website into a wrapping, evenly spaced flex row.",
    difficulty: 3,
    prerequisites: ["ages-13-15-structure-headings", "ages-13-15-structure-links"],
    projectStep: "The project's navigation stops being a run of links on one line and becomes a flex row that wraps on a narrow screen.",
    stages: {
      hook: {
        lead: "Three navigation links sit cramped against the left edge with no space between them. In a narrow preview the same three links push off the right side. What single change could fix spacing and wrapping together?",
        variants: {
          guided: "The links have no space and they push off the screen on a phone. One change to their parent can fix both.",
          balanced: "A row of links that wraps is the difference between a usable page and one that scrolls sideways on a phone.",
          independent: "Given a row that overflows at 320px, name the property that fixes it and the one that only appears to.",
        },
      },
      model: {
        lead: "nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }. The parent becomes a flex container, children may move to a new line, a fixed space sits between them, and they line up on the cross axis.",
        variants: {
          guided: "Start with nav { display: flex; }. Then add gap: 1rem. Wrapping and alignment can come after the row works.",
          independent: "Read each declaration as a decision: direction, wrapping, spacing, cross-axis alignment. Which one changes only when the row overflows?",
        },
      },
      build: {
        lead: "Work in the CSS file only. Add one declaration at a time and run the preview after each change. Style the parent, not each link.",
        variants: {
          guided: "Add display: flex first. Run the preview. Then add gap. Run it again.",
          independent: "Decide the parent selector first. A rule on each link will not create the row.",
        },
      },
      check: {
        lead: "Compare each change with your prediction: did the space appear between the links, and did they wrap when the preview narrowed?",
        variants: {
          guided: "Check two things: the links have space, and the row wraps when the preview is narrow.",
          independent: "The automatic checks cannot see the axis behaviour. Verify wrapping yourself by narrowing the preview.",
        },
      },
      explain: {
        lead: "Now arrange a row of three tag buttons on a recipe page: spaced apart, allowed to wrap, and lined up in the middle of the row. No example open.",
        variants: {
          guided: "Use the same four declarations on the tag row. Put them on the row container.",
          independent: "The fresh task uses a different selector and the same decisions. Diagnose which element owns the layout.",
        },
      },
      transfer: {
        lead: "The layout rules for the project's navigation row are the same rules you will reuse for the card row in the next module.",
        variants: {
          independent: "The next module reuses this pattern. Keep the selector and declarations in a form you can copy deliberately.",
        },
      },
    },
    mastery: {
      freshTask: "A recipe page has three tag buttons in a row. Arrange them so they are spaced apart, can wrap onto a second line, and sit in the middle of the row.",
      observable: "Narrowing the preview moves the third button onto a second line, and widening it puts all three back in one centred row.",
      reflection: "Which element received display: flex, and why would putting it on each link instead not work?",
      starterFiles: {
        html: "<div class=\"tags\">\n  <button>Vegetarian</button>\n  <button>Quick</button>\n  <button>One pot</button>\n</div>",
        css: "/* Arrange the tag row */\n",
        javascript: "",
      },
      editableFiles: ["css"],
      checks: [
        { file: "css", label: "The tag row is a flex container", pattern: "\\.tags\\s*\\{[\\s\\S]*display\\s*:\\s*flex" },
        { file: "css", label: "The tag row may wrap", pattern: "flex-wrap\\s*:\\s*wrap" },
        { file: "css", label: "The tags have space between them", pattern: "gap\\s*:" },
        { file: "css", label: "The tags are centred on the cross axis", pattern: "align-items\\s*:\\s*center" },
      ],
      workedSolution: {
        html: "<div class=\"tags\">\n  <button>Vegetarian</button>\n  <button>Quick</button>\n  <button>One pot</button>\n</div>",
        css: ".tags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n  align-items: center;\n}\n",
        javascript: "",
      },
    },
  },
  {
    lessonId: "javascript-logic-loops",
    courseIds: ["ages-10-12"],
    companionLessonIds: {
      "ages-13-15": ["ages-13-15-data-foreach", "ages-13-15-data-render"],
      adults: ["adults-data-foreach", "adults-data-render"],
      "ages-16-18": ["ages-16-18-data-create"],
    },
    concept: "A loop runs the same instruction once for every item in an array, and the callback parameter is the current item during that one run.",
    make: "The learner turns a hand-typed list into a list the page builds from data.",
    difficulty: 4,
    prerequisites: ["javascript-logic-arrays"],
    projectStep: "The project's topic list stops being typed markup and becomes list items created from the topics array, so adding a fourth topic needs no HTML edit.",
    stages: {
      hook: {
        lead: "One list item is typed three times. Add a fourth topic to the array and run it: the page still shows three. The page is not broken. The instruction only ever ran once.",
        variants: {
          guided: "The page shows three skills. You added a fourth skill, but the page still shows three. Why did the new one not appear?",
          balanced: "The page is built by hand right now. A fourth topic added to the array changes nothing, because the instruction ran only once.",
          independent: "The page renders three items from a hand-typed list. Adding a fourth array value changes nothing. Name the structural cause before writing code.",
        },
      },
      model: {
        lead: "const list = document.querySelector(\"#skill-list\"); skills.forEach(function (skill) { const item = document.createElement(\"li\"); item.textContent = skill; list.append(item); });. The container is selected once. The loop runs once per skill. Each run creates an li, gives it the current skill as text and appends it.",
        variants: {
          guided: "Read the loop in order: find the list, run forEach on skills, create an li, put skill inside it, append it to the list.",
          independent: "Separate the loop from the work: the loop repeats the callback, the callback creates one element per item. Placing const item outside the loop changes the behaviour.",
        },
      },
      build: {
        lead: "Work in the JavaScript file only. Select the list once, then write the loop for three of your own topics. Run after each instruction.",
        variants: {
          guided: "Start with the forEach line. Add the createElement line inside the loop. Then set the text and append.",
        },
      },
      check: {
        lead: "Requirements run, then change the array from three items to four and predict what the page will show before running it.",
        variants: {
          guided: "Add a fourth topic to the array. Before you run it, say how many list items you expect.",
          independent: "The checks cannot see placement. Move const item outside the loop and explain what you expect to change.",
        },
      },
      explain: {
        lead: "Now render a different collection into a different list, with an empty-state message, and no example open.",
        variants: {
          guided: "Use a fresh array of meeting times. When the array is empty, show a message instead of a blank space.",
          independent: "The fresh task has two states: values present and array empty. Both must be handled without an HTML edit.",
        },
      },
      transfer: {
        lead: "The list is generated from data, so the next project checkpoint can filter it without retyping markup.",
        variants: {
          independent: "Data-driven rendering is the prerequisite for filtering. Keep the collection separate from the display code.",
        },
      },
    },
    mastery: {
      freshTask: "A club page needs a list of meeting times built from an array of four times, plus a message that says No meetings yet when the array is empty.",
      observable: "Changing the array changes the page with no HTML edit. Emptying the array shows the empty-state message instead of a blank space.",
      reflection: "In your own words, what did the loop variable represent during one run, and what happened when the array became empty?",
      starterFiles: {
        html: "<ul id=\"meeting-list\"></ul>\n<p id=\"empty-state\"></p>",
        css: "",
        javascript: "const times = [\"Monday 4pm\", \"Wednesday 5pm\", \"Friday 3pm\"];\nconst list = document.querySelector(\"#meeting-list\");\nconst emptyState = document.querySelector(\"#empty-state\");\n// Render the times\n",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The times are looped with forEach", pattern: "times\\.forEach\\s*\\(" },
        { file: "javascript", label: "Each time creates a list item", pattern: "createElement\\(\\s*[\"']li[\"']" },
        { file: "javascript", label: "The item shows the current time", pattern: "textContent\\s*=\\s*time" },
        { file: "javascript", label: "The item is appended to the list", pattern: "list\\.append" },
        { file: "javascript", label: "An empty array shows a message", pattern: "emptyState\\.textContent" },
      ],
      workedSolution: {
        html: "<ul id=\"meeting-list\"></ul>\n<p id=\"empty-state\"></p>",
        css: "",
        javascript: "const times = [\"Monday 4pm\", \"Wednesday 5pm\", \"Friday 3pm\"];\nconst list = document.querySelector(\"#meeting-list\");\nconst emptyState = document.querySelector(\"#empty-state\");\nif (times.length === 0) {\n  emptyState.textContent = \"No meetings yet\";\n} else {\n  times.forEach(function (time) {\n    const item = document.createElement(\"li\");\n    item.textContent = time;\n    list.append(item);\n  });\n}\n",
      },
    },
  },
];

/** Return the script for a lesson in a course, including companion mappings. */
export function lessonIdForCourse(script: LessonScript, courseId: CourseId): string {
  return script.courseLessonIds?.[courseId] || script.lessonId;
}

export function scriptFor(courseId: CourseId, lessonId: string): LessonScript | null {
  for (const script of lessonScripts) {
    if (script.courseIds.includes(courseId) && lessonIdForCourse(script, courseId) === lessonId) return script;
    const companions = script.companionLessonIds?.[courseId];
    if (companions?.includes(lessonId)) return script;
  }
  return null;
}

/** The default support level for each register. A learner may override it per lesson. */
export function guidanceForCourse(courseId: CourseId): GuidanceMode {
  if (courseId === "ages-10-12") return "guided";
  if (courseId === "ages-16-18") return "independent";
  return "balanced";
}

export function stageLead(script: LessonScript, stage: LessonStageId, mode: GuidanceMode): string {
  return script.stages[stage].variants?.[mode] || script.stages[stage].lead;
}

/** Contract check used by scripts/validate-lesson-scripts.mjs. */
export function lessonScriptIssues(): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const script of lessonScripts) {
    if (seen.has(script.lessonId)) issues.push(`${script.lessonId}: duplicate primary lesson id.`);
    seen.add(script.lessonId);
    if (!script.concept.trim()) issues.push(`${script.lessonId}: concept is empty.`);
    if (!script.make.trim()) issues.push(`${script.lessonId}: make is empty.`);
    if (!script.projectStep.trim()) issues.push(`${script.lessonId}: projectStep is empty.`);
    if (!Number.isInteger(script.difficulty) || script.difficulty < 1 || script.difficulty > 5) {
      issues.push(`${script.lessonId}: difficulty must be 1 to 5.`);
    }
    for (const stage of lessonStageIds) {
      const spec = script.stages[stage];
      if (!spec || !spec.lead.trim()) issues.push(`${script.lessonId}: stage ${stage} needs a lead line.`);
      for (const [mode, text] of Object.entries(spec?.variants || {})) {
        if (!guidanceModes.includes(mode as GuidanceMode)) issues.push(`${script.lessonId}: unknown guidance mode ${mode}.`);
        if (!text.trim()) issues.push(`${script.lessonId}: empty ${mode} variant in ${stage}.`);
      }
    }
    const mastery = script.mastery;
    if (!mastery.freshTask.trim() || !mastery.observable.trim() || !mastery.reflection.trim()) {
      issues.push(`${script.lessonId}: the mastery gate needs a task, an observable result and a reflection.`);
    }
    if (mastery.checks.length < 2) issues.push(`${script.lessonId}: the fresh task needs at least two checks.`);
    for (const check of mastery.checks) {
      if (!mastery.editableFiles.includes(check.file)) {
        issues.push(`${script.lessonId}: fresh task checks ${check.file}, which is not editable.`);
      }
      if (!(check.file in mastery.starterFiles) || !(check.file in mastery.workedSolution)) {
        issues.push(`${script.lessonId}: fresh task check ${check.label} points at a missing file.`);
      }
      try {
        const expression = new RegExp(check.pattern, "i");
        if (!expression.test(mastery.workedSolution[check.file])) {
          issues.push(`${script.lessonId}: fresh task check does not pass on the worked solution: ${check.label}`);
        }
        if (expression.test(mastery.starterFiles[check.file])) {
          issues.push(`${script.lessonId}: fresh task check already passes on the starter: ${check.label}`);
        }
      } catch {
        issues.push(`${script.lessonId}: fresh task check has an invalid pattern: ${check.label}`);
      }
    }
  }
  if (lessonScripts.length < 3) issues.push("at least three sample lesson scripts are required.");
  return issues;
}
