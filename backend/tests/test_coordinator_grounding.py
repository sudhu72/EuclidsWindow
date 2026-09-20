"""The legacy multi-agent coordinator's sub-agents should be grounded and
carry the same anti-hallucination guard as the rest of the app — previously
each was a bare, ungrounded engine.generate(prompt) call."""
import app.ai.concept_graph as concept_graph_module
import app.ai.library as library_module
from app.ai.coordinator import MultiAgentCoordinator
from app.ai.models import TutorPlan


class _FakeGraph:
    def context_for(self, query, hops=1):
        return "GRAPH CONTEXT"


class _FakeLibrary:
    def __init__(self, context=""):
        self._context = context

    def context_for(self, query, k=3, max_chars=1800, max_distance=0.55, reserved=1):
        return self._context


def test_build_context_includes_grounding_and_skill(monkeypatch):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context="LIBRARY EXCERPT"))

    context = MultiAgentCoordinator._build_context("eigenvalues", None)

    assert "GRAPH CONTEXT" in context
    assert "LIBRARY EXCERPT" in context
    assert "invent" in context.lower()  # COMPACT_SKILL's anti-hallucination line


def test_build_context_survives_no_local_content(monkeypatch):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context=""))
    context = MultiAgentCoordinator._build_context("a brand new topic", None)
    assert "GRAPH CONTEXT" in context
    assert "invent" in context.lower()


def test_all_subagent_prompts_carry_the_shared_context(monkeypatch):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context=""))

    coordinator = MultiAgentCoordinator()
    monkeypatch.setattr(coordinator.engine, "is_available", lambda: True)
    monkeypatch.setattr(
        coordinator, "_run_planner", lambda question, history: TutorPlan(solution="base solution")
    )
    monkeypatch.setattr(coordinator.web_rag, "should_enrich", lambda *a, **k: False)

    prompts = {}

    def fake_generate(prompt):
        # Identify which sub-agent by a phrase unique to its instruction.
        if "Provide a short intuition" in prompt:
            prompts["intuition"] = prompt
        elif "historical note" in prompt:
            prompts["history"] = prompt
        return "stub output"

    monkeypatch.setattr(coordinator.engine, "generate", fake_generate)

    coordinator.answer("eigenvalues")

    assert "GRAPH CONTEXT" in prompts["intuition"]
    assert "GRAPH CONTEXT" in prompts["history"]
    # history_agent's stronger no-fabrication wording is present.
    assert "confident is correct" in prompts["history"]
