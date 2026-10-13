#!/usr/bin/env python3
"""Rewrite cogito tutorial sections into standalone Q&A pairs for LoRA training.

Raw sections cut out of a long tutorial make poor training answers: 44% of the
v1 set pointed at context the model never sees ("as we saw in Part 2", "§3.4",
"above"), and the v1 adapter learned to write confident filler. This asks a
local model (default qwen3:8b, thinking off — nothing leaves the machine) to
turn each section into one self-contained question and answer, using only
facts from that section, then rejects any pair that:
  * still refers to outside context (same regex as the audit),
  * contains a number that does not appear in the source section,
  * is too short or too long.

Output: data/lora/cogito_qa.jsonl (resumable — already-done sections are skipped).
Consumed by build_dataset.py --cogito-qa.

  .venv-lora/bin/python scripts/lora/rebuild_cogito_qa.py --workers 4
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dataset import COGITO_TRACKS, ROOT, cogito_sections  # noqa: E402

CONTEXT_REF = re.compile(
    r"\b(as (we )?(saw|showed|derived)|above|earlier|previous (part|section)|Part [0-9A-Z]\b|"
    r"§\s?\d|the tutorial|this file|below|this section|this chapter)\b",
    re.I,
)
NUMBER = re.compile(r"(?<![\w.])\d+(?:\.\d+)?")

PROMPT = """Below is one section of a tutorial titled "{title}". Rewrite it as ONE
self-contained question a curious learner might ask, and a complete answer to it.

Rules for the answer:
- It must make sense to someone who has NOT read the rest of the tutorial: never
  say "as we saw", "above", "earlier", "in Part 2", "§", "this section", or "the tutorial".
  If the section relies on an earlier example, restate what is needed.
- Use ONLY facts, numbers and examples that appear in the section. Do not add
  history, names, dates or figures that are not in it.
- Feynman style: plain words first, then the precise idea; keep any worked
  example and its numbers exactly as given.
- 150-450 words. Markdown is fine. Use $...$ for math.

Reply with ONLY a JSON object: {{"question": "...", "answer": "..."}}

Section heading: {heading}
<<<
{body}
>>>"""


def ollama_json(base_url: str, model: str, prompt: str) -> dict | None:
    body = {
        "model": model, "stream": False, "think": False, "format": "json",
        "messages": [{"role": "user", "content": prompt}],
        "options": {"temperature": 0.2, "num_ctx": 8192, "num_predict": 1400},
    }
    req = urllib.request.Request(f"{base_url}/api/chat", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(json.loads(r.read())["message"]["content"])
    except Exception:  # noqa: BLE001 — a failed section is just skipped
        return None


def check(pair: dict | None, source: str) -> tuple[str | None, str]:
    """Return (rejection reason or None, detail)."""
    if not pair or not isinstance(pair.get("question"), str) or not isinstance(pair.get("answer"), str):
        return "bad_json", ""
    q, a = pair["question"].strip(), pair["answer"].strip()
    words = len(a.split())
    if not q or words < 100 or words > 600:
        return "length", str(words)
    m = CONTEXT_REF.search(q) or CONTEXT_REF.search(a)
    if m:
        return "context_ref", m.group(0)
    src_numbers = set(NUMBER.findall(source))
    new = [n for n in NUMBER.findall(a) if n not in src_numbers and n not in {"0", "1", "2"}]
    if new:
        return "new_numbers", " ".join(sorted(set(new)))
    return None, ""


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cogito", type=Path, default=Path.home() / "Research/cogito")
    ap.add_argument("--model", default="qwen3:8b")
    ap.add_argument("--ollama", default="http://localhost:11434")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--out", type=Path, default=ROOT / "data/lora/cogito_qa.jsonl")
    ap.add_argument("--limit", type=int, default=0, help="only process N sections (smoke test)")
    args = ap.parse_args()

    jobs = []
    for track in COGITO_TRACKS:
        for md in sorted((args.cogito / track).rglob("*.md")):
            if md.name.lower() == "readme.md":
                continue
            rel = str(md.relative_to(args.cogito))
            for title, heading, body in cogito_sections(md):
                jobs.append((rel, title, heading, body))
    if args.limit:
        jobs = jobs[: args.limit]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    done = set()
    if args.out.exists():
        for line in args.out.read_text().splitlines():
            r = json.loads(line)
            done.add((r["file"], r["heading"]))
    todo = [j for j in jobs if (j[0], j[2]) not in done]
    print(f"sections: {len(jobs)} total, {len(done)} already done, {len(todo)} to go")

    lock = threading.Lock()
    stats: dict[str, int] = {}

    def work(job):
        rel, title, heading, body = job
        pair = ollama_json(args.ollama, args.model, PROMPT.format(title=title, heading=heading, body=body))
        reason, detail = check(pair, body)
        with lock:
            stats[reason or "ok"] = stats.get(reason or "ok", 0) + 1
                # Rejected sections are recorded too (with the reason) so a resume skips
            # them and the filter can be audited; build_dataset.py drops them.
            rec = {"file": rel, "heading": heading, "title": title, "reject": reason, "detail": detail,
                   "question": (pair or {}).get("question"), "answer": (pair or {}).get("answer")}
            with open(args.out, "a") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            n = sum(stats.values())
            if n % 25 == 0 or n == len(todo):
                print(f"  {n}/{len(todo)} {stats}", flush=True)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        list(ex.map(work, todo))
    print(f"done: {stats}")


if __name__ == "__main__":
    main()
