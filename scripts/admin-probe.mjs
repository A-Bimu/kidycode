#!/usr/bin/env node
/* Local QA probe for the owner admin console.
 * Hits the running dev server on the given port and prints what each surface returns.
 * Run: node scripts/admin-probe.mjs [port]
 */

const port = process.argv[2] || "3002";
const reviewKey = process.argv[3] || process.env.KIDYCODE_ADMIN_REVIEW_KEY || "";
const base = `http://127.0.0.1:${port}`;
const DEMO = reviewKey ? { "x-kidycode-review-demo": reviewKey } : {};

async function get(path, headers = {}) {
  const response = await fetch(`${base}${path}`, { headers });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}

async function post(path, payload, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}

console.log("== session ==");
const anon = await get("/api/admin/session");
console.log("no header      :", anon.status, JSON.stringify(anon.body?.gate), anon.body?.authenticated);
const authed = await get("/api/admin/session", DEMO);
console.log("demo header    :", authed.status, authed.body?.permission, authed.body?.owner?.platformUserId);

console.log("\n== curriculum (demo session) ==");
const curriculum = await get("/api/admin/curriculum", DEMO);
const c = curriculum.body;
console.log("status         :", curriculum.status, "provenance:", c?.provenance);
console.log("totals         :", JSON.stringify(c?.totals));
console.log("quality        : lessonsWithFlags", c?.quality?.lessonsWithFlags, "of", c?.quality?.totalLessons, "| duplicate prompts", c?.quality?.duplicatePromptCount);
console.log("top flag codes :", (c?.quality?.flagCounts || []).slice(0, 8).map(entry => `${entry.code}(${entry.count})`).join(" "));
console.log("pathways       :", (c?.pathways || []).map(p => `${p.id}[${p.kind},${p.units.length}u]`).join(" "));
const locked = (c?.lessons || []).filter(item => item.pathwayId === "ages-16-18").slice(-1)[0];
console.log("sample lesson  :", locked?.key, "|", locked?.title, "| flags:", (locked?.flags || []).join(",") || "none");

console.log("\n== lesson detail (a late, gated lesson) ==");
const lesson = await get(`/api/admin/lesson?key=${encodeURIComponent(locked?.key || "")}`, DEMO);
const l = lesson.body;
console.log("status         :", lesson.status);
console.log("pathway        :", l?.location?.pathwayTitle, "| unit", l?.location?.unitTitle, "| position", (l?.location?.positionInPathway ?? 0) + 1, "of", l?.location?.totalInPathway);
console.log("content        : notes", l?.lesson?.notes?.length, "| hints", l?.lesson?.hints?.length, "| requirements", l?.lesson?.requirements?.length, "| questions", l?.lesson?.questions?.length);
console.log("answer key     :", (l?.lesson?.questions || []).map(q => `correct=${q.correctIndex} "${q.options[q.correctIndex]}"`).slice(0, 3).join(" | ") || "none");
console.log("neighbours     : prev", l?.neighbours?.previous?.key, "| next", l?.neighbours?.next?.key);
console.log("notice         :", l?.previewNotice);

console.log("\n== lesson detail with no key ==");
console.log("status         :", (await get("/api/admin/lesson", DEMO)).status);
console.log("unknown key    :", (await get("/api/admin/lesson?key=nope:9:nope", DEMO)).status);

console.log("\n== analytics ==");
const analytics = await get("/api/admin/analytics", DEMO);
const r = analytics.body?.report;
console.log("status         :", analytics.status);
for (const metric of r?.metrics || []) {
  console.log(`  ${metric.provenance.padEnd(11)} ${metric.label} = ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}  [${metric.source}]`);
}
console.log("by course      :", JSON.stringify(r?.byCourse));
console.log("by cohort      :", JSON.stringify(r?.byCohort));
console.log("struggling     :", JSON.stringify(r?.strugglingTopics));
console.log("not tracked    :", (r?.notTracked || []).map(n => n.id).join(", "));
console.log("anonymity floor:", r?.kAnonymityFloor);

console.log("\n== notifications ==");
const catalogue = await get("/api/admin/notifications", DEMO);
console.log("catalogue      :", catalogue.status, "templates:", (catalogue.body?.templates || []).join(","), "| live delivery:", catalogue.body?.liveDeliveryEnabled);
const plan = await post("/api/admin/notifications", {
  template: "guardian-report",
  audience: "guardian",
  recipientRef: "pathway-wide",
  variables: { name: "QA-FIXTURE", completedCount: "4", moduleTitle: "Style with CSS", nextSuggestion: "one short lesson", organisationName: "KidyCode" },
}, DEMO);
console.log("plan status    :", plan.status, "allowed:", plan.body?.permission?.allowed, "| deliverable:", plan.body?.plan?.deliverable, "| live:", plan.body?.plan?.liveDeliveryEnabled);
console.log("reasons        :", (plan.body?.plan?.reasons || []).join(" / "));
console.log("subject        :", plan.body?.preview?.subject);
console.log("body           :", plan.body?.preview?.body);
const learnerPlan = await post("/api/admin/notifications", { template: "unfinished-lesson", audience: "learner", recipientRef: "pathway-wide", variables: { name: "QA-FIXTURE" } }, DEMO);
console.log("learner audience allowed:", learnerPlan.body?.permission?.allowed, "|", learnerPlan.body?.permission?.reason);
console.log("bad template   :", (await post("/api/admin/notifications", { template: "nope", audience: "guardian" }, DEMO)).status);

console.log("\n== denial matrix on this deployment ==");
const forged = await get("/api/admin/curriculum", { "oai-authenticated-user-id": "owner-123", "oai-authenticated-user-email": "owner@example.com" });
console.log("unsigned platform header ->", forged.status);
const forgedSigned = await get("/api/admin/curriculum", { "oai-authenticated-user-id": "owner-123", "oai-authenticated-user-email": "owner@example.com", "x-kidycode-identity-signature": "deadbeef", "x-kidycode-identity-issued-at": new Date().toISOString() });
console.log("forged signature         ->", forgedSigned.status);
const learner = await get("/api/admin/curriculum", { cookie: "kidycode_session=learner-1.deadbeef" });
console.log("learner cookie           ->", learner.status);
const wrongDemo = await get("/api/admin/curriculum", { "x-kidycode-review-demo": "owner-123" });
console.log("wrong demo value         ->", wrongDemo.status);
const guardianHeader = await get("/api/admin/curriculum", { "oai-authenticated-user-id": "guardian-1", "oai-authenticated-user-email": "guardian@example.com" });
console.log("guardian header          ->", guardianHeader.status);
