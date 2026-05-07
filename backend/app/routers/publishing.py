"""Publishing — quick-share endpoints for AI-generated content."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.store import all_publish_entries, log_publish

router = APIRouter(prefix="/publishing", tags=["Publishing"])

ALLOWED_PLATFORMS = {"instagram", "linkedin", "facebook", "twitter", "youtube", "tiktok"}


class MotivationBody(BaseModel):
    platform: str = Field(..., max_length=32)
    content: str = Field(..., max_length=8000)
    topic: str | None = Field(None, max_length=200)


@router.post("/motivation")
def publish_motivation(body: MotivationBody):
    """Queue a motivational text post for the given platform.

    For now this records the intent into a publish log; the real platform
    push is handled by the existing /posts/upload pipeline once an account
    is connected.
    """
    platform = body.platform.lower().strip()
    if platform not in ALLOWED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform '{body.platform}'")

    entry = {
        "id": uuid.uuid4().hex[:10],
        "platform": platform,
        "content": body.content,
        "topic": body.topic,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "status": "queued",
    }
    log_publish(entry)
    return {"ok": True, **entry}


@router.get("/log")
def publish_log():
    """Return the recent publish-intent log (newest first)."""
    return list(reversed(all_publish_entries()))
