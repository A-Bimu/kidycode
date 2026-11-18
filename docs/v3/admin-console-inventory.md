# Admin console inventory (feat/admin-review-console @ dde4a53)

Compact inventory written before coding, as step 1 of the brief. Everything below was
read from the checkout, not assumed.

## Reusable, already on this branch

| Path | What it is | Verdict |
| --- | --- | --- |
| `lib/admin-security.ts` | Owner gate: `proxy-signature` mode only, `KIDYCODE_IDENTITY_SECRET` >= 32 chars, explicit `KIDYCODE_ADMIN_USER_IDS` allowlist, `SAFE_ID` pattern, fail-closed `adminNoAccess()`. | Reuse. It is the right boundary. Extended, not replaced. |
| `lib/admin-runtime.ts` | Reads `cloudflare:workers` `env` once and calls the gate. | Reuse. Extended to report demo provenance. |
| `lib/admin-curriculum.ts` | Builds the pathway/unit/lesson index from `courses` + `designCourses`, including answer keys, hints, tests, starter files and the final assessment. | Reuse. Extended with lookups + flat index. |
| `lib/identity-trust.ts` | `platform-headers` / `proxy-signature` / `deny`. HMAC-SHA-256 over `id\nemail\nissued-at`, 300s skew, constant-time compare. | Reuse unchanged. |
| `lib/guardian-identity.ts` | The only reader of the forwarded identity headers. | Reuse unchanged. |

**There is no `/admin` route, page or component.** `grep -rl admin app` returns only
`app/institution/page.tsx` (a mention in role copy). The console UI does not exist yet.
This inventory explicitly does not claim the console is built.

## Auth trust boundary (verified by reading the code)

- Owner access requires `proxy-signature`: a valid HMAC over the forwarded identity plus
  an allowlisted `platform_user_id`. An unsigned header, a learner cookie, a guardian
  link, an `organisation_admin` row and a query parameter are all insufficient — the
  gate reads headers only, via `trustForwardedIdentity`.
- Deployment status: `KIDYCODE_IDENTITY_TRUST` / `KIDYCODE_IDENTITY_SECRET` /
  `KIDYCODE_ADMIN_USER_IDS` are **not configured anywhere in the repo** (no
  `wrangler.toml`; `types/cloudflare.d.ts` declares them optional). So in every
  environment reachable today the owner gate resolves to *unconfigured* and denies.
  This is the honest starting state, and it is the gate that has to be switched on by
  the owner before a real review URL can exist.

## Data model (D1, `db/schema.ts`, 25 tables, migrations 0000–0009)

Genuinely recorded today:

- `learner_profiles` — `created_at`, `last_seen_at`, `age`, `course_id` (no sign-in log).
- `course_progress` — per learner/lesson `status` + `updated_at`.
- `project_checkpoints`, `exam_attempts`, `lesson_evidence` (`attempts`,
  `successful_checks`), `tutor_interventions`, `assessment_attempts` /
  `assessment_item_results` / `assessment_signals` / `assessment_credentials`.
- `organisations`, `organisation_members`, `cohorts`, `cohort_enrolments`,
  `member_cohort_assignments`, `academic_reviews`.

**Not recorded anywhere:** a sign-in/session event log, page-view or interaction
telemetry, and any cohort week-indexed retention source. P1 therefore reports
`last_seen_at` and lesson completion as real, and reports verified sign-ins, DAU/WAU,
retention cohorts and interaction hotspots as **"not tracked yet"**. No counts are
invented.

## Migration constraint (deliberate)

`scripts/audit-database.mjs` pins the newest migration to `0009_member_cohort_assignments`
and asserts the prefix sequence `0000..0009` exactly. `scripts/validate-certification.mjs`
pins `assessment_credentials` to migration 0007. Adding a migration would require editing
two guard scripts that exist to notice schema drift, so **no migration is added**. Owner
review notes are therefore stored browser-local with an explicit "saved in this browser
only" label plus JSON export/import — the durable-storage option is a follow-up that needs
an approved migration.

## Gaps the brief asks for that this branch does not have

- No admin route protection on any route (nothing to protect yet).
- No quality/consistency checks over the curriculum.
- No analytics layer at all.
- No notification/template layer.
- `types/cloudflare.d.ts` was missing `KIDYCODE_ADMIN_USER_IDS`, so the branch did not
  even typecheck (`tsc --noEmit` failed with 2 errors before this work).

## Release dependencies

PRs #23/#24/#26 and issues #21/#25 are all still draft/open. `main` is not a dependency
of this work: the console is additive and reads the curriculum from source modules, so it
does not need a merged V3 or the Practice Studio.
