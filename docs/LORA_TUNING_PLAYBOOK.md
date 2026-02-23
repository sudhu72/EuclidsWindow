# LoRA Tuning Playbook for Euclid's Window

This playbook gives a practical template to tune a local math model for Euclid's Window using LoRA/QLoRA, evaluate improvements, and serve the tuned model through Ollama.

## 1) Goal and Scope

Tune behavior for:

- clearer step-by-step pedagogy,
- stronger follow-up flow (less repetition),
- better formatting consistency,
- stronger symbolic/math reasoning for your target topics.

Out of scope:

- replacing deterministic visual planner logic,
- changing API contracts (keep output compatible with existing app behavior).

## 2) Recommended Stack

- **Training**: Hugging Face `transformers` + `peft` + `trl` (or Unsloth)
- **Precision**: QLoRA (`4-bit` base loading, LoRA adapters)
- **Serving**: Ollama
- **Evaluation**: Euclid's Window eval endpoints + offline regression prompts

## 3) Dataset Design

Use instruction-style JSONL examples. Keep each sample short, high signal, and directly aligned to app behavior.

### Minimal JSONL schema

```json
{"instruction":"Explain Euler identity in plain English.", "input":"Learner level: teen", "output":"..."}
```

Optional richer schema:

```json
{"instruction":"...", "input":"...", "output":"...", "tags":["calculus","followup"], "difficulty":"intermediate"}
```

### Include these data buckets

1. **Core tutor responses**
   - plain mode, axiomatic mode, both mode
2. **Follow-up progression**
   - examples where the second/third turn deepens reasoning instead of repeating
3. **Error-correction examples**
   - weak solution -> corrected step-by-step solution
4. **Topic diversity**
   - algebra, calculus, linear algebra, graph theory, logic/foundations
5. **Formatting constraints**
   - concise bullets, explicit equations, short recap + deeper step

### Data quality checks

- remove duplicates/nearly identical rows,
- avoid contradictory answers,
- ensure output length distribution resembles target UI usage (not always long essays).

## 4) Formatting Script (Template)

Create a script to convert app interactions into train-ready JSONL.

```python
# scripts/prepare_lora_dataset.py
import json
from pathlib import Path

def convert(records):
    out = []
    for r in records:
        instruction = r.get("question", "").strip()
        if not instruction:
            continue
        learner = r.get("learner_level", "teen")
        output = (r.get("answer") or "").strip()
        if not output:
            continue
        out.append(
            {
                "instruction": instruction,
                "input": f"Learner level: {learner}",
                "output": output,
            }
        )
    return out

if __name__ == "__main__":
    src = Path("data/raw_tuning_records.json")
    dst = Path("data/lora_train.jsonl")
    records = json.loads(src.read_text(encoding="utf-8"))
    rows = convert(records)
    with dst.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Wrote {len(rows)} rows to {dst}")
```

## 5) QLoRA Training Configuration (Template)

Typical starting point for a 7B model:

- LoRA rank `r=16` or `32`
- alpha `16` or `32`
- dropout `0.05`
- target modules (example): `q_proj,k_proj,v_proj,o_proj,gate_proj,up_proj,down_proj`
- learning rate: `1e-4` to `2e-4`
- train epochs: `2-4` (start small)
- context length aligned with usage (e.g., 4096 or 8192)

Example (illustrative):

```python
from peft import LoraConfig

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)
```

## 6) Training Loop (Checklist)

1. Split train/validation (e.g., 90/10).
2. Run a short sanity train (few hundred steps).
3. Inspect generations on a fixed prompt set before full training.
4. Train full run.
5. Save adapter + tokenizer artifacts.

Track:

- validation loss trend,
- instruction-following quality,
- qualitative regressions (hallucinations, repetitive follow-ups).

## 7) Merge + Export for Ollama

After training:

1. Merge LoRA adapter into base model (if needed).
2. Convert merged model to GGUF (toolchain-dependent).
3. Create Ollama `Modelfile`.

Example:

```text
FROM /absolute/path/euclid-math-lora-v1.gguf
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
SYSTEM You are a math tutor for Euclid's Window. Be accurate, concise, and pedagogically progressive.
```

```bash
ollama create euclid-math-lora-v1 -f Modelfile
ollama run euclid-math-lora-v1
```

## 8) Integrate with Euclid's Window

Set tuned model:

```bash
export LOCAL_LLM_MODEL=euclid-math-lora-v1
```

or set in UI:

- Settings -> Local LLM Model

Then restart app and verify:

- `/api/settings`
- `/api/settings/test` (target `ollama`)

## 9) Evaluate Before Promoting

Use both:

1. **Built-in endpoints**
   - `/api/eval/report`
   - `/api/eval/history`
   - `/api/eval/compare`
2. **Custom regression prompts**
   - include follow-up flow prompts
   - include symbolic correctness probes
   - include edge topics requiring web RAG assist

Promotion criteria example:

- +X% checks pass rate,
- non-regression on latency budget,
- improved follow-up quality on curated prompt set.

## 10) Versioning and Rollback

Use semantic model names:

- `euclid-math-base`
- `euclid-math-lora-v1`
- `euclid-math-lora-v2`

Keep previous stable model available in settings for quick rollback.

## 11) Common Pitfalls

- Overfitting to one style -> weak generalization
- Too many near-duplicate prompts -> repetition at inference
- Training examples that conflict with deterministic planner behavior
- Ignoring evaluation of follow-up turns (single-turn only)

## 12) Security and Licensing

- Remove PII from training corpora
- Verify base model and dataset license compatibility
- Document provenance of tuned artifacts

## 13) Makefile Shortcuts

If you use the repository Makefile:

```bash
cp backend/data/raw_tuning_records.sample.json backend/data/raw_tuning_records.json
make lora-prepare LORA_INPUT=backend/data/raw_tuning_records.json
make lora-train
make lora-eval API_BASE=http://localhost:8000
```

For stronger multi-turn flow tuning, start from:

```bash
cp backend/data/raw_tuning_records.followup.sample.json backend/data/raw_tuning_records.json
make lora-prepare LORA_INPUT=backend/data/raw_tuning_records.json
```

To combine base + follow-up sets with weighting:

```bash
make lora-prepare-merged LORA_FOLLOWUP_WEIGHT=2 LORA_OUTPUT=backend/data/lora_train.jsonl
```

For reproducible ordering across runs, set a fixed seed:

```bash
make lora-prepare-merged LORA_FOLLOWUP_WEIGHT=2 LORA_SHUFFLE_SEED=42 LORA_OUTPUT=backend/data/lora_train.jsonl
```

To disable shuffling and preserve deterministic concatenation order:

```bash
make lora-prepare-merged LORA_FOLLOWUP_WEIGHT=2 LORA_NO_SHUFFLE=1 LORA_OUTPUT=backend/data/lora_train.jsonl
```

This runs:

1. `scripts/merge_lora_samples.py` (builds `backend/data/raw_tuning_records.merged.json`)
2. `scripts/prepare_lora_dataset.py` (converts merged raw JSON -> JSONL)

---
