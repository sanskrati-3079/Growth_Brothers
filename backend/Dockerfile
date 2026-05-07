FROM python:3.11-slim

WORKDIR /app

# System deps for the repurpose agent (ffmpeg) and image rendering (libjpeg etc).
# yt-dlp is installed via pip from requirements.txt.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        libjpeg-dev \
        zlib1g-dev \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (cached layer).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY . .

# Persistent data dirs (mount these as volumes in production so tokens / uploads
# / job state survive container restarts).
RUN mkdir -p uploads tokens repurpose_output ai_assets

EXPOSE 8000

# Honor PORT env var if the platform sets one (Render, Fly, Cloud Run, etc.).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
