"""Real-time streaming chat for the React tutor.

Streams tokens from the local model as Server-Sent Events so the UI can render
the reply as it's written — the "richer real-time chat" the React frontend is
built for. Grounded by the concept graph (for disambiguation) and the standing-
orders skill, same as the rest of the app.
"""
import json
from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..ai.concept_graph import get_concept_graph
from ..ai.engine import LocalLLMEngine
from ..ai.skills import COMPACT_SKILL

router = APIRouter(tags=["chat"])

_engine = LocalLLMEngine()

CHAT_SYSTEM_PROMPT = (
    "You are Euclid, a friendly but rigorous math tutor. Explain clearly and "
    "correctly, building from first principles. Use \\(...\\) for inline math and "
    "$$...$$ on their own lines for display math. Be concise but complete, and "
    "never invent facts.\n\n" + COMPACT_SKILL
)


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatMessage] = Field(default_factory=list)


def _build_messages(req: ChatStreamRequest) -> List[dict]:
    grounding = get_concept_graph().context_for(req.message)
    system = CHAT_SYSTEM_PROMPT + (("\n\n" + grounding) if grounding else "")
    messages = [{"role": "system", "content": system}]
    for m in req.history[-8:]:  # keep the tail so context stays bounded
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})
    return messages


@router.post("/api/chat/stream")
async def chat_stream(req: ChatStreamRequest) -> StreamingResponse:
    """Stream the tutor's reply token-by-token as SSE (`data: {"t": "..."}`)."""
    messages = _build_messages(req)

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
