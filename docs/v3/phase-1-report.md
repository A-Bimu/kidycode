# KidyCode V3 - Phase 1 report

Phase gate: research and audit, required by `docs/v3/phase-plan.md` to pass before Phase 2.
Repository: `A-Bimu/kidycode`. Base commit: `c560fede07357fd354e037dde1ae64e14f876bf3`
(branch `plan/v3-hermes-learning-experience`). Work done in the isolated worktree
`wt/t_4f640c80` at `C:\Users\USER\kidycode\.worktrees\t_4f640c80`.

## Currently doing

Nothing. Phase 1 is complete and stopped at the gate. No product code, no UI, no route and no
course content was changed, as the brief requires.

## Completed (with commit)

Artifact commit: `4c33d38` - "docs(v3-p1): source research, curriculum audit, lesson blueprint and
three reference lessons".

| Deliverable required by the phase plan | Path | Evidence |
|---------------------------------------|------|----------|
| Source research matrix | `docs/v3/research-matrix.md` | Five sources (Code Club, Code.org CS Discoveries, freeCodeCamp, Scratch, The Odin Project), each URL HTTP-status checked on 2026-10-26, each licence read on the publisher's own page or package metadata, each with an explicit KidyCode implication |
| Curriculum audit of all four bundles | `docs/v3/curriculum-audit.md` | Read `lib/course.ts` (495 lines), `lib/pathway-course.ts` (397), `lib/course-13-15.ts`, `lib/course-16-18.ts`, `lib/course-adults.ts`, `lib/course-catalog.ts`, `lib/course-factory.ts`, `lib/learning-experience.ts`, `app/dashboard/page.tsx`, `app/notes/page.tsx`, `app/practice/page.tsx`, `components/LearningApp.tsx`, `scripts/validate-full-course.mjs`, `scripts/validate-learning-interface.mjs`. Module by module inventory with line numbers, eight-dimension scoring, top ten difficult concepts by risk, six structural gaps |
| Lesson blueprint | `docs/v3/lesson-blueprint.md` | `LessonScript` data model beside the existing `Lesson` type, six-moment flow mapped onto the existing three interface steps, guided/balanced/independent modes, four register variants, mastery gate, explicit list of contracts that must not change |
| Original HTML heading script | `docs/v3/reference-lessons/html-heading.md` | Conceptual model, worked example, six common wrong answers with detection, three staged hints, independent challenge, mastery evidence, project progression, four age variants |
| Original CSS Flexbox script | `docs/v3/reference-lessons/css-flexbox.md` | Same structure; cites `css-layout-flex` (`lib/course.ts:413`) and the pathway `flex` lesson (`lib/pathway-course.ts:286`) |
| Original JavaScript loops script | `docs/v3/reference-lessons/javascript-loops.md` | Same structure; the difficult-concept example, with a behavioural mastery gate because the audit found its checks are the easiest to satisfy without understanding |

Measured facts recorded, all read from source rather than estimated: four coding courses, eight
modules each, six activities per module in the order challenge x4, project, quiz, 48 activities
per course and 192 across the four, 32 project checkpoints, 40 final-exam questions, 40
module-quiz questions, three project choices, three practical-exam patterns, pass mark 7 of 10.

Checks run in this phase: **none, and that is correct for this gate.** Phase 1 changed no product
code, so `npm run check`, `npm run lint` and `npm run build` were not run; the phase plan reserves
them for Phase 3. The repository's own gate scripts were read to record what the existing
contracts already enforce, and the line numbers cited above come from that reading.

## Blocked or unverified

1. **No gate script was executed.** `node_modules` is absent in this worktree, so `tsc --noEmit`
   and the validator chain could not run even if it were useful to run them. This is a statement
   about Phase 1 scope, not a failure: the deliverable is evidence.
2. **No browser observation.** Every quality rating in the audit is a reading of source, not an
   observation of the running interface.
3. **freeCodeCamp curriculum licence, README route.** The current repository `README.md` leaves
   its curriculum licence bullet truncated at "copyright (c) 2014 freeCodeCamp.org" and names no
   licence. The licence was verified instead from the published package metadata for
   `@freecodecamp/curriculum` (`"license":"(BSD-3-Clause AND CC-BY-SA-4.0)"`). Recorded in the
   matrix as verified via package metadata and unverified via the README.
4. **Code.org page naming has moved on.** `https://code.org/en-US/curriculum/computer-science-discoveries`
   still returns 200, but the page now presents "AI Discoveries" as the 2026-27 course and
   describes CS Discoveries as remaining accessible rather than actively maintained. Recorded as
   a caveat, not treated as a broken source.
5. **No licence was verified for anything not listed in the research matrix.** All other material
   remains all rights reserved.

Nothing here was worked around by claiming success. The one place where the brief's instruction
differs from the source is recorded plainly: the phase plan's baseline URL
`https://projects.raspberrypi.org/Raspberry/codeclub` resolves (200) and is used, and the
Raspberry Pi Foundation licence page that governs it was read live at
`https://www.raspberrypi.org/creative-commons/`.

## Next step

Phase 2, and only after this phase's artifacts are reviewed and accepted. Phase 2 must build the
isolated lesson presenter described in `docs/v3/lesson-blueprint.md`, behind a feature flag, and
prove it on the three reference lessons (one HTML, one CSS, one JavaScript) before any content
conversion widens. The card that owns Phase 2 is `KidyCode V3 P2 - guided lesson experience and
sample modules`.

## Recommendation

Accept Phase 1 with one condition worth acting on before Phase 2 widens: fix the check-quality
problem the audit found. Two of the three reference lessons exist because the current automatic
checks match source text, not behaviour, which means a learner can satisfy every required pattern
while the loop is placed outside the loop body or the flex rule is on the wrong element
(`docs/v3/curriculum-audit.md`, gap 4, and the common-wrong-answer tables in the reference
lessons). The recommended order for Phase 2 is:

1. present the reference lessons through the new presenter, with the behavioural mastery step in
   place, using the existing checks unchanged so nothing regresses;
2. only then consider widening the checks, in a separate task, so that a check never has to be
   changed at the same time as a lesson is converted.

## User action (if any)

1. Review the four artifacts at commit `4c33d38` and either accept the gate or return specific
   changes.
2. Decide whether Phase 2 may proceed on `wt/t_4f640c80` or should branch from `4c33d38`
   separately, since the Phase 2 card names its own worktree.
3. Note that no production deployment, no production migration, no PR merge and no child data
   were touched, and that security PR #3 remains a separate release gate.
