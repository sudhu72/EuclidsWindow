"""Calculus-related Manim scenes."""
from manim import *


class DerivativeAsSlope(Scene):
    """Visualize the derivative as the slope of a tangent line."""

    def construct(self):
        # Title
        title = Text("Derivative = Slope of Tangent", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-1, 5, 1],
            y_range=[-1, 10, 2],
            x_length=8,
            y_length=5,
            axis_config={"include_tip": True},
        )
        axes.shift(DOWN * 0.5)

        # Labels (avoid LaTeX dependencies)
        x_label = Text("x", font_size=24).next_to(axes.x_axis, RIGHT)
        y_label = Text("y", font_size=24).next_to(axes.y_axis, UP)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # Create function f(x) = x^2
        func = axes.plot(lambda x: x**2, color=BLUE, x_range=[0, 3])
        func_label = Text("f(x) = x^2", font_size=28, color=BLUE)
        func_label.to_corner(UR)

        self.play(Create(func), Write(func_label))
        self.wait(0.5)

        # Create a point that moves along the curve
        x_val = ValueTracker(1)

        # Dot on the curve
        dot = always_redraw(
            lambda: Dot(
                axes.c2p(x_val.get_value(), x_val.get_value() ** 2),
                color=YELLOW,
            )
        )

        # Tangent line
        def get_tangent_line():
            x = x_val.get_value()
            slope = 2 * x  # derivative of x^2
            y = x**2

            # Create line through (x, y) with given slope
            x1, x2 = x - 1, x + 1
            y1, y2 = y - slope, y + slope

            return axes.plot(
                lambda t: slope * (t - x) + y,
                x_range=[max(0, x - 1.5), min(4, x + 1.5)],
                color=RED,
            )

        tangent = always_redraw(get_tangent_line)

        # Slope label
        slope_text = always_redraw(
            lambda: Text(
                f"slope = 2x = {2 * x_val.get_value():.1f}",
                font_size=24,
            ).to_corner(DL)
        )

        self.play(Create(dot), Create(tangent), Write(slope_text))
        self.wait(0.5)

        # Animate the point moving
        self.play(x_val.animate.set_value(2), run_time=2)
        self.wait(0.5)
        self.play(x_val.animate.set_value(0.5), run_time=2)
        self.wait(0.5)
        self.play(x_val.animate.set_value(2.5), run_time=2)

        # Show derivative formula
        deriv = Text("f'(x) = 2x", font_size=28, color=RED)
        deriv.next_to(func_label, DOWN)
        self.play(Write(deriv))

        self.wait(2)


class IntegralAsArea(Scene):
    """Visualize the integral as area under a curve."""

    def construct(self):
        title = Text("Integral = Area Under Curve", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-0.5, 4, 1],
            y_range=[-0.5, 5, 1],
            x_length=8,
            y_length=5,
            axis_config={"include_tip": True},
        )
        axes.shift(DOWN * 0.5)

        x_label = Text("x", font_size=24).next_to(axes.x_axis, RIGHT)
        y_label = Text("y", font_size=24).next_to(axes.y_axis, UP)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # Create function
        func = axes.plot(lambda x: x**2 / 2 + 0.5, color=BLUE, x_range=[0, 3.5])
        func_label = Text("f(x)", font_size=28, color=BLUE).next_to(func, RIGHT)

        self.play(Create(func), Write(func_label))

        # Shade area under curve
        area = axes.get_area(func, x_range=[0.5, 3], color=GREEN, opacity=0.5)

        self.play(Create(area))
        self.wait(0.5)

        # Add integral notation
        integral = Text("Integral = area under curve", font_size=28)
        integral.to_corner(DR)
        self.play(Write(integral))

        self.wait(2)


class LimitConcept(Scene):
    """Visualize the concept of a limit."""

    def construct(self):
        title = Text("Limits: Approaching a Value", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create number line
        number_line = NumberLine(
            x_range=[0, 4, 0.5],
            length=10,
            include_numbers=True,
        )
        number_line.shift(DOWN)

        self.play(Create(number_line))

        # Target point
        target = Dot(number_line.n2p(2), color=RED, radius=0.15)
        target_label = Text("L = 2", font_size=28).next_to(target, UP)

        self.play(Create(target), Write(target_label))

        # Points approaching from left
        left_dots = VGroup(*[
            Dot(number_line.n2p(2 - 1 / (2 ** i)), color=BLUE, radius=0.08)
            for i in range(1, 6)
        ])

        # Points approaching from right
        right_dots = VGroup(*[
            Dot(number_line.n2p(2 + 1 / (2 ** i)), color=GREEN, radius=0.08)
            for i in range(1, 6)
        ])

        self.play(
            LaggedStart(*[Create(d) for d in left_dots], lag_ratio=0.3),
            LaggedStart(*[Create(d) for d in right_dots], lag_ratio=0.3),
        )

        # Limit notation
        limit_text = Text("limit as x → 2 is 2", font_size=28)
        limit_text.to_edge(DOWN)
        self.play(Write(limit_text))

        self.wait(2)
