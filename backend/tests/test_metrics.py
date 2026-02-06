"""Tests for metrics module."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.metrics import Metrics, Timer


@pytest.fixture
def metrics():
    return Metrics()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestMetrics:
    def test_counter(self, metrics):
        metrics.inc_counter("test_counter")
        metrics.inc_counter("test_counter", value=5)
        assert metrics._counters["test_counter"] == 6

    def test_counter_with_labels(self, metrics):
        metrics.inc_counter("test_counter", labels={"method": "GET"})
        key = 'test_counter{method="GET"}'
        assert metrics._counters[key] == 1

    def test_gauge(self, metrics):
        metrics.set_gauge("test_gauge", 42.5)
        assert metrics._gauges["test_gauge"] == 42.5

    def test_histogram(self, metrics):
        metrics.observe_histogram("test_histogram", 1.5)
        metrics.observe_histogram("test_histogram", 2.5)
        assert len(metrics._histograms["test_histogram"]) == 2

    def test_prometheus_format(self, metrics):
        metrics.inc_counter("requests_total")
        metrics.set_gauge("active_connections", 10)
        output = metrics.get_prometheus_format()
        assert "requests_total" in output
        assert "active_connections" in output


class TestTimer:
    def test_timer_context_manager(self, metrics):
        import time as time_module

        with Timer("test_duration"):
            time_module.sleep(0.1)

        # Check that a histogram observation was recorded
        from app.metrics import metrics as global_metrics

        assert "test_duration" in global_metrics._histograms
        assert len(global_metrics._histograms["test_duration"]) > 0


class TestMetricsEndpoint:
    def test_metrics_endpoint(self, client):
        # Make some requests to generate metrics
        client.get("/health")
        client.get("/health")

        # Get metrics
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "euclids_window" in response.text
