"""Local LLM engine wrapper."""
import json
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from typing import Dict, List, Optional

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

    def _model_for_task(self, task: Optional[str]) -> str:
        """Resolve the model for a task: codegen/fast route to dedicated
        models when configured, everything else uses the default."""
        overrides = self._store.get_effective_settings()
        default = overrides.get("local_llm_model") or self.model
        if task == "codegen":
            return overrides.get("local_codegen_model") or default
        if task == "fast":
            return overrides.get("local_fast_model") or default
        if task == "polya":
            return overrides.get("local_polya_model") or default
        return default

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

    def _run_ollama(self, prompt: str, model: Optional[str] = None) -> Optional[str]:
        cmd = ["ollama", "run", model or self.model]
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

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        task: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        num_predict: Optional[int] = None,
        json_format: bool = False,
        temperature: Optional[float] = None,
        num_ctx: Optional[int] = None,
        seed: Optional[int] = None,
        retries: int = 1,
    ) -> Optional[str]:
        """Chat completion via Ollama /api/chat with per-task model routing.

        `messages` is a list of {"role": "system"|"user"|"assistant", "content": str}.
        `json_format=True` asks Ollama to constrain output to valid JSON.
        `task` selects the model: "codegen", "fast", or None for the default.
        """
        if not self.is_available():
            return None
        model = self._model_for_task(task)

        if self.provider != "ollama":
            return None
        if not self.base_url:
            # CLI fallback: flatten roles into a single prompt
            prompt = "\n\n".join(m.get("content", "") for m in messages)
            return self._run_ollama(prompt, model=model)

        body: dict = {
            "model": model,
            "messages": messages,
            "stream": False,
            "keep_alive": "10m",
        }
        options: dict = {}
        if num_predict:
            options["num_predict"] = num_predict
        if temperature is not None:
            options["temperature"] = temperature
        if num_ctx:
            options["num_ctx"] = num_ctx
        if seed is not None:
            options["seed"] = seed
        if options:
            body["options"] = options
        if json_format:
            body["format"] = "json"

        url = f"{self.base_url.rstrip('/')}/api/chat"
        payload = json.dumps(body).encode("utf-8")
        effective_timeout = timeout_seconds or self.timeout

        for attempt in range(1 + max(0, retries)):
            request = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=effective_timeout) as response:
                    raw = json.loads(response.read().decode("utf-8"))
                    content = str(raw.get("message", {}).get("content", "")).strip()
                    return content or None
            except TimeoutError:
                logger.error(f"Ollama chat timed out ({effective_timeout}s)")
                return None
            except urllib.error.HTTPError as exc:
                # Ollama returns 404 when the model isn't pulled; fall back to
                # the default model instead of failing the whole request.
                default_model = self._model_for_task(None)
                if exc.code == 404 and body["model"] != default_model:
                    logger.warning(
                        f"Ollama model '{body['model']}' not found; "
                        f"falling back to '{default_model}'"
                    )
                    body["model"] = default_model
                    payload = json.dumps(body).encode("utf-8")
                    continue
                logger.error(f"Ollama chat request failed (attempt {attempt + 1}): {exc}")
                if attempt < retries:
                    time.sleep(0.5)
                    continue
                return None
            except urllib.error.URLError as exc:
                logger.error(f"Ollama chat request failed (attempt {attempt + 1}): {exc}")
                if attempt < retries:
                    time.sleep(0.5)
                    continue
                return None
        return None

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        *,
        task: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        num_predict: Optional[int] = None,
        temperature: float = 0.2,
        num_ctx: Optional[int] = None,
    ) -> Optional[dict]:
        """Chat completion constrained to JSON, parsed into a dict (or None)."""
        raw = self.chat(
            messages,
            task=task,
            timeout_seconds=timeout_seconds,
            num_predict=num_predict,
            json_format=True,
            temperature=temperature,
            num_ctx=num_ctx,
        )
        if not raw:
            return None
        block = extract_json_block(raw)
        if not block:
            logger.warning(f"chat_json: no JSON object in LLM output: {raw[:200]!r}")
            return None
        try:
            parsed = json.loads(block)
        except json.JSONDecodeError as exc:
            logger.warning(f"chat_json: invalid JSON from LLM ({exc}): {block[:200]!r}")
            return None
        return parsed if isinstance(parsed, dict) else None

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
