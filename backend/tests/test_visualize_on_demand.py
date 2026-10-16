"""Tests for on-demand diagram/animation endpoint."""
import time

import pytest
from fastapi.testclient import TestClient

from app import main as main_module
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


def test_visualize_on_demand_animation_unmapped_topic(client, monkeypatch):
    # No pre-built scene matches "set theory", so this exercises the dynamic
    # (template + LLM) pipeline's "nothing generated" response path. Stub the
    # pipeline rather than relying on the live LLM/Manim render to fail — that
    # depends on real model output and was flaky (it sometimes succeeds).
    monkeypatch.setattr(main_module.animation_pipeline, "generate", lambda *a, **k: None)
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Explain set theory", "style": "animation", "mode": "quick"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("visualization") is None


def test_visualize_on_demand_animation_background(client):
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Explain eigenvalues", "style": "animation", "mode": "quick"},
    )
    assert response.status_code == 200
    payload = response.json()
    # May complete immediately from cache or start as background job.
    assert payload.get("visualization") is not None or payload.get("animation_id") is not None


def test_visualize_on_demand_animation_story_job(client, monkeypatch):
    # Story mode always runs as a polled job; stub the animator so the test
    # never calls an LLM or renders.
    seen = {}

    def fake_generate(topic, context, level, job_id, progress, narrate=True):
        seen.update(topic=topic, context=context, level=level)
        progress(50, "Act 1 of 1 ready")
        return {"url": f"/animations/{job_id}.mp4", "format": "mp4"}

    monkeypatch.setattr(main_module.story_animator, "generate", fake_generate)
    response = client.post(
        "/api/ai/visualize",
        json={"question": "Bayes theorem", "style": "animation", "context": "A test for a rare disease...",
              "learner_level": "college"},
    )
    assert response.status_code == 200
    animation_id = response.json()["animation_id"]
    assert animation_id.startswith("story-")
    for _ in range(50):
        job = client.get(f"/api/animations/{animation_id}").json()
        if job["status"] == "completed":
            break
        time.sleep(0.05)
    assert job["status"] == "completed" and job["url"].endswith(".mp4")
    assert seen == {"topic": "Bayes theorem", "context": "A test for a rare disease...", "level": "college"}


def test_visualization_jobs_endpoint(client):
    response = client.get("/api/visualizations/jobs?limit=5")
    assert response.status_code == 200
    payload = response.json()
    assert "jobs" in payload
    assert isinstance(payload["jobs"], list)
