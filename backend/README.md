# PostPilot Backend

FastAPI-based social media scheduler for YouTube, LinkedIn, Instagram, and Facebook.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000

# Run with Docker
docker build -t postpilot-backend .
docker run -p 8000:8000 postpilot-backend
```

## Environment Variables

Create a `.env` file with:

```env
# Server
HOST=0.0.0.0
PORT=8000

# OAuth (configure per platform)
# Google/YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Meta (Facebook/Instagram)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

## API Endpoints

- `GET /health` - Health check
- `GET /auth/google` - Google OAuth flow
- `GET /auth/linkedin` - LinkedIn OAuth flow
- `GET /auth/meta` - Meta (Facebook) OAuth flow
- `POST /schedule/youtube` - Schedule YouTube post
- `POST /schedule/linkedin` - Schedule LinkedIn post
- `POST /schedule/instagram` - Schedule Instagram post
- `GET /queue` - Get scheduled posts
- `DELETE /queue/{job_id}` - Delete scheduled post

## Deployment

### Docker (Recommended)

```bash
docker build -t postpilot-backend .
docker run -d -p 8000:8000 --env-file .env postpilot-backend
```

### Platform-Specific

- **Render.com**: Use `render.yaml` configuration
- **Railway**: Set environment variables in dashboard
- **Heroku**: Use Python buildpack

## Project Structure

```
backend/
├── main.py           # FastAPI application entry point
├── auth.py           # OAuth authentication handlers
├── scheduler.py      # Job scheduling with APScheduler
├── models.py         # Pydantic data models
├── youtube.py        # YouTube API integration
├── linkedin.py       # LinkedIn API integration
├── linkedin_private.py  # LinkedIn private API
├── instagram_private.py # Instagram private API
├── meta.py           # Meta (Facebook) API integration
├── requirements.txt  # Python dependencies
├── Dockerfile        # Docker image definition
└── .env.example      # Environment template
```