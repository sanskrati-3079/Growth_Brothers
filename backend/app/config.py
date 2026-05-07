"""
Central application configuration.

All environment variables are declared here and loaded from .env.
Import `settings` anywhere you need configuration — never call
os.getenv() directly in the rest of the codebase.
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────────────────
    app_name: str = "Growth Brother API"
    app_env: str = Field(default="development")
    backend_url: str = Field(default="http://localhost:8000")
    frontend_url: str = Field(default="http://localhost:5173")
    secret_key: str = Field(default="change-me-in-production")
    cors_origins: str = Field(default="")

    # ── Storage paths ──────────────────────────────────────────────────
    uploads_dir: Path = BASE_DIR / "uploads"
    tokens_dir: Path = BASE_DIR / "tokens"
    jobs_file: Path = BASE_DIR / "jobs.json"
    repurpose_output_dir: Path = BASE_DIR / "repurpose_output"
    ai_assets_dir: Path = BASE_DIR / "ai_assets"
    engagement_file: Path = BASE_DIR / "engagement.json"
    users_file: Path = BASE_DIR / "users.json"

    # ── User auth (JWT) ───────────────────────────────────────────────
    jwt_algorithm: str = "HS256"
    jwt_expires_min: int = 60 * 24 * 30  # 30 days

    # ── Google / YouTube OAuth ─────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""

    # ── LinkedIn OAuth ─────────────────────────────────────────────────
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""

    # ── Meta (Facebook + Instagram Business via Pages) ─────────────────
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_graph_version: str = "v23.0"

    # ── Instagram Login (direct) ───────────────────────────────────────
    instagram_app_id: str = ""
    instagram_app_secret: str = ""

    # ── OpenAI (repurposing agent) ─────────────────────────────────────
    openai_api_key: str = ""
    openai_transcription_model: str = "whisper-1"
    openai_analysis_model: str = "gpt-4o"

    # ── Derived redirect URIs ──────────────────────────────────────────
    @property
    def youtube_redirect_uri(self) -> str:
        return f"{self.backend_url}/auth/callback"

    @property
    def linkedin_redirect_uri(self) -> str:
        return f"{self.backend_url}/auth/linkedin/callback"

    @property
    def facebook_redirect_uri(self) -> str:
        return f"{self.backend_url}/auth/facebook/callback"

    @property
    def instagram_redirect_uri(self) -> str:
        return f"{self.backend_url}/auth/instagram/callback"

    @property
    def allowed_origins(self) -> List[str]:
        explicit = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        defaults = [self.frontend_url, "http://localhost:5173", "http://localhost:3000"]
        return list({*explicit, *defaults})

    # Token sub-directories (one per platform, created at startup)
    @property
    def yt_tokens_dir(self) -> Path:
        return self.tokens_dir

    @property
    def li_tokens_dir(self) -> Path:
        return self.tokens_dir / "linkedin"

    @property
    def li_sessions_dir(self) -> Path:
        return self.tokens_dir / "linkedin_sessions"

    @property
    def fb_tokens_dir(self) -> Path:
        return self.tokens_dir / "facebook"

    @property
    def ig_tokens_dir(self) -> Path:
        return self.tokens_dir / "instagram"

    @property
    def ig_sessions_dir(self) -> Path:
        return self.tokens_dir / "instagram_sessions"

    def ensure_dirs(self) -> None:
        for d in (
            self.uploads_dir,
            self.tokens_dir,
            self.li_tokens_dir,
            self.li_sessions_dir,
            self.fb_tokens_dir,
            self.ig_tokens_dir,
            self.ig_sessions_dir,
            self.repurpose_output_dir,
            self.ai_assets_dir,
        ):
            d.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
