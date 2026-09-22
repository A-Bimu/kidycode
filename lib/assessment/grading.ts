/*
 * Requirement grading.
 *
 * Every mark comes from a declarative check decided by the readers in this directory.
 * Nothing here executes learner code. Where a check genuinely cannot be decided from
 * the submitted files, it reports needs-verification: a requirement that cannot be
 * determined reliably never becomes a guessed pass and never becomes a guessed fail.
 */

import {
  attribute,
  documentText,
  findAll,
  headingSequence,
  labelledControls,
  parseHtml,
  resolvingFragmentLinks,
  textContent,
  walk,
  type HtmlDocument,
  type HtmlNode,
} from "@/lib/assessment/html";
import {
  declarationValues,
  gridTrackCount,
  isFluidWidth,
  matchesValueClass,
  minWidthOf,
  parseCss,
  varUsageCount,
  type StyleSheet,
} from "@/lib/assessment/css";
import {
  callCount,
  callbacksOf,
  functionCount,
  functionsWithParams,
  hasStaleResultGuard,
  scanJs,
  type JsFacts,
} from "@/lib/assessment/js";
import type { CodeFiles, ItemResultStatus, Requirement, RequirementCheck, RequirementResult } from "@/lib/assessment/types";

export type CheckOutcome = { status: ItemResultStatus; detail: string };

export type GradeContext = {
  files: Partial<CodeFiles>;
  baseline?: Partial<CodeFiles>;
  html: HtmlDocument | null;
  css: StyleSheet | null;
  js: JsFacts | null;
};

export function buildContext(files: Partial<CodeFiles>, baseline?: Partial<CodeFiles>): GradeContext {
  return {
    files,
    baseline,
    html: files.html === undefined ? null : parseHtml(files.html),
    css: files.css === undefined ? null : parseCss(files.css),
    js: files.javascript === undefined ? null : scanJs(files.javascript),
  };
}

/* ------------------------------------------------------------------- catalogue - */

/*
 * The privacy catalogue behind the mandatory privacy requirement. Only phrases that
 * point at the learner themselves are matched, so ordinary wording such as "after
 * school club" is not treated as an address. A hit is explained to the learner after
 * submission so the wording can be repaired.
 */
export const PRIVACY_CATALOGUE: Record<string, string[]> = {
  "personal-contact": [
    "\\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b",
    "\\+?\\d[\\d\\s().-]{6,}\\d",
    "\\b(whatsapp|telegram|tiktok|snapchat|instagram)@?[a-z0-9._-]*",
    "\\b(my|our)\\s+(phone|mobile|number|email|e-mail|contact)\\b",
    "\\b(call|text|message|dm|email)\\s+me\\b",
    "\\bhome\\s+address\\b",
    "\\b(emergency\\s+)?(phone|contact)\\s*number\\b",
  ],
  "private-location": [
    "\\b(my|our)\\s+(house|home|school|estate|street|road|village|apartment|flat|compound)\\b",
    "\\bhome\\s+address\\b",
    "\\b(latitude|longitude|coordinates|gps\\s+location)\\b",
    "\\bgoogle\\s+maps?\\b",
    "\\b(map|directions)\\s+to\\s+my\\b",
    "\\bpostal\\s+address\\b",
    "\\bp\\.?o\\.?\\s*box\\b",
  ],
};

export function privacyHits(text: string, catalogue: keyof typeof PRIVACY_CATALOGUE): string[] {
  const patterns = PRIVACY_CATALOGUE[catalogue] || [];
  return patterns.filter((pattern) => new RegExp(pattern, "i").test(text));
}

/* ---------------------------------------------------------------------- html -- */

function elementCount(document: HtmlDocument, tag: string): number {
  return findAll(document, tag).length;
}

function meaningfulAlt(node: HtmlNode): boolean {
  const alt = (attribute(node, "alt") || "").trim();
  if (alt.length < 8) return false;
  if (/^(image|picture|photo|graphic|icon)\s*(of|showing)?\s*$/i.test(alt)) return false;
  return true;
}

function hasStatusRegion(document: HtmlDocument): boolean {
  return walk(document).some((node) => {
    const role = attribute(node, "role");
    const live = attribute(node, "aria-live");
    return role === "status" || role === "alert" || role === "log" || (live !== null && live !== "off");
  });
}

function headingOrderOk(document: HtmlDocument): boolean {
  const levels = headingSequence(document);
  if (levels.length === 0) return false;
  if (levels.filter((level) => level === 1).length !== 1) return false;
  const firstHeading = walk(document).find((node) => /^h[1-6]$/.test(node.tag));
  if (!firstHeading || firstHeading.tag !== "h1") return false;
  let previous = 1;
  for (const level of levels) {
    if (level > previous + 1) return false;
    previous = level;
  }
  return true;
}

function documentMetaOk(document: HtmlDocument): boolean {
  const title = findAll(document, "title")[0];
  const titleText = title ? textContent(title) : "";
  const viewport = findAll(document, "meta").some((node) => {
    const name = (attribute(node, "name") || "").toLowerCase();
    const content = (attribute(node, "content") || "").toLowerCase();
    return name === "viewport" && content.includes("width=device-width");
  });
  return titleText.trim().length >= 5 && viewport;
}

/* ----------------------------------------------------------------------- css -- */

function focusVisibleOk(sheet: StyleSheet): boolean {
  return sheet.rules.some((rule) => {
    if (!rule.selector.includes(":focus-visible")) return false;
    return rule.declarations.some((declaration) =>
      declaration.property === "outline"
      || (declaration.property === "box-shadow" && declaration.value.length > 3));
  });
}

function fluidWidthOk(sheet: StyleSheet): boolean {
  const fluid = declarationValues(sheet, { property: "width" }).some(isFluidWidth)
    || declarationValues(sheet, { property: "max-width" }).some(isFluidWidth);
  const imageSafe = declarationValues(sheet, { selector: "img", property: "max-width" })
    .some((value) => value.replace(/\s+/g, "") === "100%");
  return fluid || imageSafe;
}

function readabilityOk(sheet: StyleSheet): boolean {
  const bodyOrRoot = declarationValues(sheet, { selector: "body" })
    .concat(declarationValues(sheet, { selector: ":root" }));
  const hasType = declarationValues(sheet, { property: "line-height" }).length > 0
    || declarationValues(sheet, { property: "font-size" }).length > 0;
  return hasType && bodyOrRoot.length > 0;
}

/* ------------------------------------------------------------------ dispatch -- */

function measure(check: RequirementCheck, context: GradeContext): number | null {
  switch (check.kind) {
    case "html-element":
      return context.html ? elementCount(context.html, check.tag) : null;
    case "html-list": {
      if (!context.html) return null;
      return findAll(context.html, "ul").concat(findAll(context.html, "ol"))
        .reduce((best, list) => Math.max(best, findAll({ roots: list.children, problems: 0 }, "li").length), 0);
    }
    case "css-declaration": {
      if (!context.css) return null;
      return declarationValues(context.css, { selector: check.selector, property: check.property })
        .filter((value) => matchesValueClass([value], check.value)).length;
    }
    case "js-call":
      return context.js ? callCount(context.js, check.method) : null;
    default:
      return null;
  }
}

function absentStatus(value: number | null, label: string): CheckOutcome {
  if (value === null) {
    return { status: "needs-verification", detail: `The ${label} file was not submitted, so this could not be checked.` };
  }
  return value === 0
    ? { status: "met", detail: `No ${label} found.` }
    : { status: "unmet", detail: `${label} found: this is not safe for the project.` };
}

export function runCheck(check: RequirementCheck, context: GradeContext): CheckOutcome {
  const html = context.html;
  const css = context.css;
  const js = context.js;

  switch (check.kind) {
    case "html-element": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const count = elementCount(html, check.tag);
      const minimum = check.min ?? 1;
      const maximum = check.max ?? Number.POSITIVE_INFINITY;
      if (count >= minimum && count <= maximum) {
        return { status: "met", detail: `${count} <${check.tag}> element(s) found.` };
      }
      return { status: "unmet", detail: `Found ${count} <${check.tag}> element(s); ${minimum} to ${maximum === Number.POSITIVE_INFINITY ? "any" : maximum} expected.` };
    }
    case "html-attribute": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const candidates = findAll(html, check.tag);
      const match = candidates.find((node) => {
        const value = attribute(node, check.attr);
        if (value === null) return false;
        if (check.values && !check.values.includes(value.toLowerCase())) return false;
        if (check.minLength !== undefined && value.trim().length < check.minLength) return false;
        return true;
      });
      return match
        ? { status: "met", detail: `A <${check.tag}> element gives ${check.attr} a usable value.` }
        : { status: "unmet", detail: `No <${check.tag}> element has a usable ${check.attr} value yet.` };
    }
    case "html-labelled-control": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const { total, labelled } = labelledControls(html);
      if (total === 0) return { status: "unmet", detail: "No form control was found." };
      if (labelled === total) return { status: "met", detail: `All ${total} control(s) have a connected label.` };
      return { status: "unmet", detail: `${total - labelled} of ${total} control(s) have no connected label.` };
    }
    case "html-fragment-link": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const count = resolvingFragmentLinks(html);
      return count > 0
        ? { status: "met", detail: `${count} link(s) reach a section on the page.` }
        : { status: "unmet", detail: "No link reaches a section that exists on this page." };
    }
    case "html-heading-order": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      return headingOrderOk(html)
        ? { status: "met", detail: "One h1, and the heading levels step down without gaps." }
        : { status: "unmet", detail: "The page needs one h1 first, and heading levels must not skip a level." };
    }
    case "html-document-meta": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      return documentMetaOk(html)
        ? { status: "met", detail: "The document has a title and a responsive viewport." }
        : { status: "unmet", detail: "The document needs a specific title and the width=device-width viewport meta element." };
    }
    case "html-image-alt": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const images = findAll(html, "img");
      if (images.length === 0) return { status: "unmet", detail: "No image was found." };
      const described = images.filter(meaningfulAlt).length;
      return described > 0
        ? { status: "met", detail: `${described} of ${images.length} image(s) carry useful alternative text.` }
        : { status: "unmet", detail: "Every image needs alternative text that states its useful information." };
    }
    case "html-landmarks": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const missing = check.tags.filter((tag) => elementCount(html, tag) === 0);
      return missing.length === 0
        ? { status: "met", detail: `Found ${check.tags.join(", ")}.` }
        : { status: "unmet", detail: `These regions are still missing: ${missing.join(", ")}.` };
    }
    case "html-list": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const count = measure(check, context) || 0;
      return count >= check.minItems
        ? { status: "met", detail: `A list holds ${count} item(s).` }
        : { status: "unmet", detail: `A list needs at least ${check.minItems} item(s); found ${count}.` };
    }
    case "html-status-region": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      return hasStatusRegion(html)
        ? { status: "met", detail: "A live status region is present." }
        : { status: "unmet", detail: "Feedback needs a region with role=status so it can be announced." };
    }
    case "html-language": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const root = findAll(html, "html")[0];
      const value = root ? (attribute(root, "lang") || "").trim() : "";
      return value.length >= 2
        ? { status: "met", detail: `The document declares the language ${value}.` }
        : { status: "unmet", detail: "The html element needs a lang value so screen readers use the right voice." };
    }
    case "html-text-free-of": {
      if (!html) return { status: "needs-verification", detail: "No HTML file was submitted for this task." };
      const hits = privacyHits(documentText(html), check.catalogue);
      return hits.length === 0
        ? { status: "met", detail: "No personal contact or private location detail was found in the page." }
        : { status: "unmet", detail: `The page contains personal contact or location detail (${hits.length} pattern(s) matched). Replace it with a nickname or a general statement.` };
    }

    case "css-declaration": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      const values = declarationValues(css, { selector: check.selector, property: check.property });
      if (values.length === 0) {
        return { status: "unmet", detail: `No ${check.property} declaration was found${check.selector ? ` for ${check.selector}` : ""}.` };
      }
      return matchesValueClass(values, check.value)
        ? { status: "met", detail: `${check.property} is set to a ${check.value} value.` }
        : { status: "unmet", detail: `${check.property} is present but not a ${check.value} value yet.` };
    }
    case "css-at-rule": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      const widths = minWidthOf(css);
      if (widths.length === 0) return { status: "unmet", detail: "No media query with a min-width condition was found." };
      const wanted = check.minWidth ?? 0;
      return widths.some((width) => width >= wanted)
        ? { status: "met", detail: `A media query applies from ${Math.max(...widths)}px.` }
        : { status: "unmet", detail: `The widest breakpoint found is ${Math.max(...widths)}px, which is narrower than needed.` };
    }
    case "css-custom-properties": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      return css.customProperties.length >= check.min
        ? { status: "met", detail: `${css.customProperties.length} named design properties are defined.` }
        : { status: "unmet", detail: `${check.min} named design properties are needed; found ${css.customProperties.length}.` };
    }
    case "css-var-usage": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      const count = varUsageCount(css);
      return count >= check.min
        ? { status: "met", detail: `var() is used ${count} time(s).` }
        : { status: "unmet", detail: `var() is used ${count} time(s); ${check.min} expected.` };
    }
    case "css-focus-visible": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      return focusVisibleOk(css)
        ? { status: "met", detail: "A :focus-visible rule gives the control a visible outline." }
        : { status: "unmet", detail: "Add a :focus-visible rule with an outline so keyboard users can see where they are." };
    }
    case "css-fluid-width": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      return fluidWidthOk(css)
        ? { status: "met", detail: "The layout keeps its width tied to the available space." }
        : { status: "unmet", detail: "Give the page a fluid maximum width, or keep images inside their container." };
    }
    case "css-readability": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      return readabilityOk(css)
        ? { status: "met", detail: "Text has a readable size or line height on the page." }
        : { status: "unmet", detail: "Set a readable font-size or line-height on the page or body." };
    }
    case "css-grid-tracks": {
      if (!css) return { status: "needs-verification", detail: "No CSS file was submitted for this task." };
      const tracks = gridTrackCount(css);
      if (tracks === 0) return { status: "unmet", detail: "No grid-template-columns value was found." };
      return tracks >= (check.minTracks ?? 2)
        ? { status: "met", detail: `Grid tracks are defined (${tracks} or more).` }
        : { status: "unmet", detail: `Fewer tracks than expected: ${tracks}.` };
    }

    case "js-function": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const count = check.paramsMin !== undefined ? functionsWithParams(js, check.paramsMin) : functionCount(js);
      return count >= (check.min ?? 1)
        ? { status: "met", detail: `${count} function(s) found${check.paramsMin ? ` with at least ${check.paramsMin} parameter(s)` : ""}.` }
        : { status: "unmet", detail: check.paramsMin
          ? `A function with at least ${check.paramsMin} parameter(s) is needed.`
          : "A named function is needed here." };
    }
    case "js-call": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const count = callCount(js, check.method);
      return count >= (check.min ?? 1)
        ? { status: "met", detail: `${check.method}() is called ${count} time(s).` }
        : { status: "unmet", detail: `${check.method}() was not called.` };
    }
    case "js-callback": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const callbacks = callbacksOf(js, check.method);
      if (callbacks.length === 0) return { status: "unmet", detail: `No callback was passed to ${check.method}().` };
      const ok = callbacks.some((callback) =>
        (check.needsReturn ? callback.hasReturn : true) && (check.needsComparison ? callback.comparison : true));
      return ok
        ? { status: "met", detail: `The ${check.method}() callback does the required work.` }
        : { status: "unmet", detail: `The ${check.method}() callback does not yet ${check.needsComparison ? "test the condition" : "return its result"}.` };
    }
    case "js-structural": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const facts: Record<string, number> = {
        conditional: (js.keywords.if || 0) + js.ternary,
        ternary: js.ternary,
        return: js.keywords.return || 0,
        "try-catch": (js.keywords.try || 0) > 0 && (js.keywords.catch || 0) > 0 ? 1 : 0,
        finally: js.keywords.finally || 0,
        await: js.keywords.await || 0,
        "async-function": js.functions.filter((entry) => entry.isAsync).length + (js.keywords.async || 0),
        "strict-equality": js.comparisons.strict,
        "array-literal": js.arrayLiterals,
        "object-literal": js.objectLiterals,
        "event-listener": js.eventListeners.length,
        "prevent-default": js.preventDefault,
        "create-element": js.createElement.length,
        append: js.append,
        spread: js.spread,
        "innerhtml-assignment": js.innerHtml,
        eval: js.eval,
        "document-write": js.documentWrite,
      };
      const count = facts[check.fact] ?? 0;
      if (count >= (check.min ?? 1)) return { status: "met", detail: `${check.fact} is used ${count} time(s).` };
      return { status: "unmet", detail: `${check.fact} was not found in the JavaScript.` };
    }
    case "js-member-assignment": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      return js.propertyAssignments.includes(check.property)
        ? { status: "met", detail: `${check.property} is assigned on an element.` }
        : { status: "unmet", detail: `Nothing is assigned to ${check.property} yet.` };
    }
    case "js-storage": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const used = js.storage.some((entry) => entry.method === check.method);
      return used
        ? { status: "met", detail: `${check.method} is used with browser storage.` }
        : { status: "unmet", detail: `${check.method} was not used with browser storage.` };
    }
    case "js-literal-any": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const wanted = check.values.map((value) => value.trim().toLowerCase());
      const found = js.literals.some((literal) => wanted.includes(literal.trim().toLowerCase()));
      return found
        ? { status: "met", detail: "One of the accepted messages is shown." }
        : { status: "unmet", detail: `None of the accepted messages appears yet (${check.values.join(" or ")}).` };
    }
    case "js-request-id": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      return hasStaleResultGuard(js)
        ? { status: "met", detail: "An older request is recognised and ignored before the page is updated." }
        : { status: "unmet", detail: "A request identifier is needed so an older, slower request cannot replace newer results." };
    }
    case "js-absent": {
      if (!js) return { status: "needs-verification", detail: "No JavaScript file was submitted for this task." };
      const labels: Record<string, string> = {
        "innerhtml-assignment": "an innerHTML assignment",
        eval: "eval()",
        "document-write": "document.write()",
      };
      const unsafe = check.fact === "innerhtml-assignment"
        ? js.innerHtml + js.newFunction
        : check.fact === "eval"
          ? js.eval
          : js.documentWrite;
      return absentStatus(unsafe, labels[check.fact] || check.fact);
    }

    case "cannot-verify":
      return {
        status: "needs-verification",
        detail: `${check.reason} This needs a person to confirm it, so it is recorded as Needs verification.`,
      };

    case "increase": {
      const before = context.baseline ? measure(check.inner, buildContext(context.baseline)) : null;
      const after = measure(check.inner, context);
      if (after === null || before === null) {
        return { status: "needs-verification", detail: "This change could not be compared with the earlier version of the project." };
      }
      const gained = after - before;
      return gained >= check.by
        ? { status: "met", detail: `The change was made: ${gained} more than the previous version.` }
        : { status: "unmet", detail: `The change is not in this version yet (${gained} of ${check.by} expected).` };
    }

    default:
      return { status: "needs-verification", detail: "This requirement could not be checked automatically." };
  }
}

export function gradeRequirements(
  requirements: Requirement[],
  context: GradeContext,
): RequirementResult[] {
  return requirements.map((requirement) => {
    const outcome = runCheck(requirement.check, context);
    const awarded = outcome.status === "met" ? requirement.marks : 0;
    return {
      requirementId: requirement.id,
      label: requirement.label,
      status: outcome.status,
      awarded,
      available: requirement.marks,
      concept: requirement.concept,
      mandatory: requirement.mandatory ?? null,
      detail: outcome.detail,
    };
  });
}