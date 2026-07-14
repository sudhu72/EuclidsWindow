"""Solver–verifier layer for coach feedback.

After the Pólya coach (the *solver*) drafts feedback and a hint, an
independent *verifier* pass attacks the mathematical claims with fresh
context — it sees only the problem, the student's work, and the claims,
never the solver's reasoning. Disagreement triggers exactly one
reconciliation round; agreement returns immediately (debate only on
disagreement, so most turns cost a single extra call).

SymPy acts as the grounded arbiter: simple equations found in the hint are
checked by computer algebra, and a provably false equation overrides an
LLM endorsement.
"""
import re
from typing import Any, Dict, List, Optional, Tuple

from ..logging_config import logger

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

VERIFIER_SYSTEM_PROMPT = (
    "You are an independent mathematics reviewer, paid to find errors. You "
    "are given a problem, a student's work, and a coach's feedback and hint. "
    "Judge ONLY the mathematical claims in the feedback and hint — not tone "
    "or pedagogy. A claim is wrong if it states false mathematics, describes "
    "an impossible construction, or misidentifies where the student erred.\n"
    "Respond with JSON only:\n"
    "{\n"
    '  "verdict": "endorse" or "challenge",\n'
    '  "issues": ["each mathematically wrong claim, quoted, with why it is wrong"],\n'
    '  "severity": "minor" or "major"\n'
    "}\n"
    "Endorse when every mathematical claim is correct. Challenge only for "
    "genuine mathematical errors, not stylistic preferences."
)

RECONCILE_INSTRUCTION = (
    "An independent reviewer checked your feedback and raised these objections:\n"
    "{issues}\n"
    "{sympy_note}"
    "Revise your response: fix every genuinely wrong mathematical claim, keep "
    "everything that is correct, and do not reveal the full solution. Output "
    "the same JSON shape as before."
)

_OPERATOR_TOKEN = re.compile(r"^[+\-*/^()]+$")
_MATH_TOKEN = re.compile(r"^[+\-*/^()]*[0-9a-zA-Z][0-9a-zA-Z+\-*/^().]*$")


def _is_mathish(token: str) -> bool:
    """A token that can belong to an equation side: operators, numbers,
    digit-anchored variable products like 2ab or 14n — but never prose.

    Conservative on purpose: a pure-letter token longer than one character
    ('So', 'is', but also 'ab') is treated as prose, because a wrong verdict
    from the arbiter is worse than a skipped equation."""
    if _OPERATOR_TOKEN.match(token):
        return True
    if not _MATH_TOKEN.match(token):
        return False
    # Standard function names are math, not prose
    stripped = re.sub(r"(?:sqrt|sin|cos|tan|exp|log|ln|abs)", "", token)
    if re.search(r"[a-zA-Z]{3,}", stripped):
        return False
    letters_only = re.sub(r"[^a-zA-Z]", "", token)
    if len(letters_only) >= 2 and re.fullmatch(r"[a-zA-Z]+", token):
        return False
    return True


def _trim_side(tokens: List[str], keep: str) -> str:
    """Keep the maximal mathish run adjacent to the '=' sign.

    keep='tail' for the left side (math ends at '='), keep='head' for the
    right side (math starts at '='). Prose words break the run.
    """
    run: List[str] = []
    ordered = reversed(tokens) if keep == "tail" else tokens
    for tok in ordered:
        if _is_mathish(tok):
            run.append(tok)
        else:
            break
    if keep == "tail":
        run.reverse()
    # An equation side shouldn't begin or end with a dangling operator
    while run and _OPERATOR_TOKEN.match(run[0]) and run[0] not in ("(",):
        run.pop(0)
    while run and _OPERATOR_TOKEN.match(run[-1]) and run[-1] not in (")",):
        run.pop()
    return " ".join(run)


def check_equations(text: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Verify simple ASCII equations in text with SymPy.

    Sentence-splits, takes the maximal math-token run on each side of a
    single '=', and checks lhs == rhs symbolically (falling back to sampling
    distinct values per symbol). Anything unparseable is skipped — the
    arbiter only speaks when it is sure.
    """
    if sp is None or not text:
        return []
    transformations = standard_transformations + (
        implicit_multiplication_application,
        convert_xor,
    )
    results: List[Dict[str, Any]] = []
    for sentence in re.split(r"[.;:\n]+(?=\s|$)", text):
        sentence = sentence.replace(",", " ")  # commas glue to numbers otherwise
        if len(results) >= limit or sentence.count("=") != 1:
            continue
        left_raw, right_raw = sentence.split("=")
        lhs_raw = _trim_side(left_raw.split(), keep="tail")
        rhs_raw = _trim_side(right_raw.split(), keep="head")
        if not lhs_raw or not rhs_raw:
            continue
        # "x = 2" is a definition, not a checkable claim
        if not any(op in lhs_raw for op in "+-*/^(") and not any(op in rhs_raw for op in "+-*/^("):
            continue
        try:
            lhs = parse_expr(lhs_raw.replace("^", "**"), transformations=transformations)
            rhs = parse_expr(rhs_raw.replace("^", "**"), transformations=transformations)
            diff = sp.simplify(lhs - rhs)
            if diff == 0:
                holds = True
            elif diff.free_symbols:
                symbols = sorted(diff.free_symbols, key=str)
                holds = True
                for base in (2, 3, 7):
                    subs = {s: base + i for i, s in enumerate(symbols)}
                    if abs(complex(diff.subs(subs))) >= 1e-9:
                        holds = False
                        break
            else:
                holds = abs(complex(diff)) < 1e-9
        except Exception:
            continue
        results.append({"equation": f"{lhs_raw} = {rhs_raw}", "holds": bool(holds)})
    return results


class VerifierService:
    """Independent verification of coach output, with SymPy arbitration."""

    def __init__(self, engine) -> None:
        self._engine = engine

    def review(
        self,
        problem: str,
        student_input: str,
        solver_output: Dict[str, Any],
        *,
        task: str,
        timeout_seconds: int,
    ) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """Return (verdict, issues, sympy_results); verdict is endorse/challenge."""
        feedback = str(solver_output.get("feedback") or "")
        hint = str(solver_output.get("hint") or "")

        # Grounded arbiter: equations asserted in the HINT must actually hold.
        sympy_results = check_equations(hint)
        false_eqs = [r for r in sympy_results if not r["holds"]]

        claims = f"Coach feedback: {feedback}\n"
        if hint:
            claims += f"Coach hint: {hint}\n"
        sympy_note = ""
        if sympy_results:
            lines = [f"  '{r['equation']}' -> {'TRUE' if r['holds'] else 'FALSE'}" for r in sympy_results]
            sympy_note = "Computer-algebra check of equations in the claims:\n" + "\n".join(lines) + "\n"

        raw = self._engine.chat_json(
            [
                {"role": "system", "content": VERIFIER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"The problem:\n{problem[:600]}\n\n"
                        f"The student's work:\n{student_input[:800]}\n\n"
                        f"{sympy_note}"
                        f"The claims to review:\n{claims}"
                    ),
                },
            ],
            task=task,
            timeout_seconds=timeout_seconds,
            num_predict=600,
            num_ctx=4096,
            temperature=0.2,
        )
        issues: List[str] = []
        if raw:
            verdict = "challenge" if str(raw.get("verdict", "")).lower() == "challenge" else "endorse"
            raw_issues = raw.get("issues")
            if isinstance(raw_issues, list):
                issues = [str(i) for i in raw_issues if str(i).strip()][:4]
        else:
            # No reviewer output is NOT an endorsement — the coach reply goes
            # out unverified (no badge), unless SymPy has a definite objection.
            logger.warning("Verifier produced no output; response will be unverified")
            verdict = "unverified"

        # SymPy overrides an LLM endorsement: a provably false hint equation
        # is a challenge regardless of what the reviewer model thought.
        if false_eqs:
            verdict = "challenge"
            for r in false_eqs:
                issues.append(
                    f"The equation '{r['equation']}' is false (verified by computer algebra)."
                )
        return verdict, issues, sympy_results

    def reconcile(
        self,
        solver_messages: List[Dict[str, str]],
        solver_output: Dict[str, Any],
        issues: List[str],
        sympy_results: List[Dict[str, Any]],
        *,
        task: str,
        timeout_seconds: int,
        num_predict: int,
        num_ctx: int,
    ) -> Optional[Dict[str, Any]]:
        """One debate round: solver revises in light of the verifier's objections."""
        sympy_note = ""
        false_eqs = [r for r in sympy_results if not r["holds"]]
        if false_eqs:
            sympy_note = (
                "Computer algebra confirms these equations are FALSE: "
                + "; ".join(r["equation"] for r in false_eqs)
                + ".\n"
            )
        import json as _json

        messages = solver_messages + [
            {"role": "assistant", "content": _json.dumps(solver_output)[:1500]},
            {
                "role": "user",
                "content": RECONCILE_INSTRUCTION.format(
                    issues="\n".join(f"- {i}" for i in issues[:4]),
                    sympy_note=sympy_note,
                ),
            },
        ]
        return self._engine.chat_json(
            messages,
            task=task,
            timeout_seconds=timeout_seconds,
            num_predict=num_predict,
            num_ctx=num_ctx,
            temperature=0.3,
        )
