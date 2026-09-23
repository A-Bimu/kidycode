#!/usr/bin/env bash
# The reproducible certificate browser sweep. The orchestration lives in python, where the seed
# output is read from the child's own stdout and every failure is named.
set -u
cd "$(dirname "$0")/.."
exec python scripts/browser-sweep-certificate.py "$@"