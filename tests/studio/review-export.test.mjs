import assert from "node:assert/strict";
import { createStudioDocument, makeElement, studioAssets } from "../../lib/studio-model.ts";
import { reviewStudioDocument, studioScreenSvg } from "../../lib/studio-review-export.ts";
for (const project of ["logo", "welcome", "loading", "login", "portfolio"]) {
  const doc = createStudioDocument(project, "ages-10-12");
  const review = reviewStudioDocument(doc);
  assert(review.length >= 3, "Each challenge should have useful feedback");
  assert(review.some(item => item.done), "Starter should include real examples");
  assert(review.some(item => !item.done && item.suggestion.length >= 10),
    "Starter should encourage learner reflection");
  const svg = studioScreenSvg(doc.screens[0]);
  assert.match(svg, /^<svg xmlns=/);
  assert(svg.includes('width="' + doc.screens[0].width + '"'));
  assert(!svg.includes("<script"), "Export should contain no scripts");
  assert(!svg.includes('<image href='), "Export should be self-contained");
}
const doc = createStudioDocument("welcome");
const xss = String.raw`" onclick="alert(1)</text><script>alert(1)</script><text>`;
doc.screens[0].title = xss;
doc.screens[0].elements.push(makeElement("text", { text: xss }));
const svg = studioScreenSvg(doc.screens[0]);
assert(!svg.includes("<script"), "Text content must be escaped");
assert(!svg.includes('</text><script>'), "SVG must not contain injected markup");
assert(svg.includes("&lt;script&gt;"), "Escaped text should be visible");
assert(svg.includes("&quot;"), "Attribute quotation marks should be escaped");
assert(studioAssets.length >= 8, "Provide at least eight bundled beginner assets");
doc.screens.push({ ...doc.screens[0], id: crypto.randomUUID(), title: "Next" });
let result = reviewStudioDocument(doc);
assert(result.some(item => item.id === "flow" && !item.done), "A second screen needs a clickable link");
doc.screens[0].elements.push(makeElement("button", { targetScreenId: doc.screens[1].id }));
result = reviewStudioDocument(doc);
assert(result.some(item => item.id === "flow" && item.done), "Linked screens should be recognized");
console.log("Practice Studio guide and self-contained export safety tests passed.");
