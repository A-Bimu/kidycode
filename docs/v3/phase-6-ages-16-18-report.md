# KidyCode V3 remaining content, ages 16 to 18 report

Status: **implementation complete and committed on `wt/t_8d0c7980`; not a validated release, no
production deployment, no PR opened or merged.**

Base: approved source `curriculum/v3-content-only` at `dd83d50dbe1775f202448d664e6f906025e08735`,
stacked on the ages 13 to 15 batch commit `37e876b` so the four sequential batches stay cumulative
and merge without a conflict. Scope: `docs/v3/remaining-content-execution.md`, the ages 16 to 18
batch gate and issue #8.

## Currently doing

Nothing. The batch stopped after the remaining ages 16 to 18 challenge scripts, the widened gate,
the course checks, the build, the end to end journeys and a browser pass over eight of the new
lessons.

## How the batch was started

The dispatcher created this worktree on `main` (`83ebf6d`), which does not carry the V3 content
series. The branch was moved onto the approved source and then fast-forwarded onto the ages 13 to 15
batch: `git merge --ff-only wt/t_4dfecfe7` took `wt/t_8d0c7980` from `83ebf6d` to `37e876b`, which
is `dd83d50` plus both parent batches. The parent branches are therefore ancestors of this one, so
this branch is a superset and the reviewer can read the three batches as one history. Only the
parent's committed content was taken; nothing was rebased, reset or amended.

The linked worktree had no `node_modules`, so one junction to the main checkout's `node_modules` was
created (gitignored, nothing committed). It is the local environment for the checks, not a change to
the repository.

## What eligibility means for this course

The ages 16 to 18 catalogue is 48 activities: 8 modules, each with 4 challenge lessons, 1 project
and 1 quiz. The batch began at a verified **10 of 48** scripted activities. The course is
`advanced: true`, so the eligibility question was re-read against this course rather than copied,
and the answer is the same but the reasons differ where the contract differs:

- **Challenge lessons are eligible.** They carry one concept, typed starter code, automatic `tests`,
  exactly three graduated hints and a quick-check question, which is what the six moments and the
  mastery gate consume.
- **Quiz activities are not eligible.** A quiz has `editableFiles: []`, no `tests`, no starter code
  and five questions instead of one, with its own completion rule (`quizPassed` alone). The advanced
  quiz banks are larger but the contract is unchanged, so a six-moment narrative would contradict it.
- **Project lessons are not eligible either, for now.** A project completes on a written reflection
  alone (`projectReflectionMinimum`), is the continuous-project checkpoint of its module, and its
  Task is already an integration brief rather than one concept. The advanced project brief is longer
  and names stored state and a fetch request, which is more integration, not less.

So the batch converts the 22 remaining challenge lessons and deliberately leaves the 8 projects and
8 quizzes unscripted. That is 32 challenge activities eligible and complete, out of 48.

## Completed

### 1. Twenty two new scripts, one module per language area

New content lives in four modules, each exported through `developerRemainingScripts` and spread into
`lessonScripts`, so the presenter, the contract checker and the course gate keep seeing one list and
a reviewer reads one area at a time.

| Module | Scripts | Lessons |
|--------|---------|---------|
| `lib/lesson-scripts-developer-html.ts` | 7 | page regions, navigation links, document metadata, labels, input types, grouped choices, validation and status messages |
| `lib/lesson-scripts-developer-css.ts` | 6 | selectors, box model, named design values, interactive states, fluid width, breakpoint |
| `lib/lesson-scripts-developer-javascript.ts` | 6 | sorting a copy, update by id, delete by derivation, the asynchronous request, the failure path with cleanup, the stale result guard |
| `lib/lesson-scripts-developer-quality.ts` | 3 | debugging from evidence, the accessibility audit, the release note |

The register is deliberately different from the younger batches: a repeated literal value is treated
as a maintenance defect, a mutation as a defect with a symptom, a request that reports an error
status as a normal outcome that has to be refused by hand, an out of order response as a real failure
mode a visitor will meet when they type quickly, and a release note as an honest boundary. The named
concepts in the card (state, asynchronous failures, code quality, debugging, the secure DOM) are all
carried: state in the update and delete lessons and in the loading lesson's descendants, asynchronous
failure in the request, catch and stale result lessons, code quality and debugging in the quality
module, and the untrusted DOM is already covered by the existing `quality-security` script and is
referred to rather than restated.

Each script carries the six moments, guided and independent wording for a learner who overrides the
level, a project step that names how the continuous website changes, an independent fresh task with
its own starter, its own checks and its own worked solution, and two misconception-specific hints
whose detectors are proved against a sample and against the correct answer.

### 2. Coverage, exactly

| Course | Scripted | Of | Before this batch |
|--------|----------|-----|-------------------|
| ages 10 to 12 | 32 | 48 | 32 |
| ages 13 to 15 | 32 | 48 | 32 |
| ages 16 to 18 | 32 | 48 | 10 |
| adults | 13 | 48 | 13 |
| **all four courses** | **109** | **192** | 87 |

The 16 unscripted ages 16 to 18 activities are the 8 projects and the 8 quizzes, rendered by the V2
interface unchanged. No other course changed. Coverage is printed by the validator and asserted as
partial by the journey test, so "all 48" cannot be claimed by accident.

### 3. Gate changes

`scripts/validate-lesson-scripts.mjs` now requires 87 scripts, the 78 age-pathway scripts, the 22
new lesson ids and the new batch count, and reads the five new files for the em-dash and banned-colour
checks. The journey test's ages 16 to 18 coverage baseline rises from 6 to 32, and the new batch is
added to the pathway list so its six moments, its three guidance levels, its unique wording, its
misconception detectors and its presenter resolution are all proved. No assertion was weakened: the
independence rule (fresh task checks differ from the lesson's checks and its starter differs from the
lesson's starter), the two-misconception minimum, the worked-solution and starter checks, the
three-guidance-level rule and the unique-wording rule all apply to the new scripts unchanged.

## Checks run (this worktree, Windows 11, Node v24.14.1)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass, exit 0 |
| `npm run lint` | pass, exit 0, no errors and no warnings |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 87 scripts, 109 course and companion mappings, 181 misconception detectors, coverage 32/32/32/13 = 109 of 192 |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **34 checks, 0 failed** |
| `npm run check` (full chain, 26 validators and test files) | pass, exit 0 |
| `npm run build` (vinext build plus `validate-build.mjs`) | pass: Worker bundle, assets, Sites metadata and all migrations |
| `npm run test:e2e` against a dev server on port 3210 | **11 of 12 journeys pass**; see the caveat below |
| `python scripts/browser-journey-v3.py` | pass: **142 checks, 0 failed, 8 screens audited** on the ages 13 to 15 sample |
| Browser pass over 8 of the new ages 16 to 18 lessons | pass: **120 checks, 0 failed, 16 screens audited** |

The e2e run needed a local D1 first: `node --no-warnings scripts/seed-local-pilot.mjs` applied every
migration and seeded the pilot institution, after which `e2e-tutor`, `e2e-guardian-db`,
`e2e-portfolio`, `e2e-lifecycle`, `e2e-transfer-races`, `e2e-assessment-api`, `e2e-assessment-revision`,
`e2e-assessment-defence`, `e2e-payload-leak`, `e2e-certification` and `e2e-dry-runs` all exit 0.

**One e2e caveat, environmental rather than content related.** Running `e2e-all.sh` in a single pass
trips the transfer claim rate limit: `scripts/e2e-tutor.mjs` deliberately exhausts the per-source
claim limit (it asserts a 429 for the offending source), and `e2e-lifecycle.mjs` then claims from the
same source and is refused. Clearing `transfer_claim_limits` and re-running the suite from
`e2e-guardian-db` onwards makes every journey pass, which is how the eleven passes above were
obtained. No file changed by this batch is involved in that path.

The browser pass over the new lessons drove one lesson from each module (page regions, form status
messages, named design values, fluid width, sorting a copy, removal by id, the stale result guard and
debugging from evidence) with a real seeded learner at 1440 and 320 pixels. For each it proved the
six-moment rail renders and names the concept, the course default guidance is independent, choosing
guided changes the on-screen wording and stores the per-lesson override, every control is labelled,
there is no horizontal overflow, no heading order break, and one h1 and one main region.

## Blocked or unverified

- **The 8 projects and 8 quizzes are not scripted.** This is the deliberate eligibility finding above,
  not an omission, but it means ages 16 to 18 is not "48 of 48".
- **Not every new lesson was driven in a browser, and no physical device or screen reader was used.**
  Eight of the 22 new lessons were browser-checked, one per module. The remaining fourteen resolve
  through the same presenter and are covered by the validator and the journey test rather than by a
  browser. The mastery task itself was not completed in the browser, because the journey shows the
  mastery card only after the lesson's own check passes; its behaviour is proved against real data by
  the journey test ("every fresh task fails on its starter and passes on its worked solution").
- **The misconception detectors are still text patterns over the learner's file.** Each is proved not
  to fire on the correct answer, but a commented-out or unused line could still trigger one. The same
  holds for the fresh-task checks: they prove code shape, not understanding. A learner can satisfy
  the checks for the request lesson without understanding why `response.ok` exists.
- **The e2e suite is not green in a single unbroken pass** for the rate-limit reason above.
- **No PR was opened and nothing was pushed.** The batch commits locally and stops.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Remaining incomplete lessons

- ages 16 to 18: 8 projects and 8 quizzes (16 activities), unscripted by decision.
- ages 13 to 15: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- ages 10 to 12: 8 projects and 8 quizzes (16 activities), unscripted by the same decision.
- adults: 35 activities, the last batch, which also begins at 13 of 48.

## Next step

The adults batch continues from this commit. That course is `balanced` by default and its remaining
35 activities include more challenge lessons than the three batches above, so the same eligibility
question should be asked per course and the counts should be inventoried before any content is
written.

## Recommendation

Review the 22 scripts module by module, and in particular check that each fresh task is genuinely a
different scenario from the lesson it belongs to rather than the worked example restated, and that the
asynchronous lessons describe failure states the interface actually has rather than states the code
alone can reach. The wording is original text written for this batch; nothing was reused from another
curriculum.

## User action

Optional. To see one of the new lessons, run the dev server with the journey flag on, open the Web
Application Development course and choose any challenge lesson that previously had no script, for
example `ages-16-18-quality-debug` or `ages-16-18-interaction-abort` (the last two modules unlock once
the earlier modules are complete).
