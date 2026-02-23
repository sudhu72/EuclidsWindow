"""Local generative tutor service."""
import concurrent.futures
import re
import threading
from typing import Optional, Tuple
from uuid import uuid4

from ..config import get_settings
from ..logging_config import logger
from ..models import VisualizationPayload, VisualizationType
from ..cache import cache
from .executor import VisualizationExecutor
from .models import TutorPlan, VisualizationPlan
from .planner import TutorPlanner
from .coordinator import MultiAgentCoordinator
from .visual_planner import VisualizationPlanner
from .web_rag import WebMathRAG
from ..settings_store import SettingsStore


class GenerativeTutorService:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = settings.local_ai_enabled
        self.planner = TutorPlanner()
        self.coordinator = MultiAgentCoordinator()
        self.settings_store = SettingsStore()
        self.executor = VisualizationExecutor()
        self.visual_planner = VisualizationPlanner()
        self.web_rag = WebMathRAG()
        self.cache_ttl_seconds = 600
        self._diagram_jobs: dict[str, dict] = {}
        self._diagram_jobs_lock = threading.Lock()
        self._diagram_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

    def answer(
        self, question: str, history: Optional[list] = None
    ) -> Optional[Tuple[str, Optional[VisualizationPayload]]]:
        if not self.enabled:
            return None

        cached = self._get_cached_answer(question)
        if cached:
            return cached

        effective = self.settings_store.get_effective_settings()
        self.enabled = effective.get("local_ai_enabled", self.enabled)
        use_multi_agent = effective.get("local_multi_agent_enabled", False)
        fast_mode = effective.get("fast_mode_enabled", False)
        if not self.enabled:
            return None

        plan = (
            self.coordinator.answer(question, history=history)
            if use_multi_agent and not fast_mode
            else self.planner.plan(question, history=history)
        )
        if not plan:
            return None
        if fast_mode:
            self._apply_fast_mode(plan)

        visualization = self._execute_visualization(plan, question)
        self._store_cached_answer(question, plan.solution, visualization)
        return plan.solution, visualization

    @staticmethod
    def _apply_fast_mode(plan: TutorPlan) -> None:
        if not plan.solution:
            return
        max_chars = 800
        trimmed = plan.solution.strip()
        if len(trimmed) <= max_chars:
            return
        # Keep first few paragraphs for faster readability.
        parts = trimmed.split("\n\n")
        kept = []
        total = 0
        for part in parts:
            if total + len(part) + 2 > max_chars:
                break
            kept.append(part)
            total += len(part) + 2
        plan.solution = "\n\n".join(kept).strip() or trimmed[:max_chars] + "..."

    def fallback_visualization(self, question: str) -> Optional[VisualizationPayload]:
        if not (
            self._question_requests_visualization(question)
            or self.visual_planner.is_visual_topic(question)
        ):
            return None
        fallback = self.visual_planner.plan(question)
        if not fallback:
            return None
        logger.warning("Using built-in visualization fallback (endpoint)")
        return self._execute_visualization_plan(fallback)

    def enrich_with_web_context(self, question: str, answer: str) -> str:
        return self.web_rag.enrich_answer(question, answer)

    def start_diagram_job(self, question: str) -> dict:
        job_id = f"viz-{uuid4().hex[:12]}"
        with self._diagram_jobs_lock:
            self._diagram_jobs[job_id] = {
                "id": job_id,
                "status": "queued",
                "progress": 5,
                "question": question,
                "visualization": None,
                "error": None,
            }
        self._diagram_executor.submit(self._run_diagram_job, job_id, question)
        return self.get_diagram_job(job_id)

    def _run_diagram_job(self, job_id: str, question: str) -> None:
        self._update_diagram_job(job_id, status="running", progress=25)
        viz = self.fallback_visualization(question)
        if viz is None:
            result = self.answer(f"{question}. Provide a visualization.", history=None)
            if result:
                viz = result[1]
        if viz is not None:
            self._update_diagram_job(
                job_id,
                status="completed",
                progress=100,
                visualization=viz,
                error=None,
            )
            return
        self._update_diagram_job(
            job_id,
            status="error",
            progress=100,
            error="No diagram plan available for this topic yet.",
        )

    def _update_diagram_job(self, job_id: str, **updates) -> None:
        with self._diagram_jobs_lock:
            row = self._diagram_jobs.get(job_id)
            if not row:
                return
            row.update(updates)

    def get_diagram_job(self, job_id: str) -> dict:
        with self._diagram_jobs_lock:
            row = self._diagram_jobs.get(job_id)
            if row:
                return dict(row)
        return {
            "id": job_id,
            "status": "not_found",
            "progress": 0,
            "question": None,
            "visualization": None,
            "error": "Diagram job not found",
        }

    def list_diagram_jobs(self, limit: int = 20) -> list[dict]:
        with self._diagram_jobs_lock:
            rows = list(self._diagram_jobs.values())[-max(1, min(limit, 100)) :]
        return [dict(row) for row in reversed(rows)]

    def delete_diagram_job(self, job_id: str) -> bool:
        with self._diagram_jobs_lock:
            return self._diagram_jobs.pop(job_id, None) is not None

    def _execute_visualization(
        self, plan: TutorPlan, question: str
    ) -> Optional[VisualizationPayload]:
        if not plan.needs_visualization or not plan.visualization:
            if (
                self._question_requests_visualization(question)
                or self.visual_planner.is_visual_topic(question)
            ):
                fallback = self.visual_planner.plan(question)
                if fallback:
                    logger.warning("Using built-in visualization fallback")
                    return self._execute_visualization_plan(fallback)
            return None

        viz = plan.visualization
        if viz.type not in (VisualizationType.plotly, VisualizationType.manim):
            logger.warning("Unsupported visualization type")
            return None
        if not viz.code:
            logger.warning("Visualization requested but code is empty")
        visualization = self._execute_visualization_plan(viz)
        if visualization:
            return visualization

        if (
            self._question_requests_visualization(question)
            or self.visual_planner.is_visual_topic(question)
        ):
            fallback = self.visual_planner.plan(question)
            if fallback:
                logger.warning("Visualization failed; using fallback")
                return self._execute_visualization_plan(fallback)

        return None

    def _execute_visualization_plan(
        self, viz: VisualizationPlan
    ) -> Optional[VisualizationPayload]:
        if viz.type == VisualizationType.plotly:
            return self.executor.execute_plotly(viz.code or "", viz.goal)
        if viz.type == VisualizationType.manim:
            return self.executor.execute_manim(viz.code or "", viz.goal)
        return None

    def _get_cached_answer(
        self, question: str
    ) -> Optional[Tuple[str, Optional[VisualizationPayload]]]:
        normalized = self._normalize_question(question)
        exact_key = f"tutor:{normalized}"
        cached = cache.get(exact_key)
        if cached:
            return cached

        recent = cache.get("tutor:recent") or []
        tokens = self._tokenize(normalized)
        best = None
        best_score = 0.0
        for entry in recent:
            entry_tokens = entry.get("tokens") or []
            score = self._jaccard(tokens, set(entry_tokens))
            if score > best_score:
                best_score = score
                best = entry
        if best and best_score >= 0.9:
            return best.get("result")
        return None

    def _store_cached_answer(
        self, question: str, solution: str, visualization: Optional[VisualizationPayload]
    ) -> None:
        normalized = self._normalize_question(question)
        exact_key = f"tutor:{normalized}"
        cache.set(exact_key, (solution, visualization), ttl=self.cache_ttl_seconds)
        recent = cache.get("tutor:recent") or []
        tokens = list(self._tokenize(normalized))
        recent.append({"tokens": tokens, "result": (solution, visualization)})
        recent = recent[-50:]
        cache.set("tutor:recent", recent, ttl=self.cache_ttl_seconds)

    @staticmethod
    def _normalize_question(question: str) -> str:
        text = question.lower().strip()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def _tokenize(text: str) -> set:
        return set(text.split())

    @staticmethod
    def _jaccard(a: set, b: set) -> float:
        if not a or not b:
            return 0.0
        return len(a & b) / len(a | b)

    @staticmethod
    def _question_requests_visualization(question: str) -> bool:
        q = question.lower()
        tokens = ("visualization", "visualise", "visualize", "plot", "graph", "animate", "animation")
        return any(token in q for token in tokens)

