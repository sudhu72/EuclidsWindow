"""Chat streaming should ground via the tutor's shared grounding function."""
import app.routers.chat as chat_module
from app.routers.chat import ChatStreamRequest, _build_messages


def test_chat_uses_shared_reasoning_context(monkeypatch):
    # Chat used to call get_concept_graph().context_for(...) directly, with no
    # RAG library grounding at all. It should now go through
    # GenerativeTutorService.build_reasoning_context, the same function the
    # tutor uses, so library grounding lands here too.
    calls = []

    def fake_build_reasoning_context(question, history=None, curated_hint=None):
        calls.append(question)
        return "GRAPH+LIBRARY GROUNDING BLOCK"

    monkeypatch.setattr(chat_module._service, "build_reasoning_context", fake_build_reasoning_context)

    req = ChatStreamRequest(message="What is a limit?", history=[], level="teen")
    messages = _build_messages(req)

    assert calls == ["What is a limit?"]
    assert messages[0]["role"] == "system"
    assert "GRAPH+LIBRARY GROUNDING BLOCK" in messages[0]["content"]
    assert messages[-1] == {"role": "user", "content": "What is a limit?"}


def test_chat_preserves_multiturn_history(monkeypatch):
    # Grounding is shared, but chat keeps its own turn-by-turn message list
    # (not squashed into a "Conversation so far" text block like the tutor).
    monkeypatch.setattr(chat_module._service, "build_reasoning_context", lambda *a, **k: "")
    req = ChatStreamRequest(
        message="And why does that matter?",
        history=[
            {"role": "user", "content": "What is a derivative?"},
            {"role": "assistant", "content": "It's the rate of change."},
        ],
        level="teen",
    )
    messages = _build_messages(req)
    roles = [m["role"] for m in messages]
    assert roles == ["system", "user", "assistant", "user"]
