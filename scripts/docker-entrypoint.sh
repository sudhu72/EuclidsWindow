#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${LOCAL_LLM_BASE_URL:-}" && -n "${LOCAL_LLM_MODEL:-}" ]]; then
  echo "Waiting for Ollama at ${LOCAL_LLM_BASE_URL}..."
  for _ in {1..30}; do
    if curl -fsS "${LOCAL_LLM_BASE_URL}/api/tags" >/dev/null 2>&1; then
      echo "Ollama is reachable."
      break
    fi
    sleep 2
  done

  # Check whether the model is already pulled
  MODEL_EXISTS=$(curl -fsS "${LOCAL_LLM_BASE_URL}/api/tags" 2>/dev/null \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
names = [m.get('name','') for m in data.get('models',[])]
model = '${LOCAL_LLM_MODEL}'
print('yes' if any(model in n for n in names) else 'no')
" 2>/dev/null || echo "no")

  if [[ "$MODEL_EXISTS" == "yes" ]]; then
    echo "Model '${LOCAL_LLM_MODEL}' is already available."
  else
    echo "Pulling model '${LOCAL_LLM_MODEL}' (this may take a few minutes on first run)..."
    curl -fsSN "${LOCAL_LLM_BASE_URL}/api/pull" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"${LOCAL_LLM_MODEL}\",\"stream\":true}" 2>/dev/null \
      | while IFS= read -r line; do
          STATUS=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || true)
          if [[ -n "$STATUS" ]]; then
            printf "\r  %s" "$STATUS"
          fi
        done
    echo ""
    echo "Model pull complete."
  fi
fi

echo "Seeding database (skips existing entries)..."
python /app/backend/scripts/seed_db.py || echo "Warning: seed_db.py failed (non-fatal)"

exec "$@"
