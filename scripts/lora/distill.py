#!/usr/bin/env python3
"""Distill better training answers from a stronger local teacher.

Why: v2 imitated the hand-written references, but the gate's judge prefers the
base model's answers even to those references (27-43). Imitating them can't
beat the base, so train on answers that already do.

For each training prompt (data/lora/train_prompts.jsonl):
  1. the teacher (default qwen3:8b, thinking ON) answers the app's real runtime
     prompt, with the reference given as private source notes for facts,
     examples and level — the student never sees the notes;
  2. the base model (qwen3:4b-instruct) answers the same prompt without notes;
  3. reject teacher answers that loop, point at the notes/unseen context, or
     run past the token budget;
  4. the judge compares teacher vs. base TWICE, with the order swapped, and
     the answer is kept only if it wins both times (cancels position bias).

Kept rows store the student-facing messages (runtime prompt + teacher answer)
for `build_dataset.py --distilled`. Resumable: re-running skips done prompts.

  .venv-lora/bin/python scripts/lora/distill.py
  .venv-lora/bin/python scripts/lora/distill.py --limit 20     # smoke test
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dataset import ROOT, chat_messages, tutor_messages  # noqa: E402
from eval import JUDGE_PROMPT, loops, ollama_chat  # noqa: E402
from rebuild_cogito_qa import CONTEXT_REF  # noqa: E402

NOTES = """

Private source notes for this question, from the course (accurate):
<<<
{reference}
>>>
Use their facts, examples and difficulty level, but write your own complete
answer to the learner. Never mention or refer to these notes, a tutorial,
"above"/"earlier" material, or anything the learner cannot see."""


def with_notes(msgs: list[dict], reference: str) -> list[dict]:
    """Append the notes to the system turn (chat format) or the user turn (tutor format)."""
    out = [dict(m) for m in msgs]
    out[0]["content"] += NOTES.format(reference=reference[:4000])
    return out


def judge_once(args, item: dict, a: str, b: str) -> str:
    prompt = JUDGE_PROMPT.format(level=item["level"], question=item["question"],
                                 reference=item["answer"][:3000], a=a[:3000], b=b[:3000])
    raw = ollama_chat(args.ollama, args.judge, [{"role": "user", "content": prompt}],
                      {"temperature": 0, "num_ctx": 8192, "num_predict": 200}, think=False)
    low = raw.lower()
    for w in ("a", "b", "tie"):
        if f'"winner": "{w}"' in low or f'"winner":"{w}"' in low:
            return w
    return "tie"


def process(args, item: dict, fmt_name: str) -> dict:
    fmt = tutor_messages if fmt_name == "tutor" else chat_messages
    msgs = fmt(item["question"], item["level"], "")[:-1]
    gen = {"temperature": 0.3, "num_ctx": 8192, "repeat_penalty": 1.1}
    teacher = ollama_chat(args.ollama, args.teacher, with_notes(msgs, item["answer"]),
                          {**gen, "num_predict": args.teacher_tokens}, think=args.think)
    base = ollama_chat(args.ollama, args.base, msgs, {**gen, "num_predict": 900}, think=False)
    row = dict(group=item["group"], source=item["source"], level=item["level"], format=fmt_name,
               question=item["question"], teacher=teacher, base=base, keep=False, reject=None)
    m = CONTEXT_REF.search(teacher)
    if not teacher or len(teacher) < 200:
        row["reject"] = "empty"
    elif loops(teacher):
        row["reject"] = "loops"
    elif m or re.search(r"\b(the|these|source|course) notes\b", teacher, re.I):
        row["reject"] = f"context_ref:{m.group(0) if m else 'notes'}"
    else:
        first = judge_once(args, item, teacher, base)   # teacher is A
        second = judge_once(args, item, base, teacher)  # teacher is B
        row["judge"] = [first, second]
        if first == "a" and second == "b":
            row["keep"] = True
            row["messages"] = fmt(item["question"], item["level"], teacher)
        else:
            row["reject"] = "judge"
    return row


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--prompts", type=Path, default=ROOT / "data/lora/train_prompts.jsonl")
    ap.add_argument("--out", type=Path, default=ROOT / "data/lora/distilled.jsonl")
    ap.add_argument("--teacher", default="qwen3:8b")
    ap.add_argument("--think", action=argparse.BooleanOptionalAction, default=True,
                    help="teacher thinking on (more correct, slower)")
    ap.add_argument("--teacher-tokens", type=int, default=6000, help="thinking + answer budget")
    ap.add_argument("--base", default="qwen3:4b-instruct")
    ap.add_argument("--judge", default="qwen3:8b")
    ap.add_argument("--ollama", default="http://localhost:11434")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--seed", type=int, default=13)
    args = ap.parse_args()

    items = [json.loads(line) for line in args.prompts.read_text().splitlines() if line.strip()]
    rng = random.Random(args.seed)
    jobs = [(it, rng.choice(("tutor", "chat"))) for it in items]  # same mix as build_dataset
    done = set()
    if args.out.exists():
        for line in args.out.read_text().splitlines():
            r = json.loads(line)
            done.add((r["group"], r["level"], r["question"]))
    jobs = [j for j in jobs if (j[0]["group"], j[0]["level"], j[0]["question"]) not in done]
    if args.limit:
        jobs = jobs[: args.limit]
    print(f"prompts: {len(items)} total, {len(done)} already done, {len(jobs)} to go", flush=True)

    lock, tally, t0 = threading.Lock(), {}, time.time()

    def work(job):
        try:
            row = process(args, *job)
        except Exception as exc:  # keep going; the prompt is retried on the next run
            print(f"  error: {exc}", flush=True)
            return
        with lock:
            with open(args.out, "a") as f:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
            key = "kept" if row["keep"] else row["reject"].split(":")[0]
            tally[key] = tally.get(key, 0) + 1
            n = sum(tally.values())
            if n % 10 == 0 or n == len(jobs):
                print(f"  {n}/{len(jobs)} {tally}  {(time.time() - t0) / 60:.0f} min", flush=True)

    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(work, jobs))
    print(f"done: {tally}")


if __name__ == "__main__":
    main()
