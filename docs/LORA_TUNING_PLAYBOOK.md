# LoRA Tuning Playbook for Euclid's Window

Tune the local tutor model on the app's own teaching content, check it against
the base model on topics it never trained on, and only then serve it through
Ollama. Everything runs on one Apple Silicon Mac with [MLX](https://github.com/ml-explore/mlx-lm).

```bash
make lora-setup                                   # once: .venv-lora, mlx-lm, llama.cpp converter
make lora-data LORA_COGITO_QA=data/lora/cogito_qa.jsonl
make lora-distill                                 # hours: teacher answers that beat the base
make lora-data LORA_COGITO_QA=data/lora/cogito_qa.jsonl LORA_DISTILLED=data/lora/distilled.jsonl
make lora-train && make lora-pick LORA_MODEL=euclid-tutor:v3
make lora-export LORA_MODEL=euclid-tutor:v3 ADAPTER_FILE=models/lora/adapters/0000NNN_adapters.safetensors
make lora-eval LORA_MODEL=euclid-tutor:v3        # final verdict on the TEST prompts
```

## 1) What gets tuned, and why

Retrieval (library, concept graph, skills) already improves answers without any
training. LoRA goes one step further: it teaches the local model the *style*
the app wants — Feynman-method explanations, the four learner levels, LaTeX
conventions, "say I don't know" — so it needs less prompting to get there.

- **Base model:** `Qwen/Qwen3-4B-Instruct-2507`, the Hugging Face weights of
  Ollama's `qwen3:4b-instruct`.
- **Method:** LoRA (rank 8, scale 10) on the top 8 of 36 transformer blocks,
  lr 5e-5, loss on the answer tokens only (`mask_prompt`). See
  `scripts/lora/lora_config.yaml`.

## 2) Training data

`scripts/lora/build_dataset.py` builds `data/lora/{train,valid,test}.jsonl`
(MLX chat format) plus `{train,valid,test}_prompts.jsonl` (question, level,
reference answer):

| Source | Examples | Notes |
|---|---|---|
| Curated topics (`backend/data/demo_topics.json`) | 588 | Each topic's hand-written answer at each learner level |
| Cogito Q&A (`--cogito-qa`, from `rebuild_cogito_qa.py`) | 502 | Tutorial sections rewritten by `qwen3:8b` as standalone question + answer; rejected if they point at unseen context or invent numbers |
| Raw cogito sections (default without `--cogito-qa`) | ~660 | Used in v1; 44% referred to "above"/earlier parts the model never sees — avoid |
| `--extra` (optional) | any | Reviewed records in the instruction/input/output schema of `scripts/prepare_lora_dataset.py` |
| `--distilled` (optional) | kept rows | Replaces the TRAIN answers with teacher answers from `distill.py` (section 3) |

Every example is rendered with the **same prompts the app sends at runtime**,
imported from the backend: the *tutor* format (`REASONING_SYSTEM_PROMPT` +
`COMPACT_TEACHING` + `COMPACT_SKILL` + user template) and the *chat* format
(the system prompt from `routers/chat.py`).

The split is **by topic/tutorial** (about 87/5/8), so valid/test measure
answers on topics the model never saw. Valid prompts pick the checkpoint; test
prompts are used once, for the final verdict.

## 3) Distillation — `make lora-distill`

Imitating the references doesn't beat the base model (see section 7): the
judge prefers `qwen3:4b-instruct`'s own answers even to the hand-written
references. `scripts/lora/distill.py` builds better targets instead. For each
training prompt:

1. the teacher (`qwen3:8b`, thinking on) answers the runtime prompt, with the
   reference given as private source notes for facts, examples and level;
2. the base model answers the same prompt without notes;
3. teacher answers that loop or mention the notes / unseen context are dropped;
4. the judge compares teacher vs. base in **both orders**; the answer is kept
   only if it wins both.

It is resumable (re-run to continue) and takes several hours for ~930 prompts
on an M5 Max. Expect roughly 1 in 5 answers to be kept. Train on the kept rows
with `make lora-data ... LORA_DISTILLED=data/lora/distilled.jsonl`; with a few
hundred examples, lower `iters` so the run stays around 2 epochs.

## 4) Train — `make lora-train`

The adapter is saved to `models/lora/adapters/` every 100 steps and the log
goes to `models/lora/train.log`. Validation loss is reported every 50 steps, but
**don't pick the checkpoint by loss** — v1's loss improved a lot while the
judge preferred the base 35–5. `make lora-test` reports held-out loss for base
vs. adapter as a cheap sanity check.

## 5) Pick and gate — `make lora-pick`, `make lora-eval`

`scripts/lora/pick_checkpoint.sh` exports every checkpoint as
`<name>-ck<step>`, runs the head-to-head on the **valid** prompts, and writes
results to `models/lora/checkpoints/<name>/`. Then export the best checkpoint
under its final name and run `make lora-eval` on the **test** prompts.

`scripts/lora/eval.py` asks both Ollama models the same questions with the
app's prompts (same `repeat_penalty` for both), then:

- scores each answer by ROUGE-L against the reference,
- has a judge (`qwen3:8b`, thinking off) pick the better answer **twice, with
  the order swapped**; a side wins only if it wins both, otherwise it's a tie,
- counts answers that loop (a sentence repeated 3+ times).

It prints **PROMOTE** only if the tuned model wins more pairs than it loses
*and* its ROUGE-L is not lower. Every answer is saved in the report so you can
read them. `--rejudge <report>` re-scores saved answers without regenerating.

## 6) Export and serve — `make lora-export`

`scripts/lora/export_ollama.sh` fuses the adapter (`mlx_lm.fuse --dequantize`;
`ADAPTER_FILE=` picks a checkpoint), converts to GGUF f16 with llama.cpp's
`convert_hf_to_gguf.py`, writes a Modelfile with the base model's template and
parameters plus `repeat_penalty 1.1`, and runs `ollama create --quantize q4_K_M`
(the base's quantization, so the comparison is fair).

Exporting does **not** switch the app. If the gate says PROMOTE, select the
model under **Settings → Local LLM Model** (a saved setting overrides
`LOCAL_LLM_MODEL`). Keep old versions in Ollama until a newer one has proven
itself; delete the `-ck<step>` candidates afterwards.

## 7) Results so far

| Run | Base | Data | vs. base (judge) | Notes |
|---|---|---|---|---|
| v1 | Qwen2.5-1.5B | curated + raw cogito sections | 5–35 (test) | 13/40 answers looped; pointed at unseen context |
| v2a | Qwen3-4B | curated only | best 11–17 (valid) | no loops; copied the curated format (emojis, short) |
| v2b | Qwen3-4B | curated + 502 cogito Q&A | best 19–51 (valid) | no loops |
| v3 | Qwen3-4B | 303 distilled answers, 160 iters | 10–7 (valid, step 80); **9–10, 73 ties (test)** | no loops; ROUGE-L 0.153 vs 0.139; answers ~16% shorter; even with the base, not promoted |

v1–v2 verdicts used a single random-order judgment; v3 and later judge both orders.

**v3 takeaway:** distillation closed the gap (v2b lost 19–51; v3 is a coin flip)
but didn't open a lead. Most pairs are split verdicts, so this judge can't
separate the two models. Next levers: more kept examples (2+ teacher samples per
prompt; only 22 kids-level rows were kept), a stronger teacher, or a stronger
judge.

**Why v2 lost:** the references themselves lose to the base 27–43 under the
same judge (median length: base 3,166 chars, reference 1,229). Imitating them
can't win, which is what motivated distillation.

**Base model comparison:** `qwen3:4b-instruct` beat `qwen2.5:1.5b` 50–1
(41 ties, both-order judging) on the 92 test prompts. Through the app itself
(`scripts/lora/app_eval.py`, which drives `/api/ai/tutor/stream` and switches
the saved setting per model) it won 26–1 (13 ties) on 40 valid prompts, with
0 looping answers vs. 5; first token 0.8 s vs. 0.7 s, full answer 12.8 s vs.
5.6 s median. The app's default local model is now `qwen3:4b-instruct`.

## 8) Pitfalls

- **Use Homebrew Python, not Anaconda, for `.venv-lora`.** Anaconda ships MPICH,
  and MLX aborts ("MLX requires Open MPI but this is MPICH").
- **Ollama can't import Qwen3 safetensors** ("unsupported architecture
  Qwen3ForCausalLM"); the export converts to GGUF first.
- **Take the template from `ollama show --modelfile`**, not `--template`: for
  qwen3 the latter prints raw Jinja, which Ollama can't parse.
- **The judge has a strong position bias** — `qwen3:8b` picks answer A most of
  the time regardless of content. Always judge both orders.
- **The judge favours longer answers** despite being told not to. If you want
  short answers (kids/teen), read the saved pairs yourself before trusting it.
- **Re-run `make lora-data` after a cogito sync** (and `rebuild_cogito_qa.py`
  for new tutorials).
- **Licensing:** Qwen3-4B-Instruct-2507 is Apache-2.0. The training content is
  this project's own (curated topics, cogito tutorials).
