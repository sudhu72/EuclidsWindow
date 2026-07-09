"""LLM-routed image generation.

Diffusion models produce garbled text and wrong geometry, so they are the
wrong tool for mathematical *diagrams*. This router asks the local LLM to
classify each request:

- ``diagram``      -> LLM writes matplotlib code, rendered sandboxed to PNG
- ``illustration`` -> diffusion (SDXL) with an LLM-enhanced prompt

Every step degrades gracefully: no LLM -> raw prompt to diffusion; diagram
codegen fails -> enhanced prompt to diffusion.
"""
import ast
import textwrap
from typing import Optional, Tuple

from ..logging_config import logger
from .engine import LocalLLMEngine
from .executor import VisualizationExecutor

MPL_ALLOWED_IMPORT_ROOTS = {"matplotlib", "mpl_toolkits", "numpy", "math"}

INTENT_SYSTEM_PROMPT = textwrap.dedent("""\
    You route image requests for a math learning app. Classify the request and
    improve the prompt. Respond with JSON only:
    {"intent": "diagram" | "illustration", "enhanced_prompt": "..."}

    intent rules:
    - "diagram": plots, graphs, geometric figures, number lines, charts,
      anything where mathematical accuracy or labels matter.
    - "illustration": artistic/decorative imagery where accuracy of text and
      geometry does not matter (e.g. "a friendly robot teaching math").

    enhanced_prompt rules:
    - For diagram: a precise one-sentence spec of what to plot, including
      ranges and labels.
    - For illustration: a detailed Stable Diffusion prompt (style, composition,
      lighting). Never ask the image model to render text or formulas.
    """)

MPL_SYSTEM_PROMPT = textwrap.dedent("""\
    You write matplotlib code for a math learning app. Rules:
    1. Output ONLY Python code. No markdown fences, no commentary.
    2. Import only matplotlib, numpy, and math.
    3. Create a figure named `fig` (e.g. fig, ax = plt.subplots(figsize=(8, 5))).
    4. Never call plt.show() or plt.savefig().
    5. Label axes, add a title, use a grid at alpha=0.3 where sensible.
    6. Keep it under 40 lines.
    """)


class SmartImageService:
    """Routes /api/ai/media/image requests to matplotlib or diffusion."""

    def __init__(self, diffusion_service) -> None:
        self._diffusion = diffusion_service
        self._engine = LocalLLMEngine()
        self._executor = VisualizationExecutor()

    def generate(self, prompt: str) -> Optional[Tuple[str, str]]:
        """Returns (url, model_description) or None."""
        plan = self._plan(prompt)
        intent = (plan or {}).get("intent")
        enhanced = (plan or {}).get("enhanced_prompt") or prompt

        if intent == "diagram":
            url = self._generate_diagram(enhanced)
            if url:
                return url, "matplotlib (LLM codegen)"
            logger.warning("SmartImageService: diagram path failed, falling back to diffusion")

        url = self._diffusion.generate(enhanced if intent else prompt)
        if url:
            return url, self._diffusion.model_id
        return None

    def _plan(self, prompt: str) -> Optional[dict]:
        if not self._engine.is_available():
            return None
        plan = self._engine.chat_json(
            [
                {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt[:600]},
            ],
            task="fast",
            timeout_seconds=30,
            num_predict=250,
        )
        if plan and plan.get("intent") in ("diagram", "illustration"):
            return plan
        return None

    def _generate_diagram(self, spec: str) -> Optional[str]:
        code = self._engine.chat(
            [
                {"role": "system", "content": MPL_SYSTEM_PROMPT},
                {"role": "user", "content": f"Plot the following:\n{spec}"},
            ],
            task="codegen",
            timeout_seconds=60,
            num_predict=1200,
            temperature=0.2,
        )
        if not code:
            return None
        code = self._strip_fences(code)
        error = self._validate_mpl(code)
        if error:
            logger.warning(f"SmartImageService: generated code rejected: {error}")
            return None
        return self._executor.execute_matplotlib(code)

    @staticmethod
    def _strip_fences(text: str) -> str:
        import re

        match = re.search(r"```(?:python)?\s*\n(.*?)```", text, re.DOTALL)
        return match.group(1).strip() if match else text.strip()

    @staticmethod
    def _validate_mpl(code: str) -> Optional[str]:
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            return f"SyntaxError: {exc.msg} (line {exc.lineno})"
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.split(".")[0] not in MPL_ALLOWED_IMPORT_ROOTS:
                        return f"Forbidden import: {alias.name}"
            elif isinstance(node, ast.ImportFrom):
                if (node.module or "").split(".")[0] not in MPL_ALLOWED_IMPORT_ROOTS:
                    return f"Forbidden import: from {node.module}"
        return None
