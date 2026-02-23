#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Euclid's Window (frontend + backend)"
echo "Project root: ${ROOT_DIR}"

if [[ ! -x "${ROOT_DIR}/scripts/start-local-tutor.sh" ]]; then
  echo "Missing scripts/start-local-tutor.sh"
  exit 1
fi

"${ROOT_DIR}/scripts/start-local-tutor.sh"
