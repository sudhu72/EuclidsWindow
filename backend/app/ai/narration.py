"""Offline voice-over for story animations (Kokoro-82M via kokoro-onnx).

The app's spoken output elsewhere uses the browser's Web Speech API, which
can't be baked into a video file, so story videos synthesize their narration
on the server. Kokoro is small (82M parameters), Apache-2.0 for code and
weights, runs on CPU through onnxruntime (already a dependency via Chroma),
and synthesizes roughly 8x faster than real time in the container.

Everything here is best-effort: if the package or model files are missing,
``available()`` is False and videos are rendered silent, exactly as before.
"""
import os
import re
import threading
from pathlib import Path
from typing import Optional

from ..logging_config import logger

MODEL_DIR = Path(os.environ.get("TTS_MODEL_DIR", "/app/models/kokoro"))
MODEL_FILE = MODEL_DIR / "kokoro-v1.0.onnx"
VOICES_FILE = MODEL_DIR / "voices-v1.0.bin"

VOICE = os.environ.get("TTS_VOICE", "af_heart")
# Slower for younger learners; a touch quicker for adults.
SPEED = {"kids": 0.9, "teen": 1.0, "college": 1.0, "adult": 1.05}

_lock = threading.Lock()
_kokoro = None
_failed = False


def _engine():
    global _kokoro, _failed
    if _kokoro is not None or _failed:
        return _kokoro
    with _lock:
        if _kokoro is None and not _failed:
            try:
                from kokoro_onnx import Kokoro

                _kokoro = Kokoro(str(MODEL_FILE), str(VOICES_FILE))
                logger.info(f"Narration: Kokoro loaded from {MODEL_DIR}")
            except Exception as exc:  # noqa: BLE001 - narration is optional
                _failed = True
                logger.warning(f"Narration unavailable ({exc}); videos will be silent")
    return _kokoro


def available() -> bool:
    return _engine() is not None


_SPOKEN = [
    (r"π", " pi "), (r"θ", " theta "), (r"Δ", " delta "), (r"√", " square root of "),
    (r"²", " squared"), (r"³", " cubed"), (r"\^2\b", " squared"), (r"\^3\b", " cubed"),
    (r"≈", " is about "), (r"≠", " is not equal to "), (r"≤", " is at most "), (r"≥", " is at least "),
    (r"×", " times "), (r"÷", " divided by "), (r"→", " to "), (r"∞", " infinity "),
    (r"\bdy/dx\b", "d y by d x"), (r"\be\.g\.", "for example"), (r"\bi\.e\.", "that is"),
    (r"[`*_#$\\{}]", " "),
]


def speakable(text: str) -> str:
    """Turn a caption into something the TTS reads naturally."""
    out = text or ""
    for pattern, repl in _SPOKEN:
        out = re.sub(pattern, repl, out)
    return " ".join(out.split())


def synthesize(text: str, out_path: Path, learner_level: str = "teen", stretch: float = 1.0) -> Optional[float]:
    """Write a WAV of ``text`` to ``out_path``; return its duration in seconds.

    ``stretch`` < 1 speaks more slowly (e.g. 0.9 = 10% slower) to fill a scene.
    """
    text = speakable(text)
    engine = _engine()
    if not text or engine is None:
        return None
    try:
        import soundfile as sf

        with _lock:  # one synthesis at a time: acts are generated in parallel
            speed = SPEED.get(learner_level, 1.0) * stretch
            audio, sr = engine.create(text, voice=VOICE, speed=speed, lang="en-us")
        sf.write(str(out_path), audio, sr)
        return len(audio) / sr
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Narration failed for {text[:60]!r}: {exc}")
        return None
