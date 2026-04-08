"""Reusable Manim scene templates for common mathematics animations.

Inspired by the Hermes Agent manim-video skill creative standards:
- 3Blue1Brown-style dark backgrounds, opacity layering, geometry-first
- Each template is a Python string with {placeholders} for heuristic fill
"""

# ---------------------------------------------------------------------------
# Shared preamble injected into every generated scene
# ---------------------------------------------------------------------------
SCENE_PREAMBLE = '''from manim import *
import numpy as np

BG = "#1C1C1C"
PRIMARY = "#58C4DD"
SECONDARY = "#83C167"
ACCENT = "#FFFF00"
HIGHLIGHT = "#FF6B6B"
DIM = "#888888"
MONO = "DejaVu Sans Mono"
'''

# ---------------------------------------------------------------------------
# Template: equation derivation (step-by-step transform)
# ---------------------------------------------------------------------------
EQUATION_DERIVATION = SCENE_PREAMBLE + '''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text({title!r}, font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        steps = {steps!r}
        prev = None
        for i, step_tex in enumerate(steps):
            eq = MathTex(step_tex, font_size=36)
            eq.move_to(ORIGIN)
            if prev is None:
                self.play(Write(eq), run_time=1.5)
            else:
                self.play(prev.animate.set_opacity(0.3).shift(UP * 1.2), run_time=0.5)
                self.play(TransformMatchingTex(prev.copy(), eq), run_time=1.5)
            self.wait(1.5)
            prev = eq

        self.wait(1.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: function plot with tangent / annotation
# ---------------------------------------------------------------------------
FUNCTION_PLOT = SCENE_PREAMBLE + '''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text({title!r}, font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range={x_range!r}, y_range={y_range!r},
            x_length=8, y_length=4.5,
            axis_config={{"include_tip": True, "color": DIM}},
        ).shift(DOWN * 0.3)
        x_label = Text({x_label!r}, font_size=20, color=DIM, font=MONO).next_to(axes.x_axis, RIGHT)
        y_label = Text({y_label!r}, font_size=20, color=DIM, font=MONO).next_to(axes.y_axis, UP)
        self.play(Create(axes), Write(x_label), Write(y_label), run_time=1.0)

        func = axes.plot(lambda x: {func_expr}, color=PRIMARY, x_range={plot_range!r})
        func_label = Text({func_label!r}, font_size=24, color=PRIMARY, font=MONO)
        func_label.to_corner(UR).shift(DOWN * 0.5)
        self.play(Create(func), Write(func_label), run_time=1.5)
        self.wait(1.0)

        {extra_code}

        self.wait(1.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: geometric construction (circles, triangles, transforms)
# ---------------------------------------------------------------------------
GEOMETRIC = SCENE_PREAMBLE + '''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text({title!r}, font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.8)

        {body_code}

        self.wait(1.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: concept explainer (text + visuals interleaved)
# ---------------------------------------------------------------------------
CONCEPT_EXPLAINER = SCENE_PREAMBLE + '''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text({title!r}, font_size=48, color=PRIMARY, weight=BOLD, font=MONO)
        self.play(Write(title), run_time=1.5)
        self.wait(1.0)
        self.play(title.animate.scale(0.6).to_edge(UP, buff=0.4), run_time=0.8)

        {body_code}

        self.wait(1.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: matrix / linear-algebra transformation
# ---------------------------------------------------------------------------
LINEAR_TRANSFORM = SCENE_PREAMBLE + '''
class GeneratedScene(LinearTransformationScene):
    def __init__(self, **kwargs):
        super().__init__(
            show_coordinates=True,
            leave_ghost_vectors=True,
            background_plane_kwargs={{"stroke_opacity": 0.15}},
            **kwargs,
        )

    def construct(self):
        self.camera.background_color = BG
        
        # Title at top - fixed position, always on top
        title = Text({title!r}, font_size=36, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.3)
        title.fix_in_frame()
        self.add_foreground_mobject(title)
        self.play(Write(title), run_time=1.0)
        self.wait(0.5)

        # Matrix label at corner - fixed position
        matrix = {matrix!r}
        label = MathTex({matrix_tex!r}, font_size=32, color=ACCENT)
        label.to_corner(UR).shift(DOWN * 1.2 + LEFT * 0.2)
        label.fix_in_frame()
        self.add_foreground_mobject(label)
        self.play(Write(label), run_time=1.0)
        self.wait(0.5)

        # Apply the transformation
        self.apply_matrix(matrix, run_time=2.5)
        self.wait(2.0)
'''

# ---------------------------------------------------------------------------
# Template: Taylor series / approximation
# ---------------------------------------------------------------------------
TAYLOR_SERIES = SCENE_PREAMBLE + '''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text({title!r}, font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range={x_range!r}, y_range={y_range!r},
            x_length=9, y_length=5,
            axis_config={{"include_tip": True, "color": DIM}},
        ).shift(DOWN * 0.3)
        self.play(Create(axes), run_time=0.8)

        target = axes.plot(lambda x: {target_func}, color=PRIMARY, x_range={plot_range!r})
        target_label = Text({target_label!r}, font_size=22, color=PRIMARY, font=MONO)
        target_label.to_corner(UR).shift(DOWN * 0.4)
        self.play(Create(target), Write(target_label), run_time=1.2)
        self.wait(0.8)

        approx_colors = [SECONDARY, ACCENT, HIGHLIGHT, "#FF69B4", "#00CED1"]
        terms = {terms!r}
        prev_curve = None
        for i, (n, expr_str, tex_str) in enumerate(terms):
            color = approx_colors[i % len(approx_colors)]
            curve = axes.plot(lambda x, e=expr_str: eval(e), color=color, x_range={plot_range!r})
            lbl = MathTex(tex_str, font_size=22, color=color)
            lbl.next_to(target_label, DOWN, buff=0.3 + i * 0.35, aligned_edge=RIGHT)
            if prev_curve:
                self.play(
                    prev_curve.animate.set_opacity(0.25),
                    Create(curve), Write(lbl), run_time=1.2,
                )
            else:
                self.play(Create(curve), Write(lbl), run_time=1.2)
            self.wait(1.0)
            prev_curve = curve

        self.wait(2.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: Euler's identity / unit circle (no placeholders — self-contained)
# ---------------------------------------------------------------------------
EULER_CIRCLE = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Euler's Identity on the Unit Circle", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        plane = ComplexPlane(
            x_range=[-2, 2, 1], y_range=[-2, 2, 1],
            x_length=6, y_length=6,
            background_line_style={"stroke_opacity": 0.15},
        )
        plane.add_coordinates(font_size=16)
        self.play(Create(plane), run_time=1.0)

        circle = Circle(radius=plane.get_x_unit_size(), color=DIM, stroke_opacity=0.4)
        circle.move_to(plane.c2p(0, 0))
        self.play(Create(circle), run_time=0.8)

        tracker = ValueTracker(0)
        dot = always_redraw(lambda: Dot(
            plane.c2p(np.cos(tracker.get_value()), np.sin(tracker.get_value())),
            color=ACCENT, radius=0.08,
        ))
        line = always_redraw(lambda: Line(
            plane.c2p(0, 0),
            plane.c2p(np.cos(tracker.get_value()), np.sin(tracker.get_value())),
            color=PRIMARY, stroke_width=2,
        ))
        angle_label = always_redraw(lambda: MathTex(
            r"\theta = " + f"{tracker.get_value():.2f}",
            font_size=22, color=ACCENT,
        ).next_to(dot, UR, buff=0.15))

        self.add(line, dot, angle_label)
        self.play(tracker.animate.set_value(PI), run_time=4, rate_func=smooth)
        self.wait(0.5)

        euler_eq = MathTex(r"e^{i\pi} + 1 = 0", font_size=40, color=ACCENT)
        euler_eq.to_edge(DOWN, buff=0.6)
        self.play(Write(euler_eq), run_time=2.0)
        self.wait(2.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: unit circle / trig functions (self-contained)
# ---------------------------------------------------------------------------
UNIT_CIRCLE_TRIG = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Trigonometry on the Unit Circle", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(x_range=[-1.5, 1.5, 0.5], y_range=[-1.5, 1.5, 0.5],
                    x_length=5, y_length=5,
                    axis_config={"include_tip": True, "color": DIM}).shift(LEFT * 2.5)
        circle = Circle(radius=axes.get_x_unit_size(), color=DIM, stroke_opacity=0.3)
        circle.move_to(axes.c2p(0, 0))
        self.play(Create(axes), Create(circle), run_time=1.0)

        tracker = ValueTracker(0)
        dot = always_redraw(lambda: Dot(
            axes.c2p(np.cos(tracker.get_value()), np.sin(tracker.get_value())),
            color=ACCENT, radius=0.08))
        radius_line = always_redraw(lambda: Line(
            axes.c2p(0, 0), dot.get_center(), color=PRIMARY, stroke_width=2))
        cos_line = always_redraw(lambda: Line(
            axes.c2p(0, 0), axes.c2p(np.cos(tracker.get_value()), 0),
            color=SECONDARY, stroke_width=3))
        sin_line = always_redraw(lambda: Line(
            axes.c2p(np.cos(tracker.get_value()), 0), dot.get_center(),
            color=HIGHLIGHT, stroke_width=3))

        cos_label = always_redraw(lambda: Text(
            f"cos = {np.cos(tracker.get_value()):.2f}", font_size=22,
            color=SECONDARY, font=MONO).to_corner(UR).shift(DOWN * 0.6))
        sin_label = always_redraw(lambda: Text(
            f"sin = {np.sin(tracker.get_value()):.2f}", font_size=22,
            color=HIGHLIGHT, font=MONO).to_corner(UR).shift(DOWN * 1.1))

        self.add(radius_line, cos_line, sin_line, dot, cos_label, sin_label)
        self.play(tracker.animate.set_value(TAU), run_time=6, rate_func=linear)
        self.wait(1.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: complex numbers / Argand diagram (self-contained)
# ---------------------------------------------------------------------------
COMPLEX_NUMBERS = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Complex Numbers in the Plane", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        plane = ComplexPlane(
            x_range=[-4, 4, 1], y_range=[-3, 3, 1],
            x_length=8, y_length=5,
            background_line_style={"stroke_opacity": 0.12},
        ).shift(DOWN * 0.2)
        plane.add_coordinates(font_size=14)
        self.play(Create(plane), run_time=1.0)

        z1 = 3 + 2j
        z2 = -1 + 1j
        z_sum = z1 + z2

        d1 = Dot(plane.n2p(z1), color=PRIMARY, radius=0.08)
        d2 = Dot(plane.n2p(z2), color=SECONDARY, radius=0.08)
        l1 = Text("3 + 2i", font_size=20, color=PRIMARY, font=MONO).next_to(d1, UR, buff=0.1)
        l2 = Text("-1 + i", font_size=20, color=SECONDARY, font=MONO).next_to(d2, UL, buff=0.1)
        v1 = Arrow(plane.n2p(0), plane.n2p(z1), buff=0, color=PRIMARY, stroke_width=2)
        v2 = Arrow(plane.n2p(0), plane.n2p(z2), buff=0, color=SECONDARY, stroke_width=2)

        self.play(GrowArrow(v1), FadeIn(d1), Write(l1), run_time=1.2)
        self.wait(0.5)
        self.play(GrowArrow(v2), FadeIn(d2), Write(l2), run_time=1.2)
        self.wait(0.8)

        v2_shifted = Arrow(plane.n2p(z1), plane.n2p(z_sum), buff=0, color=SECONDARY,
                          stroke_width=2, stroke_opacity=0.6)
        d_sum = Dot(plane.n2p(z_sum), color=ACCENT, radius=0.1)
        l_sum = Text("2 + 3i", font_size=20, color=ACCENT, font=MONO).next_to(d_sum, UR, buff=0.1)

        self.play(GrowArrow(v2_shifted), run_time=1.0)
        self.play(FadeIn(d_sum), Write(l_sum), run_time=0.8)

        eq = MathTex(r"(3+2i) + (-1+i) = 2+3i", font_size=32, color=ACCENT)
        eq.to_edge(DOWN, buff=0.5)
        self.play(Write(eq), run_time=1.5)
        self.wait(2.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: Fourier series visualization (self-contained)
# ---------------------------------------------------------------------------
FOURIER_SERIES = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Fourier Series Approximation", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range=[-3.5, 3.5, 1], y_range=[-1.8, 1.8, 0.5],
            x_length=9, y_length=4,
            axis_config={"include_tip": True, "color": DIM},
        ).shift(DOWN * 0.3)
        self.play(Create(axes), run_time=0.8)

        # Square wave target
        def square_wave(x):
            return 1.0 if (x % (2 * PI)) < PI else -1.0

        target = axes.plot(square_wave, color=DIM, stroke_opacity=0.4,
                          x_range=[-3.3, 3.3], use_smoothing=False, discontinuities=[0, PI, -PI])
        self.play(Create(target), run_time=0.8)
        self.wait(0.5)

        colors = [PRIMARY, SECONDARY, ACCENT, HIGHLIGHT, "#FF69B4"]
        prev_curve = None
        for k, n_terms in enumerate([1, 3, 5, 9, 19]):
            def fourier_approx(x, n=n_terms):
                s = 0
                for i in range(1, n + 1, 2):
                    s += np.sin(i * x) / i
                return s * 4 / PI

            color = colors[k % len(colors)]
            curve = axes.plot(fourier_approx, color=color, x_range=[-3.3, 3.3])
            lbl = Text(f"n={n_terms}", font_size=20, color=color, font=MONO)
            lbl.to_corner(UR).shift(DOWN * (0.5 + k * 0.4))

            anims = [Create(curve), Write(lbl)]
            if prev_curve:
                anims.insert(0, prev_curve.animate.set_opacity(0.2))
            self.play(*anims, run_time=1.0)
            self.wait(0.8)
            prev_curve = curve

        self.wait(1.5)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: probability / normal distribution (self-contained)
# ---------------------------------------------------------------------------
NORMAL_DISTRIBUTION = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("The Normal Distribution", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range=[-4, 4, 1], y_range=[0, 0.5, 0.1],
            x_length=9, y_length=4.5,
            axis_config={"include_tip": True, "color": DIM},
        ).shift(DOWN * 0.2)
        x_label = MathTex(r"x", font_size=22, color=DIM).next_to(axes.x_axis, RIGHT)
        self.play(Create(axes), Write(x_label), run_time=0.8)

        def normal_pdf(x, mu=0, sigma=1):
            return np.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * np.sqrt(2 * PI))

        curve = axes.plot(lambda x: normal_pdf(x), color=PRIMARY, x_range=[-3.5, 3.5])
        self.play(Create(curve), run_time=1.5)
        self.wait(0.8)

        area_1s = axes.get_area(curve, x_range=[-1, 1], color=PRIMARY, opacity=0.3)
        pct_1 = Text("68.2%", font_size=22, color=PRIMARY, font=MONO).move_to(axes.c2p(0, 0.15))
        self.play(FadeIn(area_1s), Write(pct_1), run_time=1.0)
        self.wait(1.0)

        area_2s = axes.get_area(curve, x_range=[-2, 2], color=SECONDARY, opacity=0.2)
        pct_2 = Text("95.4%", font_size=20, color=SECONDARY, font=MONO).move_to(axes.c2p(0, 0.06))
        self.play(FadeIn(area_2s), Write(pct_2), run_time=1.0)
        self.wait(1.0)

        eq = MathTex(r"f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}",
                    font_size=30, color=ACCENT)
        eq.to_edge(DOWN, buff=0.5)
        self.play(Write(eq), run_time=1.5)
        self.wait(2.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: dot product / vector operations (self-contained)
# ---------------------------------------------------------------------------
VECTOR_OPERATIONS = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Vector Addition & Dot Product", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range=[-1, 5, 1], y_range=[-1, 4, 1],
            x_length=7, y_length=5,
            axis_config={"include_tip": True, "color": DIM},
        ).shift(LEFT * 1)
        self.play(Create(axes), run_time=0.8)

        a = np.array([3, 1, 0])
        b = np.array([1, 3, 0])
        s = a + b

        va = Arrow(axes.c2p(0, 0), axes.c2p(*a[:2]), buff=0, color=PRIMARY, stroke_width=3)
        vb = Arrow(axes.c2p(0, 0), axes.c2p(*b[:2]), buff=0, color=SECONDARY, stroke_width=3)
        la = MathTex(r"\vec{a}", font_size=24, color=PRIMARY).next_to(va.get_end(), RIGHT, buff=0.1)
        lb = MathTex(r"\vec{b}", font_size=24, color=SECONDARY).next_to(vb.get_end(), LEFT, buff=0.1)

        self.play(GrowArrow(va), Write(la), run_time=1.0)
        self.play(GrowArrow(vb), Write(lb), run_time=1.0)
        self.wait(0.8)

        vb_shifted = Arrow(axes.c2p(*a[:2]), axes.c2p(*s[:2]), buff=0,
                          color=SECONDARY, stroke_width=2, stroke_opacity=0.6)
        vs = Arrow(axes.c2p(0, 0), axes.c2p(*s[:2]), buff=0, color=ACCENT, stroke_width=3)
        ls = MathTex(r"\vec{a}+\vec{b}", font_size=24, color=ACCENT).next_to(vs.get_end(), UR, buff=0.1)

        self.play(GrowArrow(vb_shifted), run_time=0.8)
        self.play(GrowArrow(vs), Write(ls), run_time=1.0)
        self.wait(1.0)

        dot_val = np.dot(a[:2], b[:2])
        info = MathTex(
            r"\vec{a} \cdot \vec{b} = " + str(int(dot_val)),
            font_size=30, color=ACCENT,
        ).to_edge(DOWN, buff=0.5)
        self.play(Write(info), run_time=1.2)
        self.wait(2.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Template: limits visualization (self-contained)
# ---------------------------------------------------------------------------
LIMITS = SCENE_PREAMBLE + r'''
class GeneratedScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        title = Text("Understanding Limits", font_size=42, color=PRIMARY, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        axes = Axes(
            x_range=[-1, 5, 1], y_range=[-1, 5, 1],
            x_length=8, y_length=5,
            axis_config={"include_tip": True, "color": DIM},
        ).shift(DOWN * 0.2)
        self.play(Create(axes), run_time=0.8)

        func = axes.plot(lambda x: x ** 2, color=PRIMARY, x_range=[0, 2.2])
        self.play(Create(func), run_time=1.0)

        target_x = 2.0
        target_y = target_x ** 2
        target_dot = Dot(axes.c2p(target_x, target_y), color=ACCENT, radius=0.1)

        tracker = ValueTracker(0.5)
        approach_dot = always_redraw(lambda: Dot(
            axes.c2p(tracker.get_value(), tracker.get_value() ** 2),
            color=HIGHLIGHT, radius=0.08))
        h_dash = always_redraw(lambda: DashedLine(
            axes.c2p(tracker.get_value(), 0), axes.c2p(tracker.get_value(), tracker.get_value() ** 2),
            color=HIGHLIGHT, stroke_width=1, stroke_opacity=0.5))
        v_dash = always_redraw(lambda: DashedLine(
            axes.c2p(0, tracker.get_value() ** 2), axes.c2p(tracker.get_value(), tracker.get_value() ** 2),
            color=HIGHLIGHT, stroke_width=1, stroke_opacity=0.5))

        self.add(approach_dot, h_dash, v_dash)
        self.play(tracker.animate.set_value(1.9), run_time=2, rate_func=smooth)
        self.play(FadeIn(target_dot), run_time=0.5)
        self.play(tracker.animate.set_value(1.99), run_time=1.5, rate_func=smooth)
        self.wait(0.5)

        lim_eq = MathTex(r"\lim_{x \to 2} x^2 = 4", font_size=36, color=ACCENT)
        lim_eq.to_edge(DOWN, buff=0.5)
        self.play(Write(lim_eq), run_time=1.5)
        self.wait(2.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
'''

# ---------------------------------------------------------------------------
# Topic → template mapping (heuristic)
# ---------------------------------------------------------------------------
TOPIC_TEMPLATE_MAP = {
    "derivative": ("FUNCTION_PLOT", {
        "title": "The Derivative: Slope of Tangent",
        "x_range": [-1, 5, 1], "y_range": [-1, 10, 2],
        "x_label": "x", "y_label": "y",
        "func_expr": "x**2", "func_label": "f(x) = x^2",
        "plot_range": [0, 3.1],
        "extra_code": """
        x_val = ValueTracker(1)
        dot = always_redraw(lambda: Dot(
            axes.c2p(x_val.get_value(), x_val.get_value()**2), color=ACCENT, radius=0.08))
        tangent = always_redraw(lambda: axes.get_secant_slope_group(
            x=x_val.get_value(), graph=func, dx=0.01,
            secant_line_color=HIGHLIGHT, secant_line_length=4,
        ))
        self.add(dot, tangent)
        self.play(x_val.animate.set_value(2.5), run_time=4, rate_func=smooth)""",
    }),
    "integral": ("FUNCTION_PLOT", {
        "title": "The Definite Integral: Area Under the Curve",
        "x_range": [-0.5, 4, 1], "y_range": [-0.5, 5, 1],
        "x_label": "x", "y_label": "y",
        "func_expr": "x**2 * 0.3 + 0.5", "func_label": "f(x)",
        "plot_range": [0, 3.5],
        "extra_code": """
        area = axes.get_area(func, x_range=[0.5, 3], color=[PRIMARY, SECONDARY], opacity=0.4)
        self.play(FadeIn(area), run_time=1.5)
        brace = Brace(area, DOWN, color=ACCENT)
        lbl = brace.get_text("Area = integral", font_size=20, color=ACCENT)
        self.play(GrowFromCenter(brace), Write(lbl), run_time=1.0)""",
    }),
    "pythagorean": ("GEOMETRIC", {
        "title": "The Pythagorean Theorem",
        "body_code": """
        a_len, b_len = 2.0, 1.5
        c_len = np.sqrt(a_len**2 + b_len**2)
        A = LEFT * 2 + DOWN * 1
        B = A + RIGHT * a_len
        C = A + UP * b_len
        triangle = Polygon(A, B, C, color=PRIMARY, fill_opacity=0.15, stroke_width=2)
        self.play(Create(triangle), run_time=1.5)
        self.wait(0.5)

        a_label = MathTex("a", font_size=28, color=SECONDARY).next_to(Line(A, B), DOWN, buff=0.2)
        b_label = MathTex("b", font_size=28, color=SECONDARY).next_to(Line(A, C), LEFT, buff=0.2)
        c_label = MathTex("c", font_size=28, color=ACCENT).next_to(Line(B, C).get_center(), UR, buff=0.15)
        self.play(Write(a_label), Write(b_label), Write(c_label), run_time=1.0)
        self.wait(0.8)

        sq_a = Square(side_length=a_len, color=SECONDARY, fill_opacity=0.2, stroke_width=1.5)
        sq_a.next_to(Line(A, B), DOWN, buff=0)
        sq_b = Square(side_length=b_len, color=SECONDARY, fill_opacity=0.2, stroke_width=1.5)
        sq_b.next_to(Line(A, C), LEFT, buff=0)
        self.play(FadeIn(sq_a), FadeIn(sq_b), run_time=1.2)
        self.wait(0.5)

        eq = MathTex(r"a^2 + b^2 = c^2", font_size=36, color=ACCENT)
        eq.to_edge(DOWN, buff=0.6)
        self.play(Write(eq), run_time=1.5)""",
    }),
    "euler_identity": ("EULER_CIRCLE", {}),
    "taylor": ("TAYLOR_SERIES", {
        "title": "Taylor Series Approximation of sin(x)",
        "x_range": [-7, 7, 1], "y_range": [-2, 2, 1],
        "plot_range": [-6.5, 6.5],
        "target_func": "np.sin(x)",
        "target_label": "sin(x)",
        "terms": [
            (1, "x", r"T_1: x"),
            (3, "x - x**3/6", r"T_3: x - x^3/3!"),
            (5, "x - x**3/6 + x**5/120", r"T_5"),
            (7, "x - x**3/6 + x**5/120 - x**7/5040", r"T_7"),
        ],
    }),
    "fibonacci": ("CONCEPT_EXPLAINER", {
        "title": "The Fibonacci Sequence",
        "body_code": """
        fibs = [1, 1, 2, 3, 5, 8, 13, 21]
        squares = VGroup()
        colors = [PRIMARY, SECONDARY, ACCENT, HIGHLIGHT, "#FF69B4", "#00CED1", "#FFD700", "#FF4500"]
        scale = 0.12
        for i, f in enumerate(fibs[:6]):
            sq = Square(side_length=f * scale, color=colors[i % len(colors)],
                       fill_opacity=0.3, stroke_width=2)
            lbl = Text(str(f), font_size=max(14, int(f * scale * 12)), color=colors[i % len(colors)], font=MONO)
            lbl.move_to(sq)
            grp = VGroup(sq, lbl)
            squares.add(grp)

        squares.arrange(RIGHT, buff=0.3).move_to(ORIGIN + DOWN * 0.5)
        self.play(LaggedStart(*[FadeIn(s, shift=UP * 0.3) for s in squares], lag_ratio=0.3), run_time=3)
        self.wait(1.0)

        eq = MathTex(r"F_n = F_{n-1} + F_{n-2}", font_size=36, color=ACCENT)
        eq.to_edge(DOWN, buff=0.6)
        self.play(Write(eq), run_time=1.5)""",
    }),
    "golden_ratio": ("CONCEPT_EXPLAINER", {
        "title": "The Golden Ratio",
        "body_code": r"""
        phi = (1 + np.sqrt(5)) / 2
        rect = Rectangle(width=phi * 2.5, height=2.5, color=PRIMARY, stroke_width=2)
        self.play(Create(rect), run_time=1.0)
        self.wait(0.5)

        sq = Square(side_length=2.5, color=SECONDARY, fill_opacity=0.2, stroke_width=2)
        sq.align_to(rect, LEFT).align_to(rect, DOWN)
        self.play(Create(sq), run_time=0.8)

        remaining = Rectangle(width=rect.width - 2.5, height=2.5,
                             color=ACCENT, fill_opacity=0.15, stroke_width=1.5)
        remaining.next_to(sq, RIGHT, buff=0)
        self.play(Create(remaining), run_time=0.8)
        self.wait(0.5)

        phi_eq = MathTex(r"\varphi = \frac{1 + \sqrt{5}}{2} \approx 1.618", font_size=36, color=ACCENT)
        phi_eq.to_edge(DOWN, buff=0.6)
        self.play(Write(phi_eq), run_time=1.5)""",
    }),
    "linear_transform": ("LINEAR_TRANSFORM", {
        "title": "Linear Transformation",
        "matrix": [[2, 1], [1, 2]],
        "matrix_tex": r"\begin{bmatrix} 2 & 1 \\ 1 & 2 \end{bmatrix}",
    }),
    "trig": ("UNIT_CIRCLE_TRIG", {}),
    "sin": ("UNIT_CIRCLE_TRIG", {}),
    "cos": ("UNIT_CIRCLE_TRIG", {}),
    "complex": ("COMPLEX_NUMBERS", {}),
    "imaginary": ("COMPLEX_NUMBERS", {}),
    "fourier": ("FOURIER_SERIES", {}),
    "normal_dist": ("NORMAL_DISTRIBUTION", {}),
    "gaussian": ("NORMAL_DISTRIBUTION", {}),
    "probability": ("NORMAL_DISTRIBUTION", {}),
    "vector": ("VECTOR_OPERATIONS", {}),
    "dot_product": ("VECTOR_OPERATIONS", {}),
    "limit": ("LIMITS", {}),
}


def get_template_code(template_name: str) -> str:
    """Return the raw template string for a given template name."""
    templates = {
        "EQUATION_DERIVATION": EQUATION_DERIVATION,
        "FUNCTION_PLOT": FUNCTION_PLOT,
        "GEOMETRIC": GEOMETRIC,
        "CONCEPT_EXPLAINER": CONCEPT_EXPLAINER,
        "LINEAR_TRANSFORM": LINEAR_TRANSFORM,
        "TAYLOR_SERIES": TAYLOR_SERIES,
        "EULER_CIRCLE": EULER_CIRCLE,
        "UNIT_CIRCLE_TRIG": UNIT_CIRCLE_TRIG,
        "COMPLEX_NUMBERS": COMPLEX_NUMBERS,
        "FOURIER_SERIES": FOURIER_SERIES,
        "NORMAL_DISTRIBUTION": NORMAL_DISTRIBUTION,
        "VECTOR_OPERATIONS": VECTOR_OPERATIONS,
        "LIMITS": LIMITS,
    }
    return templates.get(template_name, CONCEPT_EXPLAINER)


def fill_template(template_name: str, params: dict) -> str:
    """Fill a template with parameters, returning complete Python scene code."""
    template = get_template_code(template_name)
    try:
        return template.format(**params)
    except KeyError:
        return template
