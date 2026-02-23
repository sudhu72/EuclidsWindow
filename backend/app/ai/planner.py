"""Planning layer for local tutor."""
import json
import re
from typing import Optional

from ..logging_config import logger
from .engine import LocalLLMEngine, extract_json_block
from .models import TutorPlan
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


class TutorPlanner:
    """Create a TutorPlan from a user question using a local LLM."""

    def __init__(self) -> None:
        self.engine = LocalLLMEngine()

    def plan(self, question: str, history: Optional[list] = None) -> Optional[TutorPlan]:
        if not self.engine.is_available():
            return None

        history_block = ""
        if history:
            lines = []
            for msg in history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if content:
                    lines.append(f"{role.capitalize()}: {content}")
            if lines:
                history_block = "Conversation context:\n" + "\n".join(lines) + "\n\n"

        prompt = f"{SYSTEM_PROMPT}\n\n{history_block}{USER_PROMPT_TEMPLATE.format(question=question)}"
        raw = self.engine.generate(prompt)
        json_text = extract_json_block(raw) if raw else None
        if not json_text:
            if raw:
                parsed = self._parse_loose_payload(raw)
                if parsed:
                    return TutorPlan(**self._normalize_payload(parsed))
                logger.warning("Local LLM returned non-JSON output, using fallback")
                return TutorPlan(solution=raw, needs_visualization=False, visualization=None)
            logger.warning("Local LLM returned no output")
            return None

        try:
            payload = json.loads(json_text)
            normalized = self._normalize_payload(payload)
            return TutorPlan(**normalized)
        except Exception as exc:
            logger.warning(f"Failed to parse tutor plan: {exc}")
            return None

    @staticmethod
    def _normalize_payload(payload: dict) -> dict:
        """Normalize common non-conforming outputs into TutorPlan shape."""
        solution = payload.get("solution")
        if solution is None and payload.get("explanation"):
            solution = payload.get("explanation")
        if solution is None and payload.get("steps"):
            solution = payload.get("steps")
        if isinstance(solution, list):
            # Convert list of steps to a readable string.
            lines = []
            for idx, item in enumerate(solution, start=1):
                if isinstance(item, dict):
                    desc = item.get("description") or item.get("text") or str(item)
                    lines.append(f"{idx}. {desc}")
                else:
                    lines.append(f"{idx}. {item}")
            payload["solution"] = "\n".join(lines)
        elif not isinstance(solution, str):
            payload["solution"] = str(solution) if solution is not None else ""

        if payload.get("plain_explanation") is None:
            payload["plain_explanation"] = payload.get("solution", "")
        if payload.get("axiomatic_explanation") is None:
            payload["axiomatic_explanation"] = ""

        checks = payload.get("checks")
        if checks is None:
            payload["checks"] = []
        elif isinstance(checks, list):
            normalized_checks = []
            for entry in checks:
                if isinstance(entry, dict):
                    normalized_checks.append(
                        {
                            "name": str(entry.get("name") or "consistency"),
                            "status": "pass" if entry.get("status") == "pass" else "warn",
                            "details": str(entry.get("details") or entry.get("message") or ""),
                        }
                    )
            payload["checks"] = normalized_checks
        else:
            payload["checks"] = []

        visualization = payload.get("visualization")
        if isinstance(visualization, dict):
            code = visualization.get("code")
            if isinstance(code, str) and "\\n" in code and "\n" not in code:
                visualization["code"] = code.replace("\\n", "\n")
            if visualization.get("type") and not visualization.get("goal"):
                visualization["goal"] = "Generated visualization"
            visualization.setdefault("parameters", {})
            payload["visualization"] = visualization

        if payload.get("needs_visualization") is None:
            payload["needs_visualization"] = bool(payload.get("visualization"))
        return payload

    @staticmethod
    def _parse_loose_payload(raw: str) -> Optional[dict]:
        """Heuristic parser for near-JSON outputs with embedded code."""
        if not raw:
            return None

        json_block = None
        json_match = re.search(r"```json\s*(.*?)```", raw, flags=re.DOTALL | re.IGNORECASE)
        if json_match:
            json_block = json_match.group(1).strip()

        steps_matches = re.findall(
            r'"step"\s*:\s*"?(\d+)"?\s*,\s*"(?:text|explanation)"\s*:\s*"([^"]+)"',
            raw,
        )
        if steps_matches:
            solution = "\n".join(f"{idx}. {text}" for idx, text in steps_matches)
        else:
            descs = re.findall(r'"description"\s*:\s*"([^"]+)"', raw)
            expls = re.findall(r'"explanation"\s*:\s*"([^"]+)"', raw)
            combined = descs or expls
            solution = (
                "\n".join(f"{idx}. {desc}" for idx, desc in enumerate(combined, start=1))
                if combined
                else None
            )

        type_match = re.search(r'"type"\s*:\s*"(manim|plotly)"', raw)
        goal_match = re.search(r'"goal"\s*:\s*"([^"]+)"', raw)
        needs_match = re.search(r'"needs_visualization"\s*:\s*(true|false)', raw, re.IGNORECASE)

        code = None
        code_block = re.search(r"```(?:python)?\n(.*?)```", raw, flags=re.DOTALL | re.IGNORECASE)
        if code_block:
            code = code_block.group(1).strip()
        elif json_block:
            code = TutorPlanner._extract_code_from_json_block(json_block)
        else:
            code_match = re.search(r'"code"\s*:\s*"([\s\S]*?)"\s*[,\}]', raw)
            if code_match:
                code = code_match.group(1).strip()
            elif "class GeneratedScene" in raw:
                code = raw[raw.find("class GeneratedScene"):].strip()

        if not (solution or type_match or code):
            return None

        visualization = None
        if type_match:
            visualization = {
                "type": type_match.group(1),
                "goal": goal_match.group(1) if goal_match else "Generated visualization",
                "parameters": {},
                "code": code,
            }

        return {
            "solution": solution or raw.strip(),
            "needs_visualization": needs_match.group(1).lower() == "true" if needs_match else bool(visualization),
            "visualization": visualization,
        }

    @staticmethod
    def _extract_code_from_json_block(block: str) -> Optional[str]:
        """Best-effort extraction of the code field from invalid JSON blocks."""
        if not block:
            return None
        idx = block.find('"code"')
        if idx == -1:
            return None
        remainder = block[idx:].split(":", 1)
        if len(remainder) != 2:
            return None
        code = remainder[1].lstrip()
        if code.startswith('"'):
            code = code[1:]
        lines = code.splitlines()
        while lines and lines[-1].strip() in ('}', '},', '"', '",'):
            lines.pop()
        code = "\n".join(lines).rstrip()
        if code.endswith('"'):
            code = code[:-1]
        return code.strip() or None
