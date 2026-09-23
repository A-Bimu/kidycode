"""One certificate journey in a real browser.

Walks My progress, Skills Passport, Certificate and Print for a seeded learner, at one viewport,
and writes a report. The learner asks for the certificate through the interface; the server decides
whether one may be issued.

Checks, at every screen: no horizontal overflow, no green, no learner-facing em dash, one h1,
correct heading order, every control labelled, a live region where a status is announced, and
reduced motion respected. The print proof asks Chrome for a real PDF and counts its pages.

Usage (normally through scripts/browser-sweep-certificate.py):
  python scripts/browser-journey-certificate.py <courseId> <route> <cookie> <width> <reportPath>
"""

import base64
import importlib.util
import json
import os
import re
import sys
import time
import traceback

TEMP = os.path.join(os.environ.get("LOCALAPPDATA", "/tmp"), "Temp", "journeys")

REQUIRED_SCREENS = [
    "course", "progress", "passport", "certificate",
]

PASSPORT_HEADINGS = ["Skills Passport"]
CERTIFICATE_HEADINGS = ["Your certificate"]


class Failure(Exception):
    pass


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def count_pdf_pages(pdf_bytes):
    """Counts the pages of a Chrome print PDF two ways: the page tree's own /Count, and the page
    objects. They must agree, and a disagreement is a harness defect rather than a layout one."""
    text = pdf_bytes.decode("latin-1", errors="ignore")
    counts = [int(value) for value in re.findall(r"/Count\s+(\d+)", text)]
    tree = max(counts) if counts else 0
    objects = len(re.findall(r"/Type\s*/Page[^s]", text))
    return {"tree": tree, "objects": objects, "pages": tree if tree > 0 else objects}


def horizontal_overflow(screen):
    """A positive difference is a real horizontal overflow. The audit reports a negative value on
    some viewports, which is the scrollbar rather than a page that is too wide, so only a positive
    value is a defect."""
    return max(0, screen.get("overflow", 0))


def contains(text, phrase):
    """Case-insensitive containment. Styled labels are uppercased by CSS, so innerText reads back
    uppercase even when the source is not."""
    return phrase.lower() in (text or "").lower()


def main():
    course_id, route, cookie, width, report_path, state = (sys.argv[1:7] + ["certified"])[:6]
    width = int(width)
    if state not in ("certified", "ready"):
        raise SystemExit(f"HARNESS: unknown state {state}")
    report = {
        "label": f"{course_id}@{width}px", "courseId": course_id, "width": width,
        "screens": [], "facts": {}, "ok": False, "error": "",
    }
    if not cookie.strip():
        raise SystemExit("HARNESS: the seed returned an empty cookie.")

    dj = load("dj", "scripts/browser-journey-defence.py")
    bj = dj.load_driver()
    bj.ensure_chrome()
    page = bj.Page()
    page.send("Network.enable")
    page.send("Network.setCookie", {"name": "kidycode_session", "value": cookie.split("=", 1)[1],
                                    "domain": "localhost", "path": "/", "url": bj.BASE})

    def capture(name):
        screen = bj.audit(page, f"{width} {name}")
        report["screens"].append(screen)
        return screen

    try:
        page.width(width)
        page.goto(f"{bj.BASE}{route}")
        capture("course")
        text = page.evaluate("document.body.innerText") or ""
        if "My progress" not in text:
            raise Failure("the learner is not authenticated: the course page shows no My progress control")

        if not page.click("My progress").get("clicked"):
            raise Failure("My progress could not be opened")
        time.sleep(1.5)
        capture("progress")

        passport = page.click("Open my Skills Passport")
        if not passport.get("clicked"):
            raise Failure("the Skills Passport could not be opened from My progress")
        time.sleep(1.5)
        screen = capture("passport")
        heading = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
        report["facts"]["passportHeading"] = heading
        if heading != "Skills Passport":
            raise Failure(f"the passport screen showed {heading!r} instead of Skills Passport")
        body = page.evaluate("document.body.innerText") or ""
        report["facts"]["passportText"] = body[:1200]
        for phrase in ("Certificate level", "Certification", "Course", "Assessment", "Code defence", "Skills demonstrated"):
            if not contains(body, phrase):
                raise Failure(f"the passport did not show {phrase!r}")
        report["facts"]["liveRegionOnPassport"] = screen["liveRegions"]
        if screen["liveRegions"] < 1:
            raise Failure("the passport announced no status in a live region")

        # The adult course keeps its own progress private: no grown-up controls are offered.
        if course_id == "adults":
            progress_text = (page.evaluate("document.body.innerText") or "").lower()
            for wording in ("grown-up", "guardian", "connect a grown"):
                if wording in progress_text:
                    raise Failure(f"the adult course offered guardian controls ({wording!r})")
            report["facts"]["guardianControls"] = False

        if state == "ready":
            # Course complete, assessment below the pass mark: the passport must name what is
            # still to do, offer one sensible next action, and offer no certificate to print.
            if "what is still to do" not in body.lower():
                raise Failure("an uncertified passport did not list what is still to do")
            if "get my certificate" in body.lower():
                raise Failure("an uncertified passport offered a certificate")
            report["facts"]["remainingShown"] = True
            if "assessment" not in body.lower():
                raise Failure("the passport did not report the assessment state")
            for screen in report["screens"]:
                dj.check_screen(screen, screen["screen"])
                if horizontal_overflow(screen) > 0:
                    raise Failure(f"{screen['screen']} overflowed horizontally by {screen['overflow']}px")
            page.click("Back to my progress")
            time.sleep(1.0)
            returned = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
            if returned != "My progress":
                raise Failure(f"the review path returned to {returned!r} instead of My progress")
            report["ok"] = True
            report["error"] = ""
            with open(report_path, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=1)
            print(f"{course_id} {width}px ok=True state=ready screens={len(report['screens'])} error=")
            return

        issued = page.click("Get my certificate")
        if not issued.get("clicked"):
            raise Failure("Get my certificate was not offered on an eligible passport")
        time.sleep(2.0)
        certificate = capture("certificate")
        cert_heading = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
        report["facts"]["certificateHeading"] = cert_heading
        if cert_heading != "Your certificate":
            raise Failure(f"the certificate screen showed {cert_heading!r}")
        sheet = page.evaluate("(() => { const el = document.querySelector('.certificate-sheet'); return el ? el.innerText : ''; })()") or ""
        report["facts"]["sheetText"] = sheet[:1200]
        for phrase in ("KidyCode Applied Web Skills Certificate", "Level:", "Project:", "Skills demonstrated", "Private credential ID"):
            if not contains(sheet, phrase):
                raise Failure(f"the printable certificate did not show {phrase!r}")
        credential = re.search(r"Private credential ID\s+(KC-[A-Z0-9-]+)", sheet)
        report["facts"]["credentialId"] = credential.group(1) if credential else None
        if not credential:
            raise Failure("the certificate carried no printable credential id")

        # Study the printed page: a real PDF from Chrome, using the print stylesheet.
        page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        report["facts"]["motion"] = bj.reduced_motion(page)
        page.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "no-preference"}]})
        tabs = bj.tab_through(page, 3)
        report["facts"]["tabs"] = tabs
        if len(tabs) < 1 or not all("outline" in tab for tab in tabs):
            raise Failure("keyboard focus produced no visible focus ring on the certificate screen")

        printed = page.send("Page.printToPDF", {"printBackground": False})
        pdf = base64.b64decode(printed["data"])
        counted = count_pdf_pages(pdf)
        pages = counted["pages"]
        report["facts"]["printedPages"] = pages
        report["facts"]["printedPageTree"] = counted["tree"]
        report["facts"]["printedPageObjects"] = counted["objects"]
        report["facts"]["printedBytes"] = len(pdf)
        if counted["tree"] > 0 and counted["objects"] > 0 and counted["tree"] != counted["objects"]:
            raise Failure(f"the page counter disagrees with the PDF: tree {counted['tree']}, objects {counted['objects']}")
        # The measurements behind the page count, so a fix is aimed rather than guessed.
        page.send("Emulation.setEmulatedMedia", {"media": "print"})
        report["facts"]["printLayout"] = json.loads(page.evaluate(
            "(() => { const el = document.querySelector('.certificate-sheet');"
            " const header = document.querySelector('header');"
            " if (!el) return JSON.stringify({ sheet: null });"
            " const r = el.getBoundingClientRect(); const style = getComputedStyle(el);"
            " return JSON.stringify({ sheet: Math.round(r.height), top: Math.round(r.top),"
            " body: Math.round(document.body.scrollHeight),"
            " headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,"
            " headerVisible: header ? getComputedStyle(header).display !== 'none' : false,"
            " fontSize: style.fontSize, borderTop: style.borderTopWidth, overflow: style.overflowY }); })()"
        ))
        page.send("Emulation.setEmulatedMedia", {"media": ""})
        if pages != 1:
            raise Failure(f"the certificate printed on {pages} pages, so it must be made to fit one")

        # The screen must not overflow horizontally with the sheet on it.
        for screen in report["screens"]:
            dj.check_screen(screen, screen["screen"])
            if horizontal_overflow(screen) > 0:
                raise Failure(f"{screen['screen']} overflowed horizontally by {screen['overflow']}px")

        page.click("Back to my Skills Passport")
        time.sleep(1.0)
        back = page.evaluate("(() => { const h = document.querySelector('h1'); return h ? h.innerText.trim() : ''; })()")
        if back != "Skills Passport":
            raise Failure(f"returning from the certificate showed {back!r}")

        seen = {screen["screen"].split(" ", 1)[1] for screen in report["screens"]}
        missing = [name for name in REQUIRED_SCREENS if name not in seen]
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
          f"pages={facts.get('printedPages')} credential={facts.get('credentialId')} error={report.get('error')}")
    if not report.get("ok"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()