#!/usr/bin/env python3
"""Prepare LoRA training JSONL from raw tutor records.

Accepted input examples:
1) List[dict]
   [{"question":"...", "answer":"...", "learner_level":"teen"}, ...]
2) {"records":[...]} or {"items":[...]} wrapper
3) Chat-like rows with keys: prompt/response, instruction/output, user/assistant

Output schema (JSONL):
{"instruction":"...", "input":"Learner level: teen", "output":"..."}
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


def _clean_text(value: Any) -> str:
    text = str(value or "").strip()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _pick_first(record: Dict[str, Any], keys: Iterable[str]) -> str:
    for key in keys:
        value = record.get(key)
        cleaned = _clean_text(value)
        if cleaned:
            return cleaned
    return ""


def _extract_instruction(record: Dict[str, Any]) -> str:
    return _pick_first(
        record,
        (
            "instruction",
            "question",
            "prompt",
            "user",
            "input_question",
            "query",
        ),
    )


def _extract_output(record: Dict[str, Any]) -> str:
    return _pick_first(
        record,
        (
            "output",
            "answer",
            "response",
            "assistant",
            "solution",
            "target",
        ),
    )


def _extract_learner_level(record: Dict[str, Any], default: str) -> str:
    level = _pick_first(record, ("learner_level", "level", "student_level", "audience"))
    level = level.lower() if level else default.lower()
    if level not in {"kids", "teen", "college", "adult"}:
        return default
    return level


def _iter_records(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("records", "items", "examples", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def convert_records(records: List[Dict[str, Any]], default_level: str) -> Tuple[List[Dict[str, str]], Dict[str, int]]:
    rows: List[Dict[str, str]] = []
    stats = {
        "input_records": len(records),
        "kept": 0,
        "skipped_missing_instruction": 0,
        "skipped_missing_output": 0,
        "deduped": 0,
    }
    seen = set()

    for record in records:
        instruction = _extract_instruction(record)
        output = _extract_output(record)
        if not instruction:
            stats["skipped_missing_instruction"] += 1
            continue
        if not output:
            stats["skipped_missing_output"] += 1
            continue

        level = _extract_learner_level(record, default=default_level)
        row = {
            "instruction": instruction,
            "input": f"Learner level: {level}",
            "output": output,
        }
        key = (row["instruction"].lower(), row["input"].lower(), row["output"].lower())
        if key in seen:
            stats["deduped"] += 1
            continue
        seen.add(key)
        rows.append(row)
        stats["kept"] += 1
    return rows, stats


def write_jsonl(path: Path, rows: List[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare LoRA training JSONL for Euclid's Window.")
    parser.add_argument(
        "--input",
        default="backend/data/raw_tuning_records.json",
        help="Input JSON file (list of records or dict wrapper).",
    )
    parser.add_argument(
        "--output",
        default="backend/data/lora_train.jsonl",
        help="Output JSONL path.",
    )
    parser.add_argument(
        "--default-level",
        default="teen",
        choices=["kids", "teen", "college", "adult"],
        help="Fallback learner level when missing in source.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise SystemExit(
            f"Input file not found: {input_path}\n"
            "Create it first or pass --input with a valid JSON file."
        )

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    records = _iter_records(payload)
    rows, stats = convert_records(records, default_level=args.default_level)
    write_jsonl(output_path, rows)

    print("LoRA dataset preparation complete.")
    print(f"- Input file: {input_path}")
    print(f"- Output file: {output_path}")
    print(f"- Records seen: {stats['input_records']}")
    print(f"- Rows written: {stats['kept']}")
    print(f"- Skipped (missing instruction): {stats['skipped_missing_instruction']}")
    print(f"- Skipped (missing output): {stats['skipped_missing_output']}")
    print(f"- Deduped: {stats['deduped']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
