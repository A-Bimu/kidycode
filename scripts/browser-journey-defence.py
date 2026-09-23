"""Walk the code defence in a real Chrome and audit every step.

Reuses the CDP driver in scripts/browser-journey.py, then drives the learner through a whole
final assessment into the defence: introduction, explain, prediction, live change, review,
submit and result, watching for horizontal overflow, green, em dashes, labelling, live regions
and focus at each of the three viewports.

Usage:
  python scripts/browser-journey-defence.py <courseId> <route> <cookie> [widths...]
"""

import importlib.util
import json
import sys
import time

spec = importlib.util.spec_from_file_location("bj", "scripts/browser-journey.py")
bj = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bj)

# React keeps its own value, so a plain assignment would be ignored: the native setter is used
# and an input event is dispatched, which is what a learner typing produces.
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


def type_into(page, selector, text):
    return json.loads(page.evaluate(TYPE % json.dumps({"selector": selector, "text": text})))


PICK = r"""
(() => {
  const input = document.querySelector('input[name="defence-predict"]');
  if (!input) return JSON.stringify({ picked: false });
  const label = input.closest("label");
  (label || input).click();
  /* React reads the change event, so one is dispatched if the click did not register it. */
  if (!input.checked) {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("click", { bubbles: true }));
  }
  return JSON.stringify({ picked: input.checked, value: input.value });
})()
"""


def pick_prediction(page):
    """Choose the first prediction option, as a learner must before the step can be left."""
    return json.loads(page.evaluate(PICK))


def main():
    course_id, route, cookie = sys.argv[1], sys.argv[2], sys.argv[3]
    if cookie.startswith("kidycode_session="):
        cookie = cookie.split("=", 1)[1]
    widths = [int(value) for value in sys.argv[4:]] or [320, 768, 1440]

    bj.ensure_chrome()
    page = bj.Page()
    page.send("Network.enable")
    page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie,
                                    "domain": "localhost", "path": "/", "url": bj.BASE})

    report = []
    for width in widths:
        page.width(width)
        page.goto(f"{bj.BASE}{route}")
        report.append(bj.audit(page, f"{width} course"))

        page.click("Module checks")
        report.append(bj.audit(page, f"{width} choose"))

        final = page.click("Start the final assessment")
        report.append({**bj.audit(page, f"{width} final overview"), "click": final})
        page.click("Start the questions")

        for _ in range(9):
            page.click("Next question")
        page.click("Go to the practical task")
        time.sleep(1.0)
        for _ in range(3):
            page.click("Next task")
        page.click("Review before submitting")
        page.click("Submit for marking")
        report.append(bj.audit(page, f"{width} results"))

        started = page.click("Start the code defence")
        report.append({**bj.audit(page, f"{width} defence intro"), "click": started})

        page.click("Start the explain task")
        typed = type_into(page, "#defence-explain",
                          "I put the list inside the main region so the page has one clear main area, and the headings step down one level at a time so a screen reader can follow the shape of the page.")
        report.append({**bj.audit(page, f"{width} defence explain"), "typed": typed})

        page.click("Save and continue")
        report.append({**bj.audit(page, f"{width} defence predict"), "typed": typed})

        # A prediction must be chosen before the step can be left, which is why this click is
        # made explicitly rather than assumed.
        picked = pick_prediction(page)
        page.click("Save and continue")
        report.append({**bj.audit(page, f"{width} defence change"), "picked": picked})
        type_into(page, "#defence-change-css", "body { color: #111936; }\n.card { color: #ee9d2b; }")
        page.click("Save and continue")
        report.append(bj.audit(page, f"{width} defence review"))

        page.click("Submit the defence")
        time.sleep(1.5)
        report.append(bj.audit(page, f"{width} defence result"))

    print(json.dumps({"courseId": course_id, "widths": widths, "screens": report}, indent=1))


if __name__ == "__main__":
    main()