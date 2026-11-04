import assert from "node:assert/strict";
import {
  createStudioDocument, makeElement, blankStudioScreen, validStudioDocument,
  studioProjects, studioAges, STUDIO_MAX_ELEMENTS, STUDIO_MAX_SCREENS,
} from "../../lib/studio-model.ts";

for (const age of studioAges) {
  for (const p of studioProjects) {
    const doc = createStudioDocument(p.id, age.id);
    assert.equal(doc.age, age.id);
    assert.equal(doc.project, p.id);
    const expected = p.id === "portfolio" && age.id === "adults" ? 4
      : p.id === "login" && age.id === "ages-16-18" ? 4
      : p.id === "login" && age.id === "ages-13-15" ? 3 : 1;
    assert.equal(doc.screens.length, expected, "Age-specific project complexity");
    assert(validStudioDocument(doc), "Starter template should be valid: " + age.id + " " + p.id);
    for (const screen of doc.screens) {
      assert(screen.elements.length > 1, "Starter project must be editable");
      for (const node of screen.elements) {
        assert(node.x >= 0 && node.y >= 0, "A template item must start on canvas");
        assert(node.x + node.width <= screen.width, "A template item must fit canvas width");
        assert(node.y + node.height <= screen.height, "A template item must fit canvas height");
        if (node.targetScreenId)
          assert(doc.screens.some(target => target.id === node.targetScreenId), "Prototype links must stay within the document");
      }
    }
  }
}

const doc = createStudioDocument("welcome", "ages-10-12");
assert(validStudioDocument(structuredClone(doc)), "Export format should round-trip in JSON");
assert(!validStudioDocument({ ...doc, version: 999 }), "Unrecognized document version denied");
assert(!validStudioDocument({ ...doc, age: "unknown" }), "Unknown age denied");
assert(!validStudioDocument({ ...doc, notes: { ...doc.notes, brief: "x".repeat(6000) } }), "Oversized notes denied");
assert(!validStudioDocument({ ...doc, screens: [] }), "Document needs a screen");
assert(!validStudioDocument({ ...doc, screens: Array(STUDIO_MAX_SCREENS + 1).fill(doc.screens[0]) }), "Too many screens denied");
assert(!validStudioDocument({ ...doc, screens: [{ ...doc.screens[0], elements: Array(STUDIO_MAX_ELEMENTS + 1).fill(makeElement("text")) }] }), "Too many nodes denied");
assert(!validStudioDocument({ ...doc, screens: [{ ...doc.screens[0], background: "url(javascript:alert(1))" }] }), "Untrusted CSS denied");
assert(!validStudioDocument({ ...doc, screens: [{ ...doc.screens[0], elements: [makeElement("image", { asset: "https://untrusted.example/image" })] }] }), "Untrusted image URLs denied");
assert(!validStudioDocument({ ...doc, screens: [{ ...doc.screens[0], elements: [makeElement("text", { text: "x".repeat(500) })] }] }), "Oversized labels denied");
const second = blankStudioScreen(2);
assert.equal(second.title, "Screen 2");
assert(validStudioDocument({ ...doc, screens: [...doc.screens, second] }), "Two-screen project valid");
console.log("Studio model: 20 age/project starter templates and import limits passed.");
