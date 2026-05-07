"""Pydantic request/response models."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


Platform = Literal["youtube", "linkedin", "facebook", "instagram"]
JobStatus = Literal["queued", "uploading", "scheduled", "published", "failed"]


class ConnectedAccount(BaseModel):
    platform: Platform
    account_id: str
    account_name: str
    thumbnail: str = ""
    subscribers: Optional[str] = None
    video_count: Optional[str] = None
    followers: Optional[str] = None
    email: Optional[str] = None
    page_name: Optional[str] = None


class JobOut(BaseModel):
    job_id: str
    platform: Platform
    account_id: str
    title: str
    status: JobStatus
    media_id: Optional[str] = None
    media_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    scheduled_at: Optional[str] = None


class RepurposeRequest(BaseModel):
    youtube_url: Optional[str] = None
    generate_clips: bool = True
    language: str = "en"


class RepurposeHighlight(BaseModel):
    title: str
    quote: str
    start: float
    end: float
    hook: str
    why: str


class RepurposeBlogSection(BaseModel):
    heading: str
    body: str


class RepurposeBlog(BaseModel):
    title: str
    intro: str
    sections: List[RepurposeBlogSection]
    conclusion: str


class RepurposeNewsletter(BaseModel):
    subject_line: str
    preview_text: str
    body: str | List[str]
    cta: str


class RepurposeCarouselSlide(BaseModel):
    slide_number: int
    headline: str
    body: str
    type: str


class RepurposeResult(BaseModel):
    job_id: str
    transcript: str
    highlights: List[RepurposeHighlight]
    blog_summary: RepurposeBlog
    newsletter: RepurposeNewsletter
    carousel: List[RepurposeCarouselSlide]
    output_dir: str
    clips: List[str] = Field(default_factory=list)
    audio_snippets: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str
    env: str
    timestamp: datetime
