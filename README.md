# KidyCode

KidyCode is a self-paced coding platform for learners aged 10 and above. It teaches real HTML, CSS and JavaScript through focused notes, worked examples, typed code, automatic checks, short assessments and one website that grows throughout each course.

## Start here: project review

KidyCode addresses a practical learning problem: how can a beginner move from reading an explanation to writing working code, while keeping evidence of what they have learned?

The product combines a repeatable lesson flow with one website that develops throughout the course. The following map connects product decisions to the implementation so reviewers can inspect both the interface and the engineering behind it.

| Problem addressed | Product approach | Code to inspect |
| --- | --- | --- |
| Reading alone does not demonstrate a coding skill | Notes, typed practice, code checks and project checkpoints | [Learning interface](components/LearningApp.tsx), [checkpoint API](app/api/checkpoints/route.ts) |
| A learner gets stuck without knowing what to change | Support based on recorded attempts and failed requirements | [Tutor logic](lib/tutor.ts), [tutor API](app/api/tutor/route.ts) |
| Progress is hard to understand across many activities | A summary derived from saved learning evidence | [Progress interface](components/ProgressPage.tsx), [summary logic](lib/summary.ts) |
| Finished exercises do not show how a project developed | Saved module versions and a course completion record | [Portfolio interface](components/PortfolioPage.tsx), [completion rules](lib/completion.ts) |
| Moving devices can separate a learner from saved work | A one-time transfer code and session rotation | [Transfer interface](components/TransferPage.tsx), [transfer logic](lib/transfer-codes.ts) |

### Suggested hands-on review

Use a running instance with its database configured; see [Local setup and checks](#local-setup-and-checks). Use a disposable learner profile when reviewing.

1. Open `/learn`, choose a project and begin the first available activity.
2. Read the notes, type code and run it. Compare the preview with the stated requirements.
3. Try an incomplete answer, inspect the feedback, then correct it. Notice whether the next action is clear.
4. Complete the activity and inspect **My progress**. Reload to check that saved progress persists.
5. Continue to a module checkpoint and inspect **My website** to review the saved project version.

For a UI/UX review, also try a narrow viewport and keyboard navigation through the main learning flow. Record any focus, readability or feedback issues as findings; this guide is not an accessibility certification.

### Engineering evidence

The repository includes checks for learning content, grading, persistence and account flows:

- [Assessment engine tests](tests/assessment/engine.test.mjs) and [grading tests](tests/assessment/grading.test.mjs).
- [Tutor end-to-end checks](scripts/e2e-tutor.mjs).
- [Portfolio end-to-end checks](scripts/e2e-portfolio.mjs).
- [Transfer race checks](scripts/e2e-transfer-races.mjs).

See [package.json](package.json) for the current check commands. Test files show what is covered; they do not by themselves prove that a particular deployment has passed. When sharing a review, include the commit, environment, commands run and observed results.

## Complete learning paths

| Path | Course | Project outcome |
| --- | --- | --- |
| Ages 10 to 12 | Web Coding Foundations | Interest Guide, Club Website or Mini Magazine |
| Ages 13 to 15 | Practical Web Development | Personal Portfolio, Community Event Hub or Small Business Website |
| Ages 16 to 18 | Web Application Development | Revision Planner, Opportunity Directory or Service Dashboard |
| Adults | Web Skills for Work and Business | Professional Portfolio, Organisation Website or Service Business Website |

Every path contains eight modules and 48 activities in a consistent sequence:

1. Read clear notes and a worked example.
2. Type and run real code.
3. Use graduated hints only when needed.
4. Pass automatic code requirements.
5. Answer a quick knowledge check.
6. Save the next checkpoint of one continuous project.

Each course closes with a ten-question knowledge check and a practical code repair. Learners need both knowledge and working code to pass.

## Product routes

- Marketing site: `/`
- Ages 10 to 12: `/learn`
- Ages 13 to 15: `/learn/13-15`
- Ages 16 to 18: `/learn/16-18`
- Adults: `/learn/adults`

The interface is designed for phones, tablets and laptops. Draft work, completed activities, project checkpoints and final attempts are stored in Cloudflare D1. The learner session uses an HttpOnly cookie.

## Adaptive tutor

Each lesson carries an evidence based tutor. It reads the learner's own attempts, code checks, quick checks, module checks and nudge requests, then answers with the smallest useful support:

1. Name the exact requirement that failed.
2. Give the smallest useful hint.
3. Give a clearer explanation if the same requirement fails again.
4. Show a small related example only after repeated failure.
5. Acknowledge the specific concept once it is demonstrated.
6. Stop explaining once mastery is shown.

Support is driven by recorded evidence, never by a fixed label such as a learning style. Per lesson the server stores attempts, completed checks, hints requested, mastery, the concepts being struggled with, the support given, whether the learner corrected the problem independently, and the date of the most recent activity. Requirement labels and counts are stored, never the learner's code.

A weak concept is also remembered beyond its own lesson. Before new material, the learner may see one short recall card for a concept they missed earlier, with the smallest hint available and an honest two answer outcome. A concept is retired only after two recorded recalls, and a missed recall puts it straight back.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/tutor` | The signed in learner's own evidence for their course |
| `POST /api/tutor` | `nudge`, `check`, `quickcheck` or `quiz`, all graded on the server |
| `GET /api/review` | Concepts this learner should come back to |
| `POST /api/review` | Record a recall outcome for one concept |
| `GET /api/summary` | The learner's own progress summary, derived from existing records |
| `GET /api/portfolio` | The learner's own saved module versions and completion record |
| `GET /api/portfolio?module=<id>` | One saved module version, with its code and reflection |
| `DELETE /api/learners` | Clear this device: sign out and keep everything saved |
| `DELETE /api/learner` | Permanently delete the profile and every dependent row |
| `GET /api/guardian/connections` | The learner's own connected grown-ups |
| `POST /api/guardian/connections` | Create a one-time connection code |
| `DELETE /api/guardian/connections` | End a grown-up's access |
| `GET /api/guardian/session` | A signed in grown-up's own account and learners |
| `POST /api/guardian/links` | Connect using a one-time code |
| `DELETE /api/guardian/links` | Disconnect from a learner |
| `GET /api/guardian/summary` | A read only progress view for one connected learner |
| `POST /api/guardian/transfer` | A grown-up creating a transfer code for a linked learner |
| `GET /api/transfer/codes` | The learner's own pending transfer code |
| `POST /api/transfer/codes` | Create a one-time transfer code |
| `DELETE /api/transfer/codes` | Cancel an unused transfer code |
| `POST /api/transfer/claim` | Open the profile on a new device with a transfer code |

"My progress" in the learner navigation turns that evidence into counts and plain
labels: activities completed, checks passed, mastery per module, concepts to come
back to, concepts already strengthened, project versions saved, the final
assessment status, the most recent activity and one specific next action. Nothing
is stored twice: every figure is computed from records that already exist. There
is no school grade and no percentage.

## The project and the completion record

Every learner builds one website across the whole course. My website shows that work
as a portfolio: eight module cards in learning order, each with the date its version
was saved and the skill that module added, opening into a focused view with one
sandboxed preview and the code as it stood then.

A course counts as complete only when all 48 activities are done, one readable
project version is saved for each of the eight modules, and a final assessment was
passed. Everything is derived from existing evidence on read, so nothing is stored
twice and no flag can be edited. When the work is incomplete the record names the
exact next requirement; when it is complete the learner can print a KidyCode course
completion record. A connected grown-up can see that record too, and never the code,
the reflections or the answers.

## Grown-up access

A learner on the three younger paths can open "Grown-up access" on their progress
page and create a one-time code. Only the digest of that code is stored. It works
once, expires after ten minutes, and creating a new one cancels the previous
unused code. A grown-up signs in with ChatGPT at `/guardian`, enters the code, and
can then follow that learner's progress read only. Either side can end the
connection at any time.

Guardian identity comes from the platform identity headers alone. There is no
password system, nothing a page can claim about itself, and no way to reach a
learner from an identifier. Adult learners keep their progress private and are
never offered grown-up controls.

## Moving to another device

Learner access is a cookie, so a cleared browser or a new device used to mean a
lost course. On the progress page a learner can now create a transfer code, and a
connected grown-up can create one for them. The code lasts ten minutes and works
once. Claiming it on `/transfer` rotates the learner's access key, so the device
that made the code is signed out the moment the new one takes over, and the existing
course and progress open exactly as they were. Only the digest of a code is stored.

Starting a new learning path clears this device's access, so that step now explains
what would be lost, says whether a transfer code or a connected grown-up exists, and
offers to create a code before anything is cleared.

## Testing the races

Transfer codes are the one part of KidyCode where a single request contains a race.
`scripts/e2e-transfer-races.mjs` runs the real transfer library against a real
migrated SQLite database wrapped in a D1 compatible adapter, and uses its hooks to
place a competing request at an exact instant: between a claim's code lookup and its
transaction, and between the writes of a generation. It proves that a stale claim
cannot destroy a newer code, that a losing claim changes nothing at all, that
concurrent generation leaves exactly one active code, and that a failed transaction
rolls back with the original session still working.

## Technology

- Next.js App Router compiled for Cloudflare Workers with Vinext
- React and TypeScript
- Cloudflare D1 with Drizzle schema and versioned SQL migrations
- Server-side course gating, grading and project checkpoint verification
- Static marketing pages served with the application

## Leaving, deleting and trust information

My progress carries two clearly separate operations. **Clear this device** signs the
learner out of that browser and keeps every saved activity, project version and
assessment; it points at the transfer code route first so a learner can move the
profile rather than lose sight of it. **Delete my profile permanently** sits behind a
second step that lists exactly what goes, and removes the profile and every dependent
row in one transaction, revoking grown-up connections and cancelling codes. Privacy
and grown-ups explains all of it, in the same words the product uses.

## Local setup and checks

```bash
npm run install:ci
npm run check
npm run build
```

To exercise the tutor end to end against a running server:

```bash
node_modules/.bin/vinext dev
node --import tsx scripts/e2e-tutor.mjs
```

On Windows, run the dev server through Git Bash as
`node_modules/.bin/vinext dev`, because the `dev` and `start` scripts set an
environment variable using Unix shell syntax. A local D1 store is created on the
first run. Apply the schema in `drizzle/` to that store once with a project level
Wrangler configuration, and the end to end script can then create a learner and
record real evidence.

Run the supported Sites build from a configured environment with:

```bash
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.65/scripts/build-site.mjs
```

## Privacy

KidyCode asks for a nickname, age group and project choice. It does not require a child’s full name, school, phone number or location. Public projects remind younger learners to use a nickname and remove identifying information before sharing.
