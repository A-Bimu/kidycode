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
| 0 | Audit, contract, safe scaffolding | Type check, lint, production build, all pre-existing tests | complete (`6aadc8c`) |
| 1 | Engine, additive migration, secure persistence, server selection, idempotency | Schema and pure scoring tests, API authorisation and tamper tests, concurrency, deletion cascade, type check, lint, build | complete |
| 2 | Three equivalent module forms for all 32 modules, course by course | Content validation, answer verification, coverage report, assessment tests | complete (96 forms, 480 questions, 480 requirements) |
| 3 | Three equivalent final forms and three build briefs per course, safe grading, mandatory checks | Content validation, grading fixtures, cross-form equivalence, no answer leakage | complete (12 final forms, 120 questions, 300 requirements) |
| 4 | Learner assessment interface: overview, reference, question, editor, review, submit, resume | Browser tests at 320/768/1440 for all four courses, keyboard, semantics, overflow, brand rules | complete (`34a1b03`, `c29f4e2`, one real defect fixed) |
| 5 | Results, revision packs, readiness, retakes | Failing and passing journeys per course, weak-topic mapping, form rotation, no immediate repeat, history privacy, mobile browser tests | complete (`1a39376`, `8937e5a`; 238 revision pages) |
| 6 | Independent-understanding check | Copied-output simulation, genuine change pass, undecidable change becomes a neutral retry, no detector, no unsafe execution, privacy and browser tests | complete (`8c552ad` to `bdc4cdd`) |
| 7 | Completion, certificate, private Skills Passport, strict guardian summary | Eligibility matrix, V1 compatibility, guardian authorisation, print layout, allow-list tests, deletion tests, viewport tests | complete (`87e4b06`) |
| 8 | Whole-product regression and release candidate | Every validator, type check, lint with zero warnings, build, API, database, race and browser suites, payload leakage inspection, migration packaging, clean tree, remote equals local | complete, see `docs/assessment-v2-release-report.md` |

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

One bank per course, in order: ages 10 to 12, ages 13 to 15, ages 16 to 18, adults. Each course is
its own commit and its own gate.

Content rules applied to every bank:

- Five questions and five marked practical requirements per form, one for each idea the module
  teaches, so all three forms of a module assess the same objectives at the same difficulty.
- Every assessed objective and every revision link is a real lesson of that module, resolved from
  the course catalogue, so nothing is ever tested before it is taught and nothing is required from
  a file the module has not touched.
- The practical task always starts from the module's own project code, taken from the catalogue,
  so the learner meets familiar material.
- Marks are integers, one per requirement, with partial credit awarded requirement by requirement.
- A question never repeats across the forms of a module or anywhere else in the course, and the
  correct option never sits in a predictable position.
- Where a course teaches safety, privacy or accessibility, at least one module requirement is
  mandatory, and mandatory failures override a high total.
- An "absence" requirement (no personal detail on the page) is satisfied by an empty page, so no
  form may carry enough of them for empty code to reach the practical floor of three.

#### Course 1: ages 10 to 12

Bank: `lib/assessment/bank/ages-10-12.ts`, built by `lib/assessment/bank/factory.ts`.
24 forms (8 modules times 3), 120 questions, 120 marked requirements, 16 of them mandatory.

Gate, all executed:

| Command | Result |
| --- | --- |
| `npm run check` | exit 0. Includes `validate-assessment-bank` (14 checks: the course bank plus 13 failure proofs), the engine suite (27), the grading suite (65) and the satisfiability suite (97). |
| `npm run lint` | exit 0, zero warnings. |
| `npm run build` | exit 0. |
| `KIDYCODE_E2E_URL=http://localhost:3001 node --import tsx --no-warnings scripts/e2e-assessment-api.mjs` | 13 checks passed, 0 failed. |

Answer verification. Every one of the 120 questions was printed with its marked answer and read
against the lesson it assesses, and every marked requirement was proved achievable by an executed
test rather than by inspection alone. Reported corrections made during that review:

1. `decl("line-height", "readable")` used a value class that does not exist, so two
   css-foundations requirements could never be met. Caught by the satisfiability suite, fixed to
   `decl("line-height", "line-height")`.
2. Three requirements in the ages 10 to 12 quality module were carried by an undecidable or
   placeholding check. Replaced with a real declaration check and a real heading order check.
3. The validator's own rule that an option must be at least three characters long rejected correct
   short answers such as `h2` and `===`. The rule was wrong, not the content, and now rejects only
   genuinely empty options.
4. Empty code earned one mark in the aged 10 to 12 quality module, because an absence requirement
   is met by an absent page. This is now a stated rule with a validator behind it: no form may
   carry enough absence requirements for empty code to reach the practical floor.

#### Course 2: ages 13 to 15

Bank: `lib/assessment/bank/ages-13-15.ts`. 24 forms, 120 questions, 120 marked requirements,
21 of them mandatory.

Gate, all executed: `npm run check` exit 0 (bank validator clean for both courses, satisfiability
193 checks passed), `npm run lint` exit 0 with zero warnings, `npm run build` exit 0, and the API
suite 13 of 13.

Defects found and fixed during this course:

1. The practical fixture generator did not know how to satisfy a requirement that names accepted
   attribute values, so the input type and release notes requirements looked unachievable. The
   generator was wrong, not the content.
2. A generated submission for a form module contained an unlabelled control, which correctly
   broke the labelled-control requirement. The generator now produces a labelled control.
3. Pathway course identifiers repeated the course id (`ages-13-15-ages-13-15-forms-form-B`). The
   factory now normalises the prefix, which left the already shipped ages 10 to 12 identifiers
   unchanged.

#### Courses 3 and 4

Course 3 (ages 16 to 18): bank `lib/assessment/bank/ages-16-18.ts`, 24 forms, 120 questions, 120
requirements, 12 mandatory. Course 4 (adults): bank `lib/assessment/bank/adults.ts`, same totals.
Both passed the same gate as courses 1 and 2, and every question in both banks was printed with its
marked answer and read against the lesson it assesses before acceptance.

### Phase 3

Finals and independent builds, one course at a time. Each final form is marked out of 100: ten
knowledge questions of two marks, three debugging tasks of five two mark requirements, and one
unseen build of ten five mark requirements. Every build carries a mandatory accessibility
requirement and a mandatory privacy or safety requirement, so a high total can never override them.

| Course | File | Knowledge | Debugging tasks | Build requirements |
| --- | --- | --- | --- | --- |
| ages 10 to 12 | `lib/assessment/bank/ages-10-12-final.ts` | 30 | 9 | 30 |
| ages 13 to 15 | `lib/assessment/bank/ages-13-15-final.ts` | 30 | 9 | 30 |
| ages 16 to 18 | `lib/assessment/bank/ages-16-18-final.ts` | 30 | 9 | 30 |
| adults | `lib/assessment/bank/adults-final.ts` | 30 | 9 | 30 |

The debugging tasks are proved to be repairs: every starter code file scores below full marks
against its own rubric, and the scores are recorded in the phase report. The validator also refuses
a final question that repeats module-bank wording, which caught twenty questions in the first draft
of the ages 10 to 12 bank; all twenty were rewritten.

Deviations recorded honestly: courses 2 and 3 of this phase landed in one commit, because the
manifest that merges a module bank with its final bank is a single shared change and splitting it
would have left one commit whose bank was not wired in.

### Phase 6 outcome change: Needs verification removed as a learner-facing outcome

Product decision, and the reason: a Needs verification outcome requires a qualified human-review
workflow. KidyCode has no teacher or reviewer queue, and a connected guardian cannot be assumed to
understand code, so a learner told "a person will check this" would be waiting for a service that
does not exist.

The defence therefore has two educational outcomes: **Passed** and **Not passed yet**. The
requirement-level `undecidable` mechanism stays in the engine, because requirement grading depends
on it, but it is never exposed as a learner result or a certificate status.

When a submitted change cannot be decided the learner is neither passed nor failed, nothing is
lowered, no result is recorded, and no attempt is counted. Their explanation, prediction, code and
progress are preserved, they are given a **different reviewed equivalent change task** (the one
that could not be decided is never repeated), and they see the neutral message *"We could not check
this change. Your work is saved. Try a different equivalent task."* The attempt records a bounded
internal event (`stage = retry`) with no private code and no integrity signal. If no equivalent
task is available the defence stays unfinished and a retryable technical error is shown, so a
system limitation can never cost a learner their certificate eligibility.

Recorded honestly, and corrected by evidence: the earlier note said no legitimate submission
reached the undecidable branch. That was wrong. A final assessment submitted with no usable project
code does reach it, because a reviewed change that adds one more of something has no baseline to
compare against. The defence API journey proves it end to end: the route exhausts the reviewed
equivalent tasks, keeps the stored decision `pending`, changes no score and records no Not passed
yet, and answers with the documented retryable technical response carrying the stable code
`defence_task_unavailable` and a learner-safe message. Each equivalent task is offered once, the
attempt records a bounded internal marker (`stage = retry-N`), and when every equivalent task has
been tried the defence stays unfinished and resumable with the learner's own words intact.

The journey was split into two distinct tests so the two cases cannot be confused again: a technical
retry test that submits no usable project code, and a missing-understanding test that submits a
realistic project baseline and then fails on understanding. The browser harness accepts the retry
panel as neither Passed nor Not passed yet, and refuses any screen that says Needs verification.

### Phase 4

Complete and verified in a real browser. `scripts/browser-journey.py` drives an isolated
headless Chrome over CDP and `scripts/browser-sweep.sh` runs every course; the report for each
course is thirty screens audited at 320, 768 and 1440 pixels.

| Course | Screens | Max overflow | Green | Em dashes | Unlabelled controls | Wrong h1 count |
| --- | --- | --- | --- | --- | --- | --- |
| ages 10 to 12 | 30 | 0 | 0 | 0 | 0 | none |
| ages 13 to 15 | 30 | 0 | 0 | 0 | 0 | none |
| ages 16 to 18 | 30 | 0 | 0 | 0 | 0 | none |
| adults | 30 | 0 | 0 | 0 | 0 | none |

Saved status was read off the page as "Your work is saved." on every course, real Tab presses
landed on labelled controls with a visible ring, and with `prefers-reduced-motion: reduce`
emulated the computed transition and animation durations were both 0s.

One real defect was found by the sweep and fixed in `c29f4e2`: the loading guard rendered
before the chooser, so opening Module checks showed a spinner with no buttons and no attempt
was ever started.

### Phase 5

Content complete: **238 revision pages** (ages 10 to 12: 42, ages 13 to 15: 68, ages 16 to 18: 66,
adults: 62), one for every concept any bank can mark, 8,654 lines of reviewed content. Every page
carries meaning, why it matters, a worked example, a common mistake, two guided questions, an
independent task, three progressive hints, a readiness check and a link to the real lesson.
`npm run check` now includes the revision validator, which also refuses a pack whose lesson the
course does not teach, a repeated prompt between packs, and an unreachable pack.

Two real defects were fixed to get there: the validator itself could not run (it used `import type`
in an `.mjs` file, which tsx cannot strip, so every run died before the first check), and
`revision/index.ts` imported `CourseId` from a module that does not export it.

Remaining for this phase: the results screen with skills-already-secure and skills-needing-revision
lists, the first recommended action, the revision page interface, the readiness check that unlocks a
retake, and the journey tests.

### Phase 7

Complete. `docs/assessment-v2-plan.md` records it here; the release report is Phase 8.

**The exact eligibility rule.** A learner is eligible for the certificate only when all five
conditions hold **on one submitted final attempt**, because a high score on one attempt and a passed
defence on another is not a certified learner:

1. the existing course completion record is complete (every activity, a saved project version for
   every module, and a passed course final check)
2. the stored Assessment V2 result is at least 70 out of 100
3. the stored independent build is at least 30 out of 50
4. every mandatory practical requirement passed
5. the stored code-defence outcome is `Passed`

`Not passed yet` is not eligible. A retryable technical defence result leaves certification
undecided rather than denied, and can never issue or permanently deny a credential. A course with no
reviewed level fails closed. Historical V1 learners keep their completion record and are never
certified retroactively: an old completion alone issues nothing.

**One calculation.** `deriveCertification` lives only in `lib/certification.ts`. The learner's
progress page, the Skills Passport, the certificate, the guardian summary and the tests all read
`lib/progress-view.ts`, which builds the summary once. The validator asserts that no other file
under `lib/` or `app/` compares against 70 or 30.

**Levels.** Ages 10 to 12 Web Creator, ages 13 to 15 Web Builder, ages 16 to 18 Web Application
Builder, adults Business Website Builder. The level is looked up from the learner's assigned course.

**Credential issuance.** The existing `assessment_credentials` table and `loadCredential` are reused;
no migration was added and migration `0007` is untouched and still local-only. `issueCredential`
writes with `ON CONFLICT (learner_id, course_id) DO NOTHING` against the existing unique index, so a
repeat or a concurrent request returns one row with one id and one issue date. The id is generated
from 16 cryptographically secure random bytes into an alphabet without easily confused characters,
is opaque, non-sequential and safe to print.

**The interface.** `components/SkillsPassport.tsx` takes the learner from My progress to Skills
Passport to Certificate to Print. The passport lists each skill as demonstrated or still to
demonstrate, with the evidence behind it and the module or project source, the assessment and
defence states in plain language, and exactly one next action while certification is incomplete. The
certificate sheet prints only the allowed fields, and `Print my certificate` uses the print
stylesheet in `app/globals.css`: the app shell and every other screen are removed from layout, so the
sheet prints on one page, in colour and in grayscale. The copy never claims an accreditation.

**Guardian boundary.** `toGuardianCertificate` adds a certificate section to the existing strict
allow list: certificate name, level, status label, course completion, project title, issue date and
a short demonstrated-skills summary. No marks, no attempt, no credential id, no code and no defence
response crosses that boundary, and the whole summary is built through the same calculation.

**Test totals at the end of this phase.**

| Suite | Result |
| --- | --- |
| `npm run check` (types, all validators, engine, grading, satisfiability, certification) | 0 |
| `npm run lint` | 0, zero warnings |
| `npm run build` | 0 |
| `tests/certification/certification.test.mjs` | 18 checks, 0 failed |
| `scripts/validate-certification.mjs` | 10 rules, 0 failing |
| `scripts/e2e-certification.mjs` | 17 checks, 0 failed |
| `npm run test:browser:certificate` | 15 of 15 journeys, 4 of 4 courses certified, 12 of 12 one-page print proofs, 12 of 12 distinct credential ids |
| `npm run test:e2e` (all eight journeys) | 0 |

**Real defects found and fixed while verifying.**

- The certificate printed on **two pages**. The hidden screens were still reserving height, so the
  sheet was paginated; the print rules now remove the app shell from layout and cap the sheet. The
  harness measures the real PDF page tree and the print-media layout, so the fix is aimed rather
  than guessed, and it fails loudly if the page count and the page objects ever disagree.
- The passport and certificate styles were written into the **marketing stylesheet** `styles.css`,
  which the learner interface does not load. They now live in `app/globals.css`, and the validator
  asserts the print contract against the file the app actually loads.
- That mistake also **desynchronised the `public/styles.css` twin**, which `validate-static.mjs`
  requires to be byte-identical; both files were restored.
- The certification fixture **never passed the course final check**, so completion was genuinely
  incomplete and every issue attempt was correctly refused. The fixture was wrong, not the product.
- The browser harness compared uppercase needles against lowercased page text, because
  `text-transform: uppercase` changes what `innerText` returns.
- The harness treated a negative overflow measurement as a failure; that value is the scrollbar, not
  a page that is too wide.

**Next.** None in this tree: Phase 8 is the last phase of Assessment V2. The remaining work is the
live release order, which is documented in `docs/assessment-v2-release-report.md` section 10 and
deliberately not executed.

### Phase 8

Complete. The full report is `docs/assessment-v2-release-report.md`; this is the record the plan
file keeps.

Starting SHA `87e4b06`, working tree clean, local `main` equal to `origin/main`, all three
confirmed before anything changed. Phase 6 and Phase 7 were left exactly as they were.

Three audits were added, because the phase brief asks for three things the repository could not
previously prove:

- `scripts/audit-database.mjs` (10 checks) applies `0000` through `0007` in order to a fresh
  throwaway store, upgrades a representative pre-Assessment-V2 store through `0007` and compares
  every V1 row before and after, walks the foreign key graph to prove every learner-owned table
  cascades, proves the attempt-level cascade, and proves the unique constraints the concurrency
  rules depend on. It never opens the deployed database.
- `scripts/validate-release-static.mjs` (11 checks) checks 600 reviewed explanations against every
  file in the production client bundle, bans the capabilities that would let the product watch a
  learner, and proves the one permitted clipboard read is a length measurement.
- `scripts/e2e-payload-leak.mjs` (12 checks) starts a real reviewed assessment as a real learner and
  reads every response as raw text: the item's key set, the absence of an unassigned form's
  questions, the correction scope, the refusal of client-supplied authority, and the refusal of a
  module from another course.

Totals at the end of this phase: `npm run check` exit 0 with 611 passing checks, `npm run lint`
exit 0 with zero warnings, `npm run build` exit 0 with all eight migrations packaged,
`npm run test:e2e` exit 0 with 177 checks, the whole-product browser sweep 120 screens with zero
findings, the defence sweep 12 journeys and 120 screens with zero findings, the targeted defence
journeys 10 of 10, and the certificate sweep 15 of 15 journeys with 12 of 12 one-page print proofs.

Seven defects were found and fixed, each recorded with the check that caught it. Two were in the
product's packaging and gate surface: the build validator's migration list had stopped at `0006`,
so the new migration could have been left out of the deployment artifact unnoticed; and the
whole-product browser sweep had no command in `package.json` and could not be run at all. Three
were in the new audits themselves. Two were wrong fixtures. No product assertion was weakened and
no migration was edited; `0007_violet_praxagora.sql` still hashes to
`7590e9813422c73d21f1d8c6a828e142ba0604d65324d3dc34ad459ef5dce574`.

Honest limits: the live site is behind a ChatGPT sign-in wall, so the live smoke test did not
happen and the four browser gates ran against the local development server; migration `0007`
remains local-only; and print verification used Chromium's own PDF pipeline only.
