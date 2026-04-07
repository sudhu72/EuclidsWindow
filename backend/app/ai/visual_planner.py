"""Deterministic visualization planning for common math questions."""
import re
from typing import Optional

from ..models import VisualizationType
from .models import VisualizationPlan

_ORDINAL_MAP = {
    "square": 2, "cube": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8,
}


def _extract_n_from_query(q: str) -> int:
    """Extract the integer n from queries like '3 roots of unity' or 'cube roots'."""
    m = re.search(r"(\d+)\s*(?:th|rd|nd|st)?\s*roots?\s*of\s*unity", q)
    if m:
        return max(2, min(int(m.group(1)), 36))
    for word, val in _ORDINAL_MAP.items():
        if word in q:
            return val
    return 0


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
        "roots of unity",
        "root of unity",
        "euler",
        "e^i",
        "golden ratio",
        "fibonacci",
        "pythagorean",
        "prime",
        "integral",
        "integration",
        "area under",
        "limit",
        "taylor series",
        "taylor expansion",
        "maclaurin",
        "power series",
        "polar",
        "cardioid",
        "fourier",
        "fft",
        "dft",
        "frequency",
        "differentiat",
    )

    def plan(self, question: str) -> Optional[VisualizationPlan]:
        q = (question or "").lower()
        if any(tok in q for tok in ("euler's identity", "euler identity", "eulers identity", "e^i pi", "e^ipi")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Euler's Identity on the unit circle",
                parameters={},
                code=self._euler_identity_plotly_code(),
            )
        if any(tok in q for tok in ("golden ratio", "fibonacci", "phi")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Golden Ratio spiral and Fibonacci sequence",
                parameters={},
                code=self._golden_ratio_plotly_code(),
            )
        if any(tok in q for tok in ("pythagorean theorem", "pythagorean")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Pythagorean theorem: a² + b² = c²",
                parameters={},
                code=self._pythagorean_plotly_code(),
            )
        if any(tok in q for tok in ("prime number", "prime numbers", "primes", "sieve")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Prime numbers up to 100",
                parameters={},
                code=self._primes_plotly_code(),
            )
        if "roots of unity" in q or "root of unity" in q:
            n = _extract_n_from_query(q) or 6
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal=f"{n} roots of unity on the unit circle",
                parameters={"n": n},
                code=self._roots_of_unity_plotly_code(n),
            )
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
        if any(token in q for token in ("derivative", "tangent", "differentiat")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Function with tangent line at a point",
                parameters={"function": "x**2", "x0": 1.0},
                code=self._derivative_plotly_code(),
            )
        if any(tok in q for tok in ("integral", "integration", "area under")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Area under a curve (integral of x²)",
                parameters={},
                code=self._integral_plotly_code(),
            )
        if any(tok in q for tok in ("limit", "lim ")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Limit: function approaching a value",
                parameters={},
                code=self._limit_plotly_code(),
            )
        if any(tok in q for tok in ("taylor series", "taylor expansion", "maclaurin", "power series")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Taylor series approximations of sin(x)",
                parameters={},
                code=self._taylor_series_plotly_code(),
            )
        if any(tok in q for tok in ("polar", "cardioid", "polar coordinate")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Polar coordinate rose curve",
                parameters={},
                code=self._polar_plotly_code(),
            )
        if any(tok in q for tok in ("fourier", "fft", "dft", "frequency")):
            return VisualizationPlan(
                type=VisualizationType.plotly,
                goal="Fourier transform: time domain vs frequency domain",
                parameters={},
                code=self._fourier_plotly_code(),
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
    def _roots_of_unity_plotly_code(n: int) -> str:
        return f"""
import math

n = {n}
angles = [2 * math.pi * k / n for k in range(n)]
xs = [math.cos(a) for a in angles]
ys = [math.sin(a) for a in angles]

labels = []
for k in range(n):
    re_part = round(xs[k], 4)
    im_part = round(ys[k], 4)
    if abs(im_part) < 1e-9:
        labels.append(f"z{{k}}={{re_part}}")
    elif abs(re_part) < 1e-9:
        labels.append(f"z{{k}}={{im_part}}i")
    elif im_part > 0:
        labels.append(f"z{{k}}={{re_part}}+{{im_part}}i")
    else:
        labels.append(f"z{{k}}={{re_part}}{{im_part}}i")

# Unit circle
ct = [math.cos(2 * math.pi * i / 200) for i in range(201)]
st = [math.sin(2 * math.pi * i / 200) for i in range(201)]

fig = go.Figure()
fig.add_trace(go.Scatter(x=ct, y=st, mode="lines",
    line=dict(color="#d4d4d4", width=1, dash="dot"), showlegend=False))

# Polygon connecting the roots
poly_x = xs + [xs[0]]
poly_y = ys + [ys[0]]
fig.add_trace(go.Scatter(x=poly_x, y=poly_y, mode="lines",
    line=dict(color="#2563eb", width=2), name="polygon"))

# Root points
fig.add_trace(go.Scatter(x=xs, y=ys, mode="markers+text",
    text=labels, textposition="top center",
    marker=dict(size=10, color="#111827"), name="roots"))

fig.add_hline(y=0, line_dash="dash", line_color="#a3a3a3", line_width=0.5)
fig.add_vline(x=0, line_dash="dash", line_color="#a3a3a3", line_width=0.5)
fig.update_layout(
    title="{n} Roots of Unity on the Unit Circle",
    xaxis=dict(title="Real", scaleanchor="y", scaleratio=1, range=[-1.5, 1.5]),
    yaxis=dict(title="Imaginary", range=[-1.5, 1.5]),
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

    @staticmethod
    def _euler_identity_plotly_code() -> str:
        return """
import math

ct = [math.cos(2 * math.pi * i / 200) for i in range(201)]
st = [math.sin(2 * math.pi * i / 200) for i in range(201)]

fig = go.Figure()

fig.add_trace(go.Scatter(x=ct, y=st, mode="lines",
    line=dict(color="#d4d4d4", width=1, dash="dot"), showlegend=False))

fig.add_hline(y=0, line_dash="dash", line_color="#a3a3a3", line_width=0.5)
fig.add_vline(x=0, line_dash="dash", line_color="#a3a3a3", line_width=0.5)

theta = [math.pi * i / 60 for i in range(61)]
arc_x = [math.cos(t) for t in theta]
arc_y = [math.sin(t) for t in theta]
fig.add_trace(go.Scatter(x=arc_x, y=arc_y, mode="lines",
    line=dict(color="#2563eb", width=3), name="e^(it), t: 0 to pi"))

fig.add_trace(go.Scatter(
    x=[1, -1, 0], y=[0, 0, 0],
    mode="markers+text",
    text=["1 (start)", "e^(i*pi) = -1", "0"],
    textposition=["bottom right", "bottom left", "top center"],
    marker=dict(size=[12, 14, 8], color=["#22c55e", "#ef4444", "#6b7280"]),
    name="key points"
))

fig.add_annotation(x=-0.5, y=0.65, text="e^(i*pi) + 1 = 0",
    font=dict(size=18, color="#2563eb"), showarrow=False,
    bgcolor="rgba(255,255,255,0.8)", borderpad=6)

fig.add_trace(go.Scatter(x=[-1, -1], y=[0, 0], mode="markers",
    marker=dict(size=16, color="#ef4444", symbol="star"),
    name="e^(i*pi) = -1", showlegend=True))

fig.update_layout(
    title="Euler's Identity: e^(i*pi) + 1 = 0",
    xaxis=dict(title="Real", scaleanchor="y", scaleratio=1, range=[-1.6, 1.6]),
    yaxis=dict(title="Imaginary", range=[-1.4, 1.4]),
)
"""

    @staticmethod
    def _golden_ratio_plotly_code() -> str:
        return """
import math

fib = [1, 1]
for _ in range(12):
    fib.append(fib[-1] + fib[-2])

ratios = [fib[i+1] / fib[i] for i in range(len(fib) - 1)]
phi = (1 + math.sqrt(5)) / 2

fig = go.Figure()

fig.add_trace(go.Scatter(
    x=list(range(1, len(ratios) + 1)), y=ratios,
    mode="lines+markers", name="F(n+1)/F(n)",
    marker=dict(size=8, color="#2563eb"),
    line=dict(width=2, color="#2563eb"),
))

fig.add_hline(y=phi, line_dash="dash", line_color="#ef4444", line_width=2,
    annotation_text=f"phi = {phi:.6f}", annotation_position="top right")

fig.add_trace(go.Bar(
    x=[f"F({i+1})" for i in range(10)], y=fib[:10],
    name="Fibonacci numbers", marker_color="#22c55e", opacity=0.5,
    xaxis="x2", yaxis="y2",
))

fig.update_layout(
    title="Golden Ratio: Fibonacci ratios converge to phi",
    xaxis=dict(title="n (term index)"),
    yaxis=dict(title="Ratio F(n+1)/F(n)"),
)
"""

    @staticmethod
    def _pythagorean_plotly_code() -> str:
        return """
fig = go.Figure()

tri_x = [0, 3, 3, 0]
tri_y = [0, 0, 4, 0]
fig.add_trace(go.Scatter(x=tri_x, y=tri_y, mode="lines",
    line=dict(color="#111827", width=3), fill="toself",
    fillcolor="rgba(37,99,235,0.1)", name="3-4-5 triangle"))

sq_a = dict(x=[0, 3, 3, 0, 0], y=[-3, -3, 0, 0, -3])
fig.add_trace(go.Scatter(**sq_a, mode="lines", fill="toself",
    fillcolor="rgba(239,68,68,0.15)", line=dict(color="#ef4444", width=2),
    name="a^2 = 9"))

sq_b = dict(x=[3, 7, 7, 3, 3], y=[0, 0, 4, 4, 0])
fig.add_trace(go.Scatter(**sq_b, mode="lines", fill="toself",
    fillcolor="rgba(34,197,94,0.15)", line=dict(color="#22c55e", width=2),
    name="b^2 = 16"))

sq_c = dict(x=[-4, 0, 3.2, -0.8, -4], y=[5, 0, 3.4, 8.4, 5])
fig.add_trace(go.Scatter(**sq_c, mode="lines", fill="toself",
    fillcolor="rgba(168,85,247,0.15)", line=dict(color="#a855f7", width=2),
    name="c^2 = 25"))

fig.add_annotation(x=1.5, y=-1.5, text="a=3<br>area=9", showarrow=False,
    font=dict(color="#ef4444", size=13))
fig.add_annotation(x=5, y=2, text="b=4<br>area=16", showarrow=False,
    font=dict(color="#22c55e", size=13))
fig.add_annotation(x=-1, y=5, text="c=5<br>area=25", showarrow=False,
    font=dict(color="#a855f7", size=13))
fig.add_annotation(x=1.5, y=5.5, text="9 + 16 = 25  -->  a^2 + b^2 = c^2",
    font=dict(size=16, color="#2563eb"), showarrow=False,
    bgcolor="rgba(255,255,255,0.85)", borderpad=6)

fig.update_layout(
    title="Pythagorean Theorem: a^2 + b^2 = c^2 (3-4-5 triangle)",
    xaxis=dict(scaleanchor="y", scaleratio=1, visible=False),
    yaxis=dict(visible=False),
)
"""

    @staticmethod
    def _primes_plotly_code() -> str:
        return """
import math

def sieve(n):
    is_p = [True] * (n + 1)
    is_p[0] = is_p[1] = False
    for i in range(2, int(math.sqrt(n)) + 1):
        if is_p[i]:
            for j in range(i*i, n+1, i):
                is_p[j] = False
    return is_p

N = 100
is_prime = sieve(N)
xs = [i % 10 for i in range(1, N + 1)]
ys = [i // 10 for i in range(1, N + 1)]
colors = ["#2563eb" if is_prime[i] else "#e5e7eb" for i in range(1, N + 1)]
texts = [str(i) for i in range(1, N + 1)]

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=xs, y=ys, mode="markers+text", text=texts,
    textposition="middle center", textfont=dict(size=9),
    marker=dict(size=28, color=colors, line=dict(width=1, color="#94a3b8")),
    showlegend=False,
))

count = sum(1 for i in range(2, N+1) if is_prime[i])
fig.update_layout(
    title=f"Prime Numbers 1-{N} (blue = prime, {count} primes found)",
    xaxis=dict(visible=False), yaxis=dict(visible=False, autorange="reversed"),
)
"""

    @staticmethod
    def _integral_plotly_code() -> str:
        return """
import math

xs = [i / 20 for i in range(-20, 61)]
ys = [(x / 3) ** 2 for x in xs]

xs_fill = [i / 20 for i in range(0, 41)]
ys_fill = [(x / 3) ** 2 for x in xs_fill]

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=xs_fill + xs_fill[::-1], y=ys_fill + [0] * len(xs_fill),
    fill="toself", fillcolor="rgba(37,99,235,0.25)", line=dict(width=0),
    name="Area (integral)", showlegend=True,
))
fig.add_trace(go.Scatter(x=xs, y=ys, mode="lines",
    line=dict(color="#111827", width=3), name="f(x) = x^2/9"))
fig.add_vline(x=0, line_dash="dash", line_color="#22c55e", line_width=2,
    annotation_text="a = 0")
fig.add_vline(x=2, line_dash="dash", line_color="#ef4444", line_width=2,
    annotation_text="b = 2")

area = (2 ** 3) / (3 * 9)
fig.add_annotation(x=1, y=0.06, text=f"integral from 0 to 2 of x^2/9 dx = {area:.4f}",
    font=dict(size=14, color="#2563eb"), showarrow=False,
    bgcolor="rgba(255,255,255,0.85)", borderpad=6)

fig.update_layout(
    title="Definite Integral: Area under f(x) = x^2/9 from 0 to 2",
    xaxis=dict(title="x"), yaxis=dict(title="f(x)"),
)
"""

    @staticmethod
    def _limit_plotly_code() -> str:
        return """
import math

xs_left = [i / 100 for i in range(-300, 0)]
xs_right = [i / 100 for i in range(1, 301)]

def f(x):
    return math.sin(x) / x if abs(x) > 1e-10 else 1.0

ys_left = [f(x) for x in xs_left]
ys_right = [f(x) for x in xs_right]

fig = go.Figure()
fig.add_trace(go.Scatter(x=xs_left, y=ys_left, mode="lines",
    line=dict(color="#2563eb", width=2), name="sin(x)/x (left)"))
fig.add_trace(go.Scatter(x=xs_right, y=ys_right, mode="lines",
    line=dict(color="#2563eb", width=2), name="sin(x)/x (right)", showlegend=False))
fig.add_trace(go.Scatter(x=[0], y=[1], mode="markers",
    marker=dict(size=12, color="white", line=dict(color="#ef4444", width=2)),
    name="limit = 1 (hole)"))
fig.add_hline(y=1, line_dash="dot", line_color="#22c55e", line_width=1,
    annotation_text="y = 1 (limit)")

fig.update_layout(
    title="Limit: lim (x->0) sin(x)/x = 1",
    xaxis=dict(title="x"), yaxis=dict(title="f(x)"),
)
"""

    @staticmethod
    def _taylor_series_plotly_code() -> str:
        return """
import math

xs = [i / 20 for i in range(-200, 201)]
sin_y = [math.sin(x) for x in xs]

def taylor_sin(x, terms):
    s = 0
    for n in range(terms):
        s += ((-1) ** n) * (x ** (2 * n + 1)) / math.factorial(2 * n + 1)
    return s

fig = go.Figure()
fig.add_trace(go.Scatter(x=xs, y=sin_y, mode="lines",
    line=dict(color="#111827", width=3), name="sin(x) (exact)"))

colors = ["#ef4444", "#f59e0b", "#22c55e", "#2563eb", "#a855f7"]
for i, n in enumerate([1, 2, 3, 5, 7]):
    ty = [max(-2, min(2, taylor_sin(x, n))) for x in xs]
    fig.add_trace(go.Scatter(x=xs, y=ty, mode="lines",
        line=dict(color=colors[i % len(colors)], width=1.5, dash="dot"),
        name=f"T_{2*n-1}(x) ({n} terms)"))

fig.update_layout(
    title="Taylor Series: Successive approximations of sin(x)",
    xaxis=dict(title="x", range=[-8, 8]),
    yaxis=dict(title="y", range=[-2, 2]),
)
"""

    @staticmethod
    def _polar_plotly_code() -> str:
        return """
import math

n_petals = 4
theta = [i * math.pi / 180 for i in range(361)]
r = [abs(math.cos(n_petals * t / 2)) for t in theta]

xs = [ri * math.cos(t) for ri, t in zip(r, theta)]
ys = [ri * math.sin(t) for ri, t in zip(r, theta)]

fig = go.Figure()

circle_x = [math.cos(t) for t in theta]
circle_y = [math.sin(t) for t in theta]
fig.add_trace(go.Scatter(x=circle_x, y=circle_y, mode="lines",
    line=dict(color="#d4d4d4", width=1, dash="dot"), showlegend=False))
fig.add_hline(y=0, line_color="#e5e7eb", line_width=0.5)
fig.add_vline(x=0, line_color="#e5e7eb", line_width=0.5)

fig.add_trace(go.Scatter(x=xs, y=ys, mode="lines",
    line=dict(color="#2563eb", width=2.5),
    name=f"r = |cos({n_petals}*theta/2)| ({n_petals} petals)"))

fig.update_layout(
    title=f"Polar Coordinates: Rose Curve with {n_petals} petals",
    xaxis=dict(title="x", scaleanchor="y", scaleratio=1),
    yaxis=dict(title="y"),
)
"""

    @staticmethod
    def _fourier_plotly_code() -> str:
        return """
import math

N = 200
dt = 1.0 / N
ts = [i * dt for i in range(N)]

f1, f2, f3 = 3, 7, 12
signal = [1.0 * math.sin(2 * math.pi * f1 * t) +
          0.5 * math.sin(2 * math.pi * f2 * t) +
          0.3 * math.sin(2 * math.pi * f3 * t) for t in ts]

magnitudes = []
freqs = list(range(N // 2))
for k in freqs:
    re_sum = sum(signal[n] * math.cos(2 * math.pi * k * n / N) for n in range(N))
    im_sum = sum(signal[n] * math.sin(2 * math.pi * k * n / N) for n in range(N))
    magnitudes.append(2 * math.sqrt(re_sum ** 2 + im_sum ** 2) / N)

fig = go.Figure()
fig.add_trace(go.Scatter(x=ts, y=signal, mode="lines",
    line=dict(color="#2563eb", width=1.5),
    name="Signal (time domain)", xaxis="x", yaxis="y"))
fig.add_trace(go.Bar(x=freqs[:30], y=magnitudes[:30],
    marker_color="#ef4444", name="Magnitude (freq domain)",
    xaxis="x2", yaxis="y2"))

fig.update_layout(
    title="Fourier Transform: 3 Hz + 7 Hz + 12 Hz signal",
    xaxis=dict(domain=[0, 0.45], title="Time (s)"),
    yaxis=dict(title="Amplitude"),
    xaxis2=dict(domain=[0.55, 1], title="Frequency (Hz)"),
    yaxis2=dict(anchor="x2", title="Magnitude"),
)
"""
