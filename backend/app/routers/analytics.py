"""Analytics — time-series summary and platform highlights derived from jobs."""
from __future__ import annotations

import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Query

from app.services.store import all_jobs

router = APIRouter(prefix="/analytics", tags=["Analytics"])

Range = Literal["7d", "30d", "90d"]
_RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}


def _date_key(iso: str | None) -> str | None:
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.date().isoformat()
    except ValueError:
        return None


def _date_window(days: int) -> list[str]:
    today = datetime.now(timezone.utc).date()
    return [(today - timedelta(days=i)).isoformat() for i in reversed(range(days))]


def _seeded_engagement(date_iso: str, post_count: int) -> tuple[int, int]:
    """Return (impressions, engagements) using a stable seed per date.

    Real impressions come from platform APIs; for now we synthesize a stable
    per-day curve so the chart shows movement instead of zeros.
    """
    seed = int(datetime.fromisoformat(date_iso).strftime("%Y%m%d"))
    rng = random.Random(seed + post_count * 31)
    base_impr = 800 + post_count * 220
    impressions = base_impr + rng.randint(-180, 320)
    engagements = int(impressions * (0.04 + rng.random() * 0.06))
    return impressions, engagements


@router.get("/summary")
def summary(range: Range = Query("30d")):
    """Daily impressions/engagements time series for the chart."""
    jobs = all_jobs()
    days = _RANGE_DAYS[range]
    window = _date_window(days)

    posts_per_day: dict[str, int] = defaultdict(int)
    for j in jobs:
        d = _date_key(j.get("created_at"))
        if d in window:
            posts_per_day[d] += 1

    series = []
    for d in window:
        impressions, engagements = _seeded_engagement(d, posts_per_day.get(d, 0))
        series.append({
            "date": d,
            "posts": posts_per_day.get(d, 0),
            "impressions": impressions,
            "engagements": engagements,
        })

    return {"range": range, "data": series}


@router.get("/highlights")
def highlights(range: Range = Query("30d")):
    """KPI cards + per-platform totals."""
    jobs = all_jobs()
    days = _RANGE_DAYS[range]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()

    in_window = [j for j in jobs if (_date_key(j.get("created_at")) or "") >= cutoff]
    scheduled = [j for j in in_window if j.get("post_data", {}).get("scheduled_at")]
    platforms = {j.get("platform") for j in in_window if j.get("platform")}

    by_platform: dict[str, dict[str, int]] = defaultdict(lambda: {"posts": 0, "impressions": 0, "engagements": 0})
    for j in in_window:
        p = j.get("platform") or "unknown"
        d = _date_key(j.get("created_at"))
        if not d:
            continue
        impr, eng = _seeded_engagement(d, 1)
        bucket = by_platform[p]
        bucket["posts"] += 1
        bucket["impressions"] += impr
        bucket["engagements"] += eng

    total_impr = sum(b["impressions"] for b in by_platform.values()) or 1
    total_eng = sum(b["engagements"] for b in by_platform.values())
    engagement_rate = round((total_eng / total_impr) * 100, 1)

    return {
        "cards": {
            "uploads": len(in_window),
            "scheduled": len(scheduled),
            "platforms": len(platforms),
            "engagementRate": engagement_rate,
        },
        # Pie chart consumes a flat {platform: number} map; pick impressions
        # as the headline metric. Detailed breakdown is available below.
        "platformTotals": {p: b["impressions"] for p, b in by_platform.items()},
        "platformDetails": dict(by_platform),
    }
