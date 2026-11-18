import type { LessonScript } from "@/lib/lesson-scripts";
import { developerHtmlScripts } from "@/lib/lesson-scripts-developer-html";
import { developerCssScripts } from "@/lib/lesson-scripts-developer-css";
import { developerJavascriptScripts } from "@/lib/lesson-scripts-developer-javascript";
import { developerQualityScripts } from "@/lib/lesson-scripts-developer-quality";

/*
 * The ages 16 to 18 remaining-content batch: every challenge lesson in the Web
 * Application Development course that did not already carry a six-moment script.
 *
 * Twenty two scripts in four modules, one module per language area, spread into
 * the same exported list as every other batch so the presenter, the contract
 * checker and the course gate keep seeing one set of scripts and a reviewer
 * reads one area at a time.
 *
 * A quiz has no typed code and no tests, and a project lesson completes on a
 * written reflection of its own, so neither takes a six-moment script. They keep
 * their existing presentation and the coverage report prints exactly what is
 * and is not scripted.
 */
export const developerRemainingScripts: LessonScript[] = [
  ...developerHtmlScripts,
  ...developerCssScripts,
  ...developerJavascriptScripts,
  ...developerQualityScripts,
];
