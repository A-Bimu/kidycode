function srgbToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }

const P = {
  "10-12": { canvas: "#FFFFFF", surface: "#EFF6FF", surface2: "#F5F3FF", ink: "#131A2E", inkSoft: "#4A5578",
    brand: "#2563EB", brandDeep: "#1B49B8", orange: "#FF7A1A", orangeInk: "#B3490A", pink: "#FF4D8D", pinkInk: "#C21F5E",
    violet: "#7C5CFF", violetInk: "#5A36D6", gold: "#FFB020", goldInk: "#8A5A00", line: "#DCE6F7" },
  "13-15": { canvas: "#FFFFFF", surface: "#F4F2FF", surface2: "#EEF3FF", ink: "#14122B", inkSoft: "#4C4A6E",
    brand: "#5B45F0", brandDeep: "#3F2CC4", azure: "#00A3FF", azureInk: "#0B6FA8", rose: "#FF4D6D", roseInk: "#C41F42",
    amber: "#FFB020", amberInk: "#8A5A00", line: "#E2DFF7" },
  "16-18": { canvas: "#0A0F1E", surface: "#111A31", surface2: "#18233F", ink: "#E9EEFB", inkSoft: "#9AA8C7",
    blue: "#5B8DFF", violet: "#A66BFF", gold: "#FFC24B", pink: "#FF6B9A", line: "#26314F" },
  adults: { canvas: "#FFFFFF", surface: "#F4F7FB", surface2: "#EEF3F9", ink: "#0E1726", inkSoft: "#46566E",
    brand: "#1B4FBF", brandDeep: "#153F9B", sky: "#0EA5E9", skyInk: "#0369A1", line: "#D8E2EE" },
  adminGold: { navy: "#0F2D52", navyDeep: "#0B1B33", white: "#FFFFFF", canvas: "#F7F9FC", blue: "#1E5AA8",
    gold: "#D4A63A", gold500: "#C9902A", goldLight: "#F6D06B", goldInk: "#805A0C" },
};

const checks = [
  // --- Ages 10-12: text pairs must clear 4.5:1; bright accents are FILLS with dark ink on top.
  ["10-12", "ink", "canvas", 4.5, "body text"], ["10-12", "ink", "surface", 4.5, "body text on icy blue"],
  ["10-12", "ink", "surface2", 4.5, "body text on pale lilac"], ["10-12", "inkSoft", "canvas", 4.5, "secondary text"],
  ["10-12", "canvas", "brand", 4.5, "label on primary button"], ["10-12", "brand", "canvas", 4.5, "link text"],
  ["10-12", "brandDeep", "surface", 4.5, "link text on surface"], ["10-12", "orangeInk", "canvas", 4.5, "accent text"],
  ["10-12", "pinkInk", "canvas", 4.5, "accent text"], ["10-12", "violetInk", "canvas", 4.5, "accent text"],
  ["10-12", "goldInk", "canvas", 4.5, "accent text / focus ring"],
  ["10-12", "ink", "orange", 4.5, "text on orange fill"], ["10-12", "ink", "pink", 4.5, "text on pink fill"],
  ["10-12", "ink", "gold", 4.5, "text on star-gold fill"], ["10-12", "ink", "surface", 4.5, "text on card"],
  ["10-12", "orangeInk", "canvas", 3, "orange as a graphic"],
  // --- Ages 13-15
  ["13-15", "ink", "canvas", 4.5, "body text"], ["13-15", "ink", "surface", 4.5, "body text on pale violet"],
  ["13-15", "ink", "surface2", 4.5, "body text on pale blue"], ["13-15", "inkSoft", "canvas", 4.5, "secondary text"],
  ["13-15", "canvas", "brand", 4.5, "label on primary button"], ["13-15", "brand", "canvas", 4.5, "link text"],
  ["13-15", "brandDeep", "surface", 4.5, "link text on surface"], ["13-15", "azureInk", "canvas", 4.5, "accent text"],
  ["13-15", "roseInk", "canvas", 4.5, "accent text"], ["13-15", "amberInk", "canvas", 4.5, "accent text"],
  ["13-15", "ink", "azure", 4.5, "text on azure fill"], ["13-15", "ink", "amber", 4.5, "text on amber fill"],
  ["13-15", "azureInk", "canvas", 3, "azure as a graphic"],
  // --- Ages 16-18 (dark studio)
  ["16-18", "ink", "canvas", 4.5, "body text on midnight"], ["16-18", "ink", "surface", 4.5, "body text on panel"],
  ["16-18", "ink", "surface2", 4.5, "body text on raised panel"], ["16-18", "inkSoft", "canvas", 4.5, "muted text"],
  ["16-18", "inkSoft", "surface", 4.5, "muted text on panel"], ["16-18", "canvas", "blue", 4.5, "label on blue button"],
  ["16-18", "blue", "canvas", 4.5, "link text"], ["16-18", "violet", "canvas", 4.5, "link text"],
  ["16-18", "gold", "canvas", 4.5, "accent text"], ["16-18", "pink", "canvas", 4.5, "accent text"],
  // --- Adults
  ["adults", "ink", "canvas", 4.5, "body text"], ["adults", "ink", "surface", 4.5, "body text on cool grey"],
  ["adults", "ink", "surface2", 4.5, "body text on cool blue"], ["adults", "inkSoft", "canvas", 4.5, "secondary text"],
  ["adults", "canvas", "brand", 4.5, "label on primary button"], ["adults", "brand", "canvas", 4.5, "link text"],
  ["adults", "brandDeep", "surface", 4.5, "link text on surface"], ["adults", "skyInk", "canvas", 4.5, "accent text"],
  ["adults", "skyInk", "canvas", 3, "sky as a graphic"],
  // --- Admin: midnight navy + sky blue + white + luminous gold (separate system)
  ["adminGold", "gold", "navy", 4.5, "gold text on navy chrome"],
  ["adminGold", "navy", "gold", 4.5, "navy text on gold fill"],
  ["adminGold", "white", "navy", 4.5, "text on navy"],
  ["adminGold", "goldInk", "white", 4.5, "gold text on light surface"],
  ["adminGold", "blue", "white", 4.5, "link text"],
  ["adminGold", "goldLight", "navyDeep", 4.5, "gradient highlight on navy"],
  ["adminGold", "navyDeep", "goldLight", 4.5, "navy text on light gold"],
  ["adminGold", "goldInk", "canvas", 3, "gold graphic on cool light bg"],
];

let failures = 0;
for (const [g, a, b, min, use] of checks) {
  const r = ratio(P[g][a], P[g][b]);
  const ok = r >= min;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${g.padEnd(10)} ${a.padEnd(11)} on ${b.padEnd(9)} ${r.toFixed(2).padStart(6)}:1  min ${min}  ${use}`);
}
console.log(`\n${failures} failing pair(s) of ${checks.length}`);

