"""Simple JSON-backed settings store for UI updates."""
import json
from pathlib import Path
from typing import Any, Dict, Optional

from .config import get_settings
import json
import urllib.request
import urllib.error
from .logging_config import logger

SETTINGS_PATH = Path(__file__).resolve().parents[1] / "data" / "app_settings.json"


class SettingsStore:
    def read(self) -> Dict[str, Any]:
        if not SETTINGS_PATH.exists():
            return {}
        try:
            return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning(f"Failed to read settings store: {exc}")
            return {}

    def write(self, data: Dict[str, Any]) -> None:
        SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def get_effective_settings(self) -> Dict[str, Any]:
        base = get_settings()
        overrides = self.read()
        settings = {
            "local_ai_enabled": overrides.get("local_ai_enabled", base.local_ai_enabled),
            "local_llm_model": overrides.get("local_llm_model", base.local_llm_model),
            "local_media_enabled": overrides.get("local_media_enabled", base.local_media_enabled),
            "local_diffusion_model": overrides.get("local_diffusion_model", base.local_diffusion_model),
            "local_music_model": overrides.get("local_music_model", base.local_music_model),
            "local_media_device": overrides.get("local_media_device", base.local_media_device),
            "local_multi_agent_enabled": overrides.get(
                "local_multi_agent_enabled", base.local_multi_agent_enabled
            ),
            "local_web_rag_enabled": overrides.get(
                "local_web_rag_enabled", base.local_web_rag_enabled
            ),
            "fast_mode_enabled": overrides.get("fast_mode_enabled", base.fast_mode_enabled),
            "local_music_timeout_seconds": overrides.get(
                "local_music_timeout_seconds", base.local_music_timeout_seconds
            ),
            "local_music_fast_mode": overrides.get(
                "local_music_fast_mode", base.local_music_fast_mode
            ),
            "local_diffusion_timeout_seconds": overrides.get(
                "local_diffusion_timeout_seconds", base.local_diffusion_timeout_seconds
            ),
        }
        if settings["fast_mode_enabled"]:
            settings["local_multi_agent_enabled"] = False
            settings["local_llm_model"] = self._select_fast_model(
                settings["local_llm_model"], base.local_llm_base_url
            )
        return settings

    def update(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        current = self.read()
        current.update({k: v for k, v in updates.items() if v is not None})
        self.write(current)
        return current

    @staticmethod
    def _select_fast_model(current: str, base_url: Optional[str]) -> str:
        preferred_large = "llama3.2:3b"
        preferred_small = "llama3.2:1b"
        preferred_list = [
            preferred_large,
            preferred_small,
            "phi3:mini",
            "qwen2.5:1.5b",
            "qwen2.5:0.5b",
        ]
        mem_gb = _get_memory_gb()
        preferred = preferred_small if mem_gb and mem_gb < 16 else preferred_large
        if not base_url:
            return preferred
        available = _fetch_ollama_models(base_url)
        if not available:
            return preferred
        if preferred in available:
            return preferred
        for candidate in preferred_list:
            if candidate in available:
                return candidate
        return current or preferred


def _fetch_ollama_models(base_url: str) -> Optional[set]:
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            body = json.loads(response.read().decode("utf-8"))
            return {m.get("name") for m in body.get("models", []) if m.get("name")}
    except urllib.error.URLError:
        return None
    except Exception:
        return None


def _get_memory_gb() -> Optional[float]:
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as handle:
            for line in handle:
                if line.startswith("MemTotal:"):
                    parts = line.split()
                    kb = float(parts[1])
                    return kb / (1024 * 1024)
    except Exception:
        return None
    return None
