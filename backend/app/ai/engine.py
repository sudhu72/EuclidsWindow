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

    def _run_ollama_http(
        self,
        prompt: str,
        *,
        timeout_override: Optional[int] = None,
        num_predict: Optional[int] = None,
    ) -> Optional[str]:
        url = f"{self.base_url.rstrip('/')}/api/generate"
        body: dict = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        if num_predict:
            body["options"] = {"num_predict": num_predict}
        payload = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        effective_timeout = timeout_override or self.timeout
        try:
            with urllib.request.urlopen(request, timeout=effective_timeout) as response:
                raw = json.loads(response.read().decode("utf-8"))
                return str(raw.get("response", "")).strip() or None
        except urllib.error.URLError as exc:
            logger.error(f"Ollama HTTP request failed: {exc}")
            return None
        except TimeoutError:
            logger.error(f"Ollama HTTP request timed out ({effective_timeout}s)")
            return None

    def generate_with_timeout(
        self, prompt: str, timeout_seconds: int, num_predict: int = 400
    ) -> Optional[str]:
        """Generate with an explicit timeout, useful for LLM-first with fast fallback."""
        if not self.is_available():
            return None
        self._refresh_overrides()
        if self.provider == "ollama":
            if self.base_url:
                return self._run_ollama_http(
                    prompt,
                    timeout_override=timeout_seconds,
                    num_predict=num_predict,
                )
            return self._run_ollama(prompt)
        return None

    def is_model_ready(self) -> bool:
        """Check whether the model is loaded in memory (warm) for fast inference."""
        if not self.base_url:
            return self.is_available()
        self._refresh_overrides()
        url = f"{self.base_url.rstrip('/')}/api/ps"
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                running = [m.get("name", "") for m in data.get("models", [])]
                return any(self.model in n for n in running)
        except Exception:
            return False

    def is_model_available(self) -> bool:
        """Check whether the model exists on disk (may need loading)."""
        if not self.base_url:
            return self.is_available()
        self._refresh_overrides()
        url = f"{self.base_url.rstrip('/')}/api/tags"
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                names = [m.get("name", "") for m in data.get("models", [])]
                return any(self.model in n for n in names)
        except Exception:
            return False

    def warm_up(self) -> None:
        """Trigger model loading in Ollama so it's ready for the next request."""
        if not self.base_url:
            return
        self._refresh_overrides()
        url = f"{self.base_url.rstrip('/')}/api/generate"
        body = json.dumps({
            "model": self.model,
            "prompt": "",
            "keep_alive": "10m",
        }).encode("utf-8")
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp.read()
        except Exception:
            pass


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
