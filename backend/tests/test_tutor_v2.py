"""Tests for structured tutor response v2."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_tutor_returns_structured_fields(client):
    response = client.post(
        "/api/ai/tutor",
        json={"question": "Explain eigenvalues with visualization", "response_mode": "both"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["response_mode"] == "both"
    assert payload["learner_level"] == "teen"
    assert "plain_explanation" in payload
    assert "axiomatic_explanation" in payload
    assert isinstance(payload.get("key_takeaways"), list)
    assert isinstance(payload.get("next_questions"), list)
    assert isinstance(payload.get("checks"), list)
    assert isinstance(payload.get("improvement_hints"), list)
    assert "self_correction" in payload
    assert payload["needs_visualization"] is True
    assert payload["visualization"] is not None


def test_tutor_response_mode_plain(client):
    response = client.post(
        "/api/ai/tutor",
        json={"question": "Explain eigenvalues with visualization", "response_mode": "plain"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["response_mode"] == "plain"
    assert payload["plain_explanation"] in payload["solution"]


def test_tutor_learner_level_kids(client):
    response = client.post(
        "/api/ai/tutor",
        json={
            "question": "Explain fractions with visualization",
            "response_mode": "plain",
            "learner_level": "kids",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["learner_level"] == "kids"
    assert "Kid-friendly mode" in (payload.get("plain_explanation") or "")


def test_tutor_response_mode_axiomatic(client):
    response = client.post(
        "/api/ai/tutor",
        json={"question": "Explain eigenvalues with visualization", "response_mode": "axiomatic"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["response_mode"] == "axiomatic"
    assert "Axiomatic" in payload["solution"]


def test_tutor_followup_uses_dynamic_flow(client, monkeypatch):
    from app import main

    def _mock_answer(question, history=None):
        return ("Follow-up dynamic explanation with a new worked example.", None)

    monkeypatch.setattr(main.tutor_service, "answer", _mock_answer)
    response = client.post(
        "/api/ai/tutor",
        json={
            "question": "Can you show one worked example for Explain euler's identity with visualization?",
            "history": [
                {"role": "user", "content": "Explain euler's identity with visualization"},
                {"role": "assistant", "content": "Euler identity overview."},
                {"role": "user", "content": "Can you show one worked example for Explain euler's identity with visualization?"},
            ],
            "response_mode": "plain",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "Follow-up dynamic explanation" in payload["solution"]
