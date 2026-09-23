"""The certificate browser sweep: every course and viewport, three states, one command.

Twelve certified journeys (four courses at 320, 768 and 1440 pixels), three uncertified journeys
that must show exactly what remains, and the adult course check that no grown-up controls are
offered. Every journey is a real browser journey against a real seeded learner; nothing writes a
certificate into the database, because the browser asks for it and the route decides.

Usage:
  python scripts/browser-sweep-certificate.py
"""

import importlib.util
import json
import os
import subprocess
import sys
import time

TEMP = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "journeys")
WIDTHS = [320, 768, 1440]
COURSES = [
    ("ages-10-12", "/learn"),
    ("ages-13-15", "/learn/13-15"),
    ("ages-16-18", "/learn/16-18"),
    ("adults", "/learn/adults"),
]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def seed(course_id, state, tag):
    """Seeds through the real API and the local database. The child is invoked with `node`, and a
    missing interpreter is named rather than reported as a mysterious empty seed."""
    args = ["--import", "tsx", "--no-warnings", "scripts/certificate-verify-seed.mjs", course_id, state, tag]
    result = None
    try:
        result = subprocess.run(["node", *args], capture_output=True, text=True, check=False)
    except FileNotFoundError:
        raise SystemExit("HARNESS: `node` was not found on PATH, so no learner could be seeded.")
    if result.returncode != 0:
        raise SystemExit(f"HARNESS: seeding {course_id} ({state}) failed: {result.stderr.strip()[:300]}")
    line = result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
    if not line:
        raise SystemExit(f"HARNESS: seeding {course_id} ({state}) produced no output.")
    seeded = json.loads(line)
    cookie = (seeded.get("cookie") or "").strip()
    if not cookie:
        raise SystemExit(f"HARNESS: the seed returned an empty cookie for {course_id} ({state})")
    return seeded


def run_journey(course_id, route, width, state, tag):
    seeded = seed(course_id, state, tag)
    report_path = os.path.join(TEMP, f"certificate-{course_id}-{width}-{state}.json")
    if os.path.exists(report_path):
        os.remove(report_path)
    started = time.time()
    result = subprocess.run(
        [sys.executable, "scripts/browser-journey-certificate.py", course_id, route, seeded["cookie"],
         str(width), report_path, state],
        capture_output=True, text=True, check=False,
    )
    report = None
    if os.path.exists(report_path):
        with open(report_path, encoding="utf-8") as handle:
            report = json.load(handle)
    if report is None:
        print(f"  {course_id:<12} {width:>5}  NO REPORT     {result.stdout.strip()[:80]} {result.stderr.strip()[:120]}")
        return {"label": f"{course_id}@{width} {state}", "ok": False, "report": None, "courseId": course_id,
                "width": width, "state": state, "seconds": round(time.time() - started, 1)}
    return {
        "label": f"{course_id}@{width} {state}",
        "ok": bool(report.get("ok")),
        "report": report,
        "courseId": course_id,
        "width": width,
        "state": state,
        "seconds": round(time.time() - started, 1),
    }


def main():
    os.makedirs(TEMP, exist_ok=True)
    swarm = load("sw", "scripts/browser-sweep-defence.py")
    swarm.require_websocket()

    rows = []
    print("certified journeys")
    for course_id, route in COURSES:
        for width in WIDTHS:
            rows.append(run_journey(course_id, route, width, "certified", f"cert{width}"))

    print("uncertified journeys (course complete, assessment below the pass mark)")
    for course_id, route, width in [("ages-10-12", "/learn", 320), ("ages-13-15", "/learn/13-15", 768), ("adults", "/learn/adults", 1440)]:
        rows.append(run_journey(course_id, route, width, "ready", f"ready{width}"))

    print("\nlabel                            ok     screens  pages  credential                    seconds")
    for row in rows:
        report = row["report"] or {}
        facts = report.get("facts", {})
        print(f'{row["label"]:<32} {row["ok"]!s:<6} {len(report.get("screens", [])):>7}  '
              f'{str(facts.get("printedPages", "-")):>5}  {str(facts.get("credentialId", "-")):<28} {row.get("seconds", "-")}')

    failures = [row["label"] for row in rows if not row["ok"]]
    certified = {row["courseId"] for row in rows if row["state"] == "certified" and row["ok"]}
    pages_ok = [row for row in rows if row["state"] == "certified" and row["report"] and row["report"].get("facts", {}).get("printedPages") == 1]
    credentials = {
        row["report"]["facts"].get("credentialId")
        for row in rows if row["report"] and row["report"].get("facts", {}).get("credentialId")
    }

    print(f"\njourneys finished {len(rows) - len(failures)} of {len(rows)}")
    print(f"certified courses {sorted(certified)} (of 4)")
    print(f"one-page print proofs {len(pages_ok)} (of 12)")
    print(f"distinct credential ids {len(credentials)} (of 12)")
    for failure in failures:
        print("  FAILED:", failure)
    if len(certified) != 4:
        print("NOT COMPLETE: every course must reach a certified browser journey")
        raise SystemExit(1)
    if len(pages_ok) != 12:
        print("NOT COMPLETE: every certificate must print on one page")
        raise SystemExit(1)
    if len(credentials) != 12:
        print("NOT COMPLETE: every journey must carry its own credential id")
        raise SystemExit(1)
    if failures:
        raise SystemExit(1)
    print("certificate browser sweep passed")


if __name__ == "__main__":
    main()