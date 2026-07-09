"""Symbolic music composition via the local LLM.

Instead of generating an opaque waveform (MusicGen), the LLM emits a
structured JSON score in the same event format the Music Lab already uses
for Mozart's dice game:

    measure = {"t": [...], "b": [...]}     # treble / bass voices
    event   = ["c5", 8]                    # pitch + duration code
              [["c5", "e5"], 4]            # chord
              [8]                          # rest

Duration codes: 2=half, 4=quarter, 8=eighth, 16=sixteenth.
The score is validated (and lightly repaired) with music-theory rules, then
played by the frontend's Web Audio piano and engraved with VexFlow.
"""
import re
import textwrap
from typing import Any, Dict, List, Optional, Tuple

from ..logging_config import logger
from .engine import LocalLLMEngine

PITCH_RE = re.compile(r"^[a-g]#?[2-6]$")
VALID_DURS = {2, 4, 8, 16}
VALID_TIMES = {"2/4", "3/4", "4/4", "3/8", "6/8"}

COMPOSER_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a music composer for a math learning app. Compose a short piece
    from the user's description. Respond with JSON only, in exactly this shape:

    {
      "title": "...",
      "tempo": 96,
      "time": "3/4",
      "key": "C major",
      "explanation": "one sentence on the mathematical idea in the piece",
      "measures": [
        {"t": [["e5", 8], ["g5", 8], [["c5","e5"], 4]], "b": [["c3", 4], [4]]},
        ...
      ]
    }

    Rules:
    - "t" is the treble (melody) voice, "b" the bass voice. Both required
      in every measure.
    - An event is [pitch, duration], [[p1, p2], duration] for a chord, or
      [duration] alone for a rest.
    - Pitches: lowercase letter, optional #, octave 2-6 (e.g. "c4", "f#5").
      Treble should stay in octaves 4-6, bass in octaves 2-4. No flats.
    - Durations: 2 (half), 4 (quarter), 8 (eighth), 16 (sixteenth).
    - Every measure of every voice must exactly fill the time signature.
    - tempo is quarter-note BPM between 60 and 160.
    - Stay in the stated key; sharps only where the key or a passing tone
      needs them.
    """)


class SymbolicMusicComposer:
    def __init__(self) -> None:
        self._engine = LocalLLMEngine()

    def is_available(self) -> bool:
        return self._engine.is_available()

    def compose(self, prompt: str, bars: int = 8) -> Optional[Dict[str, Any]]:
        """Compose a validated score, retrying once with error feedback."""
        bars = max(2, min(16, bars))
        user_msg = f"Compose {bars} measures: {prompt[:400]}"
        messages = [
            {"role": "system", "content": COMPOSER_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ]

        for attempt in range(2):
            raw = self._engine.chat_json(
                messages,
                task="codegen",  # structured JSON scores: coder models do this best
                timeout_seconds=120,
                num_predict=2500,
                temperature=0.7 if attempt == 0 else 0.4,
            )
            if not raw:
                return None
            score, errors = self._validate(raw, bars)
            if score:
                score["model"] = self._engine._model_for_task("codegen")
                return score
            logger.warning(f"Composer attempt {attempt + 1} invalid: {errors[:3]}")
            messages = messages[:2] + [
                {"role": "assistant", "content": str(raw)[:1500]},
                {
                    "role": "user",
                    "content": "That score has errors: "
                    + "; ".join(errors[:5])
                    + ". Output the corrected full JSON score.",
                },
            ]
        return None

    # ------------------------------------------------------------------
    # Validation / repair
    # ------------------------------------------------------------------

    def _validate(self, raw: Dict[str, Any], bars: int) -> Tuple[Optional[Dict[str, Any]], List[str]]:
        errors: List[str] = []

        time = str(raw.get("time", "3/4"))
        if time not in VALID_TIMES:
            errors.append(f"unsupported time signature {time}")
            time = "3/4"
        num, den = (int(p) for p in time.split("/"))
        eighths_per_measure = num * 8 / den

        tempo = raw.get("tempo", 100)
        if not isinstance(tempo, (int, float)) or not 40 <= tempo <= 220:
            tempo = 100

        measures_in = raw.get("measures")
        if not isinstance(measures_in, list) or not measures_in:
            return None, ["measures missing or empty"]

        measures_out = []
        for idx, m in enumerate(measures_in[:bars], start=1):
            if not isinstance(m, dict):
                errors.append(f"measure {idx} is not an object")
                continue
            voices = {}
            for voice in ("t", "b"):
                events, verrs = self._clean_voice(m.get(voice), eighths_per_measure)
                errors.extend(f"measure {idx} {voice}: {e}" for e in verrs)
                voices[voice] = events
            if voices["t"] or voices["b"]:
                measures_out.append(voices)

        if not measures_out:
            return None, errors or ["no valid measures"]
        # Tolerate minor issues as long as most measures survived cleaning
        if len(measures_out) < max(2, bars // 2):
            return None, errors or ["too few valid measures"]

        return (
            {
                "title": str(raw.get("title") or "Untitled"),
                "tempo": int(tempo),
                "time": time,
                "key": str(raw.get("key") or "C major"),
                "explanation": str(raw.get("explanation") or ""),
                "measures": measures_out,
            },
            errors,
        )

    def _clean_voice(self, events: Any, eighths_per_measure: float) -> Tuple[List[Any], List[str]]:
        """Normalize a voice, dropping bad events and fixing measure length."""
        errors: List[str] = []
        if not isinstance(events, list):
            return [], ["voice missing"]

        cleaned: List[Any] = []
        total = 0.0
        for ev in events:
            parsed = self._parse_event(ev)
            if parsed is None:
                errors.append(f"bad event {ev!r}")
                continue
            dur_eighths = 8 / parsed[-1]
            if total + dur_eighths > eighths_per_measure + 1e-6:
                errors.append("measure overfull, trimmed")
                break
            cleaned.append(parsed)
            total += dur_eighths

        # Pad an underfull measure with rests
        remaining = eighths_per_measure - total
        for dur_code in (2, 4, 8, 16):
            span = 8 / dur_code
            while remaining >= span - 1e-6:
                cleaned.append([dur_code])
                remaining -= span
        if 1e-6 < remaining:
            errors.append("measure underfull")
        return cleaned, errors

    @staticmethod
    def _parse_event(ev: Any) -> Optional[list]:
        if not isinstance(ev, list) or not ev:
            return None
        # Rest: [duration]
        if len(ev) == 1 and isinstance(ev[0], (int, float)) and int(ev[0]) in VALID_DURS:
            return [int(ev[0])]
        if len(ev) != 2:
            return None
        pitches, dur = ev
        if not isinstance(dur, (int, float)) or int(dur) not in VALID_DURS:
            return None
        dur = int(dur)
        if isinstance(pitches, str):
            p = pitches.strip().lower()
            return [p, dur] if PITCH_RE.match(p) else None
        if isinstance(pitches, list) and pitches:
            cleaned = [str(p).strip().lower() for p in pitches]
            if all(PITCH_RE.match(p) for p in cleaned):
                return [cleaned, dur]
        return None
