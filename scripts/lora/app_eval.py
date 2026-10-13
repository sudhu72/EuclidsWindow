#!/usr/bin/env python3
"""End-to-end model comparison through the running app.

eval.py talks to Ollama directly. This goes through the app's streaming tutor
(/api/ai/tutor/stream, which always uses the LOCAL model, whatever the cloud
provider setting) so retrieval, prompts and streaming are exactly what users
get. For each model it sets Settings -> Local LLM Model, asks the held-out
questions (skip_curated, so the model answers rather than a canned topic),
records time-to-first-token and total time, then judges each pair in both
orders. The saved setting is restored to --restore at the end.

  .venv-lora/bin/python scripts/lora/app_eval.py --a qwen2.5:1.5b --b qwen3:4b-instruct
"""
from __future__ import annotations

import argparse
import json
import random
import statistics
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dataset import ROOT  # noqa: E402
from eval import judge, loops  # noqa: E402


def set_model(api: str, model: str) -> None:
    req = urllib.request.Request(f"{api}/api/settings", method="PUT",
                                 data=json.dumps({"local_llm_model": model}).encode(),
                                 headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=30).read()


def ask(api: str, item: dict) -> dict:
    body = {"question": item["question"], "learner_level": item["level"], "skip_curated": True}
    req = urllib.request.Request(f"{api}/api/ai/tutor/stream", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    t0, ttft, parts, error = time.time(), None, [], None
    with urllib.request.urlopen(req, timeout=600) as r:
        for raw in r:
            line = raw.decode().strip()
            if not line.startswith("data:"):
                continue
            frame = json.loads(line[5:])
            if "t" in frame:
                ttft = ttft or time.time() - t0
                parts.append(frame["t"])
            if "error" in frame:
                error = frame["error"]
            if frame.get("done"):
                break
    return dict(text="".join(parts), ttft=ttft, total=time.time() - t0, error=error)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--a", default="qwen2.5:1.5b", help="current / baseline model")
    ap.add_argument("--b", default="qwen3:4b-instruct", help="candidate model")
    ap.add_argument("--restore", default=None, help="model to leave selected (default: --b)")
    ap.add_argument("--api", default="http://localhost:8010")
    ap.add_argument("--ollama", default="http://localhost:11434", help="for the judge")
    ap.add_argument("--judge", default="qwen3:8b")
    ap.add_argument("--prompts", type=Path, default=ROOT / "data/lora/valid_prompts.jsonl")
    ap.add_argument("--n", type=int, default=40)
    ap.add_argument("--seed", type=int, default=5)
    ap.add_argument("--report", type=Path, default=ROOT / "models/lora/app_eval.json")
    args = ap.parse_args()

    items = [json.loads(line) for line in args.prompts.read_text().splitlines() if line.strip()]
    random.Random(args.seed).shuffle(items)
    items = items[: args.n]
    answers: dict[str, list[dict]] = {}
    try:
        for model in (args.a, args.b):
            set_model(args.api, model)
            ask(args.api, {"question": "What is 2 + 2?", "level": "teen"})  # load the model
            answers[model] = []
            for i, it in enumerate(items, 1):
                res = ask(args.api, it)
                answers[model].append(res)
                print(f"[{model} {i}/{len(items)}] ttft={res['ttft'] or 0:.1f}s total={res['total']:.1f}s"
                      f" chars={len(res['text'])}{' ERROR ' + str(res['error']) if res['error'] else ''}", flush=True)
    finally:
        set_model(args.api, args.restore or args.b)

    tally, rows = {"a": 0, "b": 0, "tie": 0}, []
    for it, ra, rb in zip(items, answers[args.a], answers[args.b]):
        # judge() names its sides base/tuned: a = base, b = tuned
        v = judge(args.ollama, args.judge, it, ra["text"], rb["text"])
        key = {"base": "a", "tuned": "b", "tie": "tie"}[v]
        tally[key] += 1
        rows.append(dict(question=it["question"], level=it["level"], winner=key, a=ra, b=rb))

    def stats(model: str) -> dict:
        res = answers[model]
        return dict(model=model,
                    ttft_median_s=round(statistics.median(r["ttft"] or r["total"] for r in res), 2),
                    total_median_s=round(statistics.median(r["total"] for r in res), 1),
                    total_max_s=round(max(r["total"] for r in res), 1),
                    chars_median=statistics.median(len(r["text"]) for r in res),
                    errors=sum(bool(r["error"]) for r in res),
                    empty=sum(not r["text"].strip() for r in res),
                    loops=sum(loops(r["text"]) for r in res))

    summary = dict(n=len(items), judge=args.judge, prompts=args.prompts.name,
                   wins={args.a: tally["a"], args.b: tally["b"], "tie": tally["tie"]},
                   a=stats(args.a), b=stats(args.b))
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(dict(summary=summary, rows=rows), indent=2, ensure_ascii=False))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
