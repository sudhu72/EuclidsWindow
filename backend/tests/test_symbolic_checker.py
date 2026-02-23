"""Unit tests for symbolic checker."""
from app.ai.checker import SymbolicChecker


def test_symbolic_checker_eigen_passes_when_equations_present():
    checker = SymbolicChecker()
    solution = (
        "For eigenvalues, use \\(A\\mathbf{v}=\\lambda\\mathbf{v}\\). "
        "Then solve \\(\\det(A-\\lambda I)=0\\)."
    )
    checks = checker.run("Explain eigenvalues", solution)
    names = {c.name: c.status for c in checks}
    assert names.get("eigen_definition_equation") == "pass"
    assert names.get("eigen_characteristic_equation") == "pass"


def test_symbolic_checker_warns_when_missing_eigen_equations():
    checker = SymbolicChecker()
    checks = checker.run("Explain eigenvalues", "An eigenvalue scales direction.")
    names = {c.name: c.status for c in checks}
    assert names.get("eigen_definition_equation") == "warn"
    assert names.get("eigen_characteristic_equation") == "warn"


def test_symbolic_checker_derivative_symbolic_match():
    checker = SymbolicChecker()
    checks = checker.run(
        "Differentiate x^2 + 3*x",
        "Derivative: 2*x + 3",
    )
    names = {c.name: c.status for c in checks}
    assert names.get("derivative_symbolic_match") == "pass"


def test_symbolic_checker_integral_symbolic_match():
    checker = SymbolicChecker()
    checks = checker.run(
        "Integral of x^2",
        "The antiderivative is x^3/3 + C",
    )
    names = {c.name: c.status for c in checks}
    assert names.get("integral_symbolic_match") == "pass"


def test_symbolic_checker_roots_match():
    checker = SymbolicChecker()
    checks = checker.run(
        "Solve x^2 - 5x + 6 = 0",
        "The roots are x = 2 and x = 3.",
    )
    names = {c.name: c.status for c in checks}
    assert names.get("equation_roots_match") == "pass"
