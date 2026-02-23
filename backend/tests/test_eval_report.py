"""Tests for evaluation report endpoint."""
import pytest
from fastapi.testclient import TestClient

from app import main as main_module
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_eval_report_shape(client):
    response = client.get("/api/eval/report")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_prompts"] > 0
    assert isinstance(payload["avg_duration_ms"], int)
    assert isinstance(payload["visualization_coverage"], float)
    assert isinstance(payload["avg_checks_pass_rate"], float)
    assert payload["mode"] == "catalog"
    assert isinstance(payload["timeout_count"], int)
    assert isinstance(payload["error_count"], int)
    assert isinstance(payload["latency_histogram"], dict)
    assert "run_label" in payload
    assert "run_tags" in payload
    assert isinstance(payload["results"], list)
    first = payload["results"][0]
    assert "prompt" in first
    assert "duration_ms" in first
    assert "has_visualization" in first
    assert "checks_pass_rate" in first
    assert "warning_count" in first
    assert "source" in first
    assert "timed_out" in first
    assert "error" in first


def test_eval_report_live_mode(client, monkeypatch):
    monkeypatch.setattr(
        main_module.tutor_service,
        "answer",
        lambda question, history=None: ("Examples: quick response with equation x^2", None),
    )
    monkeypatch.setattr(main_module.tutor_service, "fallback_visualization", lambda question: None)

    response = client.get("/api/eval/report?live=true&per_prompt_timeout_ms=800")
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "live"
    assert payload["total_prompts"] > 0
    assert payload["error_count"] == 0


def test_eval_report_with_label_and_tags(client):
    response = client.get("/api/eval/report?run_label=baseline-v1&run_tags=baseline,fast")
    assert response.status_code == 200
    payload = response.json()
    assert payload["run_label"] == "baseline-v1"
    assert payload["run_tags"] == ["baseline", "fast"]


def test_eval_history_and_export(client):
    # Create at least one persisted run.
    run_resp = client.get("/api/eval/report?persist=true")
    assert run_resp.status_code == 200

    hist_resp = client.get("/api/eval/history?limit=5")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert isinstance(history["runs"], list)
    assert len(history["runs"]) >= 1
    assert "run_label" in history["runs"][0]
    assert "run_tags" in history["runs"][0]

    export_json = client.get("/api/eval/report/export?format=json&latest=true")
    assert export_json.status_code == 200
    assert "application/json" in export_json.headers.get("content-type", "")

    export_csv = client.get("/api/eval/report/export?format=csv&latest=true")
    assert export_csv.status_code == 200
    assert "text/csv" in export_csv.headers.get("content-type", "")
    assert "prompt,duration_ms" in export_csv.text


def test_eval_history_filters_and_compare(client):
    # Create two runs with different metadata.
    r1 = client.get("/api/eval/report?persist=true&run_label=run-a&run_tags=baseline,catalog")
    assert r1.status_code == 200
    r2 = client.get("/api/eval/report?persist=true&run_label=run-b&run_tags=experiment,live&live=true")
    assert r2.status_code == 200

    hist = client.get("/api/eval/history?mode=catalog&label_contains=run-a")
    assert hist.status_code == 200
    runs = hist.json()["runs"]
    assert isinstance(runs, list)
    assert any("run-a" == (row.get("run_label")) for row in runs)

    # Compare latest two runs from unfiltered history.
    full_hist = client.get("/api/eval/history?limit=5")
    assert full_hist.status_code == 200
    rows = full_hist.json()["runs"]
    assert len(rows) >= 2
    a = rows[0]["id"]
    b = rows[1]["id"]
    cmp_resp = client.get(f"/api/eval/compare?run_a_id={a}&run_b_id={b}")
    assert cmp_resp.status_code == 200
    cmp = cmp_resp.json()
    assert "delta" in cmp
    assert "avg_duration_ms" in cmp["delta"]
