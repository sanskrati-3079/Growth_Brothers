"""Health check route."""
from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings
from app.models import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        app=settings.app_name,
        env=settings.app_env,
        timestamp=datetime.now(timezone.utc),
    )
