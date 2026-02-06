"""Pydantic models for API requests and responses."""
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class VisualizationType(str, Enum):
    svg = "svg"
    plotly = "plotly"
    manim = "manim"


# Auth models
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    learning_level: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    learning_level: Optional[str] = None


class ProgressResponse(BaseModel):
    concept_slug: str
    status: str
    score: Optional[int] = None
    last_accessed: str


class ProgressListResponse(BaseModel):
    progress: List[ProgressResponse]


class ProgressUpdateRequest(BaseModel):
    status: str
    score: Optional[int] = None


# Chat models
class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = None


class VisualizationPayload(BaseModel):
    viz_id: str
    viz_type: VisualizationType
    title: str
    data: Dict[str, Any]


class ChatMessageResponse(BaseModel):
    conversation_id: Optional[str] = None
    response_text: str
    related_concepts: List[str] = []
    visualization: Optional[VisualizationPayload] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    visualization_id: Optional[str] = None
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: str
    updated_at: str
    messages: List[MessageResponse] = []


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


class HealthResponse(BaseModel):
    status: str
    version: str


# Mind map models
class MindMapNode(BaseModel):
    id: str
    name: str
    description: str = ""
    level: int = 0
    category: str = "general"
    euclid_ref: Optional[str] = None
    is_target: bool = False


class MindMapLink(BaseModel):
    source: str
    target: str
    relation: str = "related"


class MindMapResponse(BaseModel):
    target: str
    nodes: List[MindMapNode]
    links: List[MindMapLink]


class ConceptResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    level: int = 0
    category: Optional[str] = None
    euclid_ref: Optional[str] = None


class ConceptListResponse(BaseModel):
    concepts: List[ConceptResponse]


# Euclid models
class EuclidEntryResponse(BaseModel):
    id: str
    reference: str
    book: int
    entry_type: str
    number: int
    original_text: str
    modern_text: Optional[str] = None


class EuclidSearchResponse(BaseModel):
    entries: List[EuclidEntryResponse]


# Resource models
class ResourceResponse(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    resource_type: str
    difficulty: Optional[str] = None
    url: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None


class ResourceSearchResponse(BaseModel):
    resources: List[ResourceResponse]


# Animation models
class AnimationRenderRequest(BaseModel):
    scene_name: str
    quality: str = "low"  # low, medium, high
    output_format: str = "gif"  # gif or mp4


class AnimationResponse(BaseModel):
    id: str
    status: str  # pending, rendering, completed, error
    url: Optional[str] = None
    format: Optional[str] = None
    error: Optional[str] = None


class AnimationListResponse(BaseModel):
    scenes: List[Dict[str, str]]
