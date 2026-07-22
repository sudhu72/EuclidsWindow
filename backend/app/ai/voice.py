"""Voicebox connector — two-way voice for the React tutor.

Wraps the local Voicebox REST API (github.com/jamiepine/voicebox, default port
17493): ``/speak`` for neural TTS, ``/transcribe`` for Whisper STT, ``/profiles``
for available voices. Everything is best-effort: if Voicebox isn't running,
``health`` reports unreachable and the frontend falls back to the browser's
built-in Web Speech API, so voice works either way.

Ported from the Oracle project's proven connector (same author's stack).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import httpx

from ..config import get_settings


class VoiceConnector:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def base(self) -> str:
        return self.settings.voicebox_url.rstrip("/")

    async def health(self) -> Dict[str, Any]:
        """Is Voicebox reachable, and which voice profiles does it offer?"""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base}/profiles")
                resp.raise_for_status()
                profiles = resp.json()
            return {"reachable": True, "url": self.base, "profiles": _profile_names(profiles)}
        except Exception as exc:  # noqa: BLE001 - best-effort probe
            return {
                "reachable": False,
                "url": self.base,
                "profiles": [],
                "error": f"{type(exc).__name__}: {exc}",
            }

    async def speak(self, text: str, profile: Optional[str] = None) -> Tuple[bytes, str]:
        """TTS via Voicebox ``/speak``; returns (audio_bytes, content_type)."""
        payload: Dict[str, Any] = {"text": text}
        if profile:
            payload["profile"] = profile
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base}/speak",
                json=payload,
                headers={"X-Voicebox-Client-Id": self.settings.voicebox_client_id},
            )
            resp.raise_for_status()
            return resp.content, resp.headers.get("content-type", "audio/wav")

    async def transcribe(
        self, audio: bytes, filename: str = "audio.webm", model: str = "whisper-turbo"
    ) -> str:
        """STT via Voicebox ``/transcribe``; returns the recognized text."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base}/transcribe",
                files={"audio": (filename, audio, "application/octet-stream")},
                data={"model": model},
            )
            resp.raise_for_status()
            body = resp.json()
            return body.get("text") or body.get("transcription") or ""


def _profile_names(profiles: Any) -> List[str]:
    if isinstance(profiles, list):
        out = []
        for p in profiles:
            if isinstance(p, str):
                out.append(p)
            elif isinstance(p, dict):
                out.append(p.get("name") or p.get("id") or "")
        return [n for n in out if n]
    return []
