"""Models for local generative tutor."""
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from ..models import TutorCheck, VisualizationType


class VisualizationPlan(BaseModel):
    type: VisualizationType = Field(..., description="manim or plotly")
    goal: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    code: Optional[str] = None


class TutorPlan(BaseModel):
    solution: str
    plain_explanation: Optional[str] = None
    axiomatic_explanation: Optional[str] = None
    checks: list[TutorCheck] = Field(default_factory=list)
    needs_visualization: bool = False
    visualization: Optional[VisualizationPlan] = None
