"""Voice routes — proxy the local Voicebox sidecar for TTS + Whisper STT.

Best-effort: /status reports whether Voicebox is reachable so the React UI can
choose Voicebox vs the browser's built-in Web Speech API. Ported from Oracle.
"""
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from ..ai.voice import VoiceConnector
from ..config import get_settings

router = APIRouter(tags=["voice"])


@router.get("/api/voice/status")
async def voice_status() -> dict:
    """Is Voicebox reachable? The frontend uses this to pick Voicebox vs the
    browser's built-in Web Speech API."""
    settings = get_settings()
    health = await VoiceConnector().health()
    return {"voice_enabled": settings.voice_enabled, "voicebox": health}


class TTSRequest(BaseModel):
    text: str
    profile: Optional[str] = None


@router.post("/api/voice/tts")
async def voice_tts(req: TTSRequest) -> Response:
    """Speak text through Voicebox; returns audio bytes."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")
    try:
        audio, content_type = await VoiceConnector().speak(req.text, req.profile)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"voicebox tts failed: {exc}")
    return Response(content=audio, media_type=content_type)


@router.post("/api/voice/stt")
async def voice_stt(audio: UploadFile = File(...)) -> dict:
    """Transcribe an uploaded audio clip via Voicebox (Whisper)."""
    data = await audio.read()
    try:
        text = await VoiceConnector().transcribe(data, filename=audio.filename or "audio.webm")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"voicebox stt failed: {exc}")
    return {"text": text}
