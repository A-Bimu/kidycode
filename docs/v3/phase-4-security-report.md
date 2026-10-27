# Phase 4: institutional security and the release gate

Branch `wt/t_66b5f2cf`, base `a68710e` (P3 tip) on top of `8a12ac6`.
Separate review branch. Not merged, not deployed, no production database touched, no real
child data read or written. Local fixtures only.

## Verdict

**The cohort-access gate passes. The identity-trust gate does not, and this phase stops
short of declaring the security release gate met.**

The one thing this phase could not settle from inside the repository is whether the platform
edge strips a client-supplied `oai-authenticated-user-id`. The routes now read identity
through a trust module that can require the edge's signature, and the signed mode is proven
to refuse an unsigned, tampered, stale or replayed header. But no deployment is in that mode
yet: with no secret configured the app behaves exactly as it does today. Evidence for the
residual risk is in the report rather than left as prose.

Until a human decides between the two options below, the security gate stays open and no
child pilot should run against this build.

## Currently doing

Nothing. The phase work is committed and the gate is reported honestly rather than claimed.

## Completed, with commit and checks

1. **Persisted cohort assignments.** New table `member_cohort_assignments`
   (`db/schema.ts`, migration `drizzle/0009_member_cohort_assignments.sql`, snapshot
   `drizzle/meta/0009_snapshot.json`). One durable row per member and cohort, cascading from
   both, with `status` and `revoked_at` so a revoke keeps the history and a re-assignment
   reactivates the same row.
2. **The defect itself.** `app/api/institution/workspace/route.ts` and
   `app/api/institution/enrolment/route.ts` no longer derive a cohort-scoped role's scope
   from `SELECT ... FROM cohorts WHERE organisation_id = ?`. They read
   `member_cohort_assignments` for that member. A lead, instructor or reviewer with no
   active row now holds no cohort at all, so the boundary fails closed. Organisation-scoped
   roles keep their organisation-wide reads, bound to their own organisation id.
3. **A write path, so assignments are usable.** `POST /api/institution/assignments`
   (`app/api/institution/assignments/route.ts`) is the only writer. New action
   `assign_cohort`, granted to `organisation_admin` and `programme_coordinator` only, so a
   cohort-scoped role cannot widen its own scope. `planAssignment` in `lib/lms-accounts.ts`
   holds the insert/reactivate/revoke/no-op decision. Member and cohort from another
   organisation answer 404, not 403, so the endpoint cannot be used to discover another
   institution's rows.
4. **Identity trust boundary.** `lib/identity-trust.ts` and
   `lib/institution-identity.ts`. Three modes: `platform-headers` (current contract),
   `proxy-signature` (HMAC-SHA-256 over `user-id \n email \n issued-at`, constant-time
   compare, 300 s skew), and `deny`. A configured secret switches the deployment to the
   signed mode; an unknown mode string fails closed to `deny`. Institution routes ask the
   module, never the headers.
5. **Tests.** `scripts/validate-institution-security.mjs` (added to `npm run check`) and
   `scripts/e2e-institution-security.mjs` (added to `scripts/e2e-all.sh` and to
   `test:e2e:institution`).
6. **Seed grows the case that makes the negative test real.** `scripts/seed-local-pilot.mjs`
   now seeds two cohorts in the first organisation, an instructor assigned only to the
   second, three assignment rows, and a learner in each cohort.

## Checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | pass, no output |
| Full gate | `npm run check` | pass, exit 0, including the new security validator |
| Lint | `npm run lint` | pass, no warnings |
| Build | `npm run build` | pass, Worker bundle + assets + migrations validated |
| Database audit | `node --no-warnings scripts/audit-database.mjs` | 13 checks, 0 failed, including a new 0008 to 0009 upgrade proof |
| Institution security e2e | `KIDYCODE_E2E_URL=http://localhost:3011 node --import tsx --no-warnings scripts/e2e-institution-security.mjs` | 13 checks, 0 failed |
| Day 3 dry runs (regression) | `KIDYCODE_E2E_URL=http://localhost:3011 node --import tsx --no-warnings scripts/e2e-dry-runs.mjs` | 32 checks, 0 failed, including a transfer claim and its replay on all four pathways |
| Browser journey | `KIDYCODE_E2E_URL=http://localhost:3011 python scripts/browser-journey-v3.py 320 768 1440` | 142 checks, 0 failed, 8 screens, keyboard pass at 320 and 1440 |
| Signed identity mode, runtime | local server with `KIDYCODE_IDENTITY_SECRET` and `KIDYCODE_IDENTITY_TRUST=proxy-signature` in `.dev.vars` | unsigned header 401, correctly signed 200, signature reused for another identity 401 |

The runtime identity check used a temporary `.dev.vars` and a throwaway script, both deleted
before the commit. A shell environment variable alone is not seen by the Worker; the binding
has to come from the deployment configuration.

## What the security e2e proves

- A lead assigned only to cohort A sees exactly `["cohort-a"]`, and a learner in cohort B of
  the same school never appears in its response.
- The same lead is refused (403) when it tries to enrol into cohort B, and no row is written.
- It can still enrol inside cohort A (200, one durable row).
- An instructor assigned only to cohort B cannot read or enrol into cohort A, and cannot
  assign itself another cohort (403).
- The administrator keeps both cohorts of its own organisation and reaches nothing from
  `org-other`.
- An administrator's assignment widens the instructor's readable cohorts on the next
  request; a revoke narrows it again, and the revoked row is kept rather than deleted.
- A member or cohort from another organisation answers 404, and a cross-organisation
  enrolment answers 403.
- Saving the same lesson twice leaves exactly one `course_progress` row and keeps the
  learner's reflection.
- A transfer code works once: the first claim returns a new session, the replay answers 410,
  and the old session answers 401 afterwards.
- A caller that can set the forwarded header is believed in `platform-headers` mode. This is
  recorded as evidence of the residual risk, not as a passing security property.

## Blocked or unverified

1. **Identity trust is unreconciled at the deployment, blocked on a human decision.**

   The header contract is safe only if the platform edge is the sole writer of
   `oai-authenticated-user-*`. Nothing in this repository can prove that. In the current,
   unconfigured mode a request that can reach the app directly and set the header acts as
   that person; the e2e above demonstrates it. The signed mode closes that, but it needs the
   edge or proxy to compute the HMAC with a shared secret, which is a deployment change
   outside this worktree.

   Decision needed, one of:
   - configure the edge to sign forwarded identities and set `KIDYCODE_IDENTITY_SECRET` in
     the deployment (the intended end state), or
   - obtain written evidence that the current edge strips client-supplied copies of these
     four headers, and pin `KIDYCODE_IDENTITY_TRUST=platform-headers` so the choice is
     explicit rather than implied.

   Do not run a child pilot until one of those is true.
2. **No assignment management UI.** Assignment rows are written by the endpoint and by the
   local seed. The pilot workspace still does not offer a screen for them.
3. **No physical device, iOS Safari or screen-reader pass.** Keyboard evidence is browser
   focus and key handling only.
4. **The signed mode's clock skew is 300 s** and the secret is a long-lived shared value;
   rotation is not implemented.
5. **Local evidence only.** Every runtime check ran against a local dev server and a local
   D1 store. No deployed environment was exercised.

## Next step

Hand `docs/v3/phase-4-security-report.md` and the draft PR to review. The reviewer should
decide the identity question above; the cohort work can be reviewed independently of it.

## Recommendation

Take the signed-proxy option. It is the only option that does not depend on trusting an
unverifiable edge behaviour, and the code, the validator and the runtime proof are already
in place; the remaining work is deployment configuration plus a rotation story for the
secret. Keep the two changes in one review branch but land the cohort fix first if the
identity question takes longer.

## User action

1. Decide the identity option (sign at the edge, or supply evidence that the edge strips
   client copies and pin the mode).
2. Configure `KIDYCODE_IDENTITY_SECRET` in the deployment if the first option is chosen.
3. Review the draft PR; do not merge automatically.
