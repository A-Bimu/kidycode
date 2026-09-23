#!/usr/bin/env bash
# The reproducible code-defence browser sweep. The orchestration lives in python, where a cookie
# cannot be lost to shell substitution and every failure is named.
set -u
cd "$(dirname "$0")/.."
exec python scripts/browser-sweep-defence.py "$@"