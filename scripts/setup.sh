#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Mappenstructuur aanmaken..."
mkdir -p docs assets/{icons,sounds,avatars,wallpapers}
mkdir -p data/{notes,memory,logs,settings}
mkdir -p backend/{api,services,sensors,storage}
mkdir -p frontend/{components,pages,widgets,layouts,styles,hooks,lib,types}
mkdir -p electron scripts exports

echo "==> Dependencies installeren..."
npm install

echo "==> Build controleren..."
npm run build

echo ""
echo "Klaar! Start de app met:"
echo "  npm run electron:dev   (development)"
echo "  npm start              (productie)"
