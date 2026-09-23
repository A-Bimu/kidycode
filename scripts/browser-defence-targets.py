"""Targeted defence journeys: a real Passed per course, a real Not passed yet, and a real technical
retry at each viewport.

The setup is deterministic and server-side. This harness reads which reviewed template the route
assigned to the attempt the browser really submitted, the reviewed correct prediction, and a small
change the production grader accepts. It then types those values into the real browser interface.
The learner still submits through the normal routes and the server still decides the outcome:
nothing writes a status into the database, there is no test-only route, and no answer index is
exposed to the page.

The three expectations:
  Passed            a meaningful explanation, the reviewed correct prediction and a satisfied change
  Not passed yet    a thin explanation, so the outcome is missing understanding, not missing code
  Technical retry   the defence submitted with no usable project code, so the reviewed change has no
                    baseline to compare against. The route must not decide anything: it hands back
                    the neutral retryable message, offers a different equivalent task, and when every
                    equivalent task is exhausted returns the documented retryable technical response.
                    The learner's own words are kept and the stored decision stays unfinished.

The harness fails loudly when the expected result is not reached, when the browser and the stored row
disagree, when an answer index or integrity signal reaches the client, when a screen is skipped, when
work is lost, or when a run exits early.

Usage:
  python scripts/browser-defence-targets.py
"""

import importlib.util
import json
import os
import sqlite3
import subprocess
import time

TEMP = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "journeys")

# The four course journeys are spread across the three viewports so every viewport is represented.
PASSED_TARGETS = [
    ("ages-10-12", "/learn", 320),
    ("ages-13-15", "/learn/13-15", 768),
    ("ages-16-18", "/learn/16-18", 1440),
    ("adults", "/learn/adults", 320),
]
NOT_PASSED_TARGETS = [
    ("ages-10-12", "/learn", 768),
    ("ages-13-15", "/learn/13-15", 1440),
    ("adults", "/learn/adults", 768),
]
TECHNICAL_TARGETS = [
    ("ages-10-12", "/learn", 320),
    ("ages-10-12", "/learn", 768),
    ("ages-10-12", "/learn", 1440),
]

# The reviewed template whose change the grader genuinely cannot decide when the learner handed in no
# project code to compare against. Only the starting state is seeded: the browser still submits the
# defence through the normal interface and the server still decides.
UNDECIDABLE_TEMPLATE = "ages-10-12-defence-2"

EXPLANATION = (
    "I put the list inside the main region so the page has one clear main area, and the headings "
    "step down one level at a time so a reader can follow the shape of the page. I kept the styles "
    "in one place so a change to the colour shows everywhere that reads it."
)
THIN_EXPLANATION = "It is right."
NEUTRAL_RETRY = "We could not check this change. Your work is saved. Try a different equivalent task."
RETRY_SCREEN = "Try a different equivalent task"


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


# A small realistic learner project, shaped like the course's own build task: semantic regions, a
# heading order, a list, a fragment link, a described image, readable styling, a responsive rule and
# one scripted interaction. It is typed through the real editors, exactly as a learner would.
PROJECT = {
    "html": (
        "<!doctype html>\n<html lang=\"en\">\n<head><meta name=\"viewport\" content=\"width=device-width, "
        "initial-scale=1\"><title>My club</title></head>\n<body>\n<header><h1>My club</h1>"
        "<nav><a href=\"#news\">News</a></nav></header>\n<main>\n<section id=\"news\"><h2>This week</h2>"
        "<p>We meet on Saturday in the hall.</p>\n<ul><li>Biscuits</li><li>Badges</li><li>Photos</li></ul>"
        "</section>\n<section id=\"models\"><h2>Our models</h2><p role=\"status\">Ready</p></section>\n"
        "</main>\n<img src=\"club.webp\" alt=\"The club table with three finished models\">\n"
        "<button id=\"more\" type=\"button\">Show more</button>\n<footer><p>A club page by a member.</p>"
        "</footer>\n</body>\n</html>"
    ),
    "css": (
        "body { line-height: 1.6; color: #111936; font-family: system-ui, sans-serif; }\n"
        "nav { display: flex; flex-wrap: wrap; gap: 1rem; }\n"
        "img { max-width: 100%; height: auto; }\n"
        ".card { padding: 1rem; border: 2px solid #111936; }\n"
        "a:focus-visible, button:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }\n"
        "@media (min-width: 600px) { .cards { grid-template-columns: repeat(3, 1fr); } }"
    ),
    "javascript": (
        "const status = document.querySelector('#models p');\n"
        "const button = document.querySelector('#more');\n"
        "button.addEventListener('click', function () { status.textContent = 'Showing every model'; });"
    ),
}

TYPE_PROJECT = r"""
((project) => {
  const editors = [...document.querySelectorAll("textarea")];
  let filled = 0;
  const files = [];
  for (const el of editors) {
    const id = el.id || "";
    const file = id.slice(id.lastIndexOf("-") + 1);
    if (!(file in project)) continue;
    const proto = HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, project[file]);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    filled += 1;
    files.push(file);
  }
  return JSON.stringify({ filled, files });
})(%s)
"""


def type_project(page):
    return json.loads(page.evaluate(TYPE_PROJECT % json.dumps(PROJECT)))


def run_target(dj, sw, course_id, route, width, expect, attempts=1):
    last = None
    for attempt_index in range(attempts):
        last = run_once(dj, sw, course_id, route, width, expect, attempt_index)
        if last["ok"]:
            return last
        print(f"    retrying: {last['problems'][0] if last['problems'] else last['outcome']}")
    return last


def run_once(dj, sw, course_id, route, width, expect, attempt_index):
    label = f"{course_id}@{width}px -> {expect}"
    report_path = os.path.join(TEMP, f"target-{course_id}-{width}-{expect.replace(' ', '')}-{attempt_index}.json")
    if os.path.exists(report_path):
        os.remove(report_path)

    cookie, seed_data = sw.seed(course_id, width, f"t{width}{expect[:2]}{attempt_index}")
    seeded_attempt = None
    if expect == "Technical retry":
        seeded = subprocess.run(
            ["node", "--import", "tsx", "--no-warnings", "scripts/defence-verify-seed.mjs",
             course_id, UNDECIDABLE_TEMPLATE, f"Tech{width}Retry"],
            capture_output=True, text=True, check=False,
        )
        if seeded.returncode != 0:
            raise SystemExit(f"HARNESS: {course_id} has no undecidable-by-design change template: "
                             f"{seeded.stderr.strip()[:240]}")
        seeded_attempt = json.loads(seeded.stdout.strip().splitlines()[-1])
        cookie = seeded_attempt["cookie"]
        seed_data = {"learnerId": seeded_attempt["learnerId"]}

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
    # A real learner hands in a project, and the reviewed change requirements are compared against
    # it: an empty submission would leave some reviewed changes with nothing to evaluate, which is
    # exactly the technical-retry case rather than a Passed or Not passed yet journey.
    typed_project = None
    for _ in range(3):
        if expect != "Technical retry":
            typed_project = type_project(page)
        page.click("Next task")
    page.click("Review before submitting")
    page.click("Submit for marking")
    capture("results")

    if not page.click("Start the code defence").get("clicked"):
        raise SystemExit(f"FAILED {label}: the code defence could not be started")
    capture("defence intro")
    page.click("Start the explain task")
    dj.type_into(page, "#defence-explain", THIN_EXPLANATION if expect == "Not passed yet" else EXPLANATION)

    # The fixture is read now, from the attempt the browser really submitted.
    attempt = attempt_for(seed_data["learnerId"])
    facts = fixture(attempt["id"])
    if seeded_attempt and facts["templateId"] != seeded_attempt["templateId"]:
        raise SystemExit(f"FAILED {label}: the route assigned {facts['templateId']} but the seeded id "
                         f"was chosen for {seeded_attempt['templateId']}")
    if expect != "Technical retry" and facts["satisfyingChange"] is None:
        raise SystemExit(f"FAILED {label}: no change satisfies template {facts['templateId']} "
                         f"(grader returned {facts['statuses']}); this is a product defect")
    prediction = facts["predictAnswer"] if isinstance(facts["predictAnswer"], int) else 0

    page.click("Save and continue")
    capture("defence predict")
    picked = dj.pick_prediction(page, prediction)
    if not picked.get("picked"):
        raise SystemExit(f"FAILED {label}: the reviewed prediction could not be selected")
    page.click("Save and continue")
    capture("defence change")
    if expect != "Technical retry":
        for filename, code in (facts["satisfyingChange"] or {}).items():
            if code:
                dj.type_into(page, f"#defence-change-{filename}", code)
    page.click("Save and continue")

    tabs = bj.tab_through(page, 3)
    page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
    motion = bj.reduced_motion(page)
    page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]})
    capture("defence review")

    projection = json.loads(page.evaluate(
        "(async () => {"
        f" const r = await fetch('/api/assessment/defence?attemptId={attempt['id']}');"
        " const text = await r.text();"
        " return JSON.stringify({ status: r.status, hasAnswer: /\\\"answer\\\"/.test(text),"
        " hasCorrectAnswer: /correctAnswer/.test(text), hasSignals: /pasteEvents|visibilityChanges/.test(text),"
        " hasNeedsVerification: /needsVerification/.test(text), bytes: text.length }); })()"
    ))

    page.click("Submit the defence")
    time.sleep(2.5)
    result = capture("defence result")
    outcome = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
    body = page.evaluate("document.body.innerText") or ""
    stored = defence_row(attempt["id"])
    after = attempt_for(seed_data["learnerId"])

    retry_rounds = 0
    technical_message = None
    while expect == "Technical retry" and outcome == RETRY_SCREEN and retry_rounds < 4:
        retry_rounds += 1
        if NEUTRAL_RETRY not in body:
            raise SystemExit(f"FAILED {label}: the retry screen did not carry the neutral message")
        if "Nothing has been lost" not in body:
            raise SystemExit(f"FAILED {label}: the retry screen did not say the work is kept")
        row_now = defence_row(attempt["id"])
        if not row_now or row_now["status"] != "pending":
            raise SystemExit(f"FAILED {label}: the retry recorded a decision ({row_now})")
        # The interface re-opens the defence with a different equivalent task; submit again.
        page.click("Open the different task")
        time.sleep(1.5)
        capture(f"defence retry {retry_rounds}")
        for step in ("Start the explain task",):
            page.click(step)
        dj.type_into(page, "#defence-explain", EXPLANATION)
        page.click("Save and continue")
        dj.pick_prediction(page, prediction)
        page.click("Save and continue")
        page.click("Save and continue")
        page.click("Submit the defence")
        time.sleep(2.5)
        capture(f"defence retry result {retry_rounds}")
        technical_message = page.evaluate("document.body.innerText") or ""
        outcome = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")

    stored = defence_row(attempt["id"])
    after = attempt_for(seed_data["learnerId"])
    resumed = json.loads(page.evaluate(
        "(async () => {"
        f" const r = await fetch('/api/assessment/defence?attemptId={attempt['id']}');"
        " const body = await r.json();"
        " return JSON.stringify({ status: r.status, defenceStatus: body.defence && body.defence.status,"
        " explainKept: !!(body.defence && body.defence.explainResponse),"
        " hasChange: !!(body.defence && body.defence.change && body.defence.change.instruction) }); })()"
    ))

    for screen in screens:
        dj.check_screen(screen, screen["screen"])

    problems = []
    if outcome != expect:
        problems.append(f"the result screen showed {outcome!r}, expected {expect!r}")
    if not stored:
        problems.append("no defence row was stored")
    if expect == "Passed":
        if stored and stored["status"] != "passed":
            problems.append(f"the stored decision is {stored['status']}, expected passed")
        if after["defencePassed"] != 1:
            problems.append("the attempt did not record a passed defence")
        if after["outcome"] != "passed":
            problems.append(f"the stored attempt outcome is {after['outcome']}, expected passed")
    if expect == "Not passed yet":
        if stored and stored["status"] != "not_passed":
            problems.append(f"the stored decision is {stored['status']}, expected not_passed")
        if after["outcome"] != "not_passed_yet":
            problems.append(f"the stored attempt outcome is {after['outcome']}, expected not_passed_yet")
        if "revision" not in body.lower():
            problems.append("Not passed yet did not point the learner at revision material")
    if expect == "Technical retry":
        if retry_rounds < 1:
            problems.append("the retryable technical response was never reached through the interface")
        if technical_message is None or NEUTRAL_RETRY not in technical_message:
            problems.append("the neutral retryable message was never shown to the learner")
        if stored and stored["status"] != "pending":
            problems.append(f"an unfinished defence stored the decision {stored['status']}")
        if after["outcome"] == "not_passed_yet":
            problems.append("the unfinished defence recorded Not passed yet")
        if after["needsVerification"] != 0 and expect != "Technical retry":
            problems.append("a learner-facing technical state was recorded")
        if resumed["status"] != 200 or resumed["defenceStatus"] != "pending":
            problems.append(f"the unfinished defence could not be resumed: {resumed}")
        if not resumed["explainKept"]:
            problems.append("the learner's explanation was lost")
        if not resumed["hasChange"]:
            problems.append("the unfinished defence lost its change task")
    if expect != "Technical retry" and (not typed_project or typed_project.get("filled", 0) < 1):
        problems.append(f"the learner handed in no project code, so this was not a realistic journey: {typed_project}")
    if projection["hasAnswer"] or projection["hasCorrectAnswer"]:
        problems.append(f"an answer index reached the client: {projection}")
    if projection["hasSignals"]:
        problems.append("an integrity signal reached the client")
    if projection["hasNeedsVerification"]:
        problems.append("the internal undecidable value reached the client")
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
        "outcome": outcome, "templateId": facts["templateId"], "changeKind": facts["changeRequirementKind"],
        "typedProject": typed_project,
        "retryRounds": retry_rounds, "stored": stored, "attemptAfter": after, "resumed": resumed,
        "tabs": tabs, "motion": motion, "projection": projection, "screens": len(screens),
        "problems": problems, "ok": not problems,
    }
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=1)
    print(f'  {label}: screen={outcome} stored={stored["status"] if stored else None} '
          f'attempt={after["outcome"]} retries={retry_rounds} template={facts["templateId"]} '
          f'screens={len(screens)} ok={not problems}')
    for problem in problems:
        print(f"    PROBLEM: {problem}")
    return report


def main():
    dj = load("dj", "scripts/browser-journey-defence.py")
    sw = load("sw", "scripts/browser-sweep-defence.py")
    sw.require_websocket()
    os.makedirs(TEMP, exist_ok=True)

    reports = []
    print("Passed journeys")
    for course_id, route, width in PASSED_TARGETS:
        reports.append(run_target(dj, sw, course_id, route, width, "Passed"))
    print("Not passed yet journeys")
    for course_id, route, width in NOT_PASSED_TARGETS:
        reports.append(run_target(dj, sw, course_id, route, width, "Not passed yet"))
    print("Technical retry journeys")
    for course_id, route, width in TECHNICAL_TARGETS:
        reports.append(run_target(dj, sw, course_id, route, width, "Technical retry"))

    print("\nlabel                          outcome                     stored             attempt            ok")
    for report in reports:
        stored = report["stored"]["status"] if report["stored"] else "-"
        print(f'{report["label"]:<30} {report["outcome"]:<27} {stored:<18} '
              f'{report["attemptAfter"]["outcome"]:<18} {report["ok"]}')

    passed = {report["courseId"] for report in reports if report["expect"] == "Passed" and report["outcome"] == "Passed" and report["ok"]}
    not_passed = {report["width"] for report in reports if report["expect"] == "Not passed yet" and report["outcome"] == "Not passed yet" and report["ok"]}
    technical = {report["width"] for report in reports if report["expect"] == "Technical retry" and report["ok"]}
    failures = [report["label"] for report in reports if not report["ok"]]

    print(f"\npassed courses {sorted(passed)} (of 4), Not passed yet widths {sorted(not_passed)} (of 3), "
          f"technical retry widths {sorted(technical)} (of 3)")
    for failure in failures:
        print("  FAILED:", failure)
    if len(passed) != 4:
        print("NOT COMPLETE: every course must produce a real browser Passed result")
        raise SystemExit(1)
    if not_passed != {768, 1440}:
        print("NOT COMPLETE: Not passed yet must be observed in the browser")
        raise SystemExit(1)
    if technical != {320, 768, 1440}:
        print("NOT COMPLETE: the technical retry must be observed at all three viewports")
        raise SystemExit(1)
    if failures:
        raise SystemExit(1)
    print("targeted defence journeys passed")


if __name__ == "__main__":
    main()
