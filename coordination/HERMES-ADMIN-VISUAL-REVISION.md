# HERMES — FINAL OWNER-APPROVED ADMIN VISUAL REVISION

**Priority: P0 / execute next.** This supersedes the earlier admin visual direction wherever it conflicts. The KidyCode owner has reviewed **all** the Admin Dashboard screenshots and approves the layout, navigation and functional behavior. Do not ask for another design/layout review or rebuild the dashboard.

## Owner's exact decision
- Sidebar: **APPROVED**
- Overview: **APPROVED**
- Curriculum Explorer: **APPROVED**
- Preview as Learner: **APPROVED**
- Remaining admin sections and core functionality: **APPROVED**
- **ONLY REQUESTED CHANGE: colours and restrained visual polish.**
- Remove all nude, beige, cream, tan, warm off-white, skin-tone and muted muddy-gold colours from the **admin dashboard**.
- Brand direction **BLUE + WHITE + GOLD**. **Never use green.** This is a non-negotiable preference.

## Implementation scope
1. Rework admin-only CSS colour tokens and usages, primarily `app/admin/admin.css`. Admin styles currently reference shared `var(--paper)`, `var(--paper-deep)`, `var(--purple-pale)`, `var(--amber-pale)` and other tokens; do not allow any beige or purple/lavender defaults to leak into admin surfaces. Prefer isolated `--adm-*` tokens on `.adm-shell` or scoped admin wrapper, so KidyCode's learner pages and components are not accidentally recoloured.
2. Adopt a coherent crisp palette:
   - Deep navy/primary: `#0F2D52`
   - Rich royal/interactive blue: `#1E5AA8`
   - True white card/background: `#FFFFFF`
   - Cool near-white canvas: `#F7F9FC` (distinctly cool/neutral, **not beige**)
   - Gold accent (use sparingly): `#D4A63A`; for small text, badges, icons or focus states, tune its darkness and pairing to meet contrast requirements. No dusty/muddy amber.
   - Dark ink: `#0E1B2A`
   - Cool blue-gray border: `#D8E2EE`
   The exact shades may be tuned for contrast and visual unity, but NOT into nude, beige, green or purple.
3. Preserve exact existing information architecture and interactions. **NO new cards, route changes, renamed sections, rearranged layouts, altered filters, learner progress mutations, API modifications, or changes to analytics/notifications behavior.** The user has APPROVED the UI structure.
4. Polish styling only: clear visual hierarchy, tidy spacing where it does not change structure, premium blue sidebar/topbar, restrained gold accents, subtle borders, precise hover/active/focus states, polished typography, neat tables/cards. Avoid overdone gradients, gold-filled large surfaces, unnecessary shadows and showy animation.
5. Apply the approved palette consistently to sidebar, navigation, topbar, body background, cards, states, empty states, badges, alerts, review statuses, analytics and notification sections, and the closed/admin preview screens. Keep disabled/error/warning states distinguishable without relying on colour alone. No accidental green from shared app styles.
6. Check colour contrast to WCAG 2.2 AA target (normal text >=4.5:1, large text >=3:1, nontext boundaries/focus >=3:1 when applicable); don't claim certification from automated checks alone.
7. Re-run `npm run check`, `npm run lint`, `npm run build`, and existing `node scripts/admin-qa.mjs` against the admin branch. Verify 320/768/1440 responsive layouts and keyboard focus. Regenerate the admin screenshot set in `docs/v3/admin-qa/` and inspect them; screenshots should show no beige.
8. Push a real commit to `feat/admin-review-console` and update the EXISTING draft PR **#28** and issue **#27** with before/after description, exact SHA, CI, screenshots and any unresolved limitations. Keep it draft, and don't merge or deploy production without a separate approved staging plan.

## Acceptance criteria
- Admin screens are recognizably blue, white and rich gold, and **zero visible nude/beige/cream/green**.
- The sidebar, Overview, Curriculum Explorer and Preview as Learner retain the owner's approved layout and functionality.
- All previous protected API access, accurate analytics provenance, 'not tracked yet' semantics, no-write learner preview, synthetic labeling, and no-send notifications remain intact.
- Browser QA + typecheck + lint + build pass, screenshots refreshed.
- Report **"colour revision done"** only after a passing verified commit and visual review; do not conflate this styling milestone with the **still-unverified live admin staging link**.

## Note about execution
This file and GitHub issue/PR comments are the handoff **to Hermes**. Writing them is not the same as sending a live message to an active local Windows Hermes session. When Hermes resumes or reads this repo's task queue, execute this brief immediately. Keep scope tightly limited to visual styling.
