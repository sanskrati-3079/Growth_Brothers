# MCP Hub - System Architecture

## Overview

MCP Hub is an event-driven, microservice-based content distribution platform built on the Model Context Protocol (MCP) architecture. It enables automated multi-platform publishing, AI-powered content repurposing, engagement management, and comprehensive analytics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React + TypeScript + Tailwind + Tanstack Query             │
│  - Dashboard UI                                              │
│  - Content Upload Interface                                  │
│  - Publishing Scheduler                                      │
│  - Analytics Visualization                                   │
│  - Engagement Management                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS/WSS
┌──────────────────▼──────────────────────────────────────────┐
│                    Lovable Cloud Backend                     │
│  PostgreSQL + Storage + Auth + Realtime                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    Edge Functions (MCP Layer)                │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Content       │  │ Engagement     │  │ Caption        │ │
│  │ Repurpose     │  │ Reply          │  │ Generator      │ │
│  └───────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                      Lovable AI Gateway                      │
│  - Claude Sonnet 4.5 (Anthropic)                            │
│  - GPT-5 / GPT-5 Mini / GPT-5 Nano                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   External Platform APIs                     │
│  Instagram | YouTube | TikTok | LinkedIn | Twitter/X        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **State Management**: Tanstack Query
- **Routing**: React Router v6

### Backend Runtime
- **API Layer**: Fastify (Node 18+) with typed routes
- **Queues**: BullMQ + Redis, optional in-memory fallback for local dev
- **MCP Bridge**: `@modelcontextprotocol/sdk` server exposing all tools
- **Workers**: Dedicated process executing publishing, engagement, and repurposing jobs
- **Observability**: Pino structured logs, health endpoint, queue metrics hooks
- **Edge Functions**: Reuse Supabase functions for captioning, repurposing, and engagement replies

### AI Integration
- **Gateway**: Lovable AI Gateway
- **Models**: 
  - Anthropic Claude Sonnet 4.5 (default via `LOVABLE_MODEL`)
  - OpenAI GPT-5 (Standard/Mini/Nano)
- **Configuration**: Override the default Claude deployment per environment with `LOVABLE_MODEL`
- **Use Cases**:
  - Content repurposing
  - Caption generation
  - Engagement response automation
  - Sentiment analysis

## Database Schema

### Core Tables

#### `profiles`
- User profile information
- Links to auth.users
- Stores display name, avatar, metadata

#### `content`
- Content library
- Stores videos, images, documents
- Includes metadata, transcripts, tags
- Status tracking (draft, processing, published)

#### `platform_connections`
- OAuth credentials for platforms
- Platform-specific metadata
- Connection status tracking

#### `publishing_schedules`
- Scheduled content publishing
- Platform-specific configurations
- Caption and hashtag management
- Status and error tracking

#### `analytics`
- Performance metrics
- Engagement data
- Platform-specific statistics
- Time-series data

#### `engagements`
- User comments and interactions
- Sentiment analysis results
- Auto-reply tracking
- Lead generation data

#### `repurposing_jobs`
- Content transformation tasks
- Progress tracking
- Result storage

### Storage Buckets

1. **content-media**: Original uploaded content
2. **thumbnails**: Generated thumbnails
3. **processed-content**: Repurposed content outputs

## MCP Tools API

### Content Repurposing

```typescript
POST /functions/v1/content-repurpose
{
  "contentId": "uuid",
  "targetType": "reel_to_carousel" | "reel_to_post" | "summarize"
}
```

**Features**:
- AI-powered content transformation
- Template-based formatting
- Automatic metadata generation
- Progress tracking

### Engagement Reply

```typescript
POST /functions/v1/engagement-reply
{
  "engagementId": "uuid",
  "tone": "friendly" | "professional" | "casual"
}
```

**Features**:
- Context-aware responses
- Sentiment-based adaptation
- Brand voice consistency
- Auto-categorization

### Caption Generation

```typescript
POST /functions/v1/generate-caption
{
  "contentTitle": "string",
  "contentDescription": "string",
  "platform": "instagram" | "youtube" | "tiktok",
  "tone": "engaging" | "professional" | "casual"
}
```

**Features**:
- Platform-optimized captions
- Hashtag suggestions
- SEO optimization
- Character limit compliance

## Security Architecture

### Authentication Flow
1. User signs up/signs in via Auth page
2. JWT token issued by Lovable Cloud Auth
3. Token included in all API requests
4. Edge functions validate JWT
5. RLS policies enforce data access

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies check `auth.uid()` against `user_id`
- Admin operations use security definer functions

### Data Protection
- Encrypted at rest (database & storage)
- TLS in transit
- OAuth tokens encrypted
- API keys stored in Supabase secrets

## Realtime Features

### Enabled Tables
- `content` - Live content updates
- `publishing_schedules` - Schedule changes
- `analytics` - Real-time metrics
- `engagements` - New interactions
- `repurposing_jobs` - Job progress

### WebSocket Subscriptions
```typescript
const channel = supabase
  .channel('content-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'content'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

## Deployment Architecture

### Frontend Deployment
- Static assets on Lovable CDN
- Global edge caching
- Automatic SSL/TLS
- Custom domain support

### Backend Deployment
- Edge functions auto-deployed
- Database migrations atomic
- Zero-downtime deployments
- Automatic scaling

## Performance Optimizations

### Frontend
- Code splitting per route
- Lazy loading for heavy components
- Image optimization
- Query caching with Tanstack Query

### Backend
- Connection pooling
- Query optimization with indexes
- CDN for static assets
- Edge function cold start optimization

### Database
- Indexed foreign keys
- Partial indexes for common queries
- Materialized views for analytics
- Table partitioning for time-series data

## Monitoring & Observability

### Metrics Tracked
- API response times
- Error rates
- Database query performance
- Storage usage
- AI API usage

### Logging
- Edge function logs
- Auth logs
- Database logs
- Network requests

### Alerts
- Failed publishing attempts
- API rate limits
- Database connection issues
- Storage quota warnings

## Scalability Considerations

### Horizontal Scaling
- Stateless edge functions
- Database read replicas
- CDN distribution
- Load balancing

### Vertical Scaling
- Database connection pooling
- Query optimization
- Caching strategies
- Background job processing

## Future Enhancements

### Phase 1 (Current)
- ✅ Core UI/UX
- ✅ Authentication
- ✅ Database schema
- ✅ AI edge functions
- ✅ Storage integration

### Phase 2 (Next)
- Platform API integrations
- Automated scheduling
- A/B testing framework
- Advanced analytics

### Phase 3 (Future)
- Multi-user workspaces
- CRM integrations
- White-label support
- Custom workflow builder
- ML-based optimization

## Development Workflow

### Local Development
```bash
# Frontend
npm run dev

# Edge Functions (auto-deployed)
# Edit in supabase/functions/
```

### Database Migrations
```bash
# Migrations run via Lovable Cloud UI
# Automatic rollback on failure
```

### Testing Strategy
- Unit tests for utility functions
- Integration tests for edge functions
- E2E tests for critical user flows
- Load testing for scalability

## API Rate Limits

### Lovable AI Gateway
- Workspace-level limits
- Per-minute request caps
- Automatic retry with backoff
- Usage-based billing

### Platform APIs
- Platform-specific limits
- Token bucket algorithm
- Queue-based throttling
- Error handling & retries

## Compliance & Privacy

### GDPR Compliance
- User data export
- Right to deletion
- Consent management
- Data processing agreements

### Data Retention
- Content: User-defined
- Analytics: 90 days default
- Logs: 30 days
- Backups: 7 days

## Support & Maintenance

### Backup Strategy
- Automated daily backups
- Point-in-time recovery
- 7-day retention
- Disaster recovery plan

### Update Process
- Rolling updates
- Feature flags
- Canary deployments
- Rollback capabilities
