"""Tests for didactics quality policy and coaching hints."""
from app.ai.didactics import (
    adapt_plain_for_learner_level,
    build_learning_aids,
    build_self_correction,
    build_structured_explanations,
    extract_learning_focus,
)


def test_didactics_returns_hints_when_checks_warn():
    plain, axiomatic, checks, hints = build_structured_explanations(
        "Explain derivatives",
        "Derivative is slope.",
    )
    assert plain
    assert axiomatic
    assert isinstance(checks, list) and len(checks) > 0
    assert isinstance(hints, list)
    assert len(hints) >= 1


def test_didactics_hints_are_short_and_deduped():
    _, _, _, hints = build_structured_explanations(
        "Explain eigenvalues",
        "An eigenvalue scales direction.",
    )
    assert len(hints) <= 4
    assert len(hints) == len(set(hints))


def test_didactics_builds_self_correction_for_symbolic_warn():
    _, _, checks, _ = build_structured_explanations(
        "Differentiate x^2 + 3x",
        "Derivative is x.",
    )
    correction = build_self_correction("Differentiate x^2 + 3x", checks)
    assert correction is None or "Self-correction" in correction


def test_didactics_builds_learning_aids():
    plain, _, checks, _ = build_structured_explanations(
        "Explain eigenvalues",
        "An eigenvector keeps direction. Example: A v = lambda v.",
    )
    takeaways, next_questions = build_learning_aids("Explain eigenvalues", plain, checks)
    assert isinstance(takeaways, list) and len(takeaways) >= 1
    assert isinstance(next_questions, list) and len(next_questions) >= 1


def test_didactics_learner_level_adaptation():
    text = adapt_plain_for_learner_level("Matrix multiplication combines transformations.", "kids", "matrix multiplication")
    assert "Kid-friendly mode" in text
    assert "tiny step" in text


def test_extract_learning_focus_de_nests_followup_prompt():
    nested = (
        "Can you explain Can you give me a 2-question quiz on "
        "Can you show one worked example for Explain euler's identity with visualization?? "
        "in simpler words with one analogy?"
    )
    focus = extract_learning_focus(nested)
    assert "can you" not in focus.lower()
    assert "euler" in focus.lower()
