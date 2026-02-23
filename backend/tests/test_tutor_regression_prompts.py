"""Canonical regression prompts for tutor endpoint stability."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


PROMPTS = [
    ("Explain eigenvalues with visualization", True),
    ("Explain the Pythagorean theorem", True),
    ("Show a number line", True),
    ("Explain base conversion", True),
    ("Graph a parabola", True),
    ("Explain vectors", None),
    ("Explain integral", None),
    ("Explain probability", None),
    ("Explain polar coordinates", True),
    ("Explain Taylor series", True),
    ("Explain roots of unity", True),
    ("Explain FFT and DFT", True),
]


@pytest.mark.parametrize("prompt,expect_visual", PROMPTS)
def test_tutor_regression_prompt_set(client, prompt, expect_visual):
    response = client.post(
        "/api/ai/tutor",
        json={"question": prompt, "response_mode": "both"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["solution"]
    assert payload["plain_explanation"]
    assert payload["axiomatic_explanation"]
    assert isinstance(payload["checks"], list)
    assert isinstance(payload["improvement_hints"], list)
    if expect_visual is True:
        assert payload["needs_visualization"] is True
        assert payload["visualization"] is not None
