"""Unit tests for deterministic visualization planner."""
from app.ai.visual_planner import VisualizationPlanner
from app.models import VisualizationType


def test_visual_planner_eigenvalues():
    planner = VisualizationPlanner()
    plan = planner.plan("Explain eigenvalues with visualization")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "fig" in (plan.code or "")


def test_visual_planner_derivative():
    planner = VisualizationPlanner()
    plan = planner.plan("Show derivative with a tangent plot")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "tangent" in (plan.goal or "").lower()


def test_visual_planner_hamiltonian_graph():
    planner = VisualizationPlanner()
    plan = planner.plan("Explain hamiltonian graph with visualization")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "hamiltonian" in (plan.goal or "").lower()


def test_visual_planner_fractions():
    planner = VisualizationPlanner()
    plan = planner.plan("Show fractions with visualization")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "fraction" in (plan.goal or "").lower()


def test_visual_planner_systems_of_equations():
    planner = VisualizationPlanner()
    plan = planner.plan("solve systems of equations graphically")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "intersection" in (plan.goal or "").lower()


def test_visual_planner_complex_numbers():
    planner = VisualizationPlanner()
    plan = planner.plan("Explain imaginary numbers with visualization")
    assert plan is not None
    assert plan.type == VisualizationType.plotly
    assert "complex plane" in (plan.goal or "").lower()


def test_visual_planner_unknown():
    planner = VisualizationPlanner()
    plan = planner.plan("Tell me about category theory")
    assert plan is None


def test_visual_planner_visual_topic_classifier():
    planner = VisualizationPlanner()
    assert planner.is_visual_topic("Explain derivative intuition")
    assert planner.is_visual_topic("Explain hamiltonian graph")
    assert planner.is_visual_topic("Teach fractions with a picture")
    assert planner.is_visual_topic("Solve this system of equations")
    assert planner.is_visual_topic("Explain imaginary numbers")
    assert not planner.is_visual_topic("What is a ring in abstract algebra?")
