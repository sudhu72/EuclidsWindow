"""Tests for the Math Quest graph endpoint (backend/app/routers/quest.py)."""
import pytest
from fastapi.testclient import TestClient

from app.db.base import SessionLocal
from app.db.models import Concept
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def db_prereq_pairs():
    """(prerequisite_slug, concept_slug) edges as the live DB actually has them.

    Cross-checks against the DB directly, not backend/data/seed_concepts.json --
    the two can drift (the live DB may have been seeded from an older snapshot
    or edited directly), and this endpoint's job is to reflect the DB, not the
    seed file.
    """
    db = SessionLocal()
    try:
        pairs = set()
        for concept in db.query(Concept).all():
            for prereq in concept.prerequisites:
                pairs.add((prereq.slug, concept.slug))
        return pairs
    finally:
        db.close()


@pytest.mark.parametrize("theme", ["mystery", "treasure"])
def test_quest_graph_shape(client, theme):
    resp = client.get(f"/api/quest/graph?theme={theme}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["theme"] == theme
    assert len(body["nodes"]) == 130
    assert len(body["chapters"]) == 7

    for node in body["nodes"]:
        assert node["flavor_intro"].strip()
        assert node["flavor_hint"].strip()
        assert node["flavor_success"].strip()
        # The node's own name should be interpolated into its flavor text.
        assert node["name"] in node["flavor_intro"]


def test_quest_graph_edges_match_db(client):
    resp = client.get("/api/quest/graph?theme=mystery")
    body = resp.json()
    edges = {(e["source"], e["target"]) for e in body["edges"]}
    assert edges == db_prereq_pairs()


def test_quest_graph_root_nodes_have_no_prerequisites(client):
    resp = client.get("/api/quest/graph?theme=mystery")
    body = resp.json()
    roots = [n for n in body["nodes"] if not n["prerequisites"]]
    root_slugs = {n["slug"] for n in roots}
    # Every root must genuinely have zero incoming prerequisite edges in the DB.
    assert root_slugs
    edge_targets_with_prereqs = {c for _, c in db_prereq_pairs()}
    assert root_slugs.isdisjoint(edge_targets_with_prereqs)


def test_quest_graph_invalid_theme_rejected(client):
    resp = client.get("/api/quest/graph?theme=nonsense")
    assert resp.status_code == 422
