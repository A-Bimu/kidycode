"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  ChevronLeft, ChevronRight, CircleHelp, Copy, Download,
  FolderOpen, Image as ImageIcon, Layers, MousePointer2, Plus, Redo2,
  Save, Shapes, Smartphone, Sparkles, Trash2, Type, Undo2
} from "lucide-react";
import {
  blankStudioScreen, createStudioDocument, makeElement, STUDIO_MAX_DOCUMENTS,
  STUDIO_MAX_ELEMENTS, STUDIO_MAX_SCREENS, STUDIO_STORAGE_KEY, studioAges, studioAssets,
  studioPalette, studioProjects, validStudioDocument,
  type StudioDocument, type StudioElement, type StudioKind, type StudioProject,
  type StudioScreen, type StudioAge
} from "@/lib/studio-model";
import { reviewStudioDocument, studioScreenSvg } from "@/lib/studio-review-export";
import styles from "./DesignStudio.module.css";

type DragState = {
  id: string; screenId: string; originX: number; originY: number;
  startX: number; startY: number; scaleX: number; scaleY: number;
  before: StudioDocument; moved: boolean; mode: "move" | "resize";
  originWidth: number; originHeight: number;
};
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const screenOf = (doc: StudioDocument, id: string) => doc.screens.find(s => s.id === id) ?? doc.screens[0];
const updateScreen = (doc: StudioDocument, screenId: string, run: (screen: StudioScreen) => StudioScreen): StudioDocument => ({
  ...doc, screens: doc.screens.map(s => s.id === screenId ? run(s) : s),
});
const updateNode = (doc: StudioDocument, screenId: string, id: string, run: (node: StudioElement) => StudioElement): StudioDocument =>
  updateScreen(doc, screenId, s => ({ ...s, elements: s.elements.map(node => node.id === id ? run(node) : node) }));
const storageLabel = "Saved on this device only. Anyone using this browser can see these drafts; don't enter passwords, addresses or private information.";
const toolItems: Array<{ kind: StudioKind; label: string; icon: typeof Type }> = [
  { kind: "text", label: "Text", icon: Type }, { kind: "shape", label: "Shape", icon: Shapes },
  { kind: "button", label: "Button", icon: MousePointer2 }, { kind: "input", label: "Text field", icon: Layers },
];
const projectTips: Record<string, string> = {
  people: "Write who will use your design and what they need to do. Use the Project notes below.",
  structure: "Start with two simple screens and explain the journey between them.",
  interface: "Arrange text, buttons, images and spacing until your screen is clear.",
  test: "Preview your screens. Ask someone to try the flow, then write what they noticed.",
  system: "Try using one palette and one type style across your screens.",
  present: "Describe your design choice and what you would improve next.",
};

export function DesignStudio() {
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [activeId, setActiveId] = useState("");
  const [screenId, setScreenId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [history, setHistory] = useState<StudioDocument[]>([]);
  const [future, setFuture] = useState<StudioDocument[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [assetQuery, setAssetQuery] = useState("");
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notice, setNotice] = useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
    let saved: StudioDocument[] = [];
    try {
      const raw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) saved = parsed.filter(validStudioDocument).slice(0, STUDIO_MAX_DOCUMENTS);
      }
    } catch {
      // A corrupt draft or unavailable storage must never blank the editor.
      setStorageError("Existing drafts could not be read on this device. You can still design and export work.");
    }
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("project");
    const requestedAge = params.get("age");
    const project: StudioProject = studioProjects.some(p => p.id === requested) ? requested as StudioProject : "welcome";
    const age: StudioAge = studioAges.some(a => a.id === requestedAge) ? requestedAge as StudioAge : "ages-10-12";
    if (!saved.length) saved = [createStudioDocument(project, age)];
    const doc = requested ? saved.find(d => d.project === project && d.age === age) ?? saved[0] : saved[0];
    setDocuments(saved);
    setActiveId(doc.id);
    setScreenId(doc.screens[0].id);
    setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(documents));
      setStorageError("");
    } catch {
      setStorageError("This browser cannot save your draft right now. Export the design file before you leave.");
    }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [documents, loaded]);

  const doc = documents.find(d => d.id === activeId) ?? null;
  const screen = doc ? screenOf(doc, screenId) : null;
  const selected = screen?.elements.find(e => e.id === selectedId) ?? null;
  const beginner = doc?.age === "ages-10-12";
  const currentProject = studioProjects.find(p => p.id === doc?.project) ?? studioProjects[1];
  const moduleId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("module");
  const challengeTip = moduleId && projectTips[moduleId] ? projectTips[moduleId] : currentProject.tip;
  const review = doc ? reviewStudioDocument(doc) : [];
  const reviewCount = review.filter(item => item.done).length;
  const visibleAssets = studioAssets.filter(asset => (asset.label + " " + asset.category).toLowerCase().includes(assetQuery.toLowerCase().trim()));

  function commit(next: StudioDocument) {
    if (!doc) return;
    setHistory(prev => [...prev.slice(-39), doc]);
    setFuture([]);
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...next, updatedAt: new Date().toISOString() } : d));
  }
  function undo() {
    if (!doc || history.length === 0) return;
    const prior = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [...prev, doc]);
    setDocuments(prev => prev.map(d => d.id === doc.id ? prior : d));
    setSelectedId("");
  }
  function redo() {
    if (!doc || future.length === 0) return;
    const next = future[future.length - 1];
    setFuture(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, doc]);
    setDocuments(prev => prev.map(d => d.id === doc.id ? next : d));
    setSelectedId("");
  }
  function activate(next: StudioDocument) {
    setActiveId(next.id); setScreenId(next.screens[0].id); setSelectedId("");
    setPreview(false); setHistory([]); setFuture([]);
    setShowNotes(false); setShowReview(false); setPreviewHistory([]); setNotice("");
  }
  function addProject(project: StudioProject) {
    if (documents.length >= STUDIO_MAX_DOCUMENTS) {
      setNotice("You have reached the 16-project limit. Export a project before deleting an older draft.");
      return;
    }
    const added = createStudioDocument(project, doc?.age ?? "ages-10-12");
    setDocuments(prev => [added, ...prev]);
    activate(added);
  }
  function duplicateProject() {
    if (!doc || documents.length >= STUDIO_MAX_DOCUMENTS) return;
    const ids = new Map(doc.screens.map(s => [s.id, crypto.randomUUID()]));
    const copy: StudioDocument = {
      ...structuredClone(doc), id: crypto.randomUUID(), title: doc.title.slice(0, 93) + " (copy)",
      screens: doc.screens.map(s => ({
        ...s, id: ids.get(s.id)!, elements: s.elements.map(e => ({
          ...e, id: crypto.randomUUID(),
          targetScreenId: e.targetScreenId ? ids.get(e.targetScreenId) : undefined,
        })),
      })),
      updatedAt: new Date().toISOString(),
    };
    setDocuments(prev => [copy, ...prev]); activate(copy);
  }
  function deleteProject() {
    if (!doc || !window.confirm("Delete this device-local design? This cannot be undone. Export it first if you want to keep it.")) return;
    let remaining = documents.filter(d => d.id !== doc.id);
    if (!remaining.length) remaining = [createStudioDocument()];
    setDocuments(remaining); activate(remaining[0]);
  }
  function addElement(kind: StudioKind, extra: Partial<StudioElement> = {}) {
    if (!doc || !screen || screen.elements.length >= STUDIO_MAX_ELEMENTS) {
      setNotice("This screen has reached the 80-element limit."); return;
    }
    const element = makeElement(kind, {
      x: Math.round((screen.width - (kind === "image" ? 115 : 210)) / 2),
      y: Math.round(screen.height * .36), ...(kind === "image" ? { width: 115, height: 115, asset: "spark" } : {}),
      ...extra,
    });
    commit(updateScreen(doc, screen.id, s => ({ ...s, elements: [...s.elements, element] })));
    setSelectedId(element.id); setNotice("Added " + (kind === "image" ? "an image" : kind) + ". Drag it to move it.");
  }
  function editNode(patch: Partial<StudioElement>) {
    if (!doc || !screen || !selected) return;
    commit(updateNode(doc, screen.id, selected.id, n => ({ ...n, ...patch })));
  }
  function removeSelected() {
    if (!doc || !screen || !selected) return;
    commit(updateScreen(doc, screen.id, s => ({ ...s, elements: s.elements.filter(e => e.id !== selected.id) })));
    setSelectedId("");
  }
  function duplicateSelected() {
    if (!doc || !screen || !selected || screen.elements.length >= STUDIO_MAX_ELEMENTS) return;
    const copy = { ...selected, id: crypto.randomUUID(), x: clamp(selected.x + 18, 0, screen.width - selected.width), y: clamp(selected.y + 18, 0, screen.height - selected.height) };
    commit(updateScreen(doc, screen.id, s => ({ ...s, elements: [...s.elements, copy] })));
    setSelectedId(copy.id);
  }
  function addScreen() {
    if (!doc || !screen || doc.screens.length >= STUDIO_MAX_SCREENS) return;
    const next = blankStudioScreen(doc.screens.length + 1, screen.width, screen.height);
    commit({ ...doc, screens: [...doc.screens, next] });
    setScreenId(next.id); setSelectedId(""); setPreview(false);
  }
  function renameProject(value: string) {
    if (!doc) return;
    setDocuments(prev => prev.map(item => item.id === doc.id ? {
      ...item, title: value.slice(0, 100), updatedAt: new Date().toISOString(),
    } : item));
  }
  function renameScreen(value: string) {
    if (!doc || !screen) return;
    setDocuments(prev => prev.map(item => item.id === doc.id ?
      updateScreen(item, screen.id, current => ({...current, title: value.slice(0, 100)})) : item));
  }
  function removeScreen() {
    if (!doc || !screen || doc.screens.length <= 1) return;
    if (!window.confirm("Delete this screen and its contents? Other buttons pointing here will stop navigating.")) return;
    const next = doc.screens.filter(item => item.id !== screen.id);
    commit({
      ...doc,
      screens: next.map(item => ({...item, elements: item.elements.map(el =>
        el.targetScreenId === screen.id ? {...el, targetScreenId: undefined} : el)})),
    });
    setScreenId(next[0].id); setSelectedId(""); setPreviewHistory([]);
  }
  function duplicateScreen() {
    if (!doc || !screen || doc.screens.length >= STUDIO_MAX_SCREENS) return;
    const clone: StudioScreen = {
      ...structuredClone(screen), id: crypto.randomUUID(), title: (screen.title + " copy").slice(0, 100),
      elements: screen.elements.map(el => ({ ...el, id: crypto.randomUUID() })),
    };
    commit({ ...doc, screens: [...doc.screens, clone] });
    setScreenId(clone.id); setSelectedId(""); setPreviewHistory([]);
  }
  function resizeFrame(which: "phone" | "tablet" | "desktop") {
    if (!doc || !screen) return;
    const dimensions = { phone: [360, 640], tablet: [768, 700], desktop: [960, 640] };
    const [width, height] = dimensions[which];
    const mapped = screen.elements.map(e => {
      const targetWidth = Math.min(e.width * width / screen.width, width - 12);
      const targetHeight = Math.min(e.height * height / screen.height, height - 12);
      return {
        ...e, width: Math.round(targetWidth), height: Math.round(targetHeight),
        x: clamp(Math.round(e.x * width / screen.width), 0, width - targetWidth),
        y: clamp(Math.round(e.y * height / screen.height), 0, height - targetHeight),
      };
    });
    commit(updateScreen(doc, screen.id, current => ({ ...current, width, height, elements: mapped })));
    setSelectedId("");
  }
  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, element: StudioElement, mode: "move" | "resize" = "move") {
    if (preview || !doc || !screen || !canvas.current || event.button !== 0) return;
    const rect = canvas.current.getBoundingClientRect();
    drag.current = {
      id: element.id, screenId: screen.id, originX: element.x, originY: element.y,
      startX: event.clientX, startY: event.clientY,
      scaleX: screen.width / rect.width, scaleY: screen.height / rect.height,
      before: structuredClone(doc), moved: false, mode,
      originWidth: element.width, originHeight: element.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(element.id);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const move = drag.current;
    if (!move || !doc || !screen || move.screenId !== screen.id) return;
    const original = screen.elements.find(e => e.id === move.id);
    if (!original) return;
    const dx = (event.clientX - move.startX) * move.scaleX;
    const dy = (event.clientY - move.startY) * move.scaleY;
    const patch = move.mode === "resize" ? {
      width: clamp(Math.round((move.originWidth + dx) / 8) * 8, 28, screen.width - move.originX),
      height: clamp(Math.round((move.originHeight + dy) / 8) * 8, 20, screen.height - move.originY),
    } : {
      x: clamp(Math.round((move.originX + dx) / 8) * 8, 0, Math.max(0, screen.width - original.width)),
      y: clamp(Math.round((move.originY + dy) / 8) * 8, 0, Math.max(0, screen.height - original.height)),
    };
    if (Object.entries(patch).every(([key, value]) => original[key as keyof StudioElement] === value)) return;
    move.moved = true;
    setDocuments(prev => prev.map(d => d.id === move.before.id ?
      updateNode(d, move.screenId, move.id, e => ({ ...e, ...patch })) : d));
  }
  function onPointerUp() {
    const before = drag.current?.moved ? drag.current.before : null;
    drag.current = null;
    if (before) {
      setHistory(prev => [...prev.slice(-39), before]);
      setFuture([]);
    }
  }
  function keyboardResize(event: React.KeyboardEvent<HTMLButtonElement>, element: StudioElement) {
    if (!doc || !screen || preview) return;
    const resize = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] } as const;
    const delta = resize[event.key as keyof typeof resize];
    if (!delta) return;
    event.preventDefault();
    commit(updateNode(doc, screen.id, element.id, n => ({
      ...n, width: clamp(n.width + delta[0], 28, screen.width - n.x),
      height: clamp(n.height + delta[1], 20, screen.height - n.y),
    })));
  }
  function keyboardMove(event: React.KeyboardEvent<HTMLButtonElement>, element: StudioElement) {
    if (preview || !doc || !screen) return;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const delta = steps[event.key];
    if (!delta) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 4;
    commit(updateNode(doc, screen.id, element.id, n => ({
      ...n, x: clamp(n.x + delta[0] * step, 0, Math.max(0, screen.width - n.width)),
      y: clamp(n.y + delta[1] * step, 0, Math.max(0, screen.height - n.height)),
    })));
  }
  function editNote(field: keyof StudioDocument["notes"], text: string) {
    if (!doc) return;
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, notes: { ...d.notes, [field]: text.slice(0, 5000) }, updatedAt: new Date().toISOString() } : d));
  }
  function saveNow() {
    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(documents));
      setNotice("Saved on this device. You can return to this project later.");
      setStorageError("");
    } catch {
      setStorageError("Save failed on this browser. Export your project file to keep your work.");
    }
  }
  function exportProject() {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kidycode-" + doc.project + "-" + doc.id.slice(0, 8) + ".json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Editable project file exported.");
  }
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportSvg() {
    if (!doc || !screen) return;
    downloadBlob(new Blob([studioScreenSvg(screen)], { type: "image/svg+xml;charset=utf-8" }),
      "kidycode-" + doc.project + "-" + screen.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".svg");
    setNotice("Your screen is saved as a portable SVG image.");
  }
  async function exportPng() {
    if (!doc || !screen) return;
    try {
      const img = document.createElement("img");
      const blob = new Blob([studioScreenSvg(screen)], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve(); img.onerror = () => reject(new Error("Image loading failed"));
        img.src = url;
      });
      const raster = document.createElement("canvas");
      raster.width = screen.width * 2; raster.height = screen.height * 2;
      const context = raster.getContext("2d");
      if (!context) throw new Error("Canvas export is unavailable");
      context.scale(2, 2);
      context.drawImage(img, 0, 0, screen.width, screen.height);
      URL.revokeObjectURL(url);
      const png = await new Promise<Blob>((resolve, reject) =>
        raster.toBlob(result => result ? resolve(result) : reject(new Error("PNG export failed")), "image/png"));
      downloadBlob(png, "kidycode-" + doc.project + "-" + screen.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png");
      setNotice("Your screen is saved as a PNG image.");
    } catch {
      setNotice("PNG export is not available in this browser. Try Export SVG instead.");
    }
  }
  function importProject(file: File | undefined) {
    if (!file || file.size > 150000 || documents.length >= STUDIO_MAX_DOCUMENTS) {
      setNotice("Choose an exported KidyCode project under 150 KB, with room for a new project."); return;
    }
    void file.text().then(raw => {
      const parsed: unknown = JSON.parse(raw);
      if (!validStudioDocument(parsed)) throw new Error("Invalid project document");
      // New identity prevents collisions; imported screens retain their own target links.
      const imported = { ...parsed, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
      setDocuments(prev => [imported, ...prev]); activate(imported);
      setNotice("Editable project imported on this device.");
    }).catch(() => setNotice("That file is not a valid KidyCode project."));
  }

  if (!loaded || !doc || !screen) return <main className={styles.loading}>Opening your design space…</main>;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}><Link href="/">KidyCode</Link><span aria-hidden="true">/</span><strong>Practice Studio</strong></div>
        <div className={styles.headerActions}>
          <Link href="/design" className={styles.smallLink}>UI/UX lessons</Link>
          <Link href="/practice" className={styles.smallLink}>Code Lab</Link>
          <button type="button" onClick={() => setShowHelp(p => !p)} className={styles.headerButton}><CircleHelp size={17}/> Show me how</button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Your design projects">
          <p className={styles.eyebrow}>MY PROJECTS</p>
          <div className={styles.projectList}>
            {documents.map(item => <button type="button" key={item.id} aria-current={item.id === doc.id ? "page" : undefined}
              onClick={() => activate(item)} className={item.id === doc.id ? styles.activeProject : styles.projectButton}>
              <FolderOpen size={16} /> <span>{item.title}</span>
            </button>)}
          </div>
          <label htmlFor="project-title" className={styles.fieldLabel}>Project name</label>
          <input id="project-title" className={styles.input} value={doc.title}
            onChange={event => renameProject(event.target.value)} maxLength={100}/>
          <label htmlFor="new-project" className={styles.fieldLabel}>Start a project</label>
          <select id="new-project" value="" onChange={event => {if (event.target.value) addProject(event.target.value as StudioProject);}}
            className={styles.select}>
            <option value="">Choose a starter…</option>
            {studioProjects.map(p => <option value={p.id} key={p.id}>{p.label}</option>)}
          </select>
          <label htmlFor="age-group" className={styles.fieldLabel}>Learning pathway</label>
          <select id="age-group" className={styles.select} value={doc.age}
            onChange={event => commit({ ...doc, age: event.target.value as StudioAge })}>
            {studioAges.map(age => <option key={age.id} value={age.id}>{age.label}</option>)}
          </select>
          <div className={styles.sidebarDivider}/>
          <div className={styles.smallActions}>
            <button onClick={duplicateProject} type="button" disabled={documents.length >= STUDIO_MAX_DOCUMENTS}><Copy size={16}/> Duplicate</button>
            <button onClick={deleteProject} type="button"><Trash2 size={16}/> Delete</button>
          </div>
          <button className={styles.export} type="button" onClick={exportProject}><Download size={16}/> Export editable file</button>
          <label className={styles.importLabel}>Import a project <input type="file" accept=".json,application/json" onChange={e => { importProject(e.target.files?.[0]); e.target.value = ""; }} /></label>
          <p className={styles.localNote}>{storageLabel}</p>
        </aside>

        <section className={styles.main}>
          <div className={styles.challenge}>
            <div className={styles.challengeIcon}><Sparkles size={23}/></div>
            <div>
              <p className={styles.eyebrow}>TODAY&apos;S CHALLENGE</p>
              <h1>{currentProject.label}</h1>
              <p>{currentProject.goal}</p>
              <span className={styles.pathLabel}>{beginner ? "Beginner mode · one step at a time" : "Creative practice · your own approach"}</span>
            </div>
            <button className={styles.hintButton} type="button" onClick={() => setShowHint(p => !p)}>Give me a hint</button>
          </div>
          {showHelp && <div className={styles.help} role="region" aria-label="How to use the editor">
            <strong>Three simple steps:</strong> (1) Choose Text, Shape, Button or Image. (2) Click the item on your design and drag to move it. (3) Change its colour or words, then preview. Your work saves on this device automatically.
          </div>}
          {showHint && <div className={styles.help} role="status"><strong>Try this:</strong> {challengeTip}</div>}
          <div className={styles.workspace}>
            <aside className={styles.tools} aria-label="Add to your design">
              <h2>Add something</h2>
              <div className={styles.toolGrid}>
                {toolItems.filter(t => !beginner || t.kind !== "input" || doc.project === "login").map(tool =>
                  <button key={tool.kind} type="button" onClick={() => addElement(tool.kind)}
                    className={styles.toolButton}><tool.icon size={24}/><span>{tool.label}</span></button>)}
                <button className={styles.toolButton} type="button" onClick={() => addElement("image", { asset: "spark" })}>
                  <ImageIcon size={24}/><span>Image</span>
                </button>
              </div>
              <h3>Pick a picture</h3>
              <div className={styles.assetGrid}>
                {studioAssets.map(asset => <button type="button" key={asset.id} title={"Add " + asset.label}
                  onClick={() => addElement("image", { asset: asset.id, text: asset.label })}>
                  <Image src={asset.src} alt={asset.label} width={44} height={44} unoptimized/></button>)}
              </div>
              <p className={styles.toolsTip}>Tap to add an item, then drag it on your screen.</p>
            </aside>

            <div className={styles.canvasArea}>
              <div className={styles.canvasBar}>
                <strong>{screen.title}</strong>
                <div className={styles.canvasControls}>
                  <button type="button" title="Undo" aria-label="Undo" onClick={undo} disabled={!history.length}><Undo2 size={18}/></button>
                  <button type="button" title="Redo" aria-label="Redo" onClick={redo} disabled={!future.length}><Redo2 size={18}/></button>
                  <button type="button" title={preview ? "Back to edit" : "Preview design"} onClick={() => {setPreview(p => !p);setPreviewHistory([]);setSelectedId("");}}>
                    {preview ? "Edit" : "Preview"}</button>
                  <button type="button" className={styles.saveButton} onClick={saveNow}><Save size={16}/> Save my design</button>
                </div>
              </div>
              {!beginner && <div className={styles.screenControls} aria-label="Screens">
                {doc.screens.map(s => <button type="button" className={s.id === screen.id ? styles.screenActive : ""} key={s.id}
                  onClick={() => {setScreenId(s.id);setSelectedId("");setPreviewHistory([]);}}>{s.title}</button>)}
                <button type="button" onClick={addScreen} disabled={doc.screens.length >= STUDIO_MAX_SCREENS}><Plus size={15}/> Add screen</button>
                <button type="button" onClick={duplicateScreen} disabled={doc.screens.length >= STUDIO_MAX_SCREENS}><Copy size={15}/> Duplicate screen</button>
                <button type="button" onClick={removeScreen} disabled={doc.screens.length <= 1}><Trash2 size={15}/> Delete screen</button>
                <label className={styles.inlineField} htmlFor="studio-frame"><Smartphone size={15}/> Frame
                  <select id="studio-frame" value={screen.width <= 400 ? "phone" : screen.width <= 800 ? "tablet" : "desktop"}
                    onChange={e => resizeFrame(e.target.value as "phone" | "tablet" | "desktop")}>
                    <option value="phone">Phone</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option>
                  </select>
                </label>
                <label className={styles.inlineField} htmlFor="studio-screen-name">Name
                  <input id="studio-screen-name" value={screen.title} maxLength={100} onChange={e => renameScreen(e.target.value)}/>
                </label>
              </div>}
              <div className={styles.canvasScroll}>
                <div className={styles.canvas} ref={canvas}
                  data-testid="studio-canvas"
                  data-project={doc.project} data-preview={preview ? "true" : "false"}
                  style={{ width: screen.width > 400 ? "min(100%, 900px)" : "min(100%, 360px)", aspectRatio: String(screen.width) + " / " + String(screen.height),
                    background: screen.background } as CSSProperties}>
                  {screen.elements.map(element => {
                    const style: CSSProperties = {
                      position: "absolute", left: (element.x / screen.width * 100) + "%",
                      top: (element.y / screen.height * 100) + "%",
                      width: (element.width / screen.width * 100) + "%",
                      height: (element.height / screen.height * 100) + "%",
                      color: element.color, borderRadius: (element.radius / screen.width * 100) + "cqw",
                      backgroundColor: element.kind === "shape" || element.kind === "button" ? element.fill : "transparent",
                      fontSize: (element.fontSize / screen.width * 100) + "cqw",
                    };
                    const asset = element.kind === "image" ? studioAssets.find(item => item.id === element.asset) : null;
                    return <button
                      key={element.id} type="button" style={style}
                      onClick={() => {
                        if (preview && element.kind === "button" && element.targetScreenId && doc.screens.some(s => s.id === element.targetScreenId)) {
                          setPreviewHistory(prev => [...prev, screen.id].slice(-15));
                          setScreenId(element.targetScreenId);
                        } else if (!preview) setSelectedId(element.id);
                      }}
                      onKeyDown={event => keyboardMove(event, element)}
                      onPointerDown={event => onPointerDown(event, element)}
                      onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                      className={[styles.canvasItem, styles[element.kind], selectedId === element.id && !preview ? styles.selected : ""].filter(Boolean).join(" ")}
                      aria-label={element.kind + ": " + (element.text || asset?.label || "element")}
                      aria-pressed={!preview && selectedId === element.id}
                      title={preview ? "Preview element" : "Select and drag; arrow keys nudge"}
                    >
                      {asset ? <Image src={asset.src} alt={element.text || asset.label} width={140} height={140} unoptimized draggable={false}/> : element.kind === "shape" ? "" : element.text}
                    </button>;
                  })}
                  {selected && !preview && (
                    <button type="button"
                      className={styles.resizeHandle}
                      aria-label="Resize selected element; drag or use arrow keys"
                      title="Drag to resize; arrow keys adjust by 8px"
                      style={{
                        left: ((selected.x + selected.width) / screen.width * 100) + "%",
                        top: ((selected.y + selected.height) / screen.height * 100) + "%",
                      }}
                      onPointerDown={event => onPointerDown(event, selected, "resize")}
                      onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                      onKeyDown={event => keyboardResize(event, selected)}
                    />
                  )}
                </div>
              </div>
              {preview && <div className={styles.previewBar}>
                <p className={styles.previewNotice}>Preview mode: tap a linked button to open another screen.</p>
                <button type="button" disabled={previewHistory.length === 0} onClick={() => {
                  const previous = previewHistory[previewHistory.length - 1];
                  if (previous) setScreenId(previous);
                  setPreviewHistory(p => p.slice(0, -1));
                }}>← Previous screen</button>
                <button type="button" onClick={() => {setPreview(false);setPreviewHistory([]);}}>Back to editing</button>
              </div>}
              <div className={styles.canvasFoot}>
                <span>{notice || (selected ? "Selected " + selected.kind + " — change it on the right." : "Pick something on the canvas to change it.")}</span>
                <span className={styles.saved}><Save size={15}/> Device-only autosave</span>
              </div>
            </div>

            <aside className={styles.properties} aria-label="Change the selected element">
              <h2>Change your design</h2>
              {selected ? <>
                <label className={styles.fieldLabel} htmlFor="element-text">{selected.kind === "image" ? "Picture label" : "Words"}</label>
                {selected.kind !== "shape" && <input id="element-text" className={styles.input}
                  value={selected.text} maxLength={300} onChange={e => editNode({ text: e.target.value })}/>}
                <label className={styles.fieldLabel}>Colour</label>
                <div className={styles.colors}>
                  {studioPalette.map(color => <button key={color} type="button"
                    className={styles.swatch} title={"Choose " + color} aria-label={"Choose colour " + color}
                    aria-pressed={(selected.kind === "shape" || selected.kind === "button" ? selected.fill : selected.color) === color}
                    style={{ backgroundColor: color }}
                    onClick={() => editNode(selected.kind === "shape" || selected.kind === "button" ? { fill: color } : { color })}/>)}
                </div>
                <label className={styles.fieldLabel} htmlFor="element-size">Size</label>
                <input id="element-size" type="range" min={selected.kind === "image" ? 40 : 70}
                  max={Math.min(screen.width, 450)} value={selected.width} onChange={e =>
                    editNode({ width: Number(e.target.value), x: clamp(selected.x, 0, screen.width - Number(e.target.value)) })}/>
                <label className={styles.fieldLabel} htmlFor="element-height">Height</label>
                <input id="element-height" type="range" min={16} max={260} value={selected.height}
                  onChange={e => editNode({ height: Number(e.target.value), y: clamp(selected.y, 0, screen.height - Number(e.target.value)) })}/>
                {(selected.kind === "text" || selected.kind === "button" || selected.kind === "input") &&
                  <><label className={styles.fieldLabel} htmlFor="font-size">Letter size</label>
                    <input id="font-size" type="range" min={12} max={72} value={selected.fontSize}
                      onChange={e => editNode({ fontSize: Number(e.target.value) })}/></>}
                {!beginner && selected.kind === "button" && doc.screens.length > 1 &&
                  <><label className={styles.fieldLabel} htmlFor="button-destination">When clicked, go to</label>
                    <select className={styles.select} id="button-destination" value={selected.targetScreenId ?? ""}
                      onChange={e => editNode({ targetScreenId: e.target.value || undefined })}>
                      <option value="">No next screen</option>
                      {doc.screens.filter(s => s.id !== screen.id).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select></>}
                <div className={styles.smallActions}>
                  <button type="button" onClick={duplicateSelected}><Copy size={16}/> Copy</button>
                  <button type="button" onClick={removeSelected}><Trash2 size={16}/> Remove</button>
                </div>
                <p className={styles.toolsTip}>Use arrow keys to move your selected item, or Shift + arrow for bigger steps.</p>
              </> : <>
                <p className={styles.propertiesEmpty}>Tap a word, image or button on your screen to change it.</p>
                <label className={styles.fieldLabel}>Background</label>
                <div className={styles.colors}>
                  {studioPalette.map(color => <button key={color} type="button" className={styles.swatch}
                    title={"Background " + color} aria-label={"Set background " + color}
                    aria-pressed={screen.background === color} style={{ backgroundColor: color }}
                    onClick={() => commit(updateScreen(doc, screen.id, s => ({ ...s, background: color })))}/>)}
                </div>
              </>}
              <button type="button" className={styles.notesToggle} onClick={() => setShowNotes(v => !v)}>
                {showNotes ? "Hide" : "Open"} project notes {showNotes ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
              </button>
            </aside>
          </div>
          {showNotes && <section className={styles.notes} aria-label="Project research and reflection">
            <h2>Think like a designer</h2>
            <p>These notes stay on this device. Use pretend names and avoid personal information.</p>
            {([{ name: "brief", label: "Who is your design for?", hint: "Describe the person and what they want to do." },
              { name: "evidence", label: "What did you notice?", hint: "What did someone try, say or find confusing?" },
              { name: "reflection", label: "What would you improve?", hint: "Explain one choice and your next change." }] as const).map(field =>
              <label key={field.name}>{field.label}<textarea value={doc.notes[field.name]} maxLength={5000}
                onChange={e => editNote(field.name, e.target.value)} placeholder={field.hint} rows={3}/></label>)}
          </section>}
          {storageError && <p role="alert" className={styles.storageError}>{storageError}</p>}
        </section>
      </div>
    </main>
  );
}
