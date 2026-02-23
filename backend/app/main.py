"""Euclid's Window API - Main application."""
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
import json
import urllib.request
import urllib.error
import concurrent.futures
import time
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import get_settings
from .content import TopicCatalog
from .db import Concept, EvalRun, Resource, User, get_db, init_db
from .llm import generate_llm_response
from .logging_config import logger
from .metrics import metrics
from .middleware import MetricsMiddleware
from .ai.service import GenerativeTutorService
from .ai.media import DiffusionImageService, MusicGenService
from .ai.checker import SymbolicChecker
from .ai.handwriting import HandwritingService
from .ai.web_rag import WebMathRAG
from .ai.didactics import (
    adapt_plain_for_learner_level,
    build_learning_aids,
    build_self_correction,
    build_structured_explanations,
    compose_solution_for_mode,
    extract_learning_focus,
)
from .settings_store import SettingsStore
from .models import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConceptListResponse,
    ConceptResponse,
    ConversationListResponse,
    ConversationResponse,
    EuclidEntryResponse,
    EuclidSearchResponse,
    HealthResponse,
    MessageResponse,
    MindMapLink,
    MindMapNode,
    MindMapResponse,
    ProgressListResponse,
    ProgressResponse,
    ProgressUpdateRequest,
    ResourceResponse,
    ResourceSearchResponse,
    PromptCollectionCategory,
    PromptCollectionTopic,
    PromptCollectionsResponse,
    AwesomeMathImportRequest,
    AwesomeMathImportResponse,
    TokenResponse,
    TutorRequest,
    TutorResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
    VisualizationPayload,
    VisualizationType,
    MediaImageRequest,
    MediaImageResponse,
    MediaMusicRequest,
    MediaMusicResponse,
    AppSettingsResponse,
    AppSettingsUpdate,
    SettingsValidationResponse,
    ModelCheckResponse,
    SettingsTestRequest,
    SettingsTestResponse,
    AgentInfo,
    AgentListResponse,
    EvalPromptResult,
    EvalReportResponse,
    EvalHistoryResponse,
    EvalRunSummary,
    VisualizationOnDemandRequest,
    VisualizationOnDemandResponse,
    VisualizationJobResponse,
    VisualizationJobListResponse,
    HandwritingRecognizeRequest,
    HandwritingRecognizeResponse,
    HandwritingValidateRequest,
    HandwritingValidateResponse,
)
from .services import (
    ConversationService,
    EuclidService,
    MathMapService,
    MindMapService,
    ProgressService,
    ResourceService,
    UserService,
    VisualizationService,
)

settings = get_settings()

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR.parent / "frontend"
FRONTEND_NO_CACHE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
}
STATIC_VIZ_DIR = BASE_DIR / "static" / "visualizations"
STATIC_MEDIA_DIR = BASE_DIR / "static" / "media"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

catalog = TopicCatalog()
viz_service = VisualizationService()
tutor_service = GenerativeTutorService()
diffusion_service = DiffusionImageService()
music_service = MusicGenService()
settings_store = SettingsStore()
handwriting_service = HandwritingService()
symbolic_checker = SymbolicChecker()
web_rag = WebMathRAG()

app.add_middleware(MetricsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_VIZ_DIR.exists():
    app.mount("/visualizations", StaticFiles(directory=STATIC_VIZ_DIR), name="visualizations")
if STATIC_MEDIA_DIR.exists():
    app.mount("/media", StaticFiles(directory=STATIC_MEDIA_DIR), name="media")


# =============================================================================
# Frontend HTML routes
# =============================================================================
@app.get("/", include_in_schema=False)
async def serve_index():
    """Serve the main index.html."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path, headers=FRONTEND_NO_CACHE_HEADERS)
    raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/index.html", include_in_schema=False)
async def serve_index_html():
    """Serve index.html directly."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path, headers=FRONTEND_NO_CACHE_HEADERS)
    raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/mathmap.html", include_in_schema=False)
async def serve_mathmap():
    """Serve the Math Map page."""
    mathmap_path = FRONTEND_DIR / "mathmap.html"
    if mathmap_path.exists():
        return FileResponse(mathmap_path)
    raise HTTPException(status_code=404, detail="Math Map not found")


@app.get("/app.js", include_in_schema=False)
async def serve_app_js():
    """Serve the main app.js."""
    return FileResponse(FRONTEND_DIR / "app.js", headers=FRONTEND_NO_CACHE_HEADERS)


@app.get("/styles.css", include_in_schema=False)
async def serve_styles():
    """Serve the main styles.css."""
    return FileResponse(FRONTEND_DIR / "styles.css", headers=FRONTEND_NO_CACHE_HEADERS)


@app.get("/mathmap.js", include_in_schema=False)
async def serve_mathmap_js():
    """Serve mathmap.js."""
    return FileResponse(FRONTEND_DIR / "mathmap.js")


@app.get("/mathmap.css", include_in_schema=False)
async def serve_mathmap_css():
    """Serve mathmap.css."""
    return FileResponse(FRONTEND_DIR / "mathmap.css")


# =============================================================================
# Dependencies
# =============================================================================
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current user from Authorization header (optional)."""
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    service = UserService(db)
    return service.get_user_from_token(token)


def require_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """Require authenticated user."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:]
    service = UserService(db)
    user = service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


# =============================================================================
# Health endpoints
# =============================================================================
@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy", version=settings.app_version)


@app.get("/ready", response_model=HealthResponse)
async def readiness_check(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        return HealthResponse(status="ready", version=settings.app_version)
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Database not ready")


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(metrics.get_prometheus_format(), media_type="text/plain")


# =============================================================================
# Auth endpoints
# =============================================================================
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(payload: UserRegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = UserService(db)
    try:
        user = service.create_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = service.create_token(user)
    logger.info(f"User registered: {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            learning_level=user.learning_level,
            created_at=user.created_at.isoformat(),
        ),
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    service = UserService(db)
    user = service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = service.create_token(user)
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            learning_level=user.learning_level,
            created_at=user.created_at.isoformat(),
        ),
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_user)) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        learning_level=user.learning_level,
        created_at=user.created_at.isoformat(),
    )


@app.patch("/api/auth/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    service = UserService(db)
    user = service.update_profile(
        user,
        name=payload.name,
        learning_level=payload.learning_level,
    )
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        learning_level=user.learning_level,
        created_at=user.created_at.isoformat(),
    )


# =============================================================================
# Progress endpoints
# =============================================================================
@app.get("/api/progress", response_model=ProgressListResponse)
async def list_progress(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> ProgressListResponse:
    service = ProgressService(db)
    progress_list = service.list_progress(user.id)
    return ProgressListResponse(
        progress=[
            ProgressResponse(
                concept_slug=p.concept_slug,
                status=p.status,
                score=p.score,
                last_accessed=p.last_accessed.isoformat(),
            )
            for p in progress_list
        ]
    )


@app.put("/api/progress/{concept_slug}", response_model=ProgressResponse)
async def update_progress(
    concept_slug: str,
    payload: ProgressUpdateRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> ProgressResponse:
    service = ProgressService(db)
    progress = service.update_progress(
        user_id=user.id,
        concept_slug=concept_slug,
        status=payload.status,
        score=payload.score,
    )
    return ProgressResponse(
        concept_slug=progress.concept_slug,
        status=progress.status,
        score=progress.score,
        last_accessed=progress.last_accessed.isoformat(),
    )


# =============================================================================
# Conversation endpoints
# =============================================================================
@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(
    title: Optional[str] = None,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    service = ConversationService(db)
    conv = service.create_conversation(title=title, user_id=user.id if user else None)
    logger.info(f"Created conversation: {conv.id}")
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        messages=[],
    )


@app.get("/api/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationListResponse:
    service = ConversationService(db)
    convs = service.list_conversations(user_id=user.id if user else None)
    return ConversationListResponse(
        conversations=[
            ConversationResponse(
                id=c.id,
                title=c.title,
                created_at=c.created_at.isoformat(),
                updated_at=c.updated_at.isoformat(),
                messages=[],
            )
            for c in convs
        ]
    )


@app.get("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str, db: Session = Depends(get_db)
) -> ConversationResponse:
    service = ConversationService(db)
    conv = service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                visualization_id=m.visualization_id,
                created_at=m.created_at.isoformat(),
            )
            for m in conv.messages
        ],
    )


# =============================================================================
# Chat endpoint
# =============================================================================
@app.post("/api/chat/message", response_model=ChatMessageResponse)
async def chat_message(
    payload: ChatMessageRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatMessageResponse:
    service = ConversationService(db)

    # Get or create conversation
    conversation_id = payload.conversation_id
    if conversation_id:
        conv = service.get_conversation(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = service.create_conversation(
            title=payload.message[:50],
            user_id=user.id if user else None,
        )
        conversation_id = conv.id

    # Save user message
    service.add_message(conversation_id, role="user", content=payload.message)

    # Generate response
    topic = catalog.match_topic(payload.message)
    if not topic:
        tutor_result = tutor_service.answer(payload.message)
        if tutor_result:
            solution, visualization = tutor_result
            viz_id = visualization.viz_id if visualization else None
            service.add_message(
                conversation_id,
                role="assistant",
                content=solution,
                visualization_id=viz_id,
            )
            return ChatMessageResponse(
                conversation_id=conversation_id,
                response_text=solution,
                related_concepts=[],
                visualization=visualization,
            )
        llm_response = generate_llm_response(payload.message)
        if llm_response:
            service.add_message(conversation_id, role="assistant", content=llm_response)
            logger.info(f"LLM response for conversation {conversation_id}")
            return ChatMessageResponse(
                conversation_id=conversation_id,
                response_text=llm_response,
                related_concepts=[],
                visualization=None,
            )
        fallback_text = f"I don't have a specific lesson on \"{payload.message[:50]}\" yet, but I'm constantly learning! Try topics like:\n\n• Pythagorean theorem\n• Quadratic equations\n• Prime numbers\n• Fractions & rational numbers\n• Slope & linear equations\n• Exponents & logarithms\n\nOr explore the **Math Map** for 60+ topics!"
        service.add_message(conversation_id, role="assistant", content=fallback_text)
        return ChatMessageResponse(
            conversation_id=conversation_id,
            response_text=fallback_text,
            related_concepts=[],
            visualization=None,
        )

    visualization = viz_service.build_payload(catalog.build_visualization(topic))
    viz_id = visualization.viz_id if visualization else None

    service.add_message(
        conversation_id,
        role="assistant",
        content=topic["response_text"],
        visualization_id=viz_id,
    )
    logger.info(f"Topic match for conversation {conversation_id}: {topic['id']}")

    return ChatMessageResponse(
        conversation_id=conversation_id,
        response_text=topic["response_text"],
        related_concepts=topic.get("related_concepts", []),
        visualization=visualization,
    )


@app.post("/api/ai/tutor", response_model=TutorResponse)
async def ai_tutor(payload: TutorRequest) -> TutorResponse:
    def _is_followup_request(question: str, history_messages: Optional[list]) -> bool:
        q = (question or "").lower()
        followup_markers = (
            "step by step",
            "one step at a time",
            "in simpler",
            "analogy",
            "worked example",
            "2-question quiz",
            "test me",
            "derive",
            "counterexample",
            "proof-oriented",
            "i am still confused",
        )
        # Frontend includes current user turn in history. A length >= 3 implies
        # there is at least one earlier assistant response and this is a follow-up.
        has_prior_turns = bool(history_messages and len(history_messages) >= 3)
        return has_prior_turns or any(marker in q for marker in followup_markers)

    def _compose_response(solution_text: str, visualization_payload):
        enriched_solution = tutor_service.enrich_with_web_context(payload.question, solution_text)
        plain, axiomatic, checks, hints = build_structured_explanations(
            payload.question, enriched_solution
        )
        plain = adapt_plain_for_learner_level(plain, payload.learner_level, payload.question)
        takeaways, next_questions = build_learning_aids(
            extract_learning_focus(payload.question), plain, checks, payload.learner_level
        )
        self_correction = build_self_correction(payload.question, checks)
        return TutorResponse(
            solution=compose_solution_for_mode(payload.response_mode, plain, axiomatic),
            plain_explanation=plain,
            axiomatic_explanation=axiomatic,
            key_takeaways=takeaways,
            next_questions=next_questions,
            checks=checks,
            improvement_hints=hints,
            self_correction=self_correction,
            response_mode=payload.response_mode,
            learner_level=payload.learner_level,
            needs_visualization=visualization_payload is not None,
            visualization=visualization_payload,
        )

    history = [msg.model_dump() for msg in payload.history] if payload.history else None
    followup_request = _is_followup_request(payload.question, history)
    topic = catalog.match_topic(payload.question)
    if topic and not followup_request:
        visualization = viz_service.build_payload(catalog.build_visualization(topic))
        if visualization is None:
            visualization = tutor_service.fallback_visualization(payload.question)
        return _compose_response(topic["response_text"], visualization)

    followup_prompt = payload.question
    if followup_request:
        focus = extract_learning_focus(payload.question)
        followup_prompt = (
            f"{payload.question}\n\n"
            f"Context focus: {focus}.\n"
            "Do not repeat the same explanation verbatim. Continue the learning flow: "
            "1) one concise recap sentence, 2) one deeper step, 3) one worked example or quick check."
        )
    result = tutor_service.answer(followup_prompt, history=history)
    if not result:
        topic = catalog.match_topic(payload.question)
        if topic:
            visualization = viz_service.build_payload(catalog.build_visualization(topic))
            return _compose_response(topic["response_text"], visualization)
        raise HTTPException(status_code=503, detail="Local tutor not available")
    solution, visualization = result
    if visualization is None:
        visualization = tutor_service.fallback_visualization(payload.question)
    return _compose_response(solution, visualization)


@app.post("/api/ai/handwriting/recognize", response_model=HandwritingRecognizeResponse)
async def ai_handwriting_recognize(payload: HandwritingRecognizeRequest) -> HandwritingRecognizeResponse:
    try:
        text, confidence = handwriting_service.recognize(payload.image_data)
        message = "Converted rough-pad handwriting to typed text."
        if not text.strip():
            message = "Could not confidently read handwriting. Try writing larger or darker."
        return HandwritingRecognizeResponse(text=text, confidence=confidence, message=message)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.warning(f"Handwriting recognition failed: {exc}")
        raise HTTPException(status_code=400, detail="Failed to decode or process handwriting image.") from exc


@app.post("/api/ai/handwriting/validate", response_model=HandwritingValidateResponse)
async def ai_handwriting_validate(payload: HandwritingValidateRequest) -> HandwritingValidateResponse:
    checks = symbolic_checker.run(payload.question, payload.answer_text)
    pass_count = sum(1 for check in checks if check.status == "pass")
    total = len(checks) or 1
    pass_rate = round(pass_count / total, 3)
    status = "pass" if pass_rate >= 0.75 else "warn"
    message = "Validation complete."
    rag_feedback = []
    if status == "warn":
        snippets = web_rag.retrieve(payload.question, limit=2)
        if snippets:
            rag_feedback = [
                f"{item.title}: {item.snippet.split('.')[0].strip()} ({item.url})"
                for item in snippets
            ]
            message = "Validation completed with warnings. Added web references to help self-check."
    return HandwritingValidateResponse(
        status=status,
        pass_rate=pass_rate,
        checks=checks,
        rag_feedback=rag_feedback,
        message=message,
    )


def _pick_animation_scene(question: str) -> Optional[str]:
    q = (question or "").lower()
    mapping = [
        ("eigen", "EigenTransform"),
        ("taylor", "TaylorApproximation"),
        ("polar", "PolarCoordinatesIntro"),
        ("fft", "FFTIntuition"),
        ("dft", "FFTIntuition"),
        ("euler", "EulerIdentityCircle"),
    ]
    for token, scene in mapping:
        if token in q:
            return scene
    return None


@app.post("/api/ai/visualize", response_model=VisualizationOnDemandResponse)
async def ai_visualize(payload: VisualizationOnDemandRequest) -> VisualizationOnDemandResponse:
    if payload.style == "diagram":
        if payload.async_render:
            job = tutor_service.start_diagram_job(payload.question)
            if job.get("status") == "completed" and job.get("visualization"):
                return VisualizationOnDemandResponse(
                    message="Generated diagram from deterministic visualization planner.",
                    visualization=job.get("visualization"),
                    visualization_job_id=job.get("id"),
                    status="completed",
                    progress=100,
                )
            return VisualizationOnDemandResponse(
                message="Diagram generation started in background.",
                visualization=None,
                visualization_job_id=job.get("id"),
                status=job.get("status"),
                progress=job.get("progress"),
                error=job.get("error"),
            )
        viz = tutor_service.fallback_visualization(payload.question)
        if viz:
            return VisualizationOnDemandResponse(
                message="Generated diagram from deterministic visualization planner.",
                visualization=viz,
            )
        # Ask tutor pipeline for visualization-specific response as fallback.
        result = tutor_service.answer(f"{payload.question}. Provide a visualization.", history=None)
        if result and result[1]:
            return VisualizationOnDemandResponse(
                message="Generated diagram from tutor visualization pipeline.",
                visualization=result[1],
            )
        return VisualizationOnDemandResponse(
            message="No diagram plan available for this topic yet.",
            visualization=None,
            status="not_found",
            progress=0,
        )

    # payload.style == "animation"
    scene_name = _pick_animation_scene(payload.question)
    if not scene_name:
        return VisualizationOnDemandResponse(
            message="No mapped animation scene for this topic yet. Try a diagram instead.",
            visualization=None,
            status="not_found",
            progress=0,
        )
    if payload.async_render:
        job = manim_service.start_render_animation(
            scene_name=scene_name,
            quality=payload.quality,
            output_format=payload.output_format,
        )
        if job.get("status") == "completed" and job.get("url"):
            viz = VisualizationPayload(
                viz_id=job["id"],
                viz_type=VisualizationType.manim,
                title=f"Animation: {scene_name}",
                data={"url": job["url"], "format": job.get("format") or payload.output_format},
            )
            return VisualizationOnDemandResponse(
                message="Animation already available.",
                visualization=viz,
                animation_id=job.get("id"),
                status="completed",
                progress=100,
            )
        return VisualizationOnDemandResponse(
            message="Animation render started in background.",
            visualization=None,
            animation_id=job.get("id"),
            status=job.get("status"),
            progress=job.get("progress"),
            error=job.get("error"),
        )
    result = manim_service.render_animation(
        scene_name=scene_name, quality=payload.quality, output_format=payload.output_format
    )
    if result.get("status") != "completed" or not result.get("url"):
        return VisualizationOnDemandResponse(
            message=result.get("error") or "Animation rendering failed.",
            visualization=None,
        )
    viz = VisualizationPayload(
        viz_id=result["id"],
        viz_type=VisualizationType.manim,
        title=f"Animation: {scene_name}",
        data={"url": result["url"], "format": result.get("format") or payload.output_format},
    )
    return VisualizationOnDemandResponse(
        message="Animation rendered successfully.",
        visualization=viz,
    )


@app.post("/api/ai/media/image", response_model=MediaImageResponse)
async def ai_media_image(payload: MediaImageRequest) -> MediaImageResponse:
    url = diffusion_service.generate(payload.prompt)
    if not url:
        raise HTTPException(status_code=503, detail="Image generation not available")
    return MediaImageResponse(url=url, model=diffusion_service.model_id)


@app.post("/api/ai/media/music", response_model=MediaMusicResponse)
async def ai_media_music(payload: MediaMusicRequest) -> MediaMusicResponse:
    url = music_service.generate(payload.prompt, duration_seconds=payload.duration_seconds)
    if not url:
        raise HTTPException(status_code=503, detail="Music generation not available")
    return MediaMusicResponse(url=url, model=music_service.model_id)


@app.get("/api/settings", response_model=AppSettingsResponse)
async def get_app_settings() -> AppSettingsResponse:
    return AppSettingsResponse(**settings_store.get_effective_settings())


@app.put("/api/settings", response_model=AppSettingsResponse)
async def update_app_settings(payload: AppSettingsUpdate) -> AppSettingsResponse:
    settings_store.update(payload.model_dump(exclude_unset=True))
    return AppSettingsResponse(**settings_store.get_effective_settings())


@app.get("/api/settings/validate", response_model=SettingsValidationResponse)
async def validate_app_settings() -> SettingsValidationResponse:
    effective = settings_store.get_effective_settings()
    ollama_check = _check_ollama_model(effective.get("local_llm_model"))
    diffusion_check = _check_hf_model(effective.get("local_diffusion_model"))
    music_check = _check_hf_model(effective.get("local_music_model"))
    return SettingsValidationResponse(
        ollama_model=ollama_check,
        diffusion_model=diffusion_check,
        music_model=music_check,
    )


@app.post("/api/settings/test", response_model=SettingsTestResponse)
async def test_app_settings(payload: SettingsTestRequest) -> SettingsTestResponse:
    target = payload.target
    effective = settings_store.get_effective_settings()

    if target == "ollama":
        check = _check_ollama_model(effective.get("local_llm_model"))
        return SettingsTestResponse(success=check.available, message=check.message)

    if target == "diffusion":
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                diffusion_service.generate, "Simple geometric diagram, clean and minimal"
            )
            try:
                ok = future.result(timeout=8)
            except concurrent.futures.TimeoutError:
                return SettingsTestResponse(
                    success=False,
                    message="Diffusion test timed out (model may still be loading)",
                )
        return SettingsTestResponse(
            success=bool(ok),
            message="Diffusion test succeeded" if ok else "Diffusion test failed",
        )

    if target == "music":
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                music_service.generate, "A short classical arpeggio", 3
            )
            try:
                ok = future.result(timeout=8)
            except concurrent.futures.TimeoutError:
                return SettingsTestResponse(
                    success=False,
                    message="Music test timed out (model may still be loading)",
                )
        return SettingsTestResponse(
            success=bool(ok),
            message="Music test succeeded" if ok else "Music test failed",
        )

    raise HTTPException(status_code=400, detail="Unknown test target")


@app.get("/api/agents", response_model=AgentListResponse)
async def list_agents() -> AgentListResponse:
    effective = settings_store.get_effective_settings()
    agents = [
        AgentInfo(
            id="tutor",
            name="Local Tutor",
            status="enabled" if effective.get("local_ai_enabled") else "disabled",
            details=f"Model: {effective.get('local_llm_model')}",
        ),
        AgentInfo(
            id="planner_agent",
            name="Planner Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Creates initial plan",
        ),
        AgentInfo(
            id="intuition_agent",
            name="Intuition Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Adds intuition section",
        ),
        AgentInfo(
            id="examples_agent",
            name="Examples Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Adds examples section",
        ),
        AgentInfo(
            id="proof_agent",
            name="Proof Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Adds proof sketch",
        ),
        AgentInfo(
            id="visualization_agent",
            name="Visualization Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Adds visualization idea",
        ),
        AgentInfo(
            id="history_agent",
            name="History Agent",
            status="enabled" if effective.get("local_multi_agent_enabled") else "disabled",
            details="Adds historical context",
        ),
        AgentInfo(
            id="web_research_agent",
            name="Web Research RAG Agent",
            status=(
                "enabled"
                if effective.get("local_multi_agent_enabled") and effective.get("local_web_rag_enabled", True)
                else "disabled"
            ),
            details="Retrieves focused web snippets for long-tail math topics",
        ),
        AgentInfo(
            id="visualization",
            name="Visualization Executor",
            status="enabled",
            details="Plotly + Manim",
        ),
        AgentInfo(
            id="diffusion",
            name="Diffusion Image",
            status="enabled" if effective.get("local_media_enabled") else "disabled",
            details=f"Model: {effective.get('local_diffusion_model')}",
        ),
        AgentInfo(
            id="music",
            name="Music Generator",
            status="enabled" if effective.get("local_media_enabled") else "disabled",
            details=f"Model: {effective.get('local_music_model')}",
        ),
    ]
    return AgentListResponse(agents=[_attach_metrics(agent) for agent in agents])


def _compute_eval_report(
    live: bool, per_prompt_timeout_ms: int, run_label: Optional[str] = None, run_tags: Optional[list[str]] = None
) -> EvalReportResponse:
    prompts = [
        "Explain eigenvalues with visualization",
        "Explain the Pythagorean theorem",
        "Show a number line",
        "Explain base conversion",
        "Graph a parabola",
        "Explain vectors",
        "Explain integral",
        "Explain probability",
        "Explain polar coordinates",
        "Explain Taylor series",
        "Explain roots of unity",
        "Explain FFT and DFT",
    ]
    results: list[EvalPromptResult] = []
    total_duration = 0
    visual_count = 0
    total_pass_rate = 0.0
    timeout_count = 0
    error_count = 0
    latency_histogram = {"lt_500ms": 0, "500_to_1000ms": 0, "1000_to_2000ms": 0, "gte_2000ms": 0}

    for prompt in prompts:
        start = time.perf_counter()
        timed_out = False
        source = "catalog"
        error = None
        solution_text = ""
        has_viz = False

        if live:
            source = "live"
            timeout_s = per_prompt_timeout_ms / 1000.0
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(tutor_service.answer, prompt, None)
                    answer = future.result(timeout=timeout_s)
                if answer:
                    solution_text, visualization = answer
                    has_viz = visualization is not None
                    if not has_viz:
                        has_viz = tutor_service.fallback_visualization(prompt) is not None
                else:
                    # Soft fallback to catalog when live tutor unavailable.
                    source = "fallback"
            except concurrent.futures.TimeoutError:
                timed_out = True
                timeout_count += 1
                error_count += 1
                error = "timeout"
                source = "fallback"
            except Exception as exc:
                error_count += 1
                error = str(exc)[:200]
                source = "fallback"

        if source != "live":
            topic = catalog.match_topic(prompt)
            if topic:
                solution_text = topic["response_text"]
                has_viz = (
                    viz_service.build_payload(catalog.build_visualization(topic)) is not None
                    or tutor_service.visual_planner.is_visual_topic(prompt)
                )
            else:
                # Deterministic, fast eval path (no LLM calls).
                solution_text = "No catalog lesson matched; deep evaluation requires live tutor mode."
                has_viz = tutor_service.visual_planner.is_visual_topic(prompt)

        _, _, checks, _ = build_structured_explanations(prompt, solution_text)
        warning_count = sum(1 for c in checks if c.status == "warn")
        pass_count = sum(1 for c in checks if c.status == "pass")
        pass_rate = pass_count / max(1, len(checks))
        duration_ms = int((time.perf_counter() - start) * 1000)

        if duration_ms < 500:
            latency_histogram["lt_500ms"] += 1
        elif duration_ms < 1000:
            latency_histogram["500_to_1000ms"] += 1
        elif duration_ms < 2000:
            latency_histogram["1000_to_2000ms"] += 1
        else:
            latency_histogram["gte_2000ms"] += 1

        total_duration += duration_ms
        total_pass_rate += pass_rate
        if has_viz:
            visual_count += 1

        results.append(
            EvalPromptResult(
                prompt=prompt,
                duration_ms=duration_ms,
                has_visualization=has_viz,
                checks_pass_rate=round(pass_rate, 4),
                warning_count=warning_count,
                source=source,
                timed_out=timed_out,
                error=error,
            )
        )

    total_prompts = len(results)
    return EvalReportResponse(
        total_prompts=total_prompts,
        avg_duration_ms=int(total_duration / max(1, total_prompts)),
        visualization_coverage=round(visual_count / max(1, total_prompts), 4),
        avg_checks_pass_rate=round(total_pass_rate / max(1, total_prompts), 4),
        mode="live" if live else "catalog",
        run_label=run_label,
        run_tags=run_tags or [],
        timeout_count=timeout_count,
        error_count=error_count,
        latency_histogram=latency_histogram,
        results=results,
    )


def _save_eval_run(db: Session, report: EvalReportResponse) -> EvalRun:
    run = EvalRun(
        mode=report.mode,
        total_prompts=report.total_prompts,
        avg_duration_ms=report.avg_duration_ms,
        visualization_coverage=report.visualization_coverage,
        avg_checks_pass_rate=report.avg_checks_pass_rate,
        timeout_count=report.timeout_count,
        error_count=report.error_count,
        report_json=json.dumps(report.model_dump()),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@app.get("/api/eval/report", response_model=EvalReportResponse)
async def eval_report(
    live: bool = Query(False, description="Run live tutor pipeline for each prompt"),
    per_prompt_timeout_ms: int = Query(
        2500, ge=200, le=30000, description="Per-prompt timeout for live eval mode"
    ),
    run_label: Optional[str] = Query(None, description="Optional label for this evaluation run"),
    run_tags: Optional[str] = Query(None, description="Comma-separated tags for this evaluation run"),
    persist: bool = Query(True, description="Persist report for trend history"),
    db: Session = Depends(get_db),
) -> EvalReportResponse:
    tags = [t.strip() for t in (run_tags or "").split(",") if t.strip()]
    report = _compute_eval_report(
        live=live,
        per_prompt_timeout_ms=per_prompt_timeout_ms,
        run_label=run_label,
        run_tags=tags,
    )
    if persist:
        _save_eval_run(db, report)
    return report


@app.get("/api/eval/history", response_model=EvalHistoryResponse)
async def eval_history(
    limit: int = Query(20, ge=1, le=200),
    mode: Optional[str] = Query(None, pattern="^(catalog|live)$"),
    tag: Optional[str] = Query(None),
    label_contains: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> EvalHistoryResponse:
    rows = db.query(EvalRun).order_by(EvalRun.created_at.desc()).limit(limit).all()
    runs = []
    for row in rows:
        payload = {}
        if row.report_json:
            try:
                payload = json.loads(row.report_json)
            except Exception:
                payload = {}
        summary = EvalRunSummary(
            id=row.id,
            mode=row.mode,
            run_label=payload.get("run_label"),
            run_tags=payload.get("run_tags") or [],
            total_prompts=row.total_prompts,
            avg_duration_ms=row.avg_duration_ms,
            visualization_coverage=row.visualization_coverage,
            avg_checks_pass_rate=row.avg_checks_pass_rate,
            timeout_count=row.timeout_count,
            error_count=row.error_count,
            created_at=row.created_at,
        )
        if mode and summary.mode != mode:
            continue
        if tag and tag not in summary.run_tags:
            continue
        if label_contains and label_contains.lower() not in (summary.run_label or "").lower():
            continue
        runs.append(summary)
    return EvalHistoryResponse(runs=runs)


@app.get("/api/eval/compare")
async def eval_compare(
    run_a_id: str = Query(...),
    run_b_id: str = Query(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    row_a = db.query(EvalRun).filter(EvalRun.id == run_a_id).first()
    row_b = db.query(EvalRun).filter(EvalRun.id == run_b_id).first()
    if not row_a or not row_b:
        raise HTTPException(status_code=404, detail="One or both eval runs not found")

    payload_a = EvalReportResponse(**json.loads(row_a.report_json))
    payload_b = EvalReportResponse(**json.loads(row_b.report_json))

    return {
        "run_a": {
            "id": row_a.id,
            "label": payload_a.run_label,
            "mode": payload_a.mode,
            "avg_duration_ms": payload_a.avg_duration_ms,
            "avg_checks_pass_rate": payload_a.avg_checks_pass_rate,
            "visualization_coverage": payload_a.visualization_coverage,
            "timeout_count": payload_a.timeout_count,
            "error_count": payload_a.error_count,
        },
        "run_b": {
            "id": row_b.id,
            "label": payload_b.run_label,
            "mode": payload_b.mode,
            "avg_duration_ms": payload_b.avg_duration_ms,
            "avg_checks_pass_rate": payload_b.avg_checks_pass_rate,
            "visualization_coverage": payload_b.visualization_coverage,
            "timeout_count": payload_b.timeout_count,
            "error_count": payload_b.error_count,
        },
        "delta": {
            "avg_duration_ms": payload_b.avg_duration_ms - payload_a.avg_duration_ms,
            "avg_checks_pass_rate": round(
                payload_b.avg_checks_pass_rate - payload_a.avg_checks_pass_rate, 4
            ),
            "visualization_coverage": round(
                payload_b.visualization_coverage - payload_a.visualization_coverage, 4
            ),
            "timeout_count": payload_b.timeout_count - payload_a.timeout_count,
            "error_count": payload_b.error_count - payload_a.error_count,
        },
    }


@app.get("/api/eval/report/export")
async def eval_report_export(
    format: str = Query("json", pattern="^(json|csv)$"),
    latest: bool = Query(True, description="Export latest persisted run when available"),
    live: bool = Query(False),
    per_prompt_timeout_ms: int = Query(2500, ge=200, le=30000),
    run_label: Optional[str] = Query(None),
    run_tags: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    report: EvalReportResponse
    tags = [t.strip() for t in (run_tags or "").split(",") if t.strip()]
    if latest:
        row = db.query(EvalRun).order_by(EvalRun.created_at.desc()).first()
        if row:
            report = EvalReportResponse(**json.loads(row.report_json))
        else:
            report = _compute_eval_report(
                live=live,
                per_prompt_timeout_ms=per_prompt_timeout_ms,
                run_label=run_label,
                run_tags=tags,
            )
    else:
        report = _compute_eval_report(
            live=live,
            per_prompt_timeout_ms=per_prompt_timeout_ms,
            run_label=run_label,
            run_tags=tags,
        )

    if format == "json":
        body = json.dumps(report.model_dump(), indent=2)
        return Response(
            content=body,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=eval-report.json"},
        )

    csv_lines = [
        "prompt,duration_ms,has_visualization,checks_pass_rate,warning_count,source,timed_out,error"
    ]
    for r in report.results:
        prompt = (r.prompt or "").replace('"', '""')
        err = (r.error or "").replace('"', '""')
        csv_lines.append(
            f"\"{prompt}\",{r.duration_ms},{str(r.has_visualization).lower()},{r.checks_pass_rate},"
            f"{r.warning_count},{r.source},{str(r.timed_out).lower()},\"{err}\""
        )
    csv_body = "\n".join(csv_lines)
    return Response(
        content=csv_body,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=eval-report.csv"},
    )


def _check_ollama_model(model: Optional[str]) -> ModelCheckResponse:
    if not model:
        return ModelCheckResponse(available=False, message="No Ollama model configured")
    settings = get_settings()
    base_url = settings.local_llm_base_url
    if not base_url:
        return ModelCheckResponse(
            available=False,
            message="Ollama base URL not configured",
        )
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            body = json.loads(response.read().decode("utf-8"))
            models = [m.get("name") for m in body.get("models", [])]
            if model in models:
                return ModelCheckResponse(available=True, message="Model found in Ollama")
            return ModelCheckResponse(available=False, message="Model not found in Ollama")
    except urllib.error.URLError as exc:
        return ModelCheckResponse(available=False, message=f"Ollama check failed: {exc}")


def _check_hf_model(model_id: Optional[str]) -> ModelCheckResponse:
    if not model_id:
        return ModelCheckResponse(available=False, message="No HF model configured")
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        api.model_info(model_id)
        return ModelCheckResponse(available=True, message="Model exists on Hugging Face")
    except Exception as exc:
        return ModelCheckResponse(available=False, message=f"HF check failed: {exc}")


def _attach_metrics(info: AgentInfo) -> AgentInfo:
    from .ai.agent_registry import get_metrics
    metrics = get_metrics(info.id)
    info.run_count = metrics.run_count
    info.last_run_ms = metrics.last_run_ms
    info.last_error = metrics.last_error
    info.last_run_at = metrics.last_run_at
    return info


# =============================================================================
# Visualization endpoint
# =============================================================================
@app.get("/api/visualizations/jobs", response_model=VisualizationJobListResponse)
async def list_visualization_jobs(limit: int = 20) -> VisualizationJobListResponse:
    jobs = [VisualizationJobResponse(**row) for row in tutor_service.list_diagram_jobs(limit=limit)]
    return VisualizationJobListResponse(jobs=jobs)


@app.get("/api/visualizations/jobs/{job_id}", response_model=VisualizationJobResponse)
async def get_visualization_job(job_id: str) -> VisualizationJobResponse:
    return VisualizationJobResponse(**tutor_service.get_diagram_job(job_id))


@app.delete("/api/visualizations/jobs/{job_id}")
async def delete_visualization_job(job_id: str) -> Dict[str, bool]:
    return {"deleted": tutor_service.delete_diagram_job(job_id)}


@app.get("/api/visualizations/{viz_id}")
async def get_visualization(viz_id: str) -> Dict[str, Any]:
    result = viz_service.get_by_id(viz_id)
    if not result:
        raise HTTPException(status_code=404, detail="Visualization not found")
    return result


# =============================================================================
# Mind Map endpoints
# =============================================================================
@app.get("/api/mindmap/{concept_slug}", response_model=MindMapResponse)
async def get_mind_map(
    concept_slug: str,
    depth: int = 3,
    include_leads_to: bool = True,
    db: Session = Depends(get_db),
) -> MindMapResponse:
    service = MindMapService(db)
    result = service.build_mind_map(concept_slug, depth=depth, include_leads_to=include_leads_to)
    if not result:
        raise HTTPException(status_code=404, detail="Concept not found")
    return MindMapResponse(
        target=result["target"],
        nodes=[MindMapNode(**n) for n in result["nodes"]],
        links=[MindMapLink(**l) for l in result["links"]],
    )


@app.get("/api/concepts", response_model=ConceptListResponse)
async def list_concepts(
    category: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> ConceptListResponse:
    service = MindMapService(db)
    concepts = service.list_concepts(category=category, limit=limit)
    return ConceptListResponse(
        concepts=[
            ConceptResponse(
                id=c.id,
                slug=c.slug,
                name=c.name,
                description=c.description,
                level=c.level,
                category=c.category,
                euclid_ref=c.euclid_ref,
            )
            for c in concepts
        ]
    )


# =============================================================================
# Euclid endpoints
# =============================================================================
@app.get("/api/euclid/{reference}", response_model=EuclidEntryResponse)
async def get_euclid_entry(reference: str, db: Session = Depends(get_db)) -> EuclidEntryResponse:
    service = EuclidService(db)
    entry = service.get_by_reference(reference)
    if not entry:
        raise HTTPException(status_code=404, detail="Euclid entry not found")
    return EuclidEntryResponse(
        id=entry.id,
        reference=entry.reference,
        book=entry.book,
        entry_type=entry.entry_type,
        number=entry.number,
        original_text=entry.original_text,
        modern_text=entry.modern_text,
    )


@app.get("/api/euclid", response_model=EuclidSearchResponse)
async def search_euclid(
    query: Optional[str] = None,
    book: Optional[int] = None,
    entry_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> EuclidSearchResponse:
    service = EuclidService(db)
    entries = service.search(query=query, book=book, entry_type=entry_type, limit=limit)
    return EuclidSearchResponse(
        entries=[
            EuclidEntryResponse(
                id=e.id,
                reference=e.reference,
                book=e.book,
                entry_type=e.entry_type,
                number=e.number,
                original_text=e.original_text,
                modern_text=e.modern_text,
            )
            for e in entries
        ]
    )


# =============================================================================
# Resource endpoints
# =============================================================================
@app.get("/api/prompt-collections", response_model=PromptCollectionsResponse)
async def prompt_collections(category_id: Optional[str] = None) -> PromptCollectionsResponse:
    data = mathmap_service.get_full_map()
    categories = []
    total_topics = 0
    total_prompts = 0
    for cat in data.get("categories", []):
        if category_id and cat.get("id") != category_id:
            continue
        topics = []
        prompt_count = 0
        for topic in cat.get("topics", []):
            prompts = [str(p) for p in topic.get("prompts", []) if str(p).strip()]
            prompt_count += len(prompts)
            topics.append(
                PromptCollectionTopic(
                    topic_id=topic.get("id", ""),
                    topic_name=topic.get("name", "Topic"),
                    icon=topic.get("icon", "•"),
                    prompts=prompts,
                )
            )
        categories.append(
            PromptCollectionCategory(
                category_id=cat.get("id", ""),
                category_name=cat.get("name", "Category"),
                color=cat.get("color", "#2563eb"),
                topic_count=len(topics),
                prompt_count=prompt_count,
                topics=topics,
            )
        )
        total_topics += len(topics)
        total_prompts += prompt_count
    return PromptCollectionsResponse(
        total_topics=total_topics,
        total_prompts=total_prompts,
        categories=categories,
    )


def _load_awesome_math_resources() -> list[dict]:
    path = BASE_DIR / "data" / "seed_resources.json"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning(f"Failed to load awesome-math resources: {exc}")
        return []
    resources = payload.get("resources", [])
    return [r for r in resources if str(r.get("source", "")).lower() == "awesome-math"]


@app.get("/api/resources", response_model=ResourceSearchResponse)
async def search_resources(
    query: Optional[str] = None,
    resource_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
) -> ResourceSearchResponse:
    service = ResourceService(db)
    resources = service.search(
        query=query, resource_type=resource_type, difficulty=difficulty, limit=limit
    )
    return ResourceSearchResponse(
        resources=[
            ResourceResponse(
                id=r.id,
                title=r.title,
                author=r.author,
                resource_type=r.resource_type,
                difficulty=r.difficulty,
                url=r.url,
                isbn=r.isbn,
                description=r.description,
            )
            for r in resources
        ]
    )


@app.post("/api/resources/import/awesome-math", response_model=AwesomeMathImportResponse)
async def import_awesome_math_resources(
    payload: AwesomeMathImportRequest,
    db: Session = Depends(get_db),
) -> AwesomeMathImportResponse:
    categories = {c.strip().lower() for c in (payload.categories or []) if c.strip()}
    catalog = _load_awesome_math_resources()
    selected = []
    for entry in catalog:
        entry_categories = {str(c).strip().lower() for c in entry.get("awesome_categories", [])}
        if categories and not (entry_categories & categories):
            continue
        selected.append(entry)

    imported = 0
    existing = 0
    imported_titles: list[str] = []
    for entry in selected:
        resource = db.query(Resource).filter(Resource.title == entry["title"]).first()
        if resource:
            existing += 1
        else:
            if payload.dry_run:
                imported += 1
                imported_titles.append(entry["title"])
                continue
            resource = Resource(
                title=entry["title"],
                author=entry.get("author"),
                resource_type=entry.get("resource_type", "reference"),
                difficulty=entry.get("difficulty"),
                url=entry.get("url"),
                isbn=entry.get("isbn"),
                description=entry.get("description"),
            )
            db.add(resource)
            db.flush()
            imported += 1
            imported_titles.append(entry["title"])
        for slug in entry.get("concepts", []):
            concept = db.query(Concept).filter(Concept.slug == slug).first()
            if concept and concept not in resource.concepts:
                resource.concepts.append(concept)

    if not payload.dry_run:
        db.commit()
    return AwesomeMathImportResponse(
        matched_count=len(selected),
        imported_count=imported,
        existing_count=existing,
        imported_titles=imported_titles[:50],
    )


@app.get("/api/resources/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: str, db: Session = Depends(get_db)) -> ResourceResponse:
    service = ResourceService(db)
    resource = service.get_by_id(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ResourceResponse(
        id=resource.id,
        title=resource.title,
        author=resource.author,
        resource_type=resource.resource_type,
        difficulty=resource.difficulty,
        url=resource.url,
        isbn=resource.isbn,
        description=resource.description,
    )


@app.get("/api/concepts/{concept_slug}/resources", response_model=ResourceSearchResponse)
async def get_concept_resources(
    concept_slug: str, db: Session = Depends(get_db)
) -> ResourceSearchResponse:
    service = ResourceService(db)
    resources = service.get_for_concept(concept_slug)
    return ResourceSearchResponse(
        resources=[
            ResourceResponse(
                id=r.id,
                title=r.title,
                author=r.author,
                resource_type=r.resource_type,
                difficulty=r.difficulty,
                url=r.url,
                isbn=r.isbn,
                description=r.description,
            )
            for r in resources
        ]
    )


# =============================================================================
# Math Map endpoints
# =============================================================================
mathmap_service = MathMapService()


@app.get("/api/mathmap")
async def get_math_map() -> Dict[str, Any]:
    """Get the complete interactive math map."""
    return mathmap_service.get_full_map()


@app.get("/api/mathmap/categories")
async def get_math_map_categories() -> Dict[str, Any]:
    """Get list of math map categories."""
    return {"categories": mathmap_service.get_categories()}


@app.get("/api/mathmap/category/{category_id}")
async def get_math_map_category(category_id: str) -> Dict[str, Any]:
    """Get a specific category with its topics."""
    category = mathmap_service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@app.get("/api/mathmap/topic/{topic_id}")
async def get_math_map_topic(topic_id: str) -> Dict[str, Any]:
    """Get a specific topic with its prompts."""
    topic = mathmap_service.get_topic(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@app.get("/api/mathmap/search")
async def search_math_map(query: str) -> Dict[str, Any]:
    """Search topics by name or content."""
    results = mathmap_service.search_topics(query)
    return {"results": results}


# =============================================================================
# Animation endpoints (Manim)
# =============================================================================
from .services import ManimService
from .models import AnimationRenderRequest, AnimationResponse, AnimationListResponse, AnimationJobListResponse

manim_service = ManimService()

# Mount animations static directory
ANIMATIONS_DIR = BASE_DIR / "static" / "animations"
ANIMATIONS_DIR.mkdir(parents=True, exist_ok=True)
if ANIMATIONS_DIR.exists():
    app.mount("/animations", StaticFiles(directory=ANIMATIONS_DIR), name="animations")


@app.get("/api/animations/scenes", response_model=AnimationListResponse)
async def list_animation_scenes() -> AnimationListResponse:
    """List all available animation scenes."""
    scenes = manim_service.list_available_scenes()
    return AnimationListResponse(scenes=scenes)


@app.get("/api/animations/jobs", response_model=AnimationJobListResponse)
async def list_animation_jobs(limit: int = 20) -> AnimationJobListResponse:
    jobs = [AnimationResponse(**row) for row in manim_service.list_jobs(limit=limit)]
    return AnimationJobListResponse(jobs=jobs)


@app.post("/api/animations/render", response_model=AnimationResponse)
async def render_animation(request: AnimationRenderRequest) -> AnimationResponse:
    """Render a Manim animation."""
    if request.background:
        job = manim_service.start_render_animation(
            scene_name=request.scene_name,
            quality=request.quality,
            output_format=request.output_format,
        )
        return AnimationResponse(**job)
    result = manim_service.render_animation(
        scene_name=request.scene_name,
        quality=request.quality,
        output_format=request.output_format,
    )
    if "progress" not in result:
        result["progress"] = 100 if result.get("status") == "completed" else 0
    return AnimationResponse(**result)


@app.get("/api/animations/{animation_id}", response_model=AnimationResponse)
async def get_animation(animation_id: str) -> AnimationResponse:
    """Get animation status and URL."""
    return AnimationResponse(**manim_service.get_animation_status(animation_id))


@app.delete("/api/animations/{animation_id}")
async def delete_animation(animation_id: str) -> Dict[str, bool]:
    """Delete a cached animation."""
    deleted = manim_service.delete_animation(animation_id)
    return {"deleted": deleted}


@app.get("/api/animations/status/manim")
async def manim_status() -> Dict[str, Any]:
    """Check if Manim is available on this system."""
    return {
        "available": manim_service.manim_available,
        "scenes_count": len(manim_service.list_available_scenes()),
    }
