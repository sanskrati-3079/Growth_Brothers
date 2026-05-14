"""Repurposing agent — turns a long-form video/audio into multi-platform assets.

Pipeline:
    1. Acquire media (yt-dlp for YouTube, direct upload for files)
    2. Extract 16 kHz mono audio with ffmpeg
    3. Transcribe via OpenAI Whisper (verbose_json with segment timestamps)
    4. Run a GPT analysis pass to produce highlights, blog, newsletter, carousel
    5. Cut timestamped video clips and audio snippets with ffmpeg
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException

from app.config import settings

# Directory where venv-installed binaries live (yt-dlp, ffmpeg wrappers, etc.)
_VENV_BIN = Path(sys.executable).parent


def _resolve_binary(name: str) -> str:
    """Return the full path to a CLI binary.

    Search order:
      1. System PATH  (shutil.which)
      2. The active venv's Scripts / bin directory
    Raises HTTPException(500) if not found anywhere.
    """
    # System PATH first
    found = shutil.which(name)
    if found:
        return found

    # Try venv directory (Windows .exe, Unix no extension)
    for candidate in [_VENV_BIN / name, _VENV_BIN / f"{name}.exe"]:
        if candidate.exists():
            return str(candidate)

    hint = {
        "ffmpeg": "Install ffmpeg and add it to PATH.",
        "yt-dlp": "Run: pip install yt-dlp",
    }.get(name, "")
    raise HTTPException(
        status_code=500,
        detail=f"Required binary '{name}' not found. {hint}".strip(),
    )


def get_openai_client():
    """Build an OpenAI client from settings, failing loudly if no key is set."""
    from openai import OpenAI

    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    return OpenAI(api_key=settings.openai_api_key)


def download_youtube(url: str, output_dir: Path) -> Tuple[str, str]:
    """Download a YouTube video and extract a transcription-ready audio track."""
    ytdlp = _resolve_binary("yt-dlp")
    ffmpeg = _resolve_binary("ffmpeg")

    video_path = str(output_dir / "video.mp4")
    audio_path = str(output_dir / "audio.mp3")

    try:
        subprocess.run(
            [
                ytdlp,
                "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
                "--merge-output-format", "mp4",
                "-o", video_path,
                url,
            ],
            check=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=400,
            detail=f"yt-dlp failed: {(e.stderr or e.stdout or '').strip()[-400:]}",
        )

    try:
        subprocess.run(
            [
                ffmpeg, "-i", video_path,
                "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
                audio_path, "-y",
            ],
            check=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"ffmpeg audio extract failed: {(e.stderr or '').strip()[-400:]}",
        )

    return video_path, audio_path


def extract_audio(video_path: str, audio_path: str) -> None:
    """Extract a Whisper-friendly audio track from any video file."""
    ffmpeg = _resolve_binary("ffmpeg")
    try:
        subprocess.run(
            [
                ffmpeg, "-i", video_path,
                "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
                audio_path, "-y",
            ],
            check=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"ffmpeg audio extract failed: {(e.stderr or '').strip()[-400:]}",
        )


def transcribe_audio(client, audio_path: str) -> Tuple[str, list]:
    """Transcribe audio with Whisper and return (full_text, timestamped_segments)."""
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model=settings.openai_transcription_model,
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = [
        {
            "start": round(s.start, 1),
            "end": round(s.end, 1),
            "text": s.text.strip(),
        }
        for s in response.segments
    ]
    return response.text, segments


def analyze_transcript(client, transcript: str, segments: list) -> dict:
    """Run a single GPT pass to produce highlights, blog, newsletter, carousel."""
    segments_preview = json.dumps(segments[:60], indent=2)

    prompt = f"""
You are a content repurposing expert. Analyze the following transcript and produce structured outputs.

## TRANSCRIPT
{transcript[:6000]}

## SEGMENTS (with timestamps)
{segments_preview}

---
Return a JSON object with EXACTLY these keys:

1. "highlights": array of 5 objects, each with:
   - "title": short punchy clip title (max 8 words)
   - "quote": the exact quote or key sentence
   - "start": start timestamp in seconds (float)
   - "end": end timestamp in seconds (float)
   - "hook": 1-sentence TikTok/Reel hook for this clip
   - "why": why this moment is shareable

2. "blog_summary": object with:
   - "title": SEO-friendly blog post title
   - "intro": 2-sentence introduction paragraph
   - "sections": array of 3 objects, each with "heading" and "body" (2-3 sentences)
   - "conclusion": 1 closing paragraph

3. "newsletter": object with:
   - "subject_line": email subject (curiosity-driven, under 50 chars)
   - "preview_text": preheader text (under 90 chars)
   - "body": 3 short paragraphs suitable for an email newsletter
   - "cta": call-to-action sentence

4. "carousel": array of 6 slides, each with:
   - "slide_number": 1-6
   - "headline": bold main text (max 8 words)
   - "body": supporting text (max 20 words)
   - "type": one of ["hook", "insight", "quote", "tip", "cta"]

Return ONLY the JSON object. No markdown, no explanation.
"""

    response = client.chat.completions.create(
        model=settings.openai_analysis_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=3000,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def cut_clip(video_path: str, start: float, end: float, output_path: str, padding: float = 1.0) -> bool:
    try:
        ffmpeg = _resolve_binary("ffmpeg")
    except Exception:
        return False
    start_padded = max(0, start - padding)
    duration = (end + padding) - start_padded
    result = subprocess.run(
        [
            ffmpeg,
            "-ss", str(start_padded),
            "-i", video_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "fast",
            output_path, "-y",
        ],
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.returncode == 0


def extract_audio_snippet(audio_path: str, start: float, end: float, output_path: str) -> bool:
    try:
        ffmpeg = _resolve_binary("ffmpeg")
    except Exception:
        return False
    start_padded = max(0, start - 0.5)
    duration = (end + 0.5) - start_padded
    result = subprocess.run(
        [
            ffmpeg,
            "-ss", str(start_padded),
            "-i", audio_path,
            "-t", str(duration),
            "-c:a", "libmp3lame", "-q:a", "4",
            output_path, "-y",
        ],
        capture_output=True,
    )
    return result.returncode == 0


def render_clips_and_snippets(
    video_path: str | None,
    audio_path: str,
    job_dir: Path,
    highlights: list,
    generate_clips: bool,
) -> Tuple[list, list]:
    """Cut every highlight into a clip + audio snippet on disk."""
    clips: list = []
    if generate_clips and video_path and Path(video_path).exists():
        clips_dir = job_dir / "clips"
        clips_dir.mkdir(exist_ok=True)
        for i, h in enumerate(highlights, 1):
            safe_title = h["title"].replace(" ", "_").replace("/", "-")[:30]
            clip_path = str(clips_dir / f"clip_{i:02d}_{safe_title}.mp4")
            if cut_clip(video_path, h["start"], h["end"], clip_path):
                clips.append({
                    "number": i,
                    "title": h["title"],
                    "start": h["start"],
                    "end": h["end"],
                    "path": clip_path,
                })

    snippets: list = []
    snippets_dir = job_dir / "audio_snippets"
    snippets_dir.mkdir(exist_ok=True)
    for i, h in enumerate(highlights, 1):
        safe_title = h["title"].replace(" ", "_").replace("/", "-")[:30]
        snippet_path = str(snippets_dir / f"snippet_{i:02d}_{safe_title}.mp3")
        if extract_audio_snippet(audio_path, h["start"], h["end"], snippet_path):
            snippets.append({
                "number": i,
                "title": h["title"],
                "path": snippet_path,
            })

    return clips, snippets
