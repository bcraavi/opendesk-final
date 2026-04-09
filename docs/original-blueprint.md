# OpenDesk — The Open-Source Office Suite

## Vision

A modern, cloud-native, AI-native, open-source office suite with real-time collaboration — where every contributor earns revenue share based on the value they create.

**Mission:** Replace Microsoft 365 and Google Workspace with a community-owned alternative that's privacy-first, self-hostable, and genuinely beautiful to use.

---

## Market Opportunity

| Metric | Value |
|--------|-------|
| Microsoft 365 paid users | 400M+ |
| Google Workspace users | 3B+ |
| Combined annual revenue | $60B+ |
| Average cost per user/month | $6–$22 |
| Enterprise contracts | $50K–$10M+/year |

### Why Now

- **CRDTs** (Yjs, Automerge) make real-time collaboration a solved problem
- **AI APIs** make intelligent features trivial to integrate
- **WebAssembly** enables near-native browser performance
- **Serverless/Cloud Run** makes hosting cheap at any scale
- **AI-assisted development** means a small team can build what took 50+ engineers before
- **Data sovereignty regulations** (GDPR, EU Digital Sovereignty) are pushing governments and enterprises toward self-hosted solutions
- **AI pricing backlash** — Microsoft Copilot at $30/user/month on top of existing licenses is creating massive frustration

### Target Segments (In Priority Order)

1. **Privacy-first individuals and teams** — developers, journalists, activists
2. **Self-hosting enthusiasts** — massive Linux/FOSS community
3. **Startups** — don't want $12/user/month for Google Workspace
4. **EU/Government organizations** — data sovereignty requirements
5. **Enterprises** — vendor lock-in concerns, cost optimization
6. **Education** — schools and universities seeking affordable alternatives

---

## Product Roadmap

### Phase 1: OpenDesk Docs (Months 1–4) ← START HERE

Real-time collaborative document editor with AI capabilities.

**Core Features:**
- Rich text editing (headings, lists, tables, images, code blocks)
- Real-time multiplayer collaboration via CRDTs (Yjs)
- Cursor presence and awareness (see who's editing where)
- Version history and change tracking
- Markdown import/export
- AI writing assistant (summarize, expand, translate, rewrite)
- Comments and suggestions
- Document sharing with permissions (view/edit/comment)
- Offline support with sync
- Export to PDF, DOCX, HTML

**Why Docs First:**
- Lowest complexity of the core apps
- Highest daily usage frequency
- Natural viral loop (sharing docs)
- Competes simultaneously with Google Docs AND Notion

### Phase 2: OpenDesk Sheets (Months 5–8)

Collaborative spreadsheet with formula engine.

**Core Features:**
- Full formula engine (Excel-compatible)
- Real-time collaboration
- Charts and visualizations
- Pivot tables
- CSV/XLSX import/export
- AI-powered data analysis and formula generation
- Conditional formatting
- Data validation

### Phase 3: OpenDesk Slides (Months 9–11)

Presentation builder.

**Core Features:**
- Drag-and-drop slide editor
- Real-time collaboration
- Template system
- Presenter mode with notes
- Export to PDF, PPTX
- AI slide generation from text/outline
- Animation and transitions

### Phase 4: OpenDesk Mail (Months 12–15)

Integrated email client.

**Core Features:**
- IMAP/SMTP support
- AI triage and categorization
- Smart compose
- Unified inbox
- Calendar integration
- Contact management

### Phase 5: OpenDesk Drive (Months 12–15, parallel with Mail)

File storage and management layer.

**Core Features:**
- File upload/organization
- Search across all OpenDesk apps
- Sharing and permissions
- Storage tiers
- Preview for common file types

---

## Technical Architecture

### High-Level Stack

```
┌─────────────────────────────────────────────────┐
│                   CLIENTS                        │
│  Web (React/Next.js)  │  Desktop (Electron/Tauri)│  Mobile (React Native) │
└──────────────┬──────────────────────┬────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐
│    API Gateway        │  │  WebSocket Server     │
│    (FastAPI)          │  │  (Real-time Collab)   │
└──────────┬───────────┘  └──────────┬────────────┘
           │                         │
           ▼                         ▼
┌──────────────────────────────────────────────────┐
│              Core Services Layer                  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Auth     │ │ Document │ │ Collaboration    │ │
│  │ Service  │ │ Service  │ │ Service (CRDT)   │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ AI       │ │ Storage  │ │ Contributor      │ │
│  │ Service  │ │ Service  │ │ Revenue Service  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Data Layer                           │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │PostgreSQL│ │  Redis   │ │ Object Storage   │ │
│  │(metadata)│ │ (cache/  │ │ (GCS/S3/MinIO)   │ │
│  │          │ │  pubsub) │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + Next.js + TipTap (ProseMirror) | TipTap is the best WYSIWYG editor framework, built on ProseMirror, with Yjs collab built in |
| **Real-time Collaboration** | Yjs + y-websocket | Battle-tested CRDT library, used by Notion, JupyterLab. Handles offline + conflict resolution |
| **Backend API** | Python/FastAPI | Bob's strength. Async-native, excellent for WebSocket support |
| **Auth** | Auth.js (NextAuth) + custom JWT | Open standard, supports SSO/SAML for enterprise tier |
| **Database** | PostgreSQL | Rock solid. Stores user data, document metadata, permissions, contributor ledger |
| **Cache/PubSub** | Redis | Session management, presence awareness, real-time event bus |
| **Object Storage** | MinIO (self-host) / GCS (managed) | S3-compatible. Stores document content, images, attachments |
| **Search** | Meilisearch | Open-source, fast, easy to self-host. Full-text search across all documents |
| **AI Integration** | Multi-provider (Claude, OpenAI, local models) | Flexibility. Users can bring their own API key or use hosted |
| **Desktop** | Tauri | Lightweight alternative to Electron, Rust-based |
| **Mobile** | React Native | Code sharing with web |
| **Containerization** | Docker + Docker Compose | Easy self-hosting |
| **Orchestration** | Kubernetes (managed) / Cloud Run (hosted) | GCP-native for managed version |

### Phase 1 Architecture Detail: Docs Engine

```
┌──────────────────────────────────────────────┐
│              Browser Client                   │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  TipTap Editor (ProseMirror)            │ │
│  │  ├── Rich text editing                  │ │
│  │  ├── Custom extensions (AI, comments)   │ │
│  │  └── Yjs binding (y-prosemirror)        │ │
│  └──────────────┬──────────────────────────┘ │
│                 │                             │
│  ┌──────────────▼──────────────────────────┐ │
│  │  Yjs Document (Client-side CRDT)        │ │
│  │  ├── Undo/Redo manager                  │ │
│  │  ├── Awareness protocol (cursors)       │ │
│  │  └── Offline persistence (IndexedDB)    │ │
│  └──────────────┬──────────────────────────┘ │
└─────────────────┼────────────────────────────┘
                  │ WebSocket
                  ▼
┌──────────────────────────────────────────────┐
│          y-websocket Server                   │
│  ├── Room management (1 room per doc)        │
│  ├── Persistence to storage on disconnect    │
│  ├── Auth middleware (JWT validation)         │
│  └── Presence broadcasting                   │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│          FastAPI Backend                      │
│  ├── /api/auth/* — login, register, SSO      │
│  ├── /api/docs/* — CRUD, sharing, permissions│
│  ├── /api/ai/*   — summarize, expand, etc.   │
│  ├── /api/export/* — PDF, DOCX, HTML         │
│  └── /api/contributors/* — revenue tracking  │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│          Data Stores                          │
│  PostgreSQL: users, docs metadata, perms     │
│  Redis: sessions, presence, rate limiting    │
│  MinIO/GCS: Yjs document snapshots, images   │
└──────────────────────────────────────────────┘
```

---

## Contributor Revenue-Share Model

### How It Works

1. **Every merged PR is tagged** with a feature area (e.g., `editor-core`, `ai-assistant`, `export-pdf`, `charts`, `comments`)
2. **Feature usage is tracked** on the managed/hosted version (anonymized telemetry)
3. **Revenue is attributed** to features based on usage weight
4. **Contributors earn proportional share** of revenue tied to their feature contributions

### Revenue Split

```
Total Managed Platform Revenue
├── 50% → Core Operations (hosting, support, legal, marketing)
├── 30% → Contributor Pool (distributed by feature usage)
├── 10% → Maintainer Fund (core maintainers, reviewers)
└── 10% → Community Fund (events, bounties, grants)
```

### Contributor Scoring

Each contributor's share of the 30% pool is calculated by:

```
contributor_score = Σ (feature_impact × usage_weight × recency_factor)

feature_impact:
  - Core feature (new capability)     = 1.0
  - Enhancement (improves existing)   = 0.6
  - Bug fix                           = 0.3
  - Documentation                     = 0.2
  - Test coverage                     = 0.2

usage_weight:
  - % of active users who use the feature monthly

recency_factor:
  - Decays over 24 months (contributor keeps earning but amount decreases)
  - Month 1-6: 1.0x | Month 7-12: 0.8x | Month 13-18: 0.6x | Month 19-24: 0.4x
```

### Payout Mechanism

- **Monthly payouts** via Open Collective, Stripe Connect, or crypto (contributor's choice)
- **Minimum threshold:** $50 before payout triggers
- **Public dashboard** showing feature usage, revenue attribution, and contributor earnings (anonymized if preferred)
- **Smart contract option** for trustless automated distribution

### Contributor Ledger

Every contribution is recorded in a public, auditable ledger:

```json
{
  "contribution_id": "c_abc123",
  "contributor": "github:alice",
  "pr_number": 42,
  "feature_area": "ai-assistant",
  "impact_type": "core_feature",
  "impact_score": 1.0,
  "merged_at": "2026-03-15T10:00:00Z",
  "description": "Added AI summarization for documents"
}
```

---

## Licensing Strategy

### Dual License: AGPL-3.0 + Commercial

**AGPL-3.0 (Open Source)**
- Free for individuals, startups, self-hosting
- Requires sharing modifications if you offer it as a service
- This prevents AWS/Azure from reselling your hosted version without contributing back

**Commercial License**
- For companies that want to embed OpenDesk without AGPL obligations
- For cloud providers who want to offer managed OpenDesk
- Priced per-user or per-deployment

### Open Core Feature Split

| Feature | Free (AGPL) | Team ($8/user/mo) | Enterprise ($20/user/mo) |
|---------|-------------|--------------------|-----------------------|
| Docs, Sheets, Slides | ✅ | ✅ | ✅ |
| Real-time collaboration | ✅ | ✅ | ✅ |
| AI features (BYOK) | ✅ | ✅ | ✅ |
| Self-hosting | ✅ | ✅ | ✅ |
| 5GB storage | ✅ | — | — |
| 100GB storage | — | ✅ | — |
| Unlimited storage | — | — | ✅ |
| AI features (hosted) | — | ✅ | ✅ |
| Admin console | — | ✅ | ✅ |
| SSO / SAML | — | — | ✅ |
| Audit logs | — | — | ✅ |
| Priority support | — | — | ✅ |
| SLA (99.9% uptime) | — | — | ✅ |
| Custom branding | — | — | ✅ |
| Compliance (SOC2, HIPAA) | — | — | ✅ |
| On-premise deployment support | — | — | ✅ |

---

## Phase 1 MVP Scope (8-Week Sprint)

### Week 1–2: Foundation
- [ ] Project scaffolding (monorepo with Turborepo)
- [ ] Next.js frontend with TipTap editor integration
- [ ] Yjs CRDT setup with y-prosemirror binding
- [ ] Basic y-websocket server for real-time sync
- [ ] PostgreSQL schema for users and documents
- [ ] Docker Compose for local development

### Week 3–4: Core Editor
- [ ] Rich text: headings, bold, italic, underline, strikethrough
- [ ] Lists (ordered, unordered, checklists)
- [ ] Tables
- [ ] Code blocks with syntax highlighting
- [ ] Image upload and embedding
- [ ] Markdown shortcuts (type `#` for heading, etc.)
- [ ] Slash commands menu

### Week 5–6: Collaboration & Auth
- [ ] User authentication (email/password + OAuth)
- [ ] Document creation, listing, deletion
- [ ] Real-time cursor presence (see other users' cursors)
- [ ] Document sharing with permissions
- [ ] Version history (Yjs snapshots)
- [ ] Comments and inline suggestions

### Week 7–8: AI & Polish
- [ ] AI writing assistant (summarize, expand, translate, rewrite, fix grammar)
- [ ] Export to PDF, DOCX, Markdown
- [ ] Responsive design / mobile support
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Landing page and documentation
- [ ] Docker image for self-hosting
- [ ] Deploy managed version on GCP Cloud Run
- [ ] Contributor onboarding docs and revenue-share system setup

---

## Deployment Architecture (Managed Version)

```
┌────────────────────────────────────────────┐
│              GCP Infrastructure             │
│                                            │
│  Cloud Run          Cloud Run              │
│  ┌──────────┐      ┌──────────────┐       │
│  │ Next.js  │      │ FastAPI      │       │
│  │ Frontend │      │ Backend      │       │
│  └────┬─────┘      └──────┬───────┘       │
│       │                   │               │
│  Cloud Run          Cloud SQL              │
│  ┌──────────┐      ┌──────────────┐       │
│  │WebSocket │      │ PostgreSQL   │       │
│  │ Server   │      │              │       │
│  └──────────┘      └──────────────┘       │
│                                            │
│  Memorystore        Cloud Storage          │
│  ┌──────────┐      ┌──────────────┐       │
│  │ Redis    │      │ Documents    │       │
│  │          │      │ & Assets     │       │
│  └──────────┘      └──────────────┘       │
│                                            │
│  Cloud CDN          Cloud Armor            │
│  (static assets)    (DDoS protection)      │
└────────────────────────────────────────────┘
```

### Self-Hosted Deployment

```bash
# One-command self-hosting
git clone https://github.com/opendesk-suite/opendesk
cd opendesk
cp .env.example .env  # Configure your settings
docker-compose up -d

# That's it. Running at http://localhost:3000
```

---

## Project Structure

```
opendesk/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # Next.js app router
│   │   │   ├── components/     # React components
│   │   │   │   ├── editor/     # TipTap editor components
│   │   │   │   ├── ui/         # Shared UI components
│   │   │   │   └── layout/     # Layout components
│   │   │   ├── lib/            # Utilities, hooks, helpers
│   │   │   │   ├── yjs/        # Yjs configuration
│   │   │   │   ├── ai/         # AI integration
│   │   │   │   └── api/        # API client
│   │   │   └── styles/         # Global styles
│   │   └── package.json
│   │
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/        # API routes
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── services/       # Business logic
│   │   │   └── core/           # Config, auth, deps
│   │   ├── alembic/            # Database migrations
│   │   └── requirements.txt
│   │
│   └── collab/                 # WebSocket collaboration server
│       ├── src/
│       │   ├── server.ts       # y-websocket server
│       │   ├── auth.ts         # JWT validation
│       │   └── persistence.ts  # Document persistence
│       └── package.json
│
├── packages/
│   ├── editor-extensions/      # Custom TipTap extensions
│   │   ├── ai-assistant/
│   │   ├── comments/
│   │   ├── slash-commands/
│   │   └── export/
│   ├── shared-types/           # Shared TypeScript types
│   └── ui/                     # Shared component library
│
├── contrib/
│   ├── CONTRIBUTING.md         # How to contribute
│   ├── REVENUE_SHARE.md        # Revenue share details
│   └── ledger/                 # Public contributor ledger
│       └── contributions.json
│
├── deploy/
│   ├── docker-compose.yml      # Self-hosting
│   ├── docker-compose.dev.yml  # Development
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   ├── Dockerfile.collab
│   └── k8s/                    # Kubernetes manifests
│
├── docs/
│   ├── architecture.md
│   ├── self-hosting.md
│   ├── api-reference.md
│   └── contributor-guide.md
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
├── LICENSE                     # AGPL-3.0
├── LICENSE-COMMERCIAL.md       # Commercial license terms
└── README.md
```

---

## Competitive Advantages

| vs Google Docs | vs Microsoft 365 | vs Notion | vs LibreOffice |
|----------------|-------------------|-----------|----------------|
| Self-hostable | 10x cheaper | Full office suite, not just docs | Cloud-native |
| Privacy-first | No vendor lock-in | Real-time collaboration | Modern UI/UX |
| AI with any provider | No forced Copilot upsell | Open source | Real-time collab |
| Open source | Open source | Self-hostable | AI-native |
| Contributor revenue share | AGPL prevents cloud exploitation | Not $10/user/mo | Active development |

---

## Success Metrics

### Phase 1 (3 months post-launch)
- 1,000 registered users
- 100 daily active users
- 10 external contributors with merged PRs
- 50+ GitHub stars

### Phase 1 (6 months post-launch)
- 10,000 registered users
- 1,000 DAU
- 50 contributors
- 500+ GitHub stars
- First paying team customers

### Year 1
- 100,000 registered users
- 10,000 DAU
- 200+ contributors
- 5,000+ GitHub stars
- $50K MRR from managed version
- First enterprise customer

### Year 3
- 1M+ registered users
- 100,000 DAU
- 1,000+ contributors
- Sheets and Slides launched
- $500K+ MRR
- Series A ready

---

## Immediate Next Steps

1. **Register domain and GitHub org** — `opendesk.dev` or `opendesk.io`
2. **Set up monorepo** with Turborepo scaffolding
3. **Build TipTap editor prototype** with Yjs real-time collaboration
4. **Set up FastAPI backend** with auth and document CRUD
5. **Deploy Docker Compose** for local development
6. **Write CONTRIBUTING.md** and revenue-share documentation
7. **Create landing page** explaining the vision and inviting contributors
8. **Post on Hacker News, Reddit, Indie Hackers** for initial traction

---

*OpenDesk: Your documents. Your data. Your platform.*
