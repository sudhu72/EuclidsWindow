"""Real-time streaming chat for the React tutor.

Streams tokens from the local model as Server-Sent Events so the UI can render
the reply as it's written — the "richer real-time chat" the React frontend is
built for. Grounded by the concept graph (for disambiguation), the RAG
library, and the standing-orders skill, same as the rest of the app — via
``GenerativeTutorService.build_reasoning_context``, the tutor's single source
of grounding truth, rather than a second hand-rolled copy of it.
"""
import asyncio
import json
from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..ai.engine import LocalLLMEngine
from ..ai.prompts import LEVEL_INSTRUCTIONS
from ..ai.service import GenerativeTutorService
from ..ai.skills import COMPACT_SKILL, COMPACT_TEACHING

router = APIRouter(tags=["chat"])

_engine = LocalLLMEngine()
_service = GenerativeTutorService()

CHAT_SYSTEM_PROMPT = (
    "You are Euclid, a friendly, rigorous math tutor. Be concise, one idea at a "
    "time, and define each symbol you use. "
    "Use \\(...\\) for inline math and $$...$$ on their own lines for display "
    "math.\n\n" + COMPACT_TEACHING + "\n\n" + COMPACT_SKILL
)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatMessage] = Field(default_factory=list)
    level: str = Field(default="teen", pattern="^(kids|teen|college|adult)$")


def _build_messages(req: ChatStreamRequest) -> List[dict]:
    # Concept graph + RAG library, same grounding the tutor answers with — chat
    # keeps its own turn-by-turn message list (better for a live conversation
    # than the tutor's squashed "Conversation so far" text block), so only the
    # grounding call is shared, not history handling.
    grounding = _service.build_reasoning_context(req.message)
    level_instruction = LEVEL_INSTRUCTIONS.get(req.level, LEVEL_INSTRUCTIONS["teen"])
    system = CHAT_SYSTEM_PROMPT + "\n\n" + level_instruction + (("\n\n" + grounding) if grounding else "")
    messages = [{"role": "system", "content": system}]
    for m in req.history[-8:]:  # keep the tail so context stays bounded
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})
    return messages


@router.post("/api/chat/stream")
async def chat_stream(req: ChatStreamRequest) -> StreamingResponse:
    """Stream the tutor's reply token-by-token as SSE (`data: {"t": "..."}`)."""
    # Grounding hits Chroma (blocking I/O) — keep it off the event loop.
    messages = await asyncio.to_thread(_build_messages, req)

    def event_source():
        got_any = False
        try:
            for chunk in _engine.chat_stream(messages, num_predict=1200, num_ctx=4096, temperature=0.4):
                got_any = True
                yield f"data: {json.dumps({'t': chunk})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        if not got_any:
            # Streaming unavailable (cloud route / model down) — one-shot fallback.
            text = _engine.chat(messages, num_predict=1200, num_ctx=4096, temperature=0.4)
            yield f"data: {json.dumps({'t': text or 'The tutor is unavailable right now.'})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
