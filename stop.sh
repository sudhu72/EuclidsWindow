#!/usr/bin/env bash
set -euo pipefail

echo "🛑 Stopping Euclid's Window..."
docker compose down

echo ""
echo "✅ All containers stopped"
echo ""
echo "To start again, run: ./start.sh"
