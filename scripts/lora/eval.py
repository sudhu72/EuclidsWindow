#!/usr/bin/env python3
"""Head-to-head eval: tuned Ollama model vs. the base model on held-out topics.

For each held-out prompt (data/lora/test_prompts.jsonl, built from topics the
adapter never trained on) both models answer with the app's real prompt. Two
scores:
  * ROUGE-L F1 against the hand-written reference answer (cheap, deterministic)
  * a pairwise judge (default qwen3:8b, thinking off) that sees the reference
    and both answers and picks the better one for the level. It runs TWICE
    with the order swapped and a side wins only if it wins both: qwen3:8b
    picks answer A most of the time regardless of content, so a single
    random-order verdict is mostly noise.

Verdict PROMOTE only if the tuned model wins more judged pairs than it loses
AND its ROUGE-L is not lower than the base's. Writes data/lora/eval_report.json
with every answer so you can read them yourself.

  .venv-lora/bin/python scripts/lora/eval.py --tuned euclid-tutor:v2
  .venv-lora/bin/python scripts/lora/eval.py --tuned euclid-tutor:v2 --prompts data/lora/valid_prompts.jsonl
"""
from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dataset import ROOT, chat_messages, tutor_messages  # noqa: E402

JUDGE_PROMPT = """You are grading two answers from a math tutor for a {level}-level learner.

Question: {question}

Reference answer (written by a teacher; treat it as correct):
<<<
{reference}
>>>

Answer A:
<<<
{a}
>>>

Answer B:
<<<
{b}
>>>

Which answer is better? Judge, in order: (1) mathematical correctness, with any
error or invented fact counting heavily against an answer, (2) whether it
actually answers the question, (3) clarity and fit for a {level}-level learner.
Do not prefer an answer just because it is longer.
Reply with ONLY a JSON object: {{"winner": "A" | "B" | "tie", "reason": "<one sentence>"}}"""


def ollama_chat(base_url: str, model: str, messages: list[dict], options: dict, think: bool | None = False,
                attempts: int = 3) -> str:
    body = {"model": model, "messages": messages, "stream": False, "options": options}
    if think is not None:
        body["think"] = think
    req = urllib.request.Request(f"{base_url}/api/chat", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(r.read())["message"]["content"].strip()
    except urllib.error.HTTPError as exc:
        if exc.code == 400 and think is not None:  # model without a thinking toggle
            return ollama_chat(base_url, model, messages, options, think=None, attempts=attempts)
        if exc.code >= 500 and attempts > 1:  # model load failed while others swap in/out
            time.sleep(10)
            return ollama_chat(base_url, model, messages, options, think=think, attempts=attempts - 1)
        raise


def rouge_l(candidate: str, reference: str, cap: int = 600) -> float:
    c = re.findall(r"\w+", candidate.lower())[:cap]
    r = re.findall(r"\w+", reference.lower())[:cap]
    if not c or not r:
        return 0.0
    prev = [0] * (len(r) + 1)
    for tok in c:
        cur = [0]
        for j, rt in enumerate(r, 1):
            cur.append(prev[j - 1] + 1 if tok == rt else max(prev[j], cur[j - 1]))
        prev = cur
    lcs = prev[-1]
    if lcs == 0:
        return 0.0
    p, rec = lcs / len(c), lcs / len(r)
    return 2 * p * rec / (p + rec)


def loops(text: str) -> bool:
    """True if some sentence of 30+ chars appears 3+ times (v1's failure mode)."""
    sents = [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if len(x.strip()) > 30]
    return any(sents.count(x) >= 3 for x in set(sents))


def judge_once(base_url: str, model: str, item: dict, a: str, b: str) -> str:
    """Returns 'A', 'B', or 'TIE'."""
    prompt = JUDGE_PROMPT.format(level=item["level"], question=item["question"],
                                 reference=item["answer"][:3000], a=a[:3000], b=b[:3000])
    raw = ollama_chat(base_url, model, [{"role": "user", "content": prompt}],
                      {"temperature": 0, "num_ctx": 8192, "num_predict": 200}, think=False)
    m = re.search(r'"winner"\s*:\s*"(A|B|tie)"', raw, re.I)
    return m.group(1).upper() if m else "TIE"


def judge(base_url: str, model: str, item: dict, base_ans: str, tuned_ans: str) -> str:
    """Returns 'tuned', 'base', or 'tie'. Judged in both orders; a split verdict is a tie."""
    first = judge_once(base_url, model, item, tuned_ans, base_ans)   # tuned is A
    second = judge_once(base_url, model, item, base_ans, tuned_ans)  # tuned is B
    if first == "A" and second == "B":
        return "tuned"
    if first == "B" and second == "A":
        return "base"
    return "tie"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--tuned", required=True, help="Ollama name of the tuned model")
    ap.add_argument("--base", default="qwen3:4b-instruct", help="the untuned model the adapter was trained from")
    ap.add_argument("--repeat-penalty", type=float, default=1.1,
                    help="applied to BOTH models so the Modelfile setting doesn't decide the comparison")
    ap.add_argument("--think", action="store_true",
                    help="let BOTH models think before answering (for reasoning-model roles)")
    ap.add_argument("--judge", default="qwen3:8b")
    ap.add_argument("--ollama", default="http://localhost:11434")
    ap.add_argument("--n", type=int, default=40, help="held-out prompts to evaluate")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--prompts", type=Path, default=ROOT / "data/lora/test_prompts.jsonl")
    ap.add_argument("--report", type=Path, default=ROOT / "data/lora/eval_report.json")
    ap.add_argument("--rejudge", type=Path, default=None,
                    help="re-score the answers in an existing report (no generation) and write --report")
    args = ap.parse_args()

    items = [json.loads(line) for line in args.prompts.read_text().splitlines() if line.strip()]
    rng = random.Random(args.seed)
    rng.shuffle(items)
    items = items[: args.n]
    gen_opts = {"temperature": 0.2, "num_ctx": 4096, "num_predict": 900, "repeat_penalty": args.repeat_penalty}
    if args.think:  # thinking tokens count against num_predict
        gen_opts.update(num_ctx=16384, num_predict=8000)
    old = {}
    if args.rejudge:
        prev = json.loads(args.rejudge.read_text())
        old = {(r["question"], r["level"]): r for r in prev["rows"]}
        args.tuned, args.base = prev["summary"]["tuned"], prev["summary"]["base"]
        items = [it for it in items if (it["question"], it["level"]) in old]

    rows, tally = [], {"tuned": 0, "base": 0, "tie": 0}
    t0 = time.time()
    for i, it in enumerate(items, 1):
        fmt = tutor_messages if rng.random() < 0.5 else chat_messages
        if args.rejudge:
            r = old[(it["question"], it["level"])]
            base_ans, tuned_ans = r["base"], r["tuned"]
            fmt = tutor_messages if r["format"] == "tutor_messages" else chat_messages
        else:
            msgs = fmt(it["question"], it["level"], "")[:-1]  # drop the empty assistant turn
            base_ans = ollama_chat(args.ollama, args.base, msgs, gen_opts, think=args.think)
            tuned_ans = ollama_chat(args.ollama, args.tuned, msgs, gen_opts, think=args.think)
        verdict = judge(args.ollama, args.judge, it, base_ans, tuned_ans)
        tally[verdict] += 1
        row = dict(question=it["question"], level=it["level"], source=it["source"], format=fmt.__name__,
                   rouge_base=rouge_l(base_ans, it["answer"]), rouge_tuned=rouge_l(tuned_ans, it["answer"]),
                   judge=verdict, base=base_ans, tuned=tuned_ans)
        rows.append(row)
        print(f"[{i}/{len(items)}] {verdict:5s} rougeL base={row['rouge_base']:.3f} tuned={row['rouge_tuned']:.3f}  {it['question'][:70]}")

    rb = sum(r["rouge_base"] for r in rows) / len(rows)
    rt = sum(r["rouge_tuned"] for r in rows) / len(rows)
    promote = tally["tuned"] > tally["base"] and rt >= rb
    summary = dict(tuned=args.tuned, base=args.base, judge=args.judge, n=len(rows),
                   rouge_l_base=round(rb, 4), rouge_l_tuned=round(rt, 4), judge_tally=tally,
                   looping_base=sum(loops(r["base"]) for r in rows), looping_tuned=sum(loops(r["tuned"]) for r in rows),
                   prompts=str(args.prompts.name),
                   verdict="PROMOTE" if promote else "KEEP BASE", minutes=round((time.time() - t0) / 60, 1))
    args.report.write_text(json.dumps(dict(summary=summary, rows=rows), indent=2, ensure_ascii=False))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
