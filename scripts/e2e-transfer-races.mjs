/*
 * Deterministic race and atomicity tests for learner transfer codes.
 *
 * These cannot be driven through the HTTP interface, because the interesting
 * moments sit inside a single request: between the code lookup and the transaction,
 * and between the statements of that transaction. So this harness runs the real
 * library against a real SQLite database wrapped in a D1 compatible adapter, and
 * uses the adapter's hooks to place a competing request exactly where a real one
 * could land.
 *
 *   cd C:/Users/USER/kidycode
 *   node --import tsx --no-warnings scripts/e2e-transfer-races.mjs
 *
 * Nothing here touches the running server or the live database.
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { hashAccessKey } from "../lib/access-keys.ts";
import { normaliseConnectCode } from "../lib/one-time-codes.ts";
import { claimTransferCode, createTransferCode } from "../lib/transfer-codes.ts";

const root = join(import.meta.dirname, "..");
const passed = [];
const failed = [];

async function step(name, run) {
  try {
    await run();
    passed.push(name);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${error.message.split("\n")[0]}`);
  }
}

/* ------------------------------------------------------------------ *
 * A D1 compatible adapter with hooks, over node:sqlite.
 * ------------------------------------------------------------------ */

class PreparedStatement {
  constructor(database, sql, params = []) {
    this.database = database;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new PreparedStatement(this.database, this.sql, params);
  }

  async first(column) {
    const rows = this.database.query(this.sql, this.params);
    if (rows.length === 0) return null;
    return column ? rows[0][column] : rows[0];
  }

  async all() {
    return { results: this.database.query(this.sql, this.params), success: true, meta: {} };
  }

  async run() {
    return this.database.write(this.sql, this.params);
  }
}

class TestDatabase {
  constructor(sqlite) {
    this.sqlite = sqlite;
    this.hooks = { beforeBatch: null, beforeWrite: null, failOn: null, failOnQuery: null };
  }

  prepare(sql) {
    return new PreparedStatement(this, sql);
  }

  query(sql, params) {
    if (this.hooks.failOnQuery && this.hooks.failOnQuery(sql)) throw new Error("injected read failure");
    return this.sqlite.prepare(sql).all(...params);
  }

  async write(sql, params) {
    if (this.hooks.beforeWrite) await this.hooks.beforeWrite(sql);
    const info = this.sqlite.prepare(sql).run(...params);
    return { success: true, meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) } };
  }

  /* D1 runs a batch as one transaction, so this does too: BEGIN, every statement,
   * COMMIT, and a rollback of everything if any statement throws. */
  async batch(statements) {
    if (this.hooks.beforeBatch) await this.hooks.beforeBatch(statements.map((statement) => statement.sql));
    this.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const [index, statement] of statements.entries()) {
        if (this.hooks.failOn && this.hooks.failOn(index, statement.sql)) {
          throw new Error("injected statement failure");
        }
        results.push(await this.write(statement.sql, statement.params));
      }
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

function openMigratedDatabase() {
  const path = join(process.env.LOCALAPPDATA || process.env.TMPDIR || ".", "Temp", `kidycode-races-${crypto.randomUUID().slice(0, 8)}.sqlite`);
  const sqlite = new DatabaseSync(path);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const files = readdirSync(join(root, "drizzle")).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    for (const statement of readFileSync(join(root, "drizzle", file), "utf8").split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
  return { database: new TestDatabase(sqlite), sqlite, path, migrations: files.length };
}

const ORIGINAL_KEY = "original-learner-key";
const LEARNER_ID = "learner-under-test";

function seedLearner(database) {
  return database.write(
    `INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, course_id, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [LEARNER_ID, "", "RaceChild", 11, "interest", "ages-10-12", "2026-09-22T09:00:00.000Z", "2026-09-22T09:00:00.000Z"],
  );
}

async function setAccessHash(database, hash) {
  await database.prepare("UPDATE learner_profiles SET access_hash = ? WHERE id = ?").bind(hash, LEARNER_ID).run();
}

async function accessHash(database) {
  const row = await database
    .prepare("SELECT access_hash AS hash FROM learner_profiles WHERE id = ?")
    .bind(LEARNER_ID)
    .first();
  return row?.hash || "";
}

async function codeRow(database, code) {
  const digest = await (async () => {
    const { hashConnectCode } = await import("../lib/one-time-codes.ts");
    return hashConnectCode(normaliseConnectCode(code));
  })();
  return await database
    .prepare(`SELECT id, used_at AS usedAt, used_by_device AS device, applied_at AS appliedAt,
      invalidated_at AS invalidatedAt, failed_attempts AS failedAttempts
      FROM learner_transfer_codes WHERE code_digest = ?`)
    .bind(digest)
    .first();
}

async function activeCodes(database) {
  return await database
    .prepare(`SELECT id, created_at AS createdAt FROM learner_transfer_codes
      WHERE learner_id = ? AND used_at IS NULL AND invalidated_at IS NULL`)
    .bind(LEARNER_ID)
    .all();
}

async function snapshot(database) {
  const codes = await database.prepare("SELECT * FROM learner_transfer_codes ORDER BY id").all();
  const learners = await database.prepare("SELECT id, access_hash AS accessHash FROM learner_profiles ORDER BY id").all();
  const limits = await database.prepare("SELECT * FROM transfer_claim_limits ORDER BY scope").all();
  return JSON.stringify({ codes: codes.results, learners: learners.results, limits: limits.results });
}

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("timed out waiting for the intended interleave");
}

const T0 = "2026-09-22T10:00:00.000Z";
const later = (minutes) => new Date(new Date(T0).getTime() + minutes * 60_000).toISOString();

/* ------------------------------------------------------------------ *
 * 1. A stale claim must not destroy the replacement that beat it.
 * ------------------------------------------------------------------ */
await step("a stale claim loses and leaves the replacement active", async () => {
  const { database, sqlite, path } = openMigratedDatabase();
  try {
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));
    const stale = (await createTransferCode(database, LEARNER_ID, "learner", T0)).code;

    /* The interleave: the claim has already read its code row and passed every
     * check, and a replacement is created before the claim's transaction runs. */
    let armed = true;
    let replacement = "";
    database.hooks.beforeBatch = async (statements) => {
      if (!armed) return;
      if (!statements.some((sql) => sql.includes("SET used_at = ?"))) return;
      armed = false;
      replacement = (await createTransferCode(database, LEARNER_ID, "learner", later(1))).code;
    };

    const outcome = await claimTransferCode(database, normaliseConnectCode(stale), "scope-a", later(2));
    assert.equal(outcome.status, "raced", `the stale claim must lose, received ${outcome.status}`);

    const lost = await codeRow(database, stale);
    assert(lost.invalidatedAt, "the replaced code must be marked invalidated");
    assert.equal(lost.usedAt, null, "the losing claim must not spend the stale code");
    assert.equal(lost.device, null, "the losing claim must not claim any row");

    const winner = await codeRow(database, replacement);
    assert.equal(winner.usedAt, null, "the replacement must still be unused");
    assert.equal(winner.invalidatedAt, null, "the replacement must not be invalidated by a losing request");
    assert.equal(winner.appliedAt, null, "the replacement must not be marked applied");

    assert.equal(await accessHash(database), await hashAccessKey(ORIGINAL_KEY),
      "a losing claim must not change the learner's access key");

    /* And the replacement still works. */
    const moved = await claimTransferCode(database, normaliseConnectCode(replacement), "scope-b", later(3));
    assert.equal(moved.status, "transferred", `the replacement must still transfer the learner, received ${moved.status}`);
    assert.equal(await accessHash(database), await hashAccessKey(moved.newAccessKey),
      "the winning claim must rotate the access key to the key it handed back");
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

/* ------------------------------------------------------------------ *
 * 2. A losing claim must change nothing anywhere.
 * ------------------------------------------------------------------ */
await step("a losing claim changes no sibling code, no key and no attempt row", async () => {
  const { database, sqlite, path } = openMigratedDatabase();
  try {
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));
    const contested = (await createTransferCode(database, LEARNER_ID, "learner", T0)).code;

    /* A sibling code exists, as it would after a replacement that is still fresh. */
    await database
      .prepare(`INSERT INTO learner_transfer_codes
        (id, learner_id, code_digest, created_by, created_at, expires_at, used_at, used_by_device, applied_at, invalidated_at, failed_attempts)
        VALUES (?, ?, ?, 'guardian', ?, ?, NULL, NULL, NULL, NULL, 0)`)
      .bind("sibling-row", LEARNER_ID, "digest-of-a-sibling-code", T0, later(10))
      .run();

    /* The losing request has an attempt counter of its own. */
    await database
      .prepare("INSERT INTO transfer_claim_limits (scope, attempts, window_at) VALUES (?, ?, ?)")
      .bind("scope-loser", 3, T0)
      .run();

    let armed = true;
    let winnerStatus = "";
    let afterWinner = "";
    database.hooks.beforeBatch = async (statements) => {
      if (!armed) return;
      if (!statements.some((sql) => sql.includes("SET used_at = ?"))) return;
      armed = false;
      /* A competing request completes first, with its own source and its own key. */
      winnerStatus = (await claimTransferCode(database, normaliseConnectCode(contested), "scope-winner", later(1))).status;
      afterWinner = await snapshot(database);
    };

    const loser = await claimTransferCode(database, normaliseConnectCode(contested), "scope-loser", later(2));
    assert.equal(winnerStatus, "transferred", `the competing request must have won, received ${winnerStatus}`);
    assert.equal(loser.status, "raced", `the late request must lose, received ${loser.status}`);
    assert.equal(await snapshot(database), afterWinner, "a losing claim must not change any row");

    const limits = await database.prepare("SELECT attempts FROM transfer_claim_limits WHERE scope = ?").bind("scope-loser").first();
    assert.equal(limits.attempts, 3, "a losing claim must not clear another scope's attempt counter");

    const sibling = await database.prepare("SELECT invalidated_at AS invalidatedAt FROM learner_transfer_codes WHERE id = ?").bind("sibling-row").first();
    assert(sibling.invalidatedAt === later(1), "the sibling code must be left as the winner left it");
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

/* ------------------------------------------------------------------ *
 * 3. Two generations at once must leave exactly one active code.
 * ------------------------------------------------------------------ */
await step("concurrent generation leaves exactly one active code", async () => {
  const { database, sqlite, path } = openMigratedDatabase();
  try {
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));

    for (let round = 0; round < 5; round += 1) {
      const [one, two] = await Promise.all([
        createTransferCode(database, LEARNER_ID, "learner", later(round * 2)),
        createTransferCode(database, LEARNER_ID, "guardian", later(round * 2 + 1)),
      ]);
      assert(one.code !== two.code, "each generation must produce its own code");
      const active = await activeCodes(database);
      assert.equal(active.results.length, 1, `round ${round}: expected one active code, found ${active.results.length}`);
      const total = await database.prepare("SELECT COUNT(*) AS total FROM learner_transfer_codes WHERE learner_id = ?").bind(LEARNER_ID).first();
      assert.equal(total.total, round * 2 + 2, `round ${round}: both rows must exist for the audit trail`);
    }

    /* The hardest ordering: hold the first generation open at the exact moment
     * between its two writes, and let a second generation run to completion while
     * it is held. Either the competing generation is refused because the first has
     * already opened its transaction, or it completes and the first must then be
     * the one that invalidates. What must never happen is two active codes. */
    let armed = true;
    let held = false;
    let competitorNote = "";
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    database.hooks.beforeWrite = async (sql) => {
      if (!armed) return;
      if (!sql.includes("INSERT INTO learner_transfer_codes")) return;
      armed = false;
      held = true;
      await gate;
    };

    const heldGeneration = createTransferCode(database, LEARNER_ID, "learner", later(70));
    await waitFor(() => held);
    const competitor = await createTransferCode(database, LEARNER_ID, "guardian", later(71))
      .then(() => "completed")
      .catch((error) => {
        competitorNote = error.message;
        return "refused";
      });
    release();
    await heldGeneration;

    const active = await activeCodes(database);
    assert.equal(active.results.length, 1,
      `while one generation was held open, expected one active code, found ${active.results.length} (the competitor ${competitor}${competitorNote ? `: ${competitorNote}` : ""})`);
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

/* ------------------------------------------------------------------ *
 * 4 and 5. A failed transaction rolls back, and a good one rotates.
 * ------------------------------------------------------------------ */
await step("a failed rotation rolls back and the original session still works", async () => {
  const { database, sqlite, path } = openMigratedDatabase();
  try {
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));
    const code = (await createTransferCode(database, LEARNER_ID, "learner", T0)).code;

    /* Fail partway through the transaction: the claim has been written, the
     * rotation has not. */
    database.hooks.failOn = (index, sql) => index === 2 && sql.includes("UPDATE learner_profiles SET access_hash");
    await assert.rejects(
      () => claimTransferCode(database, normaliseConnectCode(code), "scope-c", later(1)),
      /injected statement failure/,
      "a failed transaction must surface as an error rather than a silent success",
    );
    database.hooks.failOn = null;

    const row = await codeRow(database, code);
    assert.equal(row.usedAt, null, "a rolled back claim must not spend the code");
    assert.equal(row.device, null, "a rolled back claim must not record a device");
    assert.equal(row.appliedAt, null, "a rolled back claim must not mark anything applied");
    assert.equal(row.invalidatedAt, null, "a rolled back claim must not invalidate anything");
    assert.equal(await accessHash(database), await hashAccessKey(ORIGINAL_KEY),
      "a rolled back claim must leave the original access key in place");

    /* The original session still works, which is the whole point of the rollback. */
    const stillSignedIn = await database
      .prepare("SELECT id FROM learner_profiles WHERE id = ? AND access_hash = ?")
      .bind(LEARNER_ID, await hashAccessKey(ORIGINAL_KEY))
      .first();
    assert(stillSignedIn, "the original device must still be signed in after a failed transfer");

    /* And the code is still usable afterwards. */
    const retry = await claimTransferCode(database, normaliseConnectCode(code), "scope-c", later(2));
    assert.equal(retry.status, "transferred", `the code must still work after a rollback, received ${retry.status}`);
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

await step("one valid claim rotates the key and hands back the new one only", async () => {
  const { database, sqlite, path, migrations } = openMigratedDatabase();
  try {
    assert(migrations >= 7, `every migration must be applied, applied ${migrations}`);
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));
    const code = (await createTransferCode(database, LEARNER_ID, "learner", T0)).code;

    const outcome = await claimTransferCode(database, normaliseConnectCode(code), "scope-d", later(1));
    assert.equal(outcome.status, "transferred", `the claim must succeed, received ${outcome.status}`);
    assert.equal(typeof outcome.newAccessKey, "string", "the new access key must be handed back to the caller");
    assert.equal(outcome.newAccessKey.length, 64, "the new access key must be the full length");
    assert.equal(outcome.nickname, "RaceChild", "the claim must return the learner it moved");
    assert.equal(outcome.courseId, "ages-10-12", "the claim must return the learner's own course");
    assert.equal(Object.prototype.hasOwnProperty.call(outcome, "learnerId"), true, "the outcome carries the learner internally");

    const stored = await accessHash(database);
    assert.equal(stored, await hashAccessKey(outcome.newAccessKey), "the stored hash must match the handed back key");
    assert.notEqual(stored, await hashAccessKey(ORIGINAL_KEY), "the previous key must stop working");

    const row = await codeRow(database, code);
    assert(row.usedAt, "the code must be marked used");
    assert(row.appliedAt, "the rotation must be marked applied");

    const leftovers = await database.prepare("SELECT COUNT(*) AS total FROM transfer_claim_limits WHERE scope = ?").bind("scope-d").first();
    assert.equal(leftovers.total, 0, "the attempt window must be cleared inside the same transaction");
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

await step("a failure while reading the learner leaves every row untouched", async () => {
  const { database, sqlite, path } = openMigratedDatabase();
  try {
    seedLearner(database);
    await setAccessHash(database, await hashAccessKey(ORIGINAL_KEY));
    const code = (await createTransferCode(database, LEARNER_ID, "learner", T0)).code;
    const before = await snapshot(database);

    /* The learner has to be read before the access key changes. If that read fails,
     * nothing at all may have happened, and the original device must still work. */
    database.hooks.failOnQuery = (sql) => sql.includes("SELECT id, nickname");
    await assert.rejects(
      () => claimTransferCode(database, normaliseConnectCode(code), "scope-e", later(1)),
      /injected read failure/,
      "a failed read must surface as an error",
    );
    database.hooks.failOnQuery = null;

    assert.equal(await snapshot(database), before, "a failed read before the rotation must change nothing");
    assert.equal(await accessHash(database), await hashAccessKey(ORIGINAL_KEY),
      "the original access key must still be the stored one");
    const stillSignedIn = await database
      .prepare("SELECT id FROM learner_profiles WHERE id = ? AND access_hash = ?")
      .bind(LEARNER_ID, await hashAccessKey(ORIGINAL_KEY))
      .first();
    assert(stillSignedIn, "the original device must still be signed in");

    const retry = await claimTransferCode(database, normaliseConnectCode(code), "scope-e", later(2));
    assert.equal(retry.status, "transferred", `the code must still work afterwards, received ${retry.status}`);
  } finally {
    sqlite.close();
    rmSync(path, { force: true });
  }
});

console.log(`\n${passed.length} checks passed, ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("Failures:");
  for (const item of failed) console.log(`  - ${item}`);
  process.exitCode = 1;
}