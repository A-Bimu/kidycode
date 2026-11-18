"""Audit the adults remaining-content lessons in a real headless Chrome.

Local only. For each new challenge lesson in the Web Skills for Work and
Business course it seeds a real learner with the lessons before it complete,
opens the lesson, and audits what the browser actually rendered at a wide and a
narrow width:

  * the six-moment rail renders and names the concept
  * the course default guidance is balanced, and choosing guided stores the
    per-lesson override under the lesson's own key
  * the hook shows what the learner will make
  * layout: no horizontal overflow, no green, one h1, one main, heading order,
    every control labelled, no em dash
  * keyboard only: the tab order reaches the journey controls and every stop
    carries an accessible name

Usage:
  python scripts/browser-adults-sweep.py [widths...]

The local dev server must already be running (default http://localhost:3001).
Point it elsewhere with KIDYCODE_E2E_URL.
"""

import importlib.util
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("browser_journey_v3", os.path.join(HERE, "browser-journey-v3.py"))
hj = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hj)

LESSONS = [
    {"id": "adults-structure-landmarks", "title": "Plan meaningful page regions", "before": 0},
    {"id": "adults-structure-links", "title": "Write useful navigation links", "before": 2},
    {"id": "adults-structure-metadata", "title": "Describe images clearly", "before": 3},
    {"id": "adults-forms-types", "title": "Choose the correct input type", "before": 7},
    {"id": "adults-forms-groups", "title": "Group related choices", "before": 8},
    {"id": "adults-forms-messages", "title": "Add clear form instructions", "before": 9},
    {"id": "adults-css-system-selectors", "title": "Target elements with selectors", "before": 12},
    {"id": "adults-css-system-tokens", "title": "Name repeated design values", "before": 14},
    {"id": "adults-css-system-states", "title": "Style interactive states", "before": 15},
    {"id": "adults-responsive-viewport", "title": "Start with the available width", "before": 18},
    {"id": "adults-responsive-media", "title": "Add a meaningful breakpoint", "before": 21},
    {"id": "adults-javascript-conditions", "title": "Choose an outcome", "before": 26},
    {"id": "adults-javascript-dom-output", "title": "Show a result on the page", "before": 27},
    {"id": "adults-interaction-select", "title": "Select the elements you need", "before": 36},
    {"id": "adults-interaction-events", "title": "Respond to a user event", "before": 37},
    {"id": "adults-interaction-storage", "title": "Save and restore a preference", "before": 39},
    {"id": "adults-quality-debug", "title": "Debug from evidence", "before": 42},
    {"id": "adults-quality-security", "title": "Protect personal information", "before": 44},
    {"id": "adults-quality-release", "title": "Write a useful release note", "before": 45},
]


def named(item):
    return bool(item["aria"] or item["text"] or item["id"] or item["label"])


def sweep_lesson(page, width, lesson, cookie):
    tag = f"{lesson['id']} @{width}"
    hj.open_lesson(page, "/learn/adults", cookie, lesson["title"])
    # A learner override persists in localStorage across widths, so clear this
    # lesson's key and reopen before judging the course default.
    page.evaluate(f"(() => localStorage.removeItem('kidycode:guidance:{lesson['id']}'))()")
    hj.open_lesson(page, "/learn/adults", cookie, lesson["title"])

    hj.check(f"{tag}: the six-moment rail renders", page.count(".journey-rail li") >= 6, page.count(".journey-rail li"))
    rail = page.text(".journey-rail") or ""
    hj.check(f"{tag}: the rail names the concept", "Concept:" in rail, rail[:120])
    hj.check(f"{tag}: the guidance control offers three modes", page.count('input[name="guidance-mode"]') == 3, page.count('input[name="guidance-mode"]'))
    hj.check(f"{tag}: the hook shows what the learner makes", "What you will make" in (page.text(".journey-hook") or ""), page.text(".journey-hook"))
    hj.check(
        f"{tag}: the course default guidance is balanced",
        page.evaluate("document.querySelector('input[name=\"guidance-mode\"][value=\"balanced\"]').checked") is True,
    )

    page.click_selector('input[name="guidance-mode"][value="guided"]')
    stored = page.evaluate(f"(() => localStorage.getItem('kidycode:guidance:{lesson['id']}'))()")
    hj.check(f"{tag}: choosing guided stores the per-lesson override", stored == "guided", stored)

    layout = page.audit(f"{tag} notes")
    hj.check(f"{tag}: no horizontal overflow", layout["overflow"] <= 0, layout["overflow"])
    hj.check(f"{tag}: no green in the palette", layout["greenCount"] == 0, layout["green"])
    hj.check(f"{tag}: one h1 and one main", layout["h1"] == 1 and layout["mains"] == 1, (layout["h1"], layout["mains"]))
    hj.check(f"{tag}: heading order has no skipped level", layout["headingOrderOk"], layout)
    hj.check(f"{tag}: every control is labelled", not layout["unlabelled"], layout["unlabelled"])
    hj.check(f"{tag}: no em dash in learner text", layout["emDashes"] == 0, layout["emDashes"])

    page.reset_focus()
    order = []
    seen = set()
    for _ in range(60):
        page.tab()
        focused = page.focused()
        if not focused or focused["tag"] == "BODY":
            break
        key = (focused["tag"], focused["id"], focused["name"], focused["value"], focused["aria"], focused["text"])
        if key in seen:
            break
        seen.add(key)
        order.append(focused)
    hj.check(f"{tag}: the tab order reaches the journey controls", len(order) >= 6, len(order))
    hj.check(f"{tag}: every keyboard stop carries an accessible name", all(named(item) for item in order), [item for item in order if not named(item)])


def main():
    widths = [int(value) for value in sys.argv[1:]] or [1440, 320]
    if not hj.BASE.startswith("http://localhost"):
        raise SystemExit("This harness only runs against localhost.")
    hj.ensure_chrome()
    page = hj.Page()

    stamp = int(time.time())
    for width in widths:
        page.width(width)
        for index, lesson in enumerate(LESSONS):
            cookie = hj.seed_learner("adults", lesson["before"], f"Adlt{width}{stamp % 1000}{index}")
            sweep_lesson(page, width, lesson, cookie)

    failed = [item for item in hj.checks if not item["ok"]]
    report = {"base": hj.BASE, "screens": hj.screens, "checks": hj.checks, "failed": failed}
    report_path = os.path.join(hj.ROOT, ".sites-runtime", "tmp", "browser-adults-sweep.json")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(f"\nadults sweep: {len(hj.checks) - len(failed)} checks passed, {len(failed)} failed, {len(hj.screens)} screens audited")
    print(f"report: {report_path}")
    if failed:
        for item in failed:
            print(f"  - {item['name']}: {item['detail']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
