"""Tests for authentication endpoints."""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def unique_email() -> str:
    """Generate a unique email for testing."""
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


class TestAuthEndpoints:
    def test_register(self, client):
        email = unique_email()
        response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "password123",
                "name": "Test User",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["name"] == "Test User"

    def test_register_duplicate_email(self, client):
        email = unique_email()
        # Register first user
        client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        # Try to register with same email
        response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_success(self, client):
        email = unique_email()
        # Register first
        client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        # Login
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

    def test_login_wrong_password(self, client):
        email = unique_email()
        # Register first
        client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        # Login with wrong password
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent_user@example.com", "password": "password123"},
        )
        assert response.status_code == 401

    def test_get_me(self, client):
        email = unique_email()
        # Register and get token
        register_response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123", "name": "Me"},
        )
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == email

    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_update_profile(self, client):
        email = unique_email()
        # Register
        register_response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        assert register_response.status_code == 200
        token = register_response.json()["access_token"]

        # Update profile
        response = client.patch(
            "/api/auth/me",
            json={"name": "Updated Name", "learning_level": "intermediate"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        assert response.json()["learning_level"] == "intermediate"


class TestProgressEndpoints:
    def _get_token(self, client, email: str = None) -> str:
        email = email or unique_email()
        response = client.post(
            "/api/auth/register",
            json={"email": email, "password": "password123"},
        )
        assert response.status_code == 200, f"Registration failed: {response.json()}"
        return response.json()["access_token"]

    def test_update_progress(self, client):
        token = self._get_token(client)

        response = client.put(
            "/api/progress/pythagorean_theorem",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_list_progress(self, client):
        token = self._get_token(client)

        # Create some progress
        client.put(
            "/api/progress/pythagorean_theorem",
            json={"status": "completed", "score": 85},
            headers={"Authorization": f"Bearer {token}"},
        )

        # List progress
        response = client.get(
            "/api/progress",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        progress = response.json()["progress"]
        assert len(progress) > 0
        assert progress[0]["concept_slug"] == "pythagorean_theorem"
        assert progress[0]["score"] == 85

    def test_progress_requires_auth(self, client):
        response = client.get("/api/progress")
        assert response.status_code == 422  # Missing header
