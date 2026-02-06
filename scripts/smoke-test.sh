#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
python -m pip install -q -r backend/requirements.txt
python -m pip install -q -r backend/requirements-dev.txt

echo "Running tests..."
cd backend
python -m pytest tests/ -v --tb=short
