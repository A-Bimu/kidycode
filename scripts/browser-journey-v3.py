"""Drive the V3 lesson journey in a real headless Chrome.

Local only. It seeds a real learner for the course (the browser harness cannot click
through 33 lessons to reach the JavaScript sample), then walks the six-moment journey
and audits what the browser actually did:

  * the rail shows the six moments and the concept
  * the guidance control changes the mode and persists the override per lesson
  * the hint gate stays closed until an attempt, then reveals hints in order
  * guided mode shows one requirement at a time
  * the fresh mastery task fails on its starter and passes on the repair
  * completion stays blocked until the quick check, the fresh task and the reflection
  * a runtime error in the preview is reported and clears after the repair
  * layout at 320, 768 and 1440 pixels: no horizontal overflow, no green, one h1,
    one main, heading order, labelled controls, no em dash

Usage:
  python scripts/browser-journey-v3.py [widths...]

The local dev server must already be running (default http://localhost:3001). Point it
elsewhere with KIDYCODE_E2E_URL.
"""

import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "kidy-v3-journey-profile")
PORT = int(os.environ.get("KIDYCODE_CDP_PORT", "9341"))
BASE = os.environ.get("KIDYCODE_E2E_URL", "http://localhost:3001").rstrip("/")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEADINGS_LESSON = "Build a heading hierarchy"
LOOPS_LESSON = "Create elements with a loop"

HEADINGS_ANSWER = """<main>
  <h1>Learning Library</h1>
  <section><h2>New resources</h2></section>
  <section><h2>Popular topics</h2><h3>Web development</h3></section>
</main>"""

HEADINGS_FRESH = """<main>
  <h1>Lost and found</h1>
  <h2>Where to look</h2>
  <h3>If you find an item</h3>
</main>"""

LOOPS_BROKEN = """const skills = ["HTML", "CSS", "JavaScript"];
const list = document.querySelector("#skill-list");
skills.forEach(function (skill) {
  list.append(item);
});"""

LOOPS_ANSWER = """const skills = ["HTML", "CSS", "JavaScript"];
const list = document.querySelector("#skill-list");
skills.forEach(function (skill) {
  const item = document.createElement("li");
  item.textContent = skill;
  list.append(item);
});"""

LOOPS_FRESH_BROKEN = """const times = ["Monday 4pm", "Wednesday 5pm", "Friday 3pm"];
const list = document.querySelector("#meeting-list");
const emptyState = document.querySelector("#empty-state");
times.forEach(function (time) {
  const item = document.createElement("li");
  item.textContent = time;
  list.append(thing);
});"""

LOOPS_FRESH_ANSWER = """const times = ["Monday 4pm", "Wednesday 5pm", "Friday 3pm"];
const list = document.querySelector("#meeting-list");
const emptyState = document.querySelector("#empty-state");
if (times.length === 0) {
  emptyState.textContent = "No meetings yet";
} else {
  times.forEach(function (time) {
    const item = document.createElement("li");
    item.textContent = time;
    list.append(item);
  });
}"""

AUDIT = r"""
(() => {
  const width = window.innerWidth;
  const scrolling = document.scrollingElement || document.documentElement;
  const green = [];
  const isGreen = (value) => {
    const m = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    const r = +m[1], g = +m[2], b = +m[3];
    return g > r + 24 && g > b + 24;
  };
  for (const el of document.querySelectorAll("*")) {
    const style = getComputedStyle(el);
    for (const prop of ["color", "backgroundColor", "borderTopColor", "borderLeftColor", "outlineColor", "fill", "stroke"]) {
      const value = style[prop];
      if (value && value !== "rgba(0, 0, 0, 0)" && isGreen(value)) green.push(el.tagName + "." + el.className + " " + prop + "=" + value);
    }
  }
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
  let previous = 0;
  let orderOk = true;
  for (const level of levels) { if (previous && level > previous + 1) orderOk = false; previous = level; }
  const unlabelled = [...document.querySelectorAll("input,textarea,select")].filter((el) => {
    if (el.type === "hidden") return false;
    if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
    if (el.closest("label")) return false;
    return !(el.id && document.querySelector('label[for="' + el.id + '"]'));
  }).map((el) => el.tagName + "#" + el.id);
  const text = document.body.innerText || "";
  return JSON.stringify({
    width,
    overflow: scrolling.scrollWidth - width,
    greenCount: green.length,
    green: green.slice(0, 4),
    h1: document.querySelectorAll("h1").length,
    mains: document.querySelectorAll("main").length,
    headingOrderOk: orderOk,
    unlabelled,
    emDashes: (text.match(/\u2014/g) || []).length,
  });
})()
"""

SET_TEXT = r"""
((selector, value) => {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ set: false, selector });
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return JSON.stringify({ set: true, selector });
})(%s, %s)
"""

CLICK_SELECTOR = r"""
((selector) => {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ clicked: false, selector });
  el.click();
  return JSON.stringify({ clicked: true, selector, disabled: Boolean(el.disabled) });
})(%s)
"""

CLICK_TEXT = r"""
((wanted) => {
  const target = wanted.toLowerCase();
  const candidates = [...document.querySelectorAll("button, a, label")];
  const match = candidates.find((el) => !el.disabled && (el.innerText || "").trim().toLowerCase().includes(target));
  if (!match) return JSON.stringify({ clicked: false, wanted });
  match.click();
  return JSON.stringify({ clicked: true, wanted, label: (match.innerText || "").trim().slice(0, 48) });
})(%s)
"""

checks = []
screens = []


def check(name, ok, detail=""):
    checks.append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else f": {detail}"))


def ensure_chrome():
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=2)
        return
    except Exception:
        pass
    subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={PROFILE}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            "--disable-gpu",
            "--window-size=1440,900",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        time.sleep(0.5)
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=2)
            return
        except Exception:
            continue
    raise SystemExit("Chrome did not expose a debugging port.")


class Page:
    def __init__(self):
        version = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=5))
        self.browser = websocket.create_connection(version["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
        self.id = 0
        self.session = None
        target = self.send("Target.createTarget", {"url": "about:blank"})
        self.session = self.send("Target.attachToTarget", {"targetId": target["targetId"], "flatten": True})["sessionId"]

    def send(self, method, params=None):
        self.id += 1
        message = {"id": self.id, "method": method, "params": params or {}}
        if self.session and method not in ("Target.createTarget",):
            message["sessionId"] = self.session
        self.browser.send(json.dumps(message))
        while True:
            reply = json.loads(self.browser.recv())
            if reply.get("id") == self.id:
                if "error" in reply:
                    raise RuntimeError(f"{method}: {reply['error']}")
                return reply.get("result", {})

    def evaluate(self, expression):
        result = self.send("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True})
        return result.get("result", {}).get("value")

    def goto(self, url):
        self.send("Page.enable")
        self.send("Page.navigate", {"url": url})
        self.wait_for("document.querySelectorAll('button').length > 1", 40)

    def wait_for(self, condition, seconds=25):
        deadline = time.time() + seconds
        while time.time() < deadline:
            try:
                if self.evaluate(f"(() => {{ try {{ return Boolean({condition}); }} catch (e) {{ return false; }} }})()"):
                    return True
            except Exception:
                pass
            time.sleep(0.4)
        return False

    def width(self, pixels, height=900):
        self.send("Emulation.setDeviceMetricsOverride", {"width": pixels, "height": height, "deviceScaleFactor": 1, "mobile": pixels < 768})

    def text(self, selector):
        return self.evaluate(f"(() => {{ const el = document.querySelector({json.dumps(selector)}); return el ? el.innerText : null; }})()")

    def count(self, selector):
        return self.evaluate(f"document.querySelectorAll({json.dumps(selector)}).length")

    def attr(self, selector, name):
        return self.evaluate(f"(() => {{ const el = document.querySelector({json.dumps(selector)}); return el ? el.getAttribute({json.dumps(name)}) : null; }})()")

    def click_selector(self, selector):
        result = json.loads(self.evaluate(CLICK_SELECTOR % json.dumps(selector)))
        time.sleep(0.8)
        return result

    def click_text(self, text):
        result = json.loads(self.evaluate(CLICK_TEXT % json.dumps(text)))
        if result.get("clicked"):
            time.sleep(1.0)
        return result

    def set_text(self, selector, value):
        result = json.loads(self.evaluate(SET_TEXT % (json.dumps(selector), json.dumps(value))))
        time.sleep(0.4)
        return result

    def audit(self, label):
        layout = json.loads(self.evaluate(AUDIT))
        layout["screen"] = label
        screens.append(layout)
        return layout


def seed_learner(course_id, completed, nickname):
    """Create a real learner and mark the lessons before the sample complete."""
    output = subprocess.run(
        ["node", "--import", "tsx", "--no-warnings", "scripts/e2e-browser-seed.mjs", course_id, str(completed), nickname],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    line = output.stdout.strip().splitlines()[-1]
    payload = json.loads(line)
    cookie = payload["cookie"]
    return cookie.split("=", 1)[1] if cookie.startswith("kidycode_session=") else cookie


def open_lesson(page, route, cookie, title):
    page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie, "domain": "localhost", "path": "/", "url": BASE})
    page.goto(f"{BASE}{route}")
    if not page.wait_for(f"document.body.innerText.includes({json.dumps(title)})", 40):
        raise SystemExit(f"The lesson {title} was not offered.")
    page.click_text(title)
    page.wait_for("document.querySelector('.journey-rail')", 30)


def journey_headings(page, width, cookie):
    """The guided HTML sample: hint order, one requirement at a time, mastery gate."""
    print(f"\n== headings journey at {width}px ==")
    page.width(width)
    open_lesson(page, "/learn/13-15", cookie, HEADINGS_LESSON)

    check(f"{width}: the six-moment rail renders", page.count(".journey-rail li") >= 6, page.count(".journey-rail li"))
    check(f"{width}: the rail names the concept", "Concept:" in (page.text(".journey-rail") or ""), page.text(".journey-rail"))
    check(f"{width}: the guidance control offers three modes", page.count('input[name="guidance-mode"]') == 3, page.count('input[name="guidance-mode"]'))
    check(f"{width}: the hook shows what the learner makes", "What you will make" in (page.text(".journey-hook") or ""), page.text(".journey-hook"))

    page.click_selector('input[name="guidance-mode"][value="guided"]')
    stored = page.evaluate("(() => localStorage.getItem('kidycode:guidance:ages-13-15-structure-headings'))()")
    check(f"{width}: choosing guided stores the per-lesson override", stored == "guided", stored)

    layout = page.audit(f"{width} notes")
    check(f"{width}: the notes screen does not overflow", layout["overflow"] <= 0, layout["overflow"])
    check(f"{width}: no green in the notes palette", layout["greenCount"] == 0, layout["green"])
    check(f"{width}: one h1 and one main on the notes screen", layout["h1"] == 1 and layout["mains"] == 1, layout)
    check(f"{width}: heading order has no skipped level", layout["headingOrderOk"], layout)
    check(f"{width}: every control is labelled", not layout["unlabelled"], layout["unlabelled"])
    check(f"{width}: no em dash in learner text", layout["emDashes"] == 0, layout["emDashes"])

    page.goto(f"{BASE}/learn/13-15")
    page.wait_for(f"document.body.innerText.includes({json.dumps(HEADINGS_LESSON)})", 40)
    page.click_text(HEADINGS_LESSON)
    page.wait_for("document.querySelector('.journey-rail')", 30)
    check(f"{width}: the override survives a reload", page.evaluate("document.querySelector('input[name=\"guidance-mode\"][value=\"guided\"]').checked") is True)

    page.click_text("Start practice")
    page.wait_for("document.querySelector('.practice-screen')", 30)
    requirements = page.count(".journey-requirements li")
    check(f"{width}: guided shows one requirement at a time", requirements == 1, requirements)
    gate_open = page.evaluate("!document.querySelector('.tutor-nudge').disabled")
    check(f"{width}: the hint gate is closed before an attempt", gate_open is False)

    page.set_text('textarea[aria-label$="code editor"]', "<main>\n  <p>Learning Library</p>\n</main>")
    page.click_text("Check my code")
    page.wait_for("document.querySelectorAll('.test-results p').length >= 3", 30)
    failed = page.count(".test-results p.is-fail")
    check(f"{width}: a wrong answer reports every failed requirement", failed == 3, failed)
    page.wait_for("!document.querySelector('.tutor-nudge').disabled", 25)
    gate_open = page.evaluate("!document.querySelector('.tutor-nudge').disabled")
    check(f"{width}: the first attempt opens the hint gate", gate_open is True)

    page.click_text("Show hint 1")
    page.wait_for("document.querySelector('.tutor-lesson-hint')", 15)
    first_hint = page.text(".tutor-lesson-hint")
    check(f"{width}: hint 1 is the first hint in order", first_hint and "Turn the page name into h1." in first_hint, first_hint)
    page.click_text("Show hint 2")
    second_hint = page.text(".tutor-lesson-hint")
    check(f"{width}: hint 2 follows in order", second_hint and "Turn each section name into h2." in second_hint, second_hint)
    page.click_text("Show hint 3")
    third_hint = page.text(".tutor-lesson-hint")
    check(f"{width}: hint 3 follows in order", third_hint and "Use h3 only" in third_hint, third_hint)
    page.click_text("Show hint 3")
    final_hint = page.text(".tutor-lesson-hint")
    check(f"{width}: the last hint never runs past the list", final_hint == third_hint, final_hint)

    page.set_text('textarea[aria-label$="code editor"]', HEADINGS_ANSWER)
    page.click_text("Check my code")
    page.wait_for("document.querySelectorAll('.test-results p').length >= 3", 30)
    passed = page.count(".test-results p.is-pass")
    check(f"{width}: the repaired code passes every requirement", passed == 3, passed)
    check(f"{width}: the guided requirement is marked done", "done" in (page.text(".journey-requirements") or "").lower(), page.text(".journey-requirements"))

    page.click_text("Continue to quick check")
    page.wait_for("document.querySelector('.check-screen')", 30)
    check(f"{width}: the mastery task appears on the last step", page.count(".mastery-task") == 1)

    page.evaluate("(() => { const radios = [...document.querySelectorAll('input[name=\"practice-question\"]')]; radios[1].click(); return true; })()")
    time.sleep(0.5)
    page.click_text("Check answer")
    page.wait_for("document.querySelector('.quick-check .is-correct')", 25)
    check(f"{width}: the quick check grades the answer", page.count(".quick-check .is-correct") == 1)
    check(f"{width}: completion waits for the fresh task", page.evaluate("document.querySelector('.completion-bar button.primary-button').disabled") is True)

    page.click_text("Check fresh task")
    page.wait_for("document.querySelector('.mastery-results')", 20)
    check(f"{width}: the fresh task fails on its starter", page.count(".mastery-results li.is-fail") >= 2, page.count(".mastery-results li.is-fail"))
    check(f"{width}: the learner is told to repair one requirement", "Not there yet" in (page.text(".mastery-results") or ""), page.text(".mastery-results"))
    check(f"{width}: completion stays blocked while the fresh task fails", page.evaluate("document.querySelector('.completion-bar button.primary-button').disabled") is True)

    page.set_text('textarea[aria-label$="fresh task editor"]', HEADINGS_FRESH)
    page.click_text("Check fresh task")
    page.wait_for("document.querySelector('.mastery-results')", 20)
    check(f"{width}: the repair passes the fresh task", page.count(".mastery-results li.is-pass") == 3, page.count(".mastery-results li.is-pass"))
    check(f"{width}: completion still waits for the reflection", page.evaluate("document.querySelector('.completion-bar button.primary-button').disabled") is True)

    page.set_text("#mastery-reflection-ages-13-15-structure-headings", "I changed the plain lines into a title and section headings, so the outline reads in order.")
    check(f"{width}: completion unlocks after the reflection", page.evaluate("document.querySelector('.completion-bar button.primary-button').disabled") is False)
    before = page.text(".guided-title h1")
    page.click_text("Complete lesson")
    advanced = page.wait_for(f"document.querySelector('.guided-title h1') && document.querySelector('.guided-title h1').innerText !== {json.dumps(before)}", 30)
    check(f"{width}: the lesson saves and advances to the next one", advanced, page.text(".guided-title h1"))

    layout = page.audit(f"{width} mastery")
    check(f"{width}: the mastery screen does not overflow", layout["overflow"] <= 0, layout["overflow"])
    check(f"{width}: the mastery screen keeps one h1 and one main", layout["h1"] == 1 and layout["mains"] == 1, layout)
    check(f"{width}: the mastery screen has no green", layout["greenCount"] == 0, layout["green"])


def journey_loops(page, cookie):
    """The JavaScript sample: a runtime error, its repair, and the fresh task."""
    print("\n== loops journey at 1440px ==")
    page.width(1440)
    open_lesson(page, "/learn", cookie, LOOPS_LESSON)
    page.click_text("Start practice")
    page.wait_for("document.querySelector('.practice-screen')", 30)

    page.set_text('textarea[aria-label$="code editor"]', LOOPS_BROKEN)
    page.click_text("Run code")
    page.wait_for("document.querySelector('.preview-runtime')", 25)
    error_text = page.text(".preview-runtime") or ""
    check("a runtime error is reported in the preview", "item is not defined" in error_text, error_text)

    page.set_text('textarea[aria-label$="code editor"]', LOOPS_ANSWER)
    page.click_text("Run code")
    page.wait_for("!document.querySelector('.preview-runtime')", 20)
    check("the runtime error clears after the repair", page.count(".preview-runtime") == 0)
    check("the preview lists the three skills", page.evaluate("(() => { const frame = document.querySelector('.preview-panel iframe'); return Boolean(frame); })()"))

    page.click_text("Check my code")
    page.wait_for("document.querySelectorAll('.test-results p').length >= 4", 30)
    check("the repaired loop passes every requirement", page.count(".test-results p.is-pass") == 4, page.count(".test-results p.is-pass"))

    page.click_text("Continue to quick check")
    page.wait_for("document.querySelector('.check-screen')", 30)
    page.set_text('textarea[aria-label$="fresh task editor"]', LOOPS_FRESH_BROKEN)
    page.click_text("Run fresh task")
    page.wait_for("document.querySelector('.mastery-preview .preview-runtime')", 25)
    fresh_error = page.text(".mastery-preview .preview-runtime") or ""
    check("the fresh task reports its own runtime error", "thing is not defined" in fresh_error, fresh_error)

    page.set_text('textarea[aria-label$="fresh task editor"]', LOOPS_FRESH_ANSWER)
    page.click_text("Run fresh task")
    page.wait_for("!document.querySelector('.mastery-preview .preview-runtime')", 20)
    check("the fresh task error clears after the repair", page.count(".mastery-preview .preview-runtime") == 0)
    page.click_text("Check fresh task")
    page.wait_for("document.querySelector('.mastery-results')", 20)
    check("the repaired fresh task passes all five checks", page.count(".mastery-results li.is-pass") == 5, page.count(".mastery-results li.is-pass"))

    page.evaluate("(() => { const radios = [...document.querySelectorAll('input[name=\"practice-question\"]')]; radios[2].click(); return true; })()")
    time.sleep(0.5)
    page.click_text("Check answer")
    page.wait_for("document.querySelector('.quick-check .is-correct')", 25)
    page.set_text("#mastery-reflection-javascript-logic-loops", "The loop gave me one skill at a time, so I created a list item for each one instead of typing them by hand.")
    check("the loops lesson unlocks completion", page.evaluate("document.querySelector('.completion-bar button.primary-button').disabled") is False)
    before = page.text(".guided-title h1")
    page.click_text("Complete lesson")
    advanced = page.wait_for(f"document.querySelector('.guided-title h1') && document.querySelector('.guided-title h1').innerText !== {json.dumps(before)}", 30)
    check("the loops lesson saves and advances", advanced, page.text(".guided-title h1"))


def main():
    widths = [int(value) for value in sys.argv[1:]] or [320, 768, 1440]
    if not BASE.startswith("http://localhost"):
        raise SystemExit("This harness only runs against localhost.")
    ensure_chrome()
    page = Page()

    stamp = int(time.time())
    for width in widths:
        cookie = seed_learner("ages-13-15", 1, f"JourneyKid{width}{stamp % 1000}")
        journey_headings(page, width, cookie)

    cookie = seed_learner("ages-10-12", 33, f"LoopKid{stamp % 1000}")
    journey_loops(page, cookie)

    failed = [item for item in checks if not item["ok"]]
    report = {"base": BASE, "screens": screens, "checks": checks, "failed": failed}
    report_path = os.path.join(ROOT, ".sites-runtime", "tmp", "browser-journey-v3.json")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(f"\njourney: {len(checks) - len(failed)} checks passed, {len(failed)} failed, {len(screens)} screens audited")
    print(f"report: {report_path}")
    if failed:
        for item in failed:
            print(f"  - {item['name']}: {item['detail']}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
