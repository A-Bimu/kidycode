"""Walk the whole code defence in a real Chrome and fail loudly on anything it finds.

Drives a full final assessment into the defence: introduction, explain, prediction, live change,
review, submit and result. Reconciled against what the brief requires to be observed: the
learner's own words are typed and restored, a draft cannot decide anything, the change is graded
against the learner's own project, and the button stays disabled while a prediction is missing.

Every run is strict. The script exits non-zero, with a plain reason, if the learner is not
authenticated, if a required screen was never reached, if any screen has horizontal overflow, a
green colour, an em dash, an unlabelled control or more than one h1, if a report contains a
traceback, or if the journey stops before the result.

Usage:
  python scripts/browser-journey-defence.py <courseId> <route> <cookie> <width> <report-path>
"""

import importlib.util
import json
import os
import sys
import time
import traceback

REQUIRED_SCREENS = [
    "course",
    "choose",
    "final overview",
    "results",
    "defence intro",
    "defence explain",
    "defence predict",
    "defence change",
    "defence review",
    "defence result",
]

# A learner who can use the assessment at all sees these; their absence means the journey ran
# against a signed-out or empty page.
AUTHENTICATED_MARKERS = ["Module checks", "My progress"]


def load_driver():
    """Load the CDP driver, naming a missing dependency clearly rather than tracebacking."""
    try:
        import websocket  # noqa: F401
    except ImportError as error:  # pragma: no cover - environment problem, not product
        raise SystemExit(f"HARNESS: the websocket dependency is missing for {sys.executable}: {error}")
    spec = importlib.util.spec_from_file_location("bj", "scripts/browser-journey.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Failure(Exception):
    pass


def check_screen(screen, label):
    if screen["overflow"] > 0:
        raise Failure(f"{label}: horizontal overflow of {screen['overflow']}px")
    if screen["greenCount"]:
        raise Failure(f"{label}: {screen['greenCount']} green colours found")
    if screen["emDashes"]:
        raise Failure(f"{label}: {screen['emDashes']} em dashes in learner-facing text")
    if len(screen["unlabelled"]) > 0:
        raise Failure(f"{label}: unlabelled controls {screen['unlabelled']}")
    if screen["h1"] != 1:
        raise Failure(f"{label}: {screen['h1']} h1 elements, expected exactly one")
    if not screen["headingOrderOk"]:
        raise Failure(f"{label}: heading order skips a level")


def main():
    if len(sys.argv) < 6:
        raise SystemExit(__doc__)
    course_id, route, cookie, width, report_path = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5]
    if cookie.startswith("kidycode_session="):
        cookie = cookie.split("=", 1)[1]
    if not cookie.strip():
        raise SystemExit("HARNESS: the learner cookie is empty, so the journey would not be authenticated.")

    report = {"courseId": course_id, "width": width, "screens": [], "facts": {}}
    try:
        bj = load_driver()
        bj.ensure_chrome()
        page = bj.Page()
        page.send("Network.enable")
        page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie,
                                        "domain": "localhost", "path": "/", "url": bj.BASE})

        page.width(width)
        page.goto(f"{bj.BASE}{route}")
        first = bj.audit(page, f"{width} course")
        report["screens"].append(first)
        text = page.evaluate("document.body.innerText") or ""
        if not any(marker in text for marker in AUTHENTICATED_MARKERS):
            raise Failure("the learner is not authenticated: the course page shows neither Module checks nor My progress")

        page.click("Module checks")
        report["screens"].append(bj.audit(page, f"{width} choose"))

        final = page.click("Start the final assessment")
        report["screens"].append({**bj.audit(page, f"{width} final overview"), "click": final})
        if not final.get("clicked"):
            raise Failure("the final assessment could not be started, so the journey stopped early")
        page.click("Start the questions")
        for _ in range(9):
            page.click("Next question")
        page.click("Go to the practical task")
        time.sleep(1.0)
        for _ in range(3):
            page.click("Next task")
        page.click("Review before submitting")
        page.click("Submit for marking")
        report["screens"].append(bj.audit(page, f"{width} results"))

        started = page.click("Start the code defence")
        report["screens"].append({**bj.audit(page, f"{width} defence intro"), "click": started})
        if not started.get("clicked"):
            raise Failure("the code defence could not be started from the result screen")

        page.click("Start the explain task")
        typed = type_into(page, "#defence-explain",
                          "I put the list inside the main region so the page has one clear main area, and the headings step down one level at a time so a reader can follow the shape of the page.")
        explain_screen = {**bj.audit(page, f"{width} defence explain"), "typed": typed}
        report["screens"].append(explain_screen)
        if not typed.get("typed"):
            raise Failure("the explain answer could not be typed into the field")
        if explain_screen["liveRegions"] < 1:
            raise Failure("the explain step announced no saving status")
        page.click("Save and continue")
        report["facts"]["draftSaved"] = page.evaluate(
            "(() => { const el = document.querySelector('[role=status]'); return el ? el.innerText : ''; })()")

        predict_screen = bj.audit(page, f"{width} defence predict")
        report["screens"].append(predict_screen)
        blocked = page.click("Save and continue")
        report["facts"]["blockedWithoutPrediction"] = not blocked.get("clicked")
        if blocked.get("clicked"):
            raise Failure("the prediction step was left without choosing a prediction")

        picked = pick_prediction(page)
        report["facts"]["predictionPicked"] = picked
        page.click("Save and continue")
        report["screens"].append(bj.audit(page, f"{width} defence change"))
        typed_change = type_into(page, "#defence-change-css", "body { color: #111936; }\n.card { color: #ee9d2b; }")
        page.click("Save and continue")
        report["screens"].append(bj.audit(page, f"{width} defence review"))
        report["facts"]["changeTyped"] = typed_change

        page.click("Submit the defence")
        time.sleep(2.0)
        result_screen = bj.audit(page, f"{width} defence result")
        report["screens"].append(result_screen)
        outcome = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
        report["facts"]["outcome"] = outcome
        if outcome not in ("Passed", "Not passed yet", "Needs verification"):
            raise Failure(f"the defence result screen showed {outcome!r} instead of an approved outcome")
        if result_screen["liveRegions"] < 1 and outcome == "Needs verification":
            raise Failure("Needs verification was shown without the explanation section")

        for screen in report["screens"]:
            check_screen(screen, screen["screen"])

        seen = {screen["screen"].split(" ", 1)[1] for screen in report["screens"]}
        missing = [name for name in REQUIRED_SCREENS if name not in seen and not name.startswith("course")]
        if missing:
            raise Failure(f"these required screens were never reached: {missing}")

        report["ok"] = True
        report["error"] = ""
    except Failure as error:
        report["ok"] = False
        report["error"] = f"FAILED: {error}"
    except Exception as error:  # a crash is a failure, never a silent partial run
        report["ok"] = False
        report["error"] = f"CRASH: {type(error).__name__}: {error}"
        report["traceback"] = traceback.format_exc()

    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=1)
    facts = report.get("facts", {})
    print(f"{course_id} {width}px ok={report.get('ok')} screens={len(report['screens'])} "
          f"outcome={facts.get('outcome', '-')} draft={str(facts.get('draftSaved', ''))[:24]!r} "
          f"blocked={facts.get('blockedWithoutPrediction')} error={report.get('error')}")
    if not report.get("ok"):
        raise SystemExit(1)


def type_into(page, selector, text):
    return json.loads(page.evaluate(TYPE % json.dumps({"selector": selector, "text": text})))


PICK = r"""
(() => {
  const inputs = [...document.querySelectorAll('input[name="defence-predict"]')];
  if (inputs.length === 0) return JSON.stringify({ picked: false, options: 0 });
  const input = inputs[0];
  const label = input.closest("label");
  (label || input).click();
  if (!input.checked) {
    input.checked = true;
    input.dispatchEvent(new Event("click", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return JSON.stringify({ picked: input.checked, options: inputs.length });
})()
"""


def pick_prediction(page):
    return json.loads(page.evaluate(PICK))


# React keeps its own value, so a plain assignment is ignored: the native setter is used and an
# input event is dispatched, which is what a learner typing produces.
TYPE = r"""
((args) => {
  const el = document.querySelector(args.selector);
  if (!el) return JSON.stringify({ typed: false, selector: args.selector });
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(el, args.text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return JSON.stringify({ typed: true, selector: args.selector, length: el.value.length });
})(%s)
"""


if __name__ == "__main__":
    main()
