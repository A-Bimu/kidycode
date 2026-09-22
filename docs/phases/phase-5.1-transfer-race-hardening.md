# Phase 5.1: transfer code race hardening

Status: implemented and verified locally on top of 5dac566. No new migration, no
change to the live Site, and Phase 6 has not been started.

An external audit of `lib/transfer-codes.ts` found three release-blocking defects.
All three were real. Each fix is covered by a regression test that was confirmed to
fail against the original code.

## Defect 1: a stale claim could destroy the learner's newer code

The claim ran one transaction of four statements. The first was the conditional
claim, and the second invalidated the learner's other unused codes using
`learner_id` alone. The row-count check on the first statement happened afterwards,
in the caller.

So a request that had already read a code which was still active, and which then
lost the race to a replacement or a cancellation, still ran the second statement
with full force. The claim changed zero rows, the invalidation changed one, and the
learner's brand new code was killed by a request that had no right to touch it. The
learner was left with no working code, and nothing in the response said so.

Now every statement after the claim carries the winning `used_by_device` token,
either as a condition on the row it writes or as a requirement that the claimed row
carries that token:

- the sibling invalidation requires `EXISTS (... winner.id = ? AND winner.used_by_device = ?)`
- the key rotation already matched on the token
- the applied mark already matched on the token
- the attempt cleanup now requires the same proof, so a losing request cannot even
  clear another scope's counter

A request that did not win the claim changes no access key, no sibling code, no
applied state and no attempt row. `scripts/validate-transfer.mjs` previously
approved the unsafe statement by matching its text; it now requires the token gate,
rejects the learner-only form, and requires exactly five gated statements in the
transaction.

## Defect 2: replacement was not atomic

`createTransferCode()` invalidated the learner's old codes and inserted the new one
through two separate awaited writes. Two requests arriving together could both
invalidate before either insert, leaving two active codes for one learner.

Now the code, its digest and its row id are all generated first, and then
invalidation and insertion run in one `database.batch()` transaction. Concurrent
generation leaves exactly one unused, non-invalidated code, because the second
transaction begins only after the first has committed, so its invalidation catches
the code the first inserted. Both rows remain for the audit trail.

No migration was added. `0006_high_tomas.sql` is undeployed and the schema it
creates is sufficient.

## Defect 3: fallible work after the key rotation

The successful claim rotated the access key, and only then read the learner row and
cleared the attempt window, both with `await`. A failure in either would return an
error with no new cookie, while the previous device's cookie had already been
invalidated by the rotation. A learner with a missing profile row was worse still:
the code was spent and the key rotated, and the response was `not-found`.

Now the learner is read before anything changes, the attempt cleanup is the fifth
statement of the same transaction, and nothing is awaited after the rotation. The
function returns the new key directly from the transaction's result, so no failure
can occur between rotating the key and handing back the cookie that matches it.

## Regression tests

`scripts/e2e-transfer-races.mjs` is new. These moments sit inside a single request,
so they cannot be driven over HTTP. The harness runs the real library against a real
SQLite database with every migration applied, wrapped in a D1 compatible adapter
that executes batches as transactions and exposes hooks to place a competing request
at an exact instant.

| Test | What it proves | Result |
| --- | --- | --- |
| A stale claim loses and leaves the replacement active | The claim is paused after its code lookup, a replacement is created, the stale claim loses, the replacement is untouched and still transfers, and no access key changed | Pass |
| A losing claim changes no sibling, no key and no attempt row | A competing claim completes first; the full contents of `learner_transfer_codes`, `learner_profiles` and `transfer_claim_limits` are byte-identical afterwards | Pass |
| Concurrent generation leaves exactly one active code | Five concurrent rounds, plus one generation held open between its two writes while a competitor runs to completion: never two active codes | Pass |
| A failed rotation rolls back and the original session still works | A statement failure inside the transaction leaves the code unused and unapplied, the original access key in place, the original session authenticating, and the code usable afterwards | Pass |
| One valid claim rotates the key and hands back the new one only | The stored hash equals the hash of the handed back key, the previous key stops working, the code is marked used and applied, and the attempt window is cleared in the same transaction | Pass |
| A failure while reading the learner leaves every row untouched | A read failure before the rotation leaves the whole database unchanged and the original device signed in | Pass |

Each test was checked against the original code by reintroducing the defect and
confirming the failure:

- defect 1 back: `the replacement must not be invalidated by a losing request`
- defect 2 back: `expected one active code, found 2 (the competitor completed)`
- defect 3 back: `a failed read before the rotation must change nothing`

`scripts/e2e-guardian-db.mjs` also gained a check that runs a real transfer through
the API against the real database: the stored `access_hash` must change, must equal
the SHA-256 of the key that arrived in the cookie, the cookie must carry HttpOnly,
Secure, SameSite Lax and Path, the previous session must answer 401, the new one
200, and the response body must carry no identifier.

## Full verification after the fixes

| Check | Result |
| --- | --- |
| TypeScript check | Pass |
| Lint | Pass, zero errors or warnings |
| Eight validators | Pass |
| Production build | Pass |
| End to end API (`e2e-tutor.mjs`) | 74 of 74 |
| Database level (`e2e-guardian-db.mjs`) | 13 of 13 |
| Race and atomicity (`e2e-transfer-races.mjs`) | 6 of 6 |
| Browser, Playwright at 320px, 768px and 1440px | 204 of 204 |

Preserved unchanged: all Phase 5 interface and behaviour, the four learner paths,
guardian authorisation, digest-only code storage, the ten minute expiry, one-use
codes, the KidyCode palette, no green, and no em dashes in interface copy.
