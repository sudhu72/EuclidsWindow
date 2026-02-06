"""Smoke tests for the API."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestHealthEndpoints:
    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_ready(self, client):
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"


class TestConversationEndpoints:
    def test_create_conversation(self, client):
        response = client.post("/api/conversations", params={"title": "Test"})
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "Test"

    def test_list_conversations(self, client):
        # Create one first
        client.post("/api/conversations", params={"title": "List Test"})
        response = client.get("/api/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data

    def test_get_conversation(self, client):
        # Create one first
        create_resp = client.post("/api/conversations", params={"title": "Get Test"})
        conv_id = create_resp.json()["id"]
        response = client.get(f"/api/conversations/{conv_id}")
        assert response.status_code == 200
        assert response.json()["id"] == conv_id

    def test_get_conversation_not_found(self, client):
        response = client.get("/api/conversations/non-existent-id")
        assert response.status_code == 404


class TestChatEndpoints:
    def _post_message(self, client, message: str, conversation_id: str = None):
        body = {"message": message}
        if conversation_id:
            body["conversation_id"] = conversation_id
        response = client.post("/api/chat/message", json=body)
        assert response.status_code == 200
        return response.json()

    def test_pythagorean_theorem_smoke(self, client):
        payload = self._post_message(client, "Explain the Pythagorean theorem")
        assert "a^2" in payload["response_text"]
        assert payload["visualization"]["viz_type"] == "svg"
        assert payload["conversation_id"] is not None

    def test_number_line_smoke(self, client):
        payload = self._post_message(client, "Show a number line")
        assert payload["visualization"]["viz_type"] == "plotly"
        assert payload["visualization"]["data"]["data"][0]["mode"] == "lines+markers+text"

    def test_base_conversion_smoke(self, client):
        payload = self._post_message(client, "Explain base conversion")
        assert "1101" in payload["response_text"]
        assert payload["visualization"]["viz_type"] == "svg"

    def test_parabola_smoke(self, client):
        payload = self._post_message(client, "Graph a parabola")
        assert payload["visualization"]["viz_type"] == "plotly"
        assert "Parabola" in payload["visualization"]["data"]["layout"]["title"]

    def test_conversation_persistence(self, client):
        # First message creates conversation
        payload1 = self._post_message(client, "Show a number line")
        conv_id = payload1["conversation_id"]
        assert conv_id is not None

        # Second message uses same conversation
        payload2 = self._post_message(client, "Explain parabola", conv_id)
        assert payload2["conversation_id"] == conv_id

        # Verify messages are saved
        response = client.get(f"/api/conversations/{conv_id}")
        conv = response.json()
        assert len(conv["messages"]) == 4  # 2 user + 2 assistant


class TestVisualizationEndpoints:
    def test_get_plotly_viz(self, client):
        response = client.get("/api/visualizations/number_line_plotly")
        assert response.status_code == 200
        data = response.json()
        assert data["viz_type"] == "plotly"

    def test_get_svg_viz(self, client):
        response = client.get("/api/visualizations/pythagorean_svg")
        assert response.status_code == 200
        data = response.json()
        assert data["viz_type"] == "svg"

    def test_viz_not_found(self, client):
        response = client.get("/api/visualizations/unknown")
        assert response.status_code == 404
