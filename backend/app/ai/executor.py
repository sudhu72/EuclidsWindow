"""Sandboxed visualization execution."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional
from uuid import uuid4

from ..config import get_settings
from ..logging_config import logger
from ..models import VisualizationPayload, VisualizationType

BASE_DIR = Path(__file__).resolve().parents[2]
STATIC_VIZ_DIR = BASE_DIR / "static" / "visualizations"
ANIMATIONS_DIR = BASE_DIR / "static" / "animations"

STATIC_VIZ_DIR.mkdir(parents=True, exist_ok=True)
ANIMATIONS_DIR.mkdir(parents=True, exist_ok=True)


class VisualizationExecutor:
    def __init__(self) -> None:
        settings = get_settings()
        self.timeout = settings.local_ai_execution_timeout_seconds

    def execute_plotly(self, code: str, title: str) -> Optional[VisualizationPayload]:
        if not code:
            return None

        viz_id = f"plotly-{uuid4().hex[:12]}"
        output_file = STATIC_VIZ_DIR / f"{viz_id}.json"

        script = f"""
import json
import plotly.io as pio
from plotly import graph_objects as go
from plotly import express as px

{code}

if 'fig' not in locals():
    raise RuntimeError('Plotly code must define a fig variable')

with open(r\"{output_file}\", 'w', encoding='utf-8') as handle:
    handle.write(pio.to_json(fig))
"""

        try:
            self._run_script(script)
            payload = json.loads(output_file.read_text(encoding="utf-8"))
            layout = payload.get("layout", {})
            # Remove the massive Plotly default template – it bloats the response
            # by hundreds of KB and freezes the browser during rendering.
            layout.pop("template", None)
            data = {"data": payload.get("data", []), "layout": layout}
            return VisualizationPayload(
                viz_id=viz_id,
                viz_type=VisualizationType.plotly,
                title=title,
                data=data,
            )
        except Exception as exc:
            logger.error(f"Plotly execution failed: {exc}")
            return None
        finally:
            if output_file.exists():
                output_file.unlink()

    def execute_manim(self, code: str, title: str) -> Optional[VisualizationPayload]:
        if not code:
            return None

        animation_id = f"manim-{uuid4().hex[:12]}"
        output_format = "gif"
        destination = ANIMATIONS_DIR / f"{animation_id}.{output_format}"

        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = Path(tmpdir) / "generated_scene.py"
            script_path.write_text(code, encoding="utf-8")

            cmd = [
                sys.executable,
                "-m",
                "manim",
                "-ql",
                str(script_path),
                "GeneratedScene",
                "--format=gif",
                "--media_dir",
                tmpdir,
                "-o",
                animation_id,
            ]

            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                )
            except subprocess.TimeoutExpired:
                logger.error("Manim execution timed out")
                return None

            if result.returncode != 0:
                logger.error(f"Manim execution failed: {result.stderr[:400]}")
                return None

            output_file = self._find_output_file(tmpdir, animation_id, output_format)
            if not output_file:
                logger.error("Manim output not found")
                return None

            shutil.copy(output_file, destination)

        return VisualizationPayload(
            viz_id=animation_id,
            viz_type=VisualizationType.manim,
            title=title,
            data={
                "url": f"/animations/{animation_id}.{output_format}",
                "format": output_format,
            },
        )

    def _run_script(self, code: str) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            script_path = Path(tmpdir) / "plotly_script.py"
            script_path.write_text(code, encoding="utf-8")
            env = os.environ.copy()
            env.pop("PYTHONPATH", None)
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                env=env,
            )
            if result.returncode != 0:
                raise RuntimeError(result.stderr[:400] or "Plotly execution failed")

    @staticmethod
    def _find_output_file(media_dir: str, animation_id: str, output_format: str) -> Optional[Path]:
        media_path = Path(media_dir)
        ext = output_format
        for path in media_path.rglob(f"*{animation_id}*.{ext}"):
            return path
        for path in media_path.rglob(f"*.{ext}"):
            return path
        return None
