"""Settings -> Model tuning routes (the host helper is stubbed)."""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.routers import tuning


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_status_reports_offline_helper(client, monkeypatch):
    def down(*a, **k):
        raise HTTPException(status_code=503, detail="Tuning helper is not running")

    monkeypatch.setattr(tuning, "_agent", down)
    body = client.get("/api/tuning/status").json()
    assert body["online"] is False and body["run"] is None


def test_promote_refuses_a_run_that_did_not_pass(client, monkeypatch):
    run = {"run": {"result": {"model": "euclid-tutor:raft-x", "verdict": "KEEP BASE"}}}
    monkeypatch.setattr(tuning, "_agent", lambda *a, **k: run)
    saved = {}
    monkeypatch.setattr(tuning.SettingsStore, "update", lambda self, u: saved.update(u))
    assert client.post("/api/tuning/promote").status_code == 409
    assert saved == {}


def test_promote_switches_the_tutor_after_a_passing_gate(client, monkeypatch):
    run = {"run": {"result": {"model": "euclid-tutor:raft-x", "verdict": "PROMOTE"}}}
    monkeypatch.setattr(tuning, "_agent", lambda *a, **k: run)
    saved = {}
    monkeypatch.setattr(tuning.SettingsStore, "update", lambda self, u: saved.update(u))
    assert client.post("/api/tuning/promote").json() == {"local_llm_model": "euclid-tutor:raft-x"}
    assert saved == {"local_llm_model": "euclid-tutor:raft-x"}


def test_start_with_claude_needs_a_key(client, monkeypatch):
    monkeypatch.setattr(tuning.SettingsStore, "get_effective_settings", lambda self: {})
    monkeypatch.setattr(tuning, "_agent", lambda *a, **k: pytest.fail("should not reach the helper"))
    r = client.post("/api/tuning/start", json={"sources": ["a.pdf"], "teacher": "claude"})
    assert r.status_code == 400


@pytest.mark.parametrize("key,judges", [("sk-test", ["llama3.1:8b", tuning.CLAUDE_HAIKU]),
                                        (None, ["llama3.1:8b", "qwen3:8b"])])
def test_default_judges_avoid_the_tutor_family_when_claude_is_available(client, monkeypatch, key, judges):
    setting = tuning.CLOUD_PROVIDERS["anthropic"]["key_setting"]
    monkeypatch.setattr(tuning.SettingsStore, "get_effective_settings", lambda self: {setting: key})

    async def no_models():
        raise RuntimeError("ollama down")

    monkeypatch.setattr("app.main.list_ollama_models", no_models)
    monkeypatch.setattr(tuning, "get_library", lambda: type("L", (), {"list_docs": lambda self: []})())
    assert client.get("/api/tuning/options").json()["defaults"]["judges"] == judges


def test_start_gates_against_the_current_tutor(client, monkeypatch):
    monkeypatch.setattr(tuning.SettingsStore, "get_effective_settings",
                        lambda self: {"local_llm_model": "euclid-tutor:raft1-ck200"})
    sent = {}
    monkeypatch.setattr(tuning, "_agent", lambda method, path, body=None: sent.update(body) or {"id": "r"})
    client.post("/api/tuning/start", json={"sources": ["a.pdf"], "judges": ["llama3.1:8b", "qwen3:8b"]})
    assert sent["base"] == "euclid-tutor:raft1-ck200"
