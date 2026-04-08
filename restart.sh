#!/usr/bin/env bash
set -euo pipefail

# Quick restart without rebuilding - useful when you only changed code
# that's mounted as a volume

echo "🔄 Quick restart (no rebuild)..."
docker compose restart euclids-window

echo ""
echo "✅ App restarted!"
echo "→ Open: http://localhost:${HOST_PORT:-8000}"
