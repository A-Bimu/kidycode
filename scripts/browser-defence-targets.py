"""Targeted defence journeys: one real Passed per course and Needs verification at each viewport.

The setup is deterministic and server-side. This harness reads which reviewed template the route
assigned to the submitted attempt, the reviewed correct prediction and a small change that the
production grader accepts (or one it genuinely cannot decide), then types those values into the
real browser interface. The learner still submits through the normal routes and the server still
decides the outcome; nothing writes a status into the database and there is no test-only route.

The harness fails loudly when the expected result is not reached, when the browser and the stored
row disagree, when an answer index reaches the client, when a screen is skipped or when a run
exits early.

Usage:
  python scripts/browser-defence-targets.py
"""

import importlib.util
import json
import os
import sqlite3
import subprocess
import sys
import time

TEMP = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "journeys")

PASSED_TARGETS = [
    ("ages-10-12", "/learn", 320),
    ("ages-13-15", "/learn/13-15", 768),
    ("ages-16-18", "/learn/16-18", 1440),
    ("adults", "/learn/adults", 768),
]
UNDECIDABLE_TARGETS = [
    ("ages-10-12", "/learn", 320),
    ("ages-13-15", "/learn/13-15", 768),
    ("ages-16-18", "/learn/16-18", 1440),
]

EXPLANATION = (
    "I put the list inside the main region so the page has one clear main area, and the headings "
    "step down one level at a time so a reader can follow the shape of the page. I kept the styles "
    "in one place so a change to the colour shows everywhere that reads it."
)


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def find_database():
    directory = os.path.join(os.getcwd(), ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject")
    files = sorted(name for name in os.listdir(directory)
                   if name.endswith(".sqlite") and name != "metadata.sqlite")
    if not files:
        raise SystemExit("HARNESS: no local D1 database file was found.")
    return os.path.join(directory, files[-1])


def attempt_for(learner_id):
    database = sqlite3.connect(find_database())
    try:
        row = database.execute(
            "SELECT id, outcome, needs_verification, defence_passed FROM assessment_attempts "
            "WHERE learner_id = ? AND kind = 'final' ORDER BY started_at DESC LIMIT 1", (learner_id,)
        ).fetchone()
    finally:
        database.close()
    if not row:
        raise SystemExit(f"HARNESS: no final attempt was found for learner {learner_id}")
    return {"id": row[0], "outcome": row[1], "needsVerification": row[2], "defencePassed": row[3]}


def defence_row(attempt_id):
    database = sqlite3.connect(find_database())
    try:
        row = database.execute(
            "SELECT status, predict_correct, change_status FROM assessment_defence WHERE attempt_id = ?",
            (attempt_id,),
        ).fetchone()
    finally:
        database.close()
    return {"status": row[0], "predictCorrect": row[1], "changeStatus": row[2]} if row else None


def fixture(attempt_id):
    result = subprocess.run(
        ["node", "--import", "tsx", "--no-warnings", "scripts/defence-fixture.mjs", attempt_id],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise SystemExit(f"HARNESS: the fixture could not be read: {result.stderr.strip()[:300]}")
    return json.loads(result.stdout)


def run_target(dj, sw, course_id, route, width, expect, attempts=4):
    """Run one targeted journey. For Needs verification the assigned template matters: the engine
    refuses to guess when a change asks for one more of something and the learner submitted no
    code to compare against, so a fresh learner is used until such a template is assigned. Every
    attempt is a real browser journey through the normal interface."""
    last = None
    for attempt_index in range(attempts):
        last = run_once(dj, sw, course_id, route, width, expect, attempt_index)
        if last["outcome"] == expect and last["ok"]:
            return last
        if expect == "Passed":
            return last
        reason = last.get("skipReason") or (last["problems"][0] if last["problems"] else last["outcome"])
        print(f"    retrying: {reason}")
    return last


def run_once(dj, sw, course_id, route, width, expect, attempt_index):
    label = f"{course_id}@{width}px -> {expect}"
    report_path = os.path.join(TEMP, f"target-{course_id}-{width}-{expect.replace(' ', '')}-{attempt_index}.json")
    if os.path.exists(report_path):
        os.remove(report_path)

    cookie, seed_data = sw.seed(course_id, width, f"t{width}{expect[:2]}{attempt_index}")
    bj = dj.load_driver()
    bj.ensure_chrome()
    page = bj.Page()
    page.send("Network.enable")
    page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie.split("=", 1)[1],
                                    "domain": "localhost", "path": "/", "url": bj.BASE})
    screens = []

    def capture(name):
        screen = bj.audit(page, f"{width} {name}")
        screens.append(screen)
        return screen

    page.width(width)
    page.goto(f"{bj.BASE}{route}")
    capture("course")
    text = page.evaluate("document.body.innerText") or ""
    if "Module checks" not in text:
        raise SystemExit(f"FAILED {label}: the learner is not authenticated")

    page.click("Module checks")
    capture("choose")
    if not page.click("Start the final assessment").get("clicked"):
        raise SystemExit(f"FAILED {label}: the final assessment could not be started")
    capture("final overview")
    page.click("Start the questions")
    for _ in range(9):
        page.click("Next question")
    page.click("Go to the practical task")
    time.sleep(1.0)
    for _ in range(3):
        page.click("Next task")
    page.click("Review before submitting")
    page.click("Submit for marking")
    capture("results")

    if not page.click("Start the code defence").get("clicked"):
        raise SystemExit(f"FAILED {label}: the code defence could not be started")
    capture("defence intro")
    page.click("Start the explain task")
    dj.type_into(page, "#defence-explain", EXPLANATION)

    # The fixture is read now, from the attempt the browser really submitted.
    attempt = attempt_for(seed_data["learnerId"])
    facts = fixture(attempt["id"])
    change = facts["satisfyingChange"] if expect == "Passed" else facts["undecidableChange"]
    if change is None and expect == "Needs verification":
        # A decidable template for this attempt: nothing was handed in that the engine cannot
        # decide, so this attempt is not the evidence we need. Try again with a fresh learner.
        report = {"label": label, "courseId": course_id, "width": width, "expect": expect,
                  "outcome": "Not reached", "ok": False, "attemptAfter": attempt,
                  "skipReason": f"template {facts['templateId']} is decidable for this submission "
                                f"({facts['statuses']})", "problems": [], "screens": len(screens)}
        with open(report_path, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=1)
        return report
    if change is None:
        raise SystemExit(f"FAILED {label}: no {expect} change is reachable for template {facts['templateId']} "
                         f"(grader returned {facts['statuses']}); this is a product defect, not a harness problem")
    prediction = facts["predictAnswer"] if isinstance(facts["predictAnswer"], int) else 0

    page.click("Save and continue")
    capture("defence predict")
    picked = dj.pick_prediction(page, prediction)
    if not picked.get("picked"):
        raise SystemExit(f"FAILED {label}: the reviewed prediction could not be selected")
    page.click("Save and continue")
    capture("defence change")
    for filename, code in change.items():
        if code:
            dj.type_into(page, f"#defence-change-{filename}", code)
    page.click("Save and continue")

    # Keyboard focus and reduced motion on the last screen before submitting.
    tabs = bj.tab_through(page, 3)
    page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
    motion = bj.reduced_motion(page)
    page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]})
    capture("defence review")

    # The client projection is checked for an answer index before the decision is made, by
    # asking the same route the interface uses.
    projection = json.loads(page.evaluate(
        "(async () => {"
        f" const r = await fetch('/api/assessment/defence?attemptId={attempt['id']}');"
        " const text = await r.text();"
        " return JSON.stringify({ status: r.status, hasAnswer: /\"answer\"/.test(text),"
        " hasCorrectAnswer: /correctAnswer/.test(text), hasSignals: /pasteEvents|visibilityChanges/.test(text),"
        " bytes: text.length }); })()"
    ))

    page.click("Submit the defence")
    time.sleep(2.5)
    result = capture("defence result")
    outcome = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
    body = page.evaluate("document.body.innerText") or ""
    stored = defence_row(attempt["id"])
    after = attempt_for(seed_data["learnerId"])

    for screen in screens:
        dj.check_screen(screen, screen["screen"])

    problems = []
    if outcome != expect:
        problems.append(f"the result screen showed {outcome!r}, expected {expect!r}")
    if not stored:
        problems.append("no defence row was stored")
    elif stored["status"] != ("passed" if expect == "Passed" else "needs-verification"):
        problems.append(f"the stored decision is {stored['status']}, expected {expect}")
    if expect == "Passed" and after["defencePassed"] != 1:
        problems.append("the attempt did not record a passed defence")
    if expect == "Needs verification" and after["needsVerification"] != 1:
        problems.append("the attempt did not record Needs verification")
    if expect == "Needs verification" and "person" not in body:
        problems.append("the learner was not given the plain-language next step")
    if projection["hasAnswer"] or projection["hasCorrectAnswer"]:
        problems.append(f"an answer index reached the client: {projection}")
    if projection["hasSignals"]:
        problems.append("an integrity signal reached the client")
    if projection["status"] != 200:
        problems.append(f"the defence payload answered {projection['status']}")
    if len(tabs) < 1 or not all("outline" in tab for tab in tabs):
        problems.append("keyboard focus produced no focus ring")
    if motion and "0s" not in str(motion):
        problems.append(f"reduced motion was not respected: {motion}")
    if result["liveRegions"] < 1:
        problems.append("the result screen announced nothing")

    report = {
        "label": label, "courseId": course_id, "width": width, "expect": expect,
        "outcome": outcome, "templateId": facts["templateId"],
        "predictAnswer": facts["predictAnswer"], "changeKind": facts["changeRequirementKind"],
        "stored": stored, "attemptAfter": after, "tabs": tabs, "motion": motion,
        "projection": projection, "screens": len(screens), "problems": problems, "ok": not problems,
    }
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=1)
    print(f'  {label}: screen={outcome} stored={stored["status"] if stored else None} '
          f'attempt={after["outcome"]} template={facts["templateId"]} screens={len(screens)} ok={not problems}')
    for problem in problems:
        print(f"    PROBLEM: {problem}")
    return report


def main():
    dj = load("dj", "scripts/browser-journey-defence.py")
    sw = load("sw", "scripts/browser-sweep-defence.py")
    sw.require_websocket()
    os.makedirs(TEMP, exist_ok=True)

    reports = []
    for course_id, route, width in PASSED_TARGETS:
        reports.append(run_target(dj, sw, course_id, route, width, "Passed"))
    for course_id, route, width in UNDECIDABLE_TARGETS:
        reports.append(run_target(dj, sw, course_id, route, width, "Needs verification"))
    print("\nlabel                          outcome            stored             attempt            ok")
    for report in reports:
        print(f'{report["label"]:<30} {report["outcome"]:<18} '
              f'{report["stored"]["status"] if report["stored"] else "-":<18} {report["attemptAfter"]["outcome"]:<18} {report["ok"]}')

    passed_courses = {report["courseId"] for report in reports if report["expect"] == "Passed" and report["outcome"] == "Passed"}
    needed_widths = {report["width"] for report in reports
                     if report["expect"] == "Needs verification" and report["outcome"] == "Needs verification"}
    failures = [report["label"] for report in reports if not report["ok"]]

    print(f"\npassed courses {sorted(passed_courses)} (of 4), Needs verification widths {sorted(needed_widths)} (of 3)")
    for failure in failures:
        print("  FAILED:", failure)
    if len(passed_courses) != 4:
        print("NOT COMPLETE: every course must produce a real browser Passed result")
        raise SystemExit(1)
    if needed_widths != {320, 768, 1440}:
        print("NOT COMPLETE: Needs verification must be observed at all three viewports")
        raise SystemExit(1)
    if failures:
        raise SystemExit(1)
    print("targeted defence journeys passed")


if __name__ == "__main__":
    main()