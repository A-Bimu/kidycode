# KidyCode V3 release integration gate

Status: **REVIEW ONLY — not safe to deploy, merge, or expose to children**.
Base: V3 curriculum PR #18 head `a3c9f32a859d2c0b2910bcf20c5c5eb42916a90b`.
Scope: full challenge curriculum coverage (128 / 128), preserving 64 separate quiz/project activities.

## Completed here
- Added GitHub Actions workflow for independent CI of Node 24 install, full curriculum/TypeScript gates, lint and production build.
- Does not use production secrets, any learner data or remote staging.
- This is NOT proof that e2e, browser or security checks have passed: those need a seeded local/staging environment and trustworthy identity ingress.

## Integration order (manual, review required)
1. Review the curriculum PR #18 for real usability and spot-test independent mastery; its checks are still regex-backed in places.
2. Review assessment PR #11; ensure its fixes are ancestors of curriculum source. This branch already descends from PR #11.
3. Review institutional cohort fix PR #12 and the guardian identity fix PR #13. They are **not included** in this curriculum branch and must be integrated only after complete review. Avoid cherry-picking a subset of access-control code.
4. Confirm whether ChatGPT Sites can securely deliver user identity. The proposed HMAC verifier is NOT a supported production solution unless a trusted platform signer exists. Obtain documentation/support or select OAuth/session verification at an owner-controlled ingress. Tests must prove unsigned/forged requests cannot access guardian and institution routes.
5. Independently run seeded D1 regression and browser tests on a safe environment (with fake accounts): `npm run test:e2e`, `npm run test:browser:journey`, cross-browser and real devices, accessibility and assessment-positive/negative checks.
6. Only after security sign-off and consent, run the supervised four-learner pilot; record pseudonymous observations; fix blockers; approve public launch.

## Absolute prohibitions
No automatic merge to `main`, no production deploy, no live learners, no secrets in git or GitHub logs; do not mark launch-ready solely because CI passes.

## Remaining risk
GitHub Actions was absent previously. This first workflow itself must be observed running successfully in GitHub before counting CI as passed. Current platform custom-signer capability and edge header stripping have not been independently verified.
