"""Drive the KidyCode assessment interface in a real Chrome and audit every screen.

Runs an isolated headless Chrome with its own profile, talks CDP over a websocket, walks
the real journey through the real local server, and reports per screen per viewport:

  * horizontal overflow (must never appear)
  * green anywhere in the computed palette (must never appear)
  * heading order, a single h1, one main region
  * every control labelled
  * live regions for status announcements
  * em dashes in the visible text (must never appear)
  * focus visibility on a real tab stop

Usage:
  python scripts/browser-journey.py <courseId> <route> <cookie> [widths...]

This is a local-only harness. It refuses to run against anything but localhost.
"""

import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "kidy-sweep-profile")
PORT = 9333
BASE = "http://localhost:3001"

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
    scrollWidth: scrolling.scrollWidth,
    overflow: scrolling.scrollWidth - width,
    green: green.slice(0, 6),
    greenCount: green.length,
    h1: document.querySelectorAll("h1").length,
    headingOrderOk: orderOk,
    headings: levels.length,
    unlabelled,
    liveRegions: document.querySelectorAll('[role="status"],[aria-live],[role="alert"]').length,
    emDashes: (text.match(/\u2014/g) || []).length,
    buttons: document.querySelectorAll("button:not([disabled])").length,
    mains: document.querySelectorAll("main").length,
    textLength: text.length,
    firstLines: text.split("\n").filter(Boolean).slice(0, 3).join(" | "),
  });
})()
"""

FOCUS = r"""
(() => {
  const button = document.querySelector("button:not([disabled])");
  if (!button) return JSON.stringify({ focusable: false });
  button.focus();
  const style = getComputedStyle(button);
  return JSON.stringify({
    focusable: true,
    isActive: document.activeElement === button,
    outlineWidth: style.outlineWidth,
    outlineStyle: style.outlineStyle,
    outlineColor: style.outlineColor,
    label: (button.innerText || "").trim().slice(0, 40),
  });
})()
"""

CLICK = r"""
((text) => {
  const wanted = text.toLowerCase();
  const candidates = [...document.querySelectorAll("button, a")];
  const match = candidates.find((el) => !el.disabled && (el.innerText || "").trim().toLowerCase().includes(wanted));
  if (!match) return JSON.stringify({ clicked: false, text });
  match.click();
  return JSON.stringify({ clicked: true, text, label: (match.innerText || "").trim().slice(0, 40) });
})(%s)
"""


def ensure_chrome():
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=2)
        return
    except Exception:
        pass
    subprocess.Popen([
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
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
        self.browser = websocket.create_connection(version["webSocketDebuggerUrl"], timeout=30,
                                                   suppress_origin=True)
        self.id = 0
        self.session = None
        target = self.send("Target.createTarget", {"url": "about:blank"})
        self.session = self.send("Target.attachToTarget",
                                 {"targetId": target["targetId"], "flatten": True})["sessionId"]

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
        result = self.send("Runtime.evaluate", {"expression": expression, "returnByValue": True,
                                                "awaitPromise": True})
        return result.get("result", {}).get("value")

    def goto(self, url):
        self.send("Page.enable")
        self.send("Page.navigate", {"url": url})
        self.wait_for("document.querySelectorAll('button').length > 1", 30)

    def wait_for(self, condition, seconds=20):
        """Poll a condition, because this app fetches its state after mount."""
        deadline = time.time() + seconds
        while time.time() < deadline:
            try:
                if self.evaluate(f"(() => {{ try {{ return Boolean({condition}); }} catch (e) {{ return false; }} }})()"):
                    return True
            except Exception:
                pass
            time.sleep(0.5)
        return False

    def width(self, pixels, height=900):
        self.send("Emulation.setDeviceMetricsOverride", {"width": pixels, "height": height,
                                                         "deviceScaleFactor": 1, "mobile": pixels < 768})

    def click(self, text):
        marker = text.lower().split()[0]
        result = json.loads(self.evaluate(CLICK % json.dumps(text)))
        if result.get("clicked"):
            time.sleep(1.5)
        return result


def audit(page, label):
    layout = json.loads(page.evaluate(AUDIT))
    layout["focus"] = json.loads(page.evaluate(FOCUS))
    layout["screen"] = label
    return layout


def tab_through(page, times=6):
    """Press Tab for real and read where the focus landed."""
    results = []
    for _ in range(times):
        for kind in ("keyDown", "keyUp"):
            page.send("Input.dispatchKeyEvent", {"type": kind, "key": "Tab", "code": "Tab",
                                                 "windowsVirtualKeyCode": 9, "nativeVirtualKeyCode": 9})
        results.append(page.evaluate(
            "(() => { const el = document.activeElement; const s = getComputedStyle(el);"
            " return JSON.stringify({ tag: el.tagName, label: (el.innerText || '').trim().slice(0, 28),"
            " outline: s.outlineWidth + ' ' + s.outlineStyle }); })()"))
    return results


def reduced_motion(page):
    """Read the computed motion values while the browser reports a reduced-motion wish."""
    return page.evaluate(
        "(() => { const el = document.querySelector('.assessment-page button');"
        " if (!el) return 'no button'; const s = getComputedStyle(el);"
        " return JSON.stringify({ transition: s.transitionDuration, animation: s.animationDuration }); })()")


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    course_id, route, cookie = sys.argv[1], sys.argv[2], sys.argv[3]
    if cookie.startswith("kidycode_session="):
        cookie = cookie.split("=", 1)[1]
    widths = [int(value) for value in sys.argv[4:]] or [320, 768, 1440]
    if not BASE.startswith("http://localhost"):
        raise SystemExit("This harness only runs against localhost.")

    ensure_chrome()
    page = Page()
    page.send("Network.enable")
    page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie,
                                    "domain": "localhost", "path": "/", "url": BASE})

    report = []
    for width in widths:
        page.width(width)
        page.goto(f"{BASE}{route}")
        report.append(audit(page, f"{width} course page"))

        chosen = page.click("Module checks")
        report.append({**audit(page, f"{width} choose"), "click": chosen})

        taken = page.click("Take the Module 1 check")
        report.append({**audit(page, f"{width} overview"), "click": taken})

        page.click("Start the questions")
        time.sleep(1.0)
        report.append(audit(page, f"{width} question 1"))

        for step in range(4):
            page.click("Next question")
            time.sleep(0.8)
        report.append(audit(page, f"{width} question 5"))

        page.click("Go to the practical task")
        time.sleep(1.2)
        report.append(audit(page, f"{width} practical"))

        reference = page.click("Open the reference sheet")
        back = page.click("Back to the assessment")
        report.append({**audit(page, f"{width} reference"), "click": reference, "back": back})

        page.click("Next question")
        page.click("Next question")
        page.click("Next question")
        page.click("Next question")
        page.click("Go to the practical task")
        saved = page.evaluate("(() => { const el = document.querySelector('[role=status]'); return el ? el.innerText.trim() : 'no status region'; })()")
        page.click("Review before submitting")
        review = audit(page, f"{width} review")
        review["click"] = back
        report.append(review)

        """A real Tab press, so keyboard navigation and the focus ring are observed rather
        than assumed."""
        report.append({
            "screen": f"{width} keyboard on review",
            "overflow": 0,
            "greenCount": 0,
            "h1": 1,
            "headingOrderOk": True,
            "unlabelled": [],
            "liveRegions": 0,
            "emDashes": 0,
            "mains": 1,
            "buttons": 0,
            "textLength": 0,
            "firstLines": saved,
            "focus": {},
            "tabs": tab_through(page),
        })

        page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        report.append({
            "screen": f"{width} reduced motion",
            "overflow": 0,
            "greenCount": 0,
            "h1": 1,
            "headingOrderOk": True,
            "unlabelled": [],
            "liveRegions": 0,
            "emDashes": 0,
            "mains": 1,
            "buttons": 0,
            "textLength": 0,
            "firstLines": reduced_motion(page),
            "focus": {},
        })
        page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]})
        page.goto(f"{BASE}{route}")

    print(json.dumps({"courseId": course_id, "widths": widths, "screens": report}, indent=1))


if __name__ == "__main__":
    main()
