import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { courses } from "../lib/course-catalog.ts";
import {
  CLAIM_WINDOW_MINUTES,
  CODE_ALPHABET,
  CODE_BYTES,
  CODE_LENGTH,
  CODE_TTL_MINUTES,
  MAX_CLAIM_ATTEMPTS_PER_WINDOW,
  MAX_CODE_FAILED_ATTEMPTS,
  codeExpiryFrom,
  generateConnectCode,
  groupConnectCode,
  hashConnectCode,
  isCodeExpired,
  normaliseConnectCode,
} from "../lib/one-time-codes.ts";
import {
  GUARDIAN_EMAIL_HEADER,
  GUARDIAN_FULL_NAME_HEADER,
  GUARDIAN_ID_HEADER,
  GUARDIAN_NAME_ENCODING_HEADER,
  GUARDIAN_SIGN_IN_PATH,
  GUARDIAN_SIGN_OUT_PATH,
  PERCENT_ENCODED_UTF8,
  maskEmail,
  readGuardianIdentity,
} from "../lib/guardian-identity.ts";
import {
  GUARDIAN_FORBIDDEN_KEYS,
  GUARDIAN_SUMMARY_KEYS,
  collectKeys,
  toGuardianSummary,
} from "../lib/guardian-view.ts";
import { buildSummary } from "../lib/summary.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

/* 1. Codes carry enough entropy, avoid ambiguous characters, and are not
 *    guessable by repeating the generator. */
const codes = new Set();
for (let index = 0; index < 4000; index += 1) codes.add(generateConnectCode());
assert.equal(codes.size, 4000, "Generated codes must not repeat across many attempts.");
for (const code of codes) {
  assert.equal(code.length, CODE_LENGTH, "A code must be sixteen symbols long.");
  for (const character of code) {
    assert(CODE_ALPHABET.includes(character), `Unexpected character in a code: ${character}`);
  }
  for (const ambiguous of ["I", "L", "O", "U"]) {
    assert(!code.includes(ambiguous), `A code must not contain the ambiguous letter ${ambiguous}`);
  }
}
assert.equal(CODE_BYTES * 8, CODE_LENGTH * 5, "The code must use its whole random budget.");
assert(CODE_BYTES * 8 >= 80, "A code must carry at least eighty bits.");
assert.equal(CODE_TTL_MINUTES, 10, "A code must expire after ten minutes.");
assert.equal(groupConnectCode("ABCDEFGHJK MNPQRS".replace(" ", "")), "ABCD-EFGH-JKMN-PQRS");
assert.equal(groupConnectCode("ABCDEFGHJKMNPQRS").length, 19, "A grouped code keeps its separators.");

/* 2. A code typed by a person is understood, and a value that cannot be a code
 *    is refused. */
assert.equal(normaliseConnectCode("abcd-efgh-jkmn-pqrs"), "ABCDEFGHJKMNPQRS");
assert.equal(normaliseConnectCode("ABCD EFGH JKMN PQRS"), "ABCDEFGHJKMNPQRS");
assert.equal(normaliseConnectCode("ABCDEFGHJKMNPQRS"), "ABCDEFGHJKMNPQRS");
assert.equal(normaliseConnectCode("ABCDEFGHJKUMPQRS"), null, "A symbol outside the alphabet is refused.");
assert.equal(normaliseConnectCode("ABCD-EFGH-JKMN-PQR@"), null, "A stray symbol is refused after normalising.");
assert.equal(normaliseConnectCode("A1I0"), null, "A short value is refused.");
assert.equal(normaliseConnectCode("A"), null, "A single character is refused.");
assert.equal(normaliseConnectCode(""), null, "An empty value is refused.");
assert.equal(normaliseConnectCode("X".repeat(200)), null, "An oversized value is refused.");
assert.equal(normaliseConnectCode("IIIIIIIIIIIIIIII"), "1111111111111111", "A misread I is read as one.");
assert.equal(normaliseConnectCode("OOOOOOOOOOOOOOOO"), "0000000000000000", "A misread O is read as zero.");
assert.equal(normaliseConnectCode("-----"), null, "Separators alone are refused.");

/* 3. Only a digest is stored, and it never equals the code. */
const digest = await hashConnectCode("ABCDEFGHJKMNPQRS");
assert.equal(digest.length, 64, "A digest is a SHA-256 value in hex.");
assert.match(digest, /^[0-9a-f]{64}$/);
assert.equal(digest, await hashConnectCode("ABCDEFGHJKMNPQRS"), "A digest must be stable.");
assert.notEqual(digest, await hashConnectCode("ABCDEFGHJKMNPQRT"), "Different codes need different digests.");
assert(!digest.includes("ABCDEFGHJKMNPQRS"), "A digest must not contain the code.");

/* 4. Expiry is exactly ten minutes and is judged by the stored time. */
const issuedAt = "2026-05-01T10:00:00.000Z";
assert.equal(codeExpiryFrom(issuedAt), "2026-05-01T10:10:00.000Z", "A code must last exactly ten minutes.");
assert.equal(isCodeExpired("2026-05-01T10:10:00.000Z", "2026-05-01T10:09:59.999Z"), false, "A code is usable one tick before it expires.");
assert.equal(isCodeExpired("2026-05-01T10:10:00.000Z", "2026-05-01T10:10:00.000Z"), true, "A code is spent at its expiry moment.");
assert.equal(isCodeExpired("2026-05-01T10:10:00.000Z", "2026-05-01T11:00:00.000Z"), true, "A code stays spent afterwards.");
assert.equal(MAX_CODE_FAILED_ATTEMPTS, 5, "A single code must stop working after five wrong attempts.");
assert.equal(MAX_CLAIM_ATTEMPTS_PER_WINDOW, 8, "A guardian must be limited across attempts.");
assert.equal(CLAIM_WINDOW_MINUTES, 10, "The claim limit must apply inside a ten minute window.");

/* 5. Identity comes only from the platform headers. */
function requestWith(headers) {
  return new Request("https://kidycode.test/api/guardian/session", { headers });
}
assert.equal(readGuardianIdentity(requestWith({})), null, "No headers means no identity.");
assert.deepEqual(
  readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "local_seedy", [GUARDIAN_EMAIL_HEADER]: "Seedy@sites.test" })),
  { platformUserId: "local_seedy", email: "seedy@sites.test", displayName: null },
  "The id and email headers form the identity, with the email normalised.",
);
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "local_seedy" })), null, "An identity without an email is refused.");
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_EMAIL_HEADER]: "a@b.com" })), null, "An identity without an id is refused.");
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "bad id with spaces", [GUARDIAN_EMAIL_HEADER]: "a@b.com" })), null);
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "x".repeat(300), [GUARDIAN_EMAIL_HEADER]: "a@b.com" })), null);
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "ok_id", [GUARDIAN_EMAIL_HEADER]: "not-an-email" })), null);
assert.equal(readGuardianIdentity(requestWith({ [GUARDIAN_ID_HEADER]: "ok_id", [GUARDIAN_EMAIL_HEADER]: "x".repeat(300) + "@a.com" })), null);

const named = readGuardianIdentity(requestWith({
  [GUARDIAN_ID_HEADER]: "local_seedy",
  [GUARDIAN_EMAIL_HEADER]: "seedy@sites.test",
  [GUARDIAN_FULL_NAME_HEADER]: "  Seedy   Sites  ",
}));
assert.equal(named?.displayName, "Seedy Sites", "A name header becomes a tidy display name.");
const encoded = readGuardianIdentity(requestWith({
  [GUARDIAN_ID_HEADER]: "local_seedy",
  [GUARDIAN_EMAIL_HEADER]: "seedy@sites.test",
  [GUARDIAN_FULL_NAME_HEADER]: "Ana%20Mar%C3%ADa",
  [GUARDIAN_NAME_ENCODING_HEADER]: PERCENT_ENCODED_UTF8,
}));
assert.equal(encoded?.displayName, "Ana María", "A percent encoded name is decoded.");
const brokenName = readGuardianIdentity(requestWith({
  [GUARDIAN_ID_HEADER]: "local_seedy",
  [GUARDIAN_EMAIL_HEADER]: "seedy@sites.test",
  [GUARDIAN_FULL_NAME_HEADER]: "%E0%A4%A",
  [GUARDIAN_NAME_ENCODING_HEADER]: PERCENT_ENCODED_UTF8,
}));
assert.equal(brokenName?.displayName, null, "A malformed name is dropped, not trusted.");
assert.equal(GUARDIAN_SIGN_IN_PATH, "/signin-with-chatgpt");
assert.equal(GUARDIAN_SIGN_OUT_PATH, "/signout-with-chatgpt");

/* 6. A child's page never shows a guardian's full address. */
assert.equal(maskEmail("seedy@sites.test"), "s****@sites.test");
assert.equal(maskEmail("ab@example.com"), "a**@example.com");
assert.equal(maskEmail("no-at-sign"), "connected grown-up");

/* 7. The guardian view is a strict allow list. */
const course = courses["ages-10-12"];
const learnerSummary = buildSummary(course, {
  progress: [{ lessonId: course.lessons[0].id, status: "completed", updatedAt: "2026-06-01T10:00:00.000Z" }],
  evidence: [{
    lessonId: course.lessons[0].id, mastery: 100, successfulChecks: 2, attempts: 4, hintsRequested: 1,
    independentCorrections: 1, lastActivityAt: "2026-06-01T10:00:00.000Z", completedAt: "2026-06-01T10:00:00.000Z",
  }],
  reviews: [
    { concept: "main-heading", label: "Your page has the required h1", lessonId: course.lessons[0].id, timesFailed: 3, timesRecovered: 1, reviewStreak: 0, due: true },
    { concept: "list-items", label: "The list contains at least three items", lessonId: course.lessons[2].id, timesFailed: 2, timesRecovered: 3, reviewStreak: 2, due: false },
  ],
  checkpoints: [],
  exams: [{ score: 6, total: 10, passed: false, createdAt: "2026-06-02T10:00:00.000Z" }],
});
const guardianView = toGuardianSummary(learnerSummary, { firstName: "Sky", courseGroup: "Ages 10 to 12" });

const present = new Set(collectKeys(guardianView));
const allowed = new Set([
  ...GUARDIAN_SUMMARY_KEYS,
  "firstName", "courseGroup",
  "completed", "total", "label",
  "number", "title", "masteryLabel",
  "focus", "moduleNumber",
  "saved",
  "status", "bestScore",
  /* The completion record's own leaves. It names the course and the project, the
   * counts and the completion date, and nothing else. */
  "courseTitle", "projectTitle", "required", "completedAt",
  /* Recent milestones: wording and a date. */
  "milestones", "at",
]);
for (const key of present) {
  assert(allowed.has(key), `The guardian view exposes something outside the allow list: ${key}`);
}
for (const forbidden of GUARDIAN_FORBIDDEN_KEYS) {
  assert(!present.has(forbidden), `The guardian view exposes ${forbidden}.`);
}
assert.equal(present.has("mastery"), false, "Raw mastery figures are not part of the guardian view.");
assert.equal(present.has("checksPassed"), false, "Check counts are not part of the guardian view.");
assert.equal(present.has("independentCorrections"), false, "Intervention history is not part of the guardian view.");
assert.equal(present.has("learnerId"), false, "A learner identifier is never exposed.");
assert.equal(guardianView.learner.firstName, "Sky");
assert.equal(guardianView.learner.courseGroup, "Ages 10 to 12");
assert.equal(guardianView.activities.completed, 1);
assert.equal(guardianView.modules.length, course.stages.length);
assert.equal(guardianView.needsReview.length, 1);
assert.equal(guardianView.needsReview[0].focus.length > 0, true);
assert.equal(guardianView.strengthened.length, 1);
assert.equal(guardianView.finalAssessment.status, "attempted");
assert.equal(guardianView.nextLesson.title, course.lessons[1].title);
const serialised = JSON.stringify(guardianView);
for (const probe of ["<h1>", "My First Website", "workspace", "aggregate", "answers"]) {
  assert(!serialised.includes(probe), `The guardian view payload contains ${probe}.`);
}

/* 8. The migration is additive, stores digests, and keeps the right indexes. */
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const tags = journal.entries.map((entry) => entry.tag);
assert(tags.includes("0005_slimy_xorn"), "Phase 4 must add migration 0005.");
assert.equal(tags.filter((tag) => tag.startsWith("0005")).length, 1, "Phase 4 must own exactly one migration.");
assert.equal(read("drizzle/0004_light_solo.sql").includes("guardian_"), false, "The guardian tables must not be created twice.");
const migration = read("drizzle/0005_slimy_xorn.sql");
assert(migration.includes("CREATE TABLE `guardian_accounts`"));
assert(migration.includes("CREATE TABLE `guardian_links`"));
assert(migration.includes("CREATE TABLE `guardian_connect_codes`"));
assert(migration.includes("`code_digest`"), "Only the digest column may exist for a code.");
assert(!/`code`\s+text/i.test(migration), "The plain code must never have a column.");
assert(!/DROP TABLE/i.test(migration), "The migration must be additive.");
assert(!/ALTER TABLE/i.test(migration), "The migration must not alter existing tables.");
assert(migration.includes("PRAGMA optimize"), "The migration must run PRAGMA optimize after its indexes.");
assert(migration.indexOf("PRAGMA optimize") > migration.indexOf("CREATE INDEX"), "PRAGMA optimize must come after the indexes.");
/* Four unique indexes guard identity, link pairs, link handles and code digests.
 * Two ordinary indexes serve the learner lookups. Every one of them carries a
 * lookup this phase actually performs. */
const uniqueIndexes = (migration.match(/CREATE UNIQUE INDEX/g) || []).length;
const totalIndexes = (migration.match(/CREATE (UNIQUE )?INDEX/g) || []).length;
assert.equal(uniqueIndexes, 4, "Four unique indexes are expected.");
assert.equal(totalIndexes, 6, "Six indexes in total are expected, and no more.");
/* Three cascades: a code follows its learner, a link follows its learner, and a
 * link follows its guardian, so deleting either side leaves nothing behind. */
assert.equal((migration.match(/ON DELETE cascade/g) || []).length, 3, "Codes and links must cascade with the learner and the guardian.");
assert(migration.includes("ON DELETE set null"), "A used code may keep its history when a guardian is removed.");

/* 9. Every guardian route refuses an unauthenticated caller, and identity is
 *    never taken from the request body or the query string. */
const sessionRoute = read("app/api/guardian/session/route.ts");
const linksRoute = read("app/api/guardian/links/route.ts");
const summaryRoute = read("app/api/guardian/summary/route.ts");
const learnerRoute = read("app/api/guardian/connections/route.ts");
const authModule = read("lib/guardian-auth.ts");
const identityModule = read("lib/guardian-identity.ts");
const linkModule = read("lib/guardian-links.ts");
const guardianSources = [sessionRoute, linksRoute, summaryRoute, authModule, identityModule, linkModule].join("\n");

for (const [name, source] of [["session", sessionRoute], ["links", linksRoute], ["summary", summaryRoute]]) {
  assert(source.includes("establishGuardian(request)"), `${name} must establish the guardian identity.`);
  assert(source.includes("guardianUnauthorized()"), `${name} must answer 401 without a platform identity.`);
}
assert(identityModule.includes("oai-authenticated-user-id") && identityModule.includes("oai-authenticated-user-email"),
  "The identity must come from the platform headers.");
assert(identityModule.includes("oai-authenticated-user-full-name"), "The optional display name must come from the platform header.");
assert(identityModule.includes("request.headers.get"), "Identity must be read from request headers.");
assert(authModule.includes("readGuardianIdentity(request)"), "The server only identity must come from the platform headers.");
assert(!/body\.\w*(id|email|userId|guardianId)/i.test(guardianSources), "Identity must never come from a body.");
assert(!/searchParams\.get\("(id|email|guardianId|userId)"\)/.test(guardianSources), "Identity must never come from a query string.");
assert(!guardianSources.includes("kidycode_session"), "The guardian path must not read the learner session.");
assert(summaryRoute.includes("resolveGuardianLink"), "The summary must resolve the link before reading anything.");
assert(linkModule.includes("l.guardian_id = ? AND l.link_ref = ? AND l.status = 'active'"),
  "A guardian read must be scoped to that guardian and to an active link.");
assert(linkModule.includes("AND l.status = 'active'"), "Revoked links must stop resolving immediately.");
assert(summaryRoute.includes("link.learnerId"), "Every summary query must run for the linked learner only.");
assert(linksRoute.includes("normaliseConnectCode"), "A claimed code must be normalised before lookup.");
assert(linkModule.includes("WHERE id = ? AND used_at IS NULL AND invalidated_at IS NULL AND expires_at > ?"),
  "A claim must be a single conditional update.");
assert(linkModule.includes("meta?.changes ?? 0) !== 1"), "A claim must confirm it won the race.");
assert(linkModule.includes("ON CONFLICT (guardian_id, learner_id) DO UPDATE SET"), "A link pair must be upserted, never duplicated.");
assert(linkModule.includes("status = 'revoked', revoked_at = ?"), "Revocation must be recorded.");
assert(!/console\.(log|info|warn)\(/.test(`${guardianSources}\n${linksRoute}\n${learnerRoute}`), "Guardian code must never log, so a code cannot leak into logs.");
assert(learnerRoute.includes("action: z.literal(\"generate\")"), "Only a known action may generate a code.");
assert(learnerRoute.includes("guardianControlsUnavailable"), "The learner endpoint must refuse the adult path.");
assert(learnerRoute.includes("authenticateLearner(request)"), "The learner endpoint must authenticate the learner.");
assert(read("lib/one-time-codes.ts").includes("crypto.getRandomValues"), "Codes must come from a cryptographic source.");
assert(read("lib/guardian-links.ts").includes("hashConnectCode"), "Only a digest may be stored or looked up.");

const interfaceSource = `${read("components/GrownUpAccess.tsx")}\n${read("components/GuardianDashboard.tsx")}\n${read("components/ProgressPage.tsx")}`;
assert(interfaceSource.includes("Grown-up access"), "The learner must see the grown-up area.");
assert(interfaceSource.includes("Sign in with ChatGPT"), "A guardian must be offered the platform sign in.");
assert(interfaceSource.includes("End access"), "A learner must be able to end a connection.");
assert(interfaceSource.includes("Disconnect"), "A guardian must be able to disconnect.");
assert(interfaceSource.includes("aria-live"), "Status changes must be announced.");
assert(read("components/ProgressPage.tsx").includes('courseFacts.id !== "adults"'), "Adult learners must not see guardian controls.");

for (const banned of ["—", "green"]) {
  assert(!interfaceSource.includes(banned), `The guardian interface contains ${banned}.`);
  assert(!guardianSources.includes(banned), `The guardian backend contains ${banned}.`);
}

console.log("Validated guardian identity from platform headers, one-time codes, additive migration, link authorisation and the guardian allow list.");
