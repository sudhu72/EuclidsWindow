"""Application configuration management."""
from functools import lru_cache
from typing import List, Optional

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # App
    app_name: str = "Euclid's Window"
    app_version: str = "0.2.0"
    debug: bool = False

    # CORS
    cors_origins: List[str] = ["*"]

    # Database
    database_url: str = "sqlite:///./euclids_window.db"

    # LLM
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1/chat/completions"
    openai_model: str = "gpt-4o-mini"

    # Local generative tutor
    local_ai_enabled: bool = True
    local_llm_provider: str = "ollama"
    local_llm_model: str = "qwen2.5-math:7b"
    local_llm_timeout_seconds: int = 120
    local_ai_execution_timeout_seconds: int = 60
    local_llm_base_url: Optional[str] = None
    local_multi_agent_enabled: bool = True
    local_web_rag_enabled: bool = True
    fast_mode_enabled: bool = False
    local_music_timeout_seconds: int = 180
    local_music_fast_mode: bool = True
    local_diffusion_timeout_seconds: int = 60

    # Local diffusion + music generation
    local_media_enabled: bool = True
    local_diffusion_model: str = "stabilityai/sdxl-turbo"
    local_music_model: str = "facebook/musicgen-small"
    local_media_device: str = "cpu"  # cpu, cuda, or mps

    # Paths
    static_viz_dir: str = "static/visualizations"

    # Auth
    jwt_secret: str = "change-this-secret-in-production"
    jwt_expire_hours: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
