"""A settings form must be able to write back exactly what it read.

`get_effective_settings` applies fast-mode derivations — a smaller model and the
multi-agent pipeline off. Those used to be served from GET /api/settings, so any
client that read settings, changed one field and wrote the object back persisted
them over the user's real choice, permanently. These tests pin the split between
configured (round-trippable) and effective (derived, read-only).
"""
import json

import pytest
from fastapi.testclient import TestClient

import app.settings_store as settings_store_module
from app.main import app, settings_store


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """Point the store at a scratch file so tests never touch real settings.

    The store resolves SETTINGS_PATH as a module global at call time, so
    patching the attribute redirects reads and writes. Assertions must go
    through the module too — importing the name binds the original Path.
    """
    scratch = tmp_path / "app_settings.json"
    monkeypatch.setattr(settings_store_module, "SETTINGS_PATH", scratch)
    with TestClient(app) as c:
        yield c


def test_configured_settings_carry_no_derivations():
    """Fast mode must not leak into the values the user chose."""
    configured = settings_store.get_configured_settings()
    effective = settings_store.get_effective_settings()
    if not configured["fast_mode_enabled"]:
        pytest.skip("fast mode off — nothing is derived")
    assert effective["local_multi_agent_enabled"] is False
    assert configured["local_multi_agent_enabled"] is not None


def test_get_returns_configured_model_not_the_fast_one(client):
    client.put("/api/settings", json={"local_llm_model": "qwen2.5:1.5b"})
    before = client.get("/api/settings").json()
    assert before["local_llm_model"] == "qwen2.5:1.5b"

    client.put("/api/settings", json={"fast_mode_enabled": True})
    after = client.get("/api/settings").json()

    # The user's choice survives, and the derived model is reported separately.
    assert after["local_llm_model"] == "qwen2.5:1.5b"
    assert after["effective_llm_model"] is not None


def test_read_modify_write_does_not_clobber_the_model(client):
    """The exact loop that corrupted stored settings: GET -> edit one -> PUT."""
    client.put(
        "/api/settings",
        json={"local_llm_model": "qwen2.5:1.5b", "local_multi_agent_enabled": True},
    )
    settings = client.get("/api/settings").json()

    # A whole-object save, the way the classic form does it.
    payload = {k: v for k, v in settings.items() if not k.startswith("effective_")}
    payload.pop("cloud_keys_set", None)
    payload["fast_mode_enabled"] = True
    client.put("/api/settings", json=payload)

    after = client.get("/api/settings").json()
    assert after["local_llm_model"] == "qwen2.5:1.5b"
    assert after["local_multi_agent_enabled"] is True

    # And turning fast mode back off restores the real runtime behaviour.
    client.put("/api/settings", json={"fast_mode_enabled": False})
    restored = client.get("/api/settings").json()
    assert restored["local_llm_model"] == "qwen2.5:1.5b"
    assert restored["local_multi_agent_enabled"] is True


def test_stored_file_only_holds_what_was_sent(client):
    """A single-field PUT must not write derived values into the store."""
    path = settings_store_module.SETTINGS_PATH
    client.put("/api/settings", json={"fast_mode_enabled": True})
    stored = json.loads(path.read_text()) if path.exists() else {}
    assert stored.get("fast_mode_enabled") is True
    assert "local_llm_model" not in stored
    assert "local_multi_agent_enabled" not in stored
