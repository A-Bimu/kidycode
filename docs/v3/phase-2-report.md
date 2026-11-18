# KidyCode V3 Phase 2 report - guided lesson journey and three sample lessons

Status: **implementation complete and committed on `wt/t_a9a16ff0`; not a validated release.**
Base: `9aeb125` (Phase 1 artifacts) on the approved source `c560fede07357fd354e037dde1ae64e14f876bf3`.
No production deployment, no PR merge, no institution code, no child data.

## Currently doing

Nothing. Phase 2 stopped after the journey presenter, the three scripts and the focused gate passed.

## Completed

1. `lib/lesson-scripts.ts` implements the Phase 1 `LessonScript` model as data:
   - `GuidanceMode` (guided, balanced, independent) and the six moments (`hook`, `model`, `build`, `check`, `explain`, `transfer`).
   - Three original scripts: HTML heading hierarchy, CSS Flexbox, JavaScript loops.
   - Each script records `concept`, `make`, `difficulty`, `prerequisites`, `projectStep`, the six `stages` with per-mode wording, and a `mastery` gate with a fresh task, an observable result, a reflection prompt, original starter files, checks and a worked solution.
   - `scriptFor(courseId, lessonId)` resolves a script by course and lesson id, including companions (`html-foundations-text`, `css-layout-flex`, `ages-13-15-data-foreach`, `ages-16-18-data-create`, and the adult data lessons).
2. `lib/lesson-journey.ts` adds the feature flag (`NEXT_PUBLIC_V3_LESSON_JOURNEY=off` disables the journey), the per-lesson guidance override stored in `localStorage`, and `guidanceForCourse` (10 to 12 guided, 13 to 15 and adults balanced, 16 to 18 independent).
3. `components/LessonJourney.tsx` is the reusable presenter:
   - `JourneyRail` shows the six moments with the current step highlighted.
   - `GuidanceControl` lets the learner override the guidance level per lesson.
   - `JourneyNotes` shows the hook, the single concept and what the learner makes.
   - `JourneyPractice` shows the build lead, the requirements (one at a time in guided), the check lead and how the work carries forward.
   - `JourneyMastery` runs a fresh unprompted task with its own editor, safe preview and checks, then requires one sentence describing what the learner changed and observed.
4. `components/LearningApp.tsx` keeps the contract:
   - `CodingActivity` receives `courseId`, attempts and a mastery callback; the journey renders inside the existing Notes, Practice and Quick check steps, so routes, course ids, activity ids, progress saving, the tutor, review and assessment are unchanged.
   - A scripted lesson completes only when the code checks pass, the quick check passes, the fresh mastery task passes and the reflection sentence is written. `completeActivity` and the completion button enforce the same gate.
   - Hint pacing follows the mode: guided offers the first hint after the first check attempt, balanced on request, independent after two attempts.
   - The worked example and requirement reveal stay in the existing surfaces; no second route or second content store was added.
5. `app/lesson-journey.css` is imported by `app/layout.tsx` and supplies the responsive styles (rail collapses to three columns on phones, mastery studio to one column on tablets).
6. `scripts/validate-lesson-scripts.mjs` and the `npm run check` chain now prove:
   - every script anchors to a real lesson in every listed course, and every companion id resolves back to the same script;
   - prerequisites exist and no script lists itself;
   - the three samples cover HTML, CSS and JavaScript;
   - the mastery checks fail on the starter and pass on the worked solution;
   - no em dash and no banned colour name in the scripts.
7. `docs/v3/phase-2-report.md` (this file).

## Checks run (all on this worktree)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass |
| `npm run check` (full chain, including `validate-full-course`, the new `validate-lesson-scripts`, `validate-learning-interface`, `validate-static` and the assessment/certification suites) | pass |
| `npm run lint` | pass |
| `npm run build` (`vinext build` plus `validate-build.mjs`) | pass, Worker bundle and migrations validated |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 3 scripts, 10 course and companion mappings |

## Blocked or unverified

- No browser was driven in this phase. The journey was not observed running; its behaviour is proved by TypeScript, the interface validator, the new contract validator and the production build, not by a manual desktop, tablet or phone pass.
- The fresh mastery task uses original checks written for this phase rather than the lesson's own checks, because the blueprint's "reused checks" cannot test a different scenario. This is a deliberate, documented deviation.
- The guidance override is stored per lesson in `localStorage`; a blocked storage API falls back to the course default without error, but that path was not exercised in a browser.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider in this run.

## Next step

Phase 3 (`t_31cba5cd`): run `npm ci`, `npm run check`, `npm run lint`, `npm run build`, `npm run test:e2e` and the supported browser sweeps, add hint, mastery and error-recovery checks without weakening existing tests, and open a draft review PR. Security PR #3 remains the separate release gate before any child pilot.

## Recommendation

Review the three scripts against the Phase 1 blueprint and the journey surfaces in a browser before Phase 3 widens content conversion. Keep the journey behind the feature flag until the walkthrough is observed.

## User action

None required to continue. If a browser walkthrough is wanted first, open a course URL with the flag on, pick the heading, Flexbox or loops lesson, and confirm the six moments, the mode switch and the fresh mastery task on phone and desktop.
