# KidyCode V1 launch runbook

Everything in this runbook was run on this machine against a local D1 store and a
local development server. Anything that could not be verified locally is listed
under "Known external launch decisions" rather than claimed as done.

## 1. Local installation

```
git clone https://github.com/A-Bimu/kidycode.git
cd kidycode
npm ci --no-audit --no-fund
```

Node 20 or newer. On Windows the shell is Git Bash; on Linux or macOS use the same
commands.

## 2. Development command

```
npm run dev
```

The development server binds a local D1 database under `.wrangler/state/v3`. The
migrations must be applied to that same store before the API can answer, which is
what the next section covers.

## 3. Migrations

Seven migrations exist, `0000` through `0006`. V1 added none: the completion record,
the portfolio, the guardian milestones and the deletion operation are all derived
from tables that already exist.

| Migration | What it creates |
| --- | --- |
| `0000` | learner profiles, course progress, project checkpoints, exam attempts |
| `0001` | adaptive tutor evidence |
| `0002` | learner profile columns added with the tutor work |
| `0003` | lesson evidence and tutor interventions |
| `0004` | cross lesson concept review |
| `0005` | guardian accounts, guardian links and connection codes |
| `0006` | learner transfer codes and the transfer claim bound |

Apply them in order, to the store the server actually reads:

```
npx wrangler d1 execute site-creator-d1 --local --persist-to .wrangler/state \
  --config .sites-runtime/e2e-wrangler.toml --file drizzle/0000_breezy_psylocke.sql
# repeat for 0001 through 0006, in order
```

`--persist-to .wrangler/state` is deliberate: wrangler appends `v3/d1/...`, and the
server reads `.wrangler/state/v3/d1/...`. Passing `.wrangler/state/v3` writes to a
nested folder the server never opens, which is the single most common local setup
mistake in this repository.

### Verifying which migrations are applied

The tables are the truth, not the journal:

```
node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<file>.sqlite');console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all().map(r=>r.name).join(', '))"
```

A fully migrated store lists: `concept_review`, `course_progress`, `exam_attempts`,
`guardian_accounts`, `guardian_connect_codes`, `guardian_links`, `learner_profiles`,
`learner_transfer_codes`, `lesson_evidence`, `project_checkpoints`,
`transfer_claim_limits`, `tutor_interventions`.

### Safe order

Additive only, in numeric order, before the new code is served. Every migration here
creates or alters tables without dropping anything, so applying a later migration
before deploying its code is safe and is the preferred order.

## 4. Full test commands

```
npm run check          # TypeScript plus nine validators
npm run lint           # eslint, zero warnings
npm run build          # production build through scripts/build-verified.sh
npm run test           # check, then build
git diff --check       # whitespace and conflict markers
```

The suites that need a running server or the local store:

```
npm run dev &                                        # or a separate terminal
KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx scripts/e2e-tutor.mjs
KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx --no-warnings scripts/e2e-guardian-db.mjs
KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx --no-warnings scripts/e2e-portfolio.mjs
KIDYCODE_E2E_URL=http://localhost:4321 node --import tsx --no-warnings scripts/e2e-lifecycle.mjs
node --import tsx --no-warnings scripts/e2e-transfer-races.mjs
KIDYCODE_E2E_URL=http://localhost:4321 MSYS_NO_PATHCONV=1 node --import tsx --no-warnings "C:/Users/USER/.kidycode-e2e/browser.mjs"
```

The browser suite lives outside the repository so the verified install stays
untouched. It needs Playwright and Chromium installed in that folder.

## 5. Production build

```
npm run build
```

The build validates the Worker bundle, the marketing assets, the Sites metadata and
that all seven migrations are packaged into `dist/.openai/drizzle/`.

## 6. Deployment checklist

1. `git status` clean and `git log --oneline -1` shows the commit being released.
2. `npm ci` then `npm run check`, `npm run lint`, `npm run build` all pass.
3. Every migration from `0000` to `0006` is applied to the deployment database, in
   order. On a fresh database, apply all seven before the first request.
4. Confirm the deployment database lists the twelve tables named above.
5. Publish from the ChatGPT Sites project (see the note below).
6. Run the smoke tests in section 7 against the published address.
7. Keep the previous commit hash to hand for the rollback in section 8.

## 7. Post-deployment smoke-test journeys

Sign in through the ChatGPT Sites identity wall, then walk these paths:

1. The landing page loads and each of the four path links opens the right course.
2. Ages 10 to 12: create a learner, open a lesson, read the notes, work through the
   example, pass the practice check, take a hint, complete the activity.
3. Finish all six activities of module 1 and save the module project version.
4. Open My website: eight module cards appear, the saved one opens, the preview runs
   inside the sandbox and the code sections expand.
5. My progress: the completion record names the exact next requirement.
6. Grown-up view: connect with a connection code, see progress, the completion
   record and recent milestones, then disconnect.
7. Move to another device: create a transfer code, open `/transfer` in a private
   window, claim it, and confirm the course opens with the same progress.
8. Clear this device from My progress, then reopen the course with a fresh transfer
   code.
9. Privacy and grown-ups loads from the landing page, the learner progress page and
   the grown-up page.

## 8. Rollback

The application rolls back by deploying the previous commit; nothing in V1 changes
stored data shape. Migrations `0000` to `0006` are additive, so a rollback of the
code does not require a rollback of the schema. If a migration must be undone, take
a copy of the D1 database first and remove only the tables that migration created.

## 9. Known external launch decisions

- **Publishing.** The live Site is an OpenAI Sites project behind a ChatGPT sign-in
  wall. Publishing is done by the account holder from the Sites project; it cannot be
  triggered from this repository or from this machine. No deployment was performed as
  part of V1.
- **Applied migrations.** Migrations are only known to be applied where they were
  verified. They were verified locally against the local store. Whether the deployed
  database has `0000` to `0006` applied can only be confirmed by running the table
  check in section 3 against that database.
- **Identity.** Grown-up and learner identity for the guardian area comes from the
  platform identity headers the Sites runtime forwards. That contract is documented by
  the platform and cannot be exercised outside it, so locally the headers are supplied
  by the test harness.
- **No email.** V1 has no email path at all, so nothing on the site should be read as
  promising a notification.
- **Security headers.** The hosting configuration exposes no header surface, and the
  editor and portfolio previews are sandboxed iframes built from `srcdoc`. Rather than
  add an untested policy that could break those previews, no additional headers were
  introduced. The protections that exist are the HttpOnly, Secure, SameSite session
  cookie, the strict `allow-scripts` sandbox, the server side grading and the
  allow-list guardian view.
