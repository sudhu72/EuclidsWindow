"""Advanced topics Manim scenes without LaTeX."""
from manim import *


class PolarCoordinates(Scene):
    def construct(self):
        title = Text("Polar Coordinates", font_size=40).to_edge(UP)
        self.play(Write(title))

        circle = Circle(radius=2.5, color=BLUE)
        origin = Dot(ORIGIN, color=YELLOW)
        angle = 60 * DEGREES
        point = Dot(2.5 * np.array([np.cos(angle), np.sin(angle), 0]), color=RED)
        radius_line = Line(ORIGIN, point.get_center(), color=GREEN)
        angle_arc = Arc(radius=0.8, angle=angle, color=WHITE)

        r_label = Text("r", font_size=28, color=GREEN).next_to(radius_line, UP)
        theta_label = Text("θ", font_size=28, color=WHITE).next_to(angle_arc, RIGHT)

        self.play(Create(circle), Create(origin))
        self.play(Create(radius_line), Create(point), Create(angle_arc))
        self.play(Write(r_label), Write(theta_label))
        self.wait(2)


class EulerIdentityCircle(Scene):
    def construct(self):
        title = Text("Euler's Identity on the Unit Circle", font_size=36).to_edge(UP)
        self.play(Write(title))

        circle = Circle(radius=2.3, color=BLUE)
        origin = Dot(ORIGIN, color=YELLOW)
        left = Dot(2.3 * LEFT, color=RED)
        label_left = Text("-1", font_size=28).next_to(left, LEFT)

        self.play(Create(circle), Create(origin))
        self.play(Create(left), Write(label_left))

        formula = Text("e^(iπ) = -1", font_size=30, color=WHITE).to_edge(DOWN)
        self.play(Write(formula))
        self.wait(2)


class TaylorSeriesApprox(Scene):
    def construct(self):
        title = Text("Taylor Series: Approximating sin(x)", font_size=36).to_edge(UP)
        self.play(Write(title))

        axes = Axes(x_range=[-4, 4, 1], y_range=[-2, 2, 1], x_length=8, y_length=4)
        axes.shift(DOWN * 0.5)
        self.play(Create(axes))

        sin_curve = axes.plot(lambda x: np.sin(x), color=BLUE)
        approx = axes.plot(lambda x: x - (x**3) / 6, color=GREEN)
        self.play(Create(sin_curve))
        self.play(Create(approx))

        legend = VGroup(
            Text("sin(x)", font_size=24, color=BLUE),
            Text("x - x^3/6", font_size=24, color=GREEN),
        ).arrange(DOWN).to_corner(UR)
        self.play(Write(legend))
        self.wait(2)


class RootsOfUnity(Scene):
    def construct(self):
        title = Text("Roots of Unity (4th roots)", font_size=36).to_edge(UP)
        self.play(Write(title))

        circle = Circle(radius=2.3, color=BLUE)
        self.play(Create(circle))

        points = [
            Dot(2.3 * RIGHT, color=YELLOW),
            Dot(2.3 * UP, color=GREEN),
            Dot(2.3 * LEFT, color=RED),
            Dot(2.3 * DOWN, color=PURPLE),
        ]
        labels = [
            Text("1", font_size=24).next_to(points[0], RIGHT),
            Text("i", font_size=24).next_to(points[1], UP),
            Text("-1", font_size=24).next_to(points[2], LEFT),
            Text("-i", font_size=24).next_to(points[3], DOWN),
        ]

        self.play(*[Create(p) for p in points])
        self.play(*[Write(l) for l in labels])
        self.wait(2)


class FourierTransformDemo(Scene):
    def construct(self):
        title = Text("DFT/FFT: Time → Frequency", font_size=36).to_edge(UP)
        self.play(Write(title))

        axes = Axes(x_range=[0, 6, 1], y_range=[-1.5, 1.5, 1], x_length=6, y_length=2.5)
        axes.shift(LEFT * 3 + DOWN * 0.5)
        self.play(Create(axes))

        time_signal = axes.plot(lambda x: np.sin(2 * x) + 0.5 * np.sin(5 * x), color=BLUE)
        self.play(Create(time_signal))

        freq_axes = Axes(x_range=[0, 6, 1], y_range=[0, 2, 1], x_length=6, y_length=2.5)
        freq_axes.shift(RIGHT * 3 + DOWN * 0.5)
        self.play(Create(freq_axes))

        spike1 = Line(freq_axes.c2p(2, 0), freq_axes.c2p(2, 1.5), color=GREEN)
        spike2 = Line(freq_axes.c2p(5, 0), freq_axes.c2p(5, 0.8), color=GREEN)
        self.play(Create(spike1), Create(spike2))

        label_time = Text("Time", font_size=24, color=BLUE).next_to(axes, DOWN)
        label_freq = Text("Frequency", font_size=24, color=GREEN).next_to(freq_axes, DOWN)
        self.play(Write(label_time), Write(label_freq))
        self.wait(2)
