"""Continuous math-book learner routes — Start/Stop a background crawler that
keeps ingesting open math books/notes into the reference library."""
from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..ai.learner import get_learner

router = APIRouter(tags=["learn"])


class SourceRequest(BaseModel):
    value: str = Field(..., min_length=3, max_length=2000)
    label: str = ""


class GitHubTokenRequest(BaseModel):
    token: str = Field("", max_length=400)  # write-only; status returns only a boolean


@router.get("/api/learn/status")
async def learn_status() -> Dict[str, Any]:
    return get_learner().status()


@router.post("/api/learn/start")
async def learn_start() -> Dict[str, Any]:
    return get_learner().start()


@router.post("/api/learn/stop")
async def learn_stop() -> Dict[str, Any]:
    return get_learner().stop()


@router.post("/api/learn/sources")
async def learn_add_source(req: SourceRequest) -> Dict[str, Any]:
    return get_learner().add_source(req.value, req.label)


@router.post("/api/learn/sources/remove")
async def learn_remove_source(req: SourceRequest) -> Dict[str, Any]:
    return get_learner().remove_source(req.value)


@router.post("/api/learn/github-token")
async def learn_set_github_token(req: GitHubTokenRequest) -> Dict[str, Any]:
    return get_learner().set_github_token(req.token)
