# Phase 3: learner progress summary

Status: implemented, verified and pushed. Started from commit 366bc96 with a
clean working tree. No migration was added.

## What was built

`lib/summary.ts` derives everything from existing rows: lesson progress, lesson
evidence, the concept review queue, project checkpoints, final attempts and the
course content itself. `app/api/summary/route.ts` serves it for the
authenticated learner, filtered to their assigned course. `My progress` was added
to the learner navigation and opens `components/ProgressPage.tsx`.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Curriculum validator | `scripts/validate-full-course.mjs` | Pass |
| Tutor and review validator | `scripts/validate-tutor.mjs` | Pass |
| Summary validator | `scripts/validate-summary.mjs` | Pass, 4 courses |
| Interface validator | `scripts/validate-learning-interface.mjs` | Pass |
| Backend validator | `scripts/validate-backend.mjs` | Pass |
| Static validator | `scripts/validate-static.mjs` | Pass |
| Lint | `npm run lint` | Pass, no warnings |
| Production build | `npm run build` | Pass, `/api/summary` present |
| End to end API journey | `scripts/e2e-tutor.mjs` | 45 of 45 checks passed |
| Browser journey, 3 viewports | Playwright, 320px, 768px, 1440px | 145 of 145 checks passed |

Requirement by requirement, as proved by the runs above:

1. A new learner sees a helpful empty state, and it disappears after real work.
2. Partial progress reports correct totals, and a repeated completion moves none
   of them.
3. Completed activities are never counted twice, and checks are capped at what an
   activity offers.
4. Module mastery is calculated from that module's own activities.
5. Due review concepts appear under "Needs another look" with a readable focus.
6. A retired concept never appears as weak again and shows under "Already
   strengthened" with both recalls recorded.
7. Independent corrections are summed across lessons, and the API run reports the
   two this journey earned.
8. The recommended activity always belongs to the learner's own course, and the
   button to open it lands on that activity.
9. A second learner cannot read the first learner's summary, and naming another
   learner's identifier is refused with 403.
10. All four learning paths produce their own summary with their own totals.
11. The page fits at 320px, 768px and 1440px with no sideways scrolling.
12. Tab reaches the next action with a visible focus marker, every progress
    section is labelled for screen readers, and every status carries text.
13. Type checks, linting, all six validators and the production build pass.
14. The existing lesson flow, tutor nudges and cross lesson recall still pass
    their own checks in the same runs.

## Test harness fixes made during this phase

Two defects in the test scripts were found and fixed, because they had been
reporting false success:

- `scripts/e2e-tutor.mjs` called `check(name, body)` for the review steps, but in
  that harness `check` only records a result and ignores a body. Those seven
  steps never ran while reporting "ok". They now use `step`, and `check` throws
  if it is handed a function so the mistake cannot recur silently.
- `browser.mjs` lost its entire result set when an unexpected error was thrown
  outside a check. The journey is now wrapped so an unexpected error is recorded
  and the remaining viewports still run.

## Goal

Turn the evidence already recorded by the tutor and the review queue into one calm
page the learner can read, reachable from the learner navigation as "My progress".

## Audit findings that shape the design

- Evidence, progress, review items, checkpoints and final attempts all exist, but
  they are only ever read one lesson at a time. Nothing aggregates them.
- `GET /api/progress` returns raw rows, including workspace code. The summary must
  not do that: it returns derived totals only.
- `exam_attempts` stores the learner's answers and practical code. The summary may
  read the score and outcome, and must never return the stored answers or code.
- No new durable data is needed. Everything can be computed from existing rows, so
  this phase adds no migration.

## Presentation rules

- Plain labels only: Just started, Building confidence, Nearly secure, Secure.
- No school grade and no false precision. Percentages are not shown, counts are.
- Every status carries text, so colour is never the only signal.
- One course progress section, one readable module list, one needs another look
  section, one already strengthened section, one project section, one next action.
- Off-white, navy, dark purple and amber. No green. No em dashes.

## Backend checklist

- [x] `lib/summary.ts` computes everything from existing rows, as pure functions.
- [x] `app/api/summary/route.ts` serves `GET` for the authenticated learner only.
- [x] Everything is filtered to the learner's assigned course.
- [x] A request naming another learner is rejected.
- [x] Inputs are bounded and validated.
- [x] A new learner with no progress gets a complete, answerable response.
- [x] Partially completed and fully completed courses both work.
- [x] No code, answers, session information or private identifiers are returned.
- [x] No migration added, because no new durable data is required.

## Frontend checklist

- [x] "My progress" added to the learner navigation.
- [x] Course progress section with activities completed, checks passed and the
      most recent activity.
- [x] Readable module list with completion counts and a mastery label.
- [x] "Needs another look" section.
- [x] "Already strengthened" section.
- [x] Project progress section.
- [x] One specific next action.
- [x] Helpful empty state for a new learner.
- [x] Loading and failure states that never block the lessons.
- [x] Phones, tablets and laptops.
- [x] Keyboard reachable with visible focus and screen reader labels.

## Verification checklist

1. [x] A new learner sees a helpful empty state.
2. [x] A learner with partial progress sees correct totals.
3. [x] Completed activities are not counted twice.
4. [x] Module mastery is calculated correctly.
5. [x] Due review concepts appear in the correct section.
6. [x] Retired concepts no longer appear as weak.
7. [x] Independent corrections are counted correctly.
8. [x] The next recommended activity belongs to the learner's course.
9. [x] A second learner cannot access the first learner's summary.
10. [x] All four course groups work.
11. [x] The page fits at 320px, 768px and 1440px.
12. [x] Keyboard navigation and screen reader labels work.
13. [x] Type checks, linting, validators and the production build pass.
14. [x] Existing lessons, tutor nudges and cross lesson recall still work.

## Out of scope, recorded as the next phase

Guardian accounts and a guardian progress view. KidyCode has no guardian
authentication yet, so no parent dashboard is created here and no learner profile
is exposed through an insecure link.