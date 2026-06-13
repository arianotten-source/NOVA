#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing dependencies..."
npm install

echo "==> Compiling Electron..."
npx tsc -p tsconfig.electron.json

echo "==> Building frontend..."
npm run build

echo "==> Done! Run with: npm start"
