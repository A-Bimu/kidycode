# Day 3: dry runs and the release candidate

Day 3 of the 72-hour V2 build is the dry-run day. Day 1 fixed the contracts and Day 2
built the screens; neither of them proved that a learner can fail, be corrected and still
arrive at a certificate, or that a school can stay inside its own scope while that happens.
Day 3 walks all four pathways through those journeys against a real local server and a real
local database, then re-runs every gate the release depends on.

The Day 3 gate in `docs/72-hour-v2-execution.md` is "no severity-one defects, passing local
checks and reviewed release candidate; no automatic public publish". This document records
what was run, what it returned, the decisions taken, and what remains open.

## What shipped

| Area | Where it lives | Proved by |
| --- | --- | --- |
| Four-pathway dry runs | `scripts/e2e-dry-runs.mjs` | 32 checks against the running app and the real local D1 store, per run |
| The dry-run contract | `scripts/validate-day3-dry-runs.mjs` | 43 checks inside `npm run check` |
| The single end-to-end command | `scripts/e2e-all.sh` | `npm run test:e2e` now includes the dry runs |
| Line-ending portability of a gate | `scripts/validate-transfer.mjs` | the multi-line assertion now normalises CRLF before matching |

No product behaviour was changed on this branch. Day 3 adds the journeys that prove the
product, not a new feature: the assessment, revision, transfer and institution surfaces it
exercises are the ones Day 1 and Day 2 shipped.

## The journeys, per pathway

Each of the four pathways (ages 10 to 12, 13 to 15, 16 to 18 and adults) runs the same five
steps through the real routes. The learner is created fresh on every run, the course is
seeded with the starting state a learner who finished it would have (every activity
completed, one saved module version per module, a passed course final check), and no
assessment row or certificate is ever written by the suite.

1. **Independent start.** `POST /api/assessment/start` opens a module form the server
   chooses. The response is asserted to be a fresh attempt, to carry questions, to carry a
   practical task, and to leak no answer key.
2. **Failed first attempt.** Every knowledge option submitted is deliberately one step away
   from the correct one. The server answers `not_passed_yet`, a non-empty revision plan, one
   first action, and corrections that mark every answer wrong. The attempt row is then read
   back out of the database to confirm it was stored as submitted.
3. **Changed requirement.** A fresh `start` is refused with `409` and the outstanding
   concept list, so the retake cannot be taken by simply trying again.
4. **Corrected retry.** Every listed concept is passed at readiness, one option at a time,
   because the revision page never carries an answer index. The retake then opens a
   different equivalent form, and the correct answers are taken from the reviewed bank the
   server marks against. The retry must score above the failure, with every knowledge
   correction marked correct, and the stored row must agree.
5. **Certificate.** The learner reads `GET /api/certification` and the status is `ready`
   with the missing conditions exactly `assessment`, `build`, `mandatory` and `defence`.
   `POST /api/certification` is refused with `403` and no credential row is written, because
   a module assessment is not the final one.

Then, once per pathway, the work is moved to a second device: a transfer code is issued,
claimed from a client with no cookie, and the new session reads the same attempt and the
same completed activities. The same code is claimed a second time and must be refused with
`410` and the message that it has already been used.

## The institution boundaries

One local pilot organisation is seeded, then the four pilot roles are exercised over the
real workspace route:

| Caller | Result |
| --- | --- |
| no identity | `401` |
| `organisation_admin` | organisation scope, member list visible, `learner identities`, `learner code` and `assessment evidence` reported as hidden |
| `cohort_lead` | cohort scope, not read-only, may enrol a learner |
| `academic_reviewer` | cohort scope, roster shows stable labels and never a learner name, `learner identities` and `learner code` hidden |
| `organisation_admin` of the second organisation | sees only its own organisation and never the first organisation's cohort |
| `cohort_lead` naming the second organisation | `403` |
| `organisation_admin` attempting an enrolment | `403` |

The enrolment state machine is then re-proved on one durable row: `insert`, `no-op` on the
repeat, `revoke`, `reactivate`, with exactly one row for the cohort and learner at the end
and that row active.

## Decisions taken

- **A dry run is a learner journey, not a fixture walk.** Every mark in these journeys is
  written by the server; the only rows the suite writes are the starting state a learner
  would already have. A source check in `validate-day3-dry-runs.mjs` fails the build if the
  suite ever writes an assessment row, an item result or a credential.
- **The answer key comes from the reviewed bank, not from a response.** The suite reads
  `contentFor(courseId)` and maps each item id to its reviewed answer, so a wrong assertion
  cannot be produced by scraping a payload.
- **Readiness is proved the way a learner proves it.** One option at a time, through the
  real revision route, with no access to the answer index.
- **The certificate is proved by refusal here, not by issue.** Issuing and idempotency are
  already proved by `scripts/e2e-certification.mjs`, which runs in the same command. Day 3
  proves the condition that matters for a pathway: a module pass can never certify.
- **The transfer-project evidence kinds stay contracts in this release.** The
  independent-start and changed-requirement evidence are defined per pathway in
  `lib/transfer-projects.ts` and validated on every run, but no learner record stores that
  evidence yet. The changed requirement the learner actually meets in this release is the
  revision plan from a failed attempt, which is stored, gated and marked by the server. The
  transfer-project recorder is the next piece of product work, and this document says so
  rather than implying the journeys cover it.
- **No new table and no new endpoint.** The journeys can be proved entirely through surfaces
  that already exist, so this phase adds none, and the migration journal ends at `0008`
  exactly as Day 2 left it.

## Proof

Run from the repository root, with the local dev server on `http://localhost:3001` (this run
used `http://localhost:3002` through `KIDYCODE_E2E_URL` because another worktree's server
held 3001):

```
npm ci
npm run check          # typecheck, every contract including the new one, and the database audit
npm run lint
npm run build
npm run test:e2e       # every journey, ending with the dry runs
npm run test:browser:experiences
npm run test:browser:product
```

Results are recorded in the release notes at the end of this document, with the exact commit.

## Findings from the dry run

Three defects were found while running the gates. All three are in the checks, not in the
product, and all three made a correct product look broken, which is the failure mode this
repository has been bitten by before.

- **A Windows checkout broke a gate.** `scripts/validate-transfer.mjs` asserted on a
  multi-line source string, and a checkout with `core.autocrlf=true` turns those newlines
  into CRLF, so `npm run check` failed with "A successful claim must answer with the course
  path" against code that was correct. The reader now normalises CRLF before matching.
- **A certificate assertion matched chance digits.** `scripts/e2e-certification.mjs`
  asserted that the issued certificate payload did not contain the string `88`, so a
  randomly generated learner nickname or credential id containing `88` failed a correct
  certificate. The check now inspects the payload's own values: no mark-bearing key and no
  numeric value equal to the raw mark.
- **The certificate browser sweep could only run on port 3001.** `scripts/browser-journey.py`
  hardcoded its base URL while every other sweep reads `KIDYCODE_E2E_URL`, so against a
  server on any other port the seeded session was not recognised, every journey reported
  "the learner is not authenticated", and the sweep looked like a product failure. The base
  URL now follows the same environment variable with the same default.

No severity-one defect was found in the four-pathway journeys themselves.


## Not done, and owned by later work

- No learner record yet stores transfer-project evidence (an independent start, a written
  plan, working behaviour, a changed requirement in a transfer project). The contracts and
  the changed-brief levels are validated on every run; the recorder, its route and its
  screen are not built.
- The institution pilot still cannot create or edit an organisation, a member or a cohort
  through a route; they are seeded locally, and the enrolment endpoint remains the one write.
- Certificate wording stays pending approval. No co-branding, accreditation claim,
  production data or child data is touched on this branch, and nothing is published or
  deployed. The branch is a release candidate for human review only.
- The dry runs are simulation, not evidence from children. Human pilot evidence remains
  gated behind guardian consent and controlled beta access.

## Release notes for this run

Verified on branch `wt/t_51d1c845` at the commit this document landed with, against a local
vite server on `http://localhost:3002` and the local D1 store it creates under `.wrangler`:

| Gate | Result |
| --- | --- |
| `npm ci` | 676 packages installed, exit 0 (30 advisory warnings from transitive dependencies, unchanged by this branch) |
| `npm run check` | exit 0: typecheck clean, every contract passes, Day 3 contract 43 checks 0 failed, database audit 12 checks 0 failed, assessment satisfiability 433 checks, certification 18 checks |
| `npm run lint` | exit 0, no problems |
| `npm run build` | exit 0, every route classified |
| `npm run test:e2e` | exit 0, every journey passes: tutor 74, guardian 14, portfolio 14, lifecycle 9, transfer races 6, assessment API 13, revision 8, defence 10, payload leak 12, certification 17, dry runs 32 |
| `npm run test:browser:experiences` | 24 measurements over 8 routes at 320, 768 and 1440 pixels, 0 failed |
| `npm run test:browser:product` | 120 screens over four courses at three widths, 0 findings |

One further note on the runs themselves: the end-to-end suite bounds transfer claim attempts
per source address for ten minutes, so repeated full runs from one machine inside that window
rate-limit the next run. Two intermediate runs in this session failed for that reason and
were re-run after the local claim-limit rows were cleared. The suite passes cleanly on a
quiet local store, and no product behaviour was changed to make it pass.

