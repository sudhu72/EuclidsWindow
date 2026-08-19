"""Multi-agent coordinator for the local tutor."""
import time
from typing import Optional

from ..logging_config import logger
from .models import TutorPlan
from .agent_registry import record_error, record_start, record_success
from .engine import LocalLLMEngine
from .planner import TutorPlanner
from .web_rag import WebMathRAG


class MultiAgentCoordinator:
    def __init__(self) -> None:
        self.engine = LocalLLMEngine()
        self.planner = TutorPlanner()
        self.web_rag = WebMathRAG()

    def answer(self, question: str, history: Optional[list] = None) -> Optional[TutorPlan]:
        if not self.engine.is_available():
            return None

        plan = self._run_planner(question, history)
        if not plan:
            return None

        context = self._build_context(question, history)
        intuition = self._run_agent(
            "intuition_agent",
            f"{context}Provide a short intuition for: {question}\n"
            "Use LaTeX for symbols like \\(\\lambda\\). Keep it 3-5 sentences.",
        )
        examples = self._run_agent(
            "examples_agent",
            f"{context}Provide 2-3 concise examples for: {question}\n"
            "Format as bullet points. Use LaTeX for math.",
        )
        proof = self._run_agent(
            "proof_agent",
            f"{context}Provide a short proof sketch or justification for: {question}\n"
            "Keep it brief and use LaTeX for math.",
        )
        history = self._run_agent(
            "history_agent",
            f"{context}Provide a brief historical note or anecdote related to: {question}\n"
            "Keep it 2-3 sentences. Only state a date, name, or attribution you are "
            "confident is correct — if you're not sure, say the idea's significance "
            "instead of inventing a historical detail.",
        )
        visualization = self._run_agent(
            "visualization_agent",
            f"{context}Describe a visualization idea for: {question}\n"
            "Keep it 2-3 sentences and focus on intuition.",
        )
        web_context = self._run_web_research_agent(question, plan.solution)

        additions = []
        if intuition:
            additions.append("💡 **Intuition**\n" + intuition)
        if examples:
            additions.append("🧪 **Examples**\n" + examples)
        if proof:
            additions.append("🧾 **Proof Sketch**\n" + proof)
        if history:
            additions.append("📜 **History**\n" + history)
        if visualization:
            additions.append("🖼️ **Visualization Idea**\n" + visualization)
        if web_context:
            additions.append("🌐 **Web-Verified Notes**\n" + web_context)

        if additions:
            plan.solution = (plan.solution or "").rstrip() + "\n\n" + "\n\n".join(additions)
        return plan

    def _run_web_research_agent(self, question: str, draft_solution: str) -> Optional[str]:
        if not self.web_rag.should_enrich(question, draft_solution):
            return None
        snippets = self.web_rag.retrieve(question, limit=2)
        if not snippets:
            return None
        context = "\n".join(
            f"- {item.title}: {item.snippet[:320]} (source: {item.url})" for item in snippets
        )
        prompt = (
            f"Question: {question}\n"
            "Using only the retrieved web snippets, write 3 concise bullet points that improve factual coverage.\n"
            "Keep wording learner-friendly and avoid speculation.\n"
            "End with a short 'Sources:' list using the provided URLs.\n\n"
            f"Retrieved snippets:\n{context}"
        )
        return self._run_agent("web_research_agent", prompt)

    def _run_planner(self, question: str, history: Optional[list]) -> Optional[TutorPlan]:
        start = time.time()
        record_start("planner_agent")
        try:
            plan = self.planner.plan(question, history=history)
            if plan:
                record_success("planner_agent", int((time.time() - start) * 1000))
            else:
                record_error("planner_agent", int((time.time() - start) * 1000), "Planner returned None")
            return plan
        except Exception as exc:
            record_error("planner_agent", int((time.time() - start) * 1000), str(exc))
            logger.warning(f"Planner agent failed: {exc}")
            return None

    def _run_agent(self, agent_id: str, prompt: str) -> Optional[str]:
        start = time.time()
        record_start(agent_id)
        try:
            output = self.engine.generate(prompt)
            if not output:
                record_error(agent_id, int((time.time() - start) * 1000), "Empty output")
                return None
            record_success(agent_id, int((time.time() - start) * 1000))
            return output.strip()
        except Exception as exc:
            record_error(agent_id, int((time.time() - start) * 1000), str(exc))
            logger.warning(f"Agent {agent_id} failed: {exc}")
            return None

    @staticmethod
    def _build_context(question: str, history: Optional[list]) -> str:
        """Shared preamble for every sub-agent call: history, grounding, guard.

        Each sub-agent (intuition/examples/proof/history/visualization) was a
        bare ``engine.generate(prompt)`` call — no concept-graph or RAG-library
        grounding, and no anti-hallucination instruction at all, unlike every
        other generative path in the app. ``history_agent`` in particular asks
        for "a historical note or anecdote," the highest-fabrication-risk kind
        of claim, with nothing to check it against. This block is prepended to
        every sub-agent's prompt so all of them gain the same grounding +
        verification guard the rest of the app already has.
        """
        from .concept_graph import get_concept_graph
        from .library import get_library
        from .skills import COMPACT_SKILL

        parts = [MultiAgentCoordinator._format_history(history)]
        graph_context = get_concept_graph().context_for(question)
        if graph_context:
            parts.append(graph_context + "\n\n")
        library_context = get_library().context_for(question, k=2, max_chars=900)
        if library_context:
            parts.append(library_context + "\n\n")
        parts.append(COMPACT_SKILL + "\n\n")
        return "".join(p for p in parts if p)

    @staticmethod
    def _format_history(history: Optional[list]) -> str:
        if not history:
            return ""
        lines = []
        for msg in history[-12:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                lines.append(f"{role.capitalize()}: {content}")
        return ("Conversation context:\n" + "\n".join(lines) + "\n\n") if lines else ""
