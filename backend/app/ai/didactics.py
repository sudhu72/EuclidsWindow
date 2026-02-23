"""Utilities for structured tutor explanations and lightweight checks."""
import re
from typing import List, Optional, Tuple

from .checker import SymbolicChecker
from ..models import TutorCheck
try:
    import sympy as sp
    from sympy.parsing.sympy_parser import (
        convert_xor,
        implicit_multiplication_application,
        parse_expr,
        standard_transformations,
    )
except Exception:  # pragma: no cover
    sp = None


def build_structured_explanations(
    question: str, solution: str
) -> Tuple[str, str, List[TutorCheck], List[str]]:
    plain = _build_plain_explanation(solution)
    axiomatic = _build_axiomatic_explanation(question, solution)
    checks = _build_quality_checks(solution)
    checks.extend(SymbolicChecker().run(question, solution))
    hints = _build_improvement_hints(checks)
    return plain, axiomatic, checks, hints


def build_learning_aids(
    question: str, plain: str, checks: List[TutorCheck], learner_level: str = "teen"
) -> Tuple[List[str], List[str]]:
    q = extract_learning_focus(question)
    level = normalize_learner_level(learner_level)
    warned = [c for c in checks if c.status == "warn"]
    takeaways = _extract_takeaways(plain)
    if level == "kids":
        next_questions = [
            f"Can you explain {q} like a story with simple words?",
            f"Can you show one picture-style example for {q}?",
            f"Can you ask me 2 easy check questions for {q}?",
        ]
    elif level == "college":
        next_questions = [
            f"Can you derive the key result for {q} from first principles?",
            f"Can you give one formal example and one counterexample for {q}?",
            f"Can you test me with a proof-oriented question on {q}?",
        ]
    elif level == "adult":
        next_questions = [
            f"Can you explain {q} with one real-world application?",
            f"Can you show a worked example for {q} using practical numbers?",
            f"Can you give a quick self-check quiz on {q}?",
        ]
    else:
        next_questions = [
            f"Can you explain {q} in simpler words with one analogy?",
            f"Can you show one worked example for {q}?",
            f"Can you give me a 2-question quiz on {q}?",
        ]
    if warned:
        next_questions.insert(0, f"I am still confused about {q}. Can we go one step at a time?")
    if "eigen" in q.lower():
        next_questions.append("Can you show how Av=lambda v appears geometrically?")
    return takeaways, next_questions[:5]


def extract_learning_focus(question: str) -> str:
    text = (question or "").strip()
    if not text:
        return "this topic"
    text = re.sub(r"\s+", " ", text).strip(" ?!.")

    # Remove recursively stacked prompt wrappers such as
    # "Can you explain Can you show ... for Explain X ... ?"
    for _ in range(4):
        lowered = text.lower()
        prefixes = [
            "i am still confused about ",
            "can you explain ",
            "can you show ",
            "can you give me ",
            "can you ask me ",
            "can you derive ",
            "can you test me ",
            "could you explain ",
            "please explain ",
            "explain ",
            "show ",
            "give me ",
            "ask me ",
            "derive ",
            "test me ",
        ]
        matched = False
        for prefix in prefixes:
            if lowered.startswith(prefix):
                text = text[len(prefix):].strip(" ?!.,:")
                matched = True
                break
        if not matched:
            break

    # If the sentence is a template wrapper, keep only the concept after the wrapper token.
    lowered = text.lower()
    for token in (" for ", " on ", " about "):
        idx = lowered.rfind(token)
        if idx != -1 and idx + len(token) < len(text):
            candidate = text[idx + len(token):].strip(" ?!.,:")
            if len(candidate) >= 6:
                text = candidate
                lowered = text.lower()
                break

    # Remove common instructional suffixes to keep the core concept.
    suffixes = (
        "in simpler words with one analogy",
        "with one analogy",
        "using practical numbers",
        "with one real-world application",
        "from first principles",
        "step by step",
    )
    for suffix in suffixes:
        if lowered.endswith(suffix):
            text = text[: -len(suffix)].strip(" ?!.,:")
            lowered = text.lower()

    text = re.sub(r"\s+", " ", text).strip(" ?!.")
    return text or "this topic"


def adapt_plain_for_learner_level(plain: str, learner_level: str, question: str) -> str:
    level = normalize_learner_level(learner_level)
    q = (question or "this topic").strip()
    body = (plain or "").strip()
    if level == "kids":
        return (
            f"Kid-friendly mode for **{q}**:\n"
            "- We use very simple words.\n"
            "- We connect ideas to everyday objects.\n"
            "- We do one tiny step at a time.\n\n"
            f"{body}"
        ).strip()
    if level == "college":
        return (
            f"College mode for **{q}**:\n"
            "- Keep formal notation and definitions precise.\n"
            "- Include assumptions and concise derivations.\n\n"
            f"{body}"
        ).strip()
    if level == "adult":
        return (
            f"Adult learner mode for **{q}**:\n"
            "- Focus on intuition first, then formula.\n"
            "- Connect each step to practical interpretation.\n\n"
            f"{body}"
        ).strip()
    return body


def normalize_learner_level(level: str) -> str:
    value = (level or "").strip().lower()
    if value in {"kids", "teen", "college", "adult"}:
        return value
    return "teen"


def compose_solution_for_mode(mode: str, plain: str, axiomatic: str) -> str:
    if mode == "plain":
        return plain
    if mode == "axiomatic":
        return axiomatic
    return f"{plain}\n\n---\n\n{axiomatic}".strip()


def build_self_correction(question: str, checks: List[TutorCheck]) -> Optional[str]:
    warned = {c.name for c in checks if c.status == "warn"}
    if not warned:
        return None
    q = (question or "").lower()

    if "derivative_symbolic_match" in warned:
        expr = _extract_expression_from_question(q, ("derivative of", "differentiate"))
        deriv = _safe_diff(expr)
        if expr and deriv:
            return (
                "Self-correction:\n"
                f"Differentiate \\({expr}\\) term-by-term.\n"
                f"Correct derivative: \\({deriv}\\)."
            )

    if "integral_symbolic_match" in warned:
        expr = _extract_expression_from_question(q, ("integral of", "integrate"))
        anti = _safe_integrate(expr)
        if expr and anti:
            return (
                "Self-correction:\n"
                f"Integrate \\({expr}\\) term-by-term.\n"
                f"Correct antiderivative: \\({anti} + C\\)."
            )

    if "equation_roots_match" in warned:
        expr = _extract_equation_lhs(q)
        roots = _safe_roots(expr)
        if roots:
            roots_text = ", ".join(str(r) for r in roots)
            return (
                "Self-correction:\n"
                f"Solve \\({expr}=0\\) and verify by substitution.\n"
                f"Expected roots: \\({roots_text}\\)."
            )

    if any(name.startswith("eigen_") for name in warned):
        return (
            "Self-correction:\n"
            "For eigen problems, include both conditions:\n"
            "1) \\(A\\mathbf{v}=\\lambda\\mathbf{v}\\)\n"
            "2) \\(\\det(A-\\lambda I)=0\\)."
        )

    return "Self-correction: Re-state assumptions, show one verified step, and recompute the final result."


def _build_plain_explanation(solution: str) -> str:
    text = (solution or "").strip()
    if not text:
        return "I could not generate a full explanation yet."
    return text


def _build_axiomatic_explanation(question: str, solution: str) -> str:
    q = (question or "").lower()
    body = (solution or "").strip()
    if "eigen" in q:
        return (
            "Axiomatic view:\n"
            "1. Definition: For a linear map represented by matrix \\(A\\), an eigenvector \\(v \\neq 0\\) satisfies "
            "\\(A\\mathbf{v}=\\lambda\\mathbf{v}\\).\n"
            "2. Existence condition: Non-trivial \\(v\\) exists only when \\(\\det(A-\\lambda I)=0\\).\n"
            "3. Construction: For each root \\(\\lambda\\), solve \\((A-\\lambda I)\\mathbf{v}=0\\).\n"
            "4. Interpretation: Eigenvectors are invariant directions under the map."
        )
    return (
        "Axiomatic view:\n"
        "1. State the core definitions and symbols first.\n"
        "2. List assumptions/conditions where the statement holds.\n"
        "3. Derive the result step-by-step from definitions.\n"
        "4. Conclude with the formal statement and scope.\n\n"
        f"Reference explanation:\n{body[:600]}"
    )


def _build_quality_checks(solution: str) -> List[TutorCheck]:
    checks: List[TutorCheck] = []
    text = (solution or "").strip()
    checks.append(
        TutorCheck(
            name="non_empty_explanation",
            status="pass" if len(text) > 30 else "warn",
            details="Explanation length is sufficient." if len(text) > 30 else "Explanation is too short.",
        )
    )
    has_math = bool(re.search(r"(\\\(|\\\[|\$|=)", text))
    checks.append(
        TutorCheck(
            name="contains_math_notation",
            status="pass" if has_math else "warn",
            details="Includes mathematical notation." if has_math else "No explicit mathematical notation detected.",
        )
    )
    has_examples = "example" in text.lower()
    checks.append(
        TutorCheck(
            name="includes_examples",
            status="pass" if has_examples else "warn",
            details="Contains at least one worked example section." if has_examples else "No explicit examples section found.",
        )
    )
    return checks


def _build_improvement_hints(checks: List[TutorCheck]) -> List[str]:
    hints: List[str] = []
    for check in checks:
        if check.status != "warn":
            continue
        if check.name in {"includes_examples"}:
            hints.append("Add 1-2 concrete worked examples with numbers.")
        elif check.name in {"contains_math_notation"}:
            hints.append("Include the key equation and define each symbol.")
        elif check.name in {"derivative_symbolic_match", "integral_symbolic_match"}:
            hints.append("Re-check symbolic steps and ensure final expression is simplified.")
        elif check.name in {"equation_roots_match"}:
            hints.append("Verify roots by substitution back into the original equation.")
        elif check.name.startswith("eigen_"):
            hints.append("Include both Av=lambda v and det(A-lambda I)=0 for completeness.")
        else:
            hints.append("Clarify assumptions and provide a concise verification step.")
    # Keep hints concise and unique.
    deduped = []
    for hint in hints:
        if hint not in deduped:
            deduped.append(hint)
    return deduped[:4]


def _extract_takeaways(text: str) -> List[str]:
    lines = [ln.strip(" -•\t") for ln in (text or "").splitlines() if ln.strip()]
    bullets = []
    for ln in lines:
        if len(ln) < 18:
            continue
        if ln.lower().startswith(("example", "self-correction", "axiomatic")):
            continue
        bullets.append(ln)
        if len(bullets) >= 3:
            break
    if not bullets:
        return ["Focus on the main equation, one worked example, and one intuition sentence."]
    return bullets


def _extract_expression_from_question(question: str, prefixes: tuple[str, ...]) -> Optional[str]:
    for prefix in prefixes:
        idx = question.find(prefix)
        if idx != -1:
            expr = question[idx + len(prefix):].strip(" :?.!")
            expr = expr.replace("with respect to x", "").replace("w.r.t. x", "").strip()
            if expr:
                return expr
    return None


def _extract_equation_lhs(question: str) -> Optional[str]:
    q = question.replace("^", "**")
    match = re.search(r"solve\s+(.+?)\s*=\s*0", q)
    if match:
        return match.group(1).strip()
    return None


def _parse_expr(expr: str):
    if sp is None or not expr:
        return None
    transformations = standard_transformations + (implicit_multiplication_application, convert_xor)
    return parse_expr(expr.replace("^", "**"), transformations=transformations)


def _safe_diff(expr: Optional[str]) -> Optional[str]:
    try:
        parsed = _parse_expr(expr or "")
        if parsed is None:
            return None
        x = sp.Symbol("x")
        return sp.sstr(sp.diff(parsed, x))
    except Exception:
        return None


def _safe_integrate(expr: Optional[str]) -> Optional[str]:
    try:
        parsed = _parse_expr(expr or "")
        if parsed is None:
            return None
        x = sp.Symbol("x")
        return sp.sstr(sp.integrate(parsed, x))
    except Exception:
        return None


def _safe_roots(expr: Optional[str]) -> Optional[List[str]]:
    try:
        parsed = _parse_expr(expr or "")
        if parsed is None:
            return None
        x = sp.Symbol("x")
        roots = sp.solve(sp.Eq(parsed, 0), x)
        if not roots:
            return None
        return [sp.sstr(r) for r in roots]
    except Exception:
        return None
