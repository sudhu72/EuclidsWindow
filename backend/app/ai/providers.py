"""Cloud model providers — optional paid alternatives to local Ollama.

The app is local-first: Ollama remains the default and the fallback. When a
cloud provider is selected in Settings (with an API key), every LLM task is
routed through it instead. Providers:

- "anthropic" — official ``anthropic`` SDK (Claude).
- "openai"    — official ``openai`` SDK.
- "xai"       — Grok via the ``openai`` SDK (officially supported,
                base_url https://api.x.ai/v1).
- "gemini"    — Gemini via the ``openai`` SDK (Google's officially supported
                OpenAI-compatible endpoint).

SDKs are imported lazily so the app still runs when they aren't installed.
"""
from typing import Dict, List, Optional, Tuple

from ..logging_config import logger

CLOUD_PROVIDERS: Dict[str, Dict[str, str]] = {
    "anthropic": {
        "label": "Anthropic Claude",
        "default_model": "claude-opus-4-8",
        "key_setting": "anthropic_api_key",
    },
    "openai": {
        "label": "OpenAI",
        "default_model": "gpt-5-mini",
        "key_setting": "openai_api_key",
    },
    "xai": {
        "label": "xAI Grok",
        "default_model": "grok-4",
        "key_setting": "xai_api_key",
    },
    "gemini": {
        "label": "Google Gemini",
        "default_model": "gemini-2.5-flash",
        "key_setting": "gemini_api_key",
    },
}

_OPENAI_COMPAT_BASE_URLS = {
    "openai": None,  # SDK default
    "xai": "https://api.x.ai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
}


def resolve_cloud_model(provider: str, configured: Optional[str]) -> str:
    if configured and configured.strip():
        return configured.strip()
    return CLOUD_PROVIDERS[provider]["default_model"]


def cloud_chat(
    provider: str,
    model: str,
    api_key: str,
    messages: List[Dict[str, str]],
    *,
    json_mode: bool = False,
    temperature: Optional[float] = None,
    max_tokens: int = 2048,
    timeout_seconds: int = 120,
) -> Optional[str]:
    """One chat completion against a cloud provider. Returns text or None."""
    if provider not in CLOUD_PROVIDERS or not api_key:
        return None
    try:
        if provider == "anthropic":
            return _anthropic_chat(model, api_key, messages, json_mode, max_tokens, timeout_seconds)
        return _openai_compat_chat(
            provider, model, api_key, messages, json_mode, temperature, max_tokens, timeout_seconds
        )
    except Exception as exc:  # provider errors must never crash callers
        logger.error(f"Cloud provider '{provider}' request failed: {exc}")
        return None


def _anthropic_chat(
    model: str,
    api_key: str,
    messages: List[Dict[str, str]],
    json_mode: bool,
    max_tokens: int,
    timeout_seconds: int,
) -> Optional[str]:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key, timeout=float(timeout_seconds), max_retries=1)
    system = "\n\n".join(m["content"] for m in messages if m.get("role") == "system") or None
    chat_messages = [m for m in messages if m.get("role") != "system"]
    if not chat_messages:
        chat_messages = [{"role": "user", "content": "Go ahead."}]
    if json_mode and system:
        system += "\n\nRespond with a single valid JSON object and nothing else."

    # No `temperature` (removed on current Claude models) and no `thinking`
    # config — omitting it is valid on every model the user might configure.
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=chat_messages,
    )
    if response.stop_reason == "refusal":
        logger.warning("Anthropic request was refused by safety classifiers")
        return None
    text = "".join(block.text for block in response.content if block.type == "text").strip()
    return text or None


def _openai_compat_chat(
    provider: str,
    model: str,
    api_key: str,
    messages: List[Dict[str, str]],
    json_mode: bool,
    temperature: Optional[float],
    max_tokens: int,
    timeout_seconds: int,
) -> Optional[str]:
    from openai import OpenAI

    client = OpenAI(
        api_key=api_key,
        base_url=_OPENAI_COMPAT_BASE_URLS[provider],
        timeout=float(timeout_seconds),
        max_retries=1,
    )
    kwargs: Dict = {
        "model": model,
        "messages": messages,
        "max_completion_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    if temperature is not None and provider != "openai":
        # Newer OpenAI reasoning models reject non-default temperature;
        # xAI and Gemini compat endpoints accept it.
        kwargs["temperature"] = temperature
    try:
        response = client.chat.completions.create(**kwargs)
    except Exception as exc:
        # Older models on OpenAI-compatible endpoints may not know
        # max_completion_tokens; retry once with the legacy parameter.
        if "max_completion_tokens" in str(exc):
            kwargs.pop("max_completion_tokens", None)
            kwargs["max_tokens"] = max_tokens
            response = client.chat.completions.create(**kwargs)
        else:
            raise
    if not response.choices:
        return None
    content = (response.choices[0].message.content or "").strip()
    return content or None


def test_cloud_provider(provider: str, model: str, api_key: str) -> Tuple[bool, str]:
    """Cheap connectivity check for the Settings UI."""
    if provider not in CLOUD_PROVIDERS:
        return False, f"Unknown provider '{provider}'."
    if not api_key:
        return False, "No API key saved for this provider."
    try:
        text = cloud_chat(
            provider,
            model,
            api_key,
            [{"role": "user", "content": "Reply with the single word: ok"}],
            max_tokens=20,
            timeout_seconds=30,
        )
    except Exception as exc:
        return False, str(exc)[:200]
    if text:
        return True, f"Connected — {CLOUD_PROVIDERS[provider]['label']} ({model}) responded."
    return False, "Provider returned no text; check the API key and model name."
