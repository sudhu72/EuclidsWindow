#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${LOCAL_LLM_BASE_URL:-}" && -n "${LOCAL_LLM_MODEL:-}" ]]; then
  echo "Waiting for Ollama at ${LOCAL_LLM_BASE_URL}..."
  for _ in {1..30}; do
    if curl -fsS "${LOCAL_LLM_BASE_URL}/api/tags" >/dev/null; then
      echo "Ollama is reachable."
      break
    fi
    sleep 2
  done

  echo "Ensuring model is available: ${LOCAL_LLM_MODEL}"
  curl -fsS "${LOCAL_LLM_BASE_URL}/api/pull" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${LOCAL_LLM_MODEL}\"}" >/dev/null || true
fi

exec "$@"
