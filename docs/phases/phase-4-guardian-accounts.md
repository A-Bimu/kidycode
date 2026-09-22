# Phase 4: guardian accounts and secure progress access

Status: implemented, verified and pushed. Started from commit d0bdcc2 with a
clean working tree. The live Site was left untouched.

## Authentication audit

KidyCode runs on an OpenAI Sites project behind a ChatGPT sign-in. The platform
signs a visitor in at `/signin-with-chatgpt` and forwards the authenticated
identity to the server on later requests through these headers:

- `oai-authenticated-user-id`, the stable identity
- `oai-authenticated-user-email`, the contact address
- `oai-authenticated-user-full-name`, optional, with
  `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8` when the
  name is encoded

`lib/guardian-identity.ts` reads those headers and nothing else. Identity is
never read from a body, a query string or a cookie, so a page cannot claim to be
a grown-up by sending a value of its own choosing, and `lib/guardian-auth.ts`
holds the server only account establishment shared by every guardian route.

The repository vendors its own Sites packaging plugin rather than depending on
`@openai/sites-vite-plugin`, which is published. Swapping that plugin would change
the artifact the Sites project publishes and the dependency lockfile, so it was
left alone: the header contract the official plugin documents is the contract
this phase implements. In local development the platform edge is absent, so the
tests supply those headers, which is exactly the path the platform takes.

No homemade password system was created. There is no sign-in form, no password
column and no password verification anywhere in this phase.

## Migration

`drizzle/0005_slimy_xorn.sql` adds three tables, additively:

- `guardian_accounts`: platform user id, email, optional display name, created
  and last sign in dates, plus a bounded claim attempt counter.
- `guardian_links`: the opaque link handle, guardian, learner, active or revoked
  state, who initiated it, connected and revoked dates.
- `guardian_connect_codes`: learner, code digest, created and expiry dates, used
  date, the guardian who used it, an invalidation date and a failed attempt
  counter.

Six indexes, each serving a lookup this phase performs: platform identity, the
guardian and learner pair, the link handle, the learner's own connections, the
code digest and the learner's outstanding codes. Four of them are unique, so a
duplicate link or a duplicate digest is impossible by construction. The migration
ends with `PRAGMA optimize`. Three foreign keys cascade, so deleting a learner or
a guardian removes their codes and links.

## Backend work

- `lib/guardian-codes.ts`: eighty bits from a cryptographic source, Crockford
  base32 so a misread character is recoverable, grouped for reading aloud, ten
  minute expiry, normalisation, and SHA-256 digesting. Only the digest is stored.
- `lib/guardian-links.ts`: creating a code (which invalidates any unused code the
  learner already had), claiming one, listing each side, resolving a link for a
  guardian read, and revocation from either side.
- `app/api/guardian/connections`: the learner's view. Generate, list and revoke.
- `app/api/guardian/session`: the guardian's account and their learners.
- `app/api/guardian/links`: claim a code, and disconnect.
- `app/api/guardian/summary`: the guardian's read of one learner.
- `lib/guardian-view.ts`: a strict allow list projection of the existing progress
  summary. Raw mastery figures, check counts, intervention history, requirement
  labels and every identifier are dropped.

Claiming is a single conditional update that requires the code to be unused,
uninvalidated and unexpired, and the result must report exactly one changed row.
Two claimants can therefore never both win, and the unique index on the guardian
and learner pair means a link cannot be duplicated even if a claim were repeated.
Failed attempts are bounded twice: five against one code, and eight against one
guardian inside a ten minute window, after which the answer is 429. A successful
claim clears the guardian's count.

## Frontend work

- "Grown-up access" on the learner's progress page, for the three learner paths
  only: create a code, see when it expires, see who is connected with their
  address masked, end access, and create a replacement code.
- `/guardian`, a grown-up area that signs in through the platform path, accepts a
  one-time code, lists linked learners, opens a read only progress view and can
  disconnect.
- Both are calm and plain, use the existing off-white, navy, purple and amber
  tokens, never green, and contain no em dashes.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Curriculum validator | `validate-full-course.mjs` | Pass |
| Tutor and review validator | `validate-tutor.mjs` | Pass |
| Summary validator | `validate-summary.mjs` | Pass |
| Guardian validator | `validate-guardian.mjs` | Pass |
| Interface validator | `validate-learning-interface.mjs` | Pass |
| Backend validator | `validate-backend.mjs` | Pass |
| Static validator | `validate-static.mjs` | Pass |
| Lint | `npm run lint` | Pass, no warnings |
| Production build | `npm run build` | Pass, four guardian routes and the guardian page packaged |
| End to end API journey | `scripts/e2e-tutor.mjs` | 64 of 64 checks passed |
| Database level journey | `scripts/e2e-guardian-db.mjs` | 9 of 9 checks passed |
| Browser journey | Playwright, four learner routes and the guardian page at three widths | 179 of 179 checks passed |

The twenty required tests, and where each one is proved:

1. Missing guardian identity returns 401: driver check, all three guardian routes,
   and the browser sign-in prompt.
2. A learner can generate a code: driver and browser.
3. Plain codes are never stored: the database script reads every column of every
   code row and finds neither the plain nor the grouped code.
4. An expired code is rejected: the database script backdates a real code and the
   API answers 410 with an expiry message.
5. A wrong code is rejected and attempts are bounded: 404 for an unknown code, 400
   for a value that cannot be a code, and 429 after repeated attempts.
6. A used code cannot be reused: 410 in the driver and in the browser.
7. Concurrent claims cannot create duplicate links: two guardians claim one code
   at the same moment, exactly one wins, the winner holds exactly one link and the
   loser holds none.
8. A guardian can link more than one learner: two learners, one guardian, two
   entries with their own course groups.
9. Two guardians can link to one child: the learner's own list shows both, each
   approved with a separate code.
10. An unrelated guardian receives 403: a fourth guardian with no link.
11. Guessing a learner identifier gives no access: the learner id as a link handle
    is 403, an unknown parameter is 400, and a link cannot be created from a
    learner identifier at all.
12. Revocation stops access immediately: the learner revokes, the guardian's read
    becomes 403 in the same breath and the learner leaves their list.
13. A guardian cannot change learner progress: the learner progress and tutor
    endpoints answer 401 to a guardian identity, and the guardian summary refuses
    every write method.
14. Adult learners do not receive child guardian controls: the three learner
    endpoints answer 409 on the adult path and the browser shows no grown-up area.
15. Deleting a learner removes related links and codes: the database script deletes
    a real learner and the codes and links are gone, their session stops working
    and their link handle gives 403.
16. Guardian responses contain no code, answers, sessions or internal identifiers:
    an allow list check over every key in the response, and a scan for the code,
    the learner identifier, the platform identity, answers, drafts and sessions.
17. Existing courses, tutoring, recall and learner progress still work: the same
    runs re-check all of them.
18. All four learning paths still pass: the four course summary loop and the four
    browser routes.
19. Phone, tablet and desktop have no sideways scrolling: the overflow check runs
    on every learner route, the progress page, the grown-up section with a code
    shown, and the guardian page at 320px, 768px and 1440px.
20. Type checks, lint, validators and build: the table above.

## Notes

- A guardian handle is an opaque random value, never the link row id and never the
  learner id, so a guardian response carries no internal identifier while the
  guardian can still choose which learner to open.
- The learner's own page shows a masked guardian address, so a child's screen
  never displays a full contact address.
- Guardian code never logs, so a connection code cannot leak into logs.
- The next phase is recorded as guardian visibility refinements only if the
  product asks for them; the larger unfinished phase is below.