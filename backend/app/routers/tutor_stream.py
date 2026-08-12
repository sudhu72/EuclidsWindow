"""Streaming variant of /api/ai/tutor.

`/api/ai/tutor` returns one JSON blob; `/api/chat/stream` streams but is grounded
only by the concept graph. The React tutor wants both, so this endpoint keeps the
tutor's tier routing and full grounding — curated catalog, uploaded reference
library (RAG), concept graph, learner level, teaching style — and delivers the
answer as Server-Sent Events.

Frames (each a `data:` line holding one JSON object):
  {"meta": {...}}  once, before any text — source, matched topic, level
  {"t": "..."}     answer text, incrementally
  {"done": true, "takeaways": [...], "next_questions": [...]}  once, at the end
  {"error": "..."} on failure, in place of the remaining text
"""
import asyncio
import json
import logging
from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..ai.engine import LocalLLMEngine
from ..ai.library import get_library
from ..ai.service import GenerativeTutorService
from ..content import TopicCatalog

logger = logging.getLogger("euclids_window")

router = APIRouter(tags=["tutor"])

_catalog = TopicCatalog()
_service = GenerativeTutorService()

# Mirrors the marker list in main.py's ai_tutor: a follow-up should get a genuine
# conversational answer from the model rather than a canned curated topic.
FOLLOWUP_MARKERS = (
    "why", "how come", "what about", "can you", "explain more", "tell me more",
    "elaborate", "go deeper", "again", "instead",
)

LEVEL_FIELDS = {
    "kids": "kids_content",
    "teen": "teen_content",
    "college": "college_content",
    "adult": "adult_content",
}


class TutorStreamMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class TutorStreamRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    history: List[TutorStreamMessage] = Field(default_factory=list)
    learner_level: Optional[str] = "teen"
    session_id: Optional[str] = None


def _is_followup(question: str, history: List[TutorStreamMessage]) -> bool:
    q = question.strip().lower()
    return bool(history) or any(marker in q for marker in FOLLOWUP_MARKERS)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _closing_aids(req: "TutorStreamRequest", answer: str) -> dict:
    """Takeaways and follow-ups for the final frame, plus session bookkeeping.

    Runs after the answer is complete, so the learning aids see the whole text.
    Never raises into the stream — the answer has already been delivered and a
    missing set of follow-ups is not worth failing over.
    """
    aids: dict = {"takeaways": [], "next_questions": []}
    if not answer.strip():
        return aids
    try:
        from ..ai.didactics import build_learning_aids, extract_learning_focus

        takeaways, next_questions = build_learning_aids(
            extract_learning_focus(req.question), answer, [], req.learner_level or "teen"
        )
        aids["takeaways"] = list(takeaways or [])
        aids["next_questions"] = list(next_questions or [])
    except Exception as exc:  # noqa: BLE001
        logger.warning("Tutor stream: learning aids failed: %s", exc)
    if req.session_id:
        try:
            from ..main import context_service

            context_service.add_message(req.session_id, "assistant", answer)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tutor stream: could not record the reply: %s", exc)
    return aids


@router.post("/api/ai/tutor/stream")
async def tutor_stream(req: TutorStreamRequest) -> StreamingResponse:
    raw_history = [m.model_dump() for m in req.history]

    # With a session, the semantic context window supplies the history — the same
    # continuity /api/ai/tutor gives, so a long conversation keeps its thread
    # without the client resending everything.
    history = raw_history
    if req.session_id:
        from ..main import context_service

        context_service.create_session(req.session_id)
        await asyncio.to_thread(
            context_service.add_message, req.session_id, "user", req.question
        )
        history = await asyncio.to_thread(
            context_service.build_context, req.session_id, req.question, raw_history
        )

    # --- Tier 1: curated catalog, unless this is a follow-up or the user's own
    # library covers the question better (the keyword matcher can misfire).
    topic = await asyncio.to_thread(_catalog.match_topic, req.question)
    library_override = await asyncio.to_thread(get_library().has_strong_match, req.question)
    followup = _is_followup(req.question, req.history)
    use_curated = bool(topic) and not followup and not library_override

    level_key = (req.learner_level or "teen").strip().lower()
    curated_text = ""
    if use_curated and topic:
        # Same level→field mapping as main.py's ai_tutor; an unknown level falls
        # back to the generic response_text rather than an invented field name.
        level_field = LEVEL_FIELDS.get(level_key)
        curated_text = (level_field and topic.get(level_field)) or topic.get("response_text") or ""
        if not curated_text.strip():
            use_curated = False

    meta = {
        "source": "curated" if use_curated else "llm",
        "topic_id": (topic or {}).get("id", "") if use_curated else "",
        "learner_level": level_key,
        "library_grounded": bool(library_override) or not use_curated,
    }

    if use_curated:
        def curated_source():
            yield _sse({"meta": meta})
            yield _sse({"t": curated_text})
            yield _sse({"done": True, "takeaways": [], "next_questions": []})

        return StreamingResponse(
            curated_source(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # --- Tier 2: the local model, grounded exactly as answer_reasoning grounds it.
    curated_hint = topic.get("response_text", "")[:500] if topic else None
    messages = await asyncio.to_thread(
        _service.build_reasoning_messages, req.question, history, curated_hint, level_key
    )
    engine = LocalLLMEngine()

    def event_source():
        yield _sse({"meta": meta})
        got_any = False
        collected: List[str] = []
        try:
            for chunk in engine.chat_stream(
                messages, num_predict=1200, num_ctx=4096, temperature=0.4
            ):
                got_any = True
                collected.append(chunk)
                yield _sse({"t": chunk})
        except Exception as exc:  # noqa: BLE001
            logger.warning("Tutor stream failed: %s", exc)
            yield _sse({"error": str(exc)})
            yield _sse({"done": True})
            return
        if not got_any:
            # Streaming is Ollama-only; a cloud route yields nothing, so fall
            # back to the one-shot call rather than showing an empty answer.
            text = engine.chat(messages, num_predict=1200, num_ctx=4096, temperature=0.4)
            collected.append(text or "The tutor is unavailable right now.")
            yield _sse({"t": collected[-1]})
        yield _sse({"done": True, **_closing_aids(req, "".join(collected))})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
