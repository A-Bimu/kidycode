# KidyCode V3 remaining content, ages 13 to 15 report

Status: **implementation complete and committed on `wt/t_4dfecfe7`; not a validated release, no
production deployment, no PR opened or merged.**

Base: approved source `curriculum/v3-content-only` at `dd83d50dbe1775f202448d664e6f906025e08735`,
stacked on the ages 10 to 12 batch commit `d900f59` so the four sequential batches stay cumulative
and merge without a conflict. Scope: `docs/v3/remaining-content-execution.md`, the ages 13 to 15
batch gate and issue #8.

## Currently doing

Nothing. The batch stopped after the remaining ages 13 to 15 challenge scripts, the widened gate,
the course checks and the build.

## How the batch was started

The dispatcher created this worktree on `main` (`83ebf6d`), which does not carry the V3 content
series. The branch was moved to the approved source and then fast-forwarded onto the ages 10 to 12
batch: `git merge --ff-only wt/t_17351437` took `wt/t_4dfecfe7` from `83ebf6d` to `d900f59`, which
is `dd83d50` plus the parent batch. The parent branch is therefore an ancestor of this one, so this
branch is a superset and the reviewer can read the two batches as one history. Only the parent's
committed content was taken; nothing was rebased, reset or amended.

## What eligibility means for this course

The ages 13 to 15 catalogue is 48 activities: 8 modules, each with 4 challenge lessons, 1 project
and 1 quiz. The batch began at a verified 13 of 48 scripted activities.

The eligibility decision made in the previous batch was checked again rather than assumed, and it
holds unchanged:

- **Challenge lessons are eligible.** They carry one concept, typed starter code, automatic `tests`,
  exactly three graduated hints and a quick-check question, which is what the six moments and the
  mastery gate consume.
- **Quiz activities are not eligible.** A quiz has `editableFiles: []`, no `tests`, no starter code
  and five questions instead of one, with its own completion rule (`quizPassed` alone). A six-moment
  narrative with a fresh task would contradict that contract rather than improve it.
- **Project lessons are not eligible either, for now.** A project completes on a written reflection
  alone (`projectReflectionMinimum`), is the continuous-project checkpoint of its module, and its
  Task is already an integration brief rather than one concept.

So the batch converts the 19 remaining challenge lessons and deliberately leaves the 8 projects and
8 quizzes unscripted. That is 32 challenge activities eligible and complete, out of 48.

## Completed

### 1. Nineteen new scripts, one module per language area

New content lives in four modules, each exported through `teenPathwayScripts` and spread into
`lessonScripts`, so the presenter, the contract checker and the course gate keep seeing one list and
a reviewer reads one area at a time.

| Module | Scripts | Lessons |
|--------|---------|---------|
| `lib/lesson-scripts-teen-html.ts` | 7 | landmarks, links, image description, form labels, input types, grouped choices, status messages |
| `lib/lesson-scripts-teen-css.ts` | 4 | selectors, box model, interactive states, fluid width |
| `lib/lesson-scripts-teen-javascript.ts` | 4 | calculated output, element references, form submit, validation |
| `lib/lesson-scripts-teen-quality.ts` | 4 | debugging from evidence, accessibility audit, public credit, release note |

Each script carries the six moments, wording written for a 13 to 15 year old (a named page, a
symptom that can be seen in the preview, one decision per step), guided and independent wording for
a learner who overrides the level, a project step that names how the continuous website changes, an
independent fresh task with its own starter, its own checks and its own worked solution, and two
misconception-specific hints whose detectors are proved against a sample and against the correct
answer. The register is deliberately different from the ages 10 to 12 batch: these lessons talk
about testing, evidence, limits and public pages, which is the material of the quality module.

### 2. Coverage, exactly

| Course | Scripted | Of | Before this batch |
|--------|----------|-----|-------------------|
| ages 10 to 12 | 32 | 48 | 32 |
| ages 13 to 15 | 32 | 48 | 13 |
| ages 16 to 18 | 10 | 48 | 10 |
| adults | 13 | 48 | 13 |
| **all four courses** | **87** | **192** | 68 |

The 16 unscripted ages 13 to 15 activities are the 8 projects and the 8 quizzes, rendered by the V2
interface unchanged. No other course changed. Coverage is printed by the validator and asserted as
partial by the journey test, so "all 48" cannot be claimed by accident.

### 3. Gate changes

`scripts/validate-lesson-scripts.mjs` now requires 65 scripts, the 56 age-pathway scripts and the 19
new lesson ids, and reads the four new modules for the em-dash and banned-colour checks. The journey
test's ages 13 to 15 coverage baseline rises from 9 to 32, and the new batch is added to the pathway
list so its six moments, its three guidance levels, its unique wording, its misconception detectors
and its presenter resolution are all proved. No assertion was weakened: the independence rule (fresh
task checks differ from the lesson's checks and its starter differs from the lesson's starter), the
two-misconception minimum, the worked-solution and starter checks, and the three-guidance-level rule
all apply to the new scripts unchanged.

## Checks run (this worktree, Windows 11, Node v24.14.1)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass, exit 0 |
| `npm run lint` | pass, exit 0, no errors and no warnings |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 65 scripts, 87 course and companion mappings, 137 misconception detectors, coverage 32/32/10/13 = 87 of 192 |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **34 checks, 0 failed** |
| `npm run check` (full chain) | pass, exit 0 |
| `bash scripts/sites-env.sh -- ./node_modules/.bin/vinext build` then `node scripts/validate-build.mjs` | pass: Worker bundle, assets, Sites metadata and all migrations |

The linked worktree had no `node_modules`, so one junction to the main checkout's `node_modules` was
created (gitignored, nothing committed). It is the local environment for the checks, not a change to
the repository.

## Blocked or unverified

- **The 8 projects and 8 quizzes are not scripted.** This is the deliberate eligibility finding
  above, not an omission, but it means ages 13 to 15 is not "48 of 48".
- **No browser pass was run in this batch.** The named batch checks were the source validator,
  TypeScript, lint, the journey tests and the build, and all passed. The journey test proves that
  every new lesson resolves through `scriptFor` and `journeyEnabledFor`, which is the presenter's
  data path, and the shared presenter was browser-verified in the phase-3 batch
  (`scripts/browser-journey-v3.py`). The 19 new lessons were not themselves driven in a browser, and
  a physical device and a screen reader were not exercised either.
- **The misconception detectors are still text patterns over the learner's file.** Each is proved not
  to fire on the correct answer, but a commented-out or unused line could still trigger one. The same
  holds for the fresh-task checks: they prove code shape, not understanding.
- **`npm run test:e2e` and the single-command `npm run build` were not run.** A linked worktree on
  Windows needs the two build steps run directly, which is what the table above shows.
- **No PR was opened and nothing was pushed.** The batch commits locally and stops.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Remaining incomplete lessons

- ages 13 to 15: 8 projects and 8 quizzes (16 activities), unscripted by decision.
- ages 10 to 12: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- ages 16 to 18: 38 activities, the next batch.
- adults: 35 activities, the last batch.

## Next step

The ages 16 to 18 batch continues from this commit, and the same eligibility question should be asked
per course. That course is `advanced: true`, so its project lessons carry a heavier brief and its
quiz banks differ; the project and quiz decision should be re-read against that shape rather than
copied.

## Recommendation

Review the 19 scripts module by module, and in particular check that each fresh task is genuinely a
different scenario from the lesson it belongs to rather than the worked example restated. The wording
is original text written for this batch; nothing was reused from another curriculum.

## User action

Optional. To see one of the new lessons, run the dev server with the journey flag on, open the
Practical Web Development course and choose any challenge lesson that previously had no script, for
example `ages-13-15-forms-groups` or `ages-13-15-quality-release`.
