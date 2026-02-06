"""Manim animation rendering service."""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

from ..cache import cache
from ..logging_config import logger

# Directory for rendered animations
ANIMATIONS_DIR = Path(__file__).resolve().parents[2] / "static" / "animations"
ANIMATIONS_DIR.mkdir(parents=True, exist_ok=True)

# Manim scenes directory
SCENES_DIR = Path(__file__).resolve().parents[1] / "manim_scenes"


class ManimService:
    """Service for rendering and caching Manim animations."""

    def __init__(self):
        self.animations_dir = ANIMATIONS_DIR
        self.scenes_dir = SCENES_DIR
        self.manim_cmd = [sys.executable, "-m", "manim"]
        self._check_manim_available()

    def _check_manim_available(self) -> bool:
        """Check if Manim is installed."""
        try:
            result = subprocess.run(
                [*self.manim_cmd, "--version"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            self.manim_available = result.returncode == 0
            if self.manim_available:
                logger.info(f"Manim available: {result.stdout.strip()}")
            else:
                logger.warning("Manim not available on this system")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self.manim_available = False
            logger.warning("Manim not installed or not in PATH")
        return self.manim_available

    def get_animation_id(self, scene_name: str, **kwargs) -> str:
        """Generate unique ID for an animation based on parameters."""
        params_str = f"{scene_name}:{sorted(kwargs.items())}"
        return hashlib.md5(params_str.encode()).hexdigest()[:16]

    def get_cached_animation(self, animation_id: str) -> Optional[Dict[str, Any]]:
        """Get animation from cache if available."""
        # Check in-memory cache first
        cached = cache.get(f"animation:{animation_id}")
        if cached:
            return cached

        # Check if file exists on disk
        mp4_path = self.animations_dir / f"{animation_id}.mp4"
        gif_path = self.animations_dir / f"{animation_id}.gif"

        if mp4_path.exists():
            result = {
                "id": animation_id,
                "status": "completed",
                "url": f"/animations/{animation_id}.mp4",
                "format": "mp4",
            }
            cache.set(f"animation:{animation_id}", result, ttl=3600)
            return result

        if gif_path.exists():
            result = {
                "id": animation_id,
                "status": "completed",
                "url": f"/animations/{animation_id}.gif",
                "format": "gif",
            }
            cache.set(f"animation:{animation_id}", result, ttl=3600)
            return result

        return None

    def render_animation(
        self,
        scene_name: str,
        quality: str = "low",
        output_format: str = "gif",
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Render a Manim animation.

        Args:
            scene_name: Name of the scene class to render
            quality: Manim quality setting (low, medium, high)
            output_format: Output format (gif or mp4)
            **kwargs: Additional parameters for the scene

        Returns:
            Dict with animation ID, status, and URL
        """
        animation_id = self.get_animation_id(scene_name, quality=quality, **kwargs)

        # Check cache first
        cached = self.get_cached_animation(animation_id)
        if cached:
            logger.info(f"Animation {animation_id} found in cache")
            return cached

        if not self.manim_available:
            return {
                "id": animation_id,
                "status": "error",
                "error": "Manim is not installed on this system",
            }

        # Find the scene file
        scene_file = self._find_scene_file(scene_name)
        if not scene_file:
            return {
                "id": animation_id,
                "status": "error",
                "error": f"Scene '{scene_name}' not found",
            }

        try:
            # Quality flags
            quality_flags = {
                "low": "-ql",
                "medium": "-qm",
                "high": "-qh",
            }
            quality_flag = quality_flags.get(quality, "-ql")

            # Create temp directory for rendering
            with tempfile.TemporaryDirectory() as tmpdir:
                # Build manim command
                cmd = [
                    *self.manim_cmd,
                    quality_flag,
                    str(scene_file),
                    scene_name,
                    "-o", animation_id,
                    "--media_dir", tmpdir,
                ]

                if output_format == "gif":
                    cmd.append("--format=gif")

                logger.info(f"Rendering animation: {' '.join(cmd)}")

                # Run manim
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=120,  # 2 minute timeout
                    cwd=str(self.scenes_dir),
                )

                if result.returncode != 0:
                    logger.error(f"Manim render failed: {result.stderr}")
                    return {
                        "id": animation_id,
                        "status": "error",
                        "error": f"Render failed: {result.stderr[:500]}",
                    }

                # Find the output file
                output_file = self._find_output_file(tmpdir, animation_id, output_format)
                if not output_file:
                    return {
                        "id": animation_id,
                        "status": "error",
                        "error": "Output file not found after render",
                    }

                # Copy to animations directory
                ext = "gif" if output_format == "gif" else "mp4"
                dest_path = self.animations_dir / f"{animation_id}.{ext}"
                shutil.copy(output_file, dest_path)

                result = {
                    "id": animation_id,
                    "status": "completed",
                    "url": f"/animations/{animation_id}.{ext}",
                    "format": ext,
                }

                # Cache the result
                cache.set(f"animation:{animation_id}", result, ttl=3600)

                logger.info(f"Animation rendered successfully: {animation_id}")
                return result

        except subprocess.TimeoutExpired:
            return {
                "id": animation_id,
                "status": "error",
                "error": "Render timed out (>2 minutes)",
            }
        except Exception as e:
            logger.error(f"Animation render error: {e}")
            return {
                "id": animation_id,
                "status": "error",
                "error": str(e),
            }

    def _find_scene_file(self, scene_name: str) -> Optional[Path]:
        """Find the Python file containing the scene."""
        if not self.scenes_dir.exists():
            return None

        for py_file in self.scenes_dir.glob("*.py"):
            content = py_file.read_text()
            if f"class {scene_name}" in content:
                return py_file

        return None

    def _find_output_file(
        self, media_dir: str, animation_id: str, output_format: str
    ) -> Optional[Path]:
        """Find the rendered output file in the media directory."""
        media_path = Path(media_dir)
        ext = "gif" if output_format == "gif" else "mp4"

        # Search for the file
        for path in media_path.rglob(f"*{animation_id}*.{ext}"):
            return path

        # Also check without the ID (manim might use scene name)
        for path in media_path.rglob(f"*.{ext}"):
            return path

        return None

    def list_available_scenes(self) -> list:
        """List all available animation scenes."""
        scenes = []
        if not self.scenes_dir.exists():
            return scenes

        for py_file in self.scenes_dir.glob("*.py"):
            if py_file.name.startswith("_"):
                continue
            content = py_file.read_text()
            # Find all Scene subclasses
            import re
            matches = re.findall(r"class (\w+)\(.*Scene\)", content)
            for match in matches:
                scenes.append({
                    "name": match,
                    "file": py_file.name,
                })

        return scenes

    def delete_animation(self, animation_id: str) -> bool:
        """Delete a cached animation."""
        cache.delete(f"animation:{animation_id}")

        deleted = False
        for ext in ["mp4", "gif"]:
            path = self.animations_dir / f"{animation_id}.{ext}"
            if path.exists():
                path.unlink()
                deleted = True

        return deleted
