/*
 * The Phase 8 database audit. Local only: it builds throwaway SQLite stores in the
 * operating system's temporary directory and never opens, writes or migrates the
 * deployed KidyCode database.
 *
 * Three things are proved, in the order a release needs them:
 *
 *   1. A fresh local database reaches the current schema by applying the journal,
 *      every migration in order, exactly once each.
 *   2. A representative pre-Assessment-V2 database survives the upgrade: V1 rows keep
 *      their values, the new tables arrive empty, and nothing already applied is
 *      rewritten.
 *   3. The schema does what the product's promises say: every learner-owned table
 *      cascades from the learner, a deleted learner leaves no orphan anywhere, the
 *      cascade reaches attempt-owned rows too, and the unique constraints the
 *      concurrency rules depend on are actually enforced by the database.
 *
 * The migration files themselves are history: this script asserts 0007 is still
 * additive and is still the only migration that creates the assessment tables, but it
 * never edits a migration to make an assertion pass.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const temporary = mkdtempSync(join(tmpdir(), "kidycode-audit-"));
const stores = [];

const passed = [];
const failed = [];
function check(name) {
  if (typeof name !== "string") throw new TypeError("check() only records. Use step() to run a body.");
  passed.push(name);
  console.log(`  ok   ${name}`);
}
function step(name, body) {
  try {
    body();
    check(name);
  } catch (error) {
    if (process.env.AUDIT_DEBUG) console.error(error.stack);
    failed.push(`${name}: ${error.message}`);
    console.log(`  FAIL ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

function open(label) {
  const file = join(temporary, `${label}.sqlite`);
  stores.push(file);
  return new DatabaseSync(file);
}

/* ------------------------------------------------------------ the journal ----- */

const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const files = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql")).sort();
const entries = journal.entries;

const migrations = new Map();
function loadMigrations() {
  for (const entry of entries) {
    const sql = read(`drizzle/${entry.tag}.sql`);
    migrations.set(entry.tag, sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean));
  }
}
loadMigrations();

function apply(database, tags) {
  for (const tag of tags) {
    for (const statement of migrations.get(tag)) database.exec(`${statement};`);
  }
}

const allTags = entries.map((entry) => entry.tag);
const preV2Tags = allTags.filter((tag) => !tag.startsWith("0007"));

step("the journal and the migration files agree, in order and one for one", () => {
  assert.equal(journal.dialect, "sqlite", "the journal must describe a SQLite database.");
  assert.equal(entries.length, files.length, "every migration file must be listed in the journal.");
  entries.forEach((entry, index) => assert.equal(entry.idx, index, `journal entry ${entry.tag} is out of order.`));
  assert.deepEqual(
    allTags.map((tag) => `${tag}.sql`),
    files,
    "the journal order must be the file order, so a fresh database migrates deterministically.",
  );
  assert.equal(allTags[allTags.length - 1], "0007_violet_praxagora", "0007 must still be the newest migration.");
});

step("no migration is missing, duplicated or renumbered", () => {
  const prefixes = allTags.map((tag) => tag.slice(0, 4));
  assert.deepEqual(prefixes, ["0000", "0001", "0002", "0003", "0004", "0005", "0006", "0007"], "the migration sequence must be complete.");
  assert.equal(new Set(allTags).size, allTags.length, "a migration may not be listed twice.");
});

/* ------------------------------------------------------- a fresh database ----- */

step("a fresh local database reaches the current schema from 0000 through 0007", () => {
  const database = open("fresh");
  try {
    for (const tag of allTags) {
      for (const statement of migrations.get(tag)) database.exec(`${statement};`);
    }
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);
    for (const table of [
      "learner_profiles",
      "course_progress",
      "project_checkpoints",
      "exam_attempts",
      "lesson_evidence",
      "guardian_accounts",
      "guardian_links",
      "guardian_connect_codes",
      "learner_transfer_codes",
      "transfer_claim_limits",
      "concept_review",
      "tutor_interventions",
      "assessment_attempts",
      "assessment_item_results",
      "assessment_defence",
      "assessment_signals",
      "assessment_credentials",
      "assessment_revision_items",
    ]) {
      assert(tables.includes(table), `the fresh schema is missing ${table}.`);
    }
    assert.equal(tables.length, 18, `the fresh schema should hold exactly eighteen tables, found ${tables.length}.`);
    assert.equal(database.prepare("PRAGMA foreign_keys").get().foreign_keys, 1, "foreign keys must be enforced on this store.");
  } finally {
    database.close();
  }
});

step("exactly one migration creates the assessment tables, and it is purely additive", () => {
  const creators = files.filter((name) => read(`drizzle/${name}`).includes("CREATE TABLE `assessment_attempts`"));
  assert.deepEqual(creators, ["0007_violet_praxagora.sql"], "exactly one migration may create the assessment tables.");
  const migration = read("drizzle/0007_violet_praxagora.sql");
  assert.equal((migration.match(/CREATE TABLE/g) || []).length, 6, "0007 adds six tables and nothing else.");
  const statements = migration.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) {
    assert(/^CREATE\s+(TABLE|(UNIQUE\s+)?INDEX)\b/i.test(statement), `0007 must only create tables and indexes, found: ${statement.slice(0, 40)}`);
    assert(!/\bDROP\s+(TABLE|INDEX|VIEW|TRIGGER)\b/i.test(statement), `0007 must not drop anything: ${statement.slice(0, 40)}`);
    assert(!/\bALTER\s+TABLE\b/i.test(statement), `0007 must not alter an existing table: ${statement.slice(0, 40)}`);
    assert(!/\bINSERT\s+INTO\b|\bDELETE\s+FROM\b|^\s*UPDATE\b/im.test(statement), `0007 must not write data: ${statement.slice(0, 40)}`);
  }
  const digest = createHash("sha256").update(migration).digest("hex");
  console.log(`  ..   0007_violet_praxagora.sql sha256 ${digest}`);
});

/* ------------------------------------------------- who owns what, in the schema- */

/*
 * Walking the foreign key graph rather than listing tables by hand: a table that reaches
 * the learner through a parent which cascades is learner-owned too, and the next migration
 * cannot quietly add one that escapes the deletion.
 */
function foreignKeys(database, table) {
  return database.prepare(`PRAGMA foreign_key_list(${table})`).all();
}
function tablesOf(database) {
  return database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((row) => row.name);
}

step("every learner-owned table cascades from the learner, directly or through a parent", () => {
  const database = open("graph");
  try {
    apply(database, allTags);
    const tables = tablesOf(database);
    const edges = new Map();
    for (const table of tables) {
      edges.set(
        table,
        foreignKeys(database, table).map((key) => ({ parent: key.table, onDelete: String(key.on_delete).toLowerCase() })),
      );
    }
    /* A table is learner-owned when it holds a learner_id column, or when a cascading
     * parent is learner-owned. */
    const owned = new Set(["learner_profiles"]);
    for (const table of tables) {
      const columns = database.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
      if (columns.includes("learner_id") && table !== "learner_profiles") {
        const key = edges.get(table).find((edge) => edge.parent === "learner_profiles");
        assert.ok(key, `${table} holds a learner_id but does not reference learner_profiles.`);
        assert.equal(key.onDelete, "cascade", `${table} must cascade when the learner is deleted.`);
        owned.add(table);
      }
    }
    let grew = true;
    while (grew) {
      grew = false;
      for (const table of tables) {
        if (owned.has(table)) continue;
        if (edges.get(table).some((edge) => owned.has(edge.parent) && edge.onDelete === "cascade")) {
          owned.add(table);
          grew = true;
        }
      }
    }
    /* Two tables are deliberately not learner-scoped and are named here rather than
     * excluded silently: guardian_accounts belongs to a grown-up's platform identity and
     * must outlive one learner, and transfer_claim_limits is a coarse bound keyed by a
     * hashed source address, holding no learner data at all. */
    const outside = ["guardian_accounts", "transfer_claim_limits"];
    const unexpected = tables.filter((table) => !owned.has(table) && !outside.includes(table));
    assert.deepEqual(unexpected, [], `these tables are outside the learner cascade: ${unexpected.join(", ")}`);
    for (const table of outside) {
      const columns = database.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
      assert(!columns.includes("learner_id"), `${table} is meant to hold no learner data.`);
    }
    assert.equal(owned.size, tables.length - outside.length, "every other table must be reachable from the learner by cascade.");
    /* A grown-up leaving still removes their links and any unused code, while the learner
     * keeps their own work. */
    const linkKeys = edges.get("guardian_links");
    assert(linkKeys.some((edge) => edge.parent === "guardian_accounts" && edge.onDelete === "cascade"), "removing a grown-up must remove their links.");
    assert(linkKeys.some((edge) => edge.parent === "learner_profiles" && edge.onDelete === "cascade"), "removing a learner must remove their links.");
    console.log(`  ..   ${owned.size} of ${tables.length} tables cascade from the learner; ${outside.join(" and ")} are deliberately outside it`);
  } finally {
    database.close();
  }
});

/* ----------------------------------------------------------- the cascade ------- */

const learnerOwnedTables = [
  "course_progress",
  "lesson_evidence",
  "project_checkpoints",
  "exam_attempts",
  "concept_review",
  "tutor_interventions",
  "guardian_connect_codes",
  "learner_transfer_codes",
  "assessment_attempts",
  "assessment_item_results",
  "assessment_defence",
  "assessment_signals",
  "assessment_credentials",
  "assessment_revision_items",
];

const now = "2026-01-01T00:00:00.000Z";

function seedLearner(database, id) {
  database.prepare(
    "INSERT INTO learner_profiles (id, access_hash, nickname, age, theme, course_id, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, `hash-${id}`, id, 11, "interest", "ages-10-12", now, now);
}
/* The V1 rows a learner could already own before Assessment V2 existed. Seeded on their
 * own so the upgrade test can populate a pre-V2 store without naming a table that does not
 * exist yet in that store. */
function seedV1Rows(database, learnerId, suffix = "") {
  database.prepare("INSERT INTO course_progress (learner_id, lesson_id, updated_at) VALUES (?, 'ages-10-12-note', ?)").run(learnerId, now);
  database.prepare("INSERT INTO lesson_evidence (learner_id, lesson_id, created_at, last_activity_at) VALUES (?, 'ages-10-12-note', ?, ?)").run(learnerId, now, now);
  database.prepare("INSERT INTO project_checkpoints (id, learner_id, stage_id, version, project_json, created_at) VALUES (?, ?, 'stage-1', 1, '{}', ?)").run(`cp-${learnerId}${suffix}`, learnerId, now);
  database.prepare("INSERT INTO exam_attempts (id, learner_id, score, total, answers_json, practical_json, passed, created_at) VALUES (?, ?, 6, 10, '[]', '{}', 0, ?)").run(`exam-${learnerId}${suffix}`, learnerId, now);
  database.prepare("INSERT INTO concept_review (learner_id, concept, label, lesson_id, first_failed_at, last_failed_at) VALUES (?, 'c1', 'Use one h1', 'ages-10-12-note', ?, ?)").run(learnerId, now, now);
  database.prepare("INSERT INTO tutor_interventions (id, learner_id, lesson_id, level, focus, created_at) VALUES (?, ?, 'ages-10-12-note', 1, 'c1', ?)").run(`ti-${learnerId}${suffix}`, learnerId, now);
  database.prepare("INSERT INTO guardian_connect_codes (id, learner_id, code_digest, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(`gcc-${learnerId}${suffix}`, learnerId, `digest-gcc-${learnerId}`, now, now);
  database.prepare("INSERT INTO learner_transfer_codes (id, learner_id, code_digest, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(`ltc-${learnerId}${suffix}`, learnerId, `digest-ltc-${learnerId}`, now, now);
}

function seedAssessmentRows(database, learnerId, suffix = "") {
  const attemptId = `attempt-${learnerId}${suffix}`;
  database
    .prepare(
      `INSERT INTO assessment_attempts (id, learner_id, course_id, kind, form_id, content_version, started_at) VALUES (?, ?, 'ages-10-12', 'module', 'fixture-form-1', 'assessment-v2.1', ?)`,
    )
    .run(attemptId, learnerId, now);
  database
    .prepare(
      `INSERT INTO assessment_item_results (attempt_id, learner_id, item_id, form_id, content_version, item_type, status, created_at) VALUES (?, ?, 'item-1', 'fixture-form-1', 'assessment-v2.1', 'practical', 'met', ?)`,
    )
    .run(attemptId, learnerId, now);
  database
    .prepare(
      `INSERT INTO assessment_defence (attempt_id, learner_id, course_id, template_id, explain_item_id, predict_item_id, predict_expected, change_item_id, change_prompt, created_at, updated_at) VALUES (?, ?, 'ages-10-12', 't1', 'e1', 'p1', '2', 'c1', 'Add one item', ?, ?)`,
    )
    .run(attemptId, learnerId, now, now);
  database.prepare("INSERT INTO assessment_signals (attempt_id, learner_id, created_at, updated_at) VALUES (?, ?, ?, ?)").run(attemptId, learnerId, now, now);
  database
    .prepare(
      `INSERT INTO assessment_credentials (id, learner_id, course_id, level, certificate_name, skills_json, attempt_id, issued_at) VALUES (?, ?, 'ages-10-12', 'Web Creator', 'KidyCode Applied Web Skills Certificate', '[]', ?, ?)`,
    )
    .run(`cred-${learnerId}${suffix}`, learnerId, attemptId, now);
  database
    .prepare(
      `INSERT INTO assessment_revision_items (learner_id, course_id, concept, label, source_attempt_id, source_kind, created_at, updated_at) VALUES (?, 'ages-10-12', 'c1', 'Use one h1', ?, 'module', ?, ?)`,
    )
    .run(learnerId, attemptId, now, now);
  return attemptId;
}

function seedOwnedRows(database, learnerId, suffix = "") {
  seedV1Rows(database, learnerId, suffix);
  return seedAssessmentRows(database, learnerId, suffix);
}

step("deleting the learner removes every learner-owned row and leaves no orphan", () => {
  const database = open("cascade");
  try {
    apply(database, allTags);
    seedLearner(database, "learner-cascade");
    seedOwnedRows(database, "learner-cascade");
    for (const table of learnerOwnedTables) {
      const before = database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id = ?`).get("learner-cascade").total;
      assert.ok(before > 0, `${table} should hold a row before the delete: ${before}`);
    }
    database.prepare("DELETE FROM learner_profiles WHERE id = ?").run("learner-cascade");
    for (const table of learnerOwnedTables) {
      const after = database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id = ?`).get("learner-cascade").total;
      assert.equal(after, 0, `${table} keeps ${after} rows for a deleted learner.`);
    }
    /* An orphan scan says more than a scoped count: it catches a row that survived under
     * a different learner_id. */
    for (const table of learnerOwnedTables) {
      const orphans = database
        .prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE learner_id NOT IN (SELECT id FROM learner_profiles)`)
        .get().total;
      assert.equal(orphans, 0, `${table} holds ${orphans} rows for a learner that no longer exists.`);
    }
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM learner_profiles").get().total, 0, "the profile itself must be gone.");
  } finally {
    database.close();
  }
});

step("deleting one attempt removes its marks, signals, defence and credential", () => {
  const database = open("attempt-cascade");
  try {
    apply(database, allTags);
    seedLearner(database, "learner-attempt");
    const attemptId = seedOwnedRows(database, "learner-attempt");
    seedLearner(database, "learner-kept");
    const keptAttempt = seedOwnedRows(database, "learner-kept", "-kept");
    database.prepare("DELETE FROM assessment_attempts WHERE id = ?").run(attemptId);
    for (const table of ["assessment_item_results", "assessment_defence", "assessment_signals", "assessment_credentials"]) {
      const gone = database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE attempt_id = ?`).get(attemptId).total;
      assert.equal(gone, 0, `${table} keeps a row for a deleted attempt.`);
      const kept = database.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE attempt_id = ?`).get(keptAttempt).total;
      assert.equal(kept, 1, `${table} lost a row belonging to another attempt.`);
    }
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM learner_profiles").get().total, 2, "deleting an attempt must not touch the learners.");
  } finally {
    database.close();
  }
});

/* ------------------------------------------------- uniqueness is enforced ----- */

step("the constraints the concurrency rules rely on are enforced by the database", () => {
  const database = open("unique");
  try {
    apply(database, allTags);
    seedLearner(database, "learner-unique");
    const attemptId = `attempt-learner-unique`;

    /* One credential per learner and course, whatever the request order. */
    database
      .prepare(
        `INSERT INTO assessment_attempts (id, learner_id, course_id, kind, form_id, content_version, started_at) VALUES (?, 'learner-unique', 'ages-10-12', 'module', 'f', 'v', ?)`,
      )
      .run(attemptId, now);
    const credential = database.prepare(
      `INSERT INTO assessment_credentials (id, learner_id, course_id, level, certificate_name, skills_json, attempt_id, issued_at) VALUES (?, 'learner-unique', 'ages-10-12', 'Web Creator', 'KidyCode Applied Web Skills Certificate', '[]', ?, ?)`,
    );
    credential.run("cred-1", attemptId, now);
    assert.throws(() => credential.run("cred-2", attemptId, now), /UNIQUE|constraint/i, "a second credential for the same learner and course must be refused.");

    /* A duplicate insert of the credential is a no-op under the store's ON CONFLICT. */
    database
      .prepare(
        `INSERT INTO assessment_credentials (id, learner_id, course_id, level, certificate_name, skills_json, attempt_id, issued_at) VALUES (?, 'learner-unique', 'ages-10-12', 'Web Creator', 'KidyCode Applied Web Skills Certificate', '[]', ?, ?) ON CONFLICT (learner_id, course_id) DO NOTHING`,
      )
      .run("cred-3", attemptId, now);
    const credentials = database.prepare("SELECT COUNT(*) AS total FROM assessment_credentials").get().total;
    assert.equal(credentials, 1, `concurrent issuance must leave one credential, found ${credentials}.`);
    assert.equal(database.prepare("SELECT id FROM assessment_credentials").get().id, "cred-1", "the first credential must keep its id and issue date.");

    /* One result row per attempt, item and requirement. */
    const result = database.prepare(
      `INSERT INTO assessment_item_results (attempt_id, learner_id, item_id, requirement_id, form_id, content_version, item_type, status, created_at) VALUES (?, 'learner-unique', 'i1', 'r1', 'f', 'v', 'practical', 'met', ?)`,
    );
    result.run(attemptId, now);
    assert.throws(() => result.run(attemptId, now), /UNIQUE|constraint/i, "a repeated item result must be refused by the primary key.");

    /* One revision row per learner, course and concept. */
    const revision = database.prepare(
      `INSERT INTO assessment_revision_items (learner_id, course_id, concept, label, source_attempt_id, source_kind, created_at, updated_at) VALUES ('learner-unique', 'ages-10-12', 'c1', 'l', ?, 'module', ?, ?)`,
    );
    revision.run(attemptId, now, now);
    assert.throws(() => revision.run(attemptId, now, now), /UNIQUE|constraint/i, "a repeated revision row must be refused by the primary key.");

    /* One row per attempt for the single-row tables. */
    database.prepare("INSERT INTO assessment_signals (attempt_id, learner_id, created_at, updated_at) VALUES (?, 'learner-unique', ?, ?)").run(attemptId, now, now);
    assert.throws(
      () => database.prepare("INSERT INTO assessment_signals (attempt_id, learner_id, created_at, updated_at) VALUES (?, 'learner-unique', ?, ?)").run(attemptId, now, now),
      /UNIQUE|constraint/i,
      "one signals row per attempt must be enforced.",
    );
  } finally {
    database.close();
  }
});

step("the assessment indexes exist exactly as the schema declares them", () => {
  const database = open("indexes");
  try {
    apply(database, allTags);
    const wanted = [
      "assessment_attempts_learner_created_idx",
      "assessment_attempts_learner_form_idx",
      "assessment_attempts_learner_scope_idx",
      "assessment_item_results_learner_concept_idx",
      "assessment_defence_learner_idx",
      "assessment_signals_learner_idx",
      "assessment_credentials_learner_course_unique",
      "assessment_revision_items_learner_idx",
    ];
    const present = database.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((row) => row.name);
    for (const name of wanted) assert(present.includes(name), `the schema is missing the index ${name}.`);
    const unique = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND sql LIKE '%UNIQUE%'")
      .all()
      .map((row) => row.name);
    assert(unique.includes("assessment_credentials_learner_course_unique"), "the credential pair must be unique in the database, not only in code.");
  } finally {
    database.close();
  }
});

/* ----------------------------------------------- upgrading a real V1 store ----- */

step("a pre-Assessment-V2 database upgrades through 0007 with its V1 rows intact", () => {
  const database = open("upgrade");
  try {
    /* A representative store: the schema a learner was already using before Assessment V2
     * existed, with rows in every V1 table including a historical exam attempt. */
    apply(database, preV2Tags);
    const before = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name);
    assert(!before.includes("assessment_attempts"), "the pre-V2 store must not already hold the assessment tables.");

    database.prepare("INSERT INTO guardian_accounts (id, platform_user_id, email, created_at, last_sign_in_at) VALUES ('g1', 'platform-1', 'grown-up@example.test', ?, ?)").run(now, now);
    seedLearner(database, "learner-v1");
    seedV1Rows(database, "learner-v1", "-v1");
    database.prepare("INSERT INTO guardian_links (id, link_ref, guardian_id, learner_id, status, connected_at) VALUES ('gl1', 'ref-1', 'g1', 'learner-v1', 'active', ?)").run(now);
    database.prepare("INSERT INTO transfer_claim_limits (scope, attempts, window_at) VALUES ('source-1', 2, ?)").run(now);
    /* Rows seeded before the upgrade that belong only to V1 tables: these are the ones the
     * upgrade must not disturb. */
    const v1Tables = ["learner_profiles", "course_progress", "lesson_evidence", "project_checkpoints", "exam_attempts", "guardian_accounts", "guardian_links", "transfer_claim_limits"];
    const snapshot = {};
    for (const table of v1Tables) {
      snapshot[table] = database.prepare(`SELECT * FROM ${table}`).all();
    }
    const v1Attempt = database.prepare("SELECT * FROM exam_attempts WHERE learner_id = 'learner-v1'").get();
    assert.equal(v1Attempt.passed, 0, "the historical V1 attempt must be recorded as not passed.");

    /* The upgrade. */
    apply(database, ["0007_violet_praxagora"]);

    for (const table of v1Tables) {
      assert.deepEqual(database.prepare(`SELECT * FROM ${table}`).all(), snapshot[table], `${table} changed during the upgrade.`);
    }
    const after = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name);
    assert.equal(after.length, before.length + 6, "the upgrade must add exactly the six assessment tables.");

    /* The new tables arrive empty and queryable, and a V1 learner can be followed by the
     * old paths that read them. */
    for (const table of ["assessment_attempts", "assessment_item_results", "assessment_defence", "assessment_signals", "assessment_credentials", "assessment_revision_items"]) {
      assert.equal(database.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total, 0, `${table} must arrive empty.`);
    }
    /* A V1 completion record is not a credential: nothing is issued retroactively. */
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM assessment_credentials WHERE learner_id = 'learner-v1'").get().total, 0, "an old completion must never issue a credential.");

    /* The upgraded store still cascades for a learner created before the migration. */
    database.prepare("DELETE FROM learner_profiles WHERE id = 'learner-v1'").run();
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM exam_attempts").get().total, 0, "the V1 evidence must still be removed with the learner.");
    assert.equal(database.prepare("SELECT COUNT(*) AS total FROM guardian_links").get().total, 0, "the guardian link must still cascade.");
  } finally {
    database.close();
  }
});

/* --------------------------------------------------------------- tidying ------- */

try {
  rmSync(temporary, { recursive: true, force: true });
} catch {
  /* A locked temporary file on Windows is not a database finding. */
}

console.log(`\ndatabase audit: ${passed.length} checks passed, ${failed.length} failed`);
if (failed.length > 0) {
  for (const failure of failed) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
