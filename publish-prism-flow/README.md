# MCP Hub - Content Distribution Platform

A comprehensive event-driven, MCP-based content distribution and repurposing system that enables automated publishing, cross-platform content repurposing, engagement handling, and growth analytics.

## 🚀 Core Features

### 1. Content Distribution Agent
- Automated publishing workflows across Instagram, YouTube, and TikTok
- Intelligent scheduling with ML-based optimization
- Caption and hashtag generation
- A/B testing capabilities

### 2. Content Repurposing Engine
- Transform reels into carousels and posts
- Video-to-blog conversion
- Bite-sized content summarization
- Cross-platform format adaptation

### 3. Engagement Management
- Auto-reply functionality
- Comment categorization
- Sentiment analysis
- Lead generation funnels

### 4. Analytics Dashboard
- Real-time performance metrics
- Growth tracking
- Platform comparison
- Engagement analytics

## 🏗️ Architecture

### System Design

```
┌─────────────────┐
│   MCP Server    │  ← Central orchestration layer
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Agent │ │ Tools │
│ Layer │ │ Layer │
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
    ┌────▼─────────────────────┐
    │  Platform Connectors     │
    ├──────────┬───────┬───────┤
    │Instagram │YouTube│TikTok │
    └──────────┴───────┴───────┘
```

### Folder Structure

```
publish-prism-flow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── common/
│   │   │   ├── engagement/
│   │   │   ├── scheduler/
│   │   │   └── upload/
│   │   ├── context/ (Auth, Theme, AI providers)
│   │   ├── hooks/ (AI, analytics, scheduler, uploader helpers)
│   │   ├── pages/ (Home, Upload, Scheduler, Analytics, AI Studio, etc.)
│   │   ├── styles/ (Tailwind + global CSS)
│   │   └── utils/
│   ├── public/
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── src/ (Fastify API, BullMQ queues, MCP server, connectors)
│   └── package.json
├── firebase/
│   └── functions/ (Lovable/Claude-powered captioning, engagement, repurposing)
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
└── README.md (you are here)
```

## 🛠️ Tech Stack

### Frontend (Current)
- **Location**: `frontend/`
- **Framework**: React 19 (JS) + React Router v7
- **Build Tool**: Vite 7 with the React compiler plugin
- **Styling**: Tailwind CSS + custom component library (`frontend/src/components`)
- **Feature Areas**: AI Studio, Upload workflow, Scheduler, Analytics, Engagement, Accounts/Admin pages
- **State/Context**: Auth/Theme/AI providers in `frontend/src/context`, feature hooks under `frontend/src/hooks`

### Backend (Planned)
- **MCP Server**: Node.js/TypeScript
- **Agents**: Python with LLM integration
- **Platform Connectors**: Node.js/Go microservices
- **Message Queue**: RabbitMQ/Redis Streams
- **Storage**: S3/MinIO + PostgreSQL
- **Media Processing**: FFmpeg
- **Monitoring**: Prometheus + Grafana

## 🚦 Implementation Roadmap

### Phase 0: MVP (Current)
- ✅ Dashboard UI with statistics
- ✅ Content upload interface
- ✅ Publishing scheduler
- ✅ Analytics visualization
- ✅ Repurposing tools UI
- ✅ Platform connector status
- ⏳ Basic MCP server setup
- ⏳ Single platform integration (Instagram)

### Phase 1: Multi-Platform
- ⏳ YouTube connector
- ⏳ TikTok connector
- ⏳ Advanced scheduling with ML optimization
- ⏳ Real analytics integration
- ⏳ Content storage and management

### Phase 2: Intelligence Layer
- ⏳ AI-powered engagement bot
- ⏳ Lead funnel integration
- ⏳ Sentiment analysis
- ⏳ Auto-reply system
- ⏳ A/B testing framework

### Phase 3: Enterprise Features
- ⏳ CRM integration
- ⏳ Multi-tenant support
- ⏳ Advanced governance
- ⏳ White-label capabilities
- ⏳ Custom workflow builder

## 🔧 MCP Tools

### Publishing Tools
```typescript
publish_reel(
  video_url: string,
  platform: string,
  account_id: string,
  caption: string,
  hashtags: string[],
  schedule_time: Date,
  visibility: string
)
```

### Repurposing Tools
```typescript
repurpose_reel_to_carousel(
  reel_url: string,
  template_id: string
)

repurpose_reel_to_post(
  reel_transcript: string,
  platform: string
)

summarize_content(
  content: string,
  length: number
)
```

### Engagement Tools
```typescript
auto_reply(
  message_context: object,
  tone: string
)

categorize_response(
  message_text: string
)

generate_lead_cta(
  category: string,
  landing_page_link: string
)
```

### Analytics Tools
```typescript
fetch_engagement_metrics(
  post_id: string
)

track_funnel_conversion(
  user_id: string,
  event: string
)
```

## 🔐 Security & Compliance

- OAuth 2.0 for platform authentication
- Secrets management with Vault/KMS
- Rate limiting and quota management
- GDPR compliance for user data
- Audit logging for all operations

## 📊 Monitoring

- Real-time system health metrics
- Platform API status monitoring
- Content performance tracking
- User engagement analytics
- Error tracking and alerting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mcp-hub

# Install root scripts + backend helpers
npm install

# Install the new frontend dependencies
npm install --prefix frontend

# Start frontend dev server (proxied to the frontend folder)
npm run dev

# Install backend dependencies
cd backend
npm install

# Start backend API (runs on port 4001 by default)
npm run dev

# (Optional) start queue workers & MCP sidecar
npm run workers
npm run mcp
```

### Environment Setup

```bash
# Backend configuration (when implemented)
cp .env.example .env

# Configure platform API keys
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
YOUTUBE_API_KEY=your_key
TIKTOK_CLIENT_KEY=your_key

# Backend specific
PORT=4001
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."
FIREBASE_FUNCTIONS_BASE_URL=https://us-central1-your_project_id.cloudfunctions.net
FIREBASE_FUNCTIONS_API_KEY=callable_secret
LOVABLE_API_KEY=your_ai_gateway_key
LOVABLE_MODEL=anthropic/claude-4.5-sonnet
```
# Frontend specific
VITE_FIREBASE_API_KEY=web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=messaging_sender_id
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_API_BASE_URL=http://localhost:4001

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Details](docs/ARCHITECTURE.md)

## 🤝 Contributing

This is an evolving platform. Contributions for backend implementation, AI agent development, and platform connectors are welcome.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- React + Vite
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics
- Lucide React for icons

---

**Note**: This is Phase 0 (MVP) with UI/UX implementation. Backend microservices, MCP server, and AI agents are planned for subsequent phases.
