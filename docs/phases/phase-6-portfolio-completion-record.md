# Phase 6: learner portfolio and course completion record

Status: implemented and verified locally on top of 2d5ef22. The live Site was left
untouched, and no new migration was needed.

## What a learner sees

The project area of the course is now a portfolio rather than a single preview.

- Project title and a plain explanation of what the learner has built.
- Eight module cards in learning order, each with the module number and title from
  the course catalog, the date its version was saved, a short description of the
  skill that module added, and a status that says Saved or Not saved yet in words.
- A finished-build section that opens the last module once it is saved.
- One primary action, Continue learning, while the work is incomplete.
- A completion record section: the exact missing requirement while incomplete, and
  the printable record once the course is genuinely complete.

Opening a saved module leaves the overview and opens a focused version view: the
module title and outcome, the learner's own reflection, one sandboxed browser
preview, expandable HTML, CSS and JavaScript sections, and a way back. Long code
scrolls inside its own box. The overview runs no preview at all, and the version
view runs exactly one, so eight projects are never rendered at once.

The printable record carries the KidyCode name, the learner's nickname, the course
and age group, the project, 48 activities completed, eight module versions saved,
the passed final assessment, the completion date derived from the evidence, and the
statement that the learner built and tested a website using the technologies taught
in that course. Print styles hide the navigation, the buttons and the module list so
only the record sheet prints. There is no downloadable credential, no verification
number and no public link.

## The completion rule

A course is complete only when all three conditions hold:

1. every activity belonging to the learner's current course is completed (48 of 48)
2. one valid, readable project version is saved for each of the course's eight modules
3. at least one final assessment belonging to that course was passed

Everything is derived on read from `course_progress`, `project_checkpoints` and
`exam_attempts`. Nothing is stored: there is no duplicated total and no editable
completion flag. Reviews and tutor recall cards appear nowhere in the calculation,
so optional practice can never hold a learner back.

The completion date is the latest moment the required evidence arrived: the last
completed activity, the last saved module version, or the passing assessment. It is
never a date the learner typed or the app invented, and it is null until the course
is complete.

The record is called a "KidyCode course completion record". It is never described as
a certificate, a diploma, an accredited qualification or professional certification.

## Backend

- `lib/completion.ts`: the single completion calculation, plus the reduced form a
  grown-up may read.
- `lib/portfolio.ts`: reading stored versions defensively, ordering modules by the
  course catalog, bounding each file to 20,000 characters, and building the module
  detail view.
- `app/api/portfolio/route.ts`: the learner's own portfolio, and one module's saved
  code on request.
- `lib/summary.ts` now carries `completion`, so the progress page and the grown-up
  summary use the same calculation as the portfolio.
- `lib/guardian-view.ts` gained a `completion` entry in its strict allow list.
- `lib/preview.ts`: the safe preview builder moved out of `LearningApp` so the
  editor, the portfolio and the tests share one definition.

The portfolio API takes the learner from the session and never from a parameter. The
only parameter is which module to open, and it is checked against the learner's own
course first. Rows from another course are dropped. Stored JSON is parsed inside a
guard, so a corrupt version is reported as needing another save instead of breaking
the page.

## Privacy boundaries

The learner's own request may return HTML, CSS, JavaScript and their reflection.
Nothing else: no access key, no hash, no session value, no internal identifier, no
stored exam answer and no practical-exam code. Stored answers are read only to
confirm which course an attempt belongs to, exactly as the existing summary route
already did.

A connected grown-up may see the learner's first name, the course title, the project
title, complete or still in progress, activities completed out of 48, module versions
saved out of eight, whether the final assessment was passed, and the completion date
only when the course is genuinely complete. A grown-up never receives HTML, CSS,
JavaScript, project JSON, reflections, answers, practical-exam code, tutor
intervention history, keys, hashes, sessions or any identifier. A revoked or
unrelated grown-up receives no learner information at all.

The allow list names `projectJson`, `reflection`, `answers`, `practical`, `html`,
`css` and `javascript` as forbidden, so a future field cannot leak by accident.

## Migration

None. The phase derives everything from `course_progress`, `project_checkpoints` and
`exam_attempts`, which already exist. `0006_high_tomas.sql` remains undeployed and
unchanged.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Lint | `npm run lint` | Pass, zero errors and zero warnings |
| Validators | `npm run check` | Pass, nine validators |
| Production build | `npm run build` | Pass, `/api/portfolio` packaged |
| End to end API | `scripts/e2e-tutor.mjs` | 74 of 74 |
| Guardian and database | `scripts/e2e-guardian-db.mjs` | 14 of 14 |
| Portfolio and completion | `scripts/e2e-portfolio.mjs` | 14 of 14 |
| Transfer races | `scripts/e2e-transfer-races.mjs` | 6 of 6 |
| Browser | Playwright at 320px, 768px and 1440px | 223 of 223 |

The twenty one required checks, and where each is proved:

1. A new learner sees an empty portfolio and the correct first action: portfolio
   suite, first step, and the browser gap case.
2. One saved checkpoint appears in the correct module: portfolio suite, saved
   through the real API.
3. All eight appear in course order: portfolio suite and validator, with rows
   stored out of order.
4. A checkpoint from another course is excluded: portfolio suite and validator.
5. Malformed project JSON does not crash the portfolio: portfolio suite, validator
   and the browser journey.
6. Repeated saving does not inflate the count: portfolio suite, checking the row
   count in the database and the saved figure through the API.
7. Completion stays false with one activity missing: validator and portfolio suite.
8. Completion stays false with one checkpoint missing: validator, naming the
   earliest missing module.
9. Completion stays false without a passed final assessment: validator and portfolio
   suite, including a recorded failed attempt.
10. Completion becomes true only when all three hold: validator and portfolio suite.
11. A failed assessment followed by a passed one completes the final requirement:
    validator and portfolio suite, through the real exam API.
12. Exam answers and practical-exam code never appear in the portfolio response:
    portfolio suite compares the response against the stored rows.
13. The learner can open each saved version and return: portfolio suite and the
    browser journey.
14. Only one sandboxed preview is present at a time: browser, counting frames on the
    overview, in the version view and after going back, plus the validator.
15. The iframe permissions are exactly the safe permissions: browser and validator
    assert `sandbox="allow-scripts"` and the absence of every other permission.
16. A connected guardian sees the completion record: guardian suite, with a complete
    learner built through fixtures and a real passing assessment.
17. A revoked or unrelated guardian is refused: guardian suite, both 403.
18. Guardian responses contain no code, reflection, answers, session data or
    identifiers: guardian suite, an exact top-level allow list check plus a scan for
    every forbidden key.
19. Print styling hides controls and navigation: validator reads the print block, and
    the browser switches to print media and measures what is hidden.
20. Keyboard and responsive checks pass at all three widths: the browser journey at
    320px, 768px and 1440px, with real Tab navigation to a module card and a visible
    focus indicator.
21. Existing lessons, tutor, review, progress, guardian and transfer tests keep
    passing: the same runs re-check all of them.

## Defects found and fixed while testing

- The portfolio grid could not shrink below its widest child, so at 320px a saved
  version's long code line widened the whole page by 130px. The page is now a
  `minmax(0, 1fr)` grid column with the code box allowed to shrink, which is what
  makes long code scroll inside its own container instead of moving the layout.
- Two existing suites carried stale expectations that this phase legitimately
  invalidated: the interface validator required a `ProjectPage` symbol, and the API
  suite's guardian allow list did not know about the new record. Both now assert the
  current contract, and the interface validator also checks that the portfolio
  preview keeps the restricted sandbox.
- The validator's first green-colour check used a pattern that flagged the navy token
  `#090f26`. It now decides green from the colour channels, the same rule the browser
  uses, so a legitimate navy is never mistaken for green.

## Next unfinished phase

Guardian activity notifications. A grown-up can see the completion record when they
look, but nothing tells them when a learner finishes a module, passes the final
assessment or completes the course. That needs an email path the product does not
have yet, so it should be its own phase with its own consent and privacy design, and
it has not been started.