import type { StudioDocument, StudioElement, StudioScreen } from "./studio-model";

export type StudioReview = { id: string; title: string; done: boolean; suggestion: string };
const hasVisual = (items: StudioElement[]) => items.some(e => e.kind === "image" || e.kind === "shape");
const finding = (id: string, title: string, done: boolean, suggestion: string): StudioReview => ({id, title, done, suggestion});

/** Constructive observable checks, never pixel-perfect grading of subjective designs. */
export function reviewStudioDocument(doc: StudioDocument): StudioReview[] {
  const nodes = doc.screens.flatMap(s => s.elements);
  const checks = [
    finding("title", "Give your design a clear title",
      nodes.some(e => e.kind === "text" && e.text.trim().length >= 3),
      "Add a short app name or heading that explains what this is."),
  ];
  if (["logo", "welcome", "loading"].includes(doc.project))
    checks.push(finding("visual", "Show a symbol or shape", hasVisual(nodes),
      "Try one meaningful picture or shape. Any suitable symbol is welcome."));
  if (["welcome", "login", "portfolio"].includes(doc.project))
    checks.push(finding("action", "Offer a clear next action",
      nodes.some(e => e.kind === "button" && e.text.trim().length >= 2),
      "Add a button that tells visitors what happens when they click."));
  if (doc.project === "login")
    checks.push(finding("fields", "Use two pretend login fields",
      nodes.filter(e => e.kind === "input").length >= 2,
      "Show example email and password fields. Never enter a real password."));
  if (doc.project === "loading")
    checks.push(finding("loading", "Explain that the page is loading",
      nodes.some(e => e.kind === "text" && /loading|getting|wait|prepar|ready/i.test(e.text)),
      "Try a friendly message such as Getting ready…"));
  if (doc.project === "portfolio")
    checks.push(finding("work", "Showcase a piece of work",
      nodes.some(e => e.kind === "text" && /work|project|portfolio|case study/i.test(e.text)),
      "Add a sample project that visitors can find easily."));
  if (doc.screens.length > 1)
    checks.push(finding("flow", "Link your screens in the prototype",
      doc.screens.some(s => s.elements.some(e => e.kind === "button" &&
        doc.screens.some(target => target.id === e.targetScreenId))),
      "Select a button and choose which screen it should open."));
  checks.push(finding("brief", "Explain who the design helps",
    doc.notes.brief.trim().length >= 15,
    "Write one sentence about the person and the task they want to complete."));
  checks.push(finding("reflection", "Describe an improvement",
    doc.notes.reflection.trim().length >= 10,
    "Preview your work, then describe one thing you would improve."));
  return checks;
}
function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function svgGlyph(asset: string | undefined, x: number, y: number, w: number, h: number): string {
  const transform = 'translate(' + x + ' ' + y + ') scale(' + w / 120 + ' ' + h / 120 + ')';
  const start = '<g transform="' + transform + '">';
  if (asset === "spark") return start + '<rect x="3" y="3" width="114" height="114" rx="26" fill="#6642A2"/><path d="M60 19c7 23 14 30 41 41-27 11-34 18-41 41-7-23-14-30-41-41 27-11 34-18 41-41Z" fill="#FFF9F2"/></g>';
  if (asset === "planet") return start + '<circle cx="63" cy="58" r="34" fill="#6E4EB8"/><ellipse cx="60" cy="63" rx="57" ry="15" transform="rotate(-18 60 63)" fill="none" stroke="#C68CD8" stroke-width="9"/></g>';
  if (asset === "flower") return start + '<g fill="#A77CD6"><ellipse cx="60" cy="33" rx="17" ry="30"/><ellipse cx="60" cy="87" rx="17" ry="30"/><ellipse cx="33" cy="60" rx="30" ry="17"/><ellipse cx="87" cy="60" rx="30" ry="17"/></g><circle cx="60" cy="60" r="16" fill="#FFC56F"/></g>';
  if (asset === "books") return start + '<rect x="16" y="72" width="88" height="21" rx="5" fill="#DCA8CE"/><rect x="22" y="48" width="83" height="20" rx="5" fill="#533587"/><rect x="12" y="24" width="86" height="20" rx="5" fill="#A387DE"/></g>';
  if (asset === "rocket") return start + '<path d="M30 82C30 47 55 18 89 12c4 33-19 69-53 82Z" fill="#7047B3"/><circle cx="64" cy="48" r="13" fill="#FFF7EF"/></g>';
  if (asset === "cloud") return start + '<path d="M26 86a23 23 0 0 1-3-45 36 36 0 0 1 69 9 19 19 0 0 1-3 36Z" fill="#A888DC"/><circle cx="47" cy="64" r="5" fill="#FFF"/><circle cx="73" cy="64" r="5" fill="#FFF"/></g>';
  if (asset === "music") return start + '<path d="M65 20v61m0-61 34-7v59" fill="none" stroke="#7755AF" stroke-width="11"/><ellipse cx="50" cy="88" rx="17" ry="12" fill="#7755AF"/><ellipse cx="83" cy="79" rx="17" ry="12" fill="#7755AF"/></g>';
  if (asset === "heart") return start + '<path d="M60 103 16 61C-1 40 18 16 40 23c9 3 15 9 20 18 6-9 11-15 21-18 22-7 41 17 24 38Z" fill="#B36C9F"/></g>';
  return start + '<circle cx="60" cy="60" r="45" fill="#BCA3E7"/></g>';
}
function wrapText(text: string, size: number, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const maxChars = Math.max(3, Math.floor(width / Math.max(1, size * .56)));
  const lines: string[] = []; let line = "";
  for (const word of words) {
    if (!line) { line = word; continue; }
    if ((line + " " + word).length <= maxChars) line += " " + word;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.slice(0, 12);
}
/** Portable and self-contained SVG; source text is escaped and image vectors embedded. */
export function studioScreenSvg(screen: StudioScreen): string {
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + screen.width + ' ' + screen.height +
    '" width="' + screen.width + '" height="' + screen.height + '" role="img" aria-label="' + escapeXml(screen.title) + '">',
    '<rect width="100%" height="100%" fill="' + screen.background + '"/>'];
  for (const el of screen.elements) {
    const { x, y, width: w, height: h } = el;
    if (el.kind === "image") { parts.push(svgGlyph(el.asset, x, y, w, h)); continue; }
    if (["shape", "button", "input"].includes(el.kind)) {
      parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
        '" rx="' + Math.min(el.radius, w / 2, h / 2) + '" fill="' +
        (el.kind === "input" ? "#FFFFFF" : el.fill) + '"' +
        (el.kind === "input" ? ' stroke="#B7A6CB"' : "") + '/>');
    }
    if (el.kind !== "shape") {
      const lines = wrapText(el.text, el.fontSize, Math.max(8, w - 12));
      const lineHeight = el.fontSize * 1.25;
      const top = el.kind === "text" ? y + el.fontSize : y + (h - (lines.length - 1) * lineHeight) / 2 + el.fontSize * .35;
      const tx = el.kind === "input" ? x + 15 : x + w / 2;
      parts.push('<text font-family="Arial, sans-serif" font-size="' + el.fontSize + '" font-weight="' +
        (el.kind === "input" ? 400 : 700) + '" text-anchor="' + (el.kind === "input" ? "start" : "middle") +
        '" fill="' + el.color + '">');
      lines.forEach((line, idx) => parts.push('<tspan x="' + tx + '" y="' + (top + idx * lineHeight) + '">' + escapeXml(line) + '</tspan>'));
      parts.push('</text>');
    }
  }
  parts.push("</svg>");
  return parts.join("");
}
