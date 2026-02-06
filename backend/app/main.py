"""Euclid's Window API - Main application."""
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import get_settings
from .content import TopicCatalog
from .db import User, get_db, init_db
from .llm import generate_llm_response
from .logging_config import logger
from .metrics import metrics
from .middleware import MetricsMiddleware
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
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
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
STATIC_VIZ_DIR = BASE_DIR / "static" / "visualizations"


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


# =============================================================================
# Frontend HTML routes
# =============================================================================
@app.get("/", include_in_schema=False)
async def serve_index():
    """Serve the main index.html."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/index.html", include_in_schema=False)
async def serve_index_html():
    """Serve index.html directly."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
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
    return FileResponse(FRONTEND_DIR / "app.js")


@app.get("/styles.css", include_in_schema=False)
async def serve_styles():
    """Serve the main styles.css."""
    return FileResponse(FRONTEND_DIR / "styles.css")


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


# =============================================================================
# Visualization endpoint
# =============================================================================
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
from .models import AnimationRenderRequest, AnimationResponse, AnimationListResponse

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


@app.post("/api/animations/render", response_model=AnimationResponse)
async def render_animation(request: AnimationRenderRequest) -> AnimationResponse:
    """Render a Manim animation."""
    result = manim_service.render_animation(
        scene_name=request.scene_name,
        quality=request.quality,
        output_format=request.output_format,
    )
    return AnimationResponse(**result)


@app.get("/api/animations/{animation_id}", response_model=AnimationResponse)
async def get_animation(animation_id: str) -> AnimationResponse:
    """Get animation status and URL."""
    cached = manim_service.get_cached_animation(animation_id)
    if cached:
        return AnimationResponse(**cached)
    return AnimationResponse(
        id=animation_id,
        status="not_found",
        error="Animation not found",
    )


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
