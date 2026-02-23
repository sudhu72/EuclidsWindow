"""Local LLM engine wrapper."""
import json
import re
import shutil
import subprocess
import urllib.error
import urllib.request
from typing import Optional

from ..config import get_settings
from ..settings_store import SettingsStore
from ..logging_config import logger


class LocalLLMEngine:
    """Run a local LLM (Ollama) and return raw text."""

    def __init__(self) -> None:
        settings = get_settings()
        self.provider = settings.local_llm_provider
        self.model = settings.local_llm_model
        self.timeout = settings.local_llm_timeout_seconds
        self.base_url = settings.local_llm_base_url
        self._store = SettingsStore()

    def _refresh_overrides(self) -> None:
        overrides = self._store.get_effective_settings()
        model = overrides.get("local_llm_model")
        if model:
            self.model = model

    def is_available(self) -> bool:
        if self.provider == "ollama":
            if self.base_url:
                return True
            return shutil.which("ollama") is not None
        return False

    def generate(self, prompt: str) -> Optional[str]:
        if not self.is_available():
            logger.warning("Local LLM provider not available")
            return None
        self._refresh_overrides()

        if self.provider == "ollama":
            if self.base_url:
                return self._run_ollama_http(prompt)
            return self._run_ollama(prompt)
        return None

    def _run_ollama(self, prompt: str) -> Optional[str]:
        cmd = ["ollama", "run", self.model]
        try:
            result = subprocess.run(
                cmd,
                input=prompt,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )
        except subprocess.TimeoutExpired:
            logger.error("Local LLM timed out")
            return None
        except FileNotFoundError:
            logger.warning("Ollama not installed")
            return None

        if result.returncode != 0:
            logger.error(f"Local LLM failed: {result.stderr[:400]}")
            return None

        return result.stdout.strip()

    def _run_ollama_http(self, prompt: str) -> Optional[str]:
        url = f"{self.base_url.rstrip('/')}/api/generate"
        payload = json.dumps(
            {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                body = json.loads(response.read().decode("utf-8"))
                return str(body.get("response", "")).strip() or None
        except urllib.error.URLError as exc:
            logger.error(f"Ollama HTTP request failed: {exc}")
            return None


def extract_json_block(text: str) -> Optional[str]:
    """Try to extract the first JSON object from a string."""
    if not text:
        return None
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    candidate = match.group(0)
    try:
        json.loads(candidate)
        return candidate
    except json.JSONDecodeError:
        return None
