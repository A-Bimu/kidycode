# Day 2: the learner and institution experiences

Day 2 of the 72-hour V2 build is the product-experience day. Day 1 fixed the contracts:
the institution schema, the LMS account and enrolment rules, the transfer-project banks and
the role boundaries. Day 2 is the screens and the routes that a learner, a guardian or a
school actually meets, all of them written against those contracts rather than around them.

The Day 2 gate in `docs/72-hour-v2-execution.md` is "routes build and work on phones,
tablets and laptops; real/demo/pending data labelled". This document records what was
built, the decisions taken, how each part is proved, and what is deliberately still open.

## What shipped

| Area | Where it lives | Proved by |
| --- | --- | --- |
| Learning dashboard | `app/dashboard/page.tsx`, `lib/learning-experience.ts` | `scripts/validate-day2-experiences.mjs`, `scripts/browser-sweep-day2.py` |
| Course catalogue | `app/catalogue/page.tsx`, `courseCatalogue()` | same |
| Notes Library | `app/notes/page.tsx`, `notesLibrary()` | same |
| Practice Lab | `app/practice/page.tsx`, `practiceLab()` | same |
| Standalone UI and UX Design course | `app/design/page.tsx`, `lib/design-course.ts` | `designCourseIssues()`, the screen sweep |
| Build Outside KidyCode | `app/build-outside/page.tsx`, `lib/build-outside.ts` | `buildOutsideIssues()`, the screen sweep |
| Institution pilot workspace | `app/institution/page.tsx`, `components/PilotWorkspacePanel.tsx`, `app/api/institution/workspace/route.ts` | the workspace checks, plus the four-role requests below |
| Pilot enrolment endpoint | `app/api/institution/enrolment/route.ts` | `planEnrolment()`, plus the state-machine requests below |
| Curriculum map | `app/curriculum/page.tsx`, `lib/curriculum-map.ts` | `curriculumMapIssues()` |
| Skills Evidence Record | `lib/skills-evidence.ts` | `skillsEvidenceIssues()` |
| Pending-approval certificate wording | `lib/certificate-language.ts` | `certificateWordingIssues()` |
| Shared navigation | `components/ExperienceNav.tsx` | the screen sweep |
| Responsive styles | `app/globals.css` | the screen sweep |

## Decisions taken

### One navigation bar, one page shell

Every new screen is a server component that renders `<ExperienceNav current="..." />` and
the shared `.kc-page` shell. There is no new state container, no new data fetching layer
and no new colour: the Day 2 styles use the existing palette variables, and the validator
fails if a literal colour appears in the Day 2 block. That is what keeps the eight new
screens from drifting apart as more are added.

### Every screen says what kind of data it is showing

The gate asks for real, demo and pending data to be labelled, so each screen carries the
label in its own words:

- the catalogue labels every entry `real`, `demo` or `pending` and explains what the label
  means (`provenanceNote`), and the label is checked for every entry in the validator;
- the dashboard and the design course carry a demonstration banner, because a signed-out
  visitor sees no saved work;
- the Notes Library and the Practice Lab carry a real-content banner, because they render
  the published courses themselves;
- Build Outside and the institution workspace carry a pending banner: both wait for
  guardian consent and a controlled pilot;
- the curriculum map shows the Skills Evidence Record and the certificate wording, and the
  certificate wording is `pending-approval` for every course.

The browser sweep asserts a provenance label is visible on all eight routes at all three
widths, so this cannot quietly regress.

### The pilot workspace holds no rules of its own

`buildPilotWorkspace()` answers every read through `canRead` and every action through
`canActOn`. The route reads the identity from the platform headers and nothing else, so a
caller cannot choose who they are; the `organisation` query parameter can only select
between two memberships the same person genuinely holds, because `resolveMembership`
refuses an organisation the identity does not belong to. The screen draws only what came
back and names what the role cannot see rather than leaving a gap that looks like missing
data.

The capabilities and the hidden list are answered across every scope the role works in
(the organisation plus each cohort it holds), not at the organisation scope alone. Asking
only at the organisation scope reported a cohort lead who was visibly reading a roster as
able to "read nothing" and as read-only, which was wrong and is now a regression check in
the validator.

### The Practice Lab carries no answer

The Practice Lab shows the task, the automatic requirements and three hints, and never the
answer or an explanation. The validator asserts that mechanically, on the serialised lab
for every pathway, as well as on the source.

### Certificate wording waits for approval

`certificateWording()` returns `status: "pending-approval"` and `coBranding: false` for
every course, and withholds every claim that needs written approval. No university,
accreditation or co-branding claim is made anywhere on this branch.

## Proof

Run from the repository root:

```
npm run check                 # tsc, every contract including the Day 2 one, and the audit
npm run lint
npm run build
npm run test:browser:experiences   # needs the local dev server on http://localhost:3001
```

`npm run check` passes: TypeScript is clean, and the database audit still reports 12 checks
passed, 0 failed. The Day 2 contract reports 20 checks passed, 0 failed, including:

- the catalogue reaches six programmes and labels every entry;
- the Notes Library covers every lesson in every pathway and the Practice Lab carries no
  answer and no explanation;
- no workspace crosses the organisation, including the administrator;
- a roster names a learner only where a learner identity may be read, and a reviewer sees
  a stable label instead of a name;
- a reviewer is denied learner identities and learner code, an administrator is denied both
  as well, and a cohort lead is denied only the organisation member list;
- the pilot route and the enrolment route call the shared boundary helpers and read no
  request body for the identity;
- the design course is complete and adapted for four age bands, Build Outside names six
  stations with a safety rule each, the curriculum map covers coding, design and tooling,
  the Skills Evidence Record carries every evidence kind and never asserts accreditation;
- no Day 2 source uses a dash as punctuation, the banned colour name, or a banned
  capability, and the Day 2 styles introduce no new colour.

`npm run build` passes and classifies all eight new routes.

`scripts/browser-sweep-day2.py` drives a real local headless Chrome over the eight routes
at 320, 768 and 1440 pixels: 24 measurements, 0 failed. Each measurement asserts no
horizontal overflow, one `h1`, one `main`, no skipped heading level, no em dash in the
visible text, a rendered provenance label, and no green in the computed palette.

### The institution workspace against real tables

The pure-function checks do not by themselves prove the route. With the local dev server
running, `scripts/seed-local-pilot.mjs` applies the journal to the gitignored local D1 file
in `.wrangler/state` and writes one pilot organisation (two organisations, four members
across three roles plus an outsider, two cohorts, four learners, one review, no learner
code). The route was then called with the platform identity headers:

| Caller | Result |
| --- | --- |
| no headers | `401` "Sign in to open the pilot workspace." |
| `p-admin`, `organisation_admin` | `200`; organisation scope, sees the member list, sees no learner identity and no learner name, `learner identities`, `learner code` and `assessment evidence` named as hidden |
| `p-lead`, `cohort_lead` | `200`; cohort scope, reads the roster with learner names and the academic review, may enrol and revoke, not read-only, denied only "the organisation member list"; never reaches the cohort in the other organisation |
| `p-review`, `academic_reviewer` | `200`; cohort scope, reads the roster as `Learner NER1`/`Learner NER2` and never a name, reads evidence, denied `learner identities` and `learner code` |
| `p-outsider`, `organisation_admin` in the second organisation | `200`; sees only its own organisation and cohort, never the first |

The enrolment endpoint was exercised through its whole state machine as the cohort lead:
`insert` on a new learner, `no-op` on the repeat, `revoke`, then `reactivate` on the same
row, with the roster still showing three enrolments and one active link afterwards. The
boundaries refuse: an administrator enrolling a learner is `403 refused` ("This role may
not change enrolments for that cohort."), a reviewer enrolling is `403 refused`, an
outsider naming the first organisation is `403`, a lead naming the second organisation is
`403`, and no identity at all is `401`.

## Not done, and owned by Day 3 or later

- No route creates or edits an organisation, a member or a cohort. They are seeded locally
  only; the enrolment endpoint is the one write that exists.
- The member-to-cohort assignment is still an open contract. The workspace therefore scopes
  a cohort-role to the active cohorts of its own organisation, and the per-cohort scope
  test in `canRead`/`canActOn` still applies, so a lead still never reaches another
  organisation.
- The institution screen cannot be rendered signed in against the local dev server, because
  the local browser cannot set the platform identity headers. Its loading and refusal
  states are swept in the browser; the resolved workspace is proved by the requests above.
- No dry-run journeys, no failed-then-corrected retry, no changed-requirement replay and no
  end-to-end persistence run over the four pathways. Those are the Day 3 gate, together
  with the full typecheck, lint, curriculum and database contracts, production build, E2E
  and browser suites.
- Certificate wording stays pending approval. No co-branding, accreditation claim,
  production data or child data is touched on this branch, and nothing is published.
