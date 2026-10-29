# KidyCode V3 remaining content, ages 10 to 12 report

Status: **implementation complete and committed on `wt/t_17351437`; not a validated release, no
production deployment, no PR opened or merged.**

Base: approved source `curriculum/v3-content-only` at `dd83d50dbe1775f202448d664e6f906025e08735`.
Scope: `docs/v3/remaining-content-execution.md` and the ages 10 to 12 batch gate.

## Currently doing

Nothing. The batch stopped after the remaining ages 10 to 12 challenge scripts, the widened gate,
the course checks and the build.

## What "truly eligible" turned out to mean

The ages 10 to 12 catalogue is 48 activities: 8 modules, each with 4 challenge lessons, 1 project
and 1 quiz. The batch began at a verified 11 of 48 scripted activities, and all eleven were
challenges.

Determining eligibility first, rather than scripting all 48, changed the result:

- **Challenge lessons are eligible.** They carry one concept, typed starter code, automatic
  `tests`, exactly three graduated hints and a quick-check question, which is exactly what the six
  moments and the mastery gate consume.
- **Quiz activities are not eligible for the six-moment journey.** A quiz has `editableFiles: []`,
  no `tests`, no starter code and five questions instead of one, and its own completion rule
  (`completionGate` completes it on `quizPassed` alone). A six-moment narrative with a fresh task
  would contradict that contract rather than improve it, so quizzes keep their assessment
  presentation.
- **Project lessons are not eligible either, for now.** A project lesson completes on a written
  reflection alone (`projectReflectionMinimum`), is the continuous-project checkpoint, and its
  "Task" already is an integration brief rather than one concept. Folding it into the same
  six-moment script would double the transfer moment and blur the checkpoint, so projects keep
  their own presentation until a project-specific journey is designed.

So the batch converts the 21 remaining challenge lessons and deliberately leaves the 8 projects and
8 quizzes unscripted. That is 32 challenge activities eligible and complete, out of 48.

## Completed

### 1. Twenty one new scripts, one module per language area

New content lives in four modules and is spread into `guidedPathwayScripts`, so the presenter, the
contract checker and the course gate keep seeing one list and a reviewer reads one area at a time.

| Module | Scripts | Lessons |
|--------|---------|---------|
| `lib/lesson-scripts-guided-html.ts` | 6 | elements, lists, links, images, semantics, forms |
| `lib/lesson-scripts-guided-css.ts` | 5 | rules, type, cards, box model, media query |
| `lib/lesson-scripts-guided-javascript.ts` | 6 | output, types, comparison, select, toggle, form input |
| `lib/lesson-scripts-guided-quality.ts` | 4 | repair HTML, repair syntax, accessibility, safe note |

Each script carries the six moments, guided wording written for a ten to twelve year old (short
sentences, the learner's own page as the example, one change at a time), balanced and independent
wording for a learner who overrides the level, a project step that names how the continuous website
changes, an independent fresh task with its own starter, its own checks and its own worked
solution, and two misconception-specific hints with a detector proved against a sample and against
the correct answer.

### 2. Coverage, exactly

| Course | Scripted | Of | Before this batch |
|--------|----------|-----|-------------------|
| ages 10 to 12 | 32 | 48 | 11 |
| ages 13 to 15 | 13 | 48 | 13 |
| ages 16 to 18 | 10 | 48 | 10 |
| adults | 13 | 48 | 13 |
| **all four courses** | **68** | **192** | 47 |

The 16 unscripted ages 10 to 12 activities are the 8 projects and the 8 quizzes, rendered by the V2
interface unchanged. No other course changed. Coverage is printed by the validator and asserted as
partial by the journey test, so "all 48" cannot be claimed by accident.

### 3. Gate changes

`scripts/validate-lesson-scripts.mjs` now requires 46 scripts, the 37 age-pathway scripts and the 21
new lesson ids, and reads the four new modules for the em-dash and banned-colour checks. The journey
test's ages 10 to 12 coverage baseline rises from 7 to 32. No assertion was weakened: the
independence rule (fresh task checks differ from the lesson's checks and its starter differs from
the lesson's starter), the two-misconception minimum, the worked-solution and starter checks, and
the three-guidance-level rule all apply to the new scripts unchanged.

## Checks run (this worktree, Windows 11, Node v24.14.1)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass, exit 0 |
| `npm run lint` | pass, exit 0, no errors and no warnings |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 46 scripts, 68 course and companion mappings, 99 misconception detectors, coverage 32/13/10/13 = 68 of 192 |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **34 checks, 0 failed** |
| `npm run check` (full chain) | pass, exit 0 |
| `bash scripts/sites-env.sh -- ./node_modules/.bin/vinext build` then `node scripts/validate-build.mjs` | pass: Worker bundle, assets, Sites metadata and all migrations |

## Blocked or unverified

- **The 8 projects and 8 quizzes are not scripted.** This is the deliberate eligibility finding
  above, not an omission, but it means ages 10 to 12 is not "48 of 48".
- **No browser pass was run in this batch.** The named batch checks were the source validator,
  TypeScript, lint and tests, and all passed. The shared presenter was browser-verified in the
  phase-3 batch (`scripts/browser-journey-v3.py`, 142 checks) and these scripts are additive data
  consumed by the same presenter, but the 21 new lessons were not themselves driven in a browser. A
  physical device and a screen reader were not exercised either.
- **The misconception detectors are still text patterns over the learner's file.** Each is proved
  not to fire on the correct answer, but a commented-out or unused line could still trigger one. The
  same holds for the fresh-task checks: they prove code shape, not understanding.
- **`npm run test:e2e` and the single-command `npm run build` were not run.** A linked worktree on
  Windows needs the two build steps run directly, which is what the table above shows.
- **No PR was opened.** The batch commits locally and stops; pushing or opening a draft PR was not
  part of the card and is left to the reviewer.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Next step

The ages 13 to 15 batch (`t_4dfecfe7`) continues from this commit, and the same eligibility question
should be asked per course: convert the challenge lessons, and decide separately whether a project
journey is worth designing and whether quizzes should ever take the six moments.

## Recommendation

Review the 21 scripts module by module, and in particular check that each fresh task is genuinely a
different scenario and not the worked example restated. The wording is original text written for
this batch; nothing was reused from another curriculum.

## User action

Optional. To see one of the new lessons, run the dev server with the journey flag on, open the ages
10 to 12 course and choose any challenge lesson that previously had no script, for example
`html-content-forms` or `quality-access`.
