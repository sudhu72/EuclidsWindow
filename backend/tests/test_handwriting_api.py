"""Tests for handwriting OCR and validation endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import TutorCheck
from app.ai.web_rag import RetrievedSnippet


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_handwriting_recognize(client, monkeypatch):
    from app import main

    monkeypatch.setattr(main.handwriting_service, "recognize", lambda _img: ("x^2 + 2x + 1 = 0", 0.91))
    payload = {"image_data": "data:image/png;base64,ZmFrZQ=="}
    response = client.post("/api/ai/handwriting/recognize", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["text"] == "x^2 + 2x + 1 = 0"
    assert body["confidence"] == pytest.approx(0.91)


def test_handwriting_validate_with_rag_feedback(client, monkeypatch):
    from app import main

    checks = [
        TutorCheck(name="equation_roots_match", status="warn", details="Expected roots not detected."),
        TutorCheck(name="non_empty_solution", status="pass", details="Solution is present."),
    ]
    monkeypatch.setattr(main.symbolic_checker, "run", lambda _q, _a: checks)
    monkeypatch.setattr(
        main.web_rag,
        "retrieve",
        lambda _q, limit=2: [
            RetrievedSnippet(
                title="Quadratic equation",
                snippet="The quadratic formula solves ax^2+bx+c=0 for x.",
                url="https://en.wikipedia.org/wiki/Quadratic_equation",
            )
        ],
    )
    response = client.post(
        "/api/ai/handwriting/validate",
        json={"question": "solve x^2 + 2x + 1 = 0", "answer_text": "x = 0"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "warn"
    assert body["pass_rate"] == pytest.approx(0.5)
    assert len(body["rag_feedback"]) == 1
