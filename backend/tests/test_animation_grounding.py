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


def test_llm_generate_retries_once_on_malformed_output(monkeypatch):
    # A malformed first response (no GeneratedScene) used to end the whole
    # LLM phase immediately; it should now get a second try at a lower
    # temperature before giving up.
    pipeline = AnimationPipeline()
    calls = []

    def fake_chat(messages, **kwargs):
        calls.append(kwargs.get("temperature"))
        if len(calls) == 1:
            return "Sorry, I can't help with that."  # no code at all
        return "class GeneratedScene(Scene):\n    def construct(self):\n        pass\n"

    monkeypatch.setattr(pipeline._llm, "chat", fake_chat)
    code = pipeline._llm_generate("some topic", "", "teen", None)

    assert code is not None
    assert "GeneratedScene" in code
    assert len(calls) == 2
    assert calls[0] != calls[1]  # second attempt used a different temperature


def test_llm_generate_gives_up_after_two_malformed_attempts(monkeypatch):
    pipeline = AnimationPipeline()
    monkeypatch.setattr(pipeline._llm, "chat", lambda messages, **kwargs: "not code")
    code = pipeline._llm_generate("some topic", "", "teen", None)
    assert code is None


def test_validate_code_rejects_long_unscaled_title():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic: The Key to Cryptography')\n"
        "        self.play(Write(title))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is not None
    assert "overflow" in error.lower()


def test_validate_code_allows_long_title_with_font_size():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic: The Key to Cryptography', font_size=28)\n"
        "        self.play(Write(title))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is None


def test_validate_code_allows_short_title():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic')\n"
        "        self.play(Write(title))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is None


def test_validate_code_rejects_svg_mobject():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        icon = SVGMobject('lock.svg')\n"
        "        self.play(Create(icon))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is not None
    assert "asset" in error.lower() or "disk" in error.lower()


def test_validate_code_rejects_image_mobject():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        pic = ImageMobject('key.png')\n"
        "        self.play(FadeIn(pic))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is not None


def test_validate_code_allows_only_builtin_primitives():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        circle = Circle(radius=2, color=PRIMARY)\n"
        "        self.play(Create(circle))\n"
    )
    assert AnimationPipeline._validate_code(code) is None


def test_validate_code_rejects_stacked_top_headings():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic').to_edge(UP)\n"
        "        self.play(Write(title))\n"
        "        subtitle = Text('Secret Codes').to_edge(UP)\n"
        "        self.play(Write(subtitle))\n"
    )
    error = AnimationPipeline._validate_code(code)
    assert error is not None
    assert "overlap" in error.lower()


def test_validate_code_allows_second_heading_after_fadeout():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic').to_edge(UP)\n"
        "        self.play(Write(title))\n"
        "        self.play(FadeOut(title))\n"
        "        subtitle = Text('Secret Codes').to_edge(UP)\n"
        "        self.play(Write(subtitle))\n"
    )
    assert AnimationPipeline._validate_code(code) is None


def test_validate_code_allows_a_single_top_heading():
    code = (
        "from manim import *\n"
        "class GeneratedScene(Scene):\n"
        "    def construct(self):\n"
        "        title = Text('Modular Arithmetic').to_edge(UP)\n"
        "        self.play(Write(title))\n"
        "        circle = Circle()\n"
        "        self.play(Create(circle))\n"
    )
    assert AnimationPipeline._validate_code(code) is None


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
