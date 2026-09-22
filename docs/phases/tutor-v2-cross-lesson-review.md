# Tutor V2: cross lesson review

Status: implemented, verified and pushed. The live deployment step is still
blocked, see the Adaptive Tutor V1 phase record.

## Audit finding that chose this phase

Adaptive Tutor V1 records evidence well but nothing carries it past the lesson it
came from:

- `lesson_evidence.struggle_json` is per lesson, and a concept is deleted from it
  the moment the learner passes that requirement, so a weak concept is forgotten
  as soon as the lesson ends.
- No table or endpoint answers "what did this learner get wrong earlier and has
  never shown again since".
- Nothing in the interface ever returns to an earlier concept, so a learner who
  struggled in Module 1 meets it again for the first time in the final check.

That makes the recorded evidence dead weight after the lesson closes. This phase
makes it do pedagogical work.

## Scope

In scope:

- A durable per learner record of weak concepts that outlives the lesson.
- A spaced review queue that returns the oldest and most repeated weaknesses
  first, limited to a small number of items so it never crowds a lesson.
- One small recall card, shown before new notes, with the smallest hint available
  and a two answer outcome that is recorded.
- Retirement only after the learner recalls the concept twice, so one lucky
  answer does not clear it.

Out of scope for this phase (next phase candidates):

- A learner and parent facing progress summary page.
- Adaptive reordering of the curriculum itself.

## Backend checklist

- [x] `drizzle/0004_*.sql` adds `concept_review`. Additive only.
- [x] `db/schema.ts` describes the table so Drizzle and the migration agree.
- [x] The table is scoped to the learner, cascades on profile delete, and holds
      only requirement labels, concept keys and counts. Never learner code.
- [x] `lib/review.ts` records a failure, records an in lesson recovery, lists due
      reviews for one learner, and records a review outcome.
- [x] `app/api/review/route.ts` serves `GET` (own due reviews, filtered to the
      learner's course) and `POST` (record an outcome).
- [x] Fields validated and bounded with zod.
- [x] One learner cannot read or write another learner's review records.
- [x] The tutor route feeds failures and recoveries into the queue.
- [x] Completion feeds recoveries into the queue.
- [x] A concept is retired only after two successful recalls.
- [x] Repeated reviews cannot inflate anything: counts are bounded and streaks
      only advance on a recorded recall.

## Frontend checklist

- [x] One recall card on the notes screen, above new material, showing a single
      item at a time with a progress count.
- [x] Two actions: "I can do this" and "Show me again".
- [x] "Show me again" reveals the smallest hint for that concept and re-queues it.
- [x] The card disappears completely when there is nothing due.
- [x] Buttons disable while a request is processing.
- [x] A failing review request never blocks notes or the rest of the lesson.
- [x] Fits at 320px, 768px and desktop.
- [x] Keyboard reachable with a visible focus marker and an announced status.

## Design rules

- [x] No green.
- [x] Off-white, navy, dark purple and amber only.
- [x] No em dashes in interface copy.
- [x] Not childish, and origami art untouched.
- [x] Animation subtle and disabled by reduced motion.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Curriculum validator | `scripts/validate-full-course.mjs` | Pass |
| Tutor engine and review validator | `scripts/validate-tutor.mjs` | Pass, 576 requirements |
| Interface validator | `scripts/validate-learning-interface.mjs` | Pass |
| Backend validator | `scripts/validate-backend.mjs` | Pass |
| Static validator | `scripts/validate-static.mjs` | Pass |
| Lint | `npm run lint` | Pass, no warnings |
| Production build | `npm run build` | Pass, `/api/review` present |
| End to end API journey | `scripts/e2e-tutor.mjs` | 34 of 34 checks passed |
| Browser journey, 3 viewports | Playwright, 320px, 768px, 1440px | 112 of 112 checks passed |

What the review journey proved against a real server and a real D1 store:

- A missed requirement is queued with its concept key, requirement label, origin
  lesson and failure count.
- Passing the requirement in its own lesson records the recovery but does not
  retire it.
- One successful recall keeps it queued at streak one, and a second recall
  retires it so it stops appearing.
- A missed recall resets the streak and raises the failure count while keeping
  the concept queued.
- An unknown concept is refused with 403, and empty, oversized or wrongly typed
  fields are refused with 400.
- A second learner sees none of the first learner's review items.
- A direct SQLite read of `concept_review` found requirement labels, concept keys
  and counts only, with no learner code and no markup.

What the browser run proved at all three widths:

- A new learner sees no recall card at all.
- After a real mistake, the card appears on the notes screen above new material
  with a focus area, its origin lesson and a revisit count.
- The hint is not shown until it is asked for, and the smallest hint then appears.
- A missed recall states that the concept stays on the list and the card clears.
- The outcome is announced through an `aria-live` region that survives the card
  being removed.
- The learner can carry on to practice and complete the lesson without ever
  answering a review, so the card is never a gate.
- The card and the notes fit without sideways scrolling at 320px.

## Verification checklist

- [x] All four course routes still load.
- [x] Notes, examples, practice, nudges and assessments still appear.
- [x] A failed requirement creates a review item that survives the lesson.
- [x] Passing the requirement in its own lesson does not retire it.
- [x] Two successful recalls retire it, and it stops appearing.
- [x] A failed recall keeps it queued and raises its failure count.
- [x] Review items are limited so they cannot crowd a lesson.
- [x] One learner cannot see another learner's review items.
- [x] No learner code is stored.
- [x] No green and no em dash.
- [x] Production build passes.
- [x] Push succeeds.
