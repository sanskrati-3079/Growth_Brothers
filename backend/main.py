"""Growth Brother backend — FastAPI entry point.

Run locally:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Interactive docs:
    http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import ai_studio as ai_studio_router
from app.routers import analytics as analytics_router
from app.routers import auth as auth_router
from app.routers import dashboard as dashboard_router
from app.routers import engagement as engagement_router
from app.routers import health as health_router
from app.routers import posts as posts_router
from app.routers import publishing as publishing_router
from app.routers import repurpose as repurpose_router
from app.routers import scheduler_slots as scheduler_slots_router
from app.routers import users as users_router
from app.routers import youtube as youtube_router
from scheduler import start_scheduler, stop_scheduler


settings.ensure_dirs()


@asynccontextmanager
async def lifespan(_: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        stop_scheduler()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend for Growth Brother — schedule cross-platform social posts "
        "(YouTube, LinkedIn, Facebook, Instagram) and run the AI content "
        "repurposing agent."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")
app.mount("/ai_assets", StaticFiles(directory=settings.ai_assets_dir), name="ai_assets")

app.include_router(health_router.router)
app.include_router(auth_router.router)
app.include_router(posts_router.router)
app.include_router(youtube_router.router)
app.include_router(repurpose_router.router)
app.include_router(dashboard_router.router)
app.include_router(engagement_router.router)
app.include_router(analytics_router.router)
app.include_router(publishing_router.router)
app.include_router(ai_studio_router.router)
app.include_router(users_router.router)
app.include_router(scheduler_slots_router.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.app_name,
        "env": settings.app_env,
        "docs": "/docs",
        "health": "/health",
    }
