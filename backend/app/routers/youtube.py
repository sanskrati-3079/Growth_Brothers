"""YouTube data routes (videos, channel info)."""
from fastapi import APIRouter, HTTPException

from youtube import list_videos as _list_videos

router = APIRouter(prefix="/youtube", tags=["YouTube"])


@router.get("/{channel_id}/videos")
def get_channel_videos(channel_id: str, max_results: int = 20):
    """List recent videos for a connected YouTube channel."""
    try:
        return _list_videos(channel_id, max_results)
    except FileNotFoundError:
        raise HTTPException(status_code=401, detail="Account not connected")
