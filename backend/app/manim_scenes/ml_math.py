"""Machine Learning Mathematics Manim scenes."""
from manim import *
import numpy as np


class AttentionMechanism(Scene):
    """Visualize the attention mechanism Q, K, V."""

    def construct(self):
        title = Text("Attention Mechanism", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Formula
        formula = MathTex(
            r"\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V",
            font_size=32,
        )
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(0.5)

        # Create Q, K, V matrices
        q_matrix = Matrix([[1, 0], [0, 1], [1, 1]], left_bracket="[", right_bracket="]")
        k_matrix = Matrix([[1, 1], [0, 1], [1, 0]], left_bracket="[", right_bracket="]")
        v_matrix = Matrix([[0.5], [0.3], [0.2]], left_bracket="[", right_bracket="]")

        q_label = MathTex("Q", font_size=36, color=BLUE).next_to(q_matrix, UP)
        k_label = MathTex("K", font_size=36, color=GREEN).next_to(k_matrix, UP)
        v_label = MathTex("V", font_size=36, color=RED).next_to(v_matrix, UP)

        q_group = VGroup(q_label, q_matrix).scale(0.6).shift(3 * LEFT + DOWN)
        k_group = VGroup(k_label, k_matrix).scale(0.6).shift(DOWN)
        v_group = VGroup(v_label, v_matrix).scale(0.6).shift(3 * RIGHT + DOWN)

        self.play(Create(q_group), Create(k_group), Create(v_group))
        self.wait(0.5)

        # Show attention weights visualization
        weights_title = Text("Attention Weights", font_size=28)
        weights_title.shift(2.5 * DOWN)

        # Create a simple heatmap representation
        squares = VGroup()
        for i in range(3):
            for j in range(3):
                weight = np.random.uniform(0.1, 1)
                sq = Square(side_length=0.4)
                sq.set_fill(YELLOW, opacity=weight)
                sq.set_stroke(WHITE, width=1)
                sq.shift(RIGHT * j * 0.5 + UP * i * 0.5)
                squares.add(sq)

        squares.shift(2.5 * DOWN + 2 * LEFT)
        self.play(Write(weights_title), Create(squares))

        self.wait(2)


class LoRAVisualization(Scene):
    """Visualize LoRA low-rank adaptation."""

    def construct(self):
        title = Text("LoRA: Low-Rank Adaptation", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Original weight matrix
        w_orig = Rectangle(width=3, height=2, color=BLUE, fill_opacity=0.5)
        w_orig.shift(3 * LEFT)
        w_label = MathTex("W_0", font_size=36).next_to(w_orig, UP)
        w_dims = Text("d × d", font_size=20).next_to(w_orig, DOWN)

        self.play(Create(w_orig), Write(w_label), Write(w_dims))
        self.wait(0.5)

        # Plus sign
        plus = MathTex("+", font_size=48).next_to(w_orig, RIGHT, buff=0.5)
        self.play(Write(plus))

        # Low-rank matrices B and A
        b_matrix = Rectangle(width=0.5, height=2, color=GREEN, fill_opacity=0.5)
        b_matrix.next_to(plus, RIGHT, buff=0.5)
        b_label = MathTex("B", font_size=36, color=GREEN).next_to(b_matrix, UP)
        b_dims = Text("d × r", font_size=20).next_to(b_matrix, DOWN)

        a_matrix = Rectangle(width=3, height=0.5, color=RED, fill_opacity=0.5)
        a_matrix.next_to(b_matrix, RIGHT, buff=0.2)
        a_label = MathTex("A", font_size=36, color=RED).next_to(a_matrix, UP)
        a_dims = Text("r × d", font_size=20).next_to(a_matrix, DOWN)

        self.play(
            Create(b_matrix), Write(b_label), Write(b_dims),
            Create(a_matrix), Write(a_label), Write(a_dims),
        )
        self.wait(0.5)

        # Formula
        formula = MathTex(
            r"W = W_0 + BA",
            font_size=40,
        )
        formula.shift(2 * DOWN)

        self.play(Write(formula))

        # Explanation
        explanation = Text(
            "r << d: Only train small matrices B and A",
            font_size=24,
            color=YELLOW,
        )
        explanation.next_to(formula, DOWN)
        self.play(Write(explanation))

        self.wait(2)


class VectorEmbeddings(Scene):
    """Visualize vector embeddings and similarity."""

    def construct(self):
        title = Text("Vector Embeddings", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create 2D axes for visualization
        axes = Axes(
            x_range=[-1, 5, 1],
            y_range=[-1, 5, 1],
            x_length=6,
            y_length=6,
            axis_config={"include_tip": True},
        )
        axes.shift(LEFT * 2)

        self.play(Create(axes))

        # Create word vectors
        words = [
            ("king", [4, 3], BLUE),
            ("queen", [3.8, 3.2], BLUE),
            ("man", [2, 1], GREEN),
            ("woman", [1.8, 1.2], GREEN),
            ("cat", [1, 4], RED),
        ]

        arrows = []
        labels = []

        for word, pos, color in words:
            arrow = Arrow(
                axes.c2p(0, 0),
                axes.c2p(pos[0], pos[1]),
                color=color,
                buff=0,
            )
            label = Text(word, font_size=20).next_to(axes.c2p(pos[0], pos[1]), UR, buff=0.1)
            arrows.append(arrow)
            labels.append(label)

        for arrow, label in zip(arrows, labels):
            self.play(Create(arrow), Write(label), run_time=0.5)

        # Show similarity concept
        similarity_text = Text(
            "Similar words → Similar vectors",
            font_size=24,
        )
        similarity_text.shift(3 * RIGHT + UP)

        cosine_formula = MathTex(
            r"\cos(\theta) = \frac{A \cdot B}{|A||B|}",
            font_size=28,
        )
        cosine_formula.next_to(similarity_text, DOWN)

        self.play(Write(similarity_text), Write(cosine_formula))

        self.wait(2)


class GradientDescent(Scene):
    """Visualize gradient descent optimization."""

    def construct(self):
        title = Text("Gradient Descent", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[0, 10, 2],
            x_length=8,
            y_length=5,
            axis_config={"include_tip": True},
        )
        axes.shift(DOWN * 0.5)

        x_label = MathTex(r"\theta", font_size=32).next_to(axes.x_axis, RIGHT)
        y_label = MathTex(r"L(\theta)", font_size=32).next_to(axes.y_axis, UP)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # Loss function (parabola)
        loss = axes.plot(lambda x: x**2 + 1, color=BLUE, x_range=[-2.8, 2.8])
        loss_label = Text("Loss Function", font_size=24, color=BLUE)
        loss_label.to_corner(UR)

        self.play(Create(loss), Write(loss_label))

        # Starting point
        x_val = ValueTracker(2.5)

        dot = always_redraw(
            lambda: Dot(
                axes.c2p(x_val.get_value(), x_val.get_value()**2 + 1),
                color=YELLOW,
            )
        )

        # Tangent line showing gradient
        def get_tangent():
            x = x_val.get_value()
            slope = 2 * x  # derivative
            return axes.plot(
                lambda t: slope * (t - x) + (x**2 + 1),
                x_range=[x - 0.8, x + 0.8],
                color=RED,
            )

        tangent = always_redraw(get_tangent)

        self.play(Create(dot), Create(tangent))

        # Show gradient descent steps
        update_rule = MathTex(
            r"\theta_{new} = \theta - \alpha \nabla L",
            font_size=32,
        )
        update_rule.to_corner(DL)
        self.play(Write(update_rule))

        # Animate descent
        for target in [1.5, 0.8, 0.3, 0.1, 0.02]:
            self.play(x_val.animate.set_value(target), run_time=0.8)

        # Final position
        minimum = Text("Minimum!", font_size=24, color=GREEN)
        minimum.next_to(dot, UP)
        self.play(Write(minimum))

        self.wait(2)
