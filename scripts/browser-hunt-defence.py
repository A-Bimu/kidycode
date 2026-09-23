"""Observe which defence outcomes a real browser can reach.

A defence is decided once and the correct prediction is deliberately invisible to the client, so
a pass cannot be produced on demand: it is observed by trying, with a fresh learner per option.
This is the bounded hunt behind the sweep's requirement that a passed defence and Needs
verification are both seen in a browser.

Usage:
  python scripts/browser-hunt-defence.py [courseId:route ...]
"""

import importlib.util
import sys

COURSES = [("ages-10-12", "/learn"), ("adults", "/learn/adults")]


def main():
    spec = importlib.util.spec_from_file_location("sweep", "scripts/browser-sweep-defence.py")
    sweep = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sweep)
    sweep.require_websocket()
    courses = [tuple(entry.split(":", 1)) for entry in sys.argv[1:]] or COURSES
    seen = sweep.outcome_hunt(courses, width=320, attempts=4)

    outcomes = {outcome for values in seen.values() for outcome in values}
    for course_id, values in seen.items():
        print(f"{course_id}: {values}")
    print(f"outcomes observed in a browser: {sorted(outcomes)}")
    missing = [name for name in ("Passed", "Needs verification") if name not in outcomes]
    if missing:
        print(f"not yet observed: {missing}")
        raise SystemExit(1)
    print("both a passed defence and Needs verification were observed")


if __name__ == "__main__":
    main()