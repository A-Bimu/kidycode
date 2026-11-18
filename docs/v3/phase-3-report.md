# KidyCode V3 Phase 3 report - tests and release candidate

Status: **release candidate verified locally; not a release.** Draft review PR only. No merge, no
deployment, no production database change, no child data, no access to minors.
Base: `1842b48` (Phase 2) on `9aeb125` (Phase 1) on the approved source
`c560fede07357fd354e037dde1ae64e14f876bf3`. Worktree: `wt/t_31cba5cd`.

## Currently doing

Nothing. Phase 3 stopped after the full gate, the new behavioural checks and the draft review PR.

## Completed

### 1. Gate, run in this worktree on Windows 11 with Node v24.14.1

| Command | Result |
|---------|--------|
| `npm ci` | clean install from `package-lock.json` |
| `npm run check` | exit 0. `tsc --noEmit` clean, every existing validator and unit suite passed, plus the new 24-check journey suite |
| `npm run lint` | exit 0, no errors and no warnings |
| `npm run build` | exit 0, production build complete; Worker bundle, marketing assets, Sites metadata and all migrations validated |
| `npm run test:e2e` (local server) | exit 0, 209 checks, 0 failed: tutor 74, guardian database 14, portfolio 14, lifecycle 9, transfer races 6, assessment API 13, revision 8, defence 10, payload leak 12, certification 17, dry runs 32 (the institution role assertions run inside the dry-run suite) |
| `python scripts/browser-journey-v3.py 320 768 1440` | exit 0, 114 checks, 0 failed, 6 screens audited |

No assertion was weakened, skipped or removed. Every new check is additive: the two files that can
fail a gate (`package.json`, the new test file) only gain commands.

### 2. New automated behaviour checks, `tests/v3/lesson-journey.test.mjs` (24 checks, in `npm run check`)

The pacing and gate rules were extracted from the components into `lib/lesson-journey.ts` so the same
code that drives the interface is the code under test. The components now call those rules instead of
restating them, which the suite asserts statically as well.

- **Hint ordering and pacing**: guided opens help only after one attempt, independent after two,
  balanced immediately, and a lesson without a script keeps the V2 pacing. Every scripted lesson's
  hints are distinct and are revealed `0,1,...,n-1` and then stay on the last one; an empty hint list
  cannot produce a negative index.
- **Guided focus**: guided shows exactly one requirement, the first one that failed when a check has
  run, otherwise the first still to do. Balanced and independent show the whole list.
- **Mastery gate**: a scripted challenge cannot complete without the fresh task, a twelve-character
  reflection, passed code and a passed quick check, in every combination; a lesson without a script
  keeps the V2 rule; project and quiz lessons keep their own rules; a scripted project lesson still
  needs the fresh task on the completion button.
- **Error recovery**: every fresh task fails on its starter and passes on its worked solution, a
  partially repaired file credits only the repaired requirement, an invalid check pattern fails
  closed instead of throwing, preview errors are deduplicated, ordered newest-last and capped, and a
  loop bug (`textContent = item`) fails exactly its own requirement until it is repaired.
- **Guidance override**: each register gets its documented default (10 to 12 guided, 13 to 15 and
  adults balanced, 16 to 18 independent), a learner override is stored per lesson and wins over the
  default, it does not leak to another lesson, and a corrupt or blocked storage API falls back to the
  course default without throwing.
- **Wiring**: `LearningApp.tsx` uses `completionGate`, `completionButtonReady`, `hintGateOpen` and
  `nextHintIndex`; `LessonJourney.tsx` uses `evaluateMasteryChecks` and `visibleRequirements`.

### 3. Browser journey, `scripts/browser-journey-v3.py` (`npm run test:browser:journey`)

Local-only headless Chrome over CDP, its own profile and port, against the local dev server. It seeds
real learners through the real API and local D1, then drives the interface.

- **HTML sample (`ages-13-15`, headings)** at 320, 768 and 1440 pixels: the six-moment rail and its
  concept, the three guidance modes, the hook naming what the learner makes, the guided override
  stored in `localStorage` and surviving a reload, one requirement at a time, the hint gate closed
  before an attempt and open after it, hints 1 to 3 revealed in order and never past the end, the
  repair passing every requirement, the fresh task failing on its starter and passing on the repair,
  the quick check graded, completion blocked until the fresh task and the reflection, and the lesson
  saving and advancing to the next one.
- **JavaScript sample (`ages-10-12`, loops)**: a real `ReferenceError` from the preview is reported
  in the alert panel, clears after the repair, the repaired code passes all four requirements, the
  fresh task reports its own runtime error and clears it, all five fresh-task checks pass, and the
  lesson completes.
- **Layout audit** on each screen at each width: no horizontal overflow, no green in the computed
  palette, exactly one `h1` and one `main`, no skipped heading level, every control labelled, no em
  dash.

### 4. Defect found and fixed: the two-section-heading requirement could not be passed

The V3 HTML sample sits inside the V2 lesson `ages-13-15-structure-headings`, whose second
requirement was `(?:<h2[\s>][\s\S]*</h2>){2}`. That repetition requires the two `h2` elements to be
literally adjacent, so a correct outline failed:

- `<h1>Library</h1>\n<h2>New resources</h2>\n<h2>Popular topics</h2>` failed the check.
- `<section><h2>New resources</h2></section><section><h2>Popular topics</h2></section>` failed too.
- Only `<h2>a</h2><h2>b</h2>` with no whitespace passed.

The lesson therefore could not be completed from the V3 journey, because the practice never reached
`codePassed` and the quick check step never unlocked. The pattern is now
`(?:<h2[\s>][\s\S]*?</h2>[\s\S]*?){2}`, which still fails the starter, one heading and unclosed
headings, and passes both real outline styles. A regression test covers all five cases. The change is
in `lib/pathway-course.ts:256` and is recorded here as a deliberate V2 content change, because a
requirement that no correct answer can satisfy is not behaviour worth preserving.

### 5. Harness defect found and fixed: the local seed migrated the wrong database

`scripts/seed-local-pilot.mjs` picked the first `*.sqlite` under the Miniflare D1 directory. On a
fresh worktree with current Miniflare, that is `metadata.sqlite` (Miniflare's bookkeeping), while the
application database is the hash-named file beside it. The seed reported success and every API call
then failed with `no such table: learner_profiles`, which blocked `npm run test:e2e` entirely. The
script now selects the application file explicitly.

### 6. Files changed

- `lib/lesson-journey.ts`: the extracted pacing, gate, fresh-task and error-recovery rules.
- `components/LearningApp.tsx`: uses the extracted rules; behaviour unchanged.
- `components/LessonJourney.tsx`: uses the extracted rules; behaviour unchanged.
- `lib/pathway-course.ts`: the two-section-heading requirement fix.
- `tests/v3/lesson-journey.test.mjs`: 24 new checks.
- `scripts/browser-journey-v3.py`: the browser journey harness.
- `scripts/seed-local-pilot.mjs`: the local database locator fix.
- `package.json`: `check` runs the new suite; `test:browser:journey` added.
- `docs/v3/phase-3-report.md`: this report.

## Blocked or unverified

- **Security PR #3 is still the release gate.** Authentication and institutional data isolation have
  not been independently verified in this phase. No child pilot until that is done.
- **No real device or assistive-technology pass.** The journey is observed in headless Chrome at
  three widths. A physical phone, tablet, iOS Safari, and a screen reader were not exercised.
- **The tutor was exercised against the local server only**, including its offline fallback; the
  deployed tutor and any provider cost were not observed. The `$20` allocation remains policy, not a
  measured cap.
- **The guidance override lives in `localStorage` per lesson**: it does not follow a learner across
  devices, and the storage-blocked path is proved by unit test rather than in a browser.
- **The reflection gate is length-based** (twelve characters). It requires a sentence but cannot
  judge whether the sentence is meaningful; educator review is the only real check.
- **Only three lessons are scripted.** Every other lesson still renders the V2 interface, unchanged
  and untested for the new journey.
- **A second unsatisfiable V2 requirement was found and deliberately left alone**: in the
  `objects` lesson (`lib/pathway-course.ts:318`), `(?:title\s*:){2}` and `(?:category\s*:){2}`
  require the two property names to be adjacent, so a realistic two-object answer fails. It blocks
  that lesson, it is outside the three Phase 2 samples, and changing it is a separate reviewed
  decision. Recommended fix, proved by hand: `(?:title\s*:[\s\S]*?){2}` and
  `(?:category\s*:[\s\S]*?){2}`. A related brittle pattern is
  `lib/pathway-course.ts:160`, where `(?:<article[\s>][\s\S]*?</article>\s*){3}` only allows
  whitespace between articles.
- **Repeat local e2e runs need `transfer_claim_limits` cleared** after a run inside the same ten
  minutes; this is the documented rate limit, not a product failure.

## Next step

1. Review this draft PR and the two defects above.
2. Decide whether the `objects` and `articles` patterns are fixed in a separate, small PR with their
   own regression checks.
3. Run the educator review of the three sample scripts, then a supervised pilot with the feature flag
   on for those lessons only.
4. Keep security PR #3 separate and blocking.

## Recommendation

Ship the journey behind the existing flag, which already renders only for lessons that have a script,
and only after the security gate clears. Start the systematic conversion of the rest of
the catalogue with the check-pattern audit above, because two lesson requirements have now been shown
to be unpassable as written.

## User action

None required to continue. A draft PR is open for review; nothing was merged, deployed or applied to
a production database.
