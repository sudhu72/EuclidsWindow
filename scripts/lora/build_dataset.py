#!/usr/bin/env python3
"""Build the LoRA training set for the local tutor model.

Sources (all already in the app's harness):
  1. Curated topics (backend/data/demo_topics.json) — every topic has a
     hand-written answer for each learner level (kids/teen/college/adult).
  2. Cogito Feynman tutorials (~/Research/cogito math/ + ml/) — split into
     sections, each one an "explain this" example at the adult level.
  3. Optional extra records (--extra) in the instruction/input/output JSONL
     schema produced by scripts/prepare_lora_dataset.py, e.g. exported tutor
     conversations you have reviewed.

Each example is rendered with the SAME prompts the app sends at runtime, so the
tuned model learns the exact format it will be asked in:
  * "tutor" format — the one-shot prompt from ai/service.py
    (REASONING_SYSTEM_PROMPT + COMPACT_TEACHING + COMPACT_SKILL + user template)
  * "chat" format — the streaming chat system prompt from routers/chat.py

Splits are by topic/tutorial (not by row), so valid/test measure answers on
topics the model never trained on. Output is MLX chat JSONL:
  data/lora/{train,valid,test}.jsonl  — {"messages": [...]}
  data/lora/{valid,test}_prompts.jsonl — held-out prompts + reference answers for eval.py
  data/lora/train_prompts.jsonl — the training prompts, input to distill.py

With --distilled, the TRAIN answers come from distill.py (teacher answers that
beat the base model) while valid/test keep the hand-written references, so
every run is scored on the same held-out prompts.

Usage:
  .venv-lora/bin/python scripts/lora/build_dataset.py
  .venv-lora/bin/python scripts/lora/build_dataset.py --extra data/lora/reviewed_conversations.jsonl
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.ai.prompts import (  # noqa: E402
    LEVEL_INSTRUCTIONS,
    REASONING_SYSTEM_PROMPT,
    REASONING_USER_TEMPLATE,
)
from app.ai.skills import COMPACT_SKILL, COMPACT_TEACHING  # noqa: E402

LEVELS = ("kids", "teen", "college", "adult")
COGITO_TRACKS = ("math", "ml")
MAX_ANSWER_CHARS = 6000
SECTION_MIN, SECTION_MAX = 600, 4500
SECTIONS_PER_TUTORIAL = 6


def chat_system_prompt() -> str:
    """CHAT_SYSTEM_PROMPT lives in routers/chat.py, which imports FastAPI; read
    the expression out of the source (strings + the skill constants it
    concatenates) instead of importing the router."""
    src = (ROOT / "backend/app/routers/chat.py").read_text()
    for node in ast.parse(src).body:
        if isinstance(node, ast.Assign) and any(
            isinstance(t, ast.Name) and t.id == "CHAT_SYSTEM_PROMPT" for t in node.targets
        ):
            names = {"COMPACT_TEACHING": COMPACT_TEACHING, "COMPACT_SKILL": COMPACT_SKILL}
            return eval(compile(ast.Expression(node.value), "chat.py", "eval"), {"__builtins__": {}}, names)
    raise RuntimeError("CHAT_SYSTEM_PROMPT not found in routers/chat.py")


CHAT_SYSTEM = chat_system_prompt()


def tutor_messages(question: str, level: str, answer: str) -> list[dict]:
    prompt = (
        REASONING_SYSTEM_PROMPT + "\n\n" + COMPACT_TEACHING + "\n\n" + COMPACT_SKILL + "\n\n"
        + REASONING_USER_TEMPLATE.format(
            context="", question=question, level_instruction=LEVEL_INSTRUCTIONS.get(level, "")
        )
    )
    return [{"role": "user", "content": prompt}, {"role": "assistant", "content": answer}]


def chat_messages(question: str, level: str, answer: str) -> list[dict]:
    system = CHAT_SYSTEM + "\n\n" + LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["teen"])
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": question},
        {"role": "assistant", "content": answer},
    ]


def split_of(group: str, valid_pct: int, test_pct: int) -> str:
    """Stable per-group split so a topic never straddles train and test."""
    bucket = int(hashlib.sha1(group.encode()).hexdigest(), 16) % 100
    if bucket < test_pct:
        return "test"
    if bucket < test_pct + valid_pct:
        return "valid"
    return "train"


def _as_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str) and value.startswith("["):
        try:
            return [str(v) for v in ast.literal_eval(value)]
        except (ValueError, SyntaxError):
            return []
    return []


def _clean(text) -> str:
    text = str(text or "").strip()
    return "" if text in ("", "None") else text[:MAX_ANSWER_CHARS]


def curated_examples() -> list[dict]:
    topics = json.loads((ROOT / "backend/data/demo_topics.json").read_text())["topics"]
    out = []
    for t in topics:
        questions = [k for k in _as_list(t.get("keywords")) if k.strip().endswith("?")]
        if not questions:
            questions = [f"Explain {t['name']}."]
        for i, level in enumerate(LEVELS):
            answer = _clean(t.get(f"{level}_content"))
            if len(answer) < 80:
                continue
            q = questions[i % len(questions)]
            q = q[0].upper() + q[1:]
            out.append(dict(group=f"topic:{t['id']}", source="curated", level=level, question=q, answer=answer))
    return out


def _sections(md: str) -> tuple[str, list[tuple[str, str]]]:
    title_m = re.search(r"^#\s+(.+)$", md, re.M)
    title = title_m.group(1).strip() if title_m else ""
    parts = re.split(r"^##\s+(.+)$", md, flags=re.M)
    secs = []
    for heading, body in zip(parts[1::2], parts[2::2]):
        body = body.strip()
        if SECTION_MIN <= len(body) <= SECTION_MAX:
            secs.append((heading.strip(), body))
    return title, secs


def cogito_sections(md: Path) -> list[tuple[str, str, str]]:
    """The (title, heading, body) sections picked from one tutorial — spread
    across it instead of taking the intro only. Shared with rebuild_cogito_qa.py."""
    title, secs = _sections(md.read_text(errors="ignore"))
    if not secs:
        return []
    step = max(1, len(secs) // SECTIONS_PER_TUTORIAL)
    return [(title, h, b) for h, b in secs[::step][:SECTIONS_PER_TUTORIAL]]


def cogito_examples(cogito: Path) -> list[dict]:
    """Raw sections as answers (the v1 recipe). Prefer --cogito-qa: raw sections
    often point at context the model never sees ("as we saw in Part 2")."""
    out = []
    for track in COGITO_TRACKS:
        for md in sorted((cogito / track).rglob("*.md")):
            if md.name.lower() == "readme.md":
                continue
            for title, heading, body in cogito_sections(md):
                # "Eigenvalues and Eigenvectors: The Directions ... — The Feynman Way" -> "Eigenvalues and Eigenvectors"
                topic_name = re.split(r"\s+[—:-]\s+|:\s", title)[0].strip()
                # Drop outline numbering: "PART 3 —", "Part F —", "2.4.", "§3.6", a bare leading dash.
                h = re.sub(r"^(?:part|step|section|§)?\s*[\dA-Z]{0,3}(?:\.\d+)*\s*[—:.)-]\s*", "", heading, flags=re.I)
                h = h.strip(" —-") or heading
                topic = f" ({topic_name})" if topic_name and topic_name.lower() not in h.lower() else ""
                question = f"{h}{topic}" if h.endswith("?") else f"Explain {h}{topic}."
                out.append(dict(
                    group=f"cogito:{md.relative_to(cogito)}", source="cogito", level="adult",
                    question=question, answer=body,
                ))
    return out


def cogito_qa_examples(path: Path) -> list[dict]:
    """Standalone Q&A pairs written by rebuild_cogito_qa.py (rejected sections skipped)."""
    out = []
    for line in path.read_text().splitlines():
        r = json.loads(line)
        if r.get("reject") or not r.get("answer"):
            continue
        out.append(dict(group=f"cogito:{r['file']}", source="cogito_qa", level="adult",
                        question=r["question"].strip(), answer=_clean(r["answer"])))
    return out


def extra_examples(paths: list[Path]) -> list[dict]:
    out = []
    for p in paths:
        for line in p.read_text().splitlines():
            if not line.strip():
                continue
            r = json.loads(line)
            m = re.search(r"Learner level:\s*(\w+)", r.get("input", ""))
            level = m.group(1).lower() if m and m.group(1).lower() in LEVELS else "teen"
            answer = _clean(r.get("output"))
            if r.get("instruction") and answer:
                out.append(dict(group=f"extra:{r['instruction'][:80]}", source=p.name, level=level,
                                question=r["instruction"], answer=answer))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cogito", type=Path, default=Path.home() / "Research/cogito")
    ap.add_argument("--extra", type=Path, nargs="*", default=[])
    ap.add_argument("--out", type=Path, default=ROOT / "data/lora")
    ap.add_argument("--valid-pct", type=int, default=5)
    ap.add_argument("--test-pct", type=int, default=8)
    ap.add_argument("--no-cogito", action="store_true", help="curated topics (+ --extra) only")
    ap.add_argument("--cogito-qa", type=Path, default=None,
                    help="use rebuilt standalone pairs (rebuild_cogito_qa.py output) instead of raw sections")
    ap.add_argument("--distilled", type=Path, default=None,
                    help="train on distill.py's kept answers instead of the references")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    examples = curated_examples()
    if args.cogito_qa:
        examples += cogito_qa_examples(args.cogito_qa)
    elif not args.no_cogito and args.cogito.exists():
        examples += cogito_examples(args.cogito)
    examples += extra_examples(args.extra)

    rng = random.Random(args.seed)
    splits: dict[str, list] = {"train": [], "valid": [], "test": []}
    prompts: dict[str, list] = {"train": [], "valid": [], "test": []}
    for ex in examples:
        split = split_of(ex["group"], args.valid_pct, args.test_pct)
        # Alternate the two runtime formats so the adapter learns both.
        fmt = rng.choice((tutor_messages, chat_messages))
        if not (args.distilled and split == "train"):
            splits[split].append({"messages": fmt(ex["question"], ex["level"], ex["answer"])})
        prompts[split].append({k: ex[k] for k in ("group", "source", "level", "question", "answer")})
    if args.distilled:
        kept = [json.loads(line) for line in args.distilled.read_text().splitlines() if line.strip()]
        kept = [r for r in kept if r.get("keep")]
        for r in kept:
            assert split_of(r["group"], args.valid_pct, args.test_pct) == "train", r["group"]
            splits["train"].append({"messages": r["messages"]})
        print(f"distilled: {len(kept)} kept answers replace the train references")

    args.out.mkdir(parents=True, exist_ok=True)
    for name, rows in splits.items():
        rng.shuffle(rows)
        with open(args.out / f"{name}.jsonl", "w") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    # valid_prompts picks a checkpoint; test_prompts is touched once, for the final verdict.
    for name, rows in prompts.items():
        if name == "train" and args.distilled:
            continue  # keep the prompt list distill.py ran on
        with open(args.out / f"{name}_prompts.jsonl", "w") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    by_source: dict[str, int] = {}
    for ex in examples:
        by_source[ex["source"]] = by_source.get(ex["source"], 0) + 1
    print(f"examples: {len(examples)} {by_source}")
    print("splits: " + ", ".join(f"{k}={len(v)}" for k, v in splits.items()) + f" -> {args.out}")


if __name__ == "__main__":
    main()
