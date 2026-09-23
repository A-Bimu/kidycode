#!/usr/bin/env node
/*
 * The certificate contract, asserted against the source.
 *
 * These are the rules that may not be quietly weakened later: one eligibility calculation,
 * the approved constants and level names, a request schema that decides nothing, issuing
 * gated on eligibility, an insert-once credential, an opaque credential id from secure
 * randomness, no new migration, permanent deletion, a guardian projection that leaks no
 * marks or identifiers, the banned claims and the print contract.
 *
 * Colours are decided from channel values, never from a hex pattern. The claim rule allows
 * a banned term only where it is denied ("this is not an accredited qualification"), and
 * every rule here has been shown to fail against a deliberately broken copy of the source.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  ASSESSMENT_PASS_MARK,
  ASSESSMENT_TOTAL_MARKS,
  CERTIFICATE_LEVELS,
  CERTIFICATE_NAME,
  CERTIFICATION_STATUS_LABELS,
  INDEPENDENT_BUILD_FLOOR,
  INDEPENDENT_BUILD_MARKS,
  credentialIdFrom,
} from "../lib/certification.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

let checks = 0;
const failing = [];
function rule(label, body) {
  checks += 1;
  try {
    body();
    console.log(`  ok   ${label}`);
  } catch (error) {
    failing.push(label);
    console.log(`  FAIL ${label}\n    ${String(error.message).split("\n")[0]}`);
    process.exitCode = 1;
  }
}

/* Every TypeScript source under a directory, so a rule can be asserted over a tree rather
 * than over a list somebody remembered to update. */
function tree(relative) {
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const child = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(resolve(dir, entry.name), child);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(`${relative}${child}`);
    }
  };
  walk(resolve(root, relative), "");
  return files;
}

function readArray(source, name) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  return match ? [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]) : [];
}

/* The files the certificate is made of: where a second copy of the pass mark, a second
 * eligibility calculation or a leak would actually matter. */
const SURFACE = [
  "lib/certification.ts",
  "lib/passport.ts",
  "lib/progress-view.ts",
  "lib/summary.ts",
  "lib/guardian-view.ts",
  "lib/assessment/store.ts",
  "app/api/certification/route.ts",
  "app/api/summary/route.ts",
  "app/api/guardian/summary/route.ts",
  "components/SkillsPassport.tsx",
];

const sourceFiles = [...tree("lib"), ...tree("app"), ...tree("components")];
const certSource = read("lib/certification.ts");
const routeSource = read("app/api/certification/route.ts");
const schemaSource = read("db/schema.ts");
const storeSource = read("lib/assessment/store.ts");
const guardSource = read("lib/guardian-view.ts");
/* The stylesheet the learner interface actually loads. The marketing styles.css is a different
 * file with a public twin, and it is not what the passport or the certificate render from. */
const appStyles = read("app/globals.css");

/* ---------------------------------------------------------- one calculation -- */

rule("deriveCertification is defined once and every surface reads that one calculation", () => {
  const defined = sourceFiles.filter((file) => /(?:export\s+)?function\s+deriveCertification\b|const\s+deriveCertification\b/.test(read(file)));
  assert.deepEqual(defined, ["lib/certification.ts"], `deriveCertification must be defined once, in lib/certification.ts (found: ${defined.join(", ") || "nowhere"}).`);
  assert(/import\s*\{[^}]*\bderiveCertification\b[^}]*\}\s*from\s*"@\/lib\/certification"/.test(read("lib/summary.ts")), "lib/summary.ts must import deriveCertification rather than recompute it.");
  assert(/^import[\s\S]*?from\s*"@\/lib\/certification"/m.test(routeSource), "the certificate route must read the one calculation from lib/certification.");
  assert(!/deriveCertification\s*\(/.test(routeSource), "the certificate route must not compute eligibility itself.");
  const recomputed = SURFACE.filter((file) => file !== "lib/certification.ts" && /[<>=!]==?\s*(70|30)\b/.test(read(file)));
  assert.deepEqual(recomputed, [], `the pass mark 70 and the build floor 30 must be compared only in lib/certification.ts (also compared in: ${recomputed.join(", ")}).`);
});

rule("the approved constants and the four level names are exactly right", () => {
  assert.equal(ASSESSMENT_PASS_MARK, 70, "the assessment pass mark must be 70.");
  assert.equal(ASSESSMENT_TOTAL_MARKS, 100, "the assessment must be marked out of 100.");
  assert.equal(INDEPENDENT_BUILD_FLOOR, 30, "the independent build floor must be 30.");
  assert.equal(INDEPENDENT_BUILD_MARKS, 50, "the independent build must carry 50.");
  assert.equal(CERTIFICATE_NAME, "KidyCode Applied Web Skills Certificate", "the certificate name must be exact.");
  assert.deepEqual(CERTIFICATE_LEVELS, {
    "ages-10-12": "Web Creator",
    "ages-13-15": "Web Builder",
    "ages-16-18": "Web Application Builder",
    adults: "Business Website Builder",
  }, "the four courses must map to the four approved level names.");
  assert.deepEqual(Object.keys(CERTIFICATION_STATUS_LABELS).sort(), ["certified", "in-progress", "ready"], "three statuses, no more.");
  const id = credentialIdFrom(new Uint8Array(16));
  assert(/^KC-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]+$/.test(id), `a credential id must be printable and prefixed (got ${id}).`);
});

/* ------------------------------------------------------- nothing from the page -- */

rule("the request schema accepts nothing that decides an outcome, and issuing is gated on eligibility", () => {
  const match = routeSource.match(/const bodySchema = z\.object\(\{([\s\S]*?)\}\)\.strict\(\)/);
  assert.ok(match, "the route must declare a request schema closed with .strict().");
  for (const field of ["level", "issuedAt", "credentialId", "score", "result", "defence", "mandatoryPassed", "eligible"]) {
    assert(new RegExp(`\\b${field}\\s*:\\s*z\\.undefined\\(\\)`).test(match[1]), `the schema must declare ${field} as z.undefined() so sending it is refused.`);
  }
  const gate = routeSource.indexOf("summary.certification.eligible");
  const issue = routeSource.indexOf("await issueCredential(");
  assert.ok(gate > -1, "the route must test summary.certification.eligible.");
  assert.ok(issue > -1, "the route must call issueCredential.");
  assert.ok(gate < issue, "issueCredential must be reached only after the eligibility gate.");
});

rule("a credential is issued once per learner and course, in the store and in the schema", () => {
  assert(storeSource.includes("ON CONFLICT (learner_id, course_id) DO NOTHING"), "issueCredential must be insert-once.");
  assert(/uniqueIndex\("assessment_credentials_learner_course_unique"\)\.on\(table\.learnerId,\s*table\.courseId\)/.test(schemaSource), "db/schema.ts must declare the unique pair over learnerId and courseId.");
});

rule("a credential id comes only from cryptographically secure randomness", () => {
  assert(/crypto\.getRandomValues\s*\(/.test(certSource), "lib/certification.ts must draw its bytes from crypto.getRandomValues.");
  const guessable = /(?:credentialId|certificateId|credential\.id)\s*[:=]\s*[^;\n]*(Math\.random|Date\.now|performance\.now|randomUUID|learner\.id|learnerId|course\.id|courseId|counter|\+\+|\.length\b)/;
  for (const file of sourceFiles) {
    const source = read(file);
    if (!/credentialId/.test(source)) continue;
    const line = source.split(/\r?\n/).find((entry) => guessable.test(entry));
    assert.ok(!line, `${file} forms a credential id from a guessable source: ${line && line.trim()}`);
  }
});

/* --------------------------------------------------------- no new migration -- */

rule("no new migration: 0007 is still the last one, and it only creates tables and indexes", () => {
  const migrations = readdirSync(resolve(root, "drizzle")).filter((name) => name.endsWith(".sql")).sort();
  assert.equal(migrations[migrations.length - 1], "0007_violet_praxagora.sql", `the last migration must still be 0007 (found ${migrations[migrations.length - 1]}).`);
  const owners = migrations.filter((name) => read(`drizzle/${name}`).includes("assessment_credentials"));
  assert.deepEqual(owners, ["0007_violet_praxagora.sql"], `assessment_credentials must appear in exactly one migration (found: ${owners.join(", ") || "none"}).`);
  const sql = read("drizzle/0007_violet_praxagora.sql").replace(/-->[^\n]*/g, " ");
  const statements = sql.split(";").map((entry) => entry.trim()).filter(Boolean);
  assert.ok(statements.length > 0, "0007 must contain statements.");
  for (const statement of statements) {
    assert(/^CREATE\s+(TABLE|UNIQUE\s+INDEX|INDEX)\b/i.test(statement), `0007 must contain only CREATE TABLE and CREATE INDEX statements, never a drop, alter, delete or update: ${statement.slice(0, 60)}`);
  }
});

rule("permanent deletion still removes the credentials", () => {
  const tables = readArray(read("app/api/learner/route.ts"), "LEARNER_OWNED_TABLES");
  assert.ok(tables.length > 5, "LEARNER_OWNED_TABLES must be read from the learner route.");
  assert(tables.includes("assessment_credentials"), "assessment_credentials must be in LEARNER_OWNED_TABLES.");
});

/* ------------------------------------------------------------ the guardian side -- */

rule("the guardian certificate is an allow list that leaks no marks or identifiers", () => {
  assert(readArray(guardSource, "GUARDIAN_SUMMARY_KEYS").includes("certificate"), "GUARDIAN_SUMMARY_KEYS must include certificate.");
  const forbidden = readArray(guardSource, "GUARDIAN_FORBIDDEN_KEYS");
  assert.ok(forbidden.length > 20, `GUARDIAN_FORBIDDEN_KEYS must be read from lib/guardian-view.ts (found ${forbidden.length}).`);
  const start = certSource.indexOf("export function toGuardianCertificate");
  assert.ok(start > -1, "toGuardianCertificate must exist in lib/certification.ts.");
  const projection = certSource.slice(start).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
  const keys = [...projection.matchAll(/^\s{4}([A-Za-z_$][\w$]*)\s*:/gm)].map((entry) => entry[1]);
  assert.ok(keys.length >= 6, `the guardian certificate must be a plain object of facts (found ${keys.length} keys).`);
  const leaked = keys.filter((key) => forbidden.includes(key));
  assert.deepEqual(leaked, [], `the guardian certificate must not carry any forbidden key (found: ${leaked.join(", ")}).`);
  assert.ok(!/\b(attemptId|credentialId|score|marks)\s*:/.test(projection), "the certificate projection must not name an attempt, a credential id, a score or marks.");
  for (const file of ["lib/guardian-view.ts", "app/api/guardian/summary/route.ts"]) {
    const offender = read(file).match(/\b(attemptId|credentialId|score|marks)\s*:/);
    assert.ok(!offender, `${file} exposes ${offender && offender[1]} to a guardian.`);
  }
});

/* ----------------------------------------------------------- claims and brand -- */

rule("no banned claim and no banned colour in the certificate sources", () => {
  const files = ["lib/certification.ts", "lib/passport.ts", "components/SkillsPassport.tsx", "app/api/certification/route.ts"];
  const claims = /(accredited|diploma|licence|license|professional developer|government)/gi;
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(claims)) {
      /* A disclaimer is the compliant wording: the term may appear where it is denied. */
      const before = source.slice(Math.max(0, match.index - 48), match.index);
      assert(/\b(not|never|nor|without|no)\b/i.test(before), `${file} must not claim "${match[0]}" (a disclaimer that it is not one is allowed).`);
    }
    assert(!source.includes("\u2014"), `${file} contains an em dash.`);
  }
  /* A colour whose green channel dominates both others by more than 30 is a green,
   * whatever hex it was written as. */
  for (const file of [...files, "styles.css"]) {
    for (const match of read(file).matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      const digits = match[1].toLowerCase();
      const full = digits.length === 3 ? digits.split("").map((digit) => digit + digit).join("") : digits.slice(0, 6);
      if (full.length !== 6) continue;
      const [r, g, b] = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16));
      assert(!(g > r + 30 && g > b + 30), `${file} decides a colour by a green channel value: ${match[0]}.`);
    }
  }
});

/* --------------------------------------------------------------- the print rule -- */

rule("print shows the certificate sheet and nothing else, and it does not break across pages", () => {
  /* The file may hold more than one print block, so the one that governs the certificate is the
   * block whose body mentions the sheet, rather than whichever comes first. */
  const blocks = [];
  let cursor = appStyles.indexOf("@media print");
  while (cursor > -1) {
    const open = appStyles.indexOf("{", cursor);
    let depth = 0;
    let end = -1;
    for (let index = open; index < appStyles.length; index += 1) {
      if (appStyles[index] === "{") depth += 1;
      else if (appStyles[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    assert.ok(end > open, "the @media print block must be closed.");
    blocks.push(appStyles.slice(open, end));
    cursor = appStyles.indexOf("@media print", end);
  }
  const block = blocks.find((entry) => entry.includes(".certificate-sheet"));
  assert.ok(block, "app/globals.css must declare an @media print block for the certificate sheet.");
  assert(/body\s*\*[^{]*\{[^}]*visibility\s*:\s*hidden/.test(block), "print must hide everything else.");
  assert(/\.certificate-sheet[^{]*\{[^}]*visibility\s*:\s*visible/.test(block), "print must reveal the certificate sheet.");
  assert(/\.no-print[^{]*\{[^}]*display\s*:\s*none/.test(block), "print must hide .no-print.");
  assert(/\.certificate-sheet\s*\{[^}]*break-inside\s*:\s*avoid/.test(appStyles), "the certificate sheet must not break across pages.");
  assert(/@page\s*\{[^}]*size\s*:/.test(appStyles), "an @page rule must set the sheet size.");
});

console.log(`\ncertification contract: ${checks} rules, ${failing.length === 0 ? "no problems" : `${failing.length} failing`}`);