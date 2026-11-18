# KidyCode V4 — implementation plan and risks (Phase 3 preparation)

Not yet implemented. This is the plan the owner is approving, written so that Phase 3 is mechanical.

## Shape of the change

V4 is a **presentation layer plus per-age composition**. It does not touch the curriculum, the assessment engine, the
progress store, or the security controls.

```
app/
  learn/page.tsx             → renders <LearnerExperience age="10-12" course={course10to12} />
  learn/13-15/page.tsx       → age="13-15"
  learn/16-18/page.tsx       → age="16-18"
  learn/adults/page.tsx      → age="adults"
  dashboard/page.tsx         → per-age dashboard that reads REAL progress, not demo zeros
components/learner/
  LearnerExperience.tsx      shared shell: routing between dashboard / lesson / practice / progress
  dashboard/                 AgeDashboard.tsx (A), StudioDashboard.tsx (B), WorkspaceDashboard.tsx (C), PlanDashboard.tsx (D)
  lesson/                    LessonBands.tsx   (the three-band wrapper)
  practice/                  PracticePane.tsx  (editor + preview + checks, per-age chrome)
  progress/                  ProgressView.tsx  (per-age)
  tokens/                    age.css  (four token sets, scoped by [data-age])
lib/learner-experience/
  dashboard-model.ts         builds a per-age view model from existing progress data
```

**Reused unchanged:** `lib/learning-experience.ts`, `lib/course-catalog.ts`, `lib/course-*.ts`, `lib/design-course.ts`,
`lib/assessment/*`, the progress and evidence APIs, `lib/admin-*`, and the six-moment engine in
`components/LessonJourney.tsx` (re-banded by the shell, not rewritten).

**What happens to `components/LearningApp.tsx` (1,594 lines):** split into the shared shell plus four presentational
components. The state machine, submission calls, hint logic and completion calls move across verbatim — this is a
mechanical decomposition, checked by the existing journey tests.

## Sequence

1. **Token layer.** Add the four palettes as scoped custom properties under `[data-age="…"]`, plus the type stacks.
   Add `docs/v4/palette-contrast.mjs` to `npm run check` so the palettes cannot silently regress. Nothing visible
   changes yet.
2. **Real progress on the dashboard.** Replace the demo-zero `learnerDashboard(courseId, { empty maps })` call in
   `app/dashboard/page.tsx` with the learner's actual completion state, then build the four dashboard variants on top.
   This is the single biggest win in the brief and it depends on existing data only.
3. **Lesson presentation.** Introduce the three-band shell, the metaphor illustration slot, the single hint control and
   the friendly-check rendering. Keep Notes / Practice / Check separation exactly as it is.
4. **Practice.** Editor + live preview + checks in one pane, per-age chrome. Mobile posture first (sticky action bar,
   30-character line budget, no horizontal scroll).
5. **Progress.** Per-age views over the same completion calculation the guardian summary and portfolio already use.
6. **Motion and accessibility pass.** 120–200 ms transitions, transform/opacity only, all disabled under
   `prefers-reduced-motion`; focus rings to the existing admin standard; 44 px minimum targets; AX-tree check on every
   age's three core screens.
7. **Regression and browser QA.** Details below.

## Tests

Existing suites must stay green (no exceptions): `npm run check` (typecheck + 20 validators + the four admin suites),
`npm run lint`, `npm run build`, `tests/v3/lesson-journey.test.mjs`, `tests/assessment/*`, `tests/certification/*`, and
the browser sweeps.

New regression tests to add:

- **Palette containment** — no banned hex (`#F7F3EA`, `#ECE5D8`, `#FFFDF8`, `#EE9D2B`, `#D6CDBC`, `#C84D42`) and no
  green in any learner stylesheet, per age.
- **Age isolation** — each `/learn/*` route renders its own token set and its own dashboard component (the audit's F1,
  turned into a test).
- **Per-age structure** — the 10–12 lesson renders at most three bands and exactly one hint control; the 16–18 lesson
  renders the file tree and terminal; the adult lesson renders no progress-game affordance.
- **Progress honesty** — the dashboard renders the learner's real counts; with no saved work it renders the empty
  states, never a fabricated figure or a fake "hours learned".
- **Gating untouched** — a lesson cannot be completed, and no credential issued, without meeting the existing
  requirements (a browser test that tries to skip practice).
- **Mobile** — no horizontal overflow at 320/360/390 px on the dashboard, lesson, practice and progress screens for all
  four ages (the audit measured overflow today at 390 px on the lesson screen).
- **Reduced motion** — with `prefers-reduced-motion: reduce`, no transition exceeds 0 ms on a completion event.

## Risks to existing functionality

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Splitting `LearningApp.tsx` breaks a submission or completion path | Progress, grades and certificates all depend on it | Mechanical extraction only; the existing journey and assessment suites must pass unchanged before any visual work merges |
| Per-age layouts diverge in behaviour | A fix applied to one age silently misses three | One shared shell owns behaviour; the four variants are presentational and are covered by the same journey test |
| Token scoping leaks into learner-facing routes that are not `/learn` (notes, studio, guardian) | Those surfaces were not part of this brief and must not shift | Tokens scoped to `[data-age]` on the experience wrapper only; the shared `app/globals.css` warm palette is left in place until a separate decision moves it |
| Dashboard starts reading progress it was never given | Could expose another learner's record | Read through the existing learner-session path and the existing completion calculation only; no new query, no new endpoint |
| Motion causes jank on low-end Android | The brief prioritises mobile | Transform/opacity only, 120–200 ms, no layout-triggering animation; measured in the browser sweep |
| The redesign is judged on feels rather than evidence | Owner has already rejected two palette directions | This phase is the gate: no implementation until the owner approves the sheets |

## Explicit non-goals

- Not touching the curriculum, assessment banks, pass marks or the certificate path.
- Not merging into `main`, not deploying to production, not changing auth secrets or database records.
- Not applying the new palettes to the admin console beyond the gold refinement, and not changing any admin layout.
- Not rewriting the marketing/landing page in this phase, though the audit flags it (F6) as the next candidate.

## Definition of done for Phase 3 (when approved)

Implemented, tested, and visually verified: four recognisably different experiences; palettes contained by test; real
progress on the dashboard; the difficult-concept sequence applied to the ten concepts listed in `04-concepts.md`;
mobile verified at 320/360/390 px on all four ages; reduced-motion honoured; all existing suites green; screenshots at
desktop and mobile for each age attached for review. Until that exists, this work is a design proposal and will be
reported as such.
