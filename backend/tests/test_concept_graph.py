"""Tests for the concept graph (GraphRAG) grounding."""
from app.ai.concept_graph import get_concept_graph


def test_graph_builds():
    g = get_concept_graph()
    assert g.is_available()
    d = g.to_dict()
    assert len(d["nodes"]) > 50
    assert len(d["edges"]) > 20


def test_resolves_specific_concept():
    g = get_concept_graph()
    assert g.resolve("Euler's Identity") == "euler"
    assert g.resolve("pythagorean theorem") == "pythagorean_theorem"


def test_euler_identity_disambiguation():
    # The core bug this feature fixes: "Euler's identity" must ground to complex
    # numbers, never to planar-graph / graph-theory content.
    g = get_concept_graph()
    ctx = g.context_for("Euler's Identity")
    assert "Euler's Identity" in ctx
    related = g.neighbors("euler", hops=1)
    related_names = " ".join(g.node(n)["name"].lower() for n in related)
    assert "complex" in related_names
    assert "planar" not in related_names
    assert "graph theory" not in related_names


def test_resolve_returns_none_for_gibberish():
    g = get_concept_graph()
    assert g.resolve("zx qptv nonsense token") is None


def test_context_for_empty_when_unmatched():
    g = get_concept_graph()
    assert g.context_for("zx qptv nonsense token") == ""


def test_neighborhood_shape():
    g = get_concept_graph()
    nb = g.neighborhood("Euler's Identity", hops=1)
    assert nb is not None
    assert nb["focus"] == "euler"
    assert any(n["focus"] for n in nb["nodes"])
    # every edge references nodes present in the subgraph
    ids = {n["id"] for n in nb["nodes"]}
    assert all(e["source"] in ids and e["target"] in ids for e in nb["edges"])
