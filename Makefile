PYTHON ?= python3
API_BASE ?= http://localhost:8000
LORA_INPUT ?= backend/data/raw_tuning_records.json
LORA_OUTPUT ?= backend/data/lora_train.jsonl
LORA_BASE_SAMPLE ?= backend/data/raw_tuning_records.sample.json
LORA_FOLLOWUP_SAMPLE ?= backend/data/raw_tuning_records.followup.sample.json
LORA_MERGED_RAW ?= backend/data/raw_tuning_records.merged.json
LORA_FOLLOWUP_WEIGHT ?= 2
LORA_SHUFFLE_SEED ?= 42
LORA_NO_SHUFFLE ?= 0
LORA_MODEL ?= euclid-math-lora-v1

.PHONY: help lora-merge-samples lora-prepare lora-prepare-merged lora-train lora-eval

help:
	@echo "Available targets:"
	@echo "  make lora-merge-samples - Merge base + follow-up raw samples with weighting"
	@echo "  make lora-prepare  - Convert raw records into LoRA JSONL dataset"
	@echo "  make lora-prepare-merged - Merge samples then convert to LoRA JSONL"
	@echo "  make lora-train    - Print starter training commands and next steps"
	@echo "  make lora-eval     - Run quick eval API checks against running app"

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

lora-train:
	@echo "LoRA training scaffold"
	@echo ""
	@echo "1) Prepare dataset:"
	@echo "   make lora-prepare LORA_INPUT=backend/data/raw_tuning_records.json"
	@echo ""
	@echo "2) Train with your preferred stack (PEFT/TRL/Unsloth) using:"
	@echo "   - dataset: $(LORA_OUTPUT)"
	@echo "   - recipe: docs/LORA_TUNING_PLAYBOOK.md"
	@echo ""
	@echo "3) Build Ollama model after export:"
	@echo "   ollama create $(LORA_MODEL) -f Modelfile"
	@echo "   export LOCAL_LLM_MODEL=$(LORA_MODEL)"
	@echo ""
	@echo "Tip: keep versioned model names for rollback (v1, v2, ...)."

lora-eval:
	@echo "Checking app health at $(API_BASE)..."
	@curl -fsS "$(API_BASE)/health" >/dev/null
	@echo "Health OK"
	@echo "Fetching eval report (catalog mode)..."
	@curl -fsS "$(API_BASE)/api/eval/report" | $(PYTHON) -m json.tool >/dev/null
	@echo "Eval report endpoint OK"
	@echo "Fetching eval history..."
	@curl -fsS "$(API_BASE)/api/eval/history" | $(PYTHON) -m json.tool >/dev/null
	@echo "Eval history endpoint OK"
