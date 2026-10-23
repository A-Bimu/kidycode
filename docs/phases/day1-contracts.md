# Day 1: accounts, enrolments, transfer banks and role boundaries

Day 1 of the 72-hour V2 build is the contract day. Nothing here is a learner-facing
screen: Day 2 owns the product experiences. What Day 1 fixes is the shape of the data and
the rules that every later screen has to obey, together with the checks that prove they
hold.

The Day 1 gate in `docs/72-hour-v2-execution.md` is "schema and role checks pass; every
pathway has a transfer-project contract". This document records what was built, the
decisions taken, how each part is proved, and what is deliberately still open.

## What shipped

| Area | Where it lives | Proved by |
| --- | --- | --- |
| Institution schema and additive migration | `db/schema.ts`, `drizzle/0008_ancient_centennial.sql` | `scripts/audit-database.mjs`, `scripts/validate-institution-roles.mjs` |
| Four transfer-project banks, four scaffold levels | `lib/transfer-projects.ts` | `scripts/validate-transfer-project.mjs` |
| Roles, organisation and cohort boundaries | `lib/institution-roles.ts` | `scripts/validate-institution-roles.mjs` |
| Signed-in LMS accounts, learner linking, enrolments | `lib/lms-accounts.ts` | `scripts/validate-institution-roles.mjs` |

## Decisions taken

### Schema

Five tables were added, and no existing table was altered:

- `organisations`
- `organisation_members`, the signed-in grown-ups inside one organisation, keyed by the
  platform identity and the organisation
- `cohorts`, one teaching group inside one organisation on one course
- `cohort_enrolments`, the durable learner link
- `academic_reviews`

Two rules were put into the shape rather than into a route:

1. **The institution is outside the learner cascade.** `organisations`,
   `organisation_members` and `cohorts` hold no learner identifier, so removing a learner
   removes their enrolment and their reviews and nothing about the institution. The audit
   walks the foreign key graph and fails if any table escapes the learner cascade without
   being named as deliberately outside it.
2. **A review never holds learner work.** `academic_reviews` carries a scope, an outcome,
   a compact evidence summary and an optional note. It has no column for code, for a draft
   or for HTML.

### Migration

`0008_ancient_centennial` was produced by `drizzle-kit generate` from the schema, not
written by hand, and then left unedited. It contains five `CREATE TABLE` statements and
nine `CREATE INDEX` statements and nothing else: no drop, no alter, no data write. The
audit asserts that shape, applies the migration to a store seeded at 0007 and checks that
every pre-existing row is unchanged and that the five new tables arrive empty.

### Roles

Five roles and twelve actions, in one permission table that is closed by default: an
action a role has not been granted is refused, so a new action cannot arrive allowed by
accident.

| Role | Scope | What it may do |
| --- | --- | --- |
| `organisation_admin` | whole organisation | manage the organisation and its members, create cohorts, revoke an enrolment, read rosters and progress summaries |
| `programme_coordinator` | whole organisation | create cohorts, enrol and revoke learners, read rosters, progress summaries and learner identities |
| `cohort_lead` | own cohorts | enrol and revoke learners, read rosters, progress, assessment evidence, learner identities and learner code |
| `instructor` | own cohorts | read rosters, progress, assessment evidence, learner identities and learner code |
| `academic_reviewer` | own cohorts | read rosters, progress and assessment evidence, record and decide an academic review |

The boundaries that matter:

- **No role crosses an organisation**, including the administrator. The scope test refuses
  a missing organisation on either side.
- **Only an instructor or a cohort lead may read learner code**, and only with an explicit
  cohort, so a summary view can never widen into a copy of a learner's work.
- **An academic reviewer never reads learner code or a learner identity.** A review is a
  decision about evidence, so the reviewer is given the evidence and not the work.
- **No role may issue a certificate from a review.** Issuing stays with the existing
  eligibility check that reads the learner's own assessment record, and
  `reviewIssuesCertificate()` always answers no so no caller can reach it by mistake.

### Accounts and enrolments

There is no second sign-in. The LMS reads the same platform identity headers the guardian
side already reads, and `LMS_SIGN_IN_PATH` is the platform's own path. A membership is
resolved from the identity plus the organisation the person actually belongs to; when the
same person holds accounts in two organisations and none is named, no membership is
returned rather than guessing.

An enrolment is planned, not written, by a pure function: `insert`, `reactivate`, `revoke`,
`no-op` or `refused`. A returning learner reactivates the same row, so the history of who
was enrolled, by which organisation, survives a revoke.

### Transfer projects

One bank per pathway, matched to the course facts at validation time so a bank cannot
drift to the wrong pathway. Each bank holds two projects and four scaffold levels:

1. `modelled`, a worked example with the decisions explained
2. `prompted`, requirements or steps without answers
3. `goal-only`, the problem or goal alone
4. `changed-brief`, the goal plus one requirement that changes after a working version
   exists

The four evidence kinds are an independent start, a written plan, working behaviour, and a
changed requirement. `transferContractIssues()` is the rule; it is a function so a bank
added later is checked by the same code the validator runs, and it fails a bank that does
not require every evidence kind at some level and the last three at the changed-brief
level. A transfer project may not reuse a guided project title from its own pathway or any
other.

## Proof

Run from the repository root:

```
npm run check   # tsc, all contracts including the two new ones, and the database audit
npm run lint
```

`npm run check` passes: TypeScript is clean, all 22 contract scripts and test files pass
(the 20 that existed before this work plus the two Day 1 checks), and the database audit
reports 12 checks passed, 0 failed, including:

- a fresh local database reaches the current schema from 0000 through 0008
- 0008 is the only migration that creates the institution tables, and it is purely
  additive
- 18 of 23 tables cascade from the learner; `organisations`, `organisation_members`,
  `cohorts`, `guardian_accounts` and `transfer_claim_limits` are deliberately outside it
- deleting a learner removes the learner link and the review and leaves no orphan
- a store from before Day 1 upgrades through 0008 with its rows intact, and an
  organisation, its member and its cohort outlive the learner who was enrolled in it

## Not done, and owned by Day 2 or later

- No route writes an organisation, a member, a cohort, an enrolment or a review yet. The
  rules and the schema are in place; the pilot workspace that uses them is Day 2, and it
  must call `canActOn` or `canRead` rather than restating the rules.
- No learner-facing transfer project screen exists. The contracts are in place; the
  transfer experience is the Day 2 and Day 3 work.
- The four scaffold levels are described per pathway but are not yet attached to any
  learner record, because the evidence they require is only meaningful once the transfer
  experience records it.
- Certificate wording that is pending institutional approval is Day 2, and no
  co-branding, accreditation claim, production data or child data is touched on this
  branch.
