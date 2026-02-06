"""Unit tests for visualization service."""
import pytest

from app.models import VisualizationPayload, VisualizationType
from app.services.visualization import VisualizationService


@pytest.fixture
def viz_service():
    return VisualizationService()


class TestVisualizationService:
    def test_plotly_number_line(self, viz_service):
        data = viz_service.plotly_number_line()
        assert "data" in data
        assert "layout" in data
        assert data["data"][0]["mode"] == "lines+markers+text"

    def test_plotly_parabola(self, viz_service):
        data = viz_service.plotly_parabola()
        assert "data" in data
        assert "layout" in data
        assert "Parabola" in data["layout"]["title"]

    def test_build_payload_plotly(self, viz_service):
        topic_viz = VisualizationPayload(
            viz_id="number_line_plotly",
            viz_type=VisualizationType.plotly,
            title="Number Line",
            data={},
        )
        payload = viz_service.build_payload(topic_viz)
        assert payload is not None
        assert payload.viz_type == VisualizationType.plotly
        assert "data" in payload.data

    def test_build_payload_svg(self, viz_service):
        topic_viz = VisualizationPayload(
            viz_id="pythagorean_svg",
            viz_type=VisualizationType.svg,
            title="Pythagorean",
            data={},
        )
        payload = viz_service.build_payload(topic_viz)
        assert payload is not None
        assert payload.viz_type == VisualizationType.svg
        assert "url" in payload.data

    def test_build_payload_none(self, viz_service):
        payload = viz_service.build_payload(None)
        assert payload is None

    def test_get_by_id_exists(self, viz_service):
        result = viz_service.get_by_id("number_line_plotly")
        assert result is not None
        assert result["viz_type"] == "plotly"

    def test_get_by_id_not_found(self, viz_service):
        result = viz_service.get_by_id("unknown_viz")
        assert result is None
