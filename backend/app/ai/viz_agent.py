"""Visualization Agent — generates lightweight visualizations from LLM output.

The VizAgent takes a tutor's text answer and produces a structured VizSpec,
which is then rendered into Plotly, Mermaid, or SVG by a template engine.
This runs as a second, fast LLM call (or regex extraction) after the main
tutor answer is generated.
"""
import json
import math
import re
from typing import Any, Dict, List, Optional

from ..logging_config import logger
from ..models import VisualizationPayload, VisualizationType
from .models import VisualizationPlan

# ---------------------------------------------------------------------------
# VizSpec: structured intent the LLM produces
# ---------------------------------------------------------------------------

VIZ_AGENT_PROMPT = """\
You are a visualization assistant. Given a math explanation, output a SINGLE \
JSON object describing the best lightweight visualization.

Rules:
- Output ONLY valid JSON, nothing else.
- Pick the viz_type that best fits:
  "chart" — for data, functions, comparisons (Plotly)
  "diagram" — for relationships, flows, proofs, hierarchies (Mermaid)
  "geometric" — for shapes, angles, coordinate geometry (SVG)
- Keep it simple: 1 visualization, not multiple.

Schema:
{
  "viz_type": "chart" | "diagram" | "geometric",
  "title": "short descriptive title",
  "chart": {  // only if viz_type == "chart"
    "chart_type": "line" | "bar" | "scatter" | "pie" | "polar" | "heatmap",
    "x_label": "...",
    "y_label": "...",
    "series": [
      {"name": "Series 1", "x": [1,2,3], "y": [4,5,6]},
      ...
    ]
  },
  "diagram": {  // only if viz_type == "diagram"
    "diagram_type": "flowchart" | "graph" | "sequence" | "mindmap" | "timeline",
    "mermaid_code": "graph TD; A-->B; B-->C;"
  },
  "geometric": {  // only if viz_type == "geometric"
    "shapes": [
      {"type": "circle", "cx": 0, "cy": 0, "r": 1, "label": "unit circle"},
      {"type": "line", "x1": 0, "y1": 0, "x2": 1, "y2": 1, "label": "radius"},
      {"type": "point", "x": 0.5, "y": 0.5, "label": "P"},
      {"type": "polygon", "points": [[0,0],[1,0],[0.5,0.87]], "label": "triangle"}
    ],
    "x_range": [-2, 2],
    "y_range": [-2, 2]
  }
}

Explanation to visualize:
"""


class VizAgent:
    """Generates a visualization spec from tutor output via LLM or heuristics."""

    def __init__(self):
        self._engine = None

    def _get_engine(self):
        if self._engine is None:
            from .engine import LocalLLMEngine
            self._engine = LocalLLMEngine()
        return self._engine

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------
    def generate_viz(
        self,
        question: str,
        answer_text: str,
        *,
        use_llm: bool = True,
        timeout: int = 30,
    ) -> Optional[VisualizationPayload]:
        """Try to produce a visualization from the tutor's answer.

        Strategy:
        1. Try heuristic extraction (fast, no LLM needed)
        2. If use_llm=True and heuristics fail, ask the LLM for a VizSpec
        3. Render the spec into a VisualizationPayload
        """
        spec = self._heuristic_extract(question, answer_text)

        if not spec and use_llm:
            spec = self._llm_extract(answer_text, timeout)

        if not spec:
            return None

        return self._render_spec(spec)

    # ------------------------------------------------------------------
    # Heuristic extraction — parse numbers/lists/relationships from text
    # ------------------------------------------------------------------
    def _heuristic_extract(
        self, question: str, text: str
    ) -> Optional[Dict[str, Any]]:
        q = question.lower()

        # Detect step-by-step / proof structure → Mermaid flowchart (check first)
        steps = self._extract_steps(text)
        if len(steps) >= 3:
            nodes = []
            for i, step in enumerate(steps[:8]):
                safe = step[:50].replace('"', "'").replace("\n", " ")
                node_id = chr(65 + i)
                nodes.append(f'{node_id}["{safe}"]')
            arrows = " --> ".join(chr(65 + i) for i in range(len(nodes)))
            mermaid = "graph TD\n    " + "\n    ".join(nodes) + f"\n    {arrows}"
            return {
                "viz_type": "diagram",
                "title": f"Steps: {question[:60]}",
                "diagram": {
                    "diagram_type": "flowchart",
                    "mermaid_code": mermaid,
                },
            }

        # Detect concept relationships → Mermaid mindmap
        concepts = self._extract_bold_terms(text)
        if len(concepts) >= 4:
            center = concepts[0]
            branches = concepts[1:7]
            lines = [f"mindmap\n  root(({center}))"]
            for b in branches:
                lines.append(f"    {b}")
            return {
                "viz_type": "diagram",
                "title": f"Concept map: {question[:60]}",
                "diagram": {
                    "diagram_type": "mindmap",
                    "mermaid_code": "\n".join(lines),
                },
            }

        # Detect labeled numbers / comparisons → bar chart (last resort)
        comparisons = self._extract_labeled_numbers(text)
        if len(comparisons) >= 2:
            return {
                "viz_type": "chart",
                "title": f"Key values: {question[:60]}",
                "chart": {
                    "chart_type": "bar",
                    "x_label": "",
                    "y_label": "Value",
                    "series": [{
                        "name": "Values",
                        "x": [c[0] for c in comparisons],
                        "y": [c[1] for c in comparisons],
                    }],
                },
            }

        return None

    # ------------------------------------------------------------------
    # LLM-based extraction
    # ------------------------------------------------------------------
    def _llm_extract(
        self, text: str, timeout: int
    ) -> Optional[Dict[str, Any]]:
        engine = self._get_engine()
        if not engine.is_model_ready():
            return None

        prompt = VIZ_AGENT_PROMPT + text[:1500]
        raw = engine.generate_with_timeout(prompt, timeout, num_predict=300)
        if not raw:
            return None

        from .engine import extract_json_block
        json_str = extract_json_block(raw)
        if not json_str:
            return None

        try:
            spec = json.loads(json_str)
            if spec.get("viz_type") in ("chart", "diagram", "geometric"):
                return spec
        except (json.JSONDecodeError, TypeError):
            pass
        return None

    # ------------------------------------------------------------------
    # Render a VizSpec into a VisualizationPayload
    # ------------------------------------------------------------------
    def _render_spec(self, spec: Dict[str, Any]) -> Optional[VisualizationPayload]:
        vtype = spec.get("viz_type")
        title = spec.get("title", "Visualization")

        if vtype == "chart":
            return self._render_chart(spec.get("chart", {}), title)
        if vtype == "diagram":
            return self._render_mermaid(spec.get("diagram", {}), title)
        if vtype == "geometric":
            return self._render_geometric(spec.get("geometric", {}), title)
        return None

    # ------------------------------------------------------------------
    # Chart → Plotly JSON (rendered in frontend by Plotly.js)
    # ------------------------------------------------------------------
    def _render_chart(
        self, chart: Dict[str, Any], title: str
    ) -> Optional[VisualizationPayload]:
        chart_type = chart.get("chart_type", "bar")
        series = chart.get("series", [])
        if not series:
            return None

        from uuid import uuid4
        traces = []
        for s in series:
            trace: Dict[str, Any] = {
                "x": s.get("x", []),
                "y": s.get("y", []),
                "name": s.get("name", ""),
            }
            if chart_type == "bar":
                trace["type"] = "bar"
            elif chart_type == "scatter":
                trace["type"] = "scatter"
                trace["mode"] = "markers"
            elif chart_type == "pie":
                trace["type"] = "pie"
                trace["labels"] = trace.pop("x")
                trace["values"] = trace.pop("y")
            elif chart_type == "polar":
                trace["type"] = "scatterpolar"
                trace["r"] = trace.pop("y")
                trace["theta"] = trace.pop("x")
            elif chart_type == "heatmap":
                trace["type"] = "heatmap"
                trace["z"] = s.get("z", [trace.pop("y")])
                trace.pop("x", None)
            else:
                trace["type"] = "scatter"
                trace["mode"] = "lines+markers"
            traces.append(trace)

        layout = {
            "title": title,
            "xaxis": {"title": chart.get("x_label", "")},
            "yaxis": {"title": chart.get("y_label", "")},
        }

        return VisualizationPayload(
            viz_id=f"vizagent-{uuid4().hex[:12]}",
            viz_type=VisualizationType.plotly,
            title=title,
            data={"data": traces, "layout": layout},
        )

    # ------------------------------------------------------------------
    # Diagram → Mermaid (rendered in frontend by mermaid.js)
    # ------------------------------------------------------------------
    def _render_mermaid(
        self, diagram: Dict[str, Any], title: str
    ) -> Optional[VisualizationPayload]:
        code = diagram.get("mermaid_code", "")
        if not code:
            return None
        from uuid import uuid4
        return VisualizationPayload(
            viz_id=f"mermaid-{uuid4().hex[:12]}",
            viz_type=VisualizationType("mermaid"),
            title=title,
            data={"mermaid_code": code, "diagram_type": diagram.get("diagram_type", "flowchart")},
        )

    # ------------------------------------------------------------------
    # Geometric → Plotly shapes (scatter + shapes overlay)
    # ------------------------------------------------------------------
    def _render_geometric(
        self, geo: Dict[str, Any], title: str
    ) -> Optional[VisualizationPayload]:
        shapes_data = geo.get("shapes", [])
        if not shapes_data:
            return None

        from uuid import uuid4
        traces = []
        plotly_shapes = []
        annotations = []

        for s in shapes_data:
            stype = s.get("type")
            label = s.get("label", "")

            if stype == "point":
                traces.append({
                    "type": "scatter",
                    "x": [s.get("x", 0)],
                    "y": [s.get("y", 0)],
                    "mode": "markers+text",
                    "text": [label],
                    "textposition": "top center",
                    "marker": {"size": 10, "color": s.get("color", "#2563eb")},
                    "showlegend": False,
                })
            elif stype == "line":
                traces.append({
                    "type": "scatter",
                    "x": [s.get("x1", 0), s.get("x2", 1)],
                    "y": [s.get("y1", 0), s.get("y2", 1)],
                    "mode": "lines+text",
                    "text": ["", label],
                    "textposition": "top center",
                    "line": {"color": s.get("color", "#111827"), "width": 2},
                    "showlegend": False,
                })
            elif stype == "circle":
                cx, cy, r = s.get("cx", 0), s.get("cy", 0), s.get("r", 1)
                pts = 100
                xs = [cx + r * math.cos(2 * math.pi * i / pts) for i in range(pts + 1)]
                ys = [cy + r * math.sin(2 * math.pi * i / pts) for i in range(pts + 1)]
                traces.append({
                    "type": "scatter",
                    "x": xs, "y": ys,
                    "mode": "lines",
                    "line": {"color": s.get("color", "#2563eb"), "width": 2},
                    "name": label,
                })
            elif stype == "polygon":
                points = s.get("points", [])
                if points:
                    xs = [p[0] for p in points] + [points[0][0]]
                    ys = [p[1] for p in points] + [points[0][1]]
                    traces.append({
                        "type": "scatter",
                        "x": xs, "y": ys,
                        "mode": "lines",
                        "fill": "toself",
                        "fillcolor": s.get("fillcolor", "rgba(37,99,235,0.1)"),
                        "line": {"color": s.get("color", "#111827"), "width": 2},
                        "name": label,
                    })

        xr = geo.get("x_range", [-2, 2])
        yr = geo.get("y_range", [-2, 2])

        layout = {
            "title": title,
            "xaxis": {"range": xr, "scaleanchor": "y", "scaleratio": 1},
            "yaxis": {"range": yr},
            "shapes": plotly_shapes,
            "annotations": annotations,
        }

        return VisualizationPayload(
            viz_id=f"geo-{uuid4().hex[:12]}",
            viz_type=VisualizationType.plotly,
            title=title,
            data={"data": traces, "layout": layout},
        )

    # ------------------------------------------------------------------
    # Text parsing helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _extract_labeled_numbers(text: str) -> List[tuple]:
        """Find patterns like 'name: 42' or 'name = 3.14' in text."""
        _SKIP_LABELS = {
            "step", "start", "construct", "inside", "arrange", "expand",
            "therefore", "total", "the", "a", "an", "is", "with", "from",
            "about", "using", "have", "has", "sides", "copies",
        }
        pattern = r"(?:\*\*)?([A-Za-z][A-Za-z\s]{2,25})(?:\*\*)?[\s]*[:=≈][\s]*(-?[\d,]+\.?\d*)"
        matches = re.findall(pattern, text)
        results = []
        seen = set()
        for label, value in matches:
            label = label.strip().rstrip(":")
            first_word = label.split()[0].lower() if label.split() else ""
            if first_word in _SKIP_LABELS:
                continue
            if label.lower() in seen:
                continue
            seen.add(label.lower())
            try:
                val = float(value.replace(",", ""))
                if len(label) < 3:
                    continue
                results.append((label, val))
            except ValueError:
                continue
        return results[:10]

    @staticmethod
    def _extract_steps(text: str) -> List[str]:
        """Extract numbered/bulleted steps from text."""
        step_pattern = r"(?:^|\n)\s*(?:\d+[\.\)]\s*|[-•]\s*\*\*Step\s*\d+)"
        if not re.search(step_pattern, text):
            return []
        lines = text.split("\n")
        steps = []
        for line in lines:
            stripped = line.strip()
            if re.match(r"\d+[\.\)]\s+", stripped):
                steps.append(re.sub(r"^\d+[\.\)]\s+", "", stripped))
            elif stripped.startswith(("- **Step", "• **Step")):
                steps.append(re.sub(r"^[-•]\s*\*\*Step\s*\d+\*\*[:\s]*", "", stripped))
        return steps

    @staticmethod
    def _extract_bold_terms(text: str) -> List[str]:
        """Extract **bold** terms as concept nodes."""
        matches = re.findall(r"\*\*([^*]{2,40})\*\*", text)
        seen = set()
        unique = []
        for m in matches:
            key = m.lower().strip()
            if key not in seen and not key.startswith(("step", "example", "try", "note")):
                seen.add(key)
                unique.append(m.strip())
        return unique
