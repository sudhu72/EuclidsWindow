"""Tests for Math Map endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestMathMapEndpoints:
    def test_get_full_map(self, client):
        response = client.get("/api/mathmap")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0

    def test_get_categories(self, client):
        response = client.get("/api/mathmap/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        for cat in data["categories"]:
            assert "id" in cat
            assert "name" in cat
            assert "color" in cat

    def test_get_category(self, client):
        response = client.get("/api/mathmap/category/foundations")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "foundations"
        assert "topics" in data
        assert len(data["topics"]) > 0

    def test_get_category_not_found(self, client):
        response = client.get("/api/mathmap/category/nonexistent")
        assert response.status_code == 404

    def test_get_topic(self, client):
        response = client.get("/api/mathmap/topic/pythagorean")
        assert response.status_code == 404  # Not in our map

        response = client.get("/api/mathmap/topic/set_theory")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "set_theory"
        assert "prompts" in data
        assert len(data["prompts"]) > 0

    def test_search_topics(self, client):
        response = client.get("/api/mathmap/search?query=prime")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        # Should find prime numbers topic
        found = any("prime" in r["name"].lower() for r in data["results"])
        assert found

    def test_search_topics_no_results(self, client):
        response = client.get("/api/mathmap/search?query=xyznonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []
