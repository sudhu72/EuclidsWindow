"""Dynamic Manim animation pipeline.

Generates 3Blue1Brown-style animations from natural-language prompts using:
1. Heuristic template matching for known math topics (fast, reliable)
2. LLM-driven code generation for novel topics (creative, flexible)
3. Sandboxed rendering via the existing VisualizationExecutor
4. Iterative error recovery (feed render errors back to LLM for fix)

Inspired by the Hermes Agent manim-video skill:
https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/manim-video
"""

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
    fill_template,
)

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

CREATIVE STANDARDS (from 3Blue1Brown):
- Geometry before algebra: show the shape first, the equation second.
- Opacity layering: primary elements at 1.0, context at 0.4, grid/axes at 0.15.
- Breathing room: self.wait(1.5) minimum after showing something new.
- One new idea per scene. Progressive disclosure.
- buff >= 0.5 for edge text positioning.
- No more than 5-6 elements visible at once.
""")

CODEGEN_PROMPT_TEMPLATE = textwrap.dedent("""\
Write a Manim CE scene that animates the following mathematical concept:

TOPIC: {topic}

CONTEXT (from the tutor):
{context}

Requirements:
- Show geometry/visuals BEFORE equations
- Use smooth animations (Write, Create, FadeIn, Transform)
- Label important elements clearly
- Animate at least one moving/transforming element

Output the complete Python script (class GeneratedScene(Scene)).
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
        quality: str = "low",
        output_format: str = "gif",
    ) -> Optional[VisualizationPayload]:
        """Full pipeline: plan → code → render → (retry on error) → payload.

        Returns a VisualizationPayload with viz_type=manim on success, None on failure.
        """
        logger.info(f"AnimationPipeline.generate: topic={topic!r}")

        # Phase 1: try heuristic template
        code = self._heuristic_code(topic, context)
        source = "template"

        # Phase 2: if no template, use LLM
        if code is None and self._llm.is_available():
            code = self._llm_generate(topic, context)
            source = "llm"

        if code is None:
            logger.warning("AnimationPipeline: no code generated")
            return None

        # Phase 3: render (with retry)
        payload = self._render_with_retry(code, topic, source)
        return payload

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
    # Phase 2: LLM code generation
    # ------------------------------------------------------------------

    def _llm_generate(self, topic: str, context: str) -> Optional[str]:
        """Ask the local LLM to write a full Manim scene."""
        prompt = (
            CODEGEN_SYSTEM_PROMPT
            + "\n\n"
            + CODEGEN_PROMPT_TEMPLATE.format(topic=topic, context=context[:800])
        )

        raw = self._llm.generate_with_timeout(prompt, timeout_seconds=90, num_predict=2000)
        if not raw:
            logger.warning("AnimationPipeline: LLM returned no output")
            return None

        code = self._extract_python(raw)
        if code and "GeneratedScene" in code and "construct" in code:
            logger.info("AnimationPipeline: LLM generated valid-looking code")
            return code

        logger.warning("AnimationPipeline: LLM output did not contain GeneratedScene")
        return None

    def _llm_fix(self, code: str, error: str) -> Optional[str]:
        """Ask the LLM to fix broken Manim code."""
        prompt = FIX_PROMPT_TEMPLATE.format(
            code=code[:2000], error=error[:500]
        )
        raw = self._llm.generate_with_timeout(prompt, timeout_seconds=60, num_predict=2000)
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
            payload = self._executor.execute_manim(code, title=topic)
            if payload is not None:
                payload.data["pipeline_source"] = source
                payload.data["attempt"] = attempt + 1
                return payload

            # On failure, try LLM fix if available
            if attempt < MAX_RETRIES and self._llm.is_available():
                error_msg = f"Manim render failed on attempt {attempt + 1}"
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
