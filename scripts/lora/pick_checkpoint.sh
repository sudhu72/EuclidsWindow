#!/usr/bin/env bash
# Pick the training checkpoint by the head-to-head eval, not by loss.
# (v1's held-out loss improved a lot while the judge preferred the base 35-5.)
#
# For every saved checkpoint: fuse + register it in Ollama as <name>-ck<step>,
# run eval.py on the VALID prompts (the test prompts stay untouched for the
# final verdict), and print a table. The best checkpoint = most judge wins
# minus losses; ties broken by ROUGE-L.
#
#   scripts/lora/pick_checkpoint.sh euclid-tutor:v2
set -euo pipefail

NAME="${1:?usage: pick_checkpoint.sh <ollama-model-name>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PY="$ROOT/.venv-lora/bin/python"
BASE_OLLAMA="${BASE_OLLAMA:-qwen3:4b-instruct}"
OUT="$ROOT/models/lora/checkpoints/${NAME//[:\/]/_}"   # per model, so runs never mix
mkdir -p "$OUT"

for ck in "$ROOT"/models/lora/adapters/0*_adapters.safetensors; do
  step=$((10#$(basename "$ck" | cut -d_ -f1)))
  tag="${NAME}-ck${step}"
  echo "==> checkpoint $step -> $tag"
  ADAPTER_FILE="$ck" "$ROOT/scripts/lora/export_ollama.sh" "$tag" > "$OUT/export_$step.log" 2>&1
  "$PY" "$ROOT/scripts/lora/eval.py" --tuned "$tag" --base "$BASE_OLLAMA" --n 1000 \
    --prompts "$ROOT/data/lora/valid_prompts.jsonl" --report "$OUT/valid_$step.json" > "$OUT/eval_$step.log" 2>&1
done

"$PY" - "$OUT" <<'EOF'
import json, sys, pathlib
rows = []
for p in sorted(pathlib.Path(sys.argv[1]).glob("valid_*.json")):
    s = json.loads(p.read_text())["summary"]
    t = s["judge_tally"]
    rows.append((t["tuned"] - t["base"], s["rouge_l_tuned"], p.stem.split("_")[1], s))
rows.sort(key=lambda r: (r[0], r[1]), reverse=True)
print(f"{'step':>5} {'wins':>5} {'losses':>6} {'ties':>5} {'rougeL':>7} {'loops':>6}")
for net, rouge, step, s in rows:
    t = s["judge_tally"]
    print(f"{step:>5} {t['tuned']:>5} {t['base']:>6} {t['tie']:>5} {rouge:>7.3f} {s['looping_tuned']:>6}")
print(f"best: step {rows[0][2]}")
EOF
