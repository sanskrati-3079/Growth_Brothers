"""Lightweight scheduling — record a draft slot without uploading media yet.

Used by the frontend's ScheduleForm. Each call adds a job to `jobs.json`
with status="draft" so it shows up alongside real upload jobs in /posts and
the Scheduler page calendar.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.services.store import read_json, write_json

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])


class SlotBody(BaseModel):
    platform: str = Field(..., max_length=32)
    when: str = Field(..., description="ISO 8601 datetime for the scheduled slot")
    title: str | None = Field(None, max_length=200)
    note: str | None = Field(None, max_length=2000)


@router.post("/slot")
def create_slot(body: SlotBody):
    """Persist a scheduled slot as a draft job (no media required)."""
    try:
        scheduled_at = datetime.fromisoformat(body.when.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="`when` must be an ISO 8601 datetime")

    job_id = uuid.uuid4().hex[:8]
    jobs = read_json(settings.jobs_file, default={})

    jobs[job_id] = {
        "job_id": job_id,
        "platform": body.platform.lower().strip(),
        "account_id": None,
        "title": body.title or f"Scheduled {body.platform} slot",
        "status": "draft",
        "media_path": None,
        "thumbnail_path": None,
        "post_data": {
            "platform": body.platform.lower().strip(),
            "title": body.title or "",
            "message": body.note or "",
            "scheduled_at": scheduled_at.isoformat(),
            "timezone": "UTC",
        },
        "media_id": None,
        "media_url": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    write_json(settings.jobs_file, jobs)
    return {"job_id": job_id, "status": "draft", "scheduled_at": scheduled_at.isoformat()}
