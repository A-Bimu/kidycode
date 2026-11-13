import type { LessonScript } from "@/lib/lesson-scripts";
import { teenHtmlScripts } from "@/lib/lesson-scripts-teen-html";
import { teenCssScripts } from "@/lib/lesson-scripts-teen-css";
import { teenJavascriptScripts } from "@/lib/lesson-scripts-teen-javascript";
import { teenQualityScripts } from "@/lib/lesson-scripts-teen-quality";

/*
 * The ages 13 to 15 remaining-content batch: every challenge lesson in the
 * Practical Web Development course that did not already carry a six-moment
 * script.
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
export const teenPathwayScripts: LessonScript[] = [
  ...teenHtmlScripts,
  ...teenCssScripts,
  ...teenJavascriptScripts,
  ...teenQualityScripts,
];
