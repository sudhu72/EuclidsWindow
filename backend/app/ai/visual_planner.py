"""Deterministic visualization planning for common math questions."""
from typing import Optional

from ..models import VisualizationType
from .models import VisualizationPlan


class VisualizationPlanner:
    """Builds visualization plans when LLM visualization is missing/unreliable."""

    VISUAL_TOPIC_TOKENS = (
        "eigenvalue",
        "eigenvector",
        "parabola",
        "quadratic",
        "sine",
        "cosine",
        "trig",
        "derivative",
        "tangent",
        "fraction",
        "fractions",
        "system of equations",
        "systems of equations",
        "imaginary number",
        "imaginary numbers",
        "complex number",
        "complex numbers",
        "complex plane",
        "hamiltonian graph",
        "hamiltonian cycle",
        "graph theory",
    )

    def plan(self, question: str) -> Optional[VisualizationPlan]:
        q = (question or "").lower()
        if any(token in q for token in ("hamiltonian graph", "hamiltonian cycle")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Hamiltonian cycle on a sample graph",
                parameters={"nodes": 6, "cycle": [0, 1, 2, 3, 4, 5, 0]},
                code=self._hamiltonian_graph_plotly_code(),
            )
        if any(token in q for token in ("fraction", "fractions")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Fraction as parts of a whole",
                parameters={"fraction": [3, 4]},
                code=self._fractions_plotly_code(),
            )
        if any(token in q for token in ("system of equations", "systems of equations", "simultaneous equations")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Intersection point for a system of linear equations",
                parameters={"equations": ["y=2x+1", "y=-x+4"]},
                code=self._systems_plotly_code(),
            )
        if any(token in q for token in ("imaginary number", "imaginary numbers", "complex number", "complex numbers", "complex plane")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Complex plane: real and imaginary axes",
                parameters={"points": [[3, 2], [1, -1], [-2, 1]]},
                code=self._complex_plane_plotly_code(),
            )
        if any(token in q for token in ("eigenvalue", "eigenvalues", "eigenvector", "eigenvectors")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Eigenvectors under a linear transformation",
                parameters={"matrix": [[2, 0], [0, 1]], "vectors": [[1, 0], [1, 1]]},
                code=self._eigenvalues_plotly_code(),
            )
        if any(token in q for token in ("parabola", "quadratic")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Quadratic curve visualization",
                parameters={"a": 1, "b": 0, "c": -2},
                code=self._parabola_plotly_code(),
            )
        if any(token in q for token in ("sine", "cosine", "trig", "sin(", "cos(")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Sine and cosine wave intuition",
                parameters={"domain": [0, 6.28]},
                code=self._trig_plotly_code(),
            )
        if any(token in q for token in ("derivative", "tangent")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Function with tangent line at a point",
                parameters={"function": "x**2", "x0": 1.0},
                code=self._derivative_plotly_code(),
            )
        return None

    def is_visual_topic(self, question: str) -> bool:
        q = (question or "").lower()
        return any(token in q for token in self.VISUAL_TOPIC_TOKENS)

    @staticmethod
    def _eigenvalues_plotly_code() -> str:
        return """
A = [[2, 0], [0, 1]]
v1 = [1, 0]
v2 = [1, 1]

def matvec(mat, vec):
    return [
        mat[0][0] * vec[0] + mat[0][1] * vec[1],
        mat[1][0] * vec[0] + mat[1][1] * vec[1],
    ]

w1 = matvec(A, v1)
w2 = matvec(A, v2)

fig = go.Figure()
fig.add_trace(go.Scatter(x=[0, v1[0]], y=[0, v1[1]], mode="lines+markers", name="eigenvector v"))
fig.add_trace(go.Scatter(x=[0, w1[0]], y=[0, w1[1]], mode="lines+markers", name="A v (same direction)"))
fig.add_trace(go.Scatter(x=[0, v2[0]], y=[0, v2[1]], mode="lines+markers", name="vector u"))
fig.add_trace(go.Scatter(x=[0, w2[0]], y=[0, w2[1]], mode="lines+markers", name="A u (direction changes)"))
fig.update_layout(
    title="Eigenvectors keep direction under A",
    xaxis=dict(scaleanchor="y", scaleratio=1, zeroline=True),
    yaxis=dict(zeroline=True),
    legend=dict(orientation="h"),
)
"""

    @staticmethod
    def _parabola_plotly_code() -> str:
        return """
x = [i / 10 for i in range(-40, 41)]
y = [v * v - 2 for v in x]
fig = go.Figure()
fig.add_trace(go.Scatter(x=x, y=y, mode="lines", name="y = x^2 - 2"))
fig.update_layout(title="Parabola", xaxis_title="x", yaxis_title="y")
"""

    @staticmethod
    def _trig_plotly_code() -> str:
        return """
import math
x = [i / 50 for i in range(0, 315)]
y1 = [math.sin(v) for v in x]
y2 = [math.cos(v) for v in x]
fig = go.Figure()
fig.add_trace(go.Scatter(x=x, y=y1, mode="lines", name="sin(x)"))
fig.add_trace(go.Scatter(x=x, y=y2, mode="lines", name="cos(x)"))
fig.update_layout(title="Sine and Cosine Waves", xaxis_title="x (radians)", yaxis_title="value")
"""

    @staticmethod
    def _derivative_plotly_code() -> str:
        return """
x = [i / 20 for i in range(-40, 41)]
y = [v * v for v in x]
x0 = 1.0
m = 2 * x0
y0 = x0 * x0
yt = [m * (v - x0) + y0 for v in x]
fig = go.Figure()
fig.add_trace(go.Scatter(x=x, y=y, mode="lines", name="f(x)=x^2"))
fig.add_trace(go.Scatter(x=x, y=yt, mode="lines", name="tangent at x=1"))
fig.update_layout(title="Derivative as tangent slope", xaxis_title="x", yaxis_title="y")
"""

    @staticmethod
    def _fractions_plotly_code() -> str:
        return """
labels = ["Shaded (3/4)", "Unshaded (1/4)"]
values = [3, 1]
fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=0.35)])
fig.update_layout(title="Fraction model: 3/4 as parts of a whole")
"""

    @staticmethod
    def _systems_plotly_code() -> str:
        return """
x = [i / 5 for i in range(-20, 26)]
y1 = [2 * v + 1 for v in x]
y2 = [-v + 4 for v in x]

# Solve 2x + 1 = -x + 4 => x = 1, y = 3
xi, yi = 1, 3

fig = go.Figure()
fig.add_trace(go.Scatter(x=x, y=y1, mode="lines", name="y = 2x + 1"))
fig.add_trace(go.Scatter(x=x, y=y2, mode="lines", name="y = -x + 4"))
fig.add_trace(go.Scatter(x=[xi], y=[yi], mode="markers+text", text=["Intersection (1,3)"], textposition="top center", name="solution"))
fig.update_layout(title="System of equations as line intersection", xaxis_title="x", yaxis_title="y")
"""

    @staticmethod
    def _complex_plane_plotly_code() -> str:
        return """
points = [(3, 2, "3 + 2i"), (1, -1, "1 - i"), (-2, 1, "-2 + i")]
fig = go.Figure()
fig.add_trace(
    go.Scatter(
        x=[p[0] for p in points],
        y=[p[1] for p in points],
        mode="markers+text",
        text=[p[2] for p in points],
        textposition="top center",
        marker=dict(size=11),
        name="Complex numbers",
    )
)
fig.add_hline(y=0, line_dash="dash", line_color="#6b7280")
fig.add_vline(x=0, line_dash="dash", line_color="#6b7280")
fig.update_layout(
    title="Complex Plane (Argand Diagram)",
    xaxis_title="Real part",
    yaxis_title="Imaginary part",
    xaxis=dict(scaleanchor="y", scaleratio=1),
)
"""

    @staticmethod
    def _hamiltonian_graph_plotly_code() -> str:
        return """
import math

n = 6
angles = [2 * math.pi * i / n for i in range(n)]
nodes = [(math.cos(a), math.sin(a)) for a in angles]

# Graph edges: cycle edges + a few chords
edges = [
    (0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0),
    (0, 3), (1, 4), (2, 5),
]
ham_cycle = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0)]

fig = go.Figure()

# Non-cycle edges in gray
for u, v in edges:
    if (u, v) in ham_cycle or (v, u) in ham_cycle:
        continue
    x0, y0 = nodes[u]
    x1, y1 = nodes[v]
    fig.add_trace(go.Scatter(
        x=[x0, x1], y=[y0, y1], mode="lines",
        line=dict(color="#9ca3af", width=2),
        hoverinfo="skip", showlegend=False
    ))

# Hamiltonian cycle highlighted
for u, v in ham_cycle:
    x0, y0 = nodes[u]
    x1, y1 = nodes[v]
    fig.add_trace(go.Scatter(
        x=[x0, x1], y=[y0, y1], mode="lines",
        line=dict(color="#2563eb", width=5),
        hoverinfo="skip", showlegend=False
    ))

fig.add_trace(go.Scatter(
    x=[p[0] for p in nodes],
    y=[p[1] for p in nodes],
    mode="markers+text",
    text=[f"v{i}" for i in range(n)],
    textposition="top center",
    marker=dict(size=14, color="#111827"),
    name="Vertices"
))

fig.update_layout(
    title="Hamiltonian Graph: highlighted cycle visits each vertex exactly once",
    xaxis=dict(visible=False, scaleanchor="y", scaleratio=1),
    yaxis=dict(visible=False),
)
"""
