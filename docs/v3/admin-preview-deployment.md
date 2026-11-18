# Owner admin console — Vercel review deployment

Read-only, access-controlled owner review target for the KidyCode admin console. It is a
**second build of this repository**, not a fork: `admin-preview/` compiles the same console
against the same curriculum sources, on Node, with no database and no learner records.

Everything here is owner-review material. Nothing in this document claims production
readiness, and nothing here was merged to `main`.

---

## Why a second build target exists

Vercel's Next.js preset runs `npm run build`, which is `scripts/build-verified.sh` →
`vinext build`. That build is correct and stays correct — it produces the Cloudflare Worker
bundle in `dist/`. Vercel then fails with `NEXT_OUTPUT_DIR_MISSING`, because it expects a
`.next` directory and Vinext does not emit one.

Running `next build` at the repository root instead fails later, while collecting page data
for routes such as `/api/guardian/connections` and `/api/checkpoints`:

```
Cannot find module 'cloudflare:workers'
```

Three modules import that specifier and only resolve inside the Workers runtime:
`lib/admin-runtime.ts`, `lib/institution-identity.ts` and `lib/server-database.ts`. This is a
runtime incompatibility, not a missing dependency.

Neither failure is fixed here by pointing Vercel's output directory at `dist/` or by stubbing
`cloudflare:workers`. The Cloudflare application is untouched and continues to build and run
exactly as before. Instead, the deployment target is **separated**: `admin-preview/` is a
standalone Next.js app with its own `package.json`, its own lockfile, its own workspace root
and no Worker bindings.

## How the two builds stay in step

`admin-preview/scripts/sync-shared.mjs` walks the import graph from a small set of entry
points and vendors exactly that closure into `admin-preview/src/shared/`, preserving each
file's repository-relative path. The directory is git-ignored and regenerated on every build
(`prebuild`), so the root files remain the single source of truth and the copies cannot drift.

The same script **fails the build** if the closure ever reaches `cloudflare:workers` or one of
the three Cloudflare-only modules — the incompatibility cannot silently return.

What is vendored: `components/admin/{AdminConsole,LessonContent,reviewKey,types}`,
`app/admin/admin.css`, and the pure `lib/admin-*`, `lib/identity-trust.ts` and
`lib/guardian-identity.ts` modules (25 files; external packages required: `next`, `react`).

`scripts/validate-admin-preview.mjs` runs as part of `npm run check` and asserts the vendored
console and stylesheet are byte-identical to the originals, that the closure is Node-safe,
that no admin route contains a write, and that the review target reuses `lib/admin-security.ts`
for its gate instead of reimplementing it.

## Access control

Two independent gates, both fail-closed.

**Hosting layer.** The deployment is a Vercel *preview* deployment on the existing `kidycode`
project. Deployment protection (Vercel Authentication) applies to it, so an unauthenticated
visitor is stopped by the platform before any application code runs.

**Application layer.** `admin-preview/src/lib/preview-runtime.ts` is the Node twin of
`lib/admin-runtime.ts`. It reads the same configuration names from the process environment and
passes them to the **repository's own** `lib/admin-security.ts` — the trust mode, the signed
identity rules, the id allowlist, the synthetic-review switch and the constant-time key
comparison are not reimplemented. The rules are:

- Owner access requires `proxy-signature` trust mode, a `KIDYCODE_IDENTITY_SECRET` of at least
  32 characters, an allowlisted id in `KIDYCODE_ADMIN_USER_IDS`, and a valid HMAC over the
  forwarded identity.
- Synthetic review — the only path available in this deployment today — requires the
  deployment flag `KIDYCODE_ADMIN_REVIEW_DEMO=1` **and** a deployment-held
  `KIDYCODE_ADMIN_REVIEW_KEY` of at least 16 characters. It is refused the moment a real
  signing secret exists. Every response is stamped `provenance: "synthetic"`.
- With neither configured, every admin endpoint returns `403` and the console renders its
  closed state. The page shell itself carries no data.

The review key arrives once as `/?review=<key>` on `/admin`, is moved into that tab's
`sessionStorage`, and is stripped from the address bar. It is never rendered into the page and
never appears in a screenshot.

## Data honesty

| Concern | Behaviour in this deployment |
| --- | --- |
| Curriculum | Real. The same source modules the learner routes render, including answer keys. |
| Analytics | Every metric is `unavailable` with the table it would have come from. No figure is estimated or back-filled. |
| Not recorded by KidyCode | `verified-sign-ins`, `dau-wau`, `retention-cohorts`, `interaction-hotspots` are returned under `notTracked` with a reason and what would need instrumenting. |
| Learner records | None. There is no database, so there is nothing to leak. |
| Writes | None. No admin route contains an `INSERT`/`UPDATE`/`DELETE` or a `.run()`. The lesson route has no database access at all. |
| Notifications | Dry run only. `liveDeliveryEnabled` is hard-coded `false`; no provider or credential is read. |

## Configuration

Set on the Vercel `kidycode` project (`annettemumbi1-gmailcoms-projects`) for the preview
environment:

| Variable | Purpose |
| --- | --- |
| `KIDYCODE_ADMIN_REVIEW_DEMO` | `1` switches the synthetic-review path on. |
| `KIDYCODE_ADMIN_REVIEW_KEY` | The deployment-held review key (≥16 chars). The owner's only way in until a signing edge exists. |
| `KIDYCODE_ADMIN_REVIEW_DEPLOYMENT` | `1` labels this build as the review target. |

To move to real owner access, add `KIDYCODE_IDENTITY_TRUST=proxy-signature`,
`KIDYCODE_IDENTITY_SECRET` (≥32 chars) and `KIDYCODE_ADMIN_USER_IDS`. The synthetic path then
closes automatically.

## Verification

`admin-preview/tests/preview.test.mjs` starts the built app the way Vercel does and checks,
live: unauthenticated reads refused (401/403 for all five endpoints, GET and POST), a wrong or
short review key refused, the owner key opening a synthetic session, all **8 pathways**,
**60 units** and **248 lessons** present with their answer keys, a lesson opening with notes
and answer key and no database call, analytics reporting only `unavailable` plus the four
`notTracked` entries, notification drafting refusing live delivery, and the shell served
`noindex`.

That suite runs in CI as the `admin-review-target` job, which builds the target and then runs
these checks.

## Not in this deployment

- No real learner analytics, because no database is attached. The owner's real numbers appear
  only in a deployment where the database is configured.
- No live staging with true owner authentication. `KIDYCODE_IDENTITY_SECRET` and
  `KIDYCODE_ADMIN_USER_IDS` are not provisioned, so the signed-owner path cannot open here.
- Review notes remain browser-local. No migration was added; `scripts/audit-database.mjs`
  still pins migrations `0000–0009`.
- Nothing was merged to `main`.

---

## Live review deployment (verified)

| | |
| --- | --- |
| URL | https://kidycode-cqqgi4p2g-annettemumbi1-gmailcoms-projects.vercel.app |
| Deployment | `dpl_54RSCuTqfbfoYhmbtXzYd5UZBQAo` (preview, project `kidycode`) |
| Commit | `41a7ff2` on `feat/admin-review-console` |
| Hosting gate | Vercel Authentication (`ssoProtection: all_except_custom_domains`) — an anonymous request is answered `302` to the platform sign-in, before any application code runs |
| Application gate | `KIDYCODE_ADMIN_REVIEW_DEMO=1` + `KIDYCODE_ADMIN_REVIEW_KEY` (preview environment); both held by the deployment, not in the repository |

The owner signs in to Vercel to reach it, then opens `/admin?review=<key>`. The review key is a
deployment secret: read it from the project's Environment Variables in the Vercel dashboard. It
is deliberately not written down anywhere in this repository.

### What was verified live

Because the deployment sits behind Vercel Authentication, anonymous `curl` cannot reach the
application at all. `vercel curl <path> --deployment <url>` from `admin-preview/` gets through
the platform gate with an authenticated CLI, which is how the following were measured against
the deployed URL:

| Probe | Result |
| --- | --- |
| Anonymous `GET /`, `/admin`, `/api/admin/*` | `302` → Vercel Authentication |
| `GET /api/admin/{curriculum,lesson,analytics,notifications}` with no key | `403` |
| `POST /api/admin/notifications` with no key | `403` |
| `GET /api/admin/curriculum` with a wrong key | `403` |
| `GET /api/admin/session` with the key | `200`, `authenticated: true`, `permission: "synthetic-review"`, `readOnly: true` |
| `GET /api/admin/curriculum` with the key | `200`, `provenance: "synthetic"`, 8 pathways, 60 units, **248 lessons**, 244 with answer keys |
| `GET /api/admin/lesson?key=…` with the key | `200`, notes, hints, requirements and the answer key |
| `GET /api/admin/analytics` with the key | `200`, `databaseConnected: false`, every metric `unavailable`, the four `notTracked` ids present |
| `GET /admin` | `200`, noindex |

The console itself was rendered in headless Chrome (local build, same commit) at 320, 768 and
1440 px: all seven sections present, no horizontal overflow at any width, and the approved
navy / blue / white / gold palette with no warm shade and no green.

### Deploying (what actually works)

```bash
cd admin-preview
vercel link --yes --project kidycode          # first time only
vercel deploy --yes                            # a preview deployment
```

Deploy from **inside** `admin-preview/`, so the uploaded root and the build root agree. Setting
the project's Root Directory to `admin-preview` and deploying from the repository root does not
work: the Next.js build succeeds and then the deploy step fails with

```
ENOENT: no such file or directory, lstat '/vercel/path0/.next/routes-manifest-deterministic.json'
```

because the deployment root stays the repository root while the app is built one level down.
Consequently the project's Root Directory is left as the repository root, and **Git pushes do
not auto-deploy this target** — the preview above was published with the CLI command. Wiring the
Git integration to it is an open item, not something this change claims.

