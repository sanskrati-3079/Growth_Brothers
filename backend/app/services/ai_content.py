"""AI content generation: motivational quotes, blog posts, captions, hashtags.

All generators use OpenAI when an API key is set and fall back to deterministic
local stubs otherwise so the frontend keeps working without keys.
"""
from __future__ import annotations

import json
import textwrap
import uuid
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw, ImageFont

from app.config import settings


def _client():
    """Return an OpenAI client or None if no key is configured."""
    if not settings.openai_api_key:
        return None
    from openai import OpenAI
    return OpenAI(api_key=settings.openai_api_key)


def _new_id() -> str:
    return uuid.uuid4().hex[:10]


# ── Quote text ────────────────────────────────────────────────────────────

_QUOTE_FALLBACKS = [
    "Show up. Reps compound. The grind quietly becomes greatness.",
    "Progress hides inside the boring days. Stay loyal to the work.",
    "You don't need motivation, you need momentum. Start small. Stay consistent.",
    "Discipline is the bridge between vision and reality. Walk it daily.",
]


def generate_quote_text(topic: str) -> str:
    """Generate a single short motivational quote for the topic."""
    client = _client()
    if not client:
        idx = abs(hash(topic)) % len(_QUOTE_FALLBACKS)
        return _QUOTE_FALLBACKS[idx]

    prompt = (
        f"Write ONE short, original motivational quote (max 22 words) about: {topic}. "
        "No author attribution, no quotation marks, no emojis. Just the line."
    )
    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.85,
        max_tokens=80,
    )
    return response.choices[0].message.content.strip().strip('"').strip("'")


# ── Quote image (Pillow) ──────────────────────────────────────────────────

def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """Try a few common system fonts, fall back to default bitmap font."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def render_quote_image(quote: str, topic: str, output_path: Path) -> Path:
    """Render a 1080x1080 gradient card with the quote centered on it."""
    W, H = 1080, 1080
    img = Image.new("RGB", (W, H), color=(20, 25, 40))
    pixels = img.load()
    # Vertical gradient from #5C6BC0 → #7B1FA2
    top = (92, 107, 192)
    bot = (123, 31, 162)
    for y in range(H):
        t = y / H
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        for x in range(W):
            pixels[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)
    font_quote = _load_font(54)
    font_topic = _load_font(28)

    wrapped = textwrap.wrap(quote, width=28)
    line_height = 70
    total_h = line_height * len(wrapped)
    y = (H - total_h) // 2 - 30
    for line in wrapped:
        bbox = draw.textbbox((0, 0), line, font=font_quote)
        w = bbox[2] - bbox[0]
        draw.text(((W - w) // 2, y), line, fill=(255, 255, 255), font=font_quote)
        y += line_height

    tag = f"#{topic.replace(' ', '')[:30]}"
    bbox = draw.textbbox((0, 0), tag, font=font_topic)
    tag_w = bbox[2] - bbox[0]
    draw.text(((W - tag_w) // 2, H - 90), tag, fill=(255, 255, 255, 200), font=font_topic)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG", optimize=True)
    return output_path


# ── Blog post (.docx) ─────────────────────────────────────────────────────

_BLOG_FALLBACK_OUTLINE = {
    "title": "Untitled Blog",
    "intro": "An exploration of why this topic matters right now.",
    "sections": [
        {"heading": "The shift", "body": "Why the landscape changed and what it means."},
        {"heading": "What works", "body": "Concrete tactics that consistently deliver."},
        {"heading": "Your next step", "body": "A simple action to take this week."},
    ],
    "conclusion": "Small disciplined moves, repeated, win the long game.",
}


def generate_blog_outline(topic: str) -> dict:
    """Return a structured blog outline ready to render to .docx."""
    client = _client()
    if not client:
        return {**_BLOG_FALLBACK_OUTLINE, "title": f"On {topic.title()}"}

    prompt = (
        f"Write a short blog post outline about: {topic}.\n"
        "Return ONLY JSON with keys: title (string), intro (1 paragraph string), "
        "sections (array of 3 objects with heading and body, each body 2-3 sentences), "
        "conclusion (1 paragraph string). No markdown, no code fence."
    )
    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=900,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {**_BLOG_FALLBACK_OUTLINE, "title": f"On {topic.title()}"}


def render_blog_docx(outline: dict, output_path: Path) -> Path:
    """Write the outline to a Word document."""
    from docx import Document
    from docx.shared import Pt

    doc = Document()
    title = doc.add_heading(outline["title"], level=0)
    for run in title.runs:
        run.font.size = Pt(28)

    doc.add_paragraph(outline["intro"])

    for section in outline["sections"]:
        doc.add_heading(section["heading"], level=1)
        doc.add_paragraph(section["body"])

    doc.add_heading("Closing", level=1)
    doc.add_paragraph(outline["conclusion"])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    return output_path


# ── Captions & hashtags ───────────────────────────────────────────────────

def generate_caption(topic: str, platform: str = "instagram") -> str:
    """Return a 3-line caption: hook / value / cta."""
    client = _client()
    if not client:
        return f"Hook: {topic}\nValue: One small move daily compounds.\nCTA: Save + share if this hit."

    prompt = (
        f"Write a 3-line {platform} caption about '{topic}': line 1 hook, "
        "line 2 a single insight, line 3 a CTA. No emojis, no hashtags."
    )
    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=120,
    )
    return response.choices[0].message.content.strip()


def generate_hashtags(keywords: str, count: int = 12) -> str:
    """Return a single space-separated string of hashtags."""
    client = _client()
    if not client:
        base = [w.strip().lower().replace(" ", "") for w in keywords.split(",") if w.strip()]
        defaults = ["growth", "creator", "consistency", "marketing", "strategy", "mindset"]
        tags = (base + defaults)[:count]
        return " ".join(f"#{t}" for t in tags)

    prompt = (
        f"Give exactly {count} relevant Instagram hashtags for: {keywords}. "
        "Return them on one line separated by spaces. Each must start with #. No commentary."
    )
    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=80,
    )
    return response.choices[0].message.content.strip()


# ── Top-level orchestrators (used by routes) ──────────────────────────────

def make_motivational_post(topic: str) -> Tuple[str, Path]:
    """Return (quote_text, image_path_relative_to_ai_assets_dir)."""
    quote = generate_quote_text(topic)
    asset_id = _new_id()
    image_path = settings.ai_assets_dir / f"quote_{asset_id}.png"
    render_quote_image(quote, topic, image_path)
    return quote, image_path


def generate_carousel_slides(topic: str, count: int = 6) -> list[dict]:
    """Return `count` carousel slides for the topic.

    Each slide: { slide_number, headline, body, type }.
    """
    client = _client()
    if not client:
        types = ["hook", "insight", "insight", "tip", "quote", "cta"]
        return [
            {
                "slide_number": i + 1,
                "headline": f"Slide {i + 1}: {topic.title()}",
                "body": "Replace this placeholder once OPENAI_API_KEY is set.",
                "type": types[i % len(types)],
            }
            for i in range(count)
        ]

    prompt = (
        f"Design a {count}-slide LinkedIn/Instagram carousel about: {topic}.\n"
        "Return ONLY a JSON array of objects, each with keys: slide_number (int 1.."
        f"{count}), headline (max 8 words), body (max 20 words), "
        "type (one of hook, insight, quote, tip, cta). No markdown, no commentary."
    )
    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=900,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        slides = json.loads(raw)
        if isinstance(slides, dict) and "slides" in slides:
            slides = slides["slides"]
        return slides[:count]
    except json.JSONDecodeError:
        return [
            {"slide_number": i + 1, "headline": f"Slide {i + 1}", "body": topic, "type": "insight"}
            for i in range(count)
        ]


def make_blog_post(topic: str) -> Tuple[dict, Path, Path]:
    """Return (outline, docx_path, cover_image_path)."""
    outline = generate_blog_outline(topic)
    asset_id = _new_id()
    docx_path = settings.ai_assets_dir / f"blog_{asset_id}.docx"
    render_blog_docx(outline, docx_path)

    cover_path = settings.ai_assets_dir / f"blog_cover_{asset_id}.png"
    render_quote_image(outline["title"], topic, cover_path)
    return outline, docx_path, cover_path
