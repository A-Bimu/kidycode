#!/usr/bin/env bash
# Every end-to-end journey, in one reproducible command.
#
# The base URL defaults to the local development server so the gate cannot be run wrongly: a journey
# that answers "No KidyCode server answered" is a harness mistake, not a product failure. Set
# KIDYCODE_E2E_URL to point somewhere else.
set -eu
export KIDYCODE_E2E_URL="${KIDYCODE_E2E_URL:-http://localhost:3001}"
cd "$(dirname "$0")/.."

node --import tsx scripts/e2e-tutor.mjs
node --import tsx --no-warnings scripts/e2e-guardian-db.mjs
node --import tsx --no-warnings scripts/e2e-portfolio.mjs
node --import tsx --no-warnings scripts/e2e-lifecycle.mjs
node --import tsx --no-warnings scripts/e2e-transfer-races.mjs
node --import tsx --no-warnings scripts/e2e-assessment-api.mjs
node --import tsx --no-warnings scripts/e2e-assessment-revision.mjs
node --import tsx --no-warnings scripts/e2e-assessment-defence.mjs