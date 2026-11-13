import type { CourseId } from "@/lib/course";

/*
 * Transfer projects: the Day 1 contracts.
 *
 * A learner finishes a guided pathway by building one website from a fixed brief. A
 * transfer project is a different problem in a different setting, so finishing it is
 * evidence that the learner can move a skill to somewhere the lesson never described.
 *
 * One bank per pathway. Each bank holds two projects and four scaffold levels. A
 * contract is only complete when every level names the support it gives and which
 * transfer evidence it requires, and when the four evidence kinds appear across the
 * levels: an independent start, a written plan, a record of working behaviour, and a
 * requirement that changes after work has already begun.
 *
 * This module is data and rules only. It holds no learner content, no marks and no
 * personal detail, so a reviewer can read a contract without seeing a learner.
 */

export const scaffoldLevelIds = ["modelled", "prompted", "goal-only", "changed-brief"] as const;
export type ScaffoldLevelId = (typeof scaffoldLevelIds)[number];

export const transferEvidenceKinds = ["independent-start", "planning", "working-behaviour", "changed-requirement"] as const;
export type TransferEvidenceKind = (typeof transferEvidenceKinds)[number];

export type TransferScaffoldLevel = {
  id: ScaffoldLevelId;
  order: number;
  title: string;
  /* What the learner is handed before they begin. */
  learnerSupport: string;
  /* What the grown-up does, and what they must not do instead. */
  adultSupport: string;
  /* What the learner must produce without being told the answer. */
  proves: string;
  /* The evidence the level requires. */
  evidence: TransferEvidenceKind[];
};

export type TransferProject = {
  id: string;
  title: string;
  /* The transferred problem, in the learner's own setting. */
  problem: string;
  /* How it differs from the guided project the learner already finished. */
  difference: string;
  settings: string[];
  skills: string[];
  deliverable: string;
};

export type TransferProjectBank = {
  id: string;
  courseId: CourseId;
  pathwayTitle: string;
  ageRange: string;
  projects: TransferProject[];
  scaffolds: TransferScaffoldLevel[];
  evidence: Record<TransferEvidenceKind, string>;
};

const youngScaffolds: TransferScaffoldLevel[] = [
  {
    id: "modelled",
    order: 1,
    title: "Watch it once",
    learnerSupport: "A finished example of the new page, opened in the editor, with every part named out loud before anything is typed.",
    adultSupport: "Point at one part, name its job and stop. Do not type for the learner.",
    proves: "The learner can name what each part of a working page is for.",
    evidence: ["planning"],
  },
  {
    id: "prompted",
    order: 2,
    title: "Steps, not answers",
    learnerSupport: "A short checklist of the parts the page needs, with no code and no finished text.",
    adultSupport: "Read the checklist with the learner and answer questions about meaning, then leave the room while the learner works.",
    proves: "The learner builds the page in their own words and finds the first broken part themselves.",
    evidence: ["planning", "working-behaviour"],
  },
  {
    id: "goal-only",
    order: 3,
    title: "One sentence goal",
    learnerSupport: "Only the sentence describing what the page must do for a visitor.",
    adultSupport: "Do not restate the goal or suggest a tag. Note what the learner does first, unaided.",
    proves: "The learner starts from the goal alone and decides where to begin.",
    evidence: ["independent-start", "working-behaviour"],
  },
  {
    id: "changed-brief",
    order: 4,
    title: "The brief changes",
    learnerSupport: "The goal sentence, and then one change to it after the learner has already built and tested something.",
    adultSupport: "Deliver the change in the learner's own words, then let the learner decide which part must move.",
    proves: "The learner keeps what works, changes only what the new brief needs and says what they changed.",
    evidence: ["independent-start", "working-behaviour", "changed-requirement"],
  },
];

const teenScaffolds: TransferScaffoldLevel[] = [
  {
    id: "modelled",
    order: 1,
    title: "Worked walkthrough",
    learnerSupport: "A complete worked version of the new page with a short commentary on the three decisions that shape it.",
    adultSupport: "Explain the decisions and their cost. Do not write any of the learner's page.",
    proves: "The learner can explain why each decision was made, not only repeat the code.",
    evidence: ["planning"],
  },
  {
    id: "prompted",
    order: 2,
    title: "Requirements list",
    learnerSupport: "The requirements as a list of outcomes a visitor would notice, with no code and no file names.",
    adultSupport: "Agree the order of work, then review only after the learner has run the page.",
    proves: "The learner turns outcomes into structure and behaviour and tests each one.",
    evidence: ["planning", "working-behaviour"],
  },
  {
    id: "goal-only",
    order: 3,
    title: "Problem statement",
    learnerSupport: "Only the statement of the problem and who it is for.",
    adultSupport: "Give no plan and no starter files. Record the first thing the learner does.",
    proves: "The learner plans and starts independently, then asks a specific question if stuck.",
    evidence: ["independent-start", "planning", "working-behaviour"],
  },
  {
    id: "changed-brief",
    order: 4,
    title: "Changed requirement",
    learnerSupport: "The problem statement, then one requirement that changes after a working first version exists.",
    adultSupport: "State the change once and let the learner decide what to rework and what to keep.",
    proves: "The learner adapts a working page, keeps it working and explains the change.",
    evidence: ["independent-start", "working-behaviour", "changed-requirement"],
  },
];

const advancedScaffolds: TransferScaffoldLevel[] = [
  {
    id: "modelled",
    order: 1,
    title: "Architecture walkthrough",
    learnerSupport: "A working version of the new problem with the data shape, the states and the failure path explained.",
    adultSupport: "Discuss the trade-offs and the parts most likely to break. Do not supply the learner's implementation.",
    proves: "The learner can describe the data shape and the states before building.",
    evidence: ["planning"],
  },
  {
    id: "prompted",
    order: 2,
    title: "Acceptance list",
    learnerSupport: "Acceptance criteria as observable behaviours, including one empty case and one failure case.",
    adultSupport: "Review behaviour only after the learner has run it, and ask which case is untested.",
    proves: "The learner builds to observable criteria and covers the empty and failure cases.",
    evidence: ["planning", "working-behaviour"],
  },
  {
    id: "goal-only",
    order: 3,
    title: "Product goal",
    learnerSupport: "Only the product goal and its users.",
    adultSupport: "Answer questions about the setting, never about the implementation. Note the first unassisted step.",
    proves: "The learner chooses the data shape, the states and the order of work alone.",
    evidence: ["independent-start", "planning", "working-behaviour"],
  },
  {
    id: "changed-brief",
    order: 4,
    title: "Scope change",
    learnerSupport: "The product goal, then one scope change delivered after the first working version is demonstrated.",
    adultSupport: "Deliver the change once, then review the learner's judgement about what to rework.",
    proves: "The learner reworks a working application under a new requirement and keeps it releasable.",
    evidence: ["independent-start", "working-behaviour", "changed-requirement"],
  },
];

const adultScaffolds: TransferScaffoldLevel[] = [
  {
    id: "modelled",
    order: 1,
    title: "Reference build",
    learnerSupport: "A working reference build for the new problem with the brief, the constraints and the decisions written down.",
    adultSupport: "Answer questions about the constraints of the real setting. Do not write the learner's build.",
    proves: "The learner can restate the brief and the constraints in their own words.",
    evidence: ["planning"],
  },
  {
    id: "prompted",
    order: 2,
    title: "Client brief",
    learnerSupport: "The brief as a client would send it, with the outcome wanted and the limit on scope.",
    adultSupport: "Act as the client for questions about the brief, not about the code.",
    proves: "The learner turns a client brief into requirements and tests each one.",
    evidence: ["planning", "working-behaviour"],
  },
  {
    id: "goal-only",
    order: 3,
    title: "Outcome only",
    learnerSupport: "Only the outcome the client wants and who uses it.",
    adultSupport: "Give no specification. Record how the learner scopes the work before starting.",
    proves: "The learner scopes, plans and starts without a specification.",
    evidence: ["independent-start", "planning", "working-behaviour"],
  },
  {
    id: "changed-brief",
    order: 4,
    title: "Client changes the brief",
    learnerSupport: "The outcome, then one change the client asks for after seeing the first working version.",
    adultSupport: "Deliver the change as the client, and ask the learner what they will not change and why.",
    proves: "The learner handles a real brief change, explains the trade-off and keeps the build working.",
    evidence: ["independent-start", "working-behaviour", "changed-requirement"],
  },
];

export const transferProjectBanks: TransferProjectBank[] = [
  {
    id: "ages-10-12-transfer",
    courseId: "ages-10-12",
    pathwayTitle: "Web Coding Foundations",
    ageRange: "Ages 10 to 12",
    projects: [
      {
        id: "ages-10-12-transfer-garden-rota",
        title: "Garden Watering Rota",
        problem: "Build a page a class can check to find out whose turn it is to water the plants, and which days are still coming.",
        difference: "The guided project presents one topic to a reader. This page is about a job that moves between people, so the list changes each week and someone has to be named.",
        settings: ["A class garden", "A community plot", "A home greenhouse"],
        skills: ["Semantic page regions", "A labelled form", "An ordered list built from data", "Saving one small choice on the device"],
        deliverable: "A page that names today's turn, lists the week's turns in order and lets a visitor add their own name to the list.",
      },
      {
        id: "ages-10-12-transfer-library-shelf",
        title: "Class Library Shelf",
        problem: "Build a page that shows which books are on the class shelf and whether each one is out on loan.",
        difference: "The guided project described a subject. This page tracks the state of real objects, so each item carries a fact that can change and the page must show it honestly.",
        settings: ["A classroom shelf", "A reading club", "A family bookcase"],
        skills: ["Headings and lists", "Describing each item with its own state", "A counted summary", "Reusable card styles"],
        deliverable: "A page that lists every book with its state and shows how many are available.",
      },
    ],
    scaffolds: youngScaffolds,
    evidence: {
      "independent-start": "The learner begins the first page without being told which region or list to write first.",
      planning: "The learner says or writes the parts the page needs and the order they will build them in.",
      "working-behaviour": "The learner runs the page after each change and names the first part that did not behave as expected.",
      "changed-requirement": "After a tested first version, one requirement changes and the learner decides what to keep and what to rebuild.",
    },
  },
  {
    id: "ages-13-15-transfer",
    courseId: "ages-13-15",
    pathwayTitle: "Practical Web Development",
    ageRange: "Ages 13 to 15",
    projects: [
      {
        id: "ages-13-15-transfer-request-desk",
        title: "Library Request Desk",
        problem: "Build a page where a student requests a book and can see whether the request was accepted.",
        difference: "The guided project collected one value and confirmed it. This page keeps a decision about that value, so validation, a stored record and clear feedback all have to work together.",
        settings: ["A school library", "A department office", "A youth centre"],
        skills: ["Accessible form structure", "Validation before accepting input", "Stored records and rendering", "Clear success and error messages"],
        deliverable: "A page that accepts a request, refuses an empty or duplicate one with a clear message and lists the requests made.",
      },
      {
        id: "ages-13-15-transfer-fixture-board",
        title: "Fixture Board",
        problem: "Build a page that shows a season of fixtures and lets a visitor filter them to one team.",
        difference: "The guided project showed every record. This one derives a smaller view from the same data, so the filter and the empty case both need an honest state.",
        settings: ["A sports club", "A school league", "A community tournament"],
        skills: ["Filtering a collection", "Responsive grids", "Empty state messaging", "Keyboard accessible controls"],
        deliverable: "A page that filters fixtures by team and shows a clear message when there are none.",
      },
    ],
    scaffolds: teenScaffolds,
    evidence: {
      "independent-start": "The learner states the first change they will make and makes it without a supplied plan.",
      planning: "The learner writes the outcomes the page must meet and the order they will build them in.",
      "working-behaviour": "The learner tests one requirement at a time and records how a fault was found.",
      "changed-requirement": "After a working version, one requirement changes and the learner keeps the working parts while meeting it.",
    },
  },
  {
    id: "ages-16-18-transfer",
    courseId: "ages-16-18",
    pathwayTitle: "Web Application Development",
    ageRange: "Ages 16 to 18",
    projects: [
      {
        id: "ages-16-18-transfer-revision-plan",
        title: "Revision Plan Workspace",
        problem: "Build an application that plans a week of revision and clearly shows what is done, what is left and what could not be planned.",
        difference: "The guided project managed one list of records. This application holds a state with more than one kind of value, so the derived totals, the empty week and the overfilled week all have to be represented.",
        settings: ["Exam preparation", "A study group", "A mentoring programme"],
        skills: ["One source of application state", "Immutable updates", "Derived totals", "Loading, empty and error states"],
        deliverable: "An application with traceable state changes, a clear plan, an honest empty state and a stated limit.",
      },
      {
        id: "ages-16-18-transfer-shift-signup",
        title: "Volunteer Shift Sign-up",
        problem: "Build an application where volunteers claim shifts and the remaining places stay truthful under repeated action.",
        difference: "The guided project created and removed records. This one has a capacity that must not be exceeded, so a repeated or out-of-order action has to be handled rather than assumed away.",
        settings: ["A community event", "A school open day", "A charity rota"],
        skills: ["Guarded state changes", "Preventing stale results", "Failure feedback", "Accessible forms"],
        deliverable: "An application that refuses an overfull shift, keeps places truthful and explains every refusal.",
      },
    ],
    scaffolds: advancedScaffolds,
    evidence: {
      "independent-start": "The learner chooses the data shape and the first state change without being told either.",
      planning: "The learner writes acceptance criteria, including the empty case and one failure case, before building.",
      "working-behaviour": "The learner records which case failed, the smallest reproduction and the change that resolved it.",
      "changed-requirement": "One scope change arrives after a demonstrated working version and the learner reworks only what it needs.",
    },
  },
  {
    id: "adults-transfer",
    courseId: "adults",
    pathwayTitle: "Web Skills for Work and Business",
    ageRange: "Adults",
    projects: [
      {
        id: "adults-transfer-enquiry-inbox",
        title: "Enquiry Inbox",
        problem: "Build a page that records enquiries for a small service and shows which are still waiting for an answer.",
        difference: "The guided project presented a business. This page supports the daily work behind it, so the queue, the waiting time and the empty inbox are all part of the deliverable.",
        settings: ["A service business", "A freelance practice", "A community organisation"],
        skills: ["Structured records with stable ids", "Derived queue views", "Honest empty and overdue states", "Clear next action"],
        deliverable: "A page that lists enquiries by waiting time, shows an empty state and marks one as answered without losing history.",
      },
      {
        id: "adults-transfer-stock-levels",
        title: "Stock Level Sheet",
        problem: "Build a page that shows current stock for a small shop and flags anything that needs reordering.",
        difference: "The guided project displayed fixed information. This page is a working sheet that a shopkeeper would use daily, so a wrong total or a stale flag is a real cost.",
        settings: ["A retail counter", "A workshop store", "A market stall"],
        skills: ["Numeric input validation", "Totals that cannot drift", "A needs-reorder rule", "Keyboard-first entry"],
        deliverable: "A sheet that accepts stock changes, recomputes totals from one source and flags items below their reorder point.",
      },
    ],
    scaffolds: adultScaffolds,
    evidence: {
      "independent-start": "The learner scopes the build from the outcome alone and starts without a specification.",
      planning: "The learner writes the requirements and the acceptance tests before building.",
      "working-behaviour": "The learner works in small changes with a test after each and records the evidence for a fix.",
      "changed-requirement": "The client changes the brief after a working version and the learner keeps the build working while explaining the trade-off.",
    },
  },
];

/* --------------------------------------------------------------- the contract --- */

export type TransferContractIssue = string;

/*
 * The contract rule, in one place, so a bank cannot be added later without meeting it.
 * The validator runs exactly this function, and a route could run it at start up.
 */
export function transferContractIssues(bank: TransferProjectBank): TransferContractIssue[] {
  const issues: TransferContractIssue[] = [];
  if (bank.id !== `${bank.courseId}-transfer`) issues.push(`${bank.id}: the bank id must be derived from the course id.`);
  if (bank.pathwayTitle.trim().length < 8) issues.push(`${bank.id}: name the pathway the bank belongs to.`);
  if (bank.projects.length < 2) issues.push(`${bank.id}: a bank needs at least two transfer projects.`);

  const projectTitles = new Set<string>();
  for (const project of bank.projects) {
    if (!project.id.startsWith(`${bank.id}-`)) issues.push(`${project.id}: the project id must start with the bank id.`);
    if (projectTitles.has(project.title)) issues.push(`${project.id}: the bank repeats the project title ${project.title}.`);
    projectTitles.add(project.title);
    if (project.problem.trim().length < 40) issues.push(`${project.id}: state the transferred problem in full.`);
    if (project.difference.trim().length < 40) issues.push(`${project.id}: say how this differs from the guided project.`);
    if (project.settings.length < 2) issues.push(`${project.id}: give at least two settings it could be built in.`);
    if (project.skills.length < 3) issues.push(`${project.id}: name at least three skills being transferred.`);
    if (project.deliverable.trim().length < 40) issues.push(`${project.id}: describe what the learner hands in.`);
  }

  if (bank.scaffolds.length !== scaffoldLevelIds.length) {
    issues.push(`${bank.id}: a bank needs exactly ${scaffoldLevelIds.length} scaffold levels.`);
  }
  const orders = bank.scaffolds.map((level) => level.order);
  if (new Set(orders).size !== scaffoldLevelIds.length || Math.min(...orders) !== 1 || Math.max(...orders) !== scaffoldLevelIds.length) {
    issues.push(`${bank.id}: the scaffold levels must be ordered 1 to ${scaffoldLevelIds.length} without gaps.`);
  }
  const ids = new Set(bank.scaffolds.map((level) => level.id));
  for (const id of scaffoldLevelIds) if (!ids.has(id)) issues.push(`${bank.id}: the ${id} scaffold level is missing.`);
  for (const level of bank.scaffolds) {
    if (level.proves.trim().length < 30) issues.push(`${bank.id}/${level.id}: say what the level proves without being told the answer.`);
    if (level.learnerSupport.trim().length < 30) issues.push(`${bank.id}/${level.id}: describe what the learner is handed.`);
    if (level.adultSupport.trim().length < 30) issues.push(`${bank.id}/${level.id}: describe what the grown-up does, and what they must not do.`);
    if (level.evidence.length === 0) issues.push(`${bank.id}/${level.id}: a level must require at least one kind of evidence.`);
  }

  for (const kind of transferEvidenceKinds) {
    const statement = bank.evidence[kind];
    if (!statement || statement.trim().length < 40) issues.push(`${bank.id}: describe the ${kind} evidence in full.`);
    if (!bank.scaffolds.some((level) => level.evidence.includes(kind))) {
      issues.push(`${bank.id}: no scaffold level requires the ${kind} evidence, so the bank cannot produce it.`);
    }
  }
  const hardest = bank.scaffolds.find((level) => level.id === "changed-brief");
  for (const kind of ["independent-start", "working-behaviour", "changed-requirement"] as const) {
    if (hardest && !hardest.evidence.includes(kind)) issues.push(`${bank.id}: the changed-brief level must require the ${kind} evidence.`);
  }
  return issues;
}

export function transferProjectBank(courseId: CourseId): TransferProjectBank {
  const bank = transferProjectBanks.find((candidate) => candidate.courseId === courseId);
  if (!bank) throw new Error(`No transfer project bank is defined for ${courseId}.`);
  return bank;
}
