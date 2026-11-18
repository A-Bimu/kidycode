# KidyCode V3 Phase 2 (difficult concepts) report

Status: **implementation complete and committed on `wt/t_490b5fde`; not a validated release.**
Base: approved source `fix/v3-assessment-correctness` at `8a12ac6b5aa80affcb5d57d23df141acfdf903fd`.
Commits: `e1745ba` (scripts and the misconception contract), `ad04ddb` (presenter wiring and tests).
No production deployment, no PR merge, no institution code, no child data, no curriculum rewrite.

## Currently doing

Nothing. The phase stopped after the script batch, the misconception contract, the presenter
wiring and the gate passed.

## Completed

Scope from the card: extend the original visual and typed-code lessons for **variables, functions,
arrays, loops, Flexbox, Grid** and age-appropriate advanced concepts, with misconception-specific
hints and actual independent transfer, without breaking continuous projects, existing curriculum
ids or the Notes and Practice separation.

1. **Nine lesson scripts, up from three.** `lib/lesson-scripts.ts` keeps the model, the first three
   samples and the contract checks; `lib/lesson-scripts-difficult-concepts.ts` (new) adds six
   scripts, spread into the same exported list so the presenter, the gate and the tests see one
   set. Concepts now scripted, by primary lesson id:

   | Concept | Script | Difficulty |
   |---------|--------|-----------|
   | Heading hierarchy | `ages-13-15-structure-headings` | 1 |
   | Flexbox on the parent | `ages-13-15-responsive-flex` | 3 |
   | Build elements with a loop | `javascript-logic-loops` | 4 |
   | const and let | `ages-13-15-javascript-values` | 2 |
   | Functions with parameters and return | `ages-13-15-javascript-functions` | 3 |
   | Array index and length | `ages-13-15-data-arrays` | 3 |
   | Grid tracks and `fr` | `ages-13-15-responsive-grid` | 3 |
   | Records as objects (age 16 to 18) | `ages-16-18-javascript-objects` | 4 |
   | Deriving a collection with `filter` (age 16 to 18) | `ages-16-18-javascript-filter` | 5 |

   Each script keeps the six moments with per-mode wording, and the lesson still owns its
   objective, task, hints, tests, question and starter files. The scripts restate none of them.

2. **Misconception-specific hints.** `LessonScript.misconceptions` is a new required field: the
   wrong mental model, the symptom the learner sees, the targeted repair hint, the file, a
   detector pattern and an example that shows the wrong turn. There are **25 detectors** across the
   nine scripts. `lessonScriptIssues()` now fails the build if a script has fewer than two, if a
   hint is too short to repair the idea, if a detector misses its own example, or if a detector
   fires on the correct worked solution. `activeMisconceptions()` in `lib/lesson-journey.ts`
   matches the detectors against the learner's own files, capped at two, and fails closed on an
   invalid pattern. `components/LessonJourney.tsx` shows them in the mastery studio **only after a
   failed check**, so the hint names the wrong turn the learner actually wrote instead of
   pre-empting the attempt or repeating general advice.

3. **Independent transfer, checked rather than asserted.** The fresh mastery task was already a
   different scenario; it is now also proved not to be the lesson's own task. Both
   `scripts/validate-lesson-scripts.mjs` and `tests/v3/lesson-journey.test.mjs` fail if a fresh
   task's starter file equals the lesson's own starter for any file it checks, or if its
   requirement list is the lesson's list.

4. **Per-course coverage, reported instead of claimed.** The gate prints how many activities carry
   a script in each course, so the baseline is evidence for Phase 3 rather than a summary:

   | Course | Scripted activities | Of |
   |--------|--------------------|-----|
   | ages 10 to 12 | 7 | 48 |
   | ages 13 to 15 | 9 | 48 |
   | ages 16 to 18 | 6 | 48 |
   | adults | 9 | 48 |

5. **What did not change.** No file under `lib/course.ts`, `lib/pathway-course.ts`,
   `lib/course-factory.ts`, `app/notes/` or `app/practice/` was touched, so the course ids, the
   activity ids and order, the completion calculation and the Notes and Practice separation are
   untouched by construction. `git diff --name-only 8a12ac6 HEAD` lists seven files, all of them
   the lesson-script layer, its presenter, its styles, its gate and its tests.

## Checks run (all on this worktree)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass |
| `npm run check` (full chain) | pass, no assertion weakened |
| `npm run lint` | pass |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 9 scripts, 31 course and companion mappings, 25 misconception detectors, and the four coverage lines above |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **30 checks, 0 failed** (24 before this phase, 6 added) |
| `vinext build` followed by `node scripts/validate-build.mjs` | pass, Worker bundle, assets, Sites metadata and all migrations validated |

## Blocked or unverified

- **`npm run build` as a single command cannot run in a linked worktree.** `scripts/build-verified.sh`
  requires `${SITES_PROJECT_ROOT}/node_modules/.bin/vinext`, and a linked worktree has no
  `node_modules` of its own; `npm run install:ci` refuses to run here because it requires Linux
  `flock`. The build was therefore run as the same two steps with the repository's own installed
  `vinext` (`bash scripts/sites-env.sh -- ../../node_modules/.bin/vinext build`, then
  `node scripts/validate-build.mjs`), and both passed. This is an environment limitation, not a
  code failure, but it is not the same command the release gate names.
- **No browser was driven in this phase.** The misconception panel was not observed rendering on a
  phone, tablet or desktop, and its keyboard behaviour was not exercised. Its rules are proved by
  TypeScript, the gate and the node tests, not by a walkthrough.
- **The detectors are text patterns over the learner's file**, so they inherit the curriculum's
  existing weakness: they can fire on a commented-out or unused line. They are tighter than the
  course checks (each detector is proved not to fire on the correct answer) but they are still not
  behavioural.
- Coverage is a baseline, not completeness. 31 of 192 activities carry a script.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Next step

Phase 3 (`t_1400cf55`) widens the journey across the catalogue in batches from this baseline, with
the per-course coverage numbers as the starting point, plus a responsive and keyboard pass. The
Security PR #3 gate still stands before any child pilot.

## Recommendation

Review the six new scripts against the Phase 1 blueprint, and in particular check that the fresh
mastery tasks are genuinely independent rather than the lesson's task restated. The misconception
copy is original text written for this phase; nothing was reused from another curriculum.

## User action

Optional. To see the panel, run the dev server with the journey flag on, open a scripted lesson,
press Check fresh task with a wrong answer (for example `let` for every value in the const and let
lesson) and confirm the wrong turn, the symptom and the repair hint appear before the reflection.
