"""Pólya problem-solving coach (George Pólya, "How to Solve It", 1945).

Interactive Socratic coaching through Pólya's four phases:

    1. understand — What is the unknown? The data? The condition?
    2. plan       — Find the connection: related problems, heuristics.
    3. execute    — Carry out the plan, checking each step.
    4. lookback   — Examine the result: verify, re-derive, generalize.

The coach never hands over the solution during the first two phases; it asks
Pólya's guiding questions tailored to the student's problem and critiques the
student's own thinking.
"""
import textwrap
from typing import Any, Dict, Optional

from ..logging_config import logger
from .engine import LocalLLMEngine
from .prompts import LEVEL_INSTRUCTIONS

PHASES = ("understand", "plan", "execute", "lookback")

START_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a Socratic math coach following George Polya's "How to Solve It".
    A student brings you a problem. Do NOT solve it. Respond with JSON only:

    {
      "restated": "the problem restated in one clear sentence",
      "problem_type": "e.g. 'find' problem or 'prove' problem, and the area (algebra, geometry, number theory, ...)",
      "opening": "2-3 warm sentences welcoming the student and framing phase 1 (Understand the Problem)",
      "questions": ["3 short questions, tailored to THIS problem, asking for the unknown, the data, and the condition"]
    }

    Rules: never reveal the answer or the key trick. Questions must reference
    the actual quantities in the student's problem, not be generic.
    """)

COACH_PROMPTS = {
    "understand": textwrap.dedent("""\
        You are a Socratic math coach in phase 1 of Polya's method:
        UNDERSTAND THE PROBLEM. The student answered your questions about the
        unknown, the data, and the condition. Respond with JSON only:

        {
          "feedback": "2-4 sentences reacting to the student's understanding; correct any misreading of the problem",
          "hint": "one gentle nudge if something is missing (empty string if nothing is)",
          "ready": true or false — true if the student has correctly identified unknown, data, and condition,
          "suggestions": ["1-2 short next things to clarify, or [] if ready"]
        }

        Never reveal the solution or the key idea. Judge only their
        understanding of what the problem says.
        """),
    "plan": textwrap.dedent("""\
        You are a Socratic math coach in phase 2 of Polya's method: DEVISE A
        PLAN. The student proposes a strategy. Respond with JSON only:

        {
          "feedback": "2-4 sentences on whether their strategy can connect the data to the unknown; be encouraging but honest",
          "hint": "if the plan is weak, one Polya-style nudge (e.g. 'is there a related problem?', 'try a simpler case first', 'work backwards') phrased for THIS problem — never the actual key step",
          "ready": true or false — true if the plan is concrete enough to start executing,
          "suggestions": ["1-3 Polya heuristics worth trying, each a short phrase tailored to this problem"]
        }

        Never reveal the solution. Evaluate the PLAN, not the answer. Even
        when the student asserts a WRONG conclusion, do not present the
        correct argument or its conclusion yourself — say why their reasoning
        does not hold and redirect with a question (e.g. "parity is not
        preserved here, but is there a quantity that IS preserved?").
        """),
    "execute": textwrap.dedent("""\
        You are a math coach in phase 3 of Polya's method: CARRY OUT THE PLAN.
        The student shows their working. Respond with JSON only:

        {
          "feedback": "check their steps in order; if a step is wrong, name the FIRST wrong step and why, without doing the step for them; if all steps look right, say so",
          "hint": "a nudge toward fixing the first error or taking the next step (empty string if none needed)",
          "ready": true or false — true only if the working reaches a complete, correct-looking answer,
          "suggestions": ["what to verify or do next, or [] if done"]
        }

        Point at errors; do not rewrite the solution yourself.
        """),
    "lookback": textwrap.dedent("""\
        You are a math coach in phase 4 of Polya's method: LOOK BACK. The
        student has an answer and reflects on it. Respond with JSON only:

        {
          "feedback": "react to their verification; if they have not checked the result, ask them to test it (special case, units, plugging back in)",
          "hint": "one idea for checking differently or extending: derive it another way, generalize, or connect to another problem (empty string if they covered it)",
          "ready": true or false — true when the result has been checked and reflected on,
          "suggestions": ["1-2 extension or connection ideas, or []"]
        }
        """),
}

DIFFICULTY_HINTS = {
    "basic": "The student is a beginner; keep language simple and steps small.",
    "advanced": "The student knows high-school math well; be precise.",
    "olympiad": (
        "This is competition mathematics; expect proof-level rigor, and let "
        "hints reference standard olympiad heuristics (invariants, extremal "
        "principle, pigeonhole, induction, symmetry) when genuinely relevant."
    ),
}


class PolyaService:
    def __init__(self) -> None:
        self._engine = LocalLLMEngine()
        self._last_messages: list = []  # solver messages, kept for reconciliation

    def is_available(self) -> bool:
        return self._engine.is_available()

    def start(self, problem: str, level: str = "teen", difficulty: str = "basic") -> Optional[Dict[str, Any]]:
        raw = self._chat(
            START_SYSTEM_PROMPT,
            f"{self._context(level, difficulty)}The problem:\n{problem[:800]}",
            num_predict=700,
            difficulty=difficulty,
        )
        if not raw or not raw.get("questions"):
            return None
        questions = [str(q) for q in raw.get("questions", []) if str(q).strip()][:4]
        if not questions:
            return None
        return {
            "restated": str(raw.get("restated") or ""),
            "problem_type": str(raw.get("problem_type") or ""),
            "opening": str(raw.get("opening") or "Let's start by making sure we understand the problem."),
            "questions": questions,
        }

    def coach(
        self,
        problem: str,
        phase: str,
        user_input: str,
        notes: str = "",
        level: str = "teen",
        difficulty: str = "basic",
        stuck: bool = False,
    ) -> Optional[Dict[str, Any]]:
        if phase not in PHASES:
            phase = "understand"
        user_msg = (
            f"{self._context(level, difficulty)}The problem:\n{problem[:800]}\n\n"
            + (f"The student's earlier notes:\n{notes[:900]}\n\n" if notes.strip() else "")
            + (
                "The student says they are STUCK and asks for a stronger hint. "
                "Give a more concrete nudge in `hint`, but still not the full solution.\n\n"
                if stuck
                else ""
            )
            + f"The student's current response:\n{user_input[:1200]}"
        )
        raw = self._chat(
            COACH_PROMPTS[phase], user_msg, num_predict=700, difficulty=difficulty
        )
        if not raw or not str(raw.get("feedback") or "").strip():
            return None

        # Solver–verifier layer: an independent reviewer (fresh context)
        # attacks the mathematical claims; SymPy arbitrates equations; one
        # reconciliation round runs only on disagreement.
        raw, verified, revised = self._verify_and_reconcile(
            problem, user_input, raw, difficulty
        )

        suggestions = raw.get("suggestions")
        if not isinstance(suggestions, list):
            suggestions = []
        return {
            "feedback": str(raw["feedback"]),
            "hint": str(raw.get("hint") or ""),
            "ready": bool(raw.get("ready", False)),
            "suggestions": [str(s) for s in suggestions if str(s).strip()][:4],
            "verified": verified,
            "revised": revised,
        }

    def _verify_and_reconcile(
        self,
        problem: str,
        user_input: str,
        solver_output: Dict[str, Any],
        difficulty: str,
    ):
        """Run the verifier; on challenge, one reconciliation round.

        Returns (output, verified, revised). If reconciliation fails, the
        challenged hint is dropped rather than shown — a missing hint beats
        a wrong one.
        """
        from .verifier import VerifierService

        text = str(solver_output.get("feedback") or "") + str(solver_output.get("hint") or "")
        if len(text) < 60:  # nothing substantive to verify
            return solver_output, False, False

        olympiad = difficulty == "olympiad"
        task = "polya_olympiad" if olympiad else "polya"
        timeout = 240 if olympiad else 120
        verifier = VerifierService(self._engine)
        try:
            verdict, issues, sympy_results = verifier.review(
                problem, user_input, solver_output, task=task, timeout_seconds=timeout
            )
        except Exception as exc:
            logger.warning(f"Polya verifier failed ({exc}); returning unverified output")
            return solver_output, False, False

        if verdict == "endorse":
            return solver_output, True, False
        if verdict != "challenge":  # reviewer unavailable — pass through unverified
            return solver_output, False, False

        logger.info(f"Polya verifier challenged coach output: {issues[:2]}")
        solver_messages = self._last_messages or []
        revised = verifier.reconcile(
            solver_messages,
            solver_output,
            issues,
            sympy_results,
            task=task,
            timeout_seconds=timeout,
            num_predict=3000 if olympiad else 700,
            num_ctx=8192 if olympiad else 4096,
        )
        if revised and str(revised.get("feedback") or "").strip():
            return revised, True, True
        # Reconciliation failed: keep the feedback but withhold the hint.
        solver_output = dict(solver_output)
        solver_output["hint"] = ""
        return solver_output, False, False

    # ------------------------------------------------------------------

    @staticmethod
    def _context(level: str, difficulty: str) -> str:
        parts = [LEVEL_INSTRUCTIONS.get(level, "")]
        hint = DIFFICULTY_HINTS.get(difficulty)
        if hint:
            parts.append(hint + "\n\n")
        return "".join(parts)

    def _chat(
        self, system: str, user: str, num_predict: int, difficulty: str = "basic"
    ) -> Optional[Dict[str, Any]]:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        # Olympiad sessions route to a stronger (often thinking-mode) model,
        # which needs a bigger token budget and timeout for its reasoning.
        olympiad = difficulty == "olympiad"
        task = "polya_olympiad" if olympiad else "polya"

        # Standing-orders skill (verification / no-fabrication) plus any
        # matching excerpts from the user's reference library.
        from .library import get_library
        from .skills import skill_prelude

        messages[0]["content"] = system + "\n\n" + skill_prelude(compact=not olympiad)
        library_context = get_library().context_for(user[:400], k=2, max_chars=1200)
        if library_context:
            messages[1]["content"] = library_context + "\n\n" + user
        self._last_messages = messages
        for attempt in range(2):
            raw = self._engine.chat_json(
                messages,
                task=task,
                timeout_seconds=240 if olympiad else 120,
                num_predict=3000 if olympiad else num_predict,
                num_ctx=8192 if olympiad else 4096,
                temperature=0.4 if attempt == 0 else 0.6,
            )
            if raw:
                return raw
        logger.warning("PolyaService: no valid JSON from LLM")
        return None
