import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAX_CLAIM_ATTEMPTS_PER_WINDOW, MAX_CODE_FAILED_ATTEMPTS, codeExpiryFrom } from "../lib/one-time-codes.ts";
import { TRANSFER_TTL_MINUTES, sourceScope } from "../lib/transfer-codes.ts";

/*
 * Transfer codes and device transfer.
 *
 * The checks below are about the properties that keep a learner profile safe when
 * it moves between devices: the primitives are shared rather than copied, the
 * claim is conditional, the rotation is gated on the winner, and nothing secret
 * ever leaves in a JSON body.
 */

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/* Shared primitives, not a second implementation. */
const transferModule = read("lib/transfer-codes.ts");
assert(transferModule.includes('from "@/lib/one-time-codes"'), "Transfer codes must reuse the proven code primitives.");
assert(transferModule.includes('from "@/lib/access-keys"'), "Transfer codes must reuse the shared access key helpers.");
for (const source of ["lib/transfer-codes.ts", "lib/access-keys.ts", "lib/one-time-codes.ts", "lib/server-database.ts"]) {
  assert(!read(source).includes("subtle.digest"), `Only lib/digest.ts may hash: ${source}`);
}
assert(read("lib/digest.ts").includes("subtle.digest"), "The shared digest module must do the hashing.");
assert.equal(TRANSFER_TTL_MINUTES, 10, "A transfer code must last ten minutes.");
assert.equal(codeExpiryFrom("2026-05-01T10:00:00.000Z", TRANSFER_TTL_MINUTES), "2026-05-01T10:10:00.000Z",
  "The expiry must be ten minutes after creation.");

/* Codes are bound per source, without storing the address. */
const first = await sourceScope("203.0.113.9");
const again = await sourceScope("203.0.113.9");
const other = await sourceScope("203.0.113.10");
assert.equal(first, again, "A source scope must be stable.");
assert.notEqual(first, other, "Different sources must have different scopes.");
assert(!first.includes("203.0.113.9"), "A source address must never be stored as itself.");
assert(first.length >= 16, "A scope needs enough length to avoid easy collisions.");
assert.equal(MAX_CLAIM_ATTEMPTS_PER_WINDOW > 0 && MAX_CODE_FAILED_ATTEMPTS > 0, true, "Attempts must be bounded.");

/* The claim is conditional, and every later mutation is gated on the winner. */
assert(/used_at IS NULL AND invalidated_at IS NULL AND expires_at > \?/.test(transferModule),
  "The claim must be a single conditional update.");
assert(transferModule.includes("used_by_device = ?"), "The claim must record which device won.");

const claimBody = transferModule.slice(transferModule.indexOf("export async function claimTransferCode"));
const createBody = transferModule.slice(
  transferModule.indexOf("export async function createTransferCode"),
  transferModule.indexOf("export async function cancelTransferCode"),
);

/* Defect 1: the sibling invalidation must not run on the learner identifier alone.
 * A stale request whose claim matched no row used to be able to destroy the
 * learner's newer code, so the statement now requires the claimed row to carry the
 * winning device token. */
assert(claimBody.includes("AND EXISTS (SELECT 1 FROM learner_transfer_codes AS winner WHERE winner.id = ? AND winner.used_by_device = ?)"),
  "The sibling invalidation must be gated on the winning device token.");
assert(!/UPDATE learner_transfer_codes SET invalidated_at = \?\s*\n\s*WHERE learner_id = \? AND id <> \? AND used_at IS NULL AND invalidated_at IS NULL`/.test(claimBody),
  "The sibling invalidation must never run on the learner identifier alone.");
assert(/UPDATE learner_transfer_codes SET invalidated_at = \?\s*\n\s*WHERE learner_id = \? AND id <> \? AND used_at IS NULL AND invalidated_at IS NULL\s*\n\s*AND EXISTS \(SELECT 1 FROM learner_transfer_codes AS winner/.test(claimBody),
  "The learner filter and the token gate must both be present, in that order.");

const claimBatchStart = claimBody.indexOf("database.batch([");
const claimBatchEnd = claimBody.indexOf("]);", claimBatchStart);
assert(claimBatchStart > 0 && claimBatchEnd > claimBatchStart, "The claim must run inside one transaction.");
const claimBatch = claimBody.slice(claimBatchStart, claimBatchEnd);

/* Every statement after the claim itself carries the winning token, so a request
 * that did not win changes no access key, no sibling code, no applied state and no
 * attempt counter. */
assert.equal((claimBatch.match(/used_by_device = \?/g) || []).length, 5,
  "All five statements must carry the winning token: the claim, the sibling invalidation, the rotation, the applied mark and the attempt cleanup.");
assert(claimBatch.includes("UPDATE learner_transfer_codes SET used_at = ?"), "The transaction must contain the claim.");
assert(claimBatch.includes("DELETE FROM transfer_claim_limits WHERE scope = ?"), "The attempt cleanup belongs in the same transaction.");
assert(claimBatch.includes("SET applied_at = ? WHERE id = ? AND used_by_device = ?"), "The applied mark must be gated on the winner.");

/* Defect 3: nothing may be awaited after the rotation, so a failure cannot strand
 * a learner with a dead cookie and no replacement. */
const learnerRead = claimBody.indexOf("SELECT id, nickname, course_id AS courseId");
assert(learnerRead > 0 && learnerRead < claimBatchStart, "The learner must be read before the access key changes.");
const afterRotation = claimBody.slice(claimBatchEnd);
assert(!afterRotation.includes("await database"), "No database work may follow the rotation.");
assert(!afterRotation.includes("clearAttempts"), "The attempt cleanup must not be a separate awaited step.");
assert(claimBody.includes('if (claimed !== 1 || rotated !== 1) return { status: "raced" };'),
  "Losing the race, or a rotation that did not land, must be reported rather than ignored.");

/* Defect 2: replacement is one transaction, so two requests cannot both leave an
 * active code behind. */
assert(createBody.includes("database.batch(["), "Replacement must run in one transaction.");
assert(!createBody.includes(".run()"), "Replacement must not write outside its transaction.");
assert(createBody.indexOf("const code = generateConnectCode();") < createBody.indexOf("database.batch(["),
  "The code, its digest and its id must exist before the transaction starts.");
assert(createBody.indexOf("const id = crypto.randomUUID();") < createBody.indexOf("database.batch(["),
  "The row id must be generated before the transaction starts.");

/* The session cookie keeps every protection the platform already relied on. */
const accessModule = read("lib/access-keys.ts");
const cookieSource = accessModule.slice(accessModule.indexOf("export function sessionCookie"));
const cookie = cookieSource.slice(0, cookieSource.indexOf("export const"));
for (const attribute of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax"]) {
  assert(cookie.includes(attribute), `The session cookie must keep ${attribute}.`);
}
assert(accessModule.includes("crypto.getRandomValues(new Uint8Array(32))"), "A new access key needs 32 random bytes.");
assert(!read("app/api/learners/route.ts").includes("function makeAccessKey"), "The learners route must not keep a private copy of the key helpers.");
assert(!read("lib/server-database.ts").includes("async function hashAccessKey"), "The database helper must not keep a private copy of the hash.");

/* Nothing secret leaves in a body. */
const claimRoute = read("app/api/transfer/claim/route.ts");
assert(claimRoute.includes("Response.json({\n      transferred: true,\n      coursePath:"), "A successful claim must answer with the course path.");
assert(claimRoute.includes('response.headers.append("set-cookie", sessionCookie(outcome.learnerId, outcome.newAccessKey))'),
  "The new access key may only travel in the cookie.");
for (const leak of ["accessKey:", "accessHash", "learnerId:", "cookieValue", "newAccessKey,"]) {
  assert(!claimRoute.includes(leak), `The claim response must not include ${leak}`);
}
assert(!read("app/api/transfer/codes/route.ts").includes("accessHash"), "The learner code route must not touch the access hash.");
assert(!read("app/api/guardian/transfer/route.ts").includes("sessionCookie"), "A guardian must never receive a learner session.");

/* The migration is additive, indexed and optimised, and follows the learner. */
const migration = read("drizzle/0006_high_tomas.sql");
assert(migration.includes("CREATE TABLE `learner_transfer_codes`"), "The transfer table must be created.");
assert(migration.includes("CREATE TABLE `transfer_claim_limits`"), "The attempt bound needs its own small table.");
for (const column of ["code_digest", "created_by", "expires_at", "used_at", "used_by_device", "applied_at", "invalidated_at", "failed_attempts"]) {
  assert(migration.includes(`\`${column}\``), `The transfer table needs ${column}.`);
}
assert(migration.includes("ON DELETE cascade"), "Transfer codes must follow their learner.");
assert(migration.includes("CREATE UNIQUE INDEX"), "The digest must be unique.");
assert(migration.includes("PRAGMA optimize"), "The migration must end with PRAGMA optimize.");
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
assert(journal.entries.some((entry) => entry.tag === "0006_high_tomas"), "Migration 0006 must be in the journal.");
assert.equal(journal.entries.filter((entry) => entry.tag === "0006_high_tomas").length, 1, "Migration 0006 must appear once.");

/* The interface keeps its promises and its palette. */
const transferPage = read("components/TransferPage.tsx");
assert(transferPage.includes('coursePath'), "The transfer page must follow the course the server names.");
assert(transferPage.includes("cannot restore the profile automatically"), "The page must say when recovery is impossible.");
for (const forbidden of ["learnerId", "accessHash", "accessKey"]) {
  assert(!transferPage.includes(forbidden), `The transfer page must not handle ${forbidden}.`);
}
const learnerComponent = read("components/MoveToAnotherDevice.tsx");
for (const promise of ["expires ten minutes", "used once", "signs this device out", "remain saved"]) {
  assert(learnerComponent.includes(promise), `The learner copy must mention that the code ${promise}.`);
}
for (const source of [transferPage, learnerComponent, read("components/LearningApp.tsx"), read("components/GuardianDashboard.tsx")]) {
  assert(!source.includes("\u2014") && !source.includes("\u2013"), "Interface copy must not use dashes as punctuation.");
  assert(!/\bgreen\b/i.test(source), "No green colour may enter the interface.");
}
const styles = read("app/globals.css");
assert(styles.includes(".transfer-code-value") && styles.includes(".mismatch-warning"), "The new surfaces need styles.");
assert(!/#0?0?f[0-9a-f]{3}\b/i.test(styles.split("Moving a learner profile")[1] || ""), "New styles must not introduce green.");

/* The reset flow warns before it clears anything. */
const learningApp = read("components/LearningApp.tsx");
assert(learningApp.includes("Starting a new path clears this device"), "Clearing the device must be explained first.");
assert(learningApp.includes("cannot be reopened after you clear it"), "The warning must say access can be lost.");
assert(learningApp.includes("Create a transfer code first"), "The warning must offer the safe way out.");
assert(!learningApp.includes('window.confirm("Start a new course profile?'), "Clearing must not be a browser prompt alone.");

console.log("Validated transfer codes and device transfer: shared primitives, conditional claim, gated rotation, safe cookie and a warned reset flow.");
