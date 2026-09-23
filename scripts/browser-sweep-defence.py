"""The reproducible code-defence browser sweep.

All four courses at 320, 768 and 1440 pixels: twelve authenticated journeys, each with a fresh
learner. Nothing is shell-substituted, so a cookie cannot be silently lost, and no partial or
signed-out run can be counted as evidence: every journey must finish with an approved outcome and
a clean report, or the sweep exits non-zero and names the reason.

Usage:
  python scripts/browser-sweep-defence.py [courseId:route ...]
"""

import json
import os
import subprocess
import sys

COURSES = [
    ("ages-10-12", "/learn"),
    ("ages-13-15", "/learn/13-15"),
    ("ages-16-18", "/learn/16-18"),
    ("adults", "/learn/adults"),
]
WIDTHS = (320, 768, 1440)
TEMP = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "journeys")


def require_websocket():
    try:
        import websocket  # noqa: F401
    except ImportError as error:
        raise SystemExit(f"HARNESS: the websocket dependency is missing for {sys.executable}: {error}")
    print(f"websocket ready for {sys.executable}")


def seed(course_id, width, tag="all"):
    """Create a fresh learner and return their cookie. The seed travels through a file, never
    through shell substitution, and is validated before it is used."""
    path = os.path.join(TEMP, f"seed-{course_id}-{width}-{tag}.json")
    nickname = (f"Sweep{width}{course_id.replace('-', '')}{tag}")[:20]
    result = subprocess.run(
        ["node", "--import", "tsx", "--no-warnings", "scripts/e2e-browser-seed.mjs", course_id, "all", nickname],
        capture_output=True, text=True, check=False,
    )
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(result.stdout)
    if result.returncode != 0:
        raise SystemExit(f"HARNESS: seeding {course_id} at {width}px failed: {result.stderr.strip()[:200]}")
    seed_data = json.loads(result.stdout.strip().splitlines()[-1])
    cookie = (seed_data.get("cookie") or "").strip()
    if not cookie:
        raise SystemExit(f"HARNESS: the seed returned an empty cookie for {course_id} at {width}px")
    if not seed_data.get("finalAvailable"):
        raise SystemExit(f"HARNESS: the seeded learner cannot reach the final assessment for {course_id}")
    os.remove(path)
    return cookie, seed_data


def outcome_hunt(courses, width=320, attempts=4):
    """A defence is decided once, and the correct prediction is deliberately not visible to the
    client, so a learner can only be observed passing by trying. This runs one fresh learner per
    prediction option with a different small change, and records which outcomes are reachable in
    a browser. It is bounded on purpose."""
    seen = {}
    for course_id, route in courses:
        for index in range(attempts):
            tag = f"hunt{index}"
            report_path = os.path.join(TEMP, f"report-{course_id}-{width}-{tag}.json")
            try:
                cookie, _ = seed(course_id, width, tag)
            except SystemExit as error:
                print(f"  HUNT SEED FAILED {course_id} {tag}: {error}")
                continue
            run = subprocess.run(
                [sys.executable, "scripts/browser-journey-defence.py", course_id, route, cookie,
                 str(width), report_path, str(index), str(index % 3)],
                capture_output=True, text=True, check=False,
            )
            if not os.path.exists(report_path):
                print(f"  HUNT {course_id} predict {index}: no report ({(run.stderr or run.stdout).strip()[-120:]})")
                continue
            report = json.load(open(report_path, encoding="utf-8"))
            outcome = report.get("facts", {}).get("outcome", "-")
            seen.setdefault(course_id, []).append(outcome)
            print(f'  HUNT {course_id} predict {index} change {index % 3}: outcome={outcome} ok={report.get("ok")} error={report.get("error")}')
    return seen


def main():
    require_websocket()
    os.makedirs(TEMP, exist_ok=True)
    courses = [tuple(entry.split(":", 1)) for entry in sys.argv[1:]] or COURSES

    rows = []
    failures = []
    for course_id, route in courses:
        for width in WIDTHS:
            report_path = os.path.join(TEMP, f"report-{course_id}-{width}.json")
            if os.path.exists(report_path):
                os.remove(report_path)
            try:
                cookie, _ = seed(course_id, width)
            except SystemExit as error:
                failures.append(f"{course_id} {width}px: {error}")
                print(f"  SEED FAILED {course_id} {width}px: {error}")
                continue

            run = subprocess.run(
                [sys.executable, "scripts/browser-journey-defence.py", course_id, route, cookie, str(width), report_path],
                capture_output=True, text=True, check=False,
            )
            report = {}
            if os.path.exists(report_path):
                try:
                    report = json.load(open(report_path, encoding="utf-8"))
                except Exception as error:
                    failures.append(f"{course_id} {width}px: the report could not be read ({error})")
            else:
                failures.append(f"{course_id} {width}px: no report was written "
                                f"({(run.stderr or run.stdout).strip()[-200:] or 'the journey printed nothing'})")
            if "Traceback" in run.stdout or "Traceback" in run.stderr:
                failures.append(f"{course_id} {width}px: the journey reported a traceback")

            facts = report.get("facts", {})
            rows.append({
                "course": course_id,
                "width": width,
                "screens": len(report.get("screens", [])),
                "outcome": facts.get("outcome", "-"),
                "draft": facts.get("draftSaved", ""),
                "blocked": facts.get("blockedWithoutPrediction"),
                "ok": bool(report.get("ok")),
                "error": report.get("error", "") or run.stdout.strip().splitlines()[-1] if run.stdout else report.get("error", ""),
            })
            if not report.get("ok"):
                failures.append(f"{course_id} {width}px: {report.get('error') or run.stdout.strip()[-160:]}")
            print(f'  {course_id:<12} {width:>5}px ok={report.get("ok")} outcome={facts.get("outcome", "-")} '
                  f'screens={len(report.get("screens", []))} blockedSets="Save and continue" correctly refused={facts.get("blockedWithoutPrediction")}')

    print("\ncourse        width  screens  outcome            draft saved                        ok")
    for row in rows:
        print(f'{row["course"]:<13} {row["width"]:>5}  {row["screens"]:>7}  {row["outcome"]:<18} '
              f'{str(row["draft"])[:34]:<34} {row["ok"]}')

    outcomes = {row["outcome"] for row in rows}
    print(f"\njourneys finished {len(rows)} of {len(courses) * len(WIDTHS)}, outcomes observed {sorted(outcomes)}")

    # Passed, Not passed yet and the technical retry are proven deterministically, against a known
    # reviewed template, by the targeted harness: npm run test:browser:targets. A brute-force hunt is
    # neither needed nor wanted here, and a sweep journey has no project to compare a change against
    # unless the harness hands one in.

    for failure in failures:
        print("  FAILURE:", failure)
    if "Needs verification" in outcomes:
        failures.append("Needs verification is no longer a learner-facing outcome and must not appear")
    if failures:
        print(f"\ndefence sweep FAILED with {len(failures)} problem(s)")
        raise SystemExit(1)
    print("defence sweep passed")


if __name__ == "__main__":
    main()