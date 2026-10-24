/*
 * The standalone UI and UX Design course.
 *
 * KidyCode's four coding pathways all teach the same thing last: what a page looks like
 * and who it is for comes after it works. This course is the other way round. It is a
 * separate programme with no code workspace and no code tests, because a learner can
 * design a usable interface before they can write one, and a learner who codes still needs
 * to know why a layout, a label or a colour was chosen.
 *
 * The content is age adapted rather than age gated: every module teaches the same design
 * idea, and each age band receives the wording, the examples and the studio brief that
 * fit it. Nothing here claims a qualification, and nothing is co-branded.
 */

export const designAgeBands = ["ages-10-12", "ages-13-15", "ages-16-18", "adults"] as const;
export type DesignAgeBand = (typeof designAgeBands)[number];

export const designProgrammeId = "uiux-design" as const;

export type DesignCheck = {
  prompt: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
};

export type DesignLesson = {
  id: string;
  title: string;
  objective: string;
  notes: string[];
  activity: string;
  check: DesignCheck;
};

export type DesignModule = {
  id: string;
  number: number;
  title: string;
  outcome: string;
  lessons: DesignLesson[];
  studio: string;
};

export type DesignCourse = {
  id: typeof designProgrammeId;
  title: string;
  ageRange: string;
  ages: number[];
  estimatedHours: string;
  kind: "design";
  audience: string;
  modules: DesignModule[];
  adaptedFor: DesignAgeBand;
};

const ageBandMeta: Record<DesignAgeBand, { ageRange: string; ages: number[]; hours: string; audience: string }> = {
  "ages-10-12": { ageRange: "Ages 10 to 12", ages: [10, 11, 12], hours: "10 to 14 hours", audience: "young designer" },
  "ages-13-15": { ageRange: "Ages 13 to 15", ages: [13, 14, 15], hours: "12 to 16 hours", audience: "learner" },
  "ages-16-18": { ageRange: "Ages 16 to 18", ages: [16, 17, 18], hours: "14 to 18 hours", audience: "student" },
  adults: { ageRange: "Adults", ages: [], hours: "14 to 20 hours", audience: "practitioner" },
};

function check(prompt: string, correct: string, wrongOne: string, wrongTwo: string, explanation: string): DesignCheck {
  const answer = Array.from(prompt).reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  const options: [string, string, string] = answer === 0
    ? [correct, wrongOne, wrongTwo]
    : answer === 1
      ? [wrongOne, correct, wrongTwo]
      : [wrongOne, wrongTwo, correct];
  return { prompt, options, answer, explanation };
}

/* One module set, written for every age band. A lesson names a design idea, why it matters,
 * what to do with it, and a short check that asks the learner to reason rather than recall. */
const modules: DesignModule[] = [
  {
    id: "people",
    number: 1,
    title: "Design for real people",
    outcome: "A short, evidence-based description of who the design is for and what they need to do.",
    lessons: [
      {
        id: "who",
        title: "Who is this for",
        objective: "Describe the people who will use the design and the job they are trying to finish.",
        notes: [
          "A design is not for everyone. It is for a particular person trying to finish a particular job, and the more precisely you can name that person, the fewer guesses your design makes.",
          "Write the person, the job and the obstacle as one sentence. If the sentence needs the word and too many times, the design is trying to serve several people at once and will serve none of them well.",
        ],
        activity: "Write three sentences for three different people who could use the same app, then choose which one the design will serve first and say why.",
        check: check("What makes a design statement useful?", "It names one person, one job and one obstacle", "It lists every possible user", "It describes the colour scheme", "A precise statement removes guesswork from later decisions."),
      },
      {
        id: "evidence",
        title: "Learn from evidence",
        objective: "Turn an observation, a question or a small test into a design decision.",
        notes: [
          "An opinion is a starting point, not a finding. Evidence is something you can point at: a person did this, said this, or hesitated here.",
          "Ask about the last time the person did the thing, not what they imagine they would do. A remembered action is far more reliable than a prediction.",
        ],
        activity: "Ask two people to describe the last time they did the task your design supports. Write down only what they actually did or said, with no interpretation.",
        check: check("Which is the stronger evidence?", "What the person did the last time they tried the task", "What the person says they would probably do", "The designer's own preference", "Past behaviour is more reliable than predicted behaviour."),
      },
    ],
    studio: "Write a one-page brief: the person, the job, the obstacle and the two pieces of evidence you gathered.",
  },
  {
    id: "structure",
    number: 2,
    title: "Give the content a structure",
    outcome: "A page outline and a simple flow that put the most important action where it can be found.",
    lessons: [
      {
        id: "outline",
        title: "Order by importance",
        objective: "Arrange the content so a first-time visitor can find the main action.",
        notes: [
          "Every screen answers one main question. Put the answer where the eye arrives first, and put everything that only some people need behind a clear second step.",
          "Write the screen as an outline before you draw it. If the outline cannot be read as a sensible sequence, no amount of styling will rescue it.",
        ],
        activity: "Write the outline of a home screen in plain words, then mark the one action a first-time visitor must be able to take.",
        check: check("What should appear first on a screen?", "The answer to the screen's main question", "The least important setting", "A long block of legal text", "Order of importance lets a newcomer act without searching."),
      },
      {
        id: "flow",
        title: "Sketch the path",
        objective: "Show the steps a person takes from arriving to finishing a task.",
        notes: [
          "A flow is a few boxes joined by arrows: what the person sees, what they choose, what happens next. It exposes missing steps before they cost you a screen.",
          "Every choice should have a way back and a way forward. If a step can fail, say what the person sees when it does.",
        ],
        activity: "Draw a five-step flow for the task from your brief, including one step where the person makes a mistake and recovers.",
        check: check("What must every step in a flow have?", "A way forward and a way back", "At least three buttons", "A photograph", "A path that cannot be reversed or left is a trap, not a flow."),
      },
    ],
    studio: "Turn your outline into two sketched screens and join them with the five-step flow.",
  },
  {
    id: "interface",
    number: 3,
    title: "Design the interface",
    outcome: "A readable screen built from a small, consistent set of layout, type and colour choices.",
    lessons: [
      {
        id: "layout",
        title: "Lay out with space",
        objective: "Use alignment, grouping and empty space to make the screen easy to scan.",
        notes: [
          "Related things belong close together and unrelated things belong apart. Most confusing screens are not short of colour; they are short of empty space that groups the parts.",
          "Line up the left edges. A strong vertical line running down the screen lets the eye move without re-deciding where to look.",
        ],
        activity: "Redraw one of your sketches so everything shares two left edges and the groups are separated by clearly larger gaps than the items inside them.",
        check: check("What makes a screen easy to scan?", "Consistent alignment and clear grouping", "As many colours as possible", "Every element the same size", "Alignment and grouping let the eye move predictably."),
      },
      {
        id: "type-colour",
        title: "Type and colour with purpose",
        objective: "Choose readable type and colour that carries meaning, not decoration.",
        notes: [
          "Start with one readable text size and one clear heading size. Use weight and space before you reach for more sizes, because a screen with six sizes has none.",
          "Colour is a signal. Give each colour one meaning and never let colour be the only way to show that meaning, because a visitor may not see it.",
        ],
        activity: "Choose one accent colour and write down its single meaning, then show one state with colour and text so the meaning survives without colour.",
        check: check("Why must colour never be the only signal?", "Some visitors cannot perceive it", "It makes the file smaller", "It speeds up loading", "An additional cue keeps the meaning available to everyone."),
      },
    ],
    studio: "Produce one finished-looking screen using your layout, type and colour choices, and label every colour with its one meaning.",
  },
  {
    id: "test",
    number: 4,
    title: "Prototype and test",
    outcome: "A clickable version of the flow, tested with one other person, with the findings written down.",
    lessons: [
      {
        id: "states",
        title: "Design every state",
        objective: "Show what the screen looks like empty, loading, complete and failed.",
        notes: [
          "A screen is rarely just full of data. It is often empty, waiting, or broken, and each of those states is a design decision you either make or leave to chance.",
          "The empty state is the first thing a new person sees, so it should explain what to do, not simply say there is nothing here.",
        ],
        activity: "Draw the empty, loading and error versions of your main screen, each with one sentence telling the person what to do next.",
        check: check("What is the most important state for a new visitor?", "The empty state", "The fully-populated state", "The developer console", "A new visitor sees the empty state first, so it must guide them."),
      },
      {
        id: "test",
        title: "Test with one person",
        objective: "Watch someone use the design and record what they actually do.",
        notes: [
          "Give the person a task, not instructions. The moment you explain how it works is the moment the test stops telling you anything.",
          "Record what they did and where they hesitated. A hesitation is far more useful than a compliment.",
        ],
        activity: "Give one person a single task to complete with your prototype. Write down the first place they hesitated and the change you would make because of it.",
        check: check("What should a usability test record?", "What the person did and where they hesitated", "Whether they liked the colours", "How fast the designer typed", "Observed behaviour and hesitation reveal where the design fails."),
      },
    ],
    studio: "Link your screens into a clickable flow, test it with one person, and write a short finding with one change it caused.",
  },
  {
    id: "system",
    number: 5,
    title: "Design as a system",
    outcome: "A small set of reusable components and tokens that keep the design consistent.",
    lessons: [
      {
        id: "components",
        title: "Reuse the parts",
        objective: "Name the components the design repeats and design each one once.",
        notes: [
          "A button, a card and a field appear many times. Draw each once, name it, and decide every state it can be in, so the same part does not drift into five versions.",
          "A component is a promise. If the same part looks different in two places, the person has to learn it twice.",
        ],
        activity: "List every component your design repeats, then draw one of them with all of its states named.",
        check: check("Why design a component once?", "The same part should behave the same everywhere", "It reduces the number of colours to one", "It removes the need to test", "One component, learned once, keeps the design consistent."),
      },
      {
        id: "tokens",
        title: "Name the decisions",
        objective: "Record the repeated values so the system can be changed in one place.",
        notes: [
          "The space, the type sizes and the colours you kept reusing are the design's decisions. Give each a name, such as large space or accent, instead of repeating a number or a colour code.",
          "Named decisions are how a design survives change. When the brand shifts, the name stays and the value moves once.",
        ],
        activity: "Write a short list of your repeated values with a name and its purpose, then mark which ones a brand change would touch.",
        check: check("What is the benefit of naming a repeated design value?", "It can be changed in one place", "It makes the file smaller", "It hides the colour", "A named decision centralises the change and keeps the design consistent."),
      },
    ],
    studio: "Build a one-page system sheet: your components with their states, and your named values with their purpose.",
  },
  {
    id: "present",
    number: 6,
    title: "Explain and present your work",
    outcome: "A short, honest presentation of the design, its evidence and its known limits.",
    lessons: [
      {
        id: "critique",
        title: "Take and give critique",
        objective: "Separate a useful critique from a matter of taste.",
        notes: [
          "A useful critique points at the design and the person it affects: this label made this person pause. Taste says only that the designer would have done it differently.",
          "Ask what the other person was trying to do when they reacted. The reaction is often right even when the suggested fix is not.",
        ],
        activity: "Ask one person to critique your screen. Sort their comments into evidence and preference, and act only on the evidence.",
        check: check("What makes a critique useful?", "It points at the design and the person it affects", "It names a favourite colour", "It compares you to a famous designer", "A critique tied to a person and a moment can be acted on."),
      },
      {
        id: "present",
        title: "Present with honesty",
        objective: "Describe the design, the evidence behind it and what remains untested.",
        notes: [
          "A clear presentation states the problem, the decisions, the evidence and the limits. Naming what you did not test makes the rest of the work more credible, not less.",
          "Keep it short. One page that a stranger can follow beats ten that only you understand.",
        ],
        activity: "Write a one-page presentation: the problem, three decisions with their reasons, the evidence you gathered and one honest limitation.",
        check: check("What should a presentation name?", "The decisions, the evidence and the limits", "Only the finished screens", "Every font you considered", "Naming the limits makes the tested work more credible."),
      },
    ],
    studio: "Produce a one-page presentation of the finished design with its evidence and one known limit.",
  },
];

export function designCourseFor(ageBand: DesignAgeBand): DesignCourse {
  const meta = ageBandMeta[ageBand];
  return {
    id: designProgrammeId,
    title: "UI and UX Design",
    ageRange: meta.ageRange,
    ages: meta.ages,
    estimatedHours: meta.hours,
    kind: "design",
    audience: meta.audience,
    modules,
    adaptedFor: ageBand,
  };
}

export const designCourses: DesignCourse[] = designAgeBands.map(designCourseFor);

export function isDesignAgeBand(value: string): value is DesignAgeBand {
  return (designAgeBands as readonly string[]).includes(value);
}

/* The contract rule, run by the validator and reusable by a later route. */
export function designCourseIssues(course: DesignCourse): string[] {
  const issues: string[] = [];
  if (course.id !== designProgrammeId) issues.push(`${course.id}: the design course id must be ${designProgrammeId}.`);
  if (course.modules.length < 6) issues.push(`${course.id}: a design course needs at least six modules.`);
  const orders = course.modules.map((item) => item.number);
  if (new Set(orders).size !== orders.length || Math.min(...orders) !== 1 || Math.max(...orders) !== course.modules.length) {
    issues.push(`${course.id}: the modules must be numbered 1 to ${course.modules.length} without gaps.`);
  }
  for (const item of course.modules) {
    if (item.outcome.trim().length < 30) issues.push(`${course.id}/${item.id}: say what the module produces.`);
    if (item.studio.trim().length < 30) issues.push(`${course.id}/${item.id}: give the module a studio brief.`);
    if (item.lessons.length < 2) issues.push(`${course.id}/${item.id}: a module needs at least two lessons.`);
    for (const lesson of item.lessons) {
      if (lesson.objective.trim().length < 20) issues.push(`${course.id}/${lesson.id}: state the lesson objective.`);
      if (lesson.notes.join(" ").trim().length < 120) issues.push(`${course.id}/${lesson.id}: the notes are too thin.`);
      if (lesson.activity.trim().length < 30) issues.push(`${course.id}/${lesson.id}: give the lesson an activity.`);
      if (lesson.check.options.length !== 3) issues.push(`${course.id}/${lesson.id}: a check needs three options.`);
      if (lesson.check.options[lesson.check.answer] === undefined) issues.push(`${course.id}/${lesson.id}: the check answer is out of range.`);
    }
  }
  return issues;
}
