# KidyCode Assessment V2 plan

Starting SHA: `6aadc8cfeda203af9dc55eb3dcb00c90d6fbbefe` (local `main` equals `origin/main` at the
start of this work). Working tree clean. Nothing in V1 was rewritten.

This file is the resumable contract. Every phase updates the checklist at the bottom with its
commit SHA and observed gate result.

## 1. What V1 already had, and what is kept

| Area | V1 implementation | Decision |
| --- | --- | --- |
| Learner identity | `learner_profiles` + `kidycode_session` cookie, access key hashed with SHA-256 | Reused unchanged. Every new route authenticates through `authenticateLearner`. |
| Course catalogue | `lib/course-catalog.ts`, four bundles, eight modules each, 48 activities | Reused unchanged. Assessment content is keyed to the same course and module ids. |
| Lesson practice | Formative only, graded on the server in `app/api/progress/route.ts` | Unchanged. Practice never lowers an assessment mark. |
| Module quiz | Five questions inside the quiz activity, four correct opens the next module | Unchanged. It stays a lesson gate, not an assessment. |
| Evidence | `lesson_evidence` with monotonic counters and one-write milestone timestamps | Reused. Assessment adds no counter to it. |
| Weak concepts | `concept_review`, durable per concept, retired after two recalls | Reused as the single durable weakness register. Assessment misses are recorded into it through `recordConceptFailures`, so the tutor can revisit them. No second weakness store. |
| V1 final check | `exam_attempts`, ten questions plus one pattern-matched repair | Kept readable and untouched. Historical rows are never converted into an Assessment V2 certificate. |
| Completion record | `lib/completion.ts`, derived on read from existing rows | Kept and extended: course completion stays lessons plus module project versions plus the final gate; certification is a separate derived state. |
| Guardian access | `guardian_accounts`, `guardian_links`, strict allow-listed summary | Reused. The strict guardian summary gains one certification line and nothing else. |
| Transfer | `learner_transfer_codes` and the credential rotation | Unchanged. Assessment rows are learner-scoped, so a transfer keeps in-progress work. |
| Deletion | explicit owner-scoped delete in one transaction | Extended: the new tables are enumerated in the deletion list and prove zero rows afterwards. |
| Portfolio | `lib/portfolio.ts`, saved module versions and a preview | Kept. Assessment evidence is private and never enters the public portfolio view. |

## 2. Assessment model (locked)

Pass marks: module assessment 7/10 with at least 3/5 on the practical task; final applied
assessment 70/100 overall **and** at least 30/50 on the unseen independent build **and** every
mandatory safety, privacy and accessibility requirement **and** the independent-understanding
check. No timer, resumable, unlimited retakes after readiness work.

Outcomes. Internal stable values `passed`, `not_passed_yet`, `needs_verification`. Learner-facing
words only: `Passed`, `Not passed yet`, `Needs verification`.

Forms. Three reviewed equivalent forms per module (32 modules) and three per course final.
Equivalence is asserted mechanically against a blueprint: same objective coverage, same mark
totals, same task type counts, same difficulty profile. The server selects the form; the client
never sends a form, a mark, a pass flag or a course identity.

Grading. Knowledge questions and requirement checks are graded on the server from the content
definition. Code is graded by requirement with partial credit, using safe HTML parsing, CSS
declaration parsing and JavaScript token or AST checks. No `eval`, no `new Function`, no VM,
no executing learner code. A requirement that cannot be decided reliably yields
`needs_verification` for that attempt, never a guessed pass or fail.

Integrity signals. Counts only: visibility changes, paste events, largest paste character
count, project save times. Disclosed before the assessment starts, used only to choose which
defence task to show, capped, and never able to reduce a mark or fail a learner. No clipboard
contents, no keylogging, no camera, no AI detector.

## 3. Reused tables and the additive migration

Reused unchanged: `learner_profiles`, `course_progress`, `project_checkpoints`, `exam_attempts`,
`lesson_evidence`, `guardian_accounts`, `guardian_links`, `concept_review`,
`learner_transfer_codes`, `transfer_claim_limits`.

New, one additive migration `drizzle/0007_*.sql`, every learner-owned table cascading from
`learner_profiles`:

| Table | Purpose |
| --- | --- |
| `assessment_attempts` | One row per attempt. Course, module or final, form id, content version, status `in_progress`/`submitted`, autosaved draft, submitted answers and code, awarded marks, build marks, mandatory result, outcome, idempotency key, timestamps. Autosave never creates a second row and never counts as an attempt. |
| `assessment_item_results` | One row per graded item: item id, form id, content version, marks awarded and available, requirement-level detail, status, and the revision concept keys it maps to. Server only. |
| `assessment_defence` | The explain, predict and change tasks chosen for an attempt, the learner's responses, and the deterministic result of each task. |
| `assessment_signals` | Coarse counts only: visibility changes, paste events, largest paste length, project save timestamps. No content. |
| `assessment_credentials` | One private credential per learner and course, issued only when eligibility holds. Private credential id, level, skills list, issue date. |
| `assessment_revision_items` | The recovery queue derived from real rubric results: concept, label, lesson to revisit, source attempt, readiness gate result. |

`concept_review` receives the same missed concepts so the existing cross-lesson review keeps
working. There is no second weakness register.

## 4. Code layout

```
lib/assessment/
  types.ts          item, form, blueprint, attempt and outcome types
  blueprint.ts      the machine-readable coverage and equivalence blueprint
  engine.ts         pure scoring, outcome and selection logic, no database, no browser
  grading.ts        safe requirement checks: HTML, CSS, JavaScript
  bank/             reviewed content, one file per course: module forms and final forms
  briefs.ts         the unseen independent build briefs per course
  defence.ts        reviewed defence templates per course
  revision.ts       revision packs per concept
  reference-sheet.ts the built-in syntax reference allowed during assessment
  manifest.ts       the single registry every consumer reads
app/api/assessment/  route handlers: start, state, autosave, submit, defence, results,
                     revision, readiness, certificate
components/assessment/ the learner-facing screens, one job per screen
scripts/validate-assessment-*.mjs  content, blueprint, privacy and leakage validators
tests/assessment/*  pure engine, grading and bank tests run by the project's own check
```

## 5. Security and privacy boundaries

- Identity always from `authenticateLearner`; a learner id, attempt id, course id, mark or pass
  status in a body, query, path, cookie or browser storage is ignored or rejected.
- Cross-learner reads answer `404`; another learner's attempt is never returned.
- Guardian reads go through the existing active-link check and an allow list; a revoked link
  loses access immediately; no code, no answer text, no raw mark, no integrity signal, no
  credential id, no access key.
- The response to a submit contains corrections for the submitted form only, and never the
  unused forms or the answer key of an item the learner has not yet submitted.
- Every field is bounded by a zod schema; malformed bodies produce a bounded 400, never a 500.
- Submissions are idempotent: a repeat with the same idempotency key returns the stored result
  and moves no mark.
- Item ids and content versions are stored on every result, so a later content edit cannot
  silently change an old mark.
- Certificate and passport output is an allow list: first name, level, course title, project
  title, issue date, private credential id, demonstrated skills. No age, school, email,
  location, attempt count, raw mark, private identifier or project code.

## 6. Brand and interface rules, enforced mechanically

No green anywhere (decided from channel values, not a hex pattern). No em dashes in
learner-facing or marketing copy. Off-white, navy, dark purple and amber only. One job per
screen. Works at 320px, 768px and 1440px with no horizontal page scrolling. Text with every
status, colour never the only signal. Keyboard navigation, visible focus, sensible heading
order, labelled controls, screen-reader status announcements, reduced motion. The brand
validator and the browser sweep both assert these.

## 7. Phase checklist and gates

| Phase | Scope | Gate | Status |
| --- | --- | --- | --- |
| 0 | Audit, contract, safe scaffolding | Type check, lint, production build, all pre-existing tests | in progress |
| 1 | Engine, additive migration, secure persistence, server selection, idempotency | Schema and pure scoring tests, API authorisation and tamper tests, concurrency, deletion cascade, type check, lint, build | pending |
| 2 | Three equivalent module forms for all 32 modules, course by course | Content validation, answer verification, coverage report, assessment tests (one commit and push per course) | pending |
| 3 | Three equivalent final forms and three build briefs per course, safe grading, mandatory checks | Content validation, grading fixtures, cross-form equivalence, no answer leakage (one commit and push per course) | pending |
| 4 | Learner assessment interface: overview, reference, question, editor, review, submit, resume | Browser tests at 320/768/1440 for all four courses, keyboard, semantics, overflow, brand rules | pending |
| 5 | Results, revision packs, readiness, retakes | Failing and passing journeys per course, weak-topic mapping, form rotation, no immediate repeat, history privacy, mobile browser tests | pending |
| 6 | Independent-understanding check | Copied-output simulation, genuine change pass, failed change becomes Needs verification, no detector, no unsafe execution, privacy and browser tests | pending |
| 7 | Completion, certificate, private Skills Passport, strict guardian summary | Eligibility matrix, V1 compatibility, guardian authorisation, print layout, allow-list tests, deletion tests, viewport tests | pending |
| 8 | Whole-product regression and release candidate | Every validator, type check, lint with zero warnings, build, API, database, race and browser suites, payload leakage inspection, migration packaging, clean tree, remote equals local | pending |

## 8. Phase records

### Phase 0

Baseline before any change, from this working tree at `6aadc8c`:

- `npm run check`: exit 0. Type check clean, and all thirteen validators passed:
  validate-full-course, validate-tutor, validate-summary, validate-guardian,
  validate-transfer, validate-portfolio, validate-learning-interface, validate-backend,
  validate-static.
- `npm run lint`: exit 0, no warnings.
- `npx tsc --noEmit`: clean.

Product rules already approved are recorded in section 2. The five rules that shape the
implementation most: three equivalent forms per module and per final assessment; the independent
build is 50 of the 100 final marks with its own 30 mark floor; retakes rotate forms and never
repeat the immediately preceding form; a requirement that cannot be decided returns Needs
verification; and completion and certification are separate derived states.

Decisions taken here that later phases must not drift from:

1. One shared engine with course-specific content. No per-course scoring code.
2. One weakness register (`concept_review`) plus one assessment recovery queue
   (`assessment_revision_items`) that stores only readiness state.
3. The client may send answers, code and free text. It may never send a form, a mark, a pass
   status, a course identity or an item version.
4. The certificate needs no new completion flag: eligibility is derived on read from a passed
   final attempt whose mandatory checks and defence both passed.
5. Independent builds are graded from the submitted files against a reviewed requirement
   rubric. Requirements that need a live browser to judge are marked `needs_verification`
   rather than guessed.

### Phase 1

Delivered: the additive migration, the pure engine, the safe requirement grader, the four
readers, the persistence layer with idempotent writes, and the five assessment routes
(start, state, autosave, submit, signals). No content yet, so every course fails closed with
503 until Phase 2 and Phase 3 land.

Migration. `drizzle/0007_violet_praxagora.sql`, generated from `db/schema.ts` by
`npm run db:generate`, purely additive: six `CREATE TABLE` statements, no `DROP`, no `ALTER`,
every learner-owned table cascading from `learner_profiles`. Applied to the local development
store only. The live database was not touched.

Files added:

- `lib/assessment/types.ts`, `html.ts`, `css.ts`, `js.ts`, `grading.ts`, `engine.ts`,
  `store.ts`, `manifest.ts`, `api.ts`.
- `app/api/assessment/{start,state,autosave,submit,signals}/route.ts`.
- `scripts/validate-assessment-contract.mjs`, `scripts/e2e-assessment-api.mjs`,
  `tests/assessment/{harness,fixtures}.mjs`, `tests/assessment/{engine,grading}.test.mjs`.

Files changed: `db/schema.ts`, `drizzle/meta/_journal.json`, `app/api/learner/route.ts`
(the six new tables joined the deletion list), `package.json` (the new validator and both
test suites join `npm run check`, and the new API suite joins `npm run test:e2e`).

Gate, all executed:

| Command | Result |
| --- | --- |
| `npm run check` | exit 0. Type check clean, 12 pre-existing validators pass, `validate-assessment-contract` passes, engine suite 27 of 27, grading suite 65 of 65. |
| `npm run lint` | exit 0, zero warnings. |
| `npm run build` | exit 0, production build complete. |
| `KIDYCODE_E2E_URL=http://localhost:3001 node --import tsx --no-warnings scripts/e2e-assessment-api.mjs` | 13 checks passed, 0 failed. |

Defects found and fixed during verification, each one caught by an executed test rather than by
reading:

1. **The CSS reader swallowed a media query.** `parseCss` read a block body by scanning to the
   first `}` after the opening brace, so an `@media` rule's inner rule was consumed instead of
   parsed and no breakpoint was ever seen. Caught by the `css breakpoint` requirement check.
   Fixed by counting nested braces in `readBody` and reading the at-rule's contents as a block.
   Re-verified: 65 of 65 requirement checks pass.
2. **A cross-learner signal row was possible.** `autosave` and `signals` wrote a signal row
   keyed by the requesting learner against any attempt id that existed, so one learner could
   write a row against another learner's attempt. Found while designing the ownership test,
   fixed before the suite ran by loading the attempt scoped to the learner and answering 404.
   One of the assertions now proves no such row exists.
3. **Ownership was masked by the content gate in submit.** The content check ran before the
   attempt lookup, so another learner's attempt answered 503 instead of 404. Caught by the
   ownership test. Fixed by looking the attempt up first; the ownership test now asserts 404.
4. **An out-of-range answer was carried into grading.** `submissionFrom` accepted any integer,
   so `-5` passed the shape check. Caught by the engine suite. Fixed by bounding answers to
   0 to 2 and treating anything else as unanswered.
5. Two of my own test fixtures were wrong rather than the product: a marker helper omitted the
   `kind` field so every requirement reported "could not be checked", and a form rotation test
   read the newest-first history backwards. Both were corrected in the test, and the failing
   fixture rule stands: every negative fixture is asserted to fail before it is trusted.

### Phase 2

Pending.