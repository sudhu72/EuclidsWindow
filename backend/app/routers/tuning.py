"""Settings -> Model tuning: drive the RAFT pipeline from the UI.

Training needs the Mac's GPU (MLX) and writes to the host Ollama, which the
container can't do, so the work runs in a small helper on the host
(scripts/lora/agent.py, `make lora-agent`). These routes forward to it, list
the choices (library books, local models), and own the one action the helper
deliberately can't take: switching the app's tutor model — allowed only for a
run whose held-out test gate said PROMOTE.
"""
import asyncio
import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..ai.library import get_library
from ..ai.providers import CLOUD_PROVIDERS
from ..settings_store import SettingsStore

router = APIRouter(tags=["tuning"])

AGENT_URL = os.environ.get("TUNING_AGENT_URL", "http://host.docker.internal:8765").rstrip("/")
CLAUDE_HAIKU = "claude-haiku-4-5-20251001"


def _agent(method: str, path: str, body: Dict[str, Any] | None = None, timeout: float = 10) -> Dict[str, Any]:
    req = urllib.request.Request(f"{AGENT_URL}{path}", method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as exc:
        detail = json.loads(exc.read() or b"{}").get("detail", str(exc))
        raise HTTPException(status_code=exc.code, detail=detail) from exc
    except (urllib.error.URLError, OSError) as exc:
        raise HTTPException(status_code=503, detail="Tuning helper is not running — start it with `make lora-agent`") from exc


@router.get("/api/tuning/status")
async def tuning_status() -> Dict[str, Any]:
    try:
        return await asyncio.to_thread(_agent, "GET", "/status")
    except HTTPException as exc:
        if exc.status_code == 503:
            return {"online": False, "run": None, "history": [], "hint": exc.detail}
        raise


@router.get("/api/tuning/options")
async def tuning_options() -> Dict[str, Any]:
    """Books to tune on, models available as teacher/judges, and whether Claude can be used."""
    docs = await asyncio.to_thread(get_library().list_docs)
    books = sorted(({"source": d["source"], "chunks": d["chunks"]} for d in docs
                    if str(d["source"]).lower().endswith(".pdf")), key=lambda b: b["source"].lower())
    from ..main import list_ollama_models  # avoid a circular import at module load

    try:
        local = [m.name for m in (await list_ollama_models()).available]
    except Exception:  # noqa: BLE001 - Ollama down: the UI still loads
        local = []
    eff = SettingsStore().get_effective_settings()
    return {
        "books": books,
        "local_models": [m for m in local if "embed" not in m and not m.endswith(":cloud")],
        "claude_available": bool(eff.get(CLOUD_PROVIDERS["anthropic"]["key_setting"])),
        "claude_judge": CLAUDE_HAIKU,
        "defaults": {"teacher": "qwen3:8b", "judges": ["qwen3:8b", "llama3.1:8b"], "per_source": 30, "eval_n": 40},
        "current_model": eff.get("local_llm_model"),
    }


class TuningStart(BaseModel):
    sources: List[str] = Field(..., min_length=1, max_length=40)
    per_source: int = Field(30, ge=5, le=200)
    teacher: str = Field("qwen3:8b", min_length=1, max_length=80)
    judges: List[str] = Field(default_factory=lambda: ["qwen3:8b", "llama3.1:8b"], min_length=2, max_length=2)
    eval_n: int = Field(40, ge=10, le=120)


@router.post("/api/tuning/start")
async def tuning_start(req: TuningStart) -> Dict[str, Any]:
    uses_claude = req.teacher.startswith("claude") or any(j.startswith("claude") for j in req.judges)
    if uses_claude and not SettingsStore().get_effective_settings().get(CLOUD_PROVIDERS["anthropic"]["key_setting"]):
        raise HTTPException(status_code=400, detail="Claude was chosen but no Anthropic API key is saved")
    return await asyncio.to_thread(_agent, "POST", "/start", req.model_dump())


@router.post("/api/tuning/cancel")
async def tuning_cancel() -> Dict[str, Any]:
    return await asyncio.to_thread(_agent, "POST", "/cancel", {})


@router.post("/api/tuning/promote")
async def tuning_promote() -> Dict[str, Any]:
    """Switch the tutor to the last run's model — only if its test gate said PROMOTE."""
    status = await asyncio.to_thread(_agent, "GET", "/status")
    result = (status.get("run") or {}).get("result") or {}
    if result.get("verdict") != "PROMOTE" or not result.get("model"):
        raise HTTPException(status_code=409, detail="The last run did not pass the gate; the model was not switched")
    SettingsStore().update({"local_llm_model": result["model"]})
    return {"local_llm_model": result["model"]}
