#!/usr/bin/env bash
# Seed one local learner per course and sweep the assessment interface in a real browser
# at 320, 768 and 1440 pixels. Local-only: it talks to http://localhost:3001.
set -u
cd "$(dirname "$0")/.."
TEMP="$(cygpath -u "${LOCALAPPDATA:-$HOME}" 2>/dev/null || echo /tmp)/Temp"
run_course() {
  local id="$1" route="$2" nickname="$3"
  local seed
  seed=$(node --import tsx --no-warnings scripts/e2e-browser-seed.mjs "$id" all "$nickname" | tail -1)
  local cookie
  cookie=$(python -c "import json,sys; print(json.loads(sys.argv[1])['cookie'])" "$seed")
  echo "sweep $id ($route)"
  python scripts/browser-journey.py "$id" "$route" "$cookie" 320 768 1440 > "$TEMP/sweep-$id.json" 2> "$TEMP/sweep-$id.err"
  echo "  exit=$? bytes=$(wc -c < "$TEMP/sweep-$id.json")"
}
run_course ages-10-12 /learn SweepKid1012
run_course ages-13-15 /learn/13-15 SweepKid1315
run_course ages-16-18 /learn/16-18 SweepKid1618
run_course adults /learn/adults SweepAdult19
echo "sweep complete"
