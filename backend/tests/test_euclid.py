"""Tests for Euclid's Elements endpoints."""
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


class TestEuclidEndpoints:
    def test_get_entry_by_reference(self, client):
        response = client.get("/api/euclid/I.47")
        assert response.status_code == 200
        data = response.json()
        assert data["reference"] == "I.47"
        assert data["book"] == 1
        assert data["entry_type"] == "proposition"
        assert "Pythagorean" in data["modern_text"]

    def test_get_entry_not_found(self, client):
        response = client.get("/api/euclid/X.999")
        assert response.status_code == 404

    def test_search_euclid(self, client):
        response = client.get("/api/euclid")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert len(data["entries"]) > 0

    def test_search_euclid_by_book(self, client):
        response = client.get("/api/euclid?book=7")
        data = response.json()
        for entry in data["entries"]:
            assert entry["book"] == 7

    def test_search_euclid_by_type(self, client):
        response = client.get("/api/euclid?entry_type=definition")
        data = response.json()
        for entry in data["entries"]:
            assert entry["entry_type"] == "definition"

    def test_search_euclid_by_query(self, client):
        response = client.get("/api/euclid?query=prime")
        data = response.json()
        assert len(data["entries"]) > 0
        # Should find prime number definition
        found_prime = any("prime" in e["original_text"].lower() for e in data["entries"])
        assert found_prime
