"""Pólya problem-solving coach routes."""
import asyncio
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..ai.polya import PolyaService

router = APIRouter(tags=["polya"])

polya_service = PolyaService()


class PolyaStartRequest(BaseModel):
    problem: str
    level: str = "teen"
    difficulty: str = "basic"


class PolyaStartResponse(BaseModel):
    restated: str
    problem_type: str
    opening: str
    questions: List[str]


class PolyaCoachRequest(BaseModel):
    problem: str
    phase: str
    user_input: str
    notes: str = ""
    level: str = "teen"
    difficulty: str = "basic"
    stuck: bool = False


class PolyaCoachResponse(BaseModel):
    feedback: str
    hint: str
    ready: bool
    suggestions: List[str]
    # Solver-verifier layer: verified = an independent review endorsed the
    # math (or a revision fixed it); revised = the reply was corrected after
    # the reviewer challenged it.
    verified: bool = False
    revised: bool = False


@router.post("/api/ai/polya/start", response_model=PolyaStartResponse)
async def polya_start(payload: PolyaStartRequest) -> PolyaStartResponse:
    """Open a coaching session: restate the problem, ask phase-1 questions."""
    if not payload.problem.strip():
        raise HTTPException(status_code=422, detail="Enter a problem first.")
    if not polya_service.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    result = await asyncio.to_thread(
        polya_service.start, payload.problem, payload.level, payload.difficulty
    )
    if not result:
        raise HTTPException(status_code=502, detail="Coach could not analyze the problem; try again.")
    return PolyaStartResponse(**result)


@router.post("/api/ai/polya/coach", response_model=PolyaCoachResponse)
async def polya_coach(payload: PolyaCoachRequest) -> PolyaCoachResponse:
    """Critique the student's thinking for the current Pólya phase."""
    if not payload.user_input.strip() and not payload.stuck:
        raise HTTPException(status_code=422, detail="Write your thinking first.")
    if not polya_service.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    result = await asyncio.to_thread(
        polya_service.coach,
        payload.problem,
        payload.phase,
        payload.user_input or "I am stuck and need a hint.",
        payload.notes,
        payload.level,
        payload.difficulty,
        payload.stuck,
    )
    if not result:
        raise HTTPException(status_code=502, detail="Coach did not produce feedback; try again.")
    return PolyaCoachResponse(**result)
