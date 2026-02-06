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

    # Paths
    static_viz_dir: str = "static/visualizations"

    # Auth
    jwt_secret: str = "change-this-secret-in-production"
    jwt_expire_hours: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
