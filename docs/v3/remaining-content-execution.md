# V3 remaining content execution

**Scope: learner curriculum only.** The base commit `a68710ecb2b13d3bc06033c10cfc5a35588218fe` is the pre-security P3 content tip (47 scripted of 192 activities); this deliberately excludes unreviewed security changes in PR #12.

## Intent
Four sequential agent batches: ages 10–12, 13–15, 16–18, adults; target the unscripted content without assuming every quiz or project should use the six-stage journey. Existing four bundles and stage counts must remain valid. Keep notes and practice separate. Never include user data.

## Quality gates for each batch
- Inventory scripted/unscripted lesson IDs before edits. Do not inflate script totals through overlapping course aliases.
- One concept, concrete hook, small real-code experiment, helpful misconception hint, independent fresh task, link to continuous website project.
- Clear register-specific language and guided/balanced/independent variants; preserve options and no-green palette.
- Validate script mapping, mastery starter/solution, wrong answers, responsive layout, keyboard navigation; report any regex-only checking caveat.
- `npm run check`, `npm run lint`, `npm run build`, `npm run test:e2e`, supported browser checks. If unavailable in Windows linked worktree, report the exact alternative and limitation.
- Commit only learner experience code in isolated branch; no cohort/auth configuration, deployment, migrations, production changes, or child data.
- Record current/verified coverage as x/48 per course and x/192 overall. Don't claim human learning proven by automated checks.
- Draft PR and stop. Independent security gate must pass before pilot.
- Never silently exceed previous USD 20 KidyCode model budget policy; actual hard limit unavailable; measure usage if possible and stop before uncontrolled paid retries.

## Status reporting
Currently doing / Completed with commits/tests / Blocked or unverified / Next / Recommendation / User action.
