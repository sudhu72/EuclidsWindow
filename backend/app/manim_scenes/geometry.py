"""Geometry-related Manim scenes."""
from manim import *


class PythagoreanTheorem(Scene):
    """Animate the proof of the Pythagorean theorem using area."""

    def construct(self):
        # Title
        title = Text("Pythagorean Theorem", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create right triangle
        triangle = Polygon(
            ORIGIN, 3 * RIGHT, 3 * RIGHT + 4 * UP,
            color=WHITE,
            fill_opacity=0.3,
            fill_color=BLUE,
        )
        triangle.move_to(ORIGIN)

        # Labels
        a_label = MathTex("a", font_size=36).next_to(triangle, DOWN)
        b_label = MathTex("b", font_size=36).next_to(triangle, RIGHT)
        c_label = MathTex("c", font_size=36).move_to(triangle.get_center() + 0.8 * (UP + LEFT))

        self.play(Create(triangle))
        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait(0.5)

        # Create squares on each side
        # Square on a (bottom)
        square_a = Square(side_length=3, color=RED, fill_opacity=0.5)
        square_a.next_to(triangle, DOWN, buff=0)

        # Square on b (right)
        square_b = Square(side_length=4, color=GREEN, fill_opacity=0.5)
        square_b.next_to(triangle, RIGHT, buff=0)

        # Square on c (hypotenuse) - rotated
        square_c = Square(side_length=5, color=YELLOW, fill_opacity=0.5)
        square_c.rotate(np.arctan(4/3))
        square_c.move_to(triangle.get_vertices()[0] + 2.5 * (UP + LEFT) * np.array([np.cos(np.arctan(4/3) + np.pi/4), np.sin(np.arctan(4/3) + np.pi/4), 0]))

        self.play(Create(square_a))
        self.play(Create(square_b))
        self.play(Create(square_c))
        self.wait(0.5)

        # Add area labels
        area_a = MathTex("a^2 = 9", font_size=28, color=RED).move_to(square_a)
        area_b = MathTex("b^2 = 16", font_size=28, color=GREEN).move_to(square_b)
        area_c = MathTex("c^2 = 25", font_size=28, color=YELLOW).next_to(square_c, LEFT)

        self.play(Write(area_a), Write(area_b), Write(area_c))
        self.wait(0.5)

        # Show equation
        equation = MathTex("a^2 + b^2 = c^2", font_size=48)
        equation.to_edge(DOWN)

        self.play(Write(equation))
        self.wait(0.5)

        # Show specific values
        values = MathTex("9 + 16 = 25", font_size=48, color=YELLOW)
        values.next_to(equation, UP)

        self.play(Write(values))
        self.wait(1)


class TriangleTypes(Scene):
    """Show different types of triangles."""

    def construct(self):
        title = Text("Types of Triangles", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        # Equilateral
        equilateral = RegularPolygon(n=3, color=BLUE, fill_opacity=0.5)
        equilateral.scale(1.5).shift(4 * LEFT)
        eq_label = Text("Equilateral", font_size=24).next_to(equilateral, DOWN)

        # Isosceles
        isosceles = Polygon(
            ORIGIN, 2 * RIGHT, RIGHT + 2.5 * UP,
            color=GREEN, fill_opacity=0.5
        ).shift(0.5 * LEFT)
        iso_label = Text("Isosceles", font_size=24).next_to(isosceles, DOWN)

        # Scalene
        scalene = Polygon(
            ORIGIN, 2.5 * RIGHT, 0.5 * RIGHT + 1.5 * UP,
            color=RED, fill_opacity=0.5
        ).shift(3 * RIGHT)
        sca_label = Text("Scalene", font_size=24).next_to(scalene, DOWN)

        self.play(Create(equilateral), Write(eq_label))
        self.play(Create(isosceles), Write(iso_label))
        self.play(Create(scalene), Write(sca_label))

        self.wait(2)


class AngleTypes(Scene):
    """Visualize acute, right, and obtuse angles."""

    def construct(self):
        title = Text("Types of Angles", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        # Create three angles
        angles_data = [
            ("Acute", 45, BLUE, 4 * LEFT),
            ("Right", 90, GREEN, ORIGIN),
            ("Obtuse", 135, RED, 4 * RIGHT),
        ]

        for name, degrees, color, position in angles_data:
            # Create angle
            line1 = Line(ORIGIN, 2 * RIGHT, color=WHITE)
            line2 = Line(ORIGIN, 2 * RIGHT, color=WHITE).rotate(
                degrees * DEGREES, about_point=ORIGIN
            )

            angle_group = VGroup(line1, line2).shift(position + DOWN)

            # Add arc to show angle
            arc = Arc(
                radius=0.5,
                start_angle=0,
                angle=degrees * DEGREES,
                color=color,
            ).shift(position + DOWN)

            # Label
            label = Text(f"{name}\n{degrees}°", font_size=24).next_to(angle_group, DOWN)

            self.play(Create(angle_group), Create(arc), Write(label))

        self.wait(2)
