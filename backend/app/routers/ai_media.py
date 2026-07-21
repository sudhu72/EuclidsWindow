"""AI media generation routes: images, music (audio + symbolic), lessons."""
import asyncio

from fastapi import APIRouter, HTTPException

from ..ai.image_router import SmartImageService
from ..ai.lesson import LessonService
from ..ai.media import DiffusionImageService, MusicGenService
from ..ai.music_composer import SymbolicMusicComposer
from ..models import (
    LessonBuildResponse,
    LessonOutlineRequest,
    LessonOutlineResponse,
    LessonSceneRequest,
    LessonSceneResponse,
    MediaImageRequest,
    MediaImageResponse,
    MediaMusicRequest,
    MediaMusicResponse,
    MusicComposeRequest,
    MusicComposeResponse,
)

router = APIRouter(tags=["ai-media"])

diffusion_service = DiffusionImageService()
smart_image_service = SmartImageService(diffusion_service)
music_service = MusicGenService()
music_composer = SymbolicMusicComposer()
lesson_service = LessonService()


@router.post("/api/ai/media/image", response_model=MediaImageResponse)
async def ai_media_image(payload: MediaImageRequest) -> MediaImageResponse:
    """LLM-routed image generation: diagrams via matplotlib codegen,
    illustrations via prompt-enhanced diffusion."""
    result = await asyncio.to_thread(smart_image_service.generate, payload.prompt)
    if not result:
        raise HTTPException(status_code=503, detail="Image generation not available")
    url, model_used = result
    return MediaImageResponse(url=url, model=model_used)


@router.post("/api/ai/media/music", response_model=MediaMusicResponse)
async def ai_media_music(payload: MediaMusicRequest) -> MediaMusicResponse:
    url = await asyncio.to_thread(
        music_service.generate, payload.prompt, payload.duration_seconds
    )
    if not url:
        raise HTTPException(status_code=503, detail="Music generation not available")
    return MediaMusicResponse(url=url, model=music_service.model_id)


@router.post("/api/ai/music/compose", response_model=MusicComposeResponse)
async def ai_music_compose(payload: MusicComposeRequest) -> MusicComposeResponse:
    """Compose a symbolic score (JSON note events) with the local LLM.

    The frontend plays it via Web Audio and engraves it with VexFlow —
    fully local, explainable music generation."""
    if not music_composer.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    score = await asyncio.to_thread(music_composer.compose, payload.prompt, payload.bars)
    if not score:
        raise HTTPException(status_code=502, detail="Composer produced no valid score")
    return MusicComposeResponse(**score)


@router.post("/api/ai/lesson/outline", response_model=LessonOutlineResponse)
async def ai_lesson_outline(payload: LessonOutlineRequest) -> LessonOutlineResponse:
    """Stage 1 of the lesson pipeline: structured outline for a topic."""
    if not lesson_service.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    outline = await asyncio.to_thread(lesson_service.outline, payload.topic, payload.level)
    if not outline:
        raise HTTPException(status_code=502, detail="Could not generate a lesson outline")
    return LessonOutlineResponse(**outline)


@router.post("/api/ai/lesson/build", response_model=LessonBuildResponse)
async def ai_lesson_build(payload: LessonOutlineRequest) -> LessonBuildResponse:
    """Outline + all scenes in one call, scenes generated in parallel.

    Graph orchestration: ``outline -> [scene ‖ scene ‖ ...] -> assemble``. The
    learner gets the whole lesson at once instead of waiting per Next-click.
    """
    if not lesson_service.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    lesson = await asyncio.to_thread(lesson_service.build, payload.topic, payload.level)
    if not lesson:
        raise HTTPException(status_code=502, detail="Could not generate a lesson outline")
    return LessonBuildResponse(**lesson)


@router.post("/api/ai/lesson/scene", response_model=LessonSceneResponse)
async def ai_lesson_scene(payload: LessonSceneRequest) -> LessonSceneResponse:
    """Stage 2 of the lesson pipeline: expand one outline section."""
    if not lesson_service.is_available():
        raise HTTPException(status_code=503, detail="Local LLM not available")
    scene = await asyncio.to_thread(
        lesson_service.scene,
        payload.topic,
        payload.level,
        payload.section_title,
        payload.section_type,
        payload.summary,
    )
    if not scene:
        raise HTTPException(status_code=502, detail="Could not generate this scene")
    return LessonSceneResponse(**scene)
