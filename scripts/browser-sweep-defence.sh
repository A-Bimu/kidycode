#!/usr/bin/env bash
# Walk the code defence in a real browser at each viewport, with a fresh learner per viewport
# so that one viewport's submitted attempt cannot block the next one. Local-only.
set -u
cd "$(dirname "$0")/.."
TEMP="$(cygpath -u "${LOCALAPPDATA:-$HOME}" 2>/dev/null || echo /tmp)/Temp"
COURSE="${1:-ages-10-12}"
ROUTE="${2:-/learn}"
for width in 320 768 1440; do
  seed=$(node --import tsx --no-warnings scripts/e2e-browser-seed.mjs "$COURSE" all "SweepDef${width}" | tail -1)
  echo "$seed" > "$TEMP/def-seed-$width.json"
  cookie=$(python -c "import json,sys; print(json.loads(open(sys.argv[1]).read().strip().splitlines()[-1])['cookie'])" "$TEMP/def-seed-$width.json")
  echo "defence walk $COURSE at ${width}px"
  python scripts/browser-journey-defence.py "$COURSE" "$ROUTE" "$cookie" "$width" > "$TEMP/defence-$width.json" 2> "$TEMP/defence-$width.err"
  echo "  exit=$? bytes=$(wc -c < "$TEMP/defence-$width.json")"
done
echo "defence sweep complete"