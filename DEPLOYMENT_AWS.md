# AWS Deployment Guide — Growth Brothers
**Complete beginner-friendly guide. No prior AWS experience needed.**

---

## CRITICAL SECURITY WARNING — Read This First

Your `backend/.env` file contains **live API keys and secrets that are visible in plain text**.  
Before deploying, you **must** rotate (regenerate) every key listed below:

| Key | Where to regenerate |
|-----|---------------------|
| `OPENAI_API_KEY` | platform.openai.com → API Keys → Delete old, create new |
| `GOOGLE_API_KEY` | console.cloud.google.com → APIs & Services → Credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Same Google Cloud Console page |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | linkedin.com/developers → Your App → Auth |
| `META_APP_ID` / `META_APP_SECRET` | developers.facebook.com → Your App → Settings |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | Same Meta developer console |
| `SECRET_KEY` | Generate a new random one (instructions below) |

**Why?** If these keys have ever been in a git commit or shared file, attackers can find and abuse them to run up your bills or steal data.

---

## What We're Building

```
Internet
   │
   ▼
[Your Domain / IP]
   │
   ├── Port 80/443 → Frontend (React app served by Nginx)
   └── Port 8000   → Backend (FastAPI Python API)

AWS EC2 Server (Ubuntu 22.04)
   └── Docker Compose
       ├── frontend container  (Nginx + React)
       └── backend container   (Python + FFmpeg)
           └── 5 persistent volumes (uploads, tokens, etc.)
```

**Estimated monthly cost:** $35–70/month depending on server size.

---

## Step 0 — What You Need Before Starting

- A credit card (AWS requires one, charges are pay-as-you-go)
- Your project folder (`d:\Growth_Bro\Growth_Brothers\`)
- Rotated API keys (see security warning above)
- Optional but recommended: a domain name ($10–15/year from Namecheap or GoDaddy)

---

## Step 1 — Create an AWS Account

1. Go to **aws.amazon.com** and click **Create an AWS Account**
2. Enter your email, create a password, and choose an account name (e.g., "GrowthBro")
3. Enter your contact info and credit card
4. Choose the **Basic (Free)** support plan
5. Wait for email verification

> **Tip:** AWS has a Free Tier for 12 months — but this app needs a t3.medium which is NOT free tier eligible. Expect ~$35–70/month.

---

## Step 2 — Launch an EC2 Server

EC2 is just a virtual computer (server) running in the cloud.

### 2a. Open the EC2 Dashboard

1. Log in to the AWS Console: **console.aws.amazon.com**
2. In the top search bar type **EC2** and click it
3. Click the orange **Launch instance** button

### 2b. Configure Your Server

Fill in the form:

**Name:** `growthbro-server`

**Application and OS Images (Amazon Machine Image):**
- Click **Ubuntu**
- Select: **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- Architecture: **64-bit (x86)**

**Instance type:**
- Choose **t3.large** (2 vCPU, 8 GB RAM) — recommended for video processing
- If budget is tight, **t3.medium** (2 vCPU, 4 GB) works but may be slow for videos

> **What this costs:** t3.large ≈ $60/month | t3.medium ≈ $30/month

**Key pair (login):**
- Click **Create new key pair**
- Name it: `growthbro-key`
- Key pair type: **RSA**
- Private key file format: **.pem** (for Mac/Linux) or **.ppk** (for Windows with PuTTY)
- Click **Create key pair** — a file will download automatically
- **Save this file somewhere safe. You cannot download it again.**

**Network settings:**
- Leave VPC and subnet as default
- Check **Allow SSH traffic from** → select **My IP** (more secure)
- Check **Allow HTTPS traffic from the internet**
- Check **Allow HTTP traffic from the internet**

**Configure storage:**
- Change root volume from 8 GB to **60 GB** (your app stores video files)
- Volume type: **gp3** (faster and cheaper than gp2)

### 2c. Launch It

Click **Launch instance** (orange button). Wait 2–3 minutes.

---

## Step 3 — Allocate a Static IP Address

By default, your server's IP changes every time it restarts. Fix this with an Elastic IP (free while the server is running).

1. In EC2 left sidebar → **Elastic IPs**
2. Click **Allocate Elastic IP address** → **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Instance: select your `growthbro-server`
5. Click **Associate**

Write down your Elastic IP — you'll need it throughout this guide. It looks like `54.123.45.67`.

---

## Step 4 — Open the Firewall Ports

You need to open the ports your app uses.

1. In EC2 → click your instance → scroll to **Security** tab
2. Click the security group link (looks like `sg-0abc123...`)
3. Click **Edit inbound rules**
4. Add these rules:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | Admin access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 | Backend API |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Frontend (Docker) |

5. Click **Save rules**

---

## Step 5 — Connect to Your Server

### On Windows (using PowerShell):

```powershell
# Replace path with where your .pem file downloaded
# Replace 54.123.45.67 with your actual Elastic IP
ssh -i "C:\Users\YourName\Downloads\growthbro-key.pem" ubuntu@54.123.45.67
```

If you get a permissions error on the .pem file:
```powershell
# Fix permissions on Windows
icacls "C:\Users\YourName\Downloads\growthbro-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

### On Mac/Linux (Terminal):

```bash
chmod 400 ~/Downloads/growthbro-key.pem
ssh -i ~/Downloads/growthbro-key.pem ubuntu@54.123.45.67
```

You should see a Ubuntu welcome message. You are now inside your AWS server.

---

## Step 6 — Install Docker on the Server

Run these commands one by one in your server terminal:

```bash
# Update the system package list
sudo apt-get update

# Install required packages
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow your user to run Docker without sudo
sudo usermod -aG docker ubuntu

# Log out and back in for the group change to take effect
exit
```

After typing `exit`, SSH back into your server:
```bash
ssh -i ~/Downloads/growthbro-key.pem ubuntu@54.123.45.67
```

Verify Docker works:
```bash
docker --version
docker compose version
```

You should see version numbers printed.

---

## Step 7 — Upload Your Project to the Server

You have two options. **Option A** is easier if your code is on GitHub. **Option B** works from your local machine.

### Option A — From GitHub (Recommended)

If your project is on GitHub:
```bash
# On the server
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Option B — Upload from Your Windows PC

Open a **new** PowerShell window on your PC (not the server):
```powershell
# Upload the entire project folder
# Replace paths and IP with your actual values
scp -i "C:\Users\YourName\Downloads\growthbro-key.pem" -r "d:\Growth_Bro\Growth_Brothers" ubuntu@54.123.45.67:~/
```

This will take a few minutes depending on your internet speed.

---

## Step 8 — Set Up Environment Variables

This is the most important step. These are your secret API keys.

On the server, navigate to the project:
```bash
cd ~/Growth_Brothers
```

Create the backend `.env` file:
```bash
nano backend/.env
```

Paste the content below, filling in your **newly rotated** API keys:

```bash
# ─── OpenAI ───────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-YOUR_NEW_OPENAI_KEY_HERE

# ─── Google API ────────────────────────────────────────────────────
GOOGLE_API_KEY=YOUR_NEW_GOOGLE_API_KEY_HERE

# ─── Google OAuth ──────────────────────────────────────────────────
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# ─── App Settings ──────────────────────────────────────────────────
APP_ENV=production

# Replace 54.123.45.67 with your Elastic IP (or domain if you have one)
FRONTEND_URL=http://54.123.45.67:8080
BACKEND_URL=http://54.123.45.67:8000

# Generate a secure key with:  python3 -c "import secrets; print(secrets.token_urlsafe(48))"
SECRET_KEY=PASTE_YOUR_GENERATED_SECRET_KEY_HERE

# Your frontend URL for CORS
CORS_ORIGINS=http://54.123.45.67:8080

# ─── LinkedIn OAuth ────────────────────────────────────────────────
LINKEDIN_CLIENT_ID=YOUR_LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET=YOUR_LINKEDIN_CLIENT_SECRET

# ─── Meta / Facebook OAuth ─────────────────────────────────────────
META_APP_ID=YOUR_META_APP_ID
META_APP_SECRET=YOUR_META_APP_SECRET
META_GRAPH_VERSION=v25.0

# ─── Instagram OAuth ───────────────────────────────────────────────
INSTAGRAM_APP_ID=YOUR_INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET=YOUR_INSTAGRAM_APP_SECRET
```

To save in nano: press **Ctrl+O**, then **Enter**, then **Ctrl+X** to exit.

Generate a secret key (run this, then paste the output as your SECRET_KEY):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

---

## Step 9 — Update OAuth Redirect URIs

Every social platform needs to know your server's address so it can redirect users back after login.

Go to each developer console and update the redirect URIs:

| Platform | Console URL | Redirect URI to add |
|----------|-------------|---------------------|
| Google/YouTube | console.cloud.google.com → Credentials → Your OAuth App | `http://54.123.45.67:8000/auth/callback` |
| LinkedIn | linkedin.com/developers → Your App → Auth | `http://54.123.45.67:8000/auth/linkedin/callback` |
| Facebook | developers.facebook.com → Your App → Facebook Login → Settings | `http://54.123.45.67:8000/auth/facebook/callback` |
| Instagram | Same Meta console → Instagram Basic Display | `http://54.123.45.67:8000/auth/instagram/callback` |

> **If you buy a domain later**, you'll update these to use `https://yourdomain.com/auth/...`

---

## Step 10 — Build and Start the Application

Run this on your server from the project root directory:

```bash
cd ~/Growth_Brothers

# Set the frontend URLs and start everything
VITE_API_BASE_URL=http://54.123.45.67:8000 \
VITE_BACKEND_URL=http://54.123.45.67:8000 \
VITE_AI_CONTENT_AGENT_URL=http://54.123.45.67:8000 \
docker compose up -d --build
```

This will:
1. Download all required software packages
2. Build your React frontend into an optimized bundle
3. Package your Python backend
4. Start both services

The first build takes **5–15 minutes**. Grab a coffee.

### Check if it's running:

```bash
# See if both containers are running
docker compose ps

# Should show:
# growthbrothers-backend-1    Up    0.0.0.0:8000->8000/tcp
# growthbrothers-frontend-1   Up    0.0.0.0:8080->80/tcp
```

### Test in your browser:

- Frontend: `http://54.123.45.67:8080`
- Backend API docs: `http://54.123.45.67:8000/docs`
- Health check: `http://54.123.45.67:8000/health`

---

## Step 11 — Set Up a Domain Name (Strongly Recommended)

A domain name (like `growthbrothers.com`) makes your app look professional and is required for proper OAuth to work with some providers.

### 11a. Buy a Domain

Go to **namecheap.com** or **godaddy.com** and buy a domain (~$10–15/year).

### 11b. Point Domain to Your Server

In your domain registrar's DNS settings, add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 54.123.45.67 | 3600 |
| A | www | 54.123.45.67 | 3600 |
| A | api | 54.123.45.67 | 3600 |

Wait 10–30 minutes for DNS to propagate.

### 11c. Install Nginx as Reverse Proxy

```bash
sudo apt-get install -y nginx
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/growthbro
```

Paste this (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Backend API
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Allow large file uploads (videos)
        client_max_body_size 500M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Save and enable:
```bash
sudo ln -s /etc/nginx/sites-available/growthbro /etc/nginx/sites-enabled/
sudo nginx -t    # Test config (should say "ok")
sudo systemctl restart nginx
```

### 11d. Install Free SSL (HTTPS)

```bash
# Install Certbot (free SSL tool)
sudo apt-get install -y certbot python3-certbot-nginx

# Get free SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

Certbot auto-renews your certificate every 90 days. Test renewal works:
```bash
sudo certbot renew --dry-run
```

### 11e. Update Your .env for HTTPS

After getting SSL, update `backend/.env`:
```bash
nano ~/Growth_Brothers/backend/.env
```

Change these lines:
```bash
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

Rebuild the app:
```bash
cd ~/Growth_Brothers
docker compose down

VITE_API_BASE_URL=https://api.yourdomain.com \
VITE_BACKEND_URL=https://api.yourdomain.com \
VITE_AI_CONTENT_AGENT_URL=https://api.yourdomain.com \
docker compose up -d --build
```

Update all OAuth redirect URIs in each platform's console to use `https://api.yourdomain.com/auth/...`.

---

## Step 12 — Auto-Start on Server Reboot

Make Docker and your app start automatically if the server ever reboots:

```bash
# Docker already starts automatically. Configure your app to start:
cd ~/Growth_Brothers

# Create a systemd service
sudo nano /etc/systemd/system/growthbro.service
```

Paste this:
```ini
[Unit]
Description=Growth Brothers App
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/Growth_Brothers
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
Environment="VITE_API_BASE_URL=https://api.yourdomain.com"
Environment="VITE_BACKEND_URL=https://api.yourdomain.com"
Environment="VITE_AI_CONTENT_AGENT_URL=https://api.yourdomain.com"
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable growthbro
```

---

## Maintenance Cheatsheet

### Daily commands you'll actually use:

```bash
# SSH into server
ssh -i ~/growthbro-key.pem ubuntu@54.123.45.67

# Check if app is running
cd ~/Growth_Brothers && docker compose ps

# View live logs (press Ctrl+C to stop)
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# Restart the app
docker compose restart

# Stop the app
docker compose down

# Start the app
docker compose up -d
```

### After updating your code:

```bash
cd ~/Growth_Brothers

# If using GitHub, pull latest changes
git pull

# Rebuild and restart (keeps your data volumes safe)
VITE_API_BASE_URL=https://api.yourdomain.com \
VITE_BACKEND_URL=https://api.yourdomain.com \
VITE_AI_CONTENT_AGENT_URL=https://api.yourdomain.com \
docker compose up -d --build
```

### Check disk space:

```bash
df -h          # Overall disk usage
docker system df   # Docker-specific usage
```

### Free up disk space (when builds pile up):

```bash
# Remove old/unused Docker images (safe to run)
docker image prune -f

# More aggressive cleanup (removes stopped containers, unused networks)
docker system prune -f
```

---

## Troubleshooting

### App won't start / containers keep restarting

```bash
# Check what's wrong
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

Look for error messages. Common issues:
- **Missing environment variable** → Edit `backend/.env` and restart
- **Port already in use** → Run `sudo lsof -i :8000` to find what's using it

### Can't reach the app in browser

```bash
# Check if containers are running
docker compose ps

# Check if ports are open
sudo netstat -tlnp | grep -E '8000|8080|80'

# Check AWS security group — make sure ports 80, 443, 8000, 8080 are open
```

### "Connection refused" on API calls

- Make sure backend is running: `docker compose ps`
- Check `VITE_API_BASE_URL` matches your actual backend URL
- Rebuild if you changed env vars: `docker compose up -d --build`

### Out of disk space

```bash
docker image prune -a -f    # Remove all unused images
docker system prune -a -f   # Remove everything unused
```

### SSH "Permission denied"

```bash
# On Windows, fix .pem file permissions
icacls "C:\path\to\growthbro-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

---

## Cost Summary

| Resource | Monthly Cost |
|----------|-------------|
| EC2 t3.large (recommended) | ~$60 |
| EC2 t3.medium (budget option) | ~$30 |
| EBS Storage 60 GB (gp3) | ~$5 |
| Elastic IP (while running) | Free |
| Data Transfer (first 100 GB) | Free |
| **Total (recommended)** | **~$65/month** |

> **Save money tip:** Stop the EC2 instance when not in use (AWS Console → Instances → Stop). You still pay for storage (~$5/month) but not compute. Your data is preserved.

---

## Architecture Diagram

```
Browser (User)
     │
     ▼ Port 443 (HTTPS)
  [Nginx on EC2]
     │
     ├── yourdomain.com → Docker: frontend (port 8080)
     │                     React app served as static files
     │
     └── api.yourdomain.com → Docker: backend (port 8000)
                               FastAPI Python app
                               │
                               ├── /uploads   (Docker Volume - video files)
                               ├── /tokens    (Docker Volume - OAuth tokens)
                               ├── /repurpose_output  (Docker Volume)
                               ├── /ai_assets (Docker Volume)
                               └── /state     (Docker Volume - JSON data)
```

---

## Quick Start Summary (TL;DR)

1. Create AWS account → Launch EC2 t3.large Ubuntu 22.04
2. Allocate Elastic IP and associate with instance
3. Open ports 22, 80, 443, 8000, 8080 in security group
4. SSH into server: `ssh -i growthbro-key.pem ubuntu@YOUR_IP`
5. Install Docker (Step 6 commands above)
6. Upload project files to server
7. Create `backend/.env` with your rotated API keys
8. Run: `VITE_API_BASE_URL=http://YOUR_IP:8000 VITE_BACKEND_URL=http://YOUR_IP:8000 VITE_AI_CONTENT_AGENT_URL=http://YOUR_IP:8000 docker compose up -d --build`
9. Visit `http://YOUR_IP:8080` in browser
10. (Optional) Add domain + SSL for HTTPS

**Need help?** Check logs first: `docker compose logs -f`
