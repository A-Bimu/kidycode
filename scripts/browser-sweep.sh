#!/usr/bin/env bash
# Seed one local learner per course and sweep the assessment interface in a real browser
# at 320, 768 and 1440 pixels. Local-only: it talks to http://localhost:3001.
#
# The seed output is written to a file and parsed from that file. Piping it through a shell
# substitution lost the cookie in this environment, and every journey then ran signed out and
# reported a clean layout on a loading shell, which looks like evidence and is not.
set -u
cd "$(dirname "$0")/.."

BASE="${KIDYCODE_E2E_URL:-http://localhost:3001}"
# A project-local scratch directory: `mktemp -d` returns an MSYS path that the native node
# binary resolves to C:\tmp\..., so the seed file it wrote could not be read back.
WORK=".sites-runtime/tmp/sweep"
rm -rf "$WORK"
mkdir -p "$WORK"
export KIDYCODE_E2E_URL="$BASE"

failures=0
run_course() {
  local id="$1" route="$2" nickname="$3"
  local seed_file="$WORK/seed-$id.json"
  local report="$WORK/report-$id.json"
  local error="$WORK/report-$id.err"

  if ! node --import tsx --no-warnings scripts/e2e-browser-seed.mjs "$id" all "$nickname" > "$seed_file"; then
    echo "FAIL $id: the seed did not run"
    failures=$((failures + 1))
    return
  fi

  local cookie
  cookie="$(node -e 'const fs=require("fs");const line=fs.readFileSync(process.argv[1],"utf8").trim().split(/\r?\n/).pop();process.stdout.write(JSON.parse(line).cookie)' "$seed_file")"
  if [ -z "$cookie" ]; then
    echo "FAIL $id: the seed returned no session cookie"
    failures=$((failures + 1))
    return
  fi

  echo "sweep $id ($route)"
  python scripts/browser-journey.py "$id" "$route" "$cookie" 320 768 1440 > "$report" 2> "$error"
  local status=$?
  if [ "$status" -ne 0 ] || [ ! -s "$report" ]; then
    echo "FAIL $id: the sweep exited $status with $(wc -c < "$report") bytes of report"
    tail -5 "$error"
    failures=$((failures + 1))
    return
  fi
  node -e '
    const fs = require("fs");
    const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const screens = Array.isArray(report.screens) ? report.screens : [];
    const findings = [];
    for (const screen of screens) {
      if ((screen.overflow || 0) > 0) findings.push(`${screen.screen}: ${screen.overflow}px of horizontal overflow`);
      if ((screen.greenCount || 0) > 0) findings.push(`${screen.screen}: ${screen.greenCount} green values`);
      if ((screen.emDashes || 0) > 0) findings.push(`${screen.screen}: an em dash`);
      if ((screen.unlabelled || []).length > 0) findings.push(`${screen.screen}: ${screen.unlabelled.length} unlabelled controls`);
      if (screen.h1 !== undefined && screen.h1 !== 1) findings.push(`${screen.screen}: ${screen.h1} h1 elements`);
      if (screen.headingOrderOk === false) findings.push(`${screen.screen}: heading order`);
      if ((screen.mains || 1) !== 1) findings.push(`${screen.screen}: ${screen.mains} main regions`);
    }
    console.log(`  ${screens.length} screens, ${findings.length} findings`);
    for (const finding of findings.slice(0, 8)) console.log(`    ${finding}`);
    if (screens.length < 30) { console.log("  the sweep did not visit every screen"); process.exit(1); }
    if (findings.length > 0) process.exit(1);
  ' "$report" || failures=$((failures + 1))
}

run_course ages-10-12 /learn SweepKid1012
run_course ages-13-15 /learn/13-15 SweepKid1315
run_course ages-16-18 /learn/16-18 SweepKid1618
run_course adults /learn/adults SweepAdult19

if [ "$failures" -ne 0 ]; then
  echo "whole-product browser sweep: $failures course(s) failed"
  exit 1
fi
rm -rf "$WORK"
echo "whole-product browser sweep: all four courses swept at 320, 768 and 1440 pixels"
