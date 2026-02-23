#!/usr/bin/env python3
"""Merge base + follow-up raw LoRA records with configurable weighting."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any, Dict, List


def _iter_records(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("records", "items", "examples", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def _read_records(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    return _iter_records(payload)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Merge base and follow-up raw tuning samples with weighting."
    )
    parser.add_argument(
        "--base",
        default="backend/data/raw_tuning_records.sample.json",
        help="Base raw sample JSON file.",
    )
    parser.add_argument(
        "--followup",
        default="backend/data/raw_tuning_records.followup.sample.json",
        help="Follow-up raw sample JSON file.",
    )
    parser.add_argument(
        "--followup-weight",
        type=int,
        default=2,
        help="How many times to replicate follow-up rows (>=1).",
    )
    parser.add_argument(
        "--output",
        default="backend/data/raw_tuning_records.merged.json",
        help="Output merged raw JSON file.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed used when shuffling merged rows.",
    )
    parser.add_argument(
        "--no-shuffle",
        action="store_true",
        help="Disable shuffling of merged rows.",
    )
    args = parser.parse_args()

    if args.followup_weight < 1:
        raise SystemExit("--followup-weight must be >= 1")

    base_path = Path(args.base)
    followup_path = Path(args.followup)
    output_path = Path(args.output)

    base_records = _read_records(base_path)
    followup_records = _read_records(followup_path)

    merged: List[Dict[str, Any]] = list(base_records)
    for _ in range(args.followup_weight):
        merged.extend(followup_records)

    if not args.no_shuffle:
        random.Random(args.seed).shuffle(merged)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("LoRA sample merge complete.")
    print(f"- Base source: {base_path} ({len(base_records)} records)")
    print(f"- Follow-up source: {followup_path} ({len(followup_records)} records)")
    print(f"- Follow-up weight: {args.followup_weight}x")
    print(f"- Output: {output_path}")
    print(f"- Total merged records: {len(merged)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
