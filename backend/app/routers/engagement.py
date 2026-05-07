"""Engagement — comments feed and reusable auto-reply template."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.store import read_engagement, update_template

router = APIRouter(prefix="/engagement", tags=["Engagement"])


class TemplateBody(BaseModel):
    template: str = Field(..., max_length=2000)


@router.get("/overview")
def overview():
    """Return current comments and reply template."""
    state = read_engagement()
    return {
        "comments": state.get("comments", []),
        "template": state.get("template", ""),
    }


@router.put("/template")
def save_template(body: TemplateBody):
    """Persist a new auto-reply template."""
    state = update_template(body.template.strip())
    return {"template": state["template"]}
