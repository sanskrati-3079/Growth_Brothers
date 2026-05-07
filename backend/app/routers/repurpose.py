"""Routes for the content repurposing agent."""
from __future__ import annotations

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse

from app.config import settings
from app.services.repurpose_agent import (
    analyze_transcript,
    download_youtube,
    extract_audio,
    get_openai_client,
    render_clips_and_snippets,
    transcribe_audio,
)

router = APIRouter(prefix="/repurpose", tags=["Repurpose"])

OUTPUT_DIR: Path = settings.repurpose_output_dir
VIDEO_EXTS = {"mp4", "mov", "avi", "mkv", "webm"}


def _new_job_dir() -> tuple[str, Path]:
    job_id = uuid.uuid4().hex[:8]
    job_dir = OUTPUT_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    return job_id, job_dir


def _persist(job_dir: Path, transcript: str, segments: list, analysis: dict) -> None:
    (job_dir / "transcript.txt").write_text(transcript)
    (job_dir / "segments.json").write_text(json.dumps(segments, indent=2))
    (job_dir / "analysis.json").write_text(json.dumps(analysis, indent=2))


@router.post("/youtube")
async def repurpose_youtube(
    url: str = Form(...),
    generate_clips: bool = Form(True),
):
    """Repurpose content from a YouTube URL into highlights, blog, newsletter, carousel."""
    job_id, job_dir = _new_job_dir()
    try:
        video_path, audio_path = download_youtube(url, job_dir)
        client = get_openai_client()
        transcript, segments = transcribe_audio(client, audio_path)
        analysis = analyze_transcript(client, transcript, segments)
        _persist(job_dir, transcript, segments, analysis)

        clips, snippets = render_clips_and_snippets(
            video_path, audio_path, job_dir, analysis["highlights"], generate_clips
        )

        return {
            "job_id": job_id,
            "status": "completed",
            "url": url,
            "transcript": transcript[:500] + "...",
            "highlights": analysis["highlights"],
            "blog_summary": analysis["blog_summary"],
            "newsletter": analysis["newsletter"],
            "carousel": analysis["carousel"],
            "clips_generated": len(clips),
            "audio_snippets_generated": len(snippets),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def repurpose_upload(
    file: UploadFile = File(...),
    generate_clips: bool = Form(True),
):
    """Repurpose content from an uploaded video or audio file."""
    job_id, job_dir = _new_job_dir()
    file_path = job_dir / Path(file.filename).name
    with open(file_path, "wb") as f:
        f.write(await file.read())

    ext = file_path.suffix.lstrip(".").lower()
    try:
        client = get_openai_client()

        if ext in VIDEO_EXTS:
            audio_path = str(job_dir / "audio.mp3")
            extract_audio(str(file_path), audio_path)
            video_path: str | None = str(file_path)
        else:
            audio_path = str(file_path)
            video_path = None

        transcript, segments = transcribe_audio(client, audio_path)
        analysis = analyze_transcript(client, transcript, segments)
        _persist(job_dir, transcript, segments, analysis)

        clips, snippets = render_clips_and_snippets(
            video_path, audio_path, job_dir, analysis["highlights"], generate_clips
        )

        return {
            "job_id": job_id,
            "status": "completed",
            "filename": file.filename,
            "transcript": transcript[:500] + "...",
            "highlights": analysis["highlights"],
            "blog_summary": analysis["blog_summary"],
            "newsletter": analysis["newsletter"],
            "carousel": analysis["carousel"],
            "clips_generated": len(clips),
            "audio_snippets_generated": len(snippets),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
def list_repurpose_jobs():
    """List every repurpose job that has been created on disk."""
    if not OUTPUT_DIR.exists():
        return []
    return [
        {"job_id": d.name, "files": [f.name for f in d.iterdir()]}
        for d in OUTPUT_DIR.iterdir()
        if d.is_dir()
    ]


@router.get("/jobs/{job_id}")
def get_repurpose_job(job_id: str):
    """Return the analysis JSON and a list of files generated for a job."""
    job_dir = OUTPUT_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(status_code=404, detail="Job not found")
    analysis_path = job_dir / "analysis.json"
    analysis = json.loads(analysis_path.read_text()) if analysis_path.exists() else None
    return {
        "job_id": job_id,
        "exists": True,
        "analysis": analysis,
        "files": [f.name for f in job_dir.iterdir()],
    }


@router.get("/jobs/{job_id}/clip/{clip_number}")
def download_clip(job_id: str, clip_number: int):
    clips_dir = OUTPUT_DIR / job_id / "clips"
    if not clips_dir.exists():
        raise HTTPException(status_code=404, detail="No clips found for this job")
    files = list(clips_dir.glob(f"clip_{clip_number:02d}_*.mp4"))
    if not files:
        raise HTTPException(status_code=404, detail="Clip not found")
    return FileResponse(files[0], media_type="video/mp4", filename=files[0].name)


@router.get("/jobs/{job_id}/snippet/{snippet_number}")
def download_snippet(job_id: str, snippet_number: int):
    snippets_dir = OUTPUT_DIR / job_id / "audio_snippets"
    if not snippets_dir.exists():
        raise HTTPException(status_code=404, detail="No snippets found for this job")
    files = list(snippets_dir.glob(f"snippet_{snippet_number:02d}_*.mp3"))
    if not files:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return FileResponse(files[0], media_type="audio/mpeg", filename=files[0].name)


@router.get("/jobs/{job_id}/blog")
def download_blog(job_id: str):
    job_dir = OUTPUT_DIR / job_id
    analysis_path = job_dir / "analysis.json"
    if not analysis_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    blog = json.loads(analysis_path.read_text())["blog_summary"]
    sections = "\n\n".join(f"## {s['heading']}\n{s['body']}" for s in blog["sections"])
    md = f"# {blog['title']}\n\n{blog['intro']}\n\n{sections}\n\n{blog['conclusion']}\n"
    out = job_dir / "blog_summary.md"
    out.write_text(md)
    return FileResponse(out, media_type="text/markdown", filename="blog_summary.md")


@router.get("/jobs/{job_id}/newsletter")
def download_newsletter(job_id: str):
    job_dir = OUTPUT_DIR / job_id
    analysis_path = job_dir / "analysis.json"
    if not analysis_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    nl = json.loads(analysis_path.read_text())["newsletter"]
    body = "\n\n".join(nl["body"]) if isinstance(nl["body"], list) else nl["body"]
    text = (
        f"SUBJECT: {nl['subject_line']}\n"
        f"PREVIEW: {nl['preview_text']}\n\n---\n\n{body}\n\n{nl['cta']}\n"
    )
    out = job_dir / "newsletter.txt"
    out.write_text(text)
    return FileResponse(out, media_type="text/plain", filename="newsletter.txt")


@router.get("/jobs/{job_id}/carousel")
def download_carousel(job_id: str):
    job_dir = OUTPUT_DIR / job_id
    analysis_path = job_dir / "analysis.json"
    if not analysis_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    carousel = json.loads(analysis_path.read_text())["carousel"]
    md = "# Carousel Slides\n\n"
    for slide in carousel:
        md += (
            f"---\n**Slide {slide['slide_number']}** ({slide['type'].upper()})\n\n"
            f"> {slide['headline']}\n\n{slide['body']}\n\n"
        )
    out = job_dir / "carousel.md"
    out.write_text(md)
    return FileResponse(out, media_type="text/markdown", filename="carousel.md")


@router.get("/jobs/{job_id}/transcript", response_class=PlainTextResponse)
def get_transcript(job_id: str):
    transcript_path = OUTPUT_DIR / job_id / "transcript.txt"
    if not transcript_path.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    return transcript_path.read_text()
