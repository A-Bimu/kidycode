import type { LessonScript } from "@/lib/lesson-scripts";
import { practicalHtmlScripts } from "@/lib/lesson-scripts-practical-html";
import { practicalCssScripts } from "@/lib/lesson-scripts-practical-css";
import { practicalJavascriptScripts } from "@/lib/lesson-scripts-practical-javascript";
import { practicalQualityScripts } from "@/lib/lesson-scripts-practical-quality";

/*
 * The adults remaining-content batch: every challenge lesson in the Web Skills
 * for Work and Business course that did not already carry a six-moment script.
 *
 * Nineteen scripts in four modules, one module per language area, spread into
 * the same exported list as every other batch so the presenter, the contract
 * checker and the course gate keep seeing one set of scripts and a reviewer
 * reads one area at a time.
 *
 * A quiz has no typed code and no tests, and a project lesson completes on a
 * written reflection of its own, so neither takes a six-moment script. They keep
 * their existing presentation and the coverage report prints exactly what is
 * and is not scripted.
 */
export const practicalRemainingScripts: LessonScript[] = [
  ...practicalHtmlScripts,
  ...practicalCssScripts,
  ...practicalJavascriptScripts,
  ...practicalQualityScripts,
];
