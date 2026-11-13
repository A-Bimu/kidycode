# KidyCode V3 Phase 1 - Curriculum audit

Scope: `A-Bimu/kidycode` only, read at `c560fede07357fd354e037dde1ae64e14f876bf3` in the
isolated worktree `wt/t_4f640c80`. Every claim below names the file and line it was read from.
Lines are from that commit. Nothing in this document is a claim about deployed behaviour: the
repository's own gate scripts were read, not run, in this phase (Phase 3 runs them).

## What was read

| Path | Lines | What it defines |
|------|-------|-----------------|
| `lib/course.ts` | 495 | Shared types, `props`, `projectChoices`, `languageGuidance`, `termDefinitions`, the ages 10 to 12 bundle, its 8 modules, final exam and practical exam |
| `lib/course-factory.ts` | 129 | `LessonSpec`, `StageSpec`, `CourseSpec`, `files`, `test`, `question`, `buildLesson`, `createCourse` |
| `lib/pathway-course.ts` | 397 | The shared 8-module pathway used by the other three courses, `projectLesson`, `projectStarterFiles`, `finalExam`, `practicalExam`, `buildPathwayCourse` |
| `lib/course-13-15.ts` | 40 | Ages 13 to 15 profile, `advanced: false` |
| `lib/course-16-18.ts` | 40 | Ages 16 to 18 profile, `advanced: true` |
| `lib/course-adults.ts` | 40 | Adult profile, `advanced: false` |
| `lib/course-catalog.ts` | 19 | The four bundles as `courses`, `allCourses`, `allStages`, `allLessons`, `getCourse` |
| `lib/learning-experience.ts` | 272 | Catalogue, Notes Library, Practice Lab, dashboard, `learnerExperienceIssues` |
| `app/dashboard/page.tsx` | 77 | Renders all four dashboards at once from demonstration data |
| `app/notes/page.tsx` | 71 | Notes grouped by module, all four courses |
| `app/practice/page.tsx` | 73 | Practice cards with requirements and hints, all four courses |
| `components/LearningApp.tsx` | 1542 | The learner interface, `LessonStep`, `CodingActivity`, preview, autosave, checkpoints |
| `scripts/validate-full-course.mjs` | 139 | The content contract that every course must satisfy |
| `scripts/validate-learning-interface.mjs` | 65 | The interface, sandbox and route contract |

## Measured structure

Counts are read from the source, not estimated.

| Fact | Value | Evidence |
|------|-------|----------|
| Coding courses | 4 | `lib/course-catalog.ts:6-11`; asserted in `scripts/validate-full-course.mjs:25` |
| Modules per course | 8 | `lib/course.ts:375-464` (8 `makeStage` calls); `lib/pathway-course.ts:392`; asserted in `validate-full-course.mjs:62` |
| Activities per module | 6, in the order challenge, challenge, challenge, challenge, project, quiz | asserted in `scripts/validate-full-course.mjs:71-75` |
| Challenge lessons per module | 4 | measured per module in the inventory below |
| Activities per course | 48 | `courseFacts.lessonCount`; asserted in `validate-full-course.mjs:60` |
| Activities across the four courses | 192 | 4 x 48; printed by `validate-full-course.mjs:139` |
| Project checkpoints across the four courses | 32 | 4 x 8; printed by `validate-full-course.mjs:139` |
| Final-exam questions across the four courses | 40 | 4 x 10; printed by `validate-full-course.mjs:139` |
| Module-quiz questions per course | 40 | 8 quizzes x 5; asserted in `validate-full-course.mjs:108` |
| Project choices per course | 3 | asserted in `validate-full-course.mjs:65` |
| Practical-exam patterns per course | 3 | asserted in `validate-full-course.mjs:67` |
| Pass mark | 7 of 10 | asserted in `validate-full-course.mjs:61` |

Course facts:

| Course id | Title | Ages | Estimated hours | Guidance profile | Defined at |
|-----------|-------|------|-----------------|------------------|------------|
| `ages-10-12` | Web Coding Foundations | 10 to 12 | 18 to 22 hours | guided, non-advanced | `lib/course.ts:493` |
| `ages-13-15` | Practical Web Development | 13 to 15 | 24 to 30 hours | `advanced: false` | `lib/course-13-15.ts:31-40` |
| `ages-16-18` | Web Application Development | 16 to 18 | 30 to 38 hours | `advanced: true` | `lib/course-16-18.ts:31-38` |
| `adults` | Web Skills for Work and Business | 19 | 26 to 34 hours | `advanced: false`, adult register | `lib/course-adults.ts:31-38` |

Project choices (the learner's continuous website) per course:

| Course | Choice `interest` | Choice `club` | Choice `magazine` | Defined at |
|--------|------------------|---------------|-------------------|------------|
| `ages-10-12` | Interest Guide | Club Website | Mini Magazine | `lib/course.ts:102-106` |
| `ages-13-15` | Personal Portfolio | Community Event Hub | Small Business Website | `lib/course-13-15.ts:4-29` |
| `ages-16-18` | Revision Planner | Opportunity Directory | Service Dashboard | `lib/course-16-18.ts:4-29` |
| `adults` | Professional Portfolio | Organisation Website | Service Business Website | `lib/course-adults.ts:4-29` |

The validator also forbids one course from carrying another course's age range or project
titles (`scripts/validate-full-course.mjs:31-49`).

## Module inventory per bundle

### `ages-10-12` - `lib/course.ts`, `makeStage` calls at lines 376, 387, 398, 409, 420, 431, 442, 453

| Module | Id | Title | Challenge lessons (line) | Project |
|--------|----|-------|--------------------------|---------|
| 1 | `html-foundations` | Write your first HTML | elements (377), text (380), nesting (381), lists (382) | Build the page introduction (384) |
| 2 | `html-content` | Connect and describe content | links (390), images (391), semantics (392), forms (393) | Complete the HTML structure (395) |
| 3 | `css-foundations` | Style with CSS | rules (401), classes (402), type (403), cards (404) | Create the visual system (406) |
| 4 | `css-layout` | Build flexible layouts | box (412), flex (413), grid (414), responsive (415) | Make the project responsive (417) |
| 5 | `javascript-foundations` | Start programming with JavaScript | output (423), variables (424), types (425), functions (426) | Add useful page information (428) |
| 6 | `javascript-logic` | Make decisions and repeat work | compare (434), conditions (435), arrays (436), loops (437) | Generate content from data (439) |
| 7 | `dom-interaction` | Make the page interactive | select (445), events (446), classes (447), forms (448) | Build a working interaction (450) |
| 8 | `quality` | Test and finish the website | html (456), syntax (457), access (458), sharing (459) | Complete the final website (461) |

### `ages-13-15`, `ages-16-18`, `adults` - `lib/pathway-course.ts`, one pathway, three profiles

The three courses share the same eight modules and the same lesson ids. `advanced: true`
(ages 16 to 18) swaps the copy of four modules. The profile is applied in
`lib/pathway-course.ts:383-397`.

| Module | Id | Title (non-advanced) | Title (advanced) | Challenge lessons (line) |
|--------|----|----------------------|------------------|--------------------------|
| 1 | `structure` | Meaningful HTML structure | same | landmarks (255), headings (256), links (257), metadata (258) |
| 2 | `forms` | Accessible forms | same | labels (265), types (266), groups (267), messages (268) |
| 3 | `css-system` | A consistent CSS system | same | selectors (275), box-model (276), tokens (277), states (278) |
| 4 | `responsive` | Responsive layouts | same | viewport (285), flex (286), grid (287), media (288) |
| 5 | `javascript` | JavaScript decisions | Application logic | values (295), functions (296), conditions (297), dom-output (298); advanced also pure-functions (301), objects (302), filter (303), sort (304) |
| 6 | `data` | Structured data and rendering | Application state and CRUD | advanced: state (312), create (313), update (314), delete (315); non-advanced: arrays (317), objects (318), foreach (319), render (320) |
| 7 | `interaction` | DOM, forms and browser storage | External data and failure states | non-advanced: select (327), events (328), validation (329), storage (330); advanced: fetch (333), loading (334), errors (335), abort (336) |
| 8 | `quality` | Test, protect and release | same | debug (344), accessibility (345), security (346), release (347) |

Total: 8 modules x (4 challenge + 1 project + 1 quiz) = 48 activities per course, matching the
bound asserted in `scripts/validate-full-course.mjs:60`.

## Existing quality gates (read, not run)

`scripts/validate-full-course.mjs` already enforces, per course:

- the four approved course ids and nothing else (line 25);
- no cross-course age range or project title (lines 31-49);
- exact counts: 8 modules, 48 activities, 3 project choices, 10 final questions, 3 practical
  patterns, pass mark 7 (lines 60-67);
- activity order challenge x4, project, quiz (lines 71-75);
- unique activity ids across all courses (lines 83-84);
- exactly three graduated hints per activity (line 85);
- a worked example longer than 8 characters (line 86);
- every `keyTerms` entry defined in `termDefinitions` (lines 88-90, 126);
- every non-quiz activity: at least two note paragraphs, at least 190 characters of notes, at
  least one editable file, at least one automatic check, and a valid three-option question with
  feedback longer than 18 characters (lines 92-99);
- every project activity: at least four requirement checks and a reflection prompt longer than
  20 characters (lines 101-104);
- every quiz activity: exactly five questions (lines 107-109);
- every code check: a known file, that file must be editable, and the pattern must compile
  (lines 111-115);
- no em dash, no "green", and no reference to the rejected `MissionGame` or `blockCatalog`
  (lines 128-132).

`scripts/validate-learning-interface.mjs` enforces the four learner routes, the three-step
lesson interface, the presence of the notes, practice, check, worked-example, words-to-know and
hint affordances, restricted preview iframes with `sandbox="allow-scripts"` and no
`allow-same-origin`, no nested `main`, and one shared saved-course route map.

`lib/learning-experience.ts:238-272` adds contract checks for the catalogue provenance labels,
Notes covering every lesson, and a Practice Lab that carries no answer material.

## Scoring of the existing content

Ratings are: Strong, Adequate, Weak. Each row cites the strongest evidence.

| Dimension | ages 10 to 12 | 13 to 15 | 16 to 18 | adults | Evidence |
|-----------|---------------|----------|----------|--------|----------|
| Clear objective per activity | Strong | Strong | Strong | Strong | Every lesson carries `objective` (`lib/course.ts:25`, `lib/course-factory.ts:19`); it is surfaced in Notes and on the dashboard (`lib/learning-experience.ts:136`, `:227`) |
| Prerequisites stated or enforced | Adequate | Adequate | Adequate | Adequate | Ordering is strong (HTML, then CSS, then JavaScript: modules 1-2, 3-4, 5-7 in `lib/course.ts:376-453`), and module copy refers back to earlier work (`lib/course.ts:395`, `:406`, `:439`), but no lesson declares or gates a prerequisite |
| Explanation clarity | Strong | Strong | Strong | Strong | The builder injects a concept paragraph and a method paragraph (`lib/pathway-course.ts:29-32`); the gate requires two paragraphs and 190 characters (`scripts/validate-full-course.mjs:93-95`); `detailedExplanation` adds a practical reading note (`lib/course.ts:90-100`) |
| Real code practice | Strong | Strong | Strong | Strong | Every non-quiz activity has editable files and at least one automatic check (`validate-full-course.mjs:96-98`); projects need four or more (`:101-103`) |
| Helpful feedback | Adequate | Adequate | Adequate | Adequate | Three graduated hints are mandatory (`validate-full-course.mjs:85`) and quiz feedback must exceed 18 characters (`:22`), but hints are fixed text rather than responsive to what the learner actually wrote; a tutor nudge exists in the interface (`components/LearningApp.tsx:237`, `:1301`) |
| Project continuity | Strong | Strong | Strong | Strong | One website per learner, carried by `{{TITLE}}`, `{{INTRO}}`, `{{ITEM1}}` to `{{ITEM3}}` tokens filled by `fillProjectTokens` (`components/LearningApp.tsx:183`), with starter files progressing module by module (`lib/pathway-course.ts:134-143`) and project copy that says to keep earlier work (`lib/course.ts:395`, `:417`, `:461`) |
| Accessibility | Adequate | Adequate | Adequate | Adequate | Accessibility is taught as content (alternative text `lib/course.ts:391`, connected labels `:393`, focus-visible `:458`, landmarks `lib/pathway-course.ts:255`, audit lesson `:345`) and the interface gate checks sandboxing and a single `main` (`validate-learning-interface.mjs:47-54`), but no gate checks keyboard order, contrast or labels in the rendered product |
| Responsive fit | Adequate | Adequate | Adequate | Adequate | Responsive design is taught with viewport metadata and media queries (`lib/pathway-course.ts:285-288`) and asserted inside project checks (`lib/course.ts:461`), but no gate exercises a real narrow viewport |

## Top ten difficult concepts by risk

Risk combines how often the concept is taught, how badly a wrong mental model propagates into
later modules, and how weakly the current automatic checks can detect a wrong answer.

| Rank | Concept | Where it is taught | Why it is difficult | Risk | Evidence and detection gap |
|------|---------|--------------------|---------------------|------|-----------------------------|
| 1 | Asynchronous request correctness: fetch, `response.ok`, `try`/`catch`/`finally`, and loading, empty, success and error states, plus ignoring a stale response | `lib/pathway-course.ts:333` fetch, `:334` loading, `:335` errors, `:336` abort | Four independent failure paths; `fetch` does not reject on HTTP errors, so a learner who only wraps it in `try` silently renders nothing | High | Advanced practical exam requires `response\.ok` and a `Try again` message (`lib/pathway-course.ts:372-373`); final exam asks why `response.ok` is checked (`:361`). The checks match text, so a learner can satisfy them while still rendering stale data |
| 2 | Application state and CRUD with a stable record id | `lib/pathway-course.ts:312` state, `:313` create, `:314` update, `:315` delete | Identity, immutability and ordering are three separate ideas; updating by array index looks correct until the list is filtered or sorted | High | Final exam asks what gives a record stable identity (`:359`). Nothing checks that the learner keeps identity when sorting or filtering |
| 3 | Building the page from data: `createElement`, `textContent`, `append` rather than HTML strings | `lib/pathway-course.ts:320` render, `lib/course.ts:437` loops | The learner already knows `innerHTML`-style string joining from earlier examples and it appears to work | High | Non-advanced checks require `createElement("li")`, `textContent = topic` and `list.append(item)` (`lib/course.ts:439`), and the advanced security lesson forbids `innerHTML` (`lib/pathway-course.ts:346`). The patterns are matched per line, not on the running page, so a second unsafe assignment elsewhere can pass |
| 4 | Flexbox: which element becomes the container and how the axis works | `lib/course.ts:413` (`nav { display: flex; gap: 1rem; }`), `lib/pathway-course.ts:286` | The property belongs on the parent, not the items, and direction and alignment only make sense once the axis is understood | Medium | Checks only require `display: flex` and `gap` in the right rule (`lib/course.ts:413`, `:417`). Axis behaviour, alignment and wrapping are never verified |
| 5 | CSS Grid tracks: `repeat`, `1fr` and self-fitting tracks | `lib/course.ts:414`, `lib/pathway-course.ts:287` | `1fr` is a fraction of free space, not a pixel, and track counts interact with the container width | Medium | Projects require `display: grid` and `grid-template-columns` (`lib/course.ts:417`). No check verifies the rendered column count |
| 6 | Responsive layout: viewport metadata, mobile-first sizing and a real breakpoint | `lib/pathway-course.ts:285` viewport, `:288` media, `lib/course.ts:415` | Layout that "works on my laptop" hides horizontal scrolling and unreadable type on a phone | Medium | Checks look for the viewport meta, an `@media` block and a one-column rule (`lib/course.ts:415`, `:461`). No gate opens a narrow viewport |
| 7 | Form labelling and input type | `lib/pathway-course.ts:265` labels, `:266` types, `lib/course.ts:393` | `for` and `id` must match exactly, and the correct `type` is a judgement about the data, not about appearance | Medium | Checks require matching `for`/`id` and a suitable `type`, with `min`/`max` on a number input (`lib/pathway-course.ts:265-266`). Nothing verifies that the control is operable by keyboard or announced correctly |
| 8 | The submit event and `event.preventDefault()` | `lib/pathway-course.ts:328` events, `lib/course.ts:448` forms | A learner who listens for the button click instead of the form submit loses keyboard submission, and forgetting `preventDefault` reloads the page and makes the update look broken | Medium | Non-advanced practical exam requires `event\.preventDefault\(` (`lib/pathway-course.ts:379`) and projects require a `submit` listener (`lib/course.ts:450`). The checks do not distinguish a `click` listener that happens to also contain the string |
| 9 | Array index base zero, `length`, and the difference between the item and its position | `lib/course.ts:436`, `lib/pathway-course.ts:317` | Off-by-one and confusing the loop variable with the whole array are the classic first data errors | Medium | Checks require `topics[1]` and `topics.length` (`lib/pathway-course.ts:317`) and `topics\.length` alone also satisfies `:436`'s pattern, so a learner can pass by mentioning `length` anywhere in the file |
| 10 | Naming repeated design values: `:root`, custom properties and `var()` | `lib/pathway-course.ts:277` | It is the first abstraction in CSS, and a typo in the property name fails silently | Medium | The check requires a `:root` block with three custom properties and three `var()` uses (`lib/pathway-course.ts:277`). A wrong fallback or a misspelled reference still passes as long as the three `var()` calls exist |

Honourable mentions, taught and checked but with lower propagation risk: the box model
(`lib/course.ts:412`, `lib/pathway-course.ts:276`), semantic landmarks (`lib/course.ts:392`,
`lib/pathway-course.ts:255`), alternative text (`lib/course.ts:391`), `localStorage` returning
null on a first visit (`lib/pathway-course.ts:330`), pure functions (`:301`), non-mutating
`filter` and `sort` (`:303-304`), debugging from expected against actual evidence
(`lib/course.ts:456-457`, `lib/pathway-course.ts:344`), and a privacy-safe public credit
(`lib/course.ts:459`).

## Structural gaps found in this audit

Each is a finding about the current source, not a change made in this phase.

1. **No per-lesson difficulty or prerequisite field.** `ActivityType` is only
   `"challenge" | "project" | "quiz"` (`lib/course.ts:4`). The top-ten ranking above therefore
   lives only in this document and cannot yet drive sequencing or the hint level.
2. **Guidance level is a build-time boolean.** `advanced` is fixed per course
   (`lib/course-16-18.ts:38`) and the learner cannot override it, while the phase-plan's
   principle 8 asks for a learner-overridable guidance level without skipping mastery gates.
3. **The dashboard has no single first action.** `app/dashboard/page.tsx:24-33` renders all
   four courses at once from demonstration data, and `app/page.tsx` exposes a many-link fallback
   navigation, which the phase-plan already flags as not beginner-friendly.
4. **Checks match source text, not behaviour.** `CodeTest.pattern` is a regular expression over
   the file contents, combined case-insensitively (`scripts/validate-full-course.mjs:114`).
   Several patterns are satisfied by any mention of the token, for example
   `topics\.length` (`lib/course.ts:436`) or `display\s*:\s*flex` (`:413`), so a comment or an
   unused rule can pass. This is the largest false-mastery risk in the whole curriculum.
5. **The question answer position is derivable.** `q()` places the correct option using the sum
   of the prompt's character codes modulo three (`lib/course.ts:109-117`,
   `lib/course-factory.ts:60-67`), and the gate only requires that the ten final answers are not
   all in the same position (`scripts/validate-full-course.mjs:120`). A learner who notices the
   pattern can guess without understanding.
6. **Accessibility and responsive claims are content-level, not product-level.** The gates check
   the curriculum text and iframe sandboxing, but nothing checks the rendered product at a narrow
   viewport or by keyboard.

## What remains unverified in this phase

- No gate script was executed. Phase 1 is a reading and research phase and the deliverable is
  evidence, not a green build.
- No browser was used against the running product, so every rating above is a reading of source,
  not an observation of the interface in use.
- The licence status of anything not listed in `docs/v3/research-matrix.md` is unknown and must
  be treated as all rights reserved.
