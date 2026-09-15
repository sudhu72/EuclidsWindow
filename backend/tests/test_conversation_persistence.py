"""Tests for auth-scoped persistence on the lesson-build and tutor-stream endpoints.

Monkeypatches the module-level LLM-backed singletons so these run without a
local Ollama instance.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

import app.routers.ai_media as ai_media_module
import app.routers.tutor_stream as tutor_stream_module
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def unique_email() -> str:
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def register(client) -> str:
    """Register a fresh user and return their bearer token."""
    resp = client.post(
        "/api/auth/register",
        json={"email": unique_email(), "password": "password123", "name": "Test"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


FAKE_LESSON = {
    "title": "The Mystery of X",
    "topic": "algebra basics",
    "level": "teen",
    "sections": [{"title": "Intro", "type": "explain", "summary": ""}],
    "scenes": [{"type": "explain", "narration": "x is a placeholder."}],
}


class TestLessonBuildPersistence:
    def test_anonymous_build_persists_and_is_retrievable_anonymously(self, client, monkeypatch):
        monkeypatch.setattr(ai_media_module.lesson_service, "is_available", lambda: True)
        monkeypatch.setattr(
            ai_media_module.lesson_service, "build", lambda topic, level: dict(FAKE_LESSON)
        )

        resp = client.post("/api/ai/lesson/build", json={"topic": "algebra basics", "level": "teen"})
        assert resp.status_code == 200
        conversation_id = resp.json()["conversation_id"]
        assert conversation_id

        conv = client.get(f"/api/conversations/{conversation_id}")
        assert conv.status_code == 200
        messages = conv.json()["messages"]
        assert [m["role"] for m in messages] == ["user", "assistant"]
        assert messages[0]["content"] == "algebra basics"

    def test_anonymous_conversation_not_visible_to_a_logged_in_user(self, client, monkeypatch):
        monkeypatch.setattr(ai_media_module.lesson_service, "is_available", lambda: True)
        monkeypatch.setattr(
            ai_media_module.lesson_service, "build", lambda topic, level: dict(FAKE_LESSON)
        )
        resp = client.post("/api/ai/lesson/build", json={"topic": "algebra basics", "level": "teen"})
        conversation_id = resp.json()["conversation_id"]

        token = register(client)
        blocked = client.get(f"/api/conversations/{conversation_id}", headers=auth_header(token))
        assert blocked.status_code == 404

    def test_authenticated_build_shows_up_only_in_owners_list(self, client, monkeypatch):
        monkeypatch.setattr(ai_media_module.lesson_service, "is_available", lambda: True)
        monkeypatch.setattr(
            ai_media_module.lesson_service, "build", lambda topic, level: dict(FAKE_LESSON)
        )
        token_a = register(client)
        token_b = register(client)

        resp = client.post(
            "/api/ai/lesson/build",
            json={"topic": "algebra basics", "level": "teen"},
            headers=auth_header(token_a),
        )
        assert resp.status_code == 200
        conversation_id = resp.json()["conversation_id"]

        # Owner can fetch it directly.
        own = client.get(f"/api/conversations/{conversation_id}", headers=auth_header(token_a))
        assert own.status_code == 200

        # Shows up in the owner's list.
        listing_a = client.get("/api/conversations", headers=auth_header(token_a))
        assert conversation_id in [c["id"] for c in listing_a.json()["conversations"]]

        # Not in another user's list, not fetchable by another user, not in the
        # anonymous list.
        listing_b = client.get("/api/conversations", headers=auth_header(token_b))
        assert conversation_id not in [c["id"] for c in listing_b.json()["conversations"]]
        assert client.get(f"/api/conversations/{conversation_id}", headers=auth_header(token_b)).status_code == 404
        assert client.get(f"/api/conversations/{conversation_id}").status_code == 404


class TestTutorStreamPersistence:
    def test_curated_path_persists_question_and_answer(self, client, monkeypatch):
        topic = {"id": "algebra_basics", "response_text": "Algebra uses letters for unknowns."}
        monkeypatch.setattr(tutor_stream_module._catalog, "match_topic", lambda q: topic)

        class _FakeLibrary:
            def has_strong_match(self, q):
                return False

        monkeypatch.setattr(tutor_stream_module, "get_library", lambda: _FakeLibrary())

        resp = client.post(
            "/api/ai/tutor/stream",
            json={"question": "what is algebra?", "learner_level": "teen"},
        )
        assert resp.status_code == 200
        body = resp.text
        assert "Algebra uses letters for unknowns." in body

        # Pull the conversation_id back out of the first SSE frame.
        import json as _json

        first_frame = _json.loads(body.splitlines()[0][len("data: "):])
        conversation_id = first_frame["meta"]["conversation_id"]

        conv = client.get(f"/api/conversations/{conversation_id}")
        assert conv.status_code == 200
        messages = conv.json()["messages"]
        assert [m["role"] for m in messages] == ["user", "assistant"]
        assert messages[0]["content"] == "what is algebra?"
        assert messages[1]["content"] == "Algebra uses letters for unknowns."


class TestConversationOwnershipRegression:
    def test_anonymous_conversation_still_fetchable_anonymously(self, client):
        resp = client.post("/api/conversations", params={"title": "hi"})
        assert resp.status_code == 200
        conversation_id = resp.json()["id"]
        assert client.get(f"/api/conversations/{conversation_id}").status_code == 200

    def test_other_users_conversation_is_404_not_leaked(self, client):
        token_a = register(client)
        token_b = register(client)
        resp = client.post("/api/conversations", params={"title": "hi"}, headers=auth_header(token_a))
        conversation_id = resp.json()["id"]
        assert (
            client.get(f"/api/conversations/{conversation_id}", headers=auth_header(token_b)).status_code
            == 404
        )
