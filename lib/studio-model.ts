/* KidyCode Design Studio document format. No real learner information or passwords. */
export type StudioAge = "ages-10-12" | "ages-13-15" | "ages-16-18" | "adults";
export type StudioKind = "text" | "shape" | "button" | "image" | "input";
export type StudioProject = "logo" | "welcome" | "loading" | "login" | "portfolio";
export type StudioElement = {
  id: string;
  kind: StudioKind;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fill: string;
  fontSize: number;
  radius: number;
  asset?: string;
  targetScreenId?: string;
};
export type StudioScreen = {
  id: string;
  title: string;
  width: number;
  height: number;
  background: string;
  elements: StudioElement[];
};
export type StudioDocument = {
  version: 1;
  id: string;
  title: string;
  age: StudioAge;
  project: StudioProject;
  screens: StudioScreen[];
  notes: { brief: string; evidence: string; reflection: string };
  updatedAt: string;
};
export const STUDIO_STORAGE_KEY = "kidycode.practice-studio.v1";
export const STUDIO_MAX_DOCUMENTS = 16;
export const STUDIO_MAX_SCREENS = 8;
export const STUDIO_MAX_ELEMENTS = 80;
export const studioAges: Array<{ id: StudioAge; label: string }> = [
  { id: "ages-10-12", label: "Ages 10–12" },
  { id: "ages-13-15", label: "Ages 13–15" },
  { id: "ages-16-18", label: "Ages 16–18" },
  { id: "adults", label: "Adults" },
];
export const studioProjects: Array<{ id: StudioProject; label: string; goal: string; tip: string }> = [
  { id: "logo", label: "My first logo", goal: "Choose a symbol, give your app a name and arrange them together.", tip: "A logo should be simple enough for someone to recognise quickly." },
  { id: "welcome", label: "Welcome screen", goal: "Add a logo, a welcome message and one clear button.", tip: "Make the app name larger than your welcome message so people notice it first." },
  { id: "loading", label: "Loading screen", goal: "Make a screen that tells visitors something is loading.", tip: "A loading message helps people know that the app has not frozen." },
  { id: "login", label: "Login mockup", goal: "Design a pretend login screen with text fields and a clear action.", tip: "This is a picture of a login screen, not a real password collector. Use pretend information only." },
  { id: "portfolio", label: "Personal portfolio", goal: "Introduce yourself, show a sample project and add a contact action.", tip: "Make your most important project easy to find. Do not enter private contact details in a shared device draft." },
];
export const studioPalette = ["#5D3AA4", "#B69AEF", "#E6D9FF", "#171B3D", "#FDF9F3", "#F1B565", "#CE759E", "#FFFFFF"];
export const studioAssets = [
  { id: "spark", label: "Sparkle", src: "/studio-assets/spark.svg", category: "Symbols" },
  { id: "planet", label: "Planet", src: "/studio-assets/planet.svg", category: "Adventure" },
  { id: "flower", label: "Flower", src: "/studio-assets/flower.svg", category: "Nature" },
  { id: "books", label: "Books", src: "/studio-assets/books.svg", category: "Learning" },
  { id: "rocket", label: "Rocket", src: "/studio-assets/rocket.svg", category: "Adventure" },
  { id: "cloud", label: "Cloud", src: "/studio-assets/cloud.svg", category: "Nature" },
  { id: "music", label: "Music", src: "/studio-assets/music.svg", category: "Creative" },
  { id: "heart", label: "Heart", src: "/studio-assets/heart.svg", category: "Symbols" },
] as const;

const uid = () => crypto.randomUUID();
export const makeElement = (kind: StudioKind, overrides: Partial<StudioElement> = {}): StudioElement => ({
  id: uid(), kind, x: 50, y: 80, width: 220, height: 52,
  text: kind === "text" ? "My app" : kind === "button" ? "Get started" : kind === "input" ? "Email address" : "",
  color: kind === "button" ? "#FFFFFF" : "#171B3D",
  fill: kind === "button" ? "#5D3AA4" : kind === "shape" ? "#E6D9FF" : "#FFFFFF",
  fontSize: kind === "text" ? 30 : 17, radius: 12, ...overrides,
});
const makeScreen = (title: string, elements: StudioElement[], width = 360, height = 640): StudioScreen => ({
  id: uid(), title, width, height, background: "#FDF9F3", elements,
});

export function createStudioDocument(project: StudioProject = "welcome", age: StudioAge = "ages-10-12"): StudioDocument {
  const title = studioProjects.find(item => item.id === project)?.label ?? "New project";
  let elements: StudioElement[];
  if (project === "logo") {
    elements = [
      makeElement("image", { x: 116, y: 170, width: 128, height: 128, asset: "spark" }),
      makeElement("text", { x: 42, y: 332, width: 276, text: "Star Club", fontSize: 38 }),
    ];
  } else if (project === "loading") {
    elements = [
      makeElement("image", { x: 126, y: 178, width: 108, height: 108, asset: "planet" }),
      makeElement("text", { x: 54, y: 330, width: 252, text: "Getting ready...", fontSize: 25 }),
      makeElement("shape", { x: 96, y: 393, width: 168, height: 13, fill: "#B69AEF", radius: 16 }),
    ];
  } else if (project === "login") {
    elements = [
      makeElement("image", { x: 143, y: 85, width: 74, height: 74, asset: "spark" }),
      makeElement("text", { x: 34, y: 191, width: 292, text: "Welcome back", fontSize: 31 }),
      makeElement("input", { x: 37, y: 289, width: 286, height: 53, text: "Email address" }),
      makeElement("input", { x: 37, y: 360, width: 286, height: 53, text: "Password (pretend)" }),
      makeElement("button", { x: 37, y: 447, width: 286, text: "Log in" }),
    ];
  } else if (project === "portfolio") {
    elements = [
      makeElement("text", { x: 30, y: 45, width: 300, text: "Hello, I'm Alex", fontSize: 35 }),
      makeElement("text", { x: 30, y: 120, width: 300, height: 90, text: "I design and build things that help people.", fontSize: 20 }),
      makeElement("image", { x: 108, y: 253, width: 144, height: 144, asset: "flower" }),
      makeElement("text", { x: 30, y: 440, width: 300, text: "Featured project", fontSize: 25 }),
      makeElement("button", { x: 30, y: 508, width: 300, text: "View my work" }),
    ];
  } else {
    elements = [
      makeElement("image", { x: 129, y: 158, width: 102, height: 102, asset: "spark" }),
      makeElement("text", { x: 40, y: 302, width: 280, text: "Star Club", fontSize: 39 }),
      makeElement("text", { x: 44, y: 358, width: 272, text: "Welcome to my app!", fontSize: 19 }),
      makeElement("button", { x: 55, y: 448, width: 250, text: "Get started" }),
    ];
  }
  const screen = makeScreen(project === "portfolio" ? "Home" : "Screen 1", elements, project === "portfolio" ? 960 : 360, project === "portfolio" ? 640 : 640);
  if (project === "portfolio") {
    // Match the element placement to the larger canvas.
    screen.elements = [
      makeElement("text", { x: 68, y: 80, width: 790, height: 82, text: "Hello, I'm Alex", fontSize: 57 }),
      makeElement("text", { x: 68, y: 188, width: 570, height: 86, text: "I design and build things that help people.", fontSize: 27 }),
      makeElement("image", { x: 710, y: 150, width: 170, height: 170, asset: "flower" }),
      makeElement("text", { x: 68, y: 402, width: 600, text: "Featured project", fontSize: 35 }),
      makeElement("button", { x: 68, y: 510, width: 275, height: 64, text: "View my work" }),
    ];
  }
  return {
    version: 1, id: uid(), title, age, project, screens: [screen],
    notes: { brief: "", evidence: "", reflection: "" }, updatedAt: new Date().toISOString(),
  };
}
export function blankStudioScreen(index: number, width = 360, height = 640): StudioScreen {
  return makeScreen("Screen " + index, [], width, height);
}
/* Imported drafts are untrusted browser data: enforce bounded fields and dimensions. */
export function validStudioDocument(value: unknown): value is StudioDocument {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<StudioDocument>;
  if (d.version !== 1 || typeof d.id !== "string" || d.id.length > 100 ||
    typeof d.title !== "string" || d.title.length > 100 ||
    !studioAges.some(a => a.id === d.age) || !studioProjects.some(p => p.id === d.project) ||
    !Array.isArray(d.screens) || d.screens.length < 1 || d.screens.length > STUDIO_MAX_SCREENS ||
    !d.notes || typeof d.notes.brief !== "string" || typeof d.notes.evidence !== "string" ||
    typeof d.notes.reflection !== "string" ||
    [d.notes.brief, d.notes.evidence, d.notes.reflection].some(t => t.length > 5000)) return false;
  return d.screens.every(s => s && typeof s.id === "string" && typeof s.title === "string" &&
    s.title.length <= 100 && [s.width, s.height].every(n => Number.isFinite(n) && n >= 240 && n <= 1200) &&
    typeof s.background === "string" && /^#[0-9a-fA-F]{6}$/.test(s.background) &&
    Array.isArray(s.elements) && s.elements.length <= STUDIO_MAX_ELEMENTS &&
    s.elements.every(e => e && typeof e.id === "string" && e.id.length <= 100 &&
      ["text", "shape", "button", "image", "input"].includes(e.kind) &&
      typeof e.text === "string" && e.text.length <= 300 &&
      /^#[0-9a-fA-F]{6}$/.test(e.fill) && /^#[0-9a-fA-F]{6}$/.test(e.color) &&
      [e.x, e.y, e.width, e.height, e.fontSize, e.radius].every(n => Number.isFinite(n) && n >= 0 && n <= 1200) &&
      (!e.asset || studioAssets.some(a => a.id === e.asset)) &&
      (!e.targetScreenId || typeof e.targetScreenId === "string")));
}
