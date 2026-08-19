"""Dynamic Manim animation pipeline.

Generates 3Blue1Brown-style animations from natural-language prompts using:
1. Heuristic template matching for known math topics (fast, reliable)
2. A lightweight scene-planning pass for novel topics — ask the LLM to
   sequence a handful of "beats" (what appears, how long) *before* asking it
   to also write correct Python, so a small local model isn't doing
   pedagogy and code generation in the same breath
3. LLM-driven code generation for novel topics, guided by that plan, a
   level-appropriate framing, and a known-good worked example
4. Static validation — including a LaTeX brace-balance check — before
   paying for an expensive render
5. Sandboxed rendering via the existing VisualizationExecutor
6. Iterative error recovery (feed render errors back to LLM for fix)

The plan step and few-shot example are adapted from two references: the
staged "reasoning-first" pipeline in HarleyCoops/Math-To-Manim (parse intent
-> sequence curriculum -> plan visuals -> compose -> validate -> repair), and
the "Manimator" paper's scene-description-then-codegen split and role-played
few-shot prompting (arXiv:2507.14306). Both assume a strong model can afford
several large LLM calls; this app also has to work well on a 1.5B CPU model,
so the plan step is a single short, optional, best-effort call — if it
fails or the model is too weak to produce usable JSON, generation proceeds
without a plan exactly as it did before, and the caller never blocks on it.

Originally inspired by the Hermes Agent manim-video skill:
https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/manim-video
"""

import ast
import json
import re
import textwrap
from typing import Optional, Tuple

from ..logging_config import logger
from ..models import VisualizationPayload
from .engine import LocalLLMEngine
from .executor import VisualizationExecutor
from .manim_templates import (
    SCENE_PREAMBLE,
    TOPIC_TEMPLATE_MAP,
    build_generic_scene,
    fill_template,
)
from .prompts import LEVEL_INSTRUCTIONS

_TOPIC_KEYWORDS: list[Tuple[list[str], str]] = [
    (["derivative", "tangent", "slope", "differentiat"], "derivative"),
    (["integral", "area under", "antiderivative", "riemann"], "integral"),
    (["pythagor", "right triangle", "hypotenuse"], "pythagorean"),
    (["euler identity", "euler's identity", "e^i", "e^(i"], "euler_identity"),
    (["taylor", "maclaurin", "series expansion", "power series"], "taylor"),
    (["fibonacci", "fib sequence"], "fibonacci"),
    (["golden ratio", "phi", "golden spiral"], "golden_ratio"),
    (["linear transform", "matrix transform", "eigenvect", "eigenval"], "linear_transform"),
    (["fourier", "harmonic", "square wave"], "fourier"),
    (["normal distribut", "gaussian", "bell curve", "standard deviation"], "normal_dist"),
    (["complex number", "imaginary", "argand", "complex plane"], "complex"),
    (["unit circle", "trigonometr", "sin(", "cos(", "sine", "cosine"], "trig"),
    (["vector", "dot product", "cross product"], "vector"),
    (["limit", "lim ", "approach", "epsilon delta"], "limit"),
]

MAX_RETRIES = 2

# Modules LLM-generated scenes may import; anything else is rejected
# before we pay for a Manim render.
ALLOWED_IMPORT_ROOTS = {"manim", "numpy", "math", "random"}


CODEGEN_SYSTEM_PROMPT = textwrap.dedent("""\
You are an expert Manim CE (Community Edition) developer who creates
3Blue1Brown-style mathematical animations.  You write clean, working
Python code that uses the `manim` library.

RULES — follow every one:
1. Output ONLY valid Python. No markdown fences, no commentary.
2. The scene class MUST be named `GeneratedScene` and inherit from `Scene`.
3. Always set `self.camera.background_color = "#1C1C1C"`.
4. Use `Text(…, font=MONO)` for all text (define MONO="DejaVu Sans Mono" at top).
5. Use `MathTex(r"…")` (raw strings) for all LaTeX.
6. Add `self.wait()` after every major animation.
7. End the scene with `self.play(FadeOut(Group(*self.mobjects)))`.
8. Keep the animation under 15 seconds total.
9. Do NOT import anything except `from manim import *` and `import numpy as np`.
10. Use these color constants: PRIMARY="#58C4DD", SECONDARY="#83C167",
    ACCENT="#FFFF00", HIGHLIGHT="#FF6B6B", DIM="#888888".
11. Keep every title/label under ~35 characters so it fits an 854px frame at
    default font size. For a longer title, split it into two shorter Text()
    lines stacked with `.arrange(DOWN)`, or call `.scale_to_fit_width(12.5)`
    on the title mobject right after creating it — never leave a long title
    unscaled to run off the left/right edges.

CREATIVE STANDARDS (from 3Blue1Brown):
- Geometry before algebra: show the shape first, the equation second.
- Opacity layering: primary elements at 1.0, context at 0.4, grid/axes at 0.15.
- Breathing room: self.wait(1.5) minimum after showing something new.
- One new idea per scene. Progressive disclosure.
- buff >= 0.5 for edge text positioning.
- No more than 5-6 elements visible at once.
- The geometry must be invented fresh for THIS topic. A number line, a grid
  of remainders, a clock face, points on a circle, or arrows between two sets
  are all fair game — reach for whatever shape actually represents the idea,
  even if it takes some invention for an abstract topic.

WORKED EXAMPLE — this is the Pythagorean theorem, shown ONLY so you can see
the STYLE conventions to follow: code structure, self.camera setup, color
constants, opacity layering, pacing (self.wait after each beat), and the
geometry-before-equation ordering. It is NOT a template for what to draw.
Do not reuse this triangle, these squares, or the labels a/b/c — draw
whatever shape actually represents YOUR topic instead, even if that means
inventing a new kind of diagram this example doesn't show:
```python
{fewshot_example}
```
""")

CODEGEN_PROMPT_TEMPLATE = textwrap.dedent("""\
{level_instruction}Write a Manim CE scene that animates the following mathematical concept:

TOPIC: {topic}

CONTEXT (from the tutor):
{context}
{plan_block}
Requirements:
- Show geometry/visuals BEFORE equations
- Use smooth animations (Write, Create, FadeIn, Transform)
- Label important elements clearly
- Animate at least one moving/transforming element
- Draw geometry specific to TOPIC above — not the worked example's triangle
- Keep the title under ~35 characters or split/scale it to fit the frame

Output the complete Python script (class GeneratedScene(Scene)).
""")

# ---------------------------------------------------------------------------
# Scene planning — a short, optional reasoning pass before code generation.
#
# Asking a small local model to sequence a lesson AND write correct Python in
# one completion tends to produce code that either has the pedagogy right or
# the syntax right, rarely both. Splitting "what happens, in what order" into
# its own short JSON call gives the model a much narrower job to do at each
# step, matching Math-To-Manim's separation of curriculum/visual planning
# from Manim composition — kept to one cheap call, not that project's full
# multi-agent pipeline, since this also has to run on CPU-only local models.
# ---------------------------------------------------------------------------

PLAN_SYSTEM_PROMPT = textwrap.dedent("""\
You are a math teacher storyboarding a short animation, not writing code yet.
Output ONLY a JSON object, no markdown fences, no commentary, shaped exactly like:
{
  "beats": [
    {"shows": "short description of what appears or happens", "seconds": 2.5},
    {"shows": "...", "seconds": 2.5}
  ],
  "key_equation": "the single most important equation, in LaTeX, or empty string",
  "metaphor": "one concrete, everyday comparison for this concept, or empty string"
}
Rules: 3 to 6 beats. Beats must build in teaching order — the thing the
learner needs to understand FIRST comes first (usually a picture/shape
before any equation). Total seconds should be 10-14. Keep each "shows"
under 15 words.
""")

PLAN_PROMPT_TEMPLATE = textwrap.dedent("""\
{level_instruction}Storyboard a short animation for this topic: {topic}

Context from the tutor: {context}

Output the JSON plan now.
""")

FIX_PROMPT_TEMPLATE = textwrap.dedent("""\
The following Manim code failed to render.  Fix it.

CODE:
```python
{code}
```

ERROR:
{error}

Output ONLY the corrected Python code.  No commentary.
""")

# A real, already-verified scene (the "pythagorean" template, fully filled)
# used as a concrete style anchor in the codegen prompt rather than hand-authored
# prompt-only prose — few-shot grounding in the Manimator sense, but the example
# is exactly the production code this app already renders, so there's nothing
# new to keep correct.
_FEWSHOT_TEMPLATE_NAME, _FEWSHOT_PARAMS = TOPIC_TEMPLATE_MAP["pythagorean"]
FEWSHOT_EXAMPLE = fill_template(_FEWSHOT_TEMPLATE_NAME, _FEWSHOT_PARAMS).strip()


class AnimationPipeline:
    """Orchestrates dynamic Manim animation generation."""

    def __init__(self) -> None:
        self._llm = LocalLLMEngine()
        self._executor = VisualizationExecutor()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        topic: str,
        context: str = "",
        *,
        learner_level: str = "teen",
        quality: str = "low",
        output_format: str = "gif",
    ) -> Optional[VisualizationPayload]:
        """Full pipeline: plan → code → render → (retry on error) → payload.

        Returns a VisualizationPayload with viz_type=manim on success, None on failure.
        """
        logger.info(f"AnimationPipeline.generate: topic={topic!r} level={learner_level!r}")

        # Phase 1: a curated template for this topic — fast and always correct.
        # These are hand-written for a general audience already, so the level
        # only shapes the LLM path below, not the template fast path.
        code = self._heuristic_code(topic, context)
        if code is not None:
            payload = self._render_with_retry(code, topic, "template")
            if payload is not None:
                return payload

        # Phase 2: LLM codegen for novel topics (creative but unreliable on
        # small local models). Try it, but never depend on it.
        if self._llm.is_available():
            # Concept-graph disambiguation only for the LLM path — the same
            # collision risk the graph exists to prevent elsewhere (e.g.
            # "Euler's Identity" vs. planar-graph "Euler's Formula"). Kept out
            # of Phase 1's heuristic keyword match above so it can't skew
            # template routing with stray related-concept words.
            from .concept_graph import get_concept_graph

            graph_context = get_concept_graph().context_for(topic)
            llm_context = f"{context}\n\n{graph_context}".strip() if graph_context else context
            plan = self._plan_scene(topic, llm_context, learner_level)
            llm_code = self._llm_generate(topic, llm_context, learner_level, plan)
            if llm_code is not None:
                payload = self._render_with_retry(llm_code, topic, "llm")
                if payload is not None:
                    return payload

        # Phase 3: guaranteed generic fallback — a hand-written scene that always
        # renders, so the learner gets a clean visual instead of a broken one.
        logger.info("AnimationPipeline: using guaranteed generic fallback")
        generic = build_generic_scene(topic, context)
        return self._render_with_retry(generic, topic, "generic")

    # ------------------------------------------------------------------
    # Phase 1: heuristic template selection
    # ------------------------------------------------------------------

    def _heuristic_code(self, topic: str, context: str) -> Optional[str]:
        """Match topic to a known template and fill it."""
        q = (topic + " " + context).lower()

        matched_key: Optional[str] = None
        for keywords, key in _TOPIC_KEYWORDS:
            if any(kw in q for kw in keywords):
                matched_key = key
                break

        if matched_key is None:
            return None

        entry = TOPIC_TEMPLATE_MAP.get(matched_key)
        if entry is None:
            return None

        template_name, params = entry
        if not params:
            # Some templates (e.g. EULER_CIRCLE) need no params
            from .manim_templates import get_template_code
            return get_template_code(template_name)

        try:
            code = fill_template(template_name, params)
            logger.info(f"AnimationPipeline: using template '{matched_key}'")
            return code
        except Exception as exc:
            logger.error(f"Template fill failed for '{matched_key}': {exc}")
            return None

    # ------------------------------------------------------------------
    # Phase 1.5: optional scene planning (see module docstring)
    # ------------------------------------------------------------------

    def _plan_scene(self, topic: str, context: str, learner_level: str) -> Optional[dict]:
        """Ask the LLM to storyboard the scene before writing any code.

        Best-effort and cheap: short timeout, short output, and any failure
        (timeout, malformed JSON, an obviously broken shape) just means
        codegen proceeds without a plan — exactly the old behavior. Never
        raises, never blocks the pipeline on a slow/weak model.
        """
        level_instruction = LEVEL_INSTRUCTIONS.get(learner_level, LEVEL_INSTRUCTIONS["teen"])
        try:
            raw = self._llm.chat(
                [
                    {"role": "system", "content": PLAN_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": PLAN_PROMPT_TEMPLATE.format(
                            level_instruction=level_instruction, topic=topic, context=context[:500]
                        ),
                    },
                ],
                task="codegen",
                timeout_seconds=35,
                num_predict=400,
                temperature=0.4,
                json_format=True,
            )
        except Exception as exc:  # noqa: BLE001 - planning is always optional
            logger.warning(f"AnimationPipeline: scene planning call failed: {exc}")
            return None
        if not raw:
            return None

        plan = self._parse_plan(raw)
        if plan is None:
            logger.warning("AnimationPipeline: scene plan was unusable, proceeding without one")
        else:
            logger.info(f"AnimationPipeline: planned {len(plan['beats'])} beats")
        return plan

    @staticmethod
    def _parse_plan(raw: str) -> Optional[dict]:
        """Validate the plan's shape; return None (not a partial plan) if it's off."""
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
        beats = data.get("beats")
        if not isinstance(beats, list) or not (3 <= len(beats) <= 6):
            return None
        clean_beats = []
        total_seconds = 0.0
        for b in beats:
            if not isinstance(b, dict) or "shows" not in b:
                return None
            shows = str(b["shows"]).strip()[:120]
            try:
                seconds = float(b.get("seconds", 2.0))
            except (TypeError, ValueError):
                seconds = 2.0
            seconds = max(0.5, min(seconds, 6.0))
            total_seconds += seconds
            clean_beats.append({"shows": shows, "seconds": round(seconds, 1)})
        if total_seconds > 20:
            return None
        return {
            "beats": clean_beats,
            "key_equation": str(data.get("key_equation", ""))[:80],
            "metaphor": str(data.get("metaphor", ""))[:160],
        }

    @staticmethod
    def _format_plan(plan: Optional[dict]) -> str:
        if not plan:
            return ""
        lines = [f"{i+1}. {b['shows']} (~{b['seconds']}s)" for i, b in enumerate(plan["beats"])]
        block = "\nFollow this scene plan, beat by beat:\n" + "\n".join(lines)
        if plan.get("key_equation"):
            block += f"\nKey equation to end on: {plan['key_equation']}"
        if plan.get("metaphor"):
            block += f"\nMetaphor to anchor it: {plan['metaphor']}"
        return block + "\n"

    # ------------------------------------------------------------------
    # Phase 2: LLM code generation
    # ------------------------------------------------------------------

    def _llm_generate(
        self, topic: str, context: str, learner_level: str = "teen", plan: Optional[dict] = None
    ) -> Optional[str]:
        """Ask the local LLM (codegen model) to write a full Manim scene.

        One malformed response (prose instead of code, a truncated class)
        used to end the whole LLM phase immediately — the render-error retry
        loop only ever runs once code already exists, so a bad first response
        here fell straight through to the generic fallback with no second
        try. Retries once at a lower temperature before giving up, the same
        pattern used elsewhere in the pipeline (lesson.py, discovery.py).
        """
        level_instruction = LEVEL_INSTRUCTIONS.get(learner_level, LEVEL_INSTRUCTIONS["teen"])
        messages = [
            {
                "role": "system",
                "content": CODEGEN_SYSTEM_PROMPT.format(fewshot_example=FEWSHOT_EXAMPLE),
            },
            {
                "role": "user",
                "content": CODEGEN_PROMPT_TEMPLATE.format(
                    level_instruction=level_instruction,
                    topic=topic,
                    context=context[:800],
                    plan_block=self._format_plan(plan),
                ),
            },
        ]
        for attempt in range(2):
            raw = self._llm.chat(
                messages,
                task="codegen",
                timeout_seconds=90,
                num_predict=2000,
                temperature=0.3 if attempt == 0 else 0.15,
            )
            if not raw:
                logger.warning(f"AnimationPipeline: LLM returned no output (attempt {attempt + 1})")
                continue
            code = self._extract_python(raw)
            if code and "GeneratedScene" in code and "construct" in code:
                logger.info(f"AnimationPipeline: LLM generated valid-looking code (attempt {attempt + 1})")
                return code
            logger.warning(f"AnimationPipeline: LLM output did not contain GeneratedScene (attempt {attempt + 1})")

        return None

    def _llm_fix(self, code: str, error: str) -> Optional[str]:
        """Ask the LLM (codegen model) to fix broken Manim code."""
        raw = self._llm.chat(
            [
                {
                    "role": "user",
                    "content": FIX_PROMPT_TEMPLATE.format(code=code[:2000], error=error[-500:]),
                }
            ],
            task="codegen",
            timeout_seconds=60,
            num_predict=2000,
            temperature=0.2,
        )
        if not raw:
            return None
        fixed = self._extract_python(raw)
        if fixed and "GeneratedScene" in fixed and "construct" in fixed:
            return fixed
        return None

    # ------------------------------------------------------------------
    # Phase 3: render with retry
    # ------------------------------------------------------------------

    def _render_with_retry(
        self,
        code: str,
        topic: str,
        source: str,
    ) -> Optional[VisualizationPayload]:
        """Render Manim code; on failure, try LLM fix up to MAX_RETRIES times."""
        for attempt in range(1 + MAX_RETRIES):
            logger.info(f"AnimationPipeline: render attempt {attempt + 1} (source={source})")

            # Fail fast on invalid/unsafe code before paying for a render
            validation_error = self._validate_code(code)
            if validation_error:
                logger.warning(f"AnimationPipeline: validation failed: {validation_error}")
                payload, error = None, validation_error
            else:
                payload, error = self._executor.execute_manim_detailed(code, title=topic)
            if payload is not None:
                payload.data["pipeline_source"] = source
                payload.data["attempt"] = attempt + 1
                return payload

            # On failure, feed the real render error back to the LLM
            if attempt < MAX_RETRIES and self._llm.is_available():
                error_msg = error or f"Manim render failed on attempt {attempt + 1}"
                fixed = self._llm_fix(code, error_msg)
                if fixed:
                    code = fixed
                    source = f"llm_fix_{attempt + 1}"
                    continue
            break

        logger.error("AnimationPipeline: all render attempts failed")
        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_code(code: str) -> Optional[str]:
        """Static checks on generated code. Returns an error message or None.

        Catches syntax errors, disallowed imports (os, subprocess, …), and a
        missing GeneratedScene.construct before the expensive Manim render.
        """
        if not code or not code.strip():
            return "Empty code"
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            return f"SyntaxError: {exc.msg} (line {exc.lineno})"

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root = alias.name.split(".")[0]
                    if root not in ALLOWED_IMPORT_ROOTS:
                        return f"Forbidden import: {alias.name}. Only manim and numpy are allowed."
            elif isinstance(node, ast.ImportFrom):
                root = (node.module or "").split(".")[0]
                if root not in ALLOWED_IMPORT_ROOTS:
                    return f"Forbidden import: from {node.module}. Only manim and numpy are allowed."

        if "GeneratedScene" not in code:
            return "Missing class GeneratedScene(Scene)"
        if "def construct" not in code:
            return "GeneratedScene has no construct() method"

        latex_error = AnimationPipeline._validate_latex(tree)
        if latex_error:
            return latex_error
        title_error = AnimationPipeline._validate_title_width(tree)
        if title_error:
            return title_error
        return None

    @staticmethod
    def _validate_title_width(tree: ast.AST) -> Optional[str]:
        """Catch a long, unscaled Text() literal before it overflows the frame.

        An 854px-wide frame at the default font size fits roughly 35
        characters; a title longer than that with no ``font_size`` override
        runs off both edges, which is exactly the failure this exists to
        catch cheaply, the same spirit as the LaTeX brace check above.
        A ``font_size`` kwarg is treated as "the author already sized this
        down on purpose" and skipped, so this only flags the common
        inadvertent case, not every long label.
        """
        LIMIT = 40
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)):
                continue
            if node.func.id != "Text":
                continue
            if any(kw.arg == "font_size" for kw in node.keywords):
                continue
            for arg in node.args:
                if isinstance(arg, ast.Constant) and isinstance(arg.value, str) and len(arg.value) > LIMIT:
                    snippet = arg.value[:40]
                    return (
                        f"Text(\"{snippet}…\") is {len(arg.value)} chars with no font_size "
                        f"override — it will overflow the frame. Shorten it, split it across "
                        f"two Text() lines, or add font_size=28."
                    )
        return None

    @staticmethod
    def _validate_latex(tree: ast.AST) -> Optional[str]:
        """Brace-balance check on every MathTex(...)/Tex(...) string literal.

        A small model asked to write LaTeX by hand very commonly drops a
        closing brace (e.g. `r"\\frac{a}{b"`), which Manim/LaTeX only
        reports as an opaque compile failure well into an expensive render.
        Catching the unbalanced case here — cheaply, with no external LaTeX
        toolchain — is the one piece of Math-To-Manim's static LaTeX check
        this pipeline can do without shipping a LaTeX compiler.
        """
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)):
                continue
            if node.func.id not in ("MathTex", "Tex"):
                continue
            for arg in node.args:
                if not (isinstance(arg, ast.Constant) and isinstance(arg.value, str)):
                    continue
                depth = 0
                for ch in arg.value:
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth < 0:
                            break
                if depth != 0:
                    snippet = arg.value[:40]
                    return f"Unbalanced braces in {node.func.id}(r\"{snippet}…\")"
        return None

    @staticmethod
    def _extract_python(text: str) -> Optional[str]:
        """Extract Python code from LLM output, stripping markdown fences."""
        if not text:
            return None

        # Try to find fenced code block
        fence_match = re.search(
            r"```(?:python)?\s*\n(.*?)```", text, re.DOTALL
        )
        if fence_match:
            return fence_match.group(1).strip()

        # If the text already looks like Python, use it directly
        if "from manim import" in text or "class GeneratedScene" in text:
            lines = text.strip().splitlines()
            code_lines = []
            in_code = False
            for line in lines:
                if line.startswith("from manim") or line.startswith("import ") or line.startswith("class "):
                    in_code = True
                if in_code:
                    code_lines.append(line)
            if code_lines:
                return "\n".join(code_lines)

        return text.strip() if text.strip() else None
