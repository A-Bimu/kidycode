# KidyCode V3 Phase 1 - Lesson blueprint

This is the design Phase 2 implements. It changes no learner contract: the four course ids, the
activity ids, the `challenge | project | quiz` activity types, the module order, the completion
calculation and the assessment flow all stay as they are. Evidence for the current contracts is
in `docs/v3/curriculum-audit.md`.

## What this blueprint must satisfy

From `docs/v3/phase-plan.md`, the instructional principles this design encodes:

1. one learnable concept and one thing the learner makes per lesson;
2. a concrete result or problem first, then a minimal worked example, no page of preface;
3. the learner predicts or changes real typed HTML, CSS or JavaScript, one task at a time;
4. terminology only when it is needed, with the reason a line works living in the Notes space;
5. an independent Practice Lab, hints staged nudge then locate then worked partial, and useful
   error feedback that does not hand over the answer;
6. every concept improves one continuous website the learner chose;
7. understanding is proven by a fresh unprompted task, checking behaviour, not clicks;
8. per-register presentation (guided 10 to 12, creative 13 to 15, developer 16 to 18, practical
   adults) with a learner-overridable guidance level that never skips a mastery gate;
9. responsive layout, keyboard navigation, accessible labels, readable code, no green in the
   palette;
10. few controls on a beginner step, with the full workspace only on request.

## Data model

The existing `Lesson` type in `lib/course.ts:21-42` already holds everything the current
interface needs. The blueprint adds a presentation layer beside it, not a second content store,
so `lib/course-catalog.ts:6-11` remains the single source of truth and `lib/learning-experience.ts`
keeps deriving Notes, Practice and the dashboard from it.

```ts
import type { CodeFile, CodeTest, CourseId, Lesson, PracticeQuestion, WorkspaceFiles } from "@/lib/course";

/** How much support the learner receives. Default comes from the register, the learner may override it. */
export type GuidanceMode = "guided" | "balanced" | "independent";

/** The six moments of one lesson. They map onto the existing interface steps in the table below. */
export type LessonStageId = "hook" | "model" | "build" | "check" | "explain" | "transfer";

/** One line copied from the existing lesson, so the script can never disagree with the course. */
export type ScriptLine = {
  lessonId: string;        // must equal a real Lesson.id from the course bundle
  courseIds: CourseId[];   // which bundles may render this script; never crosses a course
  concept: string;         // one sentence: the single idea
  make: string;            // one sentence: what the learner makes
  difficulty: 1 | 2 | 3 | 4 | 5;                 // from the audit's risk ranking
  prerequisites: string[]; // lesson ids, checked only for ordering, never used to hide content
  projectStep: string;     // how the learner's continuous website changes in this lesson
  stages: Record<LessonStageId, StageSpec>;
  mastery: MasterySpec;
};

export type StageSpec = {
  /** What the learner sees before doing anything. Short. */
  lead: string;
  /** Optional per-mode wording. Missing modes fall back to `lead`. */
  variants?: Partial<Record<GuidanceMode, string>>;
  /** Only the stages that carry code carry files. */
  files?: WorkspaceFiles;
  editable?: CodeFile[];
}; 

export type MasterySpec = {
  /** The unprompted task. Different scenario from the worked example, same concept. */
  freshTask: string;
  /** Behaviour the learner must observe with their own eyes. */
  observable: string;
  /** The course's own checks for the fresh task. Reused, not duplicated. */
  checks: CodeTest[];
  /** The question the learner answers by explaining, not by choosing. */
  reflection: string;
};
```

Rules that make the script safe to add:

- A script may only reference `lessonId` values that already exist in `courses[courseId]`. If a
  script's `courseIds` does not include the course being rendered, the lesson renders its
  existing content unchanged. Phase 2 should assert this in a validator.
- The script never restates `objective`, `task`, `hints`, `tests`, `question` or `reflection`.
  Those stay on the `Lesson` and are read from it, so the gate in
  `scripts/validate-full-course.mjs` keeps protecting the same fields.
- `stages` supply presentation and framing only. Any code the learner edits comes from
  `Lesson.starterFiles`, and any automatic check comes from `Lesson.tests` or `MasterySpec.checks`.
- Vocabulary in the six stages must come from `Lesson.keyTerms`, and every term must keep its
  entry in `termDefinitions` (`lib/course.ts:143`), which the gate already enforces.

## Interaction flow

One lesson is six moments. They map onto the interface the learner already has, so nothing needs
a new route.

| Moment | Purpose | Existing surface | Notes or Practice |
|--------|---------|------------------|-------------------|
| `hook` | A concrete result or a small problem, before any explanation | the lesson header, above the stepper | Notes |
| `model` | The smallest complete worked example that solves it | WORKED EXAMPLE block | Notes |
| `build` | The learner edits real typed code for their own website | the code workspace and preview | Practice |
| `check` | The automatic requirements run; the learner compares result with prediction | requirement list and check button | Practice |
| `explain` | The learner runs a fresh, unprompted task with different content | quick check plus the fresh task | Practice, then Check |
| `transfer` | One sentence connecting this to the website they are building, with the option to go further | project link and reflection | Practice |

Mode changes the amount of scaffolding, never the gate:

- **guided** (default for 10 to 12, and for an adult who asks for more support): the hook states
  the result, the worked example is shown in full, only one requirement is visible at a time, and
  hint 1 is offered after the first failed check.
- **balanced** (default for 13 to 15 and adults): the hook poses the problem, the worked example
  is collapsed behind WORKED EXAMPLE, all requirements are listed, and hints appear on request.
- **independent** (default for 16 to 18): the hook poses the problem, the worked example is
  behind a single reveal, requirements are shown as a checklist the learner may edit around, and
  hints are offered only after two failed checks.

In every mode the learner can switch to the advanced workspace (full editor plus notes plus
preview) on request, and the mastery gate is identical. A learner may never skip `explain`.

Hints keep the existing three-part shape from `Lesson.hints` (the gate requires exactly three,
`scripts/validate-full-course.mjs:85`): nudge, then locate, then worked partial. In `guided` the
interface may reveal them faster, but hint 3 never contains the finished answer for the fresh
task, only for the worked example.

## Age-specific variants

The same concept is presented four ways. Guidance level is a default plus an override, and the
override never unlocks a skipped gate.

| Register | Default mode | Register-specific behaviour | Website framing | Hint pacing |
|----------|--------------|-----------------------------|-----------------|-------------|
| 10 to 12 | guided | Short sentences. Result first: "your page will show a big title and two smaller ones". One control at a time. | Interest Guide, Club Website or Mini Magazine | Hint 1 offered after the first failed check |
| 13 to 15 | balanced | Creative framing: the learner picks the subject and the words, the structure is the lesson. | Personal Portfolio, Community Event Hub or Small Business Website | Hints on request |
| 16 to 18 | independent | Developer framing: state the expected result, name the failure mode, let the learner diagnose. | Revision Planner, Opportunity Directory or Service Dashboard | Hints after two failed checks |
| Adults | balanced, adult tones | Practical framing: what this does in a real site, what it costs to get wrong, what the browser does for free. | Professional Portfolio, Organisation Website or Service Business Website | Hints on request |

The variant lives in `StageSpec.variants`, keyed by mode, so one script serves all four. The
register is chosen from the course bundle, and the learner override is stored per lesson, not per
course, so a 16 to 18 learner may still ask for guided wording on the module they find hardest.

## Worked example A: a simple short lesson

Concept: an HTML heading hierarchy. The full hierarchy (one `h1`, two `h2`, one `h3`) is the
pathway lesson `headings` (`lib/pathway-course.ts:256`), which becomes `ages-13-15-structure-headings`,
`ages-16-18-structure-headings` and `adults-structure-headings` (ids built as
`${courseId}-${stageId}-${spec.id}` in `lib/course-factory.ts:74`). The ages 10 to 12 module
teaches the same idea more gently as `html-foundations-text` (`lib/course.ts:380`, id built as
`${stageId}-${lessonId}` in `lib/course.ts:366`), and that lesson's own task and checks are used
when it renders. Full script in `docs/v3/reference-lessons/html-heading.md`.

| Moment | Content |
|--------|---------|
| `hook` | Two pages side by side, same words. One reads like a page with a title and sections, the other is a flat wall. "The difference is not the words. It is the job each line was given." |
| `model` | `<h1>Study Planner</h1>` then `<h2>This week</h2>` then `<h3>Mathematics</h3>`. One h1, section headings below it. |
| `build` | The learner turns their own page's plain lines into one h1, two h2 headings and one h3 inside the second section. `Lesson.tests` already check exactly this. |
| `check` | The learner compares their page with the work on screen and reads the outline: only the headings, in order. If the outline explains the page, the hierarchy is working. |
| `explain` | Fresh task: mark up a three-part notice for a different scenario, with no example open. |
| `transfer` | The heading outline becomes the sections of their own website, and the next lesson adds links to those sections. |

## Worked example B: a difficult concept

Concept: build page content from an array with a loop. It is rank 3 in the audit's risk ranking
and it maps onto `javascript-logic-loops` (`lib/course.ts:437`) and the pathway `foreach` and
`render` lessons (`lib/pathway-course.ts:319-320`). Full script in
`docs/v3/reference-lessons/javascript-loops.md`. This is the concept most likely to be passed by
pattern-matching a check without understanding, so its mastery gate is behavioural.

| Moment | Content |
|--------|---------|
| `hook` | One list item typed three times, then a fourth topic is added to an array and the page shows nothing new. "The page is not broken. The instruction only ever ran once." |
| `model` | `skills.forEach(function (skill) { const item = document.createElement("li"); item.textContent = skill; list.append(item); });` with each part named: the loop variable, the new element, its text, where it is placed. |
| `build` | The learner writes the loop for three of their own topics into the page they already have. |
| `check` | Requirements run; then the behavioural test: change the array from three items to four and predict what appears before running it. |
| `explain` | Fresh task: render a different collection into a different list with an empty state, no example open. |
| `transfer` | The list is generated from data, so the next project checkpoint can filter it without retyping markup. |

## Mastery gate

A lesson is complete only when all three hold, and the third is new in V3:

1. the automatic requirements pass (`Lesson.tests`, and for projects at least four,
   `scripts/validate-full-course.mjs:101`);
2. the lesson's question or quiz is answered with its explanation read
   (`Lesson.question`, or five questions for a quiz, `:107`);
3. the learner states, in one sentence, what they changed and the result they observed, on the
   fresh task, not the worked example.

Requirement 3 is the anti-pattern-matching gate. It is deliberately answerable in the learner's
own words and is not auto-marked; it is stored with the completion record so a mentor can read it.

## What must not change

- Course ids and titles: `ages-10-12`, `ages-13-15`, `ages-16-18`, `adults`
  (`lib/course-catalog.ts:6-11`).
- Activity ids and order: 8 modules x challenge x4, project, quiz
  (`scripts/validate-full-course.mjs:71-75`).
- Completion: `buildCompletionRecord` stays the one calculation used by the dashboard, the
  portfolio and the guardian view (`lib/learning-experience.ts:213-235`).
- Notes and Practice stay separate destinations (`app/notes/page.tsx`, `app/practice/page.tsx`),
  and the Practice Lab keeps carrying no answer material
  (`lib/learning-experience.ts:261-265`).
- Assessment and the certification flow (`components/ExamPanel.tsx`,
  `lib/assessment/*`) are untouched by V3.
- No institution or pilot admin control appears on a beginner page.
- Product source keeps no em dash and no green
  (`scripts/validate-full-course.mjs:128-132`, `scripts/validate-learning-interface.mjs:50-51`).

## Rollout shape for Phase 2

Build one reusable presenter that reads `Lesson` plus the optional `LessonScript` and renders the
six moments in the requested mode. Land it behind a feature flag, then convert three lessons: the
HTML heading reference lesson, the CSS Flexbox reference lesson and the JavaScript loops reference
lesson, one per language, each proved in the existing gates. Only after those three are reviewed
does content conversion widen. No bulk rewrite of the 192 existing activities.
