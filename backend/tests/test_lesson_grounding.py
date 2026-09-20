"""Unit tests for lesson.py's local-content grounding and shot-style selection."""
import app.ai.concept_graph as concept_graph_module
import app.ai.library as library_module
from app.ai.lesson import DEMYSTIFY_INSTRUCTION, STYLE_INSTRUCTIONS, _ground


class _FakeGraph:
    """Stand-in for ConceptGraph with a controllable neighbor count and viz."""

    def __init__(self, node_id=None, neighbor_count=0, viz=None, context=""):
        self._node_id = node_id
        self._neighbor_count = neighbor_count
        self._viz = viz
        self._context = context

    def resolve(self, query):
        return self._node_id

    def neighbors(self, node_id, hops=1):
        return [f"n{i}" for i in range(self._neighbor_count)]

    def node(self, node_id):
        return {"viz": self._viz} if self._node_id else None

    def context_for(self, query, hops=1):
        return self._context


class _FakeLibrary:
    """Stand-in for LibraryService with a controllable hit count."""

    def __init__(self, hits=0, context=""):
        self._hits = hits
        self._context = context

    def context_for(self, query, k=3, max_chars=1800, max_distance=0.55, reserved=1):
        return self._context

    def search(self, query, k=4, where=None):
        return [{"distance": 0.1} for _ in range(self._hits)]


def _patch(monkeypatch, graph, library):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: graph)
    monkeypatch.setattr(library_module, "get_library", lambda: library)


def test_procedural_topic_gets_chain_of_thought(monkeypatch):
    # Even with zero local content, "how do you..." forces a CoT walkthrough.
    _patch(monkeypatch, _FakeGraph(), _FakeLibrary())
    result = _ground("How do you find eigenvalues?", "", "explain")
    assert result["style"] == "chain_of_thought"
    assert result["style_instruction"] == STYLE_INSTRUCTIONS["chain_of_thought"]


def test_rich_grounding_gets_multi_shot(monkeypatch):
    # A resolved concept with several graph neighbors and a Gallery viz should
    # earn multiple worked angles instead of a single example.
    graph = _FakeGraph(node_id="eigenvalues", neighbor_count=3, viz="eigenvalues_and_eigenvectors_visualizer.html")
    library = _FakeLibrary(hits=0)
    _patch(monkeypatch, graph, library)
    result = _ground("Eigenvalues and eigenvectors", "", "explain")
    assert result["style"] == "multi_shot"


def test_thin_grounding_gets_one_shot(monkeypatch):
    # A topic with no graph match and no library hits falls back to one clean
    # worked example rather than fabricating extra angles.
    _patch(monkeypatch, _FakeGraph(), _FakeLibrary(hits=0))
    result = _ground("A brand new topic nobody has written about", "", "explain")
    assert result["style"] == "one_shot"


def test_ground_surfaces_graph_and_library_context(monkeypatch):
    graph = _FakeGraph(node_id="limit", neighbor_count=1, context="Concept map: Limits")
    library = _FakeLibrary(hits=1, context="Library excerpt: limits...")
    _patch(monkeypatch, graph, library)
    result = _ground("What is a limit?", "extra context", "explain")
    assert result["graph_context"] == "Concept map: Limits"
    assert result["library_context"] == "Library excerpt: limits..."


def test_demystify_instruction_mentions_jargon_and_etymology():
    assert "jargon" in DEMYSTIFY_INSTRUCTION.lower()
    assert "etymology" in DEMYSTIFY_INSTRUCTION.lower()
