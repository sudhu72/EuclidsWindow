"""DiscoveryService should ground in the RAG library too, not just the graph."""
import app.ai.concept_graph as concept_graph_module
import app.ai.library as library_module
from app.ai.discovery import DiscoveryService


class _FakeGraph:
    def context_for(self, query, hops=1):
        return "GRAPH CONTEXT"

    def neighborhood(self, query, hops=1):
        return {"nodes": [{"name": "focus", "focus": True}, {"name": "related_one", "focus": False}]}


class _FakeLibrary:
    def __init__(self, context=""):
        self._context = context

    def context_for(self, query, k=3, max_chars=1800, max_distance=0.55, reserved=1):
        return self._context


def test_discover_grounds_in_library_and_graph(monkeypatch):
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context="LIBRARY EXCERPT"))

    captured = {}

    def fake_chat_json(messages, **kwargs):
        captured["messages"] = messages
        return {
            "know": "k", "question": "q", "byhand": "b", "discover": "d",
            "explain": "e", "prerequisites": [], "unlocks": [],
        }

    service = DiscoveryService()
    monkeypatch.setattr(service._engine, "chat_json", fake_chat_json)

    result = service.discover("eigenvalues", level="teen")

    assert result is not None
    system = captured["messages"][0]["content"]
    user = captured["messages"][1]["content"]
    assert "GRAPH CONTEXT" in user
    assert "LIBRARY EXCERPT" in user
    # The anti-hallucination skill was previously absent from this prompt.
    assert "never invent facts" in system.lower() or "invent" in system.lower()
    assert result["related"] == ["related_one"]


def test_discover_gives_up_cleanly_on_persistent_truncation(monkeypatch):
    # A model that keeps truncating (byhand/discover never come back) must not
    # ship a discovery path with silently blank stages — return None so the
    # endpoint reports failure instead of a broken-looking result.
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context="LIBRARY EXCERPT"))

    calls = []

    def always_truncated(messages, **kwargs):
        calls.append(1)
        return {"know": "a very long elaboration that ate the whole budget", "question": "", "byhand": "", "discover": ""}

    service = DiscoveryService()
    monkeypatch.setattr(service._engine, "chat_json", always_truncated)

    result = service.discover("some topic", level="teen")

    assert result is None
    assert len(calls) == 2  # both retry attempts were used before giving up


def test_discover_works_with_no_library_content(monkeypatch):
    # No library hit shouldn't break the prompt or crash grounding.
    monkeypatch.setattr(concept_graph_module, "get_concept_graph", lambda: _FakeGraph())
    monkeypatch.setattr(library_module, "get_library", lambda: _FakeLibrary(context=""))

    service = DiscoveryService()
    monkeypatch.setattr(
        service._engine,
        "chat_json",
        lambda messages, **kwargs: {
            "know": "k", "question": "q", "byhand": "b", "discover": "d", "explain": "e",
        },
    )
    result = service.discover("a brand new topic", level="teen")
    assert result is not None
