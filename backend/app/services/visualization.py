"""Visualization generation service."""
import math
from typing import Any, Dict, List, Optional

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

    @staticmethod
    def _evaluate_parametric_traces(traces: List[dict]) -> List[dict]:
        """Expand parametric traces that use x_formula/y_formula into x/y arrays."""
        safe_ns = {"cos": math.cos, "sin": math.sin, "pi": math.pi,
                    "sqrt": math.sqrt, "exp": math.exp, "log": math.log,
                    "abs": abs, "pow": pow}
        out = []
        for trace in traces:
            x_f = trace.get("x_formula")
            y_f = trace.get("y_formula")
            if x_f and y_f:
                t_lo, t_hi = trace.get("t_range", [0, 2 * math.pi])
                steps = trace.get("t_steps", 100)
                dt = (t_hi - t_lo) / max(steps, 1)
                xs, ys = [], []
                for i in range(steps + 1):
                    t = t_lo + i * dt
                    try:
                        xs.append(eval(x_f, {"__builtins__": {}}, {**safe_ns, "t": t}))  # noqa: S307
                        ys.append(eval(y_f, {"__builtins__": {}}, {**safe_ns, "t": t}))  # noqa: S307
                    except Exception:
                        continue
                expanded = {k: v for k, v in trace.items()
                            if k not in ("x_formula", "y_formula", "t_range", "t_steps")}
                expanded["x"] = xs
                expanded["y"] = ys
                out.append(expanded)
            else:
                out.append(trace)
        return out

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

        if topic_viz.viz_type == VisualizationType.plotly and topic_viz.data:
            data = dict(topic_viz.data)
            if "traces" in data:
                data["data"] = self._evaluate_parametric_traces(data.pop("traces"))
            return VisualizationPayload(
                viz_id=topic_viz.viz_id,
                viz_type=VisualizationType.plotly,
                title=topic_viz.title,
                data=data,
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
