"""Tests for prompt collections endpoint."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_prompt_collections_shape(client):
    response = client.get("/api/prompt-collections")
    assert response.status_code == 200
    payload = response.json()
    assert "total_topics" in payload
    assert "total_prompts" in payload
    assert isinstance(payload.get("categories"), list)
    if payload["categories"]:
        first = payload["categories"][0]
        assert "category_id" in first
        assert "category_name" in first
        assert "topics" in first


def test_prompt_collections_filter_by_category(client):
    all_resp = client.get("/api/prompt-collections")
    assert all_resp.status_code == 200
    cats = all_resp.json().get("categories", [])
    if not cats:
        pytest.skip("No categories available to test filtering")
    cat_id = cats[0]["category_id"]
    filtered = client.get(f"/api/prompt-collections?category_id={cat_id}")
    assert filtered.status_code == 200
    payload = filtered.json()
    for cat in payload.get("categories", []):
        assert cat["category_id"] == cat_id
