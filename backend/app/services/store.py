"""Tiny JSON-backed stores used by the dashboard / engagement / publishing routes."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.config import settings


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text() or "null") or default
    except json.JSONDecodeError:
        return default


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, default=str))


# ── Jobs (managed by scheduler.py, but read-only here) ────────────────────

def all_jobs() -> list[dict]:
    """Return all scheduled / queued / published jobs as a flat list."""
    raw = read_json(settings.jobs_file, default={})
    return list(raw.values()) if isinstance(raw, dict) else list(raw or [])


# ── Engagement (comments + reply template) ────────────────────────────────

_DEFAULT_ENGAGEMENT = {
    "comments": [
        {"id": "c1", "platform": "instagram", "author": "@mira",   "text": "This is gold!",        "category": "praise",   "createdAt": "2026-04-25T09:12:00Z"},
        {"id": "c2", "platform": "linkedin",  "author": "Rohit",   "text": "Where can I learn more?", "category": "question", "createdAt": "2026-04-26T14:00:00Z"},
        {"id": "c3", "platform": "youtube",   "author": "Akira",   "text": "Disagree, here's why...","category": "feedback", "createdAt": "2026-04-27T18:21:00Z"},
        {"id": "c4", "platform": "instagram", "author": "@kev",    "text": "Spammy DM stuff",      "category": "spam",     "createdAt": "2026-04-28T07:05:00Z"},
    ],
    "template": "Thanks for the kind words! Glad it resonated 🙌",
}


def read_engagement() -> dict:
    return read_json(settings.engagement_file, default=_DEFAULT_ENGAGEMENT)


def update_template(template: str) -> dict:
    state = read_engagement()
    state["template"] = template
    write_json(settings.engagement_file, state)
    return state


# ── Publishing log (for /publishing/motivation) ───────────────────────────

_PUBLISH_LOG = settings.ai_assets_dir.parent / "publish_log.json"


def log_publish(entry: dict) -> dict:
    log = read_json(_PUBLISH_LOG, default=[])
    log.append(entry)
    write_json(_PUBLISH_LOG, log)
    return entry


def all_publish_entries() -> list[dict]:
    return read_json(_PUBLISH_LOG, default=[])
