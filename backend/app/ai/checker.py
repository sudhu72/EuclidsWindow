"""Symbolic and structural checks for tutor responses."""
import re
from typing import List, Optional

from ..models import TutorCheck

try:
    import sympy as sp
    from sympy.parsing.sympy_parser import (
        convert_xor,
        implicit_multiplication_application,
        parse_expr,
        standard_transformations,
    )
except Exception:  # pragma: no cover - optional runtime fallback
    sp = None


class SymbolicChecker:
    """Lightweight correctness checks using symbolic math when possible."""

    def run(self, question: str, solution: str) -> List[TutorCheck]:
        q = (question or "").lower()
        text = (solution or "").strip()
        checks: List[TutorCheck] = []

        if not text:
            return [
                TutorCheck(
                    name="non_empty_solution",
                    status="warn",
                    details="No solution text available for checking.",
                )
            ]

        if "eigen" in q:
            checks.extend(self._check_eigen_structure(text))

        if any(token in q for token in ("derivative", "differentiate", "d/dx")):
            checks.extend(self._check_derivative_shape(text))
            checks.extend(self._check_derivative_symbolic(question, text))

        if any(token in q for token in ("integral", "integrate")):
            checks.extend(self._check_integral_shape(text))
            checks.extend(self._check_integral_symbolic(question, text))

        if any(token in q for token in ("solve", "root", "roots", "equation")):
            checks.extend(self._check_equation_roots(question, text))

        if not checks:
            checks.append(
                TutorCheck(
                    name="basic_symbolic_checker",
                    status="warn",
                    details="No domain-specific symbolic rule matched this question yet.",
                )
            )
        return checks

    def _check_eigen_structure(self, text: str) -> List[TutorCheck]:
        has_eigen_eq = bool(re.search(r"A\\mathbf\{v\}\s*=\s*\\lambda", text))
        has_char_eq = bool(re.search(r"det\s*\(A\s*-\s*\\lambda\s*I\)", text, re.IGNORECASE))
        checks = [
            TutorCheck(
                name="eigen_definition_equation",
                status="pass" if has_eigen_eq else "warn",
                details=(
                    "Includes the eigen relation A v = lambda v."
                    if has_eigen_eq
                    else "Missing explicit eigen relation A v = lambda v."
                ),
            ),
            TutorCheck(
                name="eigen_characteristic_equation",
                status="pass" if has_char_eq else "warn",
                details=(
                    "Includes determinant characteristic equation."
                    if has_char_eq
                    else "Missing determinant form det(A - lambda I) = 0."
                ),
            ),
        ]
        return checks

    def _check_derivative_shape(self, text: str) -> List[TutorCheck]:
        has_prime = "'" in text or "\\frac{d" in text or "d/dx" in text.lower()
        return [
            TutorCheck(
                name="derivative_notation_present",
                status="pass" if has_prime else "warn",
                details=(
                    "Derivative notation detected."
                    if has_prime
                    else "No derivative notation detected in explanation."
                ),
            )
        ]

    def _check_integral_shape(self, text: str) -> List[TutorCheck]:
        has_integral = "\\int" in text or "integral" in text.lower()
        checks = [
            TutorCheck(
                name="integral_notation_present",
                status="pass" if has_integral else "warn",
                details=(
                    "Integral notation detected."
                    if has_integral
                    else "No integral notation detected in explanation."
                ),
            )
        ]
        if sp is not None and has_integral:
            checks.append(
                TutorCheck(
                    name="sympy_runtime_available",
                    status="pass",
                    details="SymPy is available for deeper symbolic checks.",
                )
            )
        return checks

    def _check_derivative_symbolic(self, question: str, text: str) -> List[TutorCheck]:
        if sp is None:
            return [
                TutorCheck(
                    name="derivative_symbolic_match",
                    status="warn",
                    details="SymPy unavailable, symbolic derivative match skipped.",
                )
            ]
        expr = self._extract_expression_from_question(question, ("derivative of", "differentiate"))
        if not expr:
            return [
                TutorCheck(
                    name="derivative_symbolic_match",
                    status="warn",
                    details="Could not parse derivative target from question.",
                )
            ]
        try:
            x = sp.Symbol("x")
            target = self._parse_sympy_expr(expr)
            deriv = sp.diff(target, x)
        except Exception:
            return [
                TutorCheck(
                    name="derivative_symbolic_match",
                    status="warn",
                    details="Failed to compute symbolic derivative from parsed expression.",
                )
            ]
        ok = self._solution_contains_expression(text, deriv)
        return [
            TutorCheck(
                name="derivative_symbolic_match",
                status="pass" if ok else "warn",
                details=(
                    f"Expected derivative {sp.sstr(deriv)} appears in solution."
                    if ok
                    else f"Expected derivative {sp.sstr(deriv)} not detected in solution."
                ),
            )
        ]

    def _check_integral_symbolic(self, question: str, text: str) -> List[TutorCheck]:
        if sp is None:
            return [
                TutorCheck(
                    name="integral_symbolic_match",
                    status="warn",
                    details="SymPy unavailable, symbolic integral match skipped.",
                )
            ]
        expr = self._extract_expression_from_question(question, ("integral of", "integrate"))
        if not expr:
            return [
                TutorCheck(
                    name="integral_symbolic_match",
                    status="warn",
                    details="Could not parse integral target from question.",
                )
            ]
        try:
            x = sp.Symbol("x")
            target = self._parse_sympy_expr(expr)
            anti = sp.integrate(target, x)
        except Exception:
            return [
                TutorCheck(
                    name="integral_symbolic_match",
                    status="warn",
                    details="Failed to compute symbolic antiderivative from parsed expression.",
                )
            ]
        ok = self._solution_contains_expression(text, anti)
        return [
            TutorCheck(
                name="integral_symbolic_match",
                status="pass" if ok else "warn",
                details=(
                    f"Expected antiderivative {sp.sstr(anti)} appears in solution (constant omitted)."
                    if ok
                    else f"Expected antiderivative {sp.sstr(anti)} not detected in solution."
                ),
            )
        ]

    def _check_equation_roots(self, question: str, text: str) -> List[TutorCheck]:
        if sp is None:
            return [
                TutorCheck(
                    name="equation_roots_match",
                    status="warn",
                    details="SymPy unavailable, root consistency check skipped.",
                )
            ]
        expr = self._extract_equation_lhs(question)
        if not expr:
            return [
                TutorCheck(
                    name="equation_roots_match",
                    status="warn",
                    details="Could not parse solvable equation from question.",
                )
            ]
        try:
            x = sp.Symbol("x")
            roots = sp.solve(sp.Eq(self._parse_sympy_expr(expr), 0), x)
        except Exception:
            return [
                TutorCheck(
                    name="equation_roots_match",
                    status="warn",
                    details="Failed to compute symbolic roots from parsed equation.",
                )
            ]
        if not roots:
            return [
                TutorCheck(
                    name="equation_roots_match",
                    status="warn",
                    details="Equation appears to have no symbolic roots.",
                )
            ]
        extracted = self._extract_numeric_values(text)
        expected = []
        for root in roots:
            if root.is_real:
                try:
                    expected.append(float(root.evalf()))
                except Exception:
                    pass
        if not expected:
            return [
                TutorCheck(
                    name="equation_roots_match",
                    status="warn",
                    details="Roots are non-real or unparsable for numeric comparison.",
                )
            ]
        missing = [
            r for r in expected if not any(abs(r - v) < 1e-3 for v in extracted)
        ]
        ok = len(missing) == 0
        return [
            TutorCheck(
                name="equation_roots_match",
                status="pass" if ok else "warn",
                details=(
                    "All expected real roots are present in solution."
                    if ok
                    else f"Missing expected roots: {', '.join(f'{m:.3g}' for m in missing)}"
                ),
            )
        ]

    @staticmethod
    def _extract_expression_from_question(question: str, prefixes: tuple[str, ...]) -> Optional[str]:
        q = (question or "").lower().replace("^", "**")
        for prefix in prefixes:
            idx = q.find(prefix)
            if idx != -1:
                expr = q[idx + len(prefix):].strip(" :?.!")
                expr = expr.replace("with respect to x", "").replace("w.r.t. x", "").strip()
                if expr:
                    return expr
        return None

    @staticmethod
    def _extract_equation_lhs(question: str) -> Optional[str]:
        q = (question or "").lower().replace("^", "**")
        match = re.search(r"solve\s+(.+?)\s*=\s*0", q)
        if match:
            return match.group(1).strip()
        match = re.search(r"roots?\s+of\s+(.+)", q)
        if match:
            expr = match.group(1).strip(" ?.!")
            return expr.replace("= 0", "").strip()
        return None

    @staticmethod
    def _extract_numeric_values(text: str) -> List[float]:
        vals = []
        for token in re.findall(r"-?\d+(?:\.\d+)?", text or ""):
            try:
                vals.append(float(token))
            except ValueError:
                continue
        return vals

    @staticmethod
    def _solution_contains_expression(solution: str, expr) -> bool:
        raw = solution or ""
        normalized = re.sub(r"\s+", "", raw.lower())
        candidates = {
            str(expr),
            str(expr).replace("**", "^"),
            str(expr).replace("*", ""),
        }
        if sp is not None:
            try:
                candidates.add(sp.latex(expr))
            except Exception:
                pass
        for cand in candidates:
            c = re.sub(r"\s+", "", cand.lower())
            if not c:
                continue
            if c in normalized:
                return True
            if c.replace("*", "") in normalized:
                return True
        return False

    @staticmethod
    def _parse_sympy_expr(expr: str):
        cleaned = (expr or "").strip()
        cleaned = cleaned.replace("^", "**")
        if sp is None:
            raise ValueError("SymPy is unavailable")
        transformations = standard_transformations + (
            implicit_multiplication_application,
            convert_xor,
        )
        return parse_expr(cleaned, transformations=transformations)
