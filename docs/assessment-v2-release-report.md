# KidyCode Assessment V2 release report

Phase 8: whole-product regression and release-candidate preparation.

| | |
| --- | --- |
| Starting SHA | `87e4b068c3f0ed6389613064db69d552e6641adb` (local `main` equalled `origin/main`, working tree clean) |
| Phase 8 commit | `PHASE8_COMMIT` |
| Remote | `origin/main`, confirmed equal to local HEAD after the push |
| Scope | Audit and repair. No new feature, no schema change, no migration edited, nothing deployed |
| Live database | Not touched. Every database statement in this phase ran against throwaway stores in the operating system's temporary directory |
| Live Sites project | Not published and not changed |

Nothing in Phase 6 or Phase 7 was repeated, rolled back or rebuilt. The starting check
(fetch, clean tree, both refs at `87e4b06`) passed before any change was made.

## 1. Architecture summary

Four courses, one engine, one set of rules.

- **Identity.** `learner_profiles` plus an HttpOnly `kidycode_session` cookie; the access key is
  stored only as a SHA-256 hash. Every route authenticates through `authenticateLearner`, and the
  course always comes from the learner's own row.
- **Content.** `lib/assessment/bank/` holds the reviewed forms, one file per course, and
  `lib/assessment/manifest.ts` merges each course's module bank with its final bank. The engine
  (`lib/assessment/engine.ts`) is pure: no database, no browser, no evaluated learner code.
- **Grading.** Knowledge items are graded from the content definition; code is graded requirement
  by requirement through safe HTML, CSS and JavaScript readers (`lib/assessment/html.ts`,
  `css.ts`, `js.ts`). A requirement that cannot be decided returns `undecidable` internally and is
  never shown to a learner as a result.
- **Persistence.** One additive migration, `drizzle/0007_violet_praxagora.sql`, adds six
  learner-scoped tables. Every one cascades from `learner_profiles`.
- **Derived state.** Completion (`lib/completion.ts`), certification (`lib/certification.ts`) and
  the progress view (`lib/progress-view.ts`) are computed on read from rows that already exist.
  No stored flag, no second copy of a total.
- **Interface.** `components/AssessmentFlow.tsx` walks overview, questions, practical task,
  reference sheet, review, results, revision and the code defence. `components/SkillsPassport.tsx`
  carries the passport, the certificate and the print sheet.

### Content totals, read from the code rather than from memory

| Measure | Total |
| --- | --- |
| Courses | 4 |
| Modules | 32 |
| Module forms | 96 (three equivalent forms per module) |
| Final forms | 12 (three equivalent forms per course) |
| Forms, all kinds | 108 |
| Knowledge questions | 600 |
| Marked requirements | 780 |
| Mandatory requirements | 88 |
| Reviewed defence templates | 12 |
| Revision packs | 238 |

## 2. Marking and retake rules

| Assessment | Marked out of | Pass mark | Additional floor |
| --- | --- | --- | --- |
| Module assessment | 10 | 7 | at least 3 of 5 on the practical task |
| Final applied assessment | 100 | 70 | at least 30 of 50 on the unseen independent build, every mandatory requirement, and `Passed` on the code defence |

- Not timed, resumable, unlimited retakes after readiness work. There is no waiting period.
- Three equivalent forms per module and per course final. The server selects the form; the client
  never sends one.
- A retake never repeats the immediately preceding form: `selectForm` reads the learner's own form
  history and excludes it.
- Draft saving and submission are separate. Autosave writes the draft on the existing row and
  never moves a status or creates a second attempt.
- Submission is one conditional update that requires exactly one changed row, so a repeat or a
  concurrent submission cannot award the marks twice. A second submission is answered with the
  result already stored, marked `replay: true`.

## 3. Learner outcomes, including the undecidable case

Two learner-facing code-defence outcomes only: **Passed** and **Not passed yet**. `Needs
verification` is not restored as a learner-facing outcome and is rejected by the browser harness.

An undecidable grading condition is a neutral, retryable technical error:

- nothing is lowered, no result is recorded and no attempt is counted;
- the learner's explanation, prediction, code and progress are preserved;
- a **different** reviewed equivalent task is offered, and the task that could not be decided is
  never repeated;
- the copy is *"We could not check this change. Your work is saved. Try a different equivalent
  task."*;
- the attempt records a bounded internal marker (`stage = retry-N`) and no private code and no
  integrity signal;
- certification stays undecided rather than denied, so a system limitation can never cost a
  learner their eligibility.

## 4. Course completion and certificate rules

Course completion stays the existing derived record: every activity complete, a saved project
version for every module, and a passed course final check.

Certification is a separate derived state and needs all five conditions **on one submitted final
attempt**:

1. the course completion record is complete;
2. the stored Assessment V2 result is at least 70 of 100;
3. the stored independent build is at least 30 of 50;
4. every mandatory practical requirement passed;
5. the stored code-defence outcome is `Passed`.

`Not passed yet` is not eligible. A retryable technical defence result leaves certification
undecided. Historical V1 learners keep their completion record and are never certified
retroactively: an old completion alone issues nothing. A course with no reviewed level fails
closed. The four levels are Web Creator (10 to 12), Web Builder (13 to 15), Web Application
Builder (16 to 18) and Business Website Builder (adults).

Credential issuance reuses `assessment_credentials` with
`ON CONFLICT (learner_id, course_id) DO NOTHING`, so a repeat or a concurrent request returns one
row with one id and one issue date. The credential id comes from 16 cryptographically secure
random bytes and is opaque and safe to print. Adults never receive guardian controls: the guardian
routes are refused for a learner whose course is `adults`.

## 5. Privacy and security boundaries, and what proves them

| Boundary | Proved by |
| --- | --- |
| No correct answer index, explanation, misconception key, grading rule or rubric before submission | `scripts/e2e-payload-leak.mjs`, on a real started attempt: the item's own key set is asserted to be exactly `itemId`, `prompt`, `options` |
| No unassigned equivalent form | `scripts/e2e-payload-leak.mjs`: 595 questions belonging to forms other than the served one are absent from the payload, while the served form's own 5 questions are present |
| Corrections only for the form the learner sat | `scripts/e2e-payload-leak.mjs`: every correction item id is checked against the served form, and the served form's explanations must be present |
| Client input cannot select marks, outcomes, eligibility, level, date or credential id | `scripts/e2e-payload-leak.mjs` submits a body carrying `score`, `passed`, `outcome`, `eligible`, `level`, `issuedAt`, `credentialId`, `courseId`, `learnerId` and `formId`: none is echoed, the stored form is the server's, and the stored outcome is never `passed` |
| Cross-learner and cross-course refusal | `scripts/e2e-assessment-api.mjs` (404 for another learner's attempt on read, submit, autosave and signals) and `scripts/e2e-payload-leak.mjs` (400 for a module belonging to another course) |
| No session value, access key, hash or digest in a learner payload or the client bundle | `scripts/e2e-payload-leak.mjs` and `scripts/validate-release-static.mjs` |
| Guardian responses are a strict allow list, and a revoked guardian loses access immediately | `scripts/validate-guardian.mjs`, `scripts/e2e-guardian-db.mjs`, `scripts/e2e-lifecycle.mjs`, `tests/certification/certification.test.mjs` |
| Connection and transfer codes are digest-only, single use and expiry bound | `scripts/validate-guardian.mjs`, `scripts/validate-transfer.mjs`, `scripts/e2e-transfer-races.mjs` (6 race checks) |
| Credential issuance is idempotent and safe under concurrency | `scripts/validate-certification.mjs` (10 rules), `tests/certification/certification.test.mjs` (18 checks), `npm run test:browser:certificate` (12 of 12 distinct ids across 12 issues) |
| Permanent deletion removes learner-owned evidence and leaves no orphan | `scripts/e2e-assessment-api.mjs`, `scripts/e2e-lifecycle.mjs`, `scripts/audit-database.mjs` (cascade and orphan scan) |
| No camera, microphone, biometric monitoring, AI detector or clipboard-content capture | `scripts/validate-release-static.mjs`, against the source and against the shipped client bundle |

### The clipboard finding, stated plainly

The product reads the clipboard in exactly one place: the paste handler in
`components/AssessmentFlow.tsx` binds the pasted text to a local name and takes only its length, to
report the disclosed "largest paste characters" signal. Nothing is stored, sent or rendered, and
the server schema accepts only an integer. A blunt rule that banned the API name was the wrong
rule: it also flagged React's own event system and the copy button. The audit now proves the
property that matters instead, in `scripts/validate-release-static.mjs`:

- exactly one file in the product reads the clipboard;
- the read is inside the paste handler;
- the bound text is used exactly once, as `.length`;
- no second clipboard read exists in that handler;
- nothing in the handler writes to browser storage or sends a request.

The audit also proves the direction of travel for writes: `components/MoveToAnotherDevice.tsx`
calls `navigator.clipboard.writeText` behind a click, and no file anywhere calls
`clipboard.read`, `readText(` or `navigator.clipboard.read`.

## 6. Migration and database audit results

`scripts/audit-database.mjs`, 10 checks, 0 failed, run against throwaway stores only:

| Check | Result |
| --- | --- |
| The journal and the migration files agree, in order, one for one | pass. `dialect: sqlite`, `idx` 0 to 7, journal order equals file order, `0007_violet_praxagora` is still the newest |
| No migration missing, duplicated or renumbered | pass. Prefixes `0000` to `0007` |
| A fresh local database reaches the current schema from `0000` through `0007` | pass. 18 tables, foreign keys enforced |
| Exactly one migration creates the assessment tables, and it is purely additive | pass. Only `0007_violet_praxagora.sql`; six `CREATE TABLE` statements; every statement is a `CREATE TABLE` or a `CREATE [UNIQUE] INDEX`; no drop, no alter, no write |
| Every learner-owned table cascades from the learner, directly or through a parent | pass. 16 of 18 tables reachable; `guardian_accounts` and `transfer_claim_limits` are deliberately outside it and are asserted to hold no `learner_id` |
| Deleting the learner removes every learner-owned row and leaves no orphan | pass, for 14 learner-scoped tables, with a full orphan scan as well as a scoped count |
| Deleting one attempt removes its marks, signals, defence and credential | pass, and a second learner's rows are asserted untouched |
| The constraints the concurrency rules rely on are enforced by the database | pass. One credential per learner and course (including under `ON CONFLICT ... DO NOTHING`), one result per attempt, item and requirement, one revision row per learner, course and concept, one signals row per attempt |
| The assessment indexes exist exactly as the schema declares them | pass. All eight, including the unique credential pair |
| A pre-Assessment-V2 database upgrades through `0007` with its V1 rows intact | pass. Every V1 table is snapshotted before the upgrade and compared row for row afterwards; the six new tables arrive empty; an old completion issues no credential; the V1 evidence and guardian links still cascade |

Migration `0007_violet_praxagora.sql` was not edited. Its sha256 at the end of this phase is
`7590e9813422c73d21f1d8c6a828e142ba0604d65324d3dc34ad459ef5dce574`. No new migration was added:
the schema needed no change, so the journal still ends at `0007`.

**Build packaging.** `scripts/validate-build.mjs` now compares the packaged migration set in
`dist/.openai/drizzle/` against `drizzle/*.sql` instead of listing files, asserts the sets are
equal, asserts the order, and asserts each packaged file is byte-identical to its source. Every
migration reaches the deployment artifact.

## 7. Every gate, with exact totals

| Command | Result |
| --- | --- |
| `npm run check` | exit 0. `tsc --noEmit` clean, 17 validators and unit suites, 611 passing checks: database audit 10, release static audit 11, assessment bank 17, engine 44, grading 65, satisfiability 433, certification contract 10 rules, certification 18 |
| `npm run lint` | exit 0, zero warnings |
| `npm run build` | exit 0, production build complete, worker bundle, marketing assets, Sites metadata and all eight migrations validated |
| `npm run test:e2e` | exit 0, 177 checks: tutor 74, guardian database 14, portfolio 14, lifecycle 9, transfer races 6, assessment API 13, assessment revision 8, assessment defence 10, payload leak 12, certification 17 |
| `npm run test:browser:product` | exit 0. 4 courses, 30 screens each at 320, 768 and 1440 pixels (120 screens), 0 findings for overflow, colour, em dashes, unlabelled controls, heading order, single `h1` and single `main` |
| `npm run test:browser:defence` | exit 0. 12 journeys (4 courses times 3 widths), 10 screens each (120 screens), all `ok=True`, all draft-saved announcements read as "Your defence is saved.", outcomes observed `['Not passed yet']`, and the harness refused every blocked submission set |
| `npm run test:browser:targets` | exit 0. 10 targeted journeys: 4 Passed, 3 Not passed yet, 3 technical retries (each exhausting 4 equivalent tasks and ending on the retryable panel, with `stored=pending` and the learner's work intact) |
| `npm run test:browser:certificate` | exit 0. 15 of 15 journeys, 4 of 4 courses certified, 12 of 12 one-page print proofs, 12 of 12 distinct credential ids, and 3 partial-progress learners correctly uncertified |
| `node scripts/audit-database.mjs` | 10 checks, 0 failed |
| `node --import tsx scripts/validate-release-static.mjs` | 11 checks, 0 failed, 0 skipped |
| `node --import tsx scripts/e2e-payload-leak.mjs` | 12 checks, 0 failed |

### Browser coverage detail

Each of the 120 whole-product screens is audited at all three viewports for horizontal overflow
(must be greater than zero to be reported, so the scrollbar is not mistaken for a defect), green
anywhere in the computed palette, learner-facing em dashes, unlabelled controls, heading order,
exactly one `h1` and exactly one `main`. The journey also walks a real Tab press on the review
screen and reads the computed transition and animation durations with
`prefers-reduced-motion: reduce` emulated. The defence and certificate sweeps add keyboard,
announcement, resume, retry and print states.

### Print verification

12 one-page print proofs: one per certificate state per viewport in the certificate sweep, each
counting the PDF page tree's `/Count` and its page objects independently, so a wrong counter
cannot report a layout defect that is not there. The sheet prints on one page and the copy never
claims an accreditation.

### Payload-leak inspection, in full

`scripts/e2e-payload-leak.mjs` runs against the live local server with a real session:

- **server responses**: start, state, autosave, submit, replay, progress, summary, portfolio,
  revision and the rendered `/`, `/learn` and `/privacy` HTML;
- **browser network payloads**: the same responses are read as raw text, not as parsed objects,
  so a nested field cannot hide from the scan;
- **production client bundles**: `scripts/validate-release-static.mjs` reads every file under
  `dist/client/` (11 scripts, 499 KiB) and checks 600 reviewed explanations against each one, plus
  blocked capabilities, session values, access hashes, digests and SQL;
- **proof the scan works**: the same check was run once with a real explanation appended to
  `dist/client/assets/LearningApp-*.js` and failed with *"1 answer strings are in the client
  bundle"*, then passed again once the file was restored.

## 8. Defects found and fixed in this phase

Each entry names what was wrong and which executed check caught it. Where the defect was in a
harness or a fixture rather than in the product, it is labelled as such: changing the product to
satisfy a wrong test is how a release audit starts lying.

1. **The migration packaging assertion stopped at `0006`.** `scripts/validate-build.mjs` listed
   required migrations by hand and the list was never extended when `0007` landed, so a build that
   omitted the assessment tables would have passed. Found by comparing the packaged directory
   against `drizzle/*.sql`. Fixed by comparing the two sets, in order, byte for byte, and by
   asserting at least eight migrations. *Harness defect.*
2. **The whole-product browser sweep could not run at all.** `package.json` had no script for it,
   so the gate the phase brief calls "whole-product browser sweep" had no entry point. Fixed by
   adding `npm run test:browser:product`.
3. **The sweep's seed cookie was read back from a lost file.** The script used `mktemp -d`, an MSYS
   path that the native node binary resolves to `C:\tmp\...`; the seed wrote fine and the reader
   failed, so every course reported "the seed returned no session cookie". The earlier form of the
   script also captured the cookie through a shell substitution, which the skill records as
   returning empty in this environment. Fixed by writing the seed to a project-local scratch
   directory and parsing it from the file, with an explicit refusal when the cookie is empty.
   *Harness defect.* After the fix all four courses swept 30 screens each with 0 findings.
4. **A blunt clipboard rule misfired on legitimate code.** The first version of the capability
   audit banned `clipboardData` and `writeText(` outright, which flagged React's own event system
   and the transfer-code copy button. Replaced with two precise rules: no file may read the
   clipboard except the one paste handler, whose only use of the text is its length, and any
   clipboard write must sit behind a click. *Harness defect, with a real finding documented in
   section 5.*
5. **The payload audit treated misconception keys as prose.** The banks store misconception keys
   as pipe-delimited concept slugs, which are legitimately visible in the learner's revision list,
   so the audit reported a leak that was not one. Fixed by scoping the hidden set to explanations.
   *Fixture defect.*
6. **The payload audit expected a requirement key that does not exist.** It asserted
   `available` on a requirement handed to the client, which the projection does not send. Fixed to
   the real key set `id`, `label`, `mandatory`, `marks`. *Fixture defect.*
7. **Three defects in the new database audit, all in the audit.** A rule that banned the word
   `UPDATE` matched the `ON UPDATE no action` clause of a foreign key; the ownership walk treated
   `guardian_accounts` and `transfer_claim_limits` as learner-owned when they are deliberately not;
   and the upgrade test seeded assessment rows into a store that predates them. All three were
   fixed in the audit, and the assertions were made stronger rather than weaker: the additive rule
   now reads statement by statement, and the two non-learner tables are asserted to hold no
   `learner_id`. *Harness defects.*

No product assertion was weakened. No pass mark, floor, mandatory requirement, monotonic counter or
append-only rule was relaxed to make a check go green.

## 9. Remaining limitations, stated honestly

- **The live site was not smoke-tested.** The published KidyCode site is an OpenAI Sites project
  behind a ChatGPT sign-in wall, so only the owner can publish or open it. Every browser gate in
  this phase ran against the local development server at `http://localhost:3001`. The deployment
  steps in section 10 are documented and deliberately not executed.
- **Migration `0007` is still local-only.** The local development store has it; the live database
  does not. Applying it is the first deployment step, and it is not this phase's authority to do.
- **`guardian_accounts` and `transfer_claim_limits` are outside the learner cascade by design.**
  A grown-up's identity must outlive one learner, and the claim limiter is keyed by a hashed source
  address. Both are asserted to hold no `learner_id`, and both were verified to behave correctly
  when a learner is deleted.
- **The "largest paste characters" signal reads a paste length.** Documented in section 5. It is a
  count, it is disclosed before the assessment starts, it cannot lower a mark, and it is the only
  clipboard read in the product.
- **Print verification is Chromium's PDF pipeline.** The one-page proof counts the page tree two
  ways, but a different browser's print engine was not exercised.
- **No CSP or frame policy was added.** The hosting configuration exposes no header surface and the
  previews are sandboxed `srcdoc` iframes, so such a policy would be a guess that can break the
  product. The audit documents the protections that do exist rather than shipping an unverified
  policy.
- **Two checks print a skip when no production build exists.** The client-bundle leak scan needs
  `dist/client`. It reports an explicit skip line rather than a pass, and the release sequence runs
  the build before the check, so the skip never appears in a release run.

## 10. Live deployment status and the later release order

Live deployment status: **not deployed, not published, not migrated.** The live database was not
read or written by this phase, and the live Site was not published or changed.

The later release order is documented here and deliberately not executed. It is a separate
decision by the owner, because it changes the live database.

1. **Confirm database recoverability.** Export or snapshot the live D1 database and confirm the
   restore path works before anything is applied.
2. **Apply pending migrations in order.** `0000` through `0007`, in journal order. Only `0007` is
   pending; it is additive and creates six tables and eight indexes.
3. **Verify tables and indexes.** Confirm the six assessment tables and their indexes exist, and
   that foreign keys are enforced on the live database.
4. **Publish the matching commit.** Publish the commit that carries this report, so the running
   code and the applied schema are the same revision.
5. **Run a live smoke test.** Signed in as a disposable learner: open a module assessment, save a
   draft, reload and confirm it restores, submit, read the corrections, open a revision page, and
   confirm the progress and Skills Passport screens render. Then delete that learner and confirm
   the session stops working.
6. **Record deployment evidence.** The published revision, the migration that was applied, the
   time, and the result of each smoke-test step.

## 11. Changed files in this phase

| File | Change |
| --- | --- |
| `scripts/audit-database.mjs` | New. The migration, cascade, constraint, index and upgrade audit |
| `scripts/validate-release-static.mjs` | New. The source and production-bundle leak and capability audit |
| `scripts/e2e-payload-leak.mjs` | New. The authenticated payload-leak journey |
| `scripts/validate-build.mjs` | Packages every migration by comparing sets, and asserts byte equality |
| `scripts/browser-sweep.sh` | Seed cookie read from a file in a project-local scratch directory; findings summarised; exits non-zero on any finding |
| `scripts/e2e-all.sh` | Runs the payload-leak journey as part of `npm run test:e2e` |
| `package.json` | `check` gains the database audit and the release static audit; new `test:browser:product` script |
| `docs/assessment-v2-release-report.md` | New, this report |
| `docs/assessment-v2-plan.md` | Phase 8 recorded, and the phase checklist marked with its real state |
