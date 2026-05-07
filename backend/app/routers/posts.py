"""Routes for scheduling and managing social media posts."""
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import settings
from scheduler import add_job, delete_job, get_all_jobs, get_job

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/upload")
async def schedule_post(
    platform: str = Form("youtube"),
    account_id: str = Form(...),
    title: str = Form(""),
    message: str = Form(""),
    description: str = Form(""),
    tags: str = Form(""),
    privacy: str = Form("private"),
    is_short: bool = Form(False),
    scheduled_at: str = Form(None),
    timezone: str = Form("Asia/Kolkata"),
    notify: bool = Form(False),
    video: UploadFile = File(None),
    image: UploadFile = File(None),
):
    """Upload media and create a scheduled or immediate post job."""
    media_file = video or image
    media_path: Path | None = None
    if media_file and media_file.filename:
        safe_name = Path(media_file.filename).name.replace(" ", "_")
        media_path = settings.uploads_dir / f"{uuid.uuid4().hex}_{safe_name}"
        with open(media_path, "wb") as f:
            shutil.copyfileobj(media_file.file, f)

    post_data = {
        "platform": platform,
        "account_id": account_id,
        "title": title,
        "message": message,
        "description": description,
        "tags": [t.strip() for t in tags.split(",") if t.strip()],
        "privacy": privacy,
        "is_short": is_short,
        "scheduled_at": scheduled_at if (scheduled_at and scheduled_at != "null") else None,
        "timezone": timezone,
        "notify": notify,
    }

    job_id = add_job(post_data, str(media_path) if media_path else None)

    return {
        "job_id": job_id,
        "message": "Scheduled" if (scheduled_at and scheduled_at != "null") else "Upload started",
        "status": "queued",
    }


@router.get("")
def list_posts():
    """Get all scheduled, in-progress, and published posts."""
    return get_all_jobs()


@router.get("/{job_id}")
def get_post_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Post not found")
    return job


@router.delete("/{job_id}")
def cancel_post(job_id: str):
    if delete_job(job_id):
        return {"message": "Post cancelled"}
    raise HTTPException(status_code=404, detail="Post not found")
