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

MAX_RETRIES = 3

# Modules LLM-generated scenes may import; anything else is rejected
# before we pay for a Manim render.
ALLOWED_IMPORT_ROOTS = {"manim", "numpy", "math", "random"}

# Shared between _validate_matrix_overlap and the matrix branch of
# _validate_text_anchor — a LaTeX matrix environment, however it's used.
MATRIX_ENV_RE = re.compile(r"\\begin\{[bpvB]?matrix\}")


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
12. NEVER use `SVGMobject`, `ImageMobject`, or any other class that loads a
    file from disk — there are no asset files in this sandbox and the render
    will fail. Build every shape from Manim's built-in primitives (Circle,
    Square, Line, Arrow, Dot, Polygon, Text, MathTex, NumberLine, Axes, …).
13. Never place a new title or heading at the same position as one already
    on screen (e.g. a second `.to_edge(UP)` text while the first is still
    showing) — that stacks them into unreadable overlapping text. Before
    introducing a new heading, either `self.play(FadeOut(old_title))` or
    `self.play(Transform(old_title, new_title))` first. The same rule
    applies to any other mobject a later beat replaces: fade or remove it,
    don't just add the new one on top.
14. Before finishing, re-check that every opening parenthesis and bracket
    you wrote has a matching close — a `VGroup` built from a list
    comprehension or a long chain of `.to_edge()`/`.next_to()` calls is the
    most common place a closing bracket gets silently dropped.
15. Keep any sentence-length text (more than a few words) horizontally
    centered or anchored to a fixed screen position (e.g. `.to_edge(DOWN)`)
    — never `.next_to()` a specific shape/label for a long sentence, since
    if that shape sits near an edge the text will run off-frame with it.
    `.next_to()` is fine for short labels (a number, a single word).
16. Show at most ONE representation of a matrix at a time — a `Matrix(...)`
    mobject or a bracket-notation `MathTex` is a self-contained visual;
    never draw a second matrix (bracket notation, a grid of labeled
    entries, anything else) in the same region while the first is still on
    screen. Fade out or remove the first before showing the second, or
    `Transform` one into the other — the same rule as headings above,
    applied to matrices specifically since they're dense enough that two
    overlapping ones become unreadable immediately. Also never position a
    matrix with `.next_to(some_label, DOWN)` — if that label is already
    near an edge (e.g. placed with `.to_edge(DOWN)`), the matrix inherits
    that position and runs off-frame. Anchor a matrix directly instead:
    `.move_to(ORIGIN)`, or `.to_edge(DOWN)` on the matrix itself, never
    relative to another mobject's position.

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

TWO WORKED EXAMPLES — the Pythagorean theorem (static polygon geometry) and
a derivative (an animated coordinate-plane curve). They are shown ONLY so
you can see the STYLE conventions to follow: code structure, self.camera
setup, color constants, opacity layering, pacing (self.wait after each
beat), and geometry-before-equation ordering. Notice they draw completely
different kinds of shapes for completely different topics — that's the
point: NEITHER is a template for what to draw. Do not reuse this triangle,
these squares, the labels a/b/c, this coordinate axes, or this curve —
draw whatever shape actually represents YOUR topic instead, even if that
means inventing a new kind of diagram neither example shows.

Example 1 — Pythagorean theorem:
```python
{fewshot_example}
```

Example 2 — a derivative:
```python
{fewshot_example_2}
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
- Build shapes from Manim primitives only — never SVGMobject/ImageMobject
- Fade or remove any heading/element before a later beat replaces it — never
  stack a new title on top of one still on screen
- Double-check every bracket you open is closed before finishing
- Anchor sentence-length text to a fixed position, not .next_to() a shape
- Only one matrix representation on screen at a time — fade/remove or
  Transform the first before showing a second
- Anchor a matrix to a fixed position directly, not .next_to() a label

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

Before returning, re-check every opening ``(``, ``[``, and ``{{`` in the
whole file has a matching close — nested calls (a VGroup built from a list
comprehension, a chain of .to_edge()/.next_to() calls) are the most common
place a closing bracket gets dropped. Return the COMPLETE corrected file,
not just the changed lines.

CODE:
```python
{code}
```

ERROR:
{error}

Output ONLY the corrected Python code.  No commentary.
""")

# Two real, already-verified scenes (fully filled templates) used as concrete
# style anchors in the codegen prompt rather than hand-authored prompt-only
# prose — few-shot grounding in the Manimator sense, but the examples are
# exactly the production code this app already renders, so there's nothing
# new to keep correct.
#
# Deliberately TWO, structurally unrelated examples (static polygon geometry
# vs. an animated coordinate-plane curve), not one: a single example was
# observed being copied wholesale onto unrelated topics with no obvious
# shape of their own (a right triangle with a/b/c labels, rendered for a
# question about the Jacobian matrix) — no amount of "this is style, not
# content" prose reliably stopped that on a small model. Two contrasting
# examples make the style/content distinction something the model can see
# rather than just be told, since neither one's literal shapes could
# possibly be "the" answer for a third, different topic.
_FEWSHOT_TEMPLATE_NAME, _FEWSHOT_PARAMS = TOPIC_TEMPLATE_MAP["pythagorean"]
FEWSHOT_EXAMPLE = fill_template(_FEWSHOT_TEMPLATE_NAME, _FEWSHOT_PARAMS).strip()

_FEWSHOT_TEMPLATE_NAME_2, _FEWSHOT_PARAMS_2 = TOPIC_TEMPLATE_MAP["derivative"]
FEWSHOT_EXAMPLE_2 = fill_template(_FEWSHOT_TEMPLATE_NAME_2, _FEWSHOT_PARAMS_2).strip()


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

        num_predict=800 (was 400): the same max_tokens-caps-thinking issue
        fixed in _llm_generate applies here too — an abstract topic can burn
        this smaller budget on Claude's default thinking with nothing left
        for the actual JSON, silently discarding the plan more often than
        intended on exactly the topics it would help most. Kept well below
        codegen's budget on purpose — this stays the cheap, best-effort call
        it's designed to be, not a second full generation.
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
                timeout_seconds=45,
                num_predict=800,
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

        num_predict=3500 (was 2000): current Claude models think by default,
        and num_predict caps that thinking on this app's Anthropic path (see
        providers.py's _anthropic_chat) — for a topic with no obvious simple
        shape (e.g. the Jacobian matrix), Claude has been observed spending
        the *entire* 2000-token budget thinking and returning zero text,
        which silently falls back to local Ollama and its weaker output.
        Same fix as discovery.py's reasoning-model budget bump, applied here
        for the same reason.
        """
        level_instruction = LEVEL_INSTRUCTIONS.get(learner_level, LEVEL_INSTRUCTIONS["teen"])
        messages = [
            {
                "role": "system",
                "content": CODEGEN_SYSTEM_PROMPT.format(
                    fewshot_example=FEWSHOT_EXAMPLE, fewshot_example_2=FEWSHOT_EXAMPLE_2
                ),
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
                timeout_seconds=120,
                num_predict=3500,
                num_ctx=8192,  # two fewshot examples + instructions need headroom
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
        """Ask the LLM (codegen model) to fix broken Manim code.

        ``code[:2000]`` characters used to be shown here, but codegen's
        num_predict=2000 budget is in *tokens* — realistically 6000-8000+
        characters of Python — so a multi-beat scene routinely got truncated
        to roughly its first third before the model ever saw the error.
        Asking it to "fix and return the corrected code" from a prefix
        missing its own closing statements explains a repeat failure mode:
        each fix attempt reported a new unclosed-paren error at a *later*
        line than the last (68 -> 100 -> 121 in one observed run) — the
        model was reconstructing the unseen tail from scratch each time,
        introducing a fresh mistake in it, rather than actually fixing one.
        """
        raw = self._llm.chat(
            [
                {
                    "role": "user",
                    "content": FIX_PROMPT_TEMPLATE.format(code=code[:8000], error=error[-500:]),
                }
            ],
            task="codegen",
            timeout_seconds=60,
            num_predict=2500,
            num_ctx=8192,  # up to 8000 chars of visible code needs headroom
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
        asset_error = AnimationPipeline._validate_no_file_assets(tree)
        if asset_error:
            return asset_error
        overlap_error = AnimationPipeline._validate_title_overlap(tree)
        if overlap_error:
            return overlap_error
        anchor_error = AnimationPipeline._validate_text_anchor(tree)
        if anchor_error:
            return anchor_error
        matrix_error = AnimationPipeline._validate_matrix_overlap(tree)
        if matrix_error:
            return matrix_error
        return None

    @staticmethod
    def _validate_text_anchor(tree: ast.AST) -> Optional[str]:
        """Catch a long sentence or a matrix tethered via .next_to().

        Observed failure (text): a short-ish explanatory sentence positioned
        via ``.next_to(some_shape, ...)`` where ``some_shape`` sits near the
        edge of frame — the text isn't long enough to trip the title-width
        check, but inherits the shape's edge-adjacent position and runs
        off-frame with it. A short label (a number, a single word) via
        ``.next_to()`` is completely normal and not flagged — only a longer,
        sentence-like string chained with a ``.next_to(`` call is.

        Observed failure (matrix): the same thing happens to a
        ``Matrix(...)``/bracket-notation matrix positioned via
        ``.next_to(caption, DOWN)`` where ``caption`` was itself already
        near the bottom edge (e.g. a label placed with ``.to_edge(DOWN)``)
        — the matrix inherits that position and runs off the bottom of the
        frame. Matrices are always flagged when chained with ``.next_to()``
        regardless of size, since even a small one is too dense to safely
        guess a position for relative to an arbitrary other mobject.
        """
        LIMIT = 25
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            base = node
            has_next_to, has_long_text, has_matrix = False, False, False
            while isinstance(base, ast.Call):
                func = base.func
                if isinstance(func, ast.Attribute) and func.attr == "next_to":
                    has_next_to = True
                if isinstance(func, ast.Name) and func.id == "Matrix":
                    has_matrix = True
                if isinstance(func, ast.Name) and func.id in ("Text", "Tex", "MathTex"):
                    for arg in base.args:
                        if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                            if len(arg.value) > LIMIT:
                                has_long_text = True
                            if MATRIX_ENV_RE.search(arg.value):
                                has_matrix = True
                base = func.value if isinstance(func, ast.Attribute) else None
            if has_next_to and has_matrix:
                return (
                    "A matrix (Matrix(...) or bracket-notation MathTex) is positioned "
                    "with .next_to(...) on another mobject — if that mobject sits near "
                    "an edge, the matrix inherits that position and runs off-frame. "
                    "Anchor matrices to a fixed position instead (e.g. .move_to(ORIGIN) "
                    "or .to_edge(DOWN) directly, not relative to another mobject)."
                )
            if has_next_to and has_long_text:
                return (
                    "A sentence-length Text/MathTex is positioned with .next_to(...) "
                    "on another mobject — if that mobject sits near an edge, the text "
                    "runs off-frame with it. Anchor long text to a fixed position "
                    "instead (e.g. .to_edge(DOWN)), reserving .next_to() for short labels."
                )
        return None

    @staticmethod
    def _validate_no_file_assets(tree: ast.AST) -> Optional[str]:
        """Reject SVGMobject/ImageMobject — there are no asset files to load.

        No image or SVG assets exist in this sandbox, so any use of these
        classes fails at render time with an opaque path-resolution error
        (``seek_full_path_from_defaults``) well after the cheap checks above
        already ran. Unlike the title-width check this needs no heuristic —
        any use of these classes is guaranteed to fail here, always.
        """
        FILE_MOBJECTS = {"SVGMobject", "ImageMobject", "SVGPathMobject"}
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in FILE_MOBJECTS:
                    return (
                        f"{node.func.id}(...) loads a file from disk — no asset files exist "
                        f"in this sandbox, so this will always fail. Build the shape from "
                        f"Manim primitives instead (Circle, Square, Line, Polygon, Arrow, …)."
                    )
        return None

    @staticmethod
    def _validate_title_overlap(tree: ast.AST) -> Optional[str]:
        """Catch a second top-anchored heading stacking on an uncleared first.

        A common failure: the scene assigns a Text()/Tex()/MathTex() mobject
        positioned at the top of frame (``.to_edge(UP)``), then later assigns
        another one the same way without fading or removing the first — the
        two render on top of each other as unreadable overlapping text.
        Walks ``construct()``'s top-level statements in source order (nested
        control flow isn't tracked — a cheap heuristic, not full data-flow
        analysis, same spirit as the checks above).
        """
        construct = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == "construct":
                construct = node
                break
        if construct is None:
            return None

        def is_top_anchored_text(call: ast.AST) -> bool:
            has_text_base, has_top_edge = False, False
            node = call
            while isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Name) and func.id in ("Text", "Tex", "MathTex"):
                    has_text_base = True
                if isinstance(func, ast.Attribute) and func.attr == "to_edge":
                    if any(isinstance(a, ast.Name) and a.id == "UP" for a in node.args):
                        has_top_edge = True
                node = func.value if isinstance(func, ast.Attribute) else None
            return has_text_base and has_top_edge

        def referenced_names(node: ast.AST) -> set:
            return {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}

        on_screen: dict = {}  # var name -> line assigned
        for stmt in construct.body:
            for sub in ast.walk(stmt):
                if not isinstance(sub, ast.Call):
                    continue
                func = sub.func
                is_fadeout = isinstance(func, ast.Name) and func.id == "FadeOut"
                is_remove = isinstance(func, ast.Attribute) and func.attr == "remove"
                if is_fadeout or is_remove:
                    for name in referenced_names(sub):
                        on_screen.pop(name, None)

            if isinstance(stmt, ast.Assign) and isinstance(stmt.value, ast.Call):
                if is_top_anchored_text(stmt.value):
                    if on_screen:
                        uncleared = ", ".join(on_screen)
                        new_name = next(
                            (t.id for t in stmt.targets if isinstance(t, ast.Name)), "it"
                        )
                        return (
                            f"'{new_name}' (line {stmt.lineno}) is a second top-anchored "
                            f"heading while '{uncleared}' is still on screen — they'll "
                            f"overlap. FadeOut or remove the old one first."
                        )
                    for target in stmt.targets:
                        if isinstance(target, ast.Name):
                            on_screen[target.id] = stmt.lineno
        return None

    @staticmethod
    def _validate_matrix_overlap(tree: ast.AST) -> Optional[str]:
        """Catch a second matrix rendering while an earlier one is uncleared.

        Observed failure: a scene shows a matrix as a labeled entry grid,
        then later a *second* representation of the same matrix — a bracket-
        notation ``Matrix(...)`` or a ``MathTex`` with a
        ``\\begin{bmatrix}``/``\\begin{pmatrix}`` environment — without fading
        the first, and the two dense, overlapping renderings become
        unreadable together. Same walk-construct()-in-source-order pattern
        as ``_validate_title_overlap``, applied to matrix-shaped mobjects
        instead of top-anchored headings.
        """
        construct = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == "construct":
                construct = node
                break
        if construct is None:
            return None

        def is_matrix_call(call: ast.AST) -> bool:
            node = call
            while isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Name):
                    if func.id == "Matrix":
                        return True
                    if func.id in ("MathTex", "Tex"):
                        for arg in node.args:
                            if (
                                isinstance(arg, ast.Constant)
                                and isinstance(arg.value, str)
                                and MATRIX_ENV_RE.search(arg.value)
                            ):
                                return True
                node = func.value if isinstance(func, ast.Attribute) else None
            return False

        def referenced_names(node: ast.AST) -> set:
            return {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}

        on_screen: dict = {}
        for stmt in construct.body:
            for sub in ast.walk(stmt):
                if not isinstance(sub, ast.Call):
                    continue
                func = sub.func
                is_fadeout = isinstance(func, ast.Name) and func.id == "FadeOut"
                is_remove = isinstance(func, ast.Attribute) and func.attr == "remove"
                if is_fadeout or is_remove:
                    for name in referenced_names(sub):
                        on_screen.pop(name, None)

            if isinstance(stmt, ast.Assign) and isinstance(stmt.value, ast.Call):
                if is_matrix_call(stmt.value):
                    if on_screen:
                        uncleared = ", ".join(on_screen)
                        new_name = next(
                            (t.id for t in stmt.targets if isinstance(t, ast.Name)), "it"
                        )
                        return (
                            f"'{new_name}' (line {stmt.lineno}) is a second matrix "
                            f"representation while '{uncleared}' is still on screen — "
                            f"they'll overlap into an unreadable mess. FadeOut or remove "
                            f"the first matrix before showing the second."
                        )
                    for target in stmt.targets:
                        if isinstance(target, ast.Name):
                            on_screen[target.id] = stmt.lineno
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
