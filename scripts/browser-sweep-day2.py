"""Sweep the Day 2 experiences in a real local headless Chrome.

Local-only. It walks each new route at 320, 768 and 1440 pixels and audits what the
browser actually computed:

  * horizontal overflow (must never appear)
  * green anywhere in the computed palette (must never appear)
  * exactly one h1 and exactly one main region per screen
  * heading order with no skipped level
  * em dashes in the visible text (must never appear)
  * a live region where the screen announces state
  * the visible provenance label, so a reader can tell real from demonstration from
    pending data

Usage:
  python scripts/browser-sweep-day2.py [widths...]

It refuses to run against anything but localhost and needs the local dev server on
http://localhost:3001.
"""

import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "kidy-day2-sweep-profile")
PORT = 9334
BASE = os.environ.get("KIDYCODE_E2E_URL", "http://localhost:3001")

ROUTES = [
    "/dashboard",
    "/catalogue",
    "/notes",
    "/practice",
    "/design",
    "/build-outside",
    "/curriculum",
    "/institution",
]

# Every screen must say out loud what kind of data it is showing.
PROVENANCE_WORDS = ["real", "demonstration", "demo", "pending", "label"]

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
  const text = document.body.innerText || "";
  return JSON.stringify({
    width,
    scrollWidth: scrolling.scrollWidth,
    overflow: scrolling.scrollWidth - width,
    greenCount: green.length,
    green: green.slice(0, 4),
    h1: document.querySelectorAll("h1").length,
    headingOrderOk: orderOk,
    headings: levels.length,
    mains: document.querySelectorAll("main").length,
    emDashes: (text.match(/\u2014/g) || []).length,
    liveRegions: document.querySelectorAll('[role="status"],[aria-live],[role="alert"]').length,
    links: document.querySelectorAll("a").length,
    textLength: text.length,
    provenance: ["real", "demonstration", "demo", "pending", "label"].filter((word) => text.toLowerCase().includes(word)),
    banners: [...document.querySelectorAll(".kc-banner,[role='status'],[role='alert']")].map((el) => (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 90)),
    firstLines: text.split("\n").filter(Boolean).slice(0, 3).join(" | "),
  });
})()
"""


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
        self.browser = websocket.create_connection(
            version["webSocketDebuggerUrl"], timeout=30, suppress_origin=True
        )
        self.id = 0
        self.session = None
        target = self.send("Target.createTarget", {"url": "about:blank"})
        self.session = self.send(
            "Target.attachToTarget", {"targetId": target["targetId"], "flatten": True}
        )["sessionId"]

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
        result = self.send(
            "Runtime.evaluate",
            {"expression": expression, "returnByValue": True, "awaitPromise": True},
        )
        return result.get("result", {}).get("value")

    def width(self, pixels, height=800):
        self.send(
            "Emulation.setDeviceMetricsOverride",
            {"width": pixels, "height": height, "deviceScaleFactor": 1, "mobile": pixels < 768},
        )

    def goto(self, url):
        self.send("Page.enable")
        self.send("Page.navigate", {"url": url})
        deadline = time.time() + 30
        while time.time() < deadline:
            try:
                ready = self.evaluate(
                    "(() => document.readyState === 'complete' && (document.body.innerText || '').length > 40)()"
                )
                if ready:
                    break
            except Exception:
                pass
            time.sleep(0.5)
        time.sleep(0.6)


def main():
    widths = [int(value) for value in sys.argv[1:]] or [320, 768, 1440]
    if not BASE.startswith("http://localhost"):
        raise SystemExit("This harness only runs against localhost.")

    ensure_chrome()
    page = Page()
    failures = []
    measurements = []

    for route in ROUTES:
        for width in widths:
            page.width(width)
            page.goto(f"{BASE}{route}")
            layout = json.loads(page.evaluate(AUDIT))
            layout["screen"] = f"{route} @ {width}"
            measurements.append(layout)

            issues = []
            if layout["overflow"] > 0:
                issues.append(f"overflows by {layout['overflow']}px")
            if layout["greenCount"] > 0:
                issues.append(f"green in the palette: {layout['green']}")
            if layout["h1"] != 1:
                issues.append(f"{layout['h1']} h1 headings")
            if layout["mains"] != 1:
                issues.append(f"{layout['mains']} main regions")
            if not layout["headingOrderOk"]:
                issues.append("a heading level was skipped")
            if layout["emDashes"] > 0:
                issues.append(f"{layout['emDashes']} em dashes in the text")
            if layout["textLength"] < 200:
                issues.append(f"only {layout['textLength']} characters rendered")
            if not any(word in layout["provenance"] for word in PROVENANCE_WORDS):
                issues.append("no visible provenance label")

            if issues:
                failures.append(f"{layout['screen']}: " + "; ".join(issues))
                print(f"  FAIL {layout['screen']}: " + "; ".join(issues))
            else:
                print(
                    f"  ok   {layout['screen']}: no overflow, {layout['headings']} headings, "
                    f"{layout['liveRegions']} live regions, {layout['textLength']} chars"
                )

    report_path = os.path.join(
        os.environ.get("LOCALAPPDATA", "."), "Temp", "day2-screen-sweep.json"
    )
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(measurements, handle, indent=1)

    print(
        f"\nDay 2 screens: {len(measurements)} measurements over {len(ROUTES)} routes "
        f"at widths {widths}; {len(failures)} failed."
    )
    print(f"report: {report_path}")
    if failures:
        for failure in failures:
            print(f"  - {failure}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
