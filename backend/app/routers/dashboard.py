"""Dashboard overview — recent activity, upcoming schedule, summary metrics."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.services.store import all_jobs, all_publish_entries

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _to_iso(value: str | None) -> str:
    """Best-effort normalize a stored timestamp to ISO 8601."""
    if not value:
        return datetime.now(timezone.utc).isoformat()
    return value


def _build_logs(jobs: list[dict], publishes: list[dict], limit: int = 30) -> list[dict]:
    """Synthesize a feed of system logs from recent jobs + publishes."""
    entries: list[dict] = []

    for j in jobs:
        status = j.get("status", "queued")
        level = "error" if status == "failed" else "info"
        message_bits = [
            f"{j.get('platform', 'post')} job {j['job_id']} -> {status}",
        ]
        if j.get("error"):
            message_bits.append(str(j["error"])[:200])
        entries.append({
            "id": f"job-{j['job_id']}",
            "level": level,
            "message": " | ".join(message_bits),
            "timestamp": j.get("created_at") or datetime.now(timezone.utc).isoformat(),
        })

    for p in publishes:
        entries.append({
            "id": f"pub-{p['id']}",
            "level": "info",
            "message": f"Publish intent → {p.get('platform', '?')} ({p.get('topic') or 'no topic'})",
            "timestamp": p.get("createdAt", datetime.now(timezone.utc).isoformat()),
        })

    entries.sort(key=lambda e: e["timestamp"], reverse=True)
    return entries[:limit]


@router.get("/overview")
def overview():
    """Return recent activity, upcoming schedule, logs, engagement snapshot.

    Shape consumed by frontend `useDashboardOverview()`:
        recentActivity: [{id, title, type, status, createdAt}]
        schedule:       [{id, title, time, platform}]
        logs:           [{id, level, message, timestamp}]
        engagement:     null | {...}
    """
    jobs = all_jobs()
    jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)

    recent_activity = [
        {
            "id": j["job_id"],
            "title": j.get("title") or j.get("post_data", {}).get("title") or "Untitled",
            "type": j.get("platform", "post"),
            "status": j.get("status", "queued"),
            "createdAt": _to_iso(j.get("created_at")),
        }
        for j in jobs[:10]
    ]

    now_iso = datetime.now(timezone.utc).isoformat()
    schedule = [
        {
            "id": j["job_id"],
            "title": j.get("title") or "Scheduled post",
            "time": j.get("post_data", {}).get("scheduled_at") or now_iso,
            "platform": j.get("platform", "unknown"),
        }
        for j in jobs
        if j.get("post_data", {}).get("scheduled_at")
        and j.get("status") in {"queued", "scheduled"}
    ][:8]

    return {
        "recentActivity": recent_activity,
        "schedule": schedule,
        "logs": _build_logs(jobs, all_publish_entries()),
        "engagement": None,
    }
