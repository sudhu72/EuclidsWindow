"""Visualization generation service."""
from typing import Any, Dict, Optional

from ..models import VisualizationPayload, VisualizationType


class VisualizationService:
    """Generates visualization payloads for different types."""

    @staticmethod
    def plotly_number_line() -> Dict[str, Any]:
        x_values = list(range(-5, 6))
        return {
            "data": [
                {
                    "x": x_values,
                    "y": [0] * len(x_values),
                    "mode": "lines+markers+text",
                    "text": [str(x) for x in x_values],
                    "textposition": "top center",
                    "line": {"color": "#2563EB"},
                    "marker": {"size": 10},
                }
            ],
            "layout": {
                "title": "Integer Number Line",
                "xaxis": {"showgrid": False, "zeroline": False},
                "yaxis": {"visible": False},
                "margin": {"l": 20, "r": 20, "t": 40, "b": 20},
                "height": 240,
            },
        }

    @staticmethod
    def plotly_parabola() -> Dict[str, Any]:
        x_values = [x / 2 for x in range(-10, 11)]
        y_values = [x**2 - 2 for x in x_values]
        return {
            "data": [
                {
                    "x": x_values,
                    "y": y_values,
                    "mode": "lines",
                    "line": {"color": "#8B5CF6"},
                }
            ],
            "layout": {
                "title": "Parabola: y = x^2 - 2",
                "xaxis": {"title": "x"},
                "yaxis": {"title": "y"},
                "margin": {"l": 40, "r": 20, "t": 40, "b": 40},
                "height": 300,
            },
        }

    def build_payload(
        self, topic_viz: Optional[VisualizationPayload]
    ) -> Optional[VisualizationPayload]:
        if not topic_viz:
            return None

        if topic_viz.viz_id == "number_line_plotly":
            return VisualizationPayload(
                viz_id=topic_viz.viz_id,
                viz_type=VisualizationType.plotly,
                title=topic_viz.title,
                data=self.plotly_number_line(),
            )

        if topic_viz.viz_id == "parabola_plotly":
            return VisualizationPayload(
                viz_id=topic_viz.viz_id,
                viz_type=VisualizationType.plotly,
                title=topic_viz.title,
                data=self.plotly_parabola(),
            )

        if topic_viz.viz_type == VisualizationType.svg:
            return VisualizationPayload(
                viz_id=topic_viz.viz_id,
                viz_type=VisualizationType.svg,
                title=topic_viz.title,
                data={"url": f"/visualizations/{topic_viz.viz_id}.svg"},
            )

        if topic_viz.viz_type == VisualizationType.manim:
            return VisualizationPayload(
                viz_id=topic_viz.viz_id,
                viz_type=VisualizationType.manim,
                title=topic_viz.title,
                data=topic_viz.data or {},
            )

        return None

    def get_by_id(self, viz_id: str) -> Optional[Dict[str, Any]]:
        if viz_id == "number_line_plotly":
            return {"viz_type": "plotly", "data": self.plotly_number_line()}
        if viz_id == "parabola_plotly":
            return {"viz_type": "plotly", "data": self.plotly_parabola()}
        if viz_id in {"pythagorean_svg", "base_conversion_svg"}:
            return {"viz_type": "svg", "data": {"url": f"/visualizations/{viz_id}.svg"}}
        return None
