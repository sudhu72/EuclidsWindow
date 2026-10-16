#!/usr/bin/env python3
"""RAFT experiment: teach the local tutor to USE library excerpts well.

Retrieval-augmented fine-tuning (RAFT) trains on the prompt the tutor really
sees — persona, teaching style, standing orders, the concept-graph block and
the library excerpts retrieved for the question (relevant or not) — with a
target answer that grounds itself in the relevant excerpts, cites them as
[source, p.N], ignores the irrelevant ones and never cites anything that
wasn't retrieved. That is a habit, which LoRA can teach; it is not new
knowledge, which retrieval already supplies at answer time.

Runs INSIDE the app container (it needs the Chroma library, the backend's
prompt builder and the saved Claude key); `make lora-raft-*` copies it in and
the data back out. Subcommands:

  build  sample passages from the chosen library PDFs -> Claude writes one
         learner question per passage -> the app builds the runtime prompt
         (real retrieval) -> Claude (teacher) answers it -> cheap checks
         (length, loops, citations must name a retrieved source). Split by
         (book, 25-page block) so valid/test pages are never trained on.
         Resumable. Writes {train,valid,test}.jsonl (MLX chat format) and
         {valid,test}_prompts.jsonl.
  eval   tuned vs. base on held-out prompts. Two judges from different
         families — Claude Haiku and qwen3:8b — each in both orders (a side
         wins only if it wins both). Also scores citations directly. PROMOTE
         only if BOTH judges prefer the tuned model and it fabricates no
         more citations than the base.

  python raft.py build --out /app/backend/data/state/raft --limit 20     # smoke test
  python raft.py eval  --data /app/backend/data/state/raft --tuned euclid-tutor:raft1
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import random
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, "/app/backend")

from app.ai.library import get_library  # noqa: E402
from app.ai.providers import CLOUD_PROVIDERS, cloud_chat, resolve_cloud_model  # noqa: E402
from app.ai.service import GenerativeTutorService  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.settings_store import SettingsStore  # noqa: E402

DEFAULT_SOURCES = [
    "Calculus Made Easy.pdf",
    "Calculus II for Dummies.pdf",
    "Calculus for Dummies 1001 practice problems.pdf",
    "Pre Calculus for Dummies Workbook.pdf",
    "Advanced_Calculus.pdf",
    "szprecalculus07042013.pdf",
    "intro_analysis.pdf",
]
LEVELS = ("kids", "teen", "college", "adult")
JUDGE_HAIKU = "claude-haiku-4-5-20251001"
# [source, p.12] — also [source, p.41, p.359] (several pages in one bracket).
CITE_RE = re.compile(r"\[([^\[\],]+?),\s*(p\.?\s*\d+(?:\s*,\s*p\.?\s*\d+)*)\]")

QUESTION_PROMPT = """Below are {n} passages from math books in a learner's library.
For EACH passage, write one question a real learner might ask a math tutor
that this passage helps answer. The question must stand on its own: never say
"the passage", "the text", "the book", "this example" or refer to anything the
learner can't see. Vary the kind of question (why / how / what-if / a small
worked problem / a common confusion). Pick the learner level that fits the
passage: kids, teen, college or adult.

{passages}

Reply with ONLY a JSON array of {n} objects, in passage order:
[{{"question": "...", "level": "teen"}}, ...]
If a passage has no teachable math (front matter, an index, garbled text),
use {{"question": "", "level": ""}} for it."""

TEACHER_NOTE = """

(Note for this answer only: you are writing the ideal tutor reply that a small
model will learn from. Use the reference excerpts above only where they are
relevant to the question and cite each one you rely on as [source, p.N]
exactly as it is labelled. Silently ignore excerpts that are off-topic. Never
cite a source that is not in the excerpts. If no excerpt helps, answer from
your own knowledge without citations. Follow the level instructions; keep it
under 550 words, in Markdown with LaTeX for math.)"""

JUDGE_PROMPT = """You are grading two replies from a math tutor to a {level}-level learner.
The tutor was given these reference excerpts from the learner's library:
<<<
{excerpts}
>>>

Question: {question}

Reply A:
<<<
{a}
>>>

Reply B:
<<<
{b}
>>>

Which reply is better? Judge, in order: (1) mathematical correctness — any
error counts heavily; (2) grounding — uses the relevant excerpts, cites them
correctly as [source, p.N], and never cites or quotes something that is not in
the excerpts above; (3) whether it actually answers the question; (4) clarity
and fit for a {level}-level learner. Do not prefer a reply because it is longer.
Reply with ONLY a JSON object: {{"winner": "A" | "B" | "tie", "reason": "<one sentence>"}}"""


# ----------------------------------------------------------------------------
def claude_key(required: bool = True) -> tuple[str, str]:
    eff = SettingsStore().get_effective_settings()
    key = eff.get(CLOUD_PROVIDERS["anthropic"]["key_setting"])
    if not key and required:
        sys.exit("No Anthropic API key saved in Settings")
    model = resolve_cloud_model("anthropic", eff.get("cloud_llm_model")) if eff.get("llm_provider") == "anthropic" \
        else resolve_cloud_model("anthropic", None)
    return key, model


def claude(key: str, model: str, messages: list[dict], max_tokens: int, attempts: int = 3) -> str:
    """Claude or bust: unlike the app, never fall back to a local model."""
    for i in range(attempts):
        text = cloud_chat("anthropic", model, key, messages, max_tokens=max_tokens, timeout_seconds=240)
        if text:
            return text.strip()
        time.sleep(5 * (i + 1))
    raise RuntimeError(f"Claude ({model}) returned nothing after {attempts} attempts")


def ollama(model: str, messages: list[dict], num_predict: int = 1200, num_ctx: int = 4096,
           think: bool = False, temperature: float = 0.4) -> str:
    """Defaults = the streaming tutor's options (routers/tutor_stream.py)."""
    base = (get_settings().local_llm_base_url or "http://host.docker.internal:11434").rstrip("/")
    body = {"model": model, "messages": messages, "stream": False, "think": think,
            "options": {"temperature": temperature, "num_predict": num_predict, "num_ctx": num_ctx}}
    for i in range(3):
        try:
            req = urllib.request.Request(f"{base}/api/chat", data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.loads(r.read())["message"]["content"].strip()
        except urllib.error.HTTPError as exc:
            if exc.code == 400 and "think" in body:  # model without a thinking toggle
                body.pop("think")
                continue
            if exc.code < 500 or i == 2:
                raise
            time.sleep(10)
    raise RuntimeError("unreachable")


def is_claude(spec: str) -> bool:
    return spec == "claude" or spec.startswith("claude-")


def generate(spec: str, key: str, cloud_model: str, messages: list[dict], max_tokens: int) -> str:
    """One answer from the teacher/question writer: "claude" (the Settings
    model), an explicit claude-* id, or any local Ollama model (thinking on —
    the teacher should reason before it writes the target answer)."""
    if is_claude(spec):
        return claude(key, cloud_model if spec == "claude" else spec, messages, max_tokens)
    text = ollama(spec, messages, num_predict=8000, num_ctx=16384, think=True, temperature=0.3)
    if not text:
        raise RuntimeError(f"{spec} returned nothing")
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def loops(text: str) -> bool:
    sents = [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if len(x.strip()) > 30]
    return any(sents.count(x) >= 3 for x in set(sents))


def _norm(source: str) -> str:
    """Citation key ignoring case, file extension and a URL's scheme/www/slash."""
    key = re.sub(r"\.(pdf|md|txt)$", "", source.strip().lower())
    return re.sub(r"^(https?://)?(www\.)?", "", key).rstrip("/")


def excerpt_sources(system: str) -> dict[str, str]:
    """Normalized key -> exact label, for every excerpt in the prompt."""
    return {_norm(m.group(1)): m.group(1).strip() for m in CITE_RE.finditer(system)}


def _resolve(cited: str, allowed: dict[str, str]) -> str | None:
    """The excerpt a citation means, tolerating abbreviations Claude uses
    ("Calc II for Dummies", "Calculus for Dummies 1001"); None = fabricated."""
    key = _norm(cited)
    if key in allowed:
        return allowed[key]
    best, score = None, 0.0
    for k, label in allowed.items():
        # prefix ("Calculus for Dummies 1001"), a short name inside a URL or
        # file name ("Lamar.edu", "Clark" for ...Theory-Clark.pdf), else fuzzy
        r = 1.0 if k.startswith(key) or key.startswith(k) or (len(key) >= 4 and (key in k or k.endswith(key))) \
            else difflib.SequenceMatcher(None, key, k).ratio()
        if r > score:
            best, score = label, r
    return best if score >= 0.6 else None


def citation_stats(answer: str, system: str) -> dict:
    allowed = excerpt_sources(system)
    cited = [m.group(1) for m in CITE_RE.finditer(answer)]
    return {"had_excerpts": bool(allowed), "cites": len(cited),
            "fabricated": sum(1 for c in cited if _resolve(c, allowed) is None)}


def canonical_citations(answer: str, system: str) -> str:
    """Rewrite abbreviated / multi-page citations to the exact excerpt label,
    one page per bracket, so the student learns one citation format."""
    allowed = excerpt_sources(system)

    def fix(m: re.Match) -> str:
        label = _resolve(m.group(1), allowed)
        if label is None:
            return m.group(0)
        pages = re.findall(r"\d+", m.group(2))
        return ", ".join(f"[{label}, p.{p}]" for p in pages)

    return CITE_RE.sub(fix, answer)


def split_of(group: str) -> str:
    b = int(hashlib.sha1(group.encode()).hexdigest(), 16) % 100
    return "test" if b < 10 else "valid" if b < 20 else "train"


# ----------------------------------------------------------------------------
def sample_passages(sources: list[str], per_source: int, seed: int) -> list[dict]:
    coll = get_library()._collection
    rng = random.Random(seed)
    out = []
    for src in sources:
        got = coll.get(where={"source": src}, include=["documents", "metadatas"])
        rows = [(d, m) for d, m in zip(got["documents"], got["metadatas"])
                if len(d) > 500 and sum(c.isalpha() for c in d) > 0.6 * len(d)]
        if not rows:
            print(f"  ! no usable chunks in {src!r} (is it in the library?)", flush=True)
            continue
        for d, m in rng.sample(rows, min(per_source, len(rows))):
            out.append({"source": src, "page": m.get("page"), "text": d})
        print(f"  {src}: {len(rows)} usable chunks, sampled {min(per_source, len(rows))}", flush=True)
    rng.shuffle(out)
    return out


def write_questions(spec: str, key: str, model: str, passages: list[dict]) -> list[dict]:
    out = []
    for i in range(0, len(passages), 5):
        batch = passages[i:i + 5]
        listing = "\n\n".join(f"Passage {k + 1} ({p['source']}, p.{p['page']}):\n{p['text'][:1100]}"
                              for k, p in enumerate(batch))
        try:
            raw = generate(spec, key, model, [{"role": "user", "content":
                                               QUESTION_PROMPT.format(n=len(batch), passages=listing)}], 6000)
        except Exception as exc:  # noqa: BLE001 - lose this batch, keep going
            print(f"  error: {exc}", flush=True)
            continue
        m = re.search(r"\[.*\]", raw, re.DOTALL)
        try:
            items = json.loads(m.group(0)) if m else []
        except json.JSONDecodeError:
            items = []
        for p, it in zip(batch, items if isinstance(items, list) else []):
            q = str((it or {}).get("question", "")).strip()
            lvl = str((it or {}).get("level", "")).strip().lower()
            if q and lvl in LEVELS and not re.search(r"\b(passage|the text|the book|this example)\b", q, re.I):
                out.append({**p, "question": q, "level": lvl})
        print(f"  questions: {len(out)} from {i + len(batch)} passages", flush=True)
    return out


def build(args) -> None:
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    key, model = claude_key(required=is_claude(args.teacher))
    print(f"teacher: {model if args.teacher == 'claude' else args.teacher}", flush=True)
    if args.split_only and not (out / "questions.jsonl").exists():
        sys.exit("--split-only needs an existing build")
    qfile, rows_file = out / "questions.jsonl", out / "rows.jsonl"

    if not qfile.exists():
        passages = sample_passages(args.sources, args.per_source, args.seed)
        if args.limit:
            passages = passages[: args.limit]
        qs = write_questions(args.teacher, key, model, passages)
        qfile.write_text("".join(json.dumps(q, ensure_ascii=False) + "\n" for q in qs))
    questions = [json.loads(line) for line in qfile.read_text().splitlines() if line.strip()]
    done = set()
    if rows_file.exists():
        done = {json.loads(line)["question"] for line in rows_file.read_text().splitlines() if line.strip()}
    todo = [] if args.split_only else [q for q in questions if q["question"] not in done]
    print(f"{len(questions)} questions, {len(done)} done, {len(todo)} to answer", flush=True)

    service, lock, tally = GenerativeTutorService(), threading.Lock(), {}

    def work(q: dict) -> None:
        try:
            msgs = service.build_reasoning_messages(q["question"], None, None, q["level"])
            teacher_msgs = [{"role": "system", "content": msgs[0]["content"] + TEACHER_NOTE}, msgs[1]]
            ans = generate(args.teacher, key, model, teacher_msgs, max_tokens=12000)
        except Exception as exc:  # noqa: BLE001 - retried on the next run
            print(f"  error: {exc}", flush=True)
            return
        ans = canonical_citations(ans, msgs[0]["content"])
        stats = citation_stats(ans, msgs[0]["content"])
        reject = ("short" if len(ans) < 300 else "long" if len(ans) > 6000 else "loops" if loops(ans)
                  else "fabricated_citation" if stats["fabricated"] else None)
        row = {**{k: q[k] for k in ("source", "page", "question", "level")},
               "group": f"{q['source']}:{(q['page'] or 0) // 25}", "messages": msgs, "answer": ans,
               "citations": stats, "reject": reject}
        with lock:
            with open(rows_file, "a") as f:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
            k = reject or "kept"
            tally[k] = tally.get(k, 0) + 1
            if sum(tally.values()) % 10 == 0:
                print(f"  {sum(tally.values())}/{len(todo)} {tally}", flush=True)

    with ThreadPoolExecutor(args.workers) as pool:
        list(pool.map(work, todo))

    rows = [json.loads(line) for line in rows_file.read_text().splitlines() if line.strip()]
    for r in rows:  # re-check with the current citation matcher (it has improved)
        if r["reject"] in (None, "fabricated_citation"):
            r["answer"] = canonical_citations(r["answer"], r["messages"][0]["content"])
            r["citations"] = citation_stats(r["answer"], r["messages"][0]["content"])
            r["reject"] = "fabricated_citation" if r["citations"]["fabricated"] else None
    splits: dict[str, list] = {"train": [], "valid": [], "test": []}
    for r in rows:
        if not r["reject"]:
            splits[split_of(r["group"])].append(r)
    for name, items in splits.items():
        with open(out / f"{name}.jsonl", "w") as f:
            for r in items:
                f.write(json.dumps({"messages": r["messages"] + [{"role": "assistant", "content": r["answer"]}]},
                                   ensure_ascii=False) + "\n")
        if name != "train":
            with open(out / f"{name}_prompts.jsonl", "w") as f:
                for r in items:
                    f.write(json.dumps({k: r[k] for k in ("question", "level", "source", "messages", "answer")},
                                       ensure_ascii=False) + "\n")
    with_ex = sum(r["citations"]["had_excerpts"] for r in rows if not r["reject"])
    kept = sum(not r["reject"] for r in rows)
    print(json.dumps({"rows": len(rows), "kept": kept, "with_excerpts": with_ex,
                      **{k: len(v) for k, v in splits.items()}}), flush=True)


# ----------------------------------------------------------------------------
def judge_once(judge: str, key: str, item: dict, a: str, b: str) -> str:
    system = item["messages"][0]["content"]
    start = system.find("Reference excerpts from the user's library")
    excerpts = system[start:start + 2200] if start >= 0 else "(none were retrieved)"
    prompt = JUDGE_PROMPT.format(level=item["level"], excerpts=excerpts, question=item["question"],
                                 a=a[:3500], b=b[:3500])
    msgs = [{"role": "user", "content": prompt}]
    raw = claude(key, judge, msgs, max_tokens=4000) if is_claude(judge) else \
        ollama(judge, msgs, num_predict=200, num_ctx=8192)
    m = re.search(r'"winner"\s*:\s*"(A|B|tie)"', raw, re.I)
    return m.group(1).upper() if m else "TIE"


def judge_pair(judge: str, key: str, item: dict, base: str, tuned: str) -> str:
    first = judge_once(judge, key, item, tuned, base)
    second = judge_once(judge, key, item, base, tuned)
    return "tuned" if (first, second) == ("A", "B") else "base" if (first, second) == ("B", "A") else "tie"


def evaluate(args) -> None:
    judges = args.judges or [JUDGE_HAIKU, args.local_judge]
    key, _ = claude_key(required=any(is_claude(j) for j in judges))
    data = Path(args.data)
    items = [json.loads(line) for line in (data / f"{args.split}_prompts.jsonl").read_text().splitlines() if line.strip()]
    random.Random(args.seed).shuffle(items)
    items = items[: args.n]
    tally = {j: {"tuned": 0, "base": 0, "tie": 0} for j in judges}
    rows, t0 = [], time.time()
    for i, it in enumerate(items, 1):
        base = ollama(args.base, it["messages"])
        tuned = ollama(args.tuned, it["messages"])
        verdicts = {j: judge_pair(j, key, it, base, tuned) for j in judges}
        for j, v in verdicts.items():
            tally[j][v] += 1
        sys_text = it["messages"][0]["content"]
        rows.append({"question": it["question"], "level": it["level"], "verdicts": verdicts,
                     "cit_base": citation_stats(base, sys_text), "cit_tuned": citation_stats(tuned, sys_text),
                     "loops_base": loops(base), "loops_tuned": loops(tuned), "base": base, "tuned": tuned})
        print(f"[{i}/{len(items)}] {verdicts}  {it['question'][:60]}", flush=True)

    def cit(side: str) -> dict:
        ex = [r for r in rows if r[f"cit_{side}"]["had_excerpts"]]
        return {"cites_when_excerpts": f"{sum(r[f'cit_{side}']['cites'] > 0 for r in ex)}/{len(ex)}",
                "fabricated_citations": sum(r[f"cit_{side}"]["fabricated"] for r in rows),
                "loops": sum(r[f"loops_{side}"] for r in rows)}

    cb, ct = cit("base"), cit("tuned")
    promote = all(t["tuned"] > t["base"] for t in tally.values()) and \
        ct["fabricated_citations"] <= cb["fabricated_citations"] and ct["loops"] <= cb["loops"]
    summary = {"tuned": args.tuned, "base": args.base, "split": args.split, "n": len(rows),
               "judges": tally, "base_stats": cb, "tuned_stats": ct,
               "verdict": "PROMOTE" if promote else "KEEP BASE", "minutes": round((time.time() - t0) / 60, 1)}
    summary["judge_models"] = judges
    report = data / f"eval_{args.split}_{args.tuned.replace(':', '_')}.json"
    report.write_text(json.dumps({"summary": summary, "rows": rows}, indent=2, ensure_ascii=False))
    print(json.dumps(summary, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build")
    b.add_argument("--out", default="/app/backend/data/state/raft")
    b.add_argument("--sources", nargs="+", default=DEFAULT_SOURCES)
    b.add_argument("--per-source", type=int, default=90)
    b.add_argument("--limit", type=int, default=0, help="cap passages (smoke test)")
    b.add_argument("--workers", type=int, default=4)
    b.add_argument("--split-only", action="store_true", help="re-check and re-split existing rows; no model calls")
    b.add_argument("--seed", type=int, default=17)
    b.add_argument("--teacher", default="claude",
                   help='"claude" (Settings model), a claude-* id, or a local Ollama model, e.g. qwen3:8b ($0)')
    e = sub.add_parser("eval")
    e.add_argument("--data", default="/app/backend/data/state/raft")
    e.add_argument("--tuned", required=True)
    e.add_argument("--base", default="qwen3:4b-instruct")
    e.add_argument("--local-judge", default="qwen3:8b")
    e.add_argument("--judges", nargs="+", default=None,
                   help="override both judges, e.g. qwen3:8b llama3.1:8b for an all-local gate")
    e.add_argument("--split", default="test", choices=("valid", "test"))
    e.add_argument("--n", type=int, default=60)
    e.add_argument("--seed", type=int, default=3)
    args = ap.parse_args()
    build(args) if args.cmd == "build" else evaluate(args)


if __name__ == "__main__":
    main()
