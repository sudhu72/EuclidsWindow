"""Tests for resource endpoints."""
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


class TestResourceEndpoints:
    def test_search_resources(self, client):
        response = client.get("/api/resources")
        assert response.status_code == 200
        data = response.json()
        assert "resources" in data
        assert len(data["resources"]) > 0

    def test_search_resources_by_type(self, client):
        response = client.get("/api/resources?resource_type=book")
        data = response.json()
        for resource in data["resources"]:
            assert resource["resource_type"] == "book"

    def test_search_resources_by_difficulty(self, client):
        response = client.get("/api/resources?difficulty=beginner")
        data = response.json()
        for resource in data["resources"]:
            assert resource["difficulty"] == "beginner"

    def test_search_resources_by_query(self, client):
        response = client.get("/api/resources?query=euclid")
        data = response.json()
        assert len(data["resources"]) > 0
        found = any("euclid" in r["title"].lower() for r in data["resources"])
        assert found

    def test_get_concept_resources(self, client):
        response = client.get("/api/concepts/pythagorean_theorem/resources")
        assert response.status_code == 200
        data = response.json()
        assert "resources" in data
        # Pythagorean theorem should have resources linked
        assert len(data["resources"]) > 0
