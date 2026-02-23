"""Pydantic models for API requests and responses."""
from enum import Enum
from datetime import datetime
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


class TutorRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    history: Optional[List["TutorHistoryMessage"]] = None
    response_mode: str = Field("both", pattern="^(plain|axiomatic|both)$")
    learner_level: str = Field("teen", pattern="^(kids|teen|college|adult)$")


class TutorCheck(BaseModel):
    name: str
    status: str = Field(..., pattern="^(pass|warn)$")
    details: str


class TutorResponse(BaseModel):
    solution: str
    plain_explanation: Optional[str] = None
    axiomatic_explanation: Optional[str] = None
    key_takeaways: List[str] = Field(default_factory=list)
    next_questions: List[str] = Field(default_factory=list)
    checks: List[TutorCheck] = Field(default_factory=list)
    improvement_hints: List[str] = Field(default_factory=list)
    self_correction: Optional[str] = None
    response_mode: str = Field("both", pattern="^(plain|axiomatic|both)$")
    learner_level: str = Field("teen", pattern="^(kids|teen|college|adult)$")
    needs_visualization: bool = False
    visualization: Optional[VisualizationPayload] = None


class TutorHistoryMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=8000)


TutorRequest.model_rebuild()


class MediaImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)


class MediaImageResponse(BaseModel):
    url: str
    model: Optional[str] = None


class MediaMusicRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    duration_seconds: int = Field(10, ge=3, le=30)


class MediaMusicResponse(BaseModel):
    url: str
    model: Optional[str] = None


class AppSettingsResponse(BaseModel):
    local_ai_enabled: bool
    local_llm_model: str
    local_media_enabled: bool
    local_diffusion_model: str
    local_music_model: str
    local_media_device: str
    local_multi_agent_enabled: bool
    local_web_rag_enabled: bool
    fast_mode_enabled: bool
    local_music_timeout_seconds: int
    local_music_fast_mode: bool
    local_diffusion_timeout_seconds: int


class AppSettingsUpdate(BaseModel):
    local_ai_enabled: Optional[bool] = None
    local_llm_model: Optional[str] = None
    local_media_enabled: Optional[bool] = None
    local_diffusion_model: Optional[str] = None
    local_music_model: Optional[str] = None
    local_media_device: Optional[str] = None
    local_multi_agent_enabled: Optional[bool] = None
    local_web_rag_enabled: Optional[bool] = None
    fast_mode_enabled: Optional[bool] = None
    local_music_timeout_seconds: Optional[int] = None
    local_music_fast_mode: Optional[bool] = None
    local_diffusion_timeout_seconds: Optional[int] = None


class ModelCheckResponse(BaseModel):
    available: bool
    message: Optional[str] = None


class SettingsValidationResponse(BaseModel):
    ollama_model: ModelCheckResponse
    diffusion_model: ModelCheckResponse
    music_model: ModelCheckResponse


class SettingsTestRequest(BaseModel):
    target: str = Field(..., pattern="^(ollama|diffusion|music)$")


class SettingsTestResponse(BaseModel):
    success: bool
    message: Optional[str] = None


class AgentInfo(BaseModel):
    id: str
    name: str
    status: str
    details: Optional[str] = None
    run_count: Optional[int] = None
    last_run_ms: Optional[int] = None
    last_error: Optional[str] = None
    last_run_at: Optional[str] = None


class AgentListResponse(BaseModel):
    agents: List[AgentInfo]


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


class PromptCollectionTopic(BaseModel):
    topic_id: str
    topic_name: str
    icon: str = "•"
    prompts: List[str] = Field(default_factory=list)


class PromptCollectionCategory(BaseModel):
    category_id: str
    category_name: str
    color: str = "#2563eb"
    topic_count: int = 0
    prompt_count: int = 0
    topics: List[PromptCollectionTopic] = Field(default_factory=list)


class PromptCollectionsResponse(BaseModel):
    total_topics: int
    total_prompts: int
    categories: List[PromptCollectionCategory] = Field(default_factory=list)


class AwesomeMathImportRequest(BaseModel):
    categories: List[str] = Field(default_factory=list)
    dry_run: bool = False


class AwesomeMathImportResponse(BaseModel):
    matched_count: int
    imported_count: int
    existing_count: int
    imported_titles: List[str] = Field(default_factory=list)


# Animation models
class AnimationRenderRequest(BaseModel):
    scene_name: str
    quality: str = "low"  # low, medium, high
    output_format: str = "gif"  # gif or mp4
    background: bool = False


class AnimationResponse(BaseModel):
    id: str
    status: str  # pending, rendering, completed, error
    progress: int = 0
    scene_name: Optional[str] = None
    url: Optional[str] = None
    format: Optional[str] = None
    error: Optional[str] = None


class AnimationListResponse(BaseModel):
    scenes: List[Dict[str, str]]


class AnimationJobListResponse(BaseModel):
    jobs: List[AnimationResponse]


class EvalPromptResult(BaseModel):
    prompt: str
    duration_ms: int
    has_visualization: bool
    checks_pass_rate: float
    warning_count: int
    source: str = "catalog"  # catalog | live | fallback
    timed_out: bool = False
    error: Optional[str] = None


class EvalReportResponse(BaseModel):
    total_prompts: int
    avg_duration_ms: int
    visualization_coverage: float
    avg_checks_pass_rate: float
    mode: str = "catalog"
    run_label: Optional[str] = None
    run_tags: List[str] = Field(default_factory=list)
    timeout_count: int = 0
    error_count: int = 0
    latency_histogram: Dict[str, int] = {}
    results: List[EvalPromptResult]


class EvalRunSummary(BaseModel):
    id: str
    mode: str
    run_label: Optional[str] = None
    run_tags: List[str] = Field(default_factory=list)
    total_prompts: int
    avg_duration_ms: int
    visualization_coverage: float
    avg_checks_pass_rate: float
    timeout_count: int
    error_count: int
    created_at: datetime


class EvalHistoryResponse(BaseModel):
    runs: List[EvalRunSummary]


class VisualizationOnDemandRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    style: str = Field("diagram", pattern="^(diagram|animation)$")
    quality: str = Field("low", pattern="^(low|medium|high)$")
    output_format: str = Field("gif", pattern="^(gif|mp4)$")
    async_render: bool = True


class VisualizationOnDemandResponse(BaseModel):
    message: str
    visualization: Optional[VisualizationPayload] = None
    animation_id: Optional[str] = None
    visualization_job_id: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    error: Optional[str] = None


class VisualizationJobResponse(BaseModel):
    id: str
    status: str
    progress: int = 0
    question: Optional[str] = None
    visualization: Optional[VisualizationPayload] = None
    error: Optional[str] = None


class VisualizationJobListResponse(BaseModel):
    jobs: List[VisualizationJobResponse]


class HandwritingRecognizeRequest(BaseModel):
    image_data: str = Field(..., min_length=20, max_length=5_000_000)


class HandwritingRecognizeResponse(BaseModel):
    text: str
    confidence: float = 0.0
    message: Optional[str] = None


class HandwritingValidateRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    answer_text: str = Field(..., min_length=1, max_length=12000)


class HandwritingValidateResponse(BaseModel):
    status: str = Field(..., pattern="^(pass|warn)$")
    pass_rate: float
    checks: List[TutorCheck] = Field(default_factory=list)
    rag_feedback: List[str] = Field(default_factory=list)
    message: Optional[str] = None
