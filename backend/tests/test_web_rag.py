"""Unit tests for WebMathRAG retrieval and enrichment."""
import json

from app.ai.web_rag import WebMathRAG


class _FakeHTTPResponse:
    def __init__(self, payload: dict | list):
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self._payload).encode("utf-8")


def test_web_rag_retrieve_from_wikipedia(monkeypatch):
    def fake_urlopen(url, timeout=0):  # noqa: ARG001
        if "opensearch" in url:
            return _FakeHTTPResponse(["query", ["Hamiltonian path", "Hamiltonian cycle"], [], []])
        if "summary/Hamiltonian_path" in url:
            return _FakeHTTPResponse(
                {
                    "title": "Hamiltonian path",
                    "extract": "In graph theory, a Hamiltonian path visits each vertex exactly once.",
                    "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Hamiltonian_path"}},
                }
            )
        if "summary/Hamiltonian_cycle" in url:
            return _FakeHTTPResponse(
                {
                    "title": "Hamiltonian cycle",
                    "extract": "A Hamiltonian cycle is a cycle that visits each vertex exactly once.",
                    "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Hamiltonian_cycle"}},
                }
            )
        raise RuntimeError(f"Unexpected url: {url}")

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)

    rag = WebMathRAG()
    snippets = rag.retrieve("explain hamiltonian graph", limit=2)
    assert len(snippets) == 2
    assert snippets[0].title.lower().startswith("hamiltonian")


def test_web_rag_enrich_answer_adds_sources(monkeypatch):
    monkeypatch.setattr(WebMathRAG, "is_enabled", lambda self: True)
    monkeypatch.setattr(
        WebMathRAG,
        "retrieve",
        lambda self, question, limit=3: [
            type(
                "S",
                (),
                {
                    "title": "Hamiltonian cycle",
                    "snippet": "A Hamiltonian cycle visits each vertex exactly once and returns to the start.",
                    "url": "https://en.wikipedia.org/wiki/Hamiltonian_cycle",
                },
            )()
        ],
    )

    rag = WebMathRAG()
    text = rag.enrich_answer("Explain Hamiltonian graphs", "Base answer.")
    assert "Web RAG Notes" in text
    assert "Sources" in text
    assert "wikipedia" in text.lower()
