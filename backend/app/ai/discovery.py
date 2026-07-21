"""Feynman discovery engine — turn any topic into a "discover it yourself" path.

Where the AI-by-Hand lab is a *curated* set of 19 hand-verified walkthroughs,
this is the *general* version: given any topic, the local LLM writes a
first-principles discovery path in the same six-stage Feynman shape (know →
question → by-hand → discover → explain → connections).

It is grounded by the concept graph so the "connections" (what it rests on /
what it unlocks) are real structural links from the app's own topic map, not
invented — that's the basic→advanced ladder the learner climbs. The prose and
the tiny worked example are LLM-written, so they're illustrative rather than
NumPy-verified like the curated lab.
"""
import textwrap
from typing import Any, Dict, List, Optional

from ..logging_config import logger
from .engine import LocalLLMEngine
from .prompts import LEVEL_INSTRUCTIONS

DISCOVERY_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a Feynman-style tutor. You do not lecture a topic — you lead the
    learner to re-invent it from things they already know, so it feels like
    they could have discovered it themselves. Respond with JSON only:

    {
      "know": "the basic idea/math the learner already knows that this builds on (2-3 sentences)",
      "question": "the concrete question or problem that would make someone WANT to invent this (2-3 sentences)",
      "byhand": "a tiny worked example with SMALL concrete numbers, done step by step, that reveals the idea (markdown, use \\\\(...\\\\) for math)",
      "discover": "how to generalize that one example into the rule/formula — let the learner see the pattern (2-4 sentences)",
      "explain": "a plain one-breath explanation, as if to a curious 12-year-old (2-3 sentences)",
      "prerequisites": ["basic concept it rests on", "..."],
      "unlocks": ["more advanced idea it leads to", "..."]
    }

    Rules:
    - Keep the by-hand example SMALL (single digits, 2x2 matrices) so it can
      truly be done by hand. Show the arithmetic, do not just assert results.
    - Build strictly from first principles: nothing in a later stage should
      require something the learner hasn't met yet.
    - Never wrap prose sentences in \\\\text{...}. Inline math: \\\\(...\\\\).
    """)


class DiscoveryService:
    def __init__(self) -> None:
        self._engine = LocalLLMEngine()

    def is_available(self) -> bool:
        return self._engine.is_available()

    def discover(self, topic: str, level: str = "teen") -> Optional[Dict[str, Any]]:
        from .concept_graph import get_concept_graph

        graph = get_concept_graph()
        graph_context = graph.context_for(topic)
        # Real related concepts from the app's concept map (undirected links, so
        # shown as "related" rather than split into rests-on / unlocks).
        nb = graph.neighborhood(topic, hops=1)
        related = [n["name"] for n in nb["nodes"] if not n["focus"]] if nb else []

        level_instruction = LEVEL_INSTRUCTIONS.get(level, "")
        messages = [
            {"role": "system", "content": DISCOVERY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    (graph_context + "\n\n" if graph_context else "")
                    + f"{level_instruction}Lead me to discover this topic myself: {topic[:200]}"
                ),
            },
        ]
        raw = None
        for attempt in range(2):
            raw = self._engine.chat_json(
                messages,
                task="discover",  # routes to the stronger local_discover_model (qwen3:8b)
                timeout_seconds=180,  # qwen3:8b is a slower "thinking" model
                num_predict=2000,
                num_ctx=8192,
                temperature=0.4 if attempt == 0 else 0.6,
            )
            if raw and raw.get("byhand") and raw.get("discover"):
                break
        if not raw:
            return None

        def _list(value: Any) -> List[str]:
            if isinstance(value, list):
                return [str(v) for v in value if str(v).strip()]
            if isinstance(value, str) and value.strip():
                return [value.strip()]
            return []

        logger.info(f"DiscoveryService: built discovery path for '{topic[:60]}'")
        return {
            "topic": topic,
            "know": str(raw.get("know") or ""),
            "question": str(raw.get("question") or ""),
            "byhand": str(raw.get("byhand") or ""),
            "discover": str(raw.get("discover") or ""),
            "explain": str(raw.get("explain") or ""),
            "prerequisites": _list(raw.get("prerequisites"))[:6],
            "unlocks": _list(raw.get("unlocks"))[:6],
            "related": related[:8],  # real links from the concept graph
        }
