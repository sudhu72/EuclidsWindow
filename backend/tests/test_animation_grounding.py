"""AnimationPipeline's LLM codegen path should be graph-grounded for disambiguation."""
import app.ai.concept_graph as concept_graph_module
from app.ai.animation_pipeline import AnimationPipeline


class _FakeGraph:
    def context_for(self, query, hops=1):
        return "Concept map: focus concept is Euler's Identity, not Euler's Formula."


def test_llm_path_receives_graph_context(monkeypatch):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())

    pipeline = AnimationPipeline()
    # Force past Phase 1 (no template match) and mark the LLM available.
    monkeypatch.setattr(pipeline, "_heuristic_code", lambda topic, context: None)
    monkeypatch.setattr(pipeline._llm, "is_available", lambda: True)

    captured = {}

    def fake_plan_scene(topic, context, learner_level):
        captured["plan_context"] = context
        return None

    def fake_llm_generate(topic, context, learner_level, plan):
        captured["codegen_context"] = context
        return None  # let it fall through to the generic fallback

    monkeypatch.setattr(pipeline, "_plan_scene", fake_plan_scene)
    monkeypatch.setattr(pipeline, "_llm_generate", fake_llm_generate)
    monkeypatch.setattr(pipeline, "_render_with_retry", lambda code, topic, source: None)

    pipeline.generate("Euler's Identity", context="a request about complex exponentials")

    assert "Euler's Identity, not Euler's Formula" in captured["plan_context"]
    assert "Euler's Identity, not Euler's Formula" in captured["codegen_context"]
    # The caller-supplied context is preserved alongside the graph grounding.
    assert "a request about complex exponentials" in captured["plan_context"]


def test_heuristic_phase_unaffected_by_graph_context(monkeypatch):
    # Phase 1's template keyword match must not see the graph's related-concept
    # words — only the caller-supplied topic/context, unchanged from before.
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())

    pipeline = AnimationPipeline()
    captured = {}

    def fake_heuristic(topic, context):
        captured["heuristic_context"] = context
        return None

    monkeypatch.setattr(pipeline, "_heuristic_code", fake_heuristic)
    monkeypatch.setattr(pipeline._llm, "is_available", lambda: False)
    monkeypatch.setattr(pipeline, "_render_with_retry", lambda code, topic, source: None)

    pipeline.generate("some topic", context="plain caller context")

    assert captured["heuristic_context"] == "plain caller context"
