# Reference lesson 3 - JavaScript loops that build page content

Original KidyCode material. Written for V3 from the blueprint in
`docs/v3/lesson-blueprint.md`. Nothing here is copied from Code Club, Code.org, freeCodeCamp,
Scratch or The Odin Project; see `docs/v3/research-matrix.md` for why.

This is the JavaScript proof of the presenter and the **difficult concept** example. It is rank 3
in the audit's risk ranking (`docs/v3/curriculum-audit.md`) because the automatic checks are the
easiest in the curriculum to satisfy without understanding, which is why its mastery gate is
behavioural.

## Which existing lessons this script serves

- ages 10 to 12: `javascript-logic-loops` (`lib/course.ts:437`), task "Select #skill-list. Use
  skills.forEach with skill as the loop variable. Inside the loop, create an li, set its
  textContent to skill and append it to the list."
- ages 13 to 15 and adults: the pathway lessons `foreach` (`lib/pathway-course.ts:319`) and
  `render` (`lib/pathway-course.ts:320`), becoming `ages-13-15-data-foreach`,
  `ages-13-15-data-render`, `adults-data-foreach` and `adults-data-render`. The two lessons are
  deliberately split: `foreach` repeats an instruction over an array, and `render` creates real
  elements in the page.
- ages 16 to 18: the advanced pathway replaces these with state and CRUD, and the loop appears in
  `ages-16-18-data-create` (`lib/pathway-course.ts:313`) plus the module's project JavaScript,
  which renders the collection with the same `forEach` pattern.

All tasks and all checks come from the `Lesson`; this document supplies framing and the mastery
step only.

## Script record

```json
{
  "lessonId": "javascript-logic-loops",
  "courseIds": ["ages-10-12"],
  "companionLessonIds": {
    "ages-13-15": ["ages-13-15-data-foreach", "ages-13-15-data-render"],
    "adults": ["adults-data-foreach", "adults-data-render"],
    "ages-16-18": ["ages-16-18-data-create"]
  },
  "concept": "A loop runs the same instruction once for every item in an array, and the callback parameter is the current item during that one run.",
  "make": "The learner turns a hand-typed list into a list the page builds from data.",
  "difficulty": 4,
  "prerequisites": ["ages-10-12-javascript-foundations-functions", "ages-10-12-javascript-logic-arrays"],
  "projectStep": "The project's topic list stops being typed markup and becomes three li elements created from the topics array, so adding a fourth topic needs no HTML edit.",
  "stages": {
    "hook": "One list item typed three times. Add a fourth topic to the array and run it: the page still shows three. Ask what the instruction is doing wrong.",
    "model": "const list = document.querySelector(\"#skill-list\"); skills.forEach(function (skill) { const item = document.createElement(\"li\"); item.textContent = skill; list.append(item); }); with each part named: the container, the loop, the current value, the new element, its text, and where it is placed.",
    "build": "The learner edits the JavaScript file only. One instruction at a time, running after each.",
    "check": "Requirements run, then the behavioural test: change the array from three items to four and predict what the page will show before running it.",
    "explain": "A fresh collection rendered into a different list, with an empty-state message, and no example open.",
    "transfer": "Because the list is now generated from data, the next checkpoint can filter it without retyping any markup."
  },
  "mastery": {
    "freshTask": "A club page needs a list of meeting times built from an array of four times, plus a message that says No meetings yet when the array is empty.",
    "observable": "Changing the array changes the page with no HTML edit, and emptying the array shows the empty-state message.",
    "reflection": "Where did you create the new list item, and why does moving that line outside the loop change the result?"
  }
}
```

## Conceptual model

A loop is not a shortcut for typing. It is a statement about repetition: **this instruction is
run once for each item in the collection, and during each run a name stands for the current
item.** Two ideas have to land together.

1. The loop variable is one item at a time, not the whole array. `skill` is "HTML" on the first
   run and "JavaScript" on the last. Inside the braces, you are describing one item's worth of
   work.
2. The work must *create and place* something. Creating the element is not the same as putting it
   on the page, and creating it once outside the loop gives you one element no matter how many
   items exist.

The single idea: **describe the work for one item, in the right place, and let the loop repeat
it.**

## Worked example

```js
const skills = ["HTML", "CSS", "JavaScript"];
const list = document.querySelector("#skill-list");

skills.forEach(function (skill) {
  const item = document.createElement("li");
  item.textContent = skill;
  list.append(item);
});
```

Read it as three sentences: for each skill, make a new list item, give it the skill's text, put it
in the list. The `const item` line is inside the loop on purpose: a new element is made for every
item. Move it above the loop and the page shows one item, because the same element is reused and
relocated.

## Common wrong answers

| What the learner writes | Why it looks right and is not | How to tell them, and how it is detected |
|-------------------------|-------------------------------|------------------------------------------|
| `list.innerHTML = "<li>" + topic + "</li>";` inside the loop | The page shows a list, so it works | "You built a string and asked the browser to interpret it as markup. Real elements, set with textContent, keep the text as text." Detection: the required patterns (`createElement`, `textContent = skill`) do not match, and the advanced security lesson explicitly forbids `innerHTML` (`lib/pathway-course.ts:346`). On a project, this also erases anything already in the list on each pass |
| `const item = document.createElement("li");` written **above** the loop | Every required word is present in the file | "You made one item. The loop needs to make one per value." Detection gap: the check `forEach[\s\S]*document\.createElement\(\s*["']li["']\s*\)` (`lib/course.ts:437`) matches across the whole file, so placement is not checked. This is why the mastery step moves the line on purpose |
| `list.append(item)` written **outside** the loop, after it | The properties exist and the file looks tidy | "By then, the loop has finished and you are placing only the last item effectively." Detection gap: `list\.append\(\s*(?:item|listItem)\s*\)` (`lib/course.ts:437`) matches wherever it appears |
| Naming the callback parameter something other than `skill` or `topic` | It is clearer, and it is correct JavaScript | It is correct, and the check rejects it: `skills\.forEach\(\s*function\s*\(\s*skill\s*\)` (`lib/course.ts:437`) hard-codes the parameter name. Tell the learner the course check expects that exact name, and count this as a known check limitation rather than a learner error |
| `for (let i = 0; i < skills.length; i++)` instead of `forEach` | It is correct JavaScript and shows real understanding | The check requires `skills\.forEach` (`lib/course.ts:437`), so a correct `for` loop fails. Same limitation: the checks are prescriptive about the method as well as the outcome |
| Doing the `foreach` task (`output += skill`) when `render` was asked, or the reverse | The two lessons are adjacent and both loop | "This lesson repeats an instruction; the next one puts real elements on the page." Detection: `foreach` requires `output\s*(?:\+=|=\s*output\s*\+)` (`lib/pathway-course.ts:319`) and `render` requires `createElement` with `list.append` (`:320`), so each lesson's check rejects the other's answer |
| `textContent` assigned the whole array instead of the current value | The word `textContent` is present | "That writes one item's worth of text: the entire array as a single string." Detection: `(?:item|listItem)\.textContent\s*=\s*skill` (`lib/course.ts:437`) requires the loop variable specifically |

## Hints

ages 10 to 12 lesson `javascript-logic-loops` (`lib/course.ts:437`):

1. **Nudge.** "Begin with skills.forEach(function (skill) { and remember to close it with });."
2. **Locate.** "Inside the loop, create const item = document.createElement(\"li\"); and set
   item.textContent = skill;."
3. **Worked partial.** "Still inside the loop, use list.append(item); to make the new li visible."

Pathway lesson `render` (`lib/pathway-course.ts:320`):

1. **Nudge.** "Start a forEach loop on resources."
2. **Locate.** "Create the li inside the callback."
3. **Worked partial.** "Set item.textContent from resource.title, then append item to list."

Pacing: guided offers hint 1 after the first failed check, balanced on request, independent after
two failed checks. Hint 2 is a locate hint and deliberately says "inside the loop", because
placement is exactly what the automatic checks cannot see.

## Independent challenge

The fresh task, with no example open and different content:

> A club page needs a list of meeting times built from an array of four times, plus a message that
> says "No meetings yet" when the array is empty.

Success is judged by behaviour. The learner changes the array, runs it, and the page changes with
no HTML edit. Then they empty the array and the empty-state message appears instead of a blank
space.

## Evidence of mastery

1. The lesson's own checks pass. For ages 10 to 12 (`lib/course.ts:437`): `skills.forEach(function
   (skill)`, a `createElement("li")`, `item.textContent = skill` and `list.append(item)`. For the
   pathway `render` lesson (`lib/pathway-course.ts:320`): `resources.forEach(`, a `createElement`
   of `li`, `textContent = resource.title` and `list.append`.
2. The lesson question is answered and its explanation read. The ages 10 to 12 question asks what
   the loop variable `skill` represents, and its correct answer is "The current array item during
   one loop run" (`lib/course.ts:437`).
3. The behavioural proof: the learner adds a fourth value to the array and states, before running
   it, that a fourth list item will appear. Then, unprompted, they move the `const item` line
   outside the loop and explain what they expect to change and why. Both statements are recorded
   with the completion.

Steps 1 and 2 alone are not sufficient, and this is the point of the lesson: the audit found that
every required word can be present in the file while the loop is placed wrong
(`docs/v3/curriculum-audit.md`, gap 4).

## How the central website progresses

Before this lesson the project's topic list is markup the learner typed by hand. After it, the
list is generated from the `topics` array, so the same page can hold three topics or ten without
an HTML edit. That is what the next project checkpoint depends on: filtering the collection,
which is impossible while the list is typed markup. In the ages 16 to 18 pathway the same pattern
appears as `create`, adding a record to state without mutating the array
(`lib/pathway-course.ts:313`).

## Age variants

| Register | Lesson id | Lead line | Framing |
|----------|-----------|-----------|---------|
| 10 to 12 | `javascript-logic-loops` | "Your page will show one list item for every skill in the list, and you will only write that instruction once." | guided: one instruction per step, the loop skeleton given, hint 1 after the first failed check |
| 13 to 15 | `ages-13-15-data-foreach` then `ages-13-15-data-render` | "First make the loop repeat the work. Then make it put real elements on the page." | balanced: the two lessons are taken in order and the learner chooses the collection |
| 16 to 18 | `ages-16-18-data-create` | "Adding a record must not mutate the array, and rendering must not build HTML strings. Given both rules, write the loop." | independent: the learner reads the two constraints and diagnoses the unsafe version |
| Adults | `adults-data-foreach` then `adults-data-render` | "This is the pattern behind every list in every app you use: data in, elements out, no string concatenation." | balanced, adult tones: names the real-world pattern and the injection risk of string building |
