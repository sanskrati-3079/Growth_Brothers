"""AI Studio — caption, hashtag, motivational quote, and blog generation."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai_content import (
    generate_caption,
    generate_carousel_slides,
    generate_hashtags,
    make_blog_post,
    make_motivational_post,
)

router = APIRouter(prefix="/api/v1/generate", tags=["AI Studio"])


# ── Request bodies ────────────────────────────────────────────────────────

class TopicBody(BaseModel):
    topic: str = Field(..., max_length=300)


class CaptionBody(BaseModel):
    topic: str = Field(..., max_length=300)
    platform: str = Field("instagram", max_length=32)


class HashtagsBody(BaseModel):
    keywords: str = Field(..., max_length=300)
    count: int = Field(12, ge=3, le=30)


class CarouselBody(BaseModel):
    topic: str = Field(..., max_length=300)
    count: int = Field(6, ge=3, le=10)


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/motivational_post")
def motivational_post(body: TopicBody):
    """Generate a motivational quote and a 1080x1080 quote card image."""
    quote, image_path = make_motivational_post(body.topic.strip())
    return {
        "quote_text": quote,
        "image_url": f"/ai_assets/{image_path.name}",
        "image_path": f"/ai_assets/{image_path.name}",
    }


@router.post("/blog_post")
def blog_post(body: TopicBody):
    """Generate a blog outline (.docx) plus a cover card."""
    topic = body.topic.strip()
    outline, docx_path, cover_path = make_blog_post(topic)
    return {
        "topic": topic,
        "title": outline["title"],
        "docx_url": f"/ai_assets/{docx_path.name}",
        "docx_path": f"/ai_assets/{docx_path.name}",
        "cover_url": f"/ai_assets/{cover_path.name}",
        "cover_path": f"/ai_assets/{cover_path.name}",
    }


@router.post("/caption")
def caption(body: CaptionBody):
    """Generate a 3-line caption for the given topic and platform."""
    return {"caption": generate_caption(body.topic.strip(), body.platform.strip().lower())}


@router.post("/hashtags")
def hashtags(body: HashtagsBody):
    """Generate hashtags for the given keywords."""
    return {"hashtags": generate_hashtags(body.keywords.strip(), body.count)}


@router.post("/carousel")
def carousel(body: CarouselBody):
    """Generate `count` carousel slides for the topic."""
    slides = generate_carousel_slides(body.topic.strip(), body.count)
    return {"topic": body.topic, "slides": slides}
