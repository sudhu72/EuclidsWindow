"""Local diffusion image + music generation."""
import os
import tempfile
from pathlib import Path
from typing import Optional
from uuid import uuid4
import concurrent.futures

from ..config import get_settings
from ..logging_config import logger
from ..settings_store import SettingsStore

BASE_DIR = Path(__file__).resolve().parents[2]
MEDIA_DIR = BASE_DIR / "static" / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


class DiffusionImageService:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = settings.local_media_enabled
        self.model_id = settings.local_diffusion_model
        self.device = settings.local_media_device
        self._pipeline = None
        self._store = SettingsStore()
        self._timeout = settings.local_diffusion_timeout_seconds

    def _refresh_overrides(self) -> None:
        overrides = self._store.get_effective_settings()
        self.enabled = overrides.get("local_media_enabled", self.enabled)
        next_model = overrides.get("local_diffusion_model", self.model_id)
        next_device = overrides.get("local_media_device", self.device)
        self._timeout = overrides.get("local_diffusion_timeout_seconds", self._timeout)
        if next_model != self.model_id or next_device != self.device:
            self.model_id = next_model
            self.device = next_device
            self._pipeline = None

    def _get_pipeline(self):
        if self._pipeline is not None:
            return self._pipeline
        try:
            from diffusers import StableDiffusionPipeline
            import torch
        except Exception as exc:
            logger.error(f"Diffusion pipeline not available: {exc}")
            return None
        try:
            pipeline = StableDiffusionPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device in ("cuda", "mps") else torch.float32,
            )
            pipeline = pipeline.to(self.device)
            self._pipeline = pipeline
            return pipeline
        except Exception as exc:
            logger.error(f"Failed to load diffusion model: {exc}")
            return None

    def generate(self, prompt: str) -> Optional[str]:
        self._refresh_overrides()
        if not self.enabled:
            return None
        pipeline = self._get_pipeline()
        if not pipeline:
            return None
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(pipeline, prompt, num_inference_steps=20)
                result = future.result(timeout=self._timeout)
            image = result.images[0]
            media_id = f"image-{uuid4().hex[:12]}"
            output_path = MEDIA_DIR / f"{media_id}.png"
            image.save(output_path)
            return f"/media/{output_path.name}"
        except concurrent.futures.TimeoutError:
            logger.error("Diffusion generation timed out")
            return None
        except Exception as exc:
            logger.error(f"Diffusion generation failed: {exc}")
            return None


class MusicGenService:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = settings.local_media_enabled
        self.model_id = settings.local_music_model
        self.device = settings.local_media_device
        self._pipeline = None
        self._store = SettingsStore()
        self._timeout = settings.local_music_timeout_seconds
        self._fast_mode = settings.local_music_fast_mode

    def _refresh_overrides(self) -> None:
        overrides = self._store.get_effective_settings()
        self.enabled = overrides.get("local_media_enabled", self.enabled)
        next_model = overrides.get("local_music_model", self.model_id)
        next_device = overrides.get("local_media_device", self.device)
        self._timeout = overrides.get("local_music_timeout_seconds", self._timeout)
        self._fast_mode = overrides.get("local_music_fast_mode", self._fast_mode)
        if next_model != self.model_id or next_device != self.device:
            self.model_id = next_model
            self.device = next_device
            self._pipeline = None

    def _get_pipeline(self):
        if self._pipeline is not None:
            return self._pipeline
        try:
            from transformers import pipeline
        except Exception as exc:
            logger.error(f"Music pipeline not available: {exc}")
            return None
        try:
            pipe = pipeline(
                "text-to-audio",
                model=self.model_id,
                device=self._device_index(),
            )
            self._pipeline = pipe
            return pipe
        except Exception as exc:
            logger.error(f"Failed to load music model: {exc}")
            return None

    def _device_index(self) -> int:
        if self.device == "cuda":
            return 0
        return -1

    def generate(self, prompt: str, duration_seconds: int = 10) -> Optional[str]:
        self._refresh_overrides()
        if not self.enabled:
            return None
        pipe = self._get_pipeline()
        if not pipe:
            return None
        try:
            requested_seconds = duration_seconds
            if self._fast_mode:
                requested_seconds = min(duration_seconds, 3)
            max_new_tokens = max(128, requested_seconds * 20)
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    pipe,
                    prompt,
                    forward_params={"max_new_tokens": max_new_tokens},
                )
                result = future.result(timeout=self._timeout)
            audio = result["audio"]
            sampling_rate = result["sampling_rate"]
            media_id = f"music-{uuid4().hex[:12]}"
            output_path = MEDIA_DIR / f"{media_id}.wav"
            try:
                import soundfile as sf
            except Exception as exc:
                logger.error(f"soundfile not available: {exc}")
                return None
            sf.write(output_path, audio, sampling_rate)
            return f"/media/{output_path.name}"
        except concurrent.futures.TimeoutError:
            logger.error("Music generation timed out")
            return None
        except Exception as exc:
            logger.error(f"Music generation failed: {exc}")
            return None
