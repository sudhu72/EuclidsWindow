"""Tests for on-demand diagram/animation endpoint."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_visualize_on_demand_diagram(client):
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Explain eigenvalues", "style": "diagram"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "message" in payload
    # Visualization may be absent for unsupported topics; eigenvalues should usually map.
    if payload.get("visualization"):
        assert payload["visualization"]["viz_type"] in {"plotly", "manim"}
    else:
        assert payload.get("visualization_job_id") is not None


def test_visualize_on_demand_animation_unmapped_topic(client):
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Explain set theory", "style": "animation"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("visualization") is None


def test_visualize_on_demand_animation_background(client):
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Explain eigenvalues", "style": "animation"},
    )
    assert response.status_code == 200
    payload = response.json()
    # May complete immediately from cache or start as background job.
    assert payload.get("visualization") is not None or payload.get("animation_id") is not None


def test_visualization_jobs_endpoint(client):
    response = client.get("/api/visualizations/jobs?limit=5")
    assert response.status_code == 200
    payload = response.json()
    assert "jobs" in payload
    assert isinstance(payload["jobs"], list)
