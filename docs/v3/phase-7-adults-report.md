# KidyCode V3 remaining content, adults report

Status: **implementation complete and committed on `wt/t_fc990716`; a draft review PR is opened, and
nothing is merged, deployed or piloted.**

Base: approved source `curriculum/v3-content-only` at `dd83d50dbe1775f202448d664e6f906025e08735`,
stacked on the ages 16 to 18 batch commit `47b3b83` so the four sequential batches stay cumulative
and merge without a conflict. Scope: `docs/v3/remaining-content-execution.md`, the adults batch gate
and issue #8.

## Currently doing

Nothing. The batch stopped after the remaining adults challenge scripts, the widened gate, the course
checks, the build, the end to end suite, a browser pass over every new lesson at two widths and the
cross-course journey.

## How the batch was started

The dispatcher created this worktree on `main` (`83ebf6d`), which does not carry the V3 content
series. The branch was fast-forwarded onto the ages 16 to 18 batch: `git merge --ff-only wt/t_8d0c7980`
took `wt/t_fc990716` from `83ebf6d` to `47b3b83`, which is `dd83d50` plus all three parent batches.
The parent branches are therefore ancestors of this one, so this branch is a superset and the reviewer
can read the four batches as one history. Only the parent's committed content was taken; nothing was
rebased, reset or amended.

The linked worktree had no `node_modules`, so one junction to the main checkout's `node_modules` was
created (gitignored, nothing committed). It is the local environment for the checks, not a change to
the repository.

## What eligibility means for this course

The adults catalogue is 48 activities: 8 modules, each with 4 challenge lessons, 1 project and 1 quiz.
The batch began at a verified **13 of 48** scripted activities. The course is `advanced: false`, so the
eligibility question was re-read against this course rather than copied:

- **Challenge lessons are eligible.** They carry one concept, typed starter code, automatic `tests`,
  exactly three graduated hints and a quick-check question, which is what the six moments and the
  mastery gate consume.
- **Quiz activities are not eligible.** A quiz has `editableFiles: []`, no `tests`, no starter code and
  five questions instead of one, with its own completion rule (`quizPassed` alone), so a six-moment
  narrative would contradict it.
- **Project lessons are not eligible either, for now.** A project completes on a written reflection
  alone (`projectReflectionMinimum`), is the continuous-project checkpoint of its module, and its Task
  is already an integration brief rather than one concept.

Nineteen challenge lessons remained unscripted, so the batch converts those and deliberately leaves the
8 projects and 8 quizzes unscripted. That is 32 challenge activities eligible and complete, out of 48,
matching the other three courses.

## Completed

### 1. Nineteen new scripts, one module per language area

New content lives in four modules, each exported through `practicalRemainingScripts` and spread into
`lessonScripts`, so the presenter, the contract checker and the course gate keep seeing one list and a
reviewer reads one area at a time.

| Module | Scripts | Lessons |
|--------|---------|---------|
| `lib/lesson-scripts-practical-html.ts` | 6 | page regions, navigation links, image description, input types, grouped choices, help and status messages |
| `lib/lesson-scripts-practical-css.ts` | 5 | selectors, named design values, interactive states, fluid width, breakpoint |
| `lib/lesson-scripts-practical-javascript.ts` | 5 | a two-outcome decision, the result written into the DOM, stored element references, the submission handler, one saved preference |
| `lib/lesson-scripts-practical-quality.ts` | 3 | debugging from evidence, a safe public credit, the release note |

The register is deliberately business facing, not younger-batch wording: a clinic homepage, a booking
form with seats and an email, a pricing page, a newsletter form, a search area and a shared portfolio.
A repeated design value is treated as a maintenance defect, a broad element rule and a component class
rule are distinguished, a fixed pixel width is a defect, a first visit's `null` from `getItem` is a real
case, and a limitation in a release note is information rather than an admission.

Each script carries the six moments with guided, balanced and independent wording, a project step that
names how the continuous website changes, an independent fresh task with its own starter, its own
checks and its own worked solution, and two misconception-specific hints whose detectors are proved
against a sample and against the correct answer.

### 2. Coverage, exactly

| Course | Scripted | Of | Before this batch |
|--------|----------|-----|-------------------|
| ages 10 to 12 | 32 | 48 | 32 |
| ages 13 to 15 | 32 | 48 | 32 |
| ages 16 to 18 | 32 | 48 | 32 |
| adults | 32 | 48 | 13 |
| **all four courses** | **128** | **192** | 109 |

The 16 unscripted adults activities are the 8 projects and the 8 quizzes, rendered by the V2 interface
unchanged. No other course changed. Coverage is printed by the validator and asserted as partial by the
journey test, so "all 48" cannot be claimed by accident.

### 3. Gate changes

`scripts/validate-lesson-scripts.mjs` now requires 106 scripts, the 97 age-pathway scripts, the 19 new
lesson ids and the new batch count, and reads the five new files for the em-dash and banned-colour
checks. The journey test's adults coverage baseline rises from 9 to 32, and the new batch is added to
the pathway list so its six moments, its three guidance levels, its unique wording, its misconception
detectors and its presenter resolution are all proved. No assertion was weakened: the independence rule
(fresh task checks differ from the lesson's checks and its starter differs from the lesson's starter),
the two-misconception minimum, the worked-solution and starter checks, the three-guidance-level rule and
the unique-wording rule all apply to the new scripts unchanged.

## Checks run (this worktree, Windows 11, Node v24.14.1)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass, exit 0 |
| `npm run lint` | pass, exit 0, no errors and no warnings |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 106 scripts, 128 course and companion mappings, 219 misconception detectors, coverage 32/32/32/32 = 128 of 192 |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **34 checks, 0 failed** |
| `npm run check` (full chain, 26 validators and test files) | pass, exit 0 |
| `npm run build` (vinext build plus `validate-build.mjs`) | pass: Worker bundle, assets, Sites metadata and all migrations |
| `npm run test:e2e` against a local D1 | pass, exit 0: every journey green in a single unbroken pass this run |
| `python scripts/browser-adults-sweep.py` | pass: **532 checks, 0 failed, 38 screens audited** across all 19 new lessons at 1440 and 320px |
| `python scripts/browser-journey-v3.py` | pass: **142 checks, 0 failed, 8 screens audited** on the cross-course samples |

The e2e run needed a local D1 first: `node --no-warnings scripts/seed-local-pilot.mjs` applied every
migration and seeded the pilot institution. Unlike the ages 16 to 18 batch, `e2e-all.sh` completed in a
single pass here, including `e2e-tutor` and `e2e-lifecycle`, so the transfer claim rate limit did not
bite; the eleven-suite caveat from the previous report is environmental and did not reproduce.

The new sweep drives every one of the 19 new adults lessons with a real seeded learner at 1440 and
320 pixels. For each it proves the six-moment rail renders and names the concept, the course default
guidance is balanced, choosing guided changes the stored per-lesson override, the hook names what the
learner will make, every control is labelled, there is no horizontal overflow, no green, one h1, one
main and no heading-order break, and the tab order reaches the journey controls with an accessible name
on every stop.

## Blocked or unverified

- **The 8 projects and 8 quizzes are not scripted.** This is the deliberate eligibility finding above,
  not an omission, but it means adults is not "48 of 48".
- **The mastery task itself was not completed in a browser.** The sweep opens each lesson and audits the
  notes screen; the mastery card appears only after the lesson's own check passes, so its behaviour is
  proved against real data by the journey test ("every fresh task fails on its starter and passes on its
  worked solution") rather than by a click-through.
- **No physical device or screen reader was used.** The keyboard and responsive checks run in headless
  Chrome through the real input pipeline and device-metrics override.
- **The misconception detectors are still text patterns over the learner's file.** Each is proved not to
  fire on the correct answer, but a commented-out or unused line could still trigger one. The fresh-task
  checks prove code shape, not understanding.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Remaining incomplete lessons

- adults: 8 projects and 8 quizzes (16 activities), unscripted by decision.
- ages 16 to 18: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- ages 13 to 15: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- ages 10 to 12: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- 64 of 192 activities across the catalogue remain unscripted, all of them quizzes and projects.

## Next step

The four content batches are complete. The remaining work is the review itself: read the 19 scripts
module by module and confirm that each fresh task is genuinely a different scenario from its lesson and
that the business register reads as written for an adult rather than a younger learner. A draft review
PR is open and must not be merged, deployed or piloted; the independent security gate (issue #9)
remains blocked and no auth, security, institution or guardian route was touched.

## Recommendation

Review the four modules in this order: `practical-html`, `practical-css`, `practical-javascript`,
`practical-quality`. Check in particular that the two misconception hints for each lesson name the wrong
turn rather than the finished answer, and that the fresh task starters differ from the lesson starters in
more than whitespace. The wording is original text written for this batch; nothing was reused from
another curriculum.

## User action

Optional. To see one of the new lessons, run the dev server with the journey flag on, open the Web
Skills for Work and Business course and choose any challenge lesson that previously had no script, for
example `adults-structure-landmarks` or `adults-quality-release` (the last two modules unlock once the
earlier modules are complete).
