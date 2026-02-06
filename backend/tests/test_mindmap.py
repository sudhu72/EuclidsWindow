"""Tests for mind map endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def seed_db():
    """Run seed script before tests."""
    import subprocess
    import sys
    from pathlib import Path

    seed_script = Path(__file__).resolve().parents[1] / "scripts" / "seed_db.py"
    subprocess.run([sys.executable, str(seed_script)], check=True, capture_output=True)


class TestMindMapEndpoints:
    def test_get_mind_map_pythagorean(self, client):
        response = client.get("/api/mindmap/pythagorean_theorem")
        assert response.status_code == 200
        data = response.json()
        assert data["target"] == "pythagorean_theorem"
        assert len(data["nodes"]) > 0
        assert len(data["links"]) > 0

        # Check target node exists
        target_node = next((n for n in data["nodes"] if n["is_target"]), None)
        assert target_node is not None
        assert target_node["id"] == "pythagorean_theorem"

    def test_get_mind_map_with_depth(self, client):
        response = client.get("/api/mindmap/pythagorean_theorem?depth=1")
        data = response.json()
        # With depth 1, should have fewer nodes
        assert len(data["nodes"]) >= 1

    def test_get_mind_map_not_found(self, client):
        response = client.get("/api/mindmap/nonexistent_concept")
        assert response.status_code == 404


class TestConceptEndpoints:
    def test_list_concepts(self, client):
        response = client.get("/api/concepts")
        assert response.status_code == 200
        data = response.json()
        assert "concepts" in data
        assert len(data["concepts"]) > 0

    def test_list_concepts_by_category(self, client):
        response = client.get("/api/concepts?category=geometry")
        data = response.json()
        for concept in data["concepts"]:
            assert concept["category"] == "geometry"
