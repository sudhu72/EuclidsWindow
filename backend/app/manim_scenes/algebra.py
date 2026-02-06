"""Algebra-related Manim scenes."""
from manim import *


class QuadraticFunction(Scene):
    """Visualize quadratic functions and parabolas."""

    def construct(self):
        title = Text("Quadratic Functions", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-2, 8, 2],
            x_length=8,
            y_length=5,
            axis_config={"include_tip": True},
        )
        axes.shift(DOWN * 0.5)

        self.play(Create(axes))

        # Base parabola
        parabola = axes.plot(lambda x: x**2, color=BLUE, x_range=[-2.8, 2.8])
        label = MathTex("y = x^2", font_size=32, color=BLUE).to_corner(UR)

        self.play(Create(parabola), Write(label))
        self.wait(0.5)

        # Show vertex
        vertex = Dot(axes.c2p(0, 0), color=YELLOW)
        vertex_label = Text("Vertex (0, 0)", font_size=24).next_to(vertex, DOWN)
        self.play(Create(vertex), Write(vertex_label))
        self.wait(0.5)

        # Transform to shifted parabola
        parabola2 = axes.plot(lambda x: (x - 1)**2 + 2, color=GREEN, x_range=[-1.5, 3.5])
        label2 = MathTex("y = (x-1)^2 + 2", font_size=32, color=GREEN)
        label2.next_to(label, DOWN)

        vertex2 = Dot(axes.c2p(1, 2), color=YELLOW)
        vertex_label2 = Text("Vertex (1, 2)", font_size=24).next_to(vertex2, RIGHT)

        self.play(
            Transform(parabola.copy(), parabola2),
            Write(label2),
            Transform(vertex.copy(), vertex2),
            Write(vertex_label2),
        )

        self.wait(2)


class LinearEquation(Scene):
    """Visualize linear equations and slope-intercept form."""

    def construct(self):
        title = Text("Linear Equations: y = mx + b", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            x_length=7,
            y_length=7,
            axis_config={"include_tip": True},
        )

        self.play(Create(axes))

        # Initial line: y = x
        m = ValueTracker(1)
        b = ValueTracker(0)

        line = always_redraw(
            lambda: axes.plot(
                lambda x: m.get_value() * x + b.get_value(),
                color=BLUE,
                x_range=[-3.5, 3.5],
            )
        )

        equation = always_redraw(
            lambda: MathTex(
                f"y = {m.get_value():.1f}x {'+' if b.get_value() >= 0 else ''}{b.get_value():.1f}",
                font_size=32,
            ).to_corner(UR)
        )

        slope_label = always_redraw(
            lambda: Text(f"slope (m) = {m.get_value():.1f}", font_size=24).to_corner(DR)
        )

        self.play(Create(line), Write(equation), Write(slope_label))
        self.wait(0.5)

        # Animate slope change
        self.play(m.animate.set_value(2), run_time=1.5)
        self.wait(0.5)
        self.play(m.animate.set_value(0.5), run_time=1.5)
        self.wait(0.5)
        self.play(m.animate.set_value(-1), run_time=1.5)
        self.wait(0.5)

        # Reset and change y-intercept
        self.play(m.animate.set_value(1), run_time=0.5)
        self.play(b.animate.set_value(2), run_time=1.5)
        self.wait(0.5)
        self.play(b.animate.set_value(-2), run_time=1.5)

        self.wait(2)


class NumberLineOperations(Scene):
    """Visualize addition and subtraction on a number line."""

    def construct(self):
        title = Text("Addition on the Number Line", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create number line
        number_line = NumberLine(
            x_range=[-5, 10, 1],
            length=12,
            include_numbers=True,
        )

        self.play(Create(number_line))

        # Show 3 + 4 = 7
        equation = MathTex("3 + 4 = 7", font_size=48)
        equation.to_edge(DOWN)

        # Start at 3
        dot = Dot(number_line.n2p(3), color=BLUE)
        self.play(Create(dot))

        # Arrow showing +4
        arrow = Arrow(
            number_line.n2p(3) + UP * 0.5,
            number_line.n2p(7) + UP * 0.5,
            color=GREEN,
            buff=0,
        )
        arrow_label = MathTex("+4", font_size=32, color=GREEN)
        arrow_label.next_to(arrow, UP)

        self.play(Create(arrow), Write(arrow_label))

        # Move dot to 7
        self.play(dot.animate.move_to(number_line.n2p(7)))
        self.play(Write(equation))

        self.wait(2)
