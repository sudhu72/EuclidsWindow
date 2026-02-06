"""Unit tests for content module."""
import pytest

from app.content import TopicCatalog


@pytest.fixture
def catalog():
    return TopicCatalog()


class TestTopicCatalog:
    def test_match_pythagorean(self, catalog):
        topic = catalog.match_topic("Explain the Pythagorean theorem")
        assert topic is not None
        assert topic["id"] == "pythagorean_theorem"

    def test_match_number_line(self, catalog):
        topic = catalog.match_topic("Show me a number line")
        assert topic is not None
        assert topic["id"] == "number_line"

    def test_match_base_conversion(self, catalog):
        topic = catalog.match_topic("How does base conversion work?")
        assert topic is not None
        assert topic["id"] == "base_conversion"

    def test_match_parabola(self, catalog):
        topic = catalog.match_topic("Explain the conic section parabola")
        assert topic is not None
        assert topic["id"] == "parabola"

    def test_match_prime(self, catalog):
        topic = catalog.match_topic("What is a prime number?")
        assert topic is not None
        assert topic["id"] == "prime_numbers"

    def test_no_match(self, catalog):
        topic = catalog.match_topic("recipe for chocolate cake")
        assert topic is None

    def test_build_visualization_with_viz(self, catalog):
        topic = catalog.match_topic("pythagorean")
        viz = catalog.build_visualization(topic)
        assert viz is not None
        assert viz.viz_id == "pythagorean_svg"
        assert viz.viz_type.value == "svg"

    def test_build_visualization_no_viz(self, catalog):
        topic = catalog.match_topic("prime")
        viz = catalog.build_visualization(topic)
        assert viz is None
