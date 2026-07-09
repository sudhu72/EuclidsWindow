"""Lesson pipeline: outline -> scenes (OpenMAIC-inspired two-stage generation).

Stage 1 generates a structured lesson outline for a topic; stage 2 expands
each outline section into a typed scene on demand:

- ``explain`` / ``example`` scenes carry markdown narration plus an
  AI-classmate question (the question a confused learner would ask) with
  its answer.
- ``quiz`` scenes carry a multiple-choice check with an explanation.

The frontend walks scenes with prev/next playback and can export the
assembled lesson as a standalone HTML file.
"""
import textwrap
from typing import Any, Dict, List, Optional

from ..logging_config import logger
from .engine import LocalLLMEngine
from .prompts import LEVEL_INSTRUCTIONS

SCENE_TYPES = ("explain", "example", "quiz")

OUTLINE_SYSTEM_PROMPT = textwrap.dedent("""\
    You design short math lessons. Produce a lesson outline as JSON only:

    {
      "title": "...",
      "sections": [
        {"title": "...", "type": "explain" | "example" | "quiz", "summary": "one sentence"},
        ...
      ]
    }

    Rules:
    - 4 to 6 sections.
    - Start with an "explain" section on the core idea.
    - Include at least one "example" (worked example) section.
    - End with exactly one "quiz" section.
    - Build from first principles: each section should depend only on the
      sections before it.
    """)

EXPLAIN_SYSTEM_PROMPT = textwrap.dedent("""\
    You write one scene of a math lesson. Respond with JSON only:

    {
      "narration": "markdown explanation of this section (150-300 words, use LaTeX \\\\(...\\\\) for math)",
      "classmate_question": "the question a curious but confused classmate would ask about this",
      "classmate_answer": "a friendly 2-3 sentence answer to that question"
    }
    """)

QUIZ_SYSTEM_PROMPT = textwrap.dedent("""\
    You write a quiz scene for a math lesson. Respond with JSON only:

    {
      "question": "one clear question testing the lesson's core idea",
      "choices": ["...", "...", "...", "..."],
      "correct_index": 0,
      "explanation": "why the correct answer is right, 1-2 sentences"
    }

    Rules: exactly 4 choices, plausible distractors, correct_index is the
    0-based index of the right answer.
    """)


class LessonService:
    def __init__(self) -> None:
        self._engine = LocalLLMEngine()

    def is_available(self) -> bool:
        return self._engine.is_available()

    # ------------------------------------------------------------------
    # Stage 1: outline
    # ------------------------------------------------------------------

    def outline(self, topic: str, level: str = "teen") -> Optional[Dict[str, Any]]:
        level_instruction = LEVEL_INSTRUCTIONS.get(level, "")
        raw = self._engine.chat_json(
            [
                {"role": "system", "content": OUTLINE_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"{level_instruction}Design a lesson on: {topic[:300]}",
                },
            ],
            timeout_seconds=60,
            num_predict=800,
            temperature=0.4,
        )
        if not raw:
            return None
        sections = self._clean_sections(raw.get("sections"))
        if not sections:
            logger.warning("LessonService: outline had no usable sections")
            return None
        return {
            "title": str(raw.get("title") or topic),
            "level": level,
            "topic": topic,
            "sections": sections,
        }

    @staticmethod
    def _clean_sections(sections: Any) -> List[Dict[str, str]]:
        if not isinstance(sections, list):
            return []
        cleaned = []
        for s in sections[:8]:
            if not isinstance(s, dict) or not s.get("title"):
                continue
            stype = s.get("type") if s.get("type") in SCENE_TYPES else "explain"
            cleaned.append(
                {
                    "title": str(s["title"]),
                    "type": stype,
                    "summary": str(s.get("summary") or ""),
                }
            )
        return cleaned

    # ------------------------------------------------------------------
    # Stage 2: scene expansion
    # ------------------------------------------------------------------

    def scene(
        self,
        topic: str,
        level: str,
        section_title: str,
        section_type: str,
        summary: str = "",
    ) -> Optional[Dict[str, Any]]:
        if section_type == "quiz":
            return self._quiz_scene(topic, level, section_title, summary)
        return self._explain_scene(topic, level, section_title, section_type, summary)

    def _explain_scene(
        self, topic: str, level: str, title: str, stype: str, summary: str
    ) -> Optional[Dict[str, Any]]:
        level_instruction = LEVEL_INSTRUCTIONS.get(level, "")
        style = "Include a fully worked example with concrete numbers." if stype == "example" else ""
        raw = self._engine.chat_json(
            [
                {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"{level_instruction}Lesson topic: {topic[:200]}\n"
                        f"Section: {title}\n{summary}\n{style}"
                    ),
                },
            ],
            timeout_seconds=90,
            num_predict=1200,
            temperature=0.4,
        )
        if not raw or not raw.get("narration"):
            return None
        return {
            "type": stype,
            "narration": str(raw["narration"]),
            "classmate_question": str(raw.get("classmate_question") or ""),
            "classmate_answer": str(raw.get("classmate_answer") or ""),
        }

    def _quiz_scene(
        self, topic: str, level: str, title: str, summary: str
    ) -> Optional[Dict[str, Any]]:
        level_instruction = LEVEL_INSTRUCTIONS.get(level, "")
        raw = self._engine.chat_json(
            [
                {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"{level_instruction}Lesson topic: {topic[:200]}\n"
                        f"Quiz section: {title}\n{summary}"
                    ),
                },
            ],
            timeout_seconds=60,
            num_predict=600,
            temperature=0.3,
        )
        if not raw:
            return None
        choices = raw.get("choices")
        idx = raw.get("correct_index")
        if (
            not isinstance(choices, list)
            or len(choices) < 2
            or not isinstance(idx, int)
            or not 0 <= idx < len(choices)
            or not raw.get("question")
        ):
            logger.warning("LessonService: quiz scene malformed")
            return None
        return {
            "type": "quiz",
            "question": str(raw["question"]),
            "choices": [str(c) for c in choices[:4]],
            "correct_index": min(idx, 3),
            "explanation": str(raw.get("explanation") or ""),
        }
