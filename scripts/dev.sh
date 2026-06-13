#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npx tsc -p tsconfig.electron.json
npx concurrently -k "vite" "wait-on http://localhost:5175 && electron ."
