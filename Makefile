PYTHON ?= python3
API_BASE ?= http://localhost:8010
LORA_INPUT ?= backend/data/raw_tuning_records.json
LORA_OUTPUT ?= backend/data/lora_train.jsonl
LORA_BASE_SAMPLE ?= backend/data/raw_tuning_records.sample.json
LORA_FOLLOWUP_SAMPLE ?= backend/data/raw_tuning_records.followup.sample.json
LORA_MERGED_RAW ?= backend/data/raw_tuning_records.merged.json
LORA_FOLLOWUP_WEIGHT ?= 2
LORA_SHUFFLE_SEED ?= 42
LORA_NO_SHUFFLE ?= 0
LORA_MODEL ?= euclid-tutor:v2
LORA_BASE_HF ?= Qwen/Qwen3-4B-Instruct-2507
LORA_BASE_OLLAMA ?= qwen3:4b-instruct
LORA_VENV ?= .venv-lora
LORA_PY := $(LORA_VENV)/bin/python
LORA_EVAL_N ?= 40

.PHONY: help lora-merge-samples lora-prepare lora-prepare-merged lora-setup lora-data lora-distill lora-train lora-test lora-pick lora-export lora-eval lora-all app-eval

help:
	@echo "Available targets:"
	@echo "  make lora-setup    - Create $(LORA_VENV) with mlx-lm (Apple Silicon; uses Homebrew python3.12, not Anaconda)"
	@echo "  make lora-data     - Build data/lora/{train,valid,test}.jsonl from curated topics + cogito tutorials"
	@echo "  make lora-distill  - Teacher (qwen3:8b) answers for the train prompts; keeps only those that beat the base"
	@echo "  make lora-train    - Train the LoRA adapter (scripts/lora/lora_config.yaml)"
	@echo "  make lora-test     - Held-out loss/perplexity: base vs. adapter"
	@echo "  make lora-pick     - Export each checkpoint and pick the best by head-to-head on VALID prompts"
	@echo "  make lora-export   - Fuse adapter (ADAPTER_FILE=... for a checkpoint) and register it in Ollama as $(LORA_MODEL)"
	@echo "  make lora-eval     - Head-to-head vs. the base model on held-out topics; prints PROMOTE / KEEP BASE"
	@echo "  make lora-all      - data -> train -> test -> export -> eval"
	@echo "  make lora-merge-samples / lora-prepare - Turn reviewed raw tutor records into extra training JSONL"
	@echo "  make app-eval      - Check the app's eval endpoints at $(API_BASE)"

lora-setup:
	/opt/homebrew/bin/python3.12 -m venv $(LORA_VENV)
	$(LORA_VENV)/bin/pip install --upgrade pip mlx-lm
	# llama.cpp's converter: Ollama can't import Qwen3 safetensors directly
	[ -d models/lora/tools/llama.cpp ] || git clone --depth 1 https://github.com/ggml-org/llama.cpp models/lora/tools/llama.cpp
	$(LORA_VENV)/bin/pip install -e models/lora/tools/llama.cpp/gguf-py sentencepiece "transformers>=4.45" torch

lora-data:
	$(LORA_PY) scripts/lora/build_dataset.py $(if $(LORA_COGITO_QA),--cogito-qa $(LORA_COGITO_QA),) $(if $(LORA_EXTRA),--extra $(LORA_EXTRA),) $(if $(LORA_DISTILLED),--distilled $(LORA_DISTILLED),)

lora-distill:
	$(LORA_PY) -u scripts/lora/distill.py --base $(LORA_BASE_OLLAMA) 2>&1 | tee -a models/lora/distill.log

lora-train:
	@mkdir -p models/lora
	$(LORA_VENV)/bin/mlx_lm.lora -c scripts/lora/lora_config.yaml 2>&1 | tee models/lora/train.log

LORA_TEST_ARGS = --model $(LORA_BASE_HF) --data data/lora --test --mask-prompt --max-seq-length 2048 --test-batches -1

lora-test:
	@echo "== base model, held-out test set"
	$(LORA_VENV)/bin/mlx_lm.lora $(LORA_TEST_ARGS) --adapter-path ""
	@echo "== base + adapter"
	$(LORA_VENV)/bin/mlx_lm.lora $(LORA_TEST_ARGS) --adapter-path models/lora/adapters

lora-pick:
	BASE_OLLAMA=$(LORA_BASE_OLLAMA) scripts/lora/pick_checkpoint.sh $(LORA_MODEL)

lora-export:
	BASE_HF=$(LORA_BASE_HF) BASE_OLLAMA=$(LORA_BASE_OLLAMA) scripts/lora/export_ollama.sh $(LORA_MODEL)

lora-eval:
	$(LORA_PY) scripts/lora/eval.py --tuned $(LORA_MODEL) --base $(LORA_BASE_OLLAMA) --n $(LORA_EVAL_N)

lora-all: lora-data lora-train lora-test lora-export lora-eval

lora-merge-samples:
	@$(PYTHON) scripts/merge_lora_samples.py \
		--base "$(LORA_BASE_SAMPLE)" \
		--followup "$(LORA_FOLLOWUP_SAMPLE)" \
		--followup-weight "$(LORA_FOLLOWUP_WEIGHT)" \
		--seed "$(LORA_SHUFFLE_SEED)" \
		$(if $(filter 1 true TRUE yes YES,$(LORA_NO_SHUFFLE)),--no-shuffle,) \
		--output "$(LORA_MERGED_RAW)"

lora-prepare:
	@$(PYTHON) scripts/prepare_lora_dataset.py --input "$(LORA_INPUT)" --output "$(LORA_OUTPUT)"

lora-prepare-merged: lora-merge-samples
	@$(PYTHON) scripts/prepare_lora_dataset.py --input "$(LORA_MERGED_RAW)" --output "$(LORA_OUTPUT)"

app-eval:
	@echo "Checking app health at $(API_BASE)..."
	@curl -fsS "$(API_BASE)/health" >/dev/null
	@echo "Health OK"
	@echo "Fetching eval report (catalog mode)..."
	@curl -fsS "$(API_BASE)/api/eval/report" | $(PYTHON) -m json.tool >/dev/null
	@echo "Eval report endpoint OK"
	@echo "Fetching eval history..."
	@curl -fsS "$(API_BASE)/api/eval/history" | $(PYTHON) -m json.tool >/dev/null
	@echo "Eval history endpoint OK"
