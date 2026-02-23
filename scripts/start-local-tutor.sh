#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Euclid's Window (Local Tutor)"
echo "Project root: ${ROOT_DIR}"

if [[ ! -d "${ROOT_DIR}/.venv" ]]; then
  echo "Missing .venv. Create it first:"
  echo "  python -m venv .venv"
  exit 1
fi

source "${ROOT_DIR}/.venv/bin/activate"

echo "Installing backend dependencies..."
pip install -r "${ROOT_DIR}/backend/requirements.txt"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Install with:"
  echo "  brew install ollama"
  echo "Then pull a model, e.g.:"
  echo "  ollama run qwen2.5-math:7b"
else
  echo "Ollama detected."
fi

echo "Starting backend API (serves frontend too)..."
cd "${ROOT_DIR}/backend"
echo "Open http://127.0.0.1:8000 in your browser."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
