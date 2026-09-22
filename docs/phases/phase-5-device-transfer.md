# Phase 5: learner recovery and device transfer

Status: implemented and verified locally. Started from commit 1a39570 with a clean
working tree. The live Site was left untouched.

## The problem

A learner's access was a cookie and nothing else. Clearing a browser, losing a
phone or moving to a laptop lost the whole course, and there was no way back in.

## Recovery methods

A transfer code can be created in exactly two ways:

- by the authenticated learner on the device they are using now
- by a grown-up with an active link to that learner

There is no administrator bypass, no searchable learner directory and no secret
question. An adult learner can create their own code, because adults lose devices
too.

When neither route is open, `/transfer` says so plainly: the code has to come from
a signed in device or a connected grown-up, KidyCode cannot restore the profile
automatically, and a new profile is the only option. No back door was added.

## Migration

`drizzle/0006_high_tomas.sql`, additive, two tables:

- `learner_transfer_codes`: the learner, the code digest, who created it, created
  and expiry dates, when it was used and by which device token, when the rotation
  was applied, when it was invalidated, and a failure counter. The learner is a
  cascading foreign key, so the codes go with the learner.
- `transfer_claim_limits`: one row per hashed source address, holding an attempt
  count and a window start. Guesses that match no digest cannot be attributed to a
  learner, so they are bounded here instead. The address itself is never stored.

Two indexes: a unique index on the digest, and an index on the learner with the
expiry for the pending lookup. The migration ends with `PRAGMA optimize`.

## Backend work

- `lib/transfer-codes.ts`: create, cancel, read the pending code, and claim.
- `lib/digest.ts`: one SHA-256 helper for the project. The transfer module, the
  access key module and the one-time code module all use it, and a validator fails
  if any other file hashes anything.
- `lib/access-keys.ts`: the key generator, the key hash and the session cookie,
  moved out of the learner route and the database helper so there is a single
  definition of each. Both files now import it.
- `lib/course-routes.ts`: one route map for the four paths, shared by the learner
  app and the transfer claim.
- `app/api/transfer/codes`: the learner's own codes: create, list, cancel.
- `app/api/transfer/claim`: the new device. No session needed.
- `app/api/guardian/transfer`: a grown-up creating a code for a learner they hold.
- `lib/one-time-codes.ts`: the module from Phase 4, renamed from
  `lib/guardian-codes.ts` because it is now the shared code primitive for both
  connection codes and transfer codes. No logic changed and nothing was copied.

### How the claim stays atomic

Claiming has to rotate the learner's access key exactly once, and only for the
request that won the code.

1. The claim is a single conditional update: `used_at IS NULL AND invalidated_at
   IS NULL AND expires_at > ?`. Only one caller can move a code from unused to
   used.
2. The rotation, the invalidation of the learner's other unused codes, and the
   applied mark run together in one D1 transaction. The rotation only matches a row
   carrying the device token that won the claim, so a caller that lost the race
   cannot rotate anything, even though its statement runs in the same batch.
3. The route treats success as one changed row for the claim **and** one for the
   rotation. Anything else is reported as a lost race.

If the process stopped between the two, the code would be spent and the key
unchanged. That is the safe direction: nobody gains access, and the learner creates
another code.

## Frontend work

- "Move to another device" on the learner progress page, on every path including
  adults. It states the four facts before anything happens: ten minutes, one use,
  this device is signed out, the work stays saved. It offers create, copy, replace
  and cancel, and shows the expiry in minutes.
- `/transfer`, the new device: the code field, what happens next, clear messages for
  expired, already used, replaced, cancelled and unknown codes, and the honest note
  about when recovery is impossible. The session is only created by the server's
  response, and the page then opens the course the server names.
- The guardian dashboard gains a transfer code button per linked learner, showing
  the code and its expiry. A guardian never receives a learner session, access key
  or hash.

## The reset flow, protected

The only action that cleared a learner session was "Start a different age range
instead" on the mismatch screen, and it used a browser prompt. It is now a step on
the page:

- It says this device stops opening the saved course and that the work can only be
  reopened with a transfer code or a connected grown-up.
- It checks whether a transfer code exists or a grown-up is connected, and says
  which applies.
- It offers "Create a transfer code first", showing the code to write down, and
  "Keep my saved course" to back out.
- Only then does the reset action exist, and the profile is never silently
  orphaned.

## Tests and results

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | Pass |
| Lint | `npm run lint` | Pass, no errors or warnings |
| Validators | `npm run check`, eight validators | Pass |
| Production build | `npm run build` | Pass, `/transfer`, two transfer APIs and one guardian API packaged |
| End to end API | `scripts/e2e-tutor.mjs` | 74 of 74 checks passed |
| Database level | `scripts/e2e-guardian-db.mjs` | 12 of 12 checks passed |
| Browser | Playwright, four routes plus `/transfer` and the guardian page at three widths | 204 of 204 checks passed |

The twenty required tests and where each is proven:

1. A learner can generate a transfer code: API and browser, with the ten minute
   expiry measured from the response.
2. A linked grown-up can generate one: API and browser, code shape checked.
3. An unrelated or revoked grown-up receives 403: API, for a stranger with the right
   link handle, and again after revocation.
4. Adult learners can create their own code: API, including the transfer opening
   `/learn/adults` and progress still reachable.
5. Plain codes are never stored: the database script reads every column of the row
   and the whole table, with and without the grouping.
6. Expired, invalidated and used codes are rejected: 410 for each, with the expiry
   case produced by backdating a real row and the used case by claiming twice.
7. A replacement invalidates the previous code: the older code answers 410.
8. Concurrent claims allow exactly one success: two claims at the same moment, one
   200 and one 409 or 410, and the loser receives no session.
9. Successful transfer opens the original profile and progress: same course id, the
   same progress payload before and after, and the learner's own name in the reply.
10. Successful transfer rotates the access hash: the previous cookie answers 401
    for both the summary and the progress endpoints.
11. The old cookie stops working immediately: covered by the same step, which also
    confirms the new device still works.
12. The new cookie has HttpOnly, Secure, SameSite and Path: asserted on the response
    and read back from the browser's own cookie store.
13. The cookie or access key never appears in JSON: the claim body is scanned for
    every forbidden key, and the grown-up response is scanned for session, key and
    hash.
14. Deleting a learner removes transfer codes: a real learner row is deleted and the
    codes are gone, their session stops working.
15. Repeated incorrect attempts are bounded: eight unknown codes are refused, the
    ninth from that source is 429, and another source is unaffected.
16. The session-clearing flow shows a clear warning: the browser drives the warning,
    reads it, creates a code from inside it, backs out, and confirms the profile was
    not disturbed.
17. Existing learner, tutor, recall, progress and guardian tests still pass: the same
    runs re-check all of them.
18. The transfer page works at 320px, 768px and 1440px: the browser loop covers the
    three widths, with a real transfer performed at each.
19. Keyboard navigation and status announcements work: the field is labelled, the
    refusal is announced with `role="alert"`, and the transfer status uses an
    `aria-live` polite region.
20. No green and no em dashes: the validator scans the new copy and styles, and the
    browser scans computed colours on the new surfaces.

## Notes

- Attempt bounds are keyed by a digest of the source address. Cloudflare sets
  `cf-connecting-ip` at the edge, so a browser cannot choose it in production.
  Locally, and in these tests, the value is supplied by the client.
- The learner app's transfer area is deliberately the last thing on the progress
  page, so it never competes with the next activity.
- The next unfinished phase is recorded below.

## Next unfinished phase

A completion record and project portfolio. A learner who finishes a path currently
has no way to show what they built: the saved module versions and the final
assessment result exist but are only visible inside the app. Phase 6 would add a
read only portfolio page for the learner's own saved project versions and a
completion record that a grown-up can view alongside the progress summary, derived
from the existing checkpoint and exam tables with no new stored totals.