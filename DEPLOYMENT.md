# Deployment

Two deployable services:

- **backend** — FastAPI at `backend/`, container exposes port 8000.
- **frontend** — Vite/React at `publish-prism-flow/frontend/`, served by nginx on port 80.

## 0. Local dev prerequisites

The repurpose agent shells out to `ffmpeg` and `yt-dlp`. The Docker image
already includes both; for non-Docker local dev install them yourself:

```bash
# macOS
brew install ffmpeg
pip install yt-dlp   # or use the venv: `pip install -r backend/requirements.txt`

# Debian / Ubuntu
sudo apt-get install -y ffmpeg
pip install yt-dlp
```

If either binary is missing, `/repurpose/youtube` and `/repurpose/upload` will
return HTTP 500 with a clear "Required binary not found" message.

## 1. Configure secrets

```bash
cp backend/.env.example backend/.env
# Fill in BACKEND_URL, FRONTEND_URL, OAuth client IDs/secrets, OPENAI_API_KEY.
```

`SECRET_KEY` must be a long random string — generate one with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

`CORS_ORIGINS` should be a comma-separated list of every frontend origin
that will hit this backend (e.g. `https://app.example.com`).

## 2. OAuth redirect whitelist

Whitelist these URLs in each provider's developer console (`BACKEND_URL` is
whatever you set in `.env`):

| Provider | Redirect URI |
|---|---|
| Google / YouTube | `${BACKEND_URL}/auth/callback` |
| LinkedIn | `${BACKEND_URL}/auth/linkedin/callback` |
| Facebook | `${BACKEND_URL}/auth/facebook/callback` |
| Instagram | `${BACKEND_URL}/auth/instagram/callback` |

After OAuth, users land on `${FRONTEND_URL}/accounts?success=...`. The
frontend already has that route.

## 3. One-command deploy with Docker Compose

```bash
# From repo root.
VITE_API_BASE_URL=https://api.example.com \
VITE_BACKEND_URL=https://api.example.com \
VITE_AI_CONTENT_AGENT_URL=https://api.example.com \
docker compose up -d --build
```

This brings up:
- backend on `:8000`
- frontend on `:8080` (nginx serves the static build and proxies `/api/*` to `backend:8000` over the compose network)

Persistent volumes are created for `uploads/`, `tokens/`, `repurpose_output/`,
`ai_assets/`, and the JSON state files — your scheduled jobs and OAuth
tokens survive container restarts.

## 4. Deploying to PaaS (Render, Fly, Railway, Cloud Run)

### Backend
- Use `backend/Dockerfile`. The container honors `$PORT` automatically.
- Mount a persistent disk at `/app/tokens` and `/app/uploads` (and ideally
  `/app/repurpose_output`, `/app/ai_assets`). On Render, attach a disk; on
  Fly, use a volume; on Cloud Run, switch to a managed bucket.
- Set every variable from `backend/.env.example` in the platform's
  environment config — never commit `.env`.

### Frontend
- Build artifact is `publish-prism-flow/frontend/dist/`.
- For static hosts (Vercel, Netlify, Cloudflare Pages, S3+CloudFront) set
  `VITE_API_BASE_URL` (and friends) at build time to your backend's public
  URL, then run `npm run build`.
- For the dockerized nginx flow, build with `--build-arg
  VITE_API_BASE_URL=...` so the URL is baked into the bundle.

## 5. Production checklist

- [ ] Rotated every secret in `backend/.env` (the original commit had real
      keys — assume they're compromised and regenerate them).
- [ ] `SECRET_KEY` is random and not the dev default.
- [ ] `APP_ENV=production` in backend env.
- [ ] `CORS_ORIGINS` contains the real frontend origin (and *only* that).
- [ ] OAuth redirect URIs whitelisted in each provider's console.
- [ ] HTTPS terminator in front of backend (Render/Fly/Cloudflare/etc.).
- [ ] Persistent volumes mounted for `tokens/` and `uploads/`.
- [ ] FFmpeg available in the backend container (already in the Dockerfile).
- [ ] `backend/.env` and `publish-prism-flow/frontend/.env` are in
      `.gitignore`.
