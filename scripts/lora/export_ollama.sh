#!/usr/bin/env bash
# Fuse the trained LoRA adapter into the base weights and register the result
# with the host Ollama as a new, versioned model. Does NOT switch the app to it:
# run `make lora-eval` first, then pick the model in Settings (or set
# LOCAL_LLM_MODEL) only if it beat the base model.
#
#   scripts/lora/export_ollama.sh euclid-tutor:v1
set -euo pipefail

NAME="${1:?usage: export_ollama.sh <ollama-model-name>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="$ROOT/.venv-lora/bin"
BASE_HF="${BASE_HF:-Qwen/Qwen3-4B-Instruct-2507}"
BASE_OLLAMA="${BASE_OLLAMA:-qwen3:4b-instruct}"  # template + parameters are copied from here
QUANT="${QUANT:-q4_K_M}"                     # match the base model's quantization
REPEAT_PENALTY="${REPEAT_PENALTY:-1.1}"      # v1 looped on 13/40 answers
ADAPTER_FILE="${ADAPTER_FILE:-}"             # e.g. models/lora/adapters/0000200_adapters.safetensors
ADAPTERS="${ADAPTERS:-$ROOT/models/lora/adapters}"   # RAFT: models/lora/raft/adapters
FUSED="$ROOT/models/lora/fused"
GGUF="$ROOT/models/lora/fused.f16.gguf"
# Ollama (0.33) can't import Qwen3 safetensors ("unsupported architecture
# Qwen3ForCausalLM"), so convert with llama.cpp first; works for Qwen2.5 too.
CONVERT="$ROOT/models/lora/tools/llama.cpp/convert_hf_to_gguf.py"
# Ollama >= 0.40 refuses --quantize on GGUF imports, so quantize with llama.cpp.
QUANTIZE="$ROOT/models/lora/tools/llama.cpp/build/bin/llama-quantize"
[ -f "$CONVERT" ] || { echo "Missing $CONVERT — run make lora-setup." >&2; exit 1; }
[ -x "$QUANTIZE" ] || { echo "Missing $QUANTIZE — run make lora-setup." >&2; exit 1; }

[ -f "$ADAPTERS/adapters.safetensors" ] || { echo "No adapter at $ADAPTERS — run make lora-train first." >&2; exit 1; }

# Fuse a specific checkpoint instead of the final weights: mlx_lm.fuse reads
# adapters.safetensors, so stage the checkpoint in a scratch adapter dir.
if [ -n "$ADAPTER_FILE" ]; then
  STAGE="$ROOT/models/lora/staged_adapter"
  rm -rf "$STAGE" && mkdir -p "$STAGE"
  cp "$ADAPTERS/adapter_config.json" "$STAGE/"
  cp "$ADAPTER_FILE" "$STAGE/adapters.safetensors"
  ADAPTERS="$STAGE"
fi

echo "==> Fusing adapter into $BASE_HF"
rm -rf "$FUSED"
"$VENV/mlx_lm.fuse" --model "$BASE_HF" --adapter-path "$ADAPTERS" --save-path "$FUSED" --dequantize

echo "==> Converting to GGUF (f16)"
"$VENV/python" "$CONVERT" "$FUSED" --outtype f16 --outfile "$GGUF" > "$ROOT/models/lora/convert.log" 2>&1 \
  || { tail -20 "$ROOT/models/lora/convert.log" >&2; exit 1; }

echo "==> Quantizing GGUF to $QUANT"
QGGUF="$ROOT/models/lora/fused.$QUANT.gguf"
"$QUANTIZE" "$GGUF" "$QGGUF" "$QUANT" > "$ROOT/models/lora/quantize.log" 2>&1 \
  || { tail -20 "$ROOT/models/lora/quantize.log" >&2; exit 1; }
rm -f "$GGUF"

echo "==> Writing Modelfile (template from $BASE_OLLAMA)"
{
  echo "FROM $QGGUF"
  # Take TEMPLATE from --modelfile: `ollama show --template` prints the raw
  # Jinja chat template for some models (qwen3), which Ollama can't parse.
  ollama show --modelfile "$BASE_OLLAMA" | awk '/^TEMPLATE """/{on=1} on{print} on && /"""$/ && !/^TEMPLATE """.*"""$/ && NR>1 && seen{exit} on{seen=1}' 
  ollama show --parameters "$BASE_OLLAMA" | awk 'NF && $1 != "repeat_penalty" && $1 != "stop" {printf "PARAMETER %s %s\n", $1, substr($0, index($0,$2))}'
  echo 'PARAMETER stop "<|im_start|>"'
  echo 'PARAMETER stop "<|im_end|>"'
  echo "PARAMETER repeat_penalty $REPEAT_PENALTY"
} > "$ROOT/models/lora/Modelfile"

echo "==> ollama create $NAME ($QUANT)"
ollama create "$NAME" -f "$ROOT/models/lora/Modelfile"
rm -f "$QGGUF"   # Ollama keeps its own copy
echo "Done. Compare against the base with: make lora-eval LORA_MODEL=$NAME"
