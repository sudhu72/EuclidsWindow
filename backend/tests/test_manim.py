"""Tests for Manim animation service and endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.manim_service import ManimService


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def manim_service():
    return ManimService()


class TestManimService:
    def test_get_animation_id(self, manim_service):
        """Test animation ID generation is deterministic."""
        id1 = manim_service.get_animation_id("TestScene", quality="low")
        id2 = manim_service.get_animation_id("TestScene", quality="low")
        id3 = manim_service.get_animation_id("TestScene", quality="high")
        
        assert id1 == id2  # Same params = same ID
        assert id1 != id3  # Different params = different ID

    def test_list_available_scenes(self, manim_service):
        """Test listing available scenes."""
        scenes = manim_service.list_available_scenes()
        assert isinstance(scenes, list)
        # Should find our scene files
        scene_names = [s["name"] for s in scenes]
        # Check some expected scenes exist
        expected = ["PythagoreanTheorem", "DerivativeAsSlope", "LoRAVisualization"]
        for exp in expected:
            assert exp in scene_names, f"Expected scene {exp} not found"

    def test_get_cached_animation_not_exists(self, manim_service):
        """Test getting non-existent animation returns None."""
        result = manim_service.get_cached_animation("nonexistent123")
        assert result is None


class TestAnimationEndpoints:
    def test_list_scenes(self, client):
        """Test listing animation scenes endpoint."""
        response = client.get("/api/animations/scenes")
        assert response.status_code == 200
        data = response.json()
        assert "scenes" in data
        assert isinstance(data["scenes"], list)

    def test_get_animation_not_found(self, client):
        """Test getting non-existent animation."""
        response = client.get("/api/animations/nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "not_found"

    def test_manim_status(self, client):
        """Test Manim availability status endpoint."""
        response = client.get("/api/animations/status/manim")
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert "scenes_count" in data
        assert isinstance(data["available"], bool)

    def test_render_animation_invalid_scene(self, client):
        """Test rendering with invalid scene name."""
        response = client.post(
            "/api/animations/render",
            json={
                "scene_name": "NonExistentScene123",
                "quality": "low",
                "output_format": "gif",
            },
        )
        assert response.status_code == 200
        data = response.json()
        # Either Manim not available or scene not found
        assert data["status"] == "error"


class TestMLMathCategory:
    def test_ml_math_category_exists(self, client):
        """Test that ML Mathematics category exists in math map."""
        response = client.get("/api/mathmap/category/ml_mathematics")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "ml_mathematics"
        assert data["name"] == "ML Mathematics"
        assert "topics" in data
        assert len(data["topics"]) >= 8  # We added 8 topics

    def test_ml_math_topics_have_prompts(self, client):
        """Test that ML Math topics have prompts."""
        ml_topics = ["lora", "rag", "attention", "backpropagation", "transformers"]
        for topic_id in ml_topics:
            response = client.get(f"/api/mathmap/topic/{topic_id}")
            assert response.status_code == 200
            data = response.json()
            assert "prompts" in data
            assert len(data["prompts"]) >= 5  # Each topic has 5 prompts

    def test_search_finds_lora(self, client):
        """Test searching for LoRA topic."""
        response = client.get("/api/mathmap/search?query=lora")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) > 0
        found = any("lora" in r["id"].lower() for r in data["results"])
        assert found

    def test_search_finds_rag(self, client):
        """Test searching for RAG topic."""
        response = client.get("/api/mathmap/search?query=retrieval")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) > 0
