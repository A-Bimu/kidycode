# KidyCode V3 Phase 3 (four age pathways) report

Status: **phase implementation complete and committed on `wt/t_1400cf55`; not a validated release.**
Base: approved source `fix/v3-assessment-correctness` at `8a12ac6b5aa80affcb5d57d23df141acfdf903fd`, taken
forward through P1 and P2 (P2 is `e2ec425` on `wt/t_490b5fde`; the sixteen new scripts sit on top of it,
because the P2 batch is not on `8a12ac6` itself).
Commit: `55c2317`.
No production deployment, no PR merge, no institution code, no child data, no curriculum rewrite.

## Currently doing

Nothing. The phase stopped after the age-pathway batches, the widened gate, the keyboard journey and
the repeated browser pass.

## Completed

Scope from the card: expand the scripted V3 journey across the catalogue in sensible batches with an
individual coverage report, no claim of all 192 if incomplete; age-appropriate examples and guidance
for 10 to 12, 13 to 15, 16 to 18 and adults; a responsive and keyboard tested pass; validate saved
progress and independent mastery; preserve the existing architecture.

### 1. Four age-pathway batches, sixteen scripts, one module each

Exactly as the P2 handoff asked: the new content lives in its own modules and is spread into
`lessonScripts` beside `difficultConceptScripts`. `lib/lesson-scripts.ts` is touched only to add the
four imports and the four spreads, so the collision-hotspot array stays reviewable.

| Pathway (default register) | Module | Lessons scripted |
|----------------------------|--------|------------------|
| ages 10 to 12 (guided) | `lib/lesson-scripts-guided-pathways.ts` | nesting a section, reusing a class, choosing with if and else, responding to a click |
| ages 13 to 15 (balanced) | `lib/lesson-scripts-creative-pathways.ts` | a 640px breakpoint, named design values, choosing an outcome, saving and restoring a preference |
| ages 16 to 18 (independent) | `lib/lesson-scripts-developer-pathways.ts` | a pure function, one source of application state, loading and empty states, untrusted text |
| adults (balanced) | `lib/lesson-scripts-practical-pathways.ts` | connected labels, an accessibility audit, the box model, validating input |

**Age-appropriate wording is proved, not asserted.** Every stage of every new script names wording for
all three guidance levels, so a learner who overrides the level is never silently handed the lead line
of another register. The gate fails if a stage is missing a mode or if a stage repeats its own wording.
The wording itself is written for the register: short sentences and "your page" for 10 to 12, design
decisions for 13 to 15, an engineering vocabulary for 16 to 18, and a working context for adults.

### 2. The gate and the coverage report

`scripts/validate-lesson-scripts.mjs` now asserts the script count (25), the twenty-five required
primary lesson ids, a per-course age-pathway minimum of four primary scripts, and all three modes on
all six moments for the sixteen new scripts. The em-dash and banned-colour checks read all six script
modules rather than the first two.

Coverage is printed as evidence, never as a claim of completeness:

| Course | Scripted activities | Of | Before this phase |
|--------|--------------------|-----|-------------------|
| ages 10 to 12 | 11 | 48 | 7 |
| ages 13 to 15 | 13 | 48 | 9 |
| ages 16 to 18 | 10 | 48 | 6 |
| adults | 13 | 48 | 9 |
| **all four courses** | **47** | **192** | 31 |

145 activities are still unscripted and render the V2 interface unchanged. The journey test asserts
that coverage stays partial, so "all 192" cannot be claimed by accident.

### 3. Misconception hints and independent mastery

The thirty-two new detectors carry two per script. Each is proved twice by the gate and the test: it
must match its own `detectableExample` and must not fire on the script's `workedSolution`. The
existing independence rule now covers all twenty-five scripts for free, because it iterates the whole
list: a fresh task's starter differs from the lesson's own starter for every file it checks, and its
requirement list is not the lesson's list.

### 4. Saved progress

The completion rule was not touched. `completionGate` still requires the checked code, the passed
quick check, the fresh mastery task and a written reflection for a scripted lesson, and
`completionButtonReady` still withholds the button until the fresh task passes. The browser journey
re-proved it end to end on the headings lesson: the button is disabled with a failed fresh task,
still disabled after the repair and before the reflection, and unlocks only after the reflection, at
which point the lesson saves and advances. The keyboard pass then selected the guidance mode with
Space and confirmed the per-lesson override was written to `localStorage`, which is the same key the
presenter reads back after a reload.

### 5. Responsive and keyboard pass, in a real browser

`scripts/browser-journey-v3.py` drives local headless Chrome over CDP, seeds real learners through the
real API and local D1, and now includes a keyboard-only journey. Two harness defects were found and
fixed in the process:

- the Chrome profile directory was shared, so a second worktree running the harness made the first
  Chrome exit before exposing a debugging port. The profile is now per CDP port.
- the new accessible-name check ignored the wrapping label, so it reported the guidance radios as
  unnamed when they are in fact named by the `<label>` element that wraps them. The check now uses the
  same wrapping-label rule the layout audit already used.

## Checks run (all on this worktree, Windows 11, Node v24.14.1)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass |
| `npm run check` (full chain) | pass, exit 0, no assertion weakened |
| `npm run lint` | pass, exit 0, no errors and no warnings |
| `bash scripts/sites-env.sh -- ../../node_modules/.bin/vinext build` then `node scripts/validate-build.mjs` | pass: Worker bundle, assets, Sites metadata and all migrations |
| `node --import tsx scripts/validate-lesson-scripts.mjs` | pass: 25 scripts, 47 course and companion mappings, 57 misconception detectors, coverage 11/13/10/13 = 47 of 192 |
| `node --import tsx --no-warnings tests/v3/lesson-journey.test.mjs` | pass: **34 checks, 0 failed** (was 30; 4 added) |
| `python scripts/browser-journey-v3.py 320 768 1440` against the local dev server | pass: **142 checks, 0 failed, 8 screens audited** (was 114 before the keyboard pass) |

The browser pass covered the headings journey at 320, 768 and 1440 pixels, the JavaScript loops
journey, a keyboard journey at 1440 and at 320 pixels, and a layout audit on each screen: no
horizontal overflow, no green in the computed palette, exactly one `h1` and one `main`, no skipped
heading level, every control labelled, no em dash.

## Blocked or unverified

- **Coverage is partial.** 47 of 192 activities carry a script. The other 145 render the V2 interface,
  unchanged and untested for the new journey. This is a baseline for the next batch, not completeness.
- **No physical device and no assistive technology.** The journey is observed in headless Chrome at
  three widths, including a keyboard-only pass through the real key pipeline. A physical phone, iOS
  Safari and a screen reader were not exercised, so "keyboard tested" means the browser's own focus
  and key handling, not a screen reader announcement test.
- **`npm run build` still cannot run as a single command in a linked worktree.** `scripts/build-verified.sh`
  requires `${SITES_PROJECT_ROOT}/node_modules/.bin/vinext` and `npm run install:ci` needs Linux
  `flock`. The two steps were run directly with the repository's own installed `vinext` and passed.
  This is an environment limitation, not a code failure, but it is not the command the release gate names.
- **The misconception detectors are text patterns over the learner's file.** They can fire on a
  commented-out or unused line. They are tighter than the course checks (each is proved not to fire on
  the correct answer) but they are still not behavioural. The same holds for the new mastery checks.
- **The browser journey ran against a local dev server on a private port** (`3010`, because `3001` is
  held by a parallel worktree), with a local D1 store seeded by `scripts/seed-local-pilot.mjs`. No
  deployed environment, and no real learner data, was involved.
- **Repeat local e2e runs need `transfer_claim_limits` cleared** after a run inside the same ten
  minutes; this is the documented rate limit, not a product failure.
- `$20` model allocation was treated as policy, not a cap; cost was not read from the provider.

## Next step

Phase 3 remains open on coverage and on the release gates that are outside this card. The next batch
should continue from the 47-of-192 baseline, one module per pathway, and the same gate will refuse the
work if a stage loses a guidance level or a detector fires on a correct answer. The Security PR #3
gate still stands before any child pilot, and the educator review of the scripts has not happened.

## Recommendation

Review the sixteen scripts by pathway, module by module, and in particular check that the fresh tasks
are genuinely independent scenarios and not the lesson restated in new words. The wording is original
text written for this phase; nothing was reused from another curriculum.

## User action

Optional. To see one of the new lessons, run the dev server with the journey flag on, open any course,
and choose a lesson from the four tables above. To see the whole pass, run
`KIDYCODE_E2E_URL=http://localhost:<port> python scripts/browser-journey-v3.py 320 768 1440`.
