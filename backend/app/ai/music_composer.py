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
import json
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

    # Small local models degrade badly on long JSON outputs, so long pieces
    # are composed a few measures at a time, each chunk continuing the last.
    CHUNK_BARS = 4

    def compose(self, prompt: str, bars: int = 8) -> Optional[Dict[str, Any]]:
        """Compose a validated score in chunks, retrying with error feedback."""
        bars = max(2, min(16, bars))
        meta: Optional[Dict[str, Any]] = None
        measures: List[Dict[str, Any]] = []

        for _ in range(bars):  # safety bound; normally bars/CHUNK_BARS rounds
            remaining = bars - len(measures)
            if remaining <= 0:
                break
            chunk = self._compose_chunk(
                prompt,
                n=min(self.CHUNK_BARS, remaining),
                meta=meta,
                prev_measure=measures[-1] if measures else None,
                start=len(measures) + 1,
                total=bars,
            )
            if not chunk or not chunk["measures"]:
                break
            if meta is None:
                meta = {k: chunk[k] for k in ("title", "tempo", "time", "key", "explanation")}
            measures.extend(chunk["measures"])

        if len(measures) < max(2, bars // 2) or meta is None:
            logger.warning(f"Composer gave up with {len(measures)}/{bars} valid measures")
            return None
        score = dict(meta, measures=measures[:bars])
        score["model"] = self._engine._model_for_task("codegen")
        return score

    def _compose_chunk(
        self,
        prompt: str,
        *,
        n: int,
        meta: Optional[Dict[str, Any]],
        prev_measure: Optional[Dict[str, Any]],
        start: int,
        total: int,
    ) -> Optional[Dict[str, Any]]:
        """Compose and validate one chunk of `n` measures, retrying once."""
        if meta is None:
            user_msg = f"Compose measures 1-{n} of a {total}-measure piece: {prompt[:400]}"
        else:
            user_msg = (
                f"Continue the piece '{meta['title']}' ({meta['key']}, {meta['time']}, "
                f"tempo {meta['tempo']}): {prompt[:400]}\n"
                f"The previous measure was: {json.dumps(prev_measure)}\n"
                f"Compose measures {start}-{start + n - 1} of {total}, keeping the same "
                f"key, time signature, and tempo."
            )
        messages = [
            {"role": "system", "content": COMPOSER_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ]

        for attempt in range(2):
            raw = self._engine.chat_json(
                messages,
                task="codegen",  # structured JSON scores: coder models do this best
                timeout_seconds=120,
                num_predict=600 + 350 * n,
                num_ctx=4096,  # Ollama's 2048 default truncates longer scores
                temperature=0.7 if attempt == 0 else 0.4,
            )
            if not raw:
                logger.warning(f"Composer chunk {start}-{start + n - 1}: no JSON (attempt {attempt + 1})")
                continue
            score, errors = self._validate(raw, n, forced_time=meta["time"] if meta else None)
            if score:
                return score
            logger.warning(f"Composer chunk attempt {attempt + 1} invalid: {errors[:3]}")
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

    def _validate(
        self, raw: Dict[str, Any], bars: int, forced_time: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], List[str]]:
        errors: List[str] = []

        time = forced_time or str(raw.get("time", "3/4"))
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
            # A measure must contain at least one actual note; rest-padding of
            # empty voices otherwise turns degenerate LLM output into silence.
            if any(len(ev) == 2 for ev in voices["t"] + voices["b"]):
                measures_out.append(voices)
            else:
                errors.append(f"measure {idx} has no notes")

        if not measures_out:
            return None, errors or ["no valid measures"]
        # A partial chunk is fine: compose() keeps requesting measures until
        # the piece is full and enforces the overall minimum itself.

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
        # Over-nested event, e.g. [["c4", 8]] — unwrap one level
        if len(ev) == 1 and isinstance(ev[0], list):
            return SymbolicMusicComposer._parse_event(ev[0])
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
