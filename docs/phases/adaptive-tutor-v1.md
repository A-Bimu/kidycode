# Adaptive Tutor V1

Status: implemented, verified and pushed. The live deployment step is blocked,
see Deployment below.

## Audit of the existing product (before any change)

- The learning flow was already three steps inside one lesson: notes, practice
  and quick check, with the module check as its own activity. The required
  learner flow (notes, example, practice, quick check, completion) therefore maps
  onto the existing steps plus the completion bar, and no flow was rebuilt.
- `components/LearningApp.tsx` renders everything the learner sees. Notes and
  practice were already separate screens.
- Hints existed as three static strings per lesson and lived only in component
  state. Nothing was recorded on the server.
- Code checks ran twice: locally in `checkWork()` for instant display, and
  authoritatively on the server in `app/api/progress/route.ts`. Completion was
  already server graded, so no browser pass result was trusted.
- Progression gating already existed: `previousActivityIsComplete` on the server
  plus the locked rail in the interface.
- Storage was Cloudflare D1 through Drizzle, with `learner_profiles`,
  `course_progress`, `project_checkpoints` and `exam_attempts`. There was no
  mastery or evidence table.
- Baseline before any change: `npm run check`, `npm run lint` and `npm run build`
  all passed, and all four course routes rendered.

## Phase checklist

The working checklist lives in this file. Every item below was required by the
phase brief and every item is now done and verified.

## Backend work completed

- `drizzle/0003_closed_winter_soldier.sql` adds `lesson_evidence` and
  `tutor_interventions`. The migration is additive only.
- `db/schema.ts` describes both tables so Drizzle and the migration agree.
- `lib/tutor.ts` holds the tutor engine: server grading, concept detection,
  graduated support, mastery rules and acknowledgement. It has no database or
  browser access, so it can be reasoned about and tested on its own.
- `lib/tutor-concepts.ts` holds the concept rules for the older pathways.
- Together the rules cover all 576 requirement labels across the four courses
  with no label falling back to a generic reply.
- `lib/evidence.ts` holds the D1 reads and writes. The update statement itself
  enforces the safety rules:
  - `MAX` on mastery, completed checks and best module score, so a value can
    never fall.
  - `MIN` on additive counters with a ceiling, so attempts and hints cannot run
    away.
  - `COALESCE` on the code pass, the quick check pass and the completion
    timestamp, so a milestone is written once.
- `app/api/tutor/route.ts` serves `GET` (the learner's own evidence, filtered to
  their course) and `POST` with four actions: `nudge`, `check`, `quickcheck`
  and `quiz`. All four are graded on the server.
- The lesson must belong to the learner's course, otherwise 403. Progression is
  enforced server side, otherwise 409. Fields are validated with `zod` and
  bounded: lesson id 160 characters, each workspace file 20,000 characters, quiz
  answers at most five values in range.
- Tutoring history stores requirement labels, concept names, levels, counts and
  timestamps. No learner code is stored anywhere in the tutor tables.
- `app/api/progress/route.ts` records completion evidence through the same
  guards, and autosaved drafts deliberately do not count as attempts.

## Frontend work completed

- "Give me a nudge" during practice, which becomes "Another nudge" on later
  requests, in a tutor panel beside the editor.
- The learner's current focus area is shown, taken from recorded evidence.
- Completed checks are shown as a count such as "1 of 2 checks passed", and the
  module percentage readout was removed.
- A failed code check names the exact requirement and then gives the smallest
  useful hint for it. A pass acknowledges the specific concept demonstrated.
- The quick check and the module check now report the idea that was missed.
- Notes and practice remain separate screens.
- Tutor buttons carry their own busy state and the label changes while a request
  is running, so a slow tutor is visible rather than silent.
- If the tutor is unavailable, the message says so and the lesson's own hints
  and the whole completion path keep working. Progress is never gated on the
  tutor.
- Phone, tablet and laptop layouts verified at 320px, 768px and 1440px.

## Design rules

- No green anywhere. This is asserted in the validators and checked against
  computed styles in the browser.
- Off-white, navy, dark purple and amber only, using the existing tokens.
- No em dashes in interface copy or in the new code.
- The tutor speaks to the requirement, not to the learner's age.
- Origami art is untouched and still separate elements.
- The one new animation is a short, subtle rise on a new message, and the global
  reduced motion rule disables it. Verified with a reduced motion browser run.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Curriculum validator | `scripts/validate-full-course.mjs` | Pass, 4 courses and 192 activities |
| Tutor engine validator | `scripts/validate-tutor.mjs` | Pass, 576 requirements |
| Interface validator | `scripts/validate-learning-interface.mjs` | Pass |
| Backend validator | `scripts/validate-backend.mjs` | Pass |
| Static validator | `scripts/validate-static.mjs` | Pass |
| Lint | `npm run lint` | Pass, no warnings |
| Production build | `npm run build` | Pass |
| End to end API journey | `scripts/e2e-tutor.mjs` | 27 of 27 checks passed |
| Browser journey, 3 viewports | Playwright, 320px, 768px, 1440px | 91 of 91 checks passed |

What the end to end API run proved against a real server and a real D1 store:

- All four course routes and the marketing page load.
- A learner is created and receives a session; an unauthenticated tutor request
  is refused.
- A lesson from another pathway is refused with 403, and oversized or unknown
  fields are refused with 400.
- Wrong code produces a nudge at level 1, then level 2, then level 3 with a small
  related example, each message different from the last.
- Correct code is accepted, the concept is acknowledged, and the requirement
  leaves the struggle list.
- Repeating the same successful submission three times leaves mastery and
  completed checks unchanged.
- The quick check is graded on the server and moves mastery.
- An independent correction is recorded when the learner fixes the problem after
  support, and it is only counted once.
- Completion records a timestamp and a repeat completion leaves it untouched.
- A locked lesson is refused. Progress and mastery survive a reload.
- A second learner sees none of the first learner's evidence or progress.
- A direct SQLite read of both tutor tables found no markup and no learner code,
  only requirement labels, concepts, counts and timestamps.

What the browser run proved, at all three widths:

- The start screen, notes and practice each fit without sideways scrolling.
- Notes and practice never appear together, and the tutor does not crowd the
  start screen.
- The nudge offer is present, becomes "Another nudge", and never guesses before
  the learner submits anything.
- Tab reaches the nudge button and shows a visible focus marker.
- A deliberately slowed tutor makes the busy state observable and the button is
  disabled while it runs.
- Wrong code names the requirement, correct code acknowledges the concept, and
  the completed check count rises immediately.
- A wrong quick check answer receives a real explanation, the correct one
  completes the lesson, and the next lesson opens while later ones stay locked.
- After a reload the completed lesson is still marked done and the learner
  resumes at the next lesson.
- No green appears in any computed colour, and no em dash appears in the copy.
- With reduced motion the tutor animation duration is effectively zero.

Screenshots from the browser run are in `C:/Users/USER/.kidycode-e2e/shots`.

## Database migration status

`drizzle/0003_closed_winter_soldier.sql` adds two tables and two indexes. It is
additive and safe on existing data. It is committed and included in the Sites
build output. It has been applied and exercised against a local D1 store. It has
not been applied to the live deployment, because deployment itself is blocked.

## Deployment

Blocked, and this is the one genuine blocker in the phase.

- The live address `kidycode.anne-tte.chatgpt.site` is an OpenAI Sites project
  (`appgprj_6a98887f77288191989dabfcd079fede` per `.openai/hosting.json`). This
  machine has no Sites deployment tooling and no Sites credentials, and the live
  site answers 401 with a ChatGPT sign in wall, so it cannot be smoke tested
  without an authenticated ChatGPT session.
- The alternative path, `vinext deploy` to Cloudflare Workers, requires
  `wrangler login`. `wrangler whoami` reports "You are not authenticated", and no
  Cloudflare token is present in the environment.
- There is no CI workflow in the repository, so a GitHub push does not trigger a
  deployment either.

Everything that can be verified without those credentials has been verified,
including the production build and a full local end to end journey against real
D1 tables.

## Environment notes discovered

- `npm run dev` and `npm run start` set `WRANGLER_LOG_PATH` with Unix shell
  syntax, which fails under the Windows `cmd.exe` script runner. Run
  `node_modules/.bin/vinext dev` from Git Bash instead.
- `vinext start` cannot run outside a Workers runtime on this machine: the built
  bundle imports `cloudflare:workers`, which Node cannot resolve. `vinext dev`
  provides the real local D1 binding and is the way to test end to end.
- Wrangler resolves its local D1 state relative to its configuration file, so a
  project level configuration is needed to seed the store the dev server uses.
  The temporary configuration used for this was removed before committing.