/*
 * Ages 16 to 18: reviewed code-defence templates.
 *
 * The code defence runs after a learner has submitted their small web application. It
 * asks three things of the learner, in this order: explain one decision in their own
 * words, predict what a short taught snippet does, and make one small change to the
 * application they actually built. A fourth, slightly harder prediction is used when a
 * coarse integrity signal suggests checking more.
 *
 * Every task carries the objectives it assesses and the lesson a learner can revise, so
 * nothing in a defence can ask for a skill the course has not taught. The objectives and
 * the revision links below are the real lesson identifiers of the ages 16 to 18 course.
 *
 * The change task is decided by a declarative requirement check, the same kind of check
 * the practical tasks use, so a live change is graded from the learner's own submitted
 * files rather than from an exact string.
 */

import type { DefenceTemplate } from "@/lib/assessment/types";

const courseId = "ages-16-18" as const;

/* ------------------------------------------------ 1. responsive layout and grids -- */

/* The layout module: a fluid width, a flexible navigation row, flexible card tracks, one
   meaningful breakpoint and an even gap. The defence asks the learner to justify the
   breakpoint they chose, to read a flexible track list and a wrapping row, and to add
   the gap between the repeated cards. */

const responsiveObjectives = [
  "ages-16-18-responsive-viewport",
  "ages-16-18-responsive-flex",
  "ages-16-18-responsive-grid",
  "ages-16-18-responsive-media",
  "ages-16-18-responsive-project",
];

const responsiveDefence: DefenceTemplate = {
  id: "ages-16-18-defence-1",
  courseId,
  objectives: responsiveObjectives,
  explain: {
    id: "ages-16-18-defence-1-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why you chose the breakpoint width you used in the stylesheet of the application you built. Say what the layout was doing just below that width, and why that is the point where it needed to change.",
    snippet: `@media (min-width: 700px) {
  .cards {
    grid-template-columns: repeat(3, 1fr);
  }
}`,
    explanation:
      "A good answer names the width you chose, describes what felt cramped just below it, such as cards that became too narrow to read comfortably or navigation links that wrapped in an awkward place, and states the change you made at that width. A good answer also says why the layout itself asked for the change. Naming a device model, or saying that a device list told you the width, is not enough, because the content is what decides where a breakpoint belongs.",
    objectives: ["ages-16-18-responsive-media", "ages-16-18-responsive-project"],
    revision: "ages-16-18-responsive-media",
  },
  predict: {
    id: "ages-16-18-defence-1-predict",
    courseId,
    kind: "predict",
    prompt:
      "This card group is shown on a wide screen. How many columns does the browser create, and how wide is each one?",
    snippet: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1rem;
}`,
    options: [
      "As many equal columns as the space allows, and no column narrower than 15rem",
      "Exactly three columns of 15rem each, with the remaining space left empty",
      "One single column, because 1fr always describes one track",
      "A fixed two columns on every screen width",
    ],
    answer: 0,
    explanation:
      "repeat(auto-fit, minmax(15rem, 1fr)) lets the browser choose the number of tracks from the space it has. Each track is at least 15rem wide and shares the leftover space equally, so a wider screen simply receives more columns. The count is not fixed at three, and 1fr describes one share of the space rather than a single track for the whole grid.",
    objectives: ["ages-16-18-responsive-grid"],
    revision: "ages-16-18-responsive-grid",
  },
  change: {
    id: "ages-16-18-defence-1-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the application you submitted, then explain what the change does and why it keeps the layout working at every width.",
    changeInstruction:
      "In the stylesheet you submitted, find the rule for the card group and add a gap between the cards. Keep the grid tracks you already wrote, leave the HTML as it is, and make the gap a value you would be happy to reuse across the page.",
    snippet: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}`,
    changeRequirement: { kind: "css-declaration", file: "css", selector: ".cards", property: "gap", value: "gap" },
    explanation:
      "The gap property on the card group puts even space between the repeated cards without hand measured margins, so the spacing survives a change in the number of columns. A single gap declaration is the whole change: the tracks and the markup stay as they were.",
    objectives: ["ages-16-18-responsive-project"],
    revision: "ages-16-18-responsive-project",
  },
  escalatedPredict: {
    id: "ages-16-18-defence-1-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt:
      "The navigation row below is given more links than the available width can hold. What does the browser do with the links that do not fit?",
    snippet: `nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
    options: [
      "The links shrink until they all fit on one line, because flex items never move to a new line",
      "The links continue onto a second line inside the navigation row",
      "The links are clipped at the edge of the navigation container",
      "The whole navigation is hidden until the screen becomes wider",
    ],
    answer: 1,
    explanation:
      "flex-wrap: wrap allows the row to break, so links that do not fit move onto a following line while the container keeps them together. Without wrapping the items would be squeezed instead, but wrapping is exactly what this declaration asks for. Nothing is clipped and nothing is hidden.",
    objectives: ["ages-16-18-responsive-flex"],
    revision: "ages-16-18-responsive-flex",
  },
};

/* ----------------------------------------- 2. application state and immutable CRUD -- */

/* The data module: one source of truth, a create that assigns a new array, an update by
   stable id, a delete that derives a collection without that id. The defence asks the
   learner to justify identity by id, to read a non mutating update and a non mutating
   delete, and to make the delete step derive its collection from a tested callback. */

const dataObjectives = [
  "ages-16-18-data-state",
  "ages-16-18-data-create",
  "ages-16-18-data-update",
  "ages-16-18-data-delete",
  "ages-16-18-data-project",
];

const dataDefence: DefenceTemplate = {
  id: "ages-16-18-defence-2",
  courseId,
  objectives: dataObjectives,
  explain: {
    id: "ages-16-18-defence-2-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why your update step finds the record it changes by id instead of by its position in the array. Use one example from the application you built.",
    snippet: `const updated = records.map(function (record) {
  if (record.id === id) {
    return { ...record, title: title };
  }
  return record;
});`,
    explanation:
      "A good answer says that the position of a record changes whenever the collection is sorted or filtered, so a position cannot identify a record for long, while the id travels with the record wherever it goes. A good answer then points at a real moment in the application where this matters, for example after the list is sorted by title and the record is no longer in the place it started. Saying only that ids are shorter or prettier than positions misses the reason.",
    objectives: ["ages-16-18-data-update"],
    revision: "ages-16-18-data-update",
  },
  predict: {
    id: "ages-16-18-defence-2-predict",
    courseId,
    kind: "predict",
    prompt:
      "One record in records matches the id above. After this line runs, how many records does updated hold compared with records?",
    snippet: `const updated = records.map(function (record) {
  if (record.id === id) {
    return { ...record, title: title };
  }
  return record;
});`,
    options: [
      "One more, because the copied record is added to the collection",
      "The same number, with the matching record replaced by a copy that carries the new title",
      "Only the matching record, because map keeps just the record that matched",
      "One fewer, because the matching record is removed",
    ],
    answer: 1,
    explanation:
      "map visits every record and returns one value for each of them, so the new array has the same length as the old one. The matching record is replaced by a copy that carries the new title, and every other record is passed straight through. Nothing is added, nothing is dropped, and map never keeps only the match.",
    objectives: ["ages-16-18-data-update"],
    revision: "ages-16-18-data-update",
  },
  change: {
    id: "ages-16-18-defence-2-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the application you submitted, then explain what the change does and why the collection it came from is still intact afterwards.",
    changeInstruction:
      "In the JavaScript you submitted, find the step that removes a record and make it derive the remaining records through a tested callback. The callback must answer true or false for each record, and the record that carries the removed id must be the one left out. Leave the array the step started from untouched.",
    snippet: `function removeRecord(state, id) {
  return state.records.filter(function (record) {
    return record.id !== id;
  });
}`,
    changeRequirement: { kind: "js-callback", file: "javascript", method: "filter", needsReturn: true, needsComparison: true },
    explanation:
      "A filter callback that returns a comparison for each record keeps exactly the records whose id is not the removed one, and the result is a new array rather than an edit in place. The comparison is what makes the decision visible, and the source of truth still holds every record it held before.",
    objectives: ["ages-16-18-data-delete"],
    revision: "ages-16-18-data-delete",
  },
  escalatedPredict: {
    id: "ages-16-18-defence-2-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt:
      "This function is called with the current state and the id of one record. What does the original state object look like once the function has returned?",
    snippet: `function removeRecord(state, id) {
  return {
    ...state,
    records: state.records.filter(function (record) {
      return record.id !== id;
    }),
  };
}`,
    options: [
      "Its records array has the record removed, because filter edits the array it is called on",
      "It is replaced by the object the function returned, everywhere it was used",
      "It is unchanged, because the function returned a new object holding a new records array",
      "Its records array holds one extra record, because the object spread adds one",
    ],
    answer: 2,
    explanation:
      "filter returns a new array and leaves the array it was called on exactly as it was, and the object spread builds a new state object around that new array. The original state therefore still holds every record, which is what makes the change traceable as a before and after. Nothing was edited in place and no value was added.",
    objectives: ["ages-16-18-data-state", "ages-16-18-data-delete"],
    revision: "ages-16-18-data-state",
  },
};

/* -------------------------------------------- 3. external data and request states --- */

/* The interaction module: a request that can succeed, fail, or arrive out of order, with
   loading, empty, success and error states all shown explicitly. The defence asks the
   learner to justify showing the loading message before the wait, to read a caught
   failure and a stale response guard, and to add the try and catch that explains a
   failure. */

const interactionObjectives = [
  "ages-16-18-interaction-fetch",
  "ages-16-18-interaction-loading",
  "ages-16-18-interaction-errors",
  "ages-16-18-interaction-abort",
  "ages-16-18-interaction-project",
];

const interactionDefence: DefenceTemplate = {
  id: "ages-16-18-defence-3",
  courseId,
  objectives: interactionObjectives,
  explain: {
    id: "ages-16-18-defence-3-explain",
    courseId,
    kind: "explain",
    prompt:
      "In your own words, explain why you show the loading message before you wait for the data to arrive rather than after it has arrived. Refer to what the visitor sees while they wait.",
    snippet: `async function load() {
  showMessage("Loading...");
  const response = await fetch(address);
  const data = await response.json();
  render(data);
}`,
    explanation:
      "A good answer says that the message is set before the await so the visitor learns immediately that their action was received, and that a request can take a while, so an interface with no message looks broken rather than slow. A good answer also connects the message to the moment it is replaced, when the data has arrived and been rendered. Saying that the message makes the request faster is not the reason, because it cannot.",
    objectives: ["ages-16-18-interaction-loading"],
    revision: "ages-16-18-interaction-loading",
  },
  predict: {
    id: "ages-16-18-defence-3-predict",
    courseId,
    kind: "predict",
    prompt: "The request completes and response.ok is false. What does the visitor see?",
    snippet: `async function load() {
  showMessage("Loading...");
  try {
    const response = await fetch(address);
    if (!response.ok) {
      throw new Error("Request failed");
    }
    const data = await response.json();
    render(data);
  } catch (error) {
    showMessage("Could not load the data. Try again.");
  } finally {
    controls.disabled = false;
  }
}`,
    options: [
      "Ready, because a completed request is a successful one",
      "Could not load the data. Try again.",
      "Loading... stays on screen, because a thrown error ends the function before any message changes",
      "No message, because the render step runs with empty data instead",
    ],
    answer: 1,
    explanation:
      "A completed request can still carry an error status, so response.ok is false and the snippet throws. The throw leaves the try block and is received by catch, which replaces the loading message with the plain next step. Rendering never happens, the finally block still runs, and the visitor is never left looking at the loading message.",
    objectives: ["ages-16-18-interaction-errors", "ages-16-18-interaction-loading"],
    revision: "ages-16-18-interaction-errors",
  },
  change: {
    id: "ages-16-18-defence-3-change",
    courseId,
    kind: "change",
    prompt:
      "Make one small change to the application you submitted, then explain what the change does and what the visitor sees because of it.",
    changeInstruction:
      "In the JavaScript you submitted, take the part of your application that asks for data and put it inside a try block with a catch. The catch must show the visitor an honest message with a plain next step, such as trying again, and it must not show the internal names of your functions.",
    snippet: `async function load() {
  const response = await fetch(address);
  const data = await response.json();
  render(data);
}`,
    changeRequirement: { kind: "js-structural", file: "javascript", fact: "try-catch" },
    explanation:
      "A try block around the request and a catch that receives the failure is what turns a broken page into an explained one. The catch is where the visitor is told what happened and what they can do next, and the finally block, if you use one, still runs whatever the outcome was.",
    objectives: ["ages-16-18-interaction-errors"],
    revision: "ages-16-18-interaction-errors",
  },
  escalatedPredict: {
    id: "ages-16-18-defence-3-escalated",
    courseId,
    kind: "predict",
    escalated: true,
    prompt:
      "Two requests start from this function: the first for a slow address, the second for a fast one. The second finishes first and the first finishes after it. What does the visitor end up seeing?",
    snippet: `let latestId = 0;

async function load(address) {
  const requestId = ++latestId;
  const response = await fetch(address);
  const data = await response.json();
  if (requestId !== latestId) {
    return;
  }
  render(data);
}`,
    options: [
      "Nothing, because the second request cancels the first one as it starts",
      "The results of the first request, because it finished last and so renders last",
      "The results of the second request, because the first one returns early once its id no longer matches the latest id",
      "The results of whichever request returned the larger response",
    ],
    answer: 2,
    explanation:
      "Each call captures the id it was given and compares it with the latest id once the response has arrived. By that point the second call has already raised latestId, so the first response finds a different value, returns early and never reaches the page. Requests finish in whatever order the network allows, which is why the guard is needed at all. Nothing cancels the request and neither size nor arrival order decides the result.",
    objectives: ["ages-16-18-interaction-abort"],
    revision: "ages-16-18-interaction-abort",
  },
};

export const templates: DefenceTemplate[] = [responsiveDefence, dataDefence, interactionDefence];
