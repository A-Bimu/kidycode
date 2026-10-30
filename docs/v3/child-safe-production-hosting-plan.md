# KidyCode: production hosting and identity migration decision (2026-10-30)

**Status: architecture plan only, not deployed or approved for production cutover.** All child accounts and real learner tests remain blocked until secure hosting, privacy controls, and verified identity pass.

## Verified constraints
1. ChatGPT Sites says Sites must NOT target children under 13 or the applicable digital-consent age. KidyCode deliberately supports ages 10–12, so **do not use ChatGPT Sites as KidyCode's public production host**. Source: https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
2. Current repository uses the Sites vinext/Vite packaging and Cloudflare D1 database binding DB. Cloudflare Workers supports vinext and its bindings, making it a plausible destination without a rewrite. Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
3. Cloudflare Workers Free has usage limits; Workers Paid minimum is $5/month. D1 Free has limits; growth may incur charges. Sources: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/d1/platform/pricing/
4. Supabase Auth supports email OTP/magic link with signed user sessions. Supabase Free is $0 with limits including 50,000 MAU and 500 MB database; free projects may pause after inactivity. Sources: https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/pricing
5. Kenya ODPC guidance places special requirements on processing children's personal information; obtain appropriate verifiable parental consent, minimize child data, provide deletion and access procedures and confirm legal compliance. Source: https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-for-Processing-Childrens-Data.pdf

## Proposed low-cost architecture (pending technical feasibility)
- **Hosting:** Cloudflare Workers running the existing vinext application. Existing D1 schema stays D1 if compatible; provision a separate staging database. Do not copy live learner data to staging.
- **Adult sign-in:** Use verified Supabase Auth sessions (email OTP or OAuth), **but keep learning data in D1 initially** to avoid needless database migration. Server verifies provider tokens and binds an internal immutable user id. Supabase may require email delivery configuration; monitor usage/budget.
- **Under-13:** Guardian-controlled child profiles, not autonomous child email/ChatGPT accounts. Guardian consent and child privacy protections gate child profiles. Age-appropriate experience and account recovery must be tested.
- **Authorization:** Authoritative D1 guardian-child ownership, institution membership and cohort assignments, guardian PIN rules; never trust client-supplied role, account id, guardian id or identity headers. All API routes share one fail-closed identity validation path.
- **Budget:** target $0 recurring for initial technical pilot using free plans, but do NOT assume limits, deliverability, inactivity, region, or under-13 compliance are guaranteed. Workers Paid $5/month is a fallback subject to owner approval.

## Work packages / acceptance gates
1. [ ] Inspect current Sites-specific imports, hosting metadata, D1 config and auth call sites; produce migration diff; make no destructive changes.
2. [ ] Prototype Workers vinext build on an isolated branch; verify bindings, migrations, API endpoints and asset routing in staging.
3. [ ] Implement provider token verification and server-managed sessions with logout, CSRF protections where relevant, secure cookies, token expiry and rotation; remove reliance on `oai-authenticated-user-id` for auth. Fail closed without server verification.
4. [ ] All guardian/institution API routes share verification. Staging negative tests for forged/absent/expired identities, other guardian's child, other institution's cohorts, replay and transfer abuse. Log only pseudonymous test data.
5. [ ] Validate adult educator/institution onboarding and guardian-to-child profile relationship. Verify children cannot bypass adult-controlled workflows.
6. [ ] Review Kenya child data-protection obligations, consent evidence, data minimization, retention and deletion. No collection of child's address, school or precise location.
7. [ ] Run GitHub Actions plus actual seeded D1 end-to-end and real mobile/desktop/keyboard tests. Use synthetic accounts only.
8. [ ] Owner signs off on provider accounts, domain, data-location terms and any recurring paid plan before deploying.
9. [ ] Secure, isolated four-learner pilot only after prior gates pass and verifiable guardian consent is obtained. Fix critical findings before public launch.

## Alternatives considered
- **Keep ChatGPT Sites:** rejected for this product's 10–12 age audience based on explicit Sites restriction; not a public launch option.
- **Cloudflare Workers + verified auth:** preferred feasibility path because the app uses vinext and D1 already. Auth integration still substantial and unimplemented.
- **Vercel + Supabase:** viable fallback but likely requires changing runtime/database access and payment/limits review; not automatically simpler.

## Safety and authorization
This plan does NOT authorize creating service accounts, spending money, adding secrets, copying production data, merging PRs, deploying, or inviting children. Request owner approval for operational external-account changes. Existing live Site stays unchanged.
