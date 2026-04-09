# Contributing to OpenDesk

Welcome! OpenDesk is an open-source office suite where **contributors earn revenue share** based on the value they create. This isn't just open-source for ideology — it's open-source as a business model where everyone who builds gets paid.

## 💰 Revenue Share Model

### How You Earn

Every merged PR is tagged with a **feature area** and an **impact type**. When paying users on the managed platform use features you built, you earn a proportional share of the revenue.

### Revenue Split

```
Total Managed Platform Revenue
├── 50%  Core Operations (hosting, infra, support, legal, marketing)
├── 30%  Contributor Pool (distributed by feature usage × impact)
├── 10%  Maintainer Fund (core reviewers and maintainers)
└── 10%  Community Fund (bounties, events, grants)
```

### Impact Scoring

| Impact Type | Score | Description |
|-------------|-------|-------------|
| Core Feature | 1.0 | New capability that didn't exist before |
| Enhancement | 0.6 | Meaningful improvement to existing feature |
| Bug Fix | 0.3 | Fixes broken functionality |
| Documentation | 0.2 | Guides, API docs, tutorials |
| Tests | 0.2 | Test coverage improvements |

### Usage Weight

Your contribution's share is multiplied by its **usage weight** — the percentage of active monthly users who use your feature. A feature used by 40% of users earns more than one used by 5%.

### Recency Factor

Contributions earn revenue with a gradual decay:

| Months Since Merge | Multiplier |
|--------------------|-----------|
| 1–6 | 1.0x |
| 7–12 | 0.8x |
| 13–18 | 0.6x |
| 19–24 | 0.4x |
| 24+ | Expires (but you keep all past earnings) |

This ensures active contributors are rewarded most, while past contributors still earn for a meaningful period.

### Payouts

- **Monthly** via Open Collective, Stripe Connect, or crypto
- **$50 minimum** threshold before payout
- **Public dashboard** showing feature usage and revenue attribution
- All earnings are **transparent and auditable**

### Example

You build the **PDF export feature**. It gets merged as a `core_feature` (score: 1.0). Over the next month, 35% of paying users use PDF export. If the contributor pool for that month is $10,000:

```
Your share = (1.0 × 0.35 × 1.0) / total_weighted_scores × $10,000
```

If total weighted scores across all contributors sum to 5.0, your share would be:
```
(0.35 / 5.0) × $10,000 = $700 for that month
```

---

## 🏗️ Feature Areas

When submitting a PR, tag it with one of these feature areas:

| Area | Description |
|------|-------------|
| `editor-core` | Rich text editing, ProseMirror/TipTap |
| `collaboration` | Real-time sync, CRDT, presence |
| `ai-assistant` | AI writing features |
| `export` | PDF, DOCX, Markdown, HTML export |
| `auth` | Authentication, SSO, permissions |
| `storage` | File management, upload, search |
| `ui` | Design system, components, themes |
| `sheets` | Spreadsheet engine (Phase 2) |
| `slides` | Presentation builder (Phase 3) |
| `api` | Backend API, integrations |
| `infra` | Docker, CI/CD, deployment |
| `docs` | Documentation, guides |
| `tests` | Test coverage |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- pnpm (recommended) or npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/opendesk-suite/opendesk.git
cd opendesk

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Install frontend dependencies
cd apps/web && pnpm install

# Start frontend dev server
pnpm dev

# In another terminal, start the API
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# In another terminal, start the collab server
cd apps/collab
pnpm install
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Project Structure

```
opendesk/
├── apps/
│   ├── web/        # Next.js frontend (TipTap editor)
│   ├── api/        # FastAPI backend
│   └── collab/     # WebSocket collaboration server
├── packages/       # Shared packages
├── deploy/         # Docker & K8s configs
└── docs/           # Documentation
```

---

## 📝 Submitting a PR

1. **Fork** the repo and create a feature branch
2. **Write your code** — follow existing patterns and style
3. **Add tests** for new features
4. **Tag your PR** with the feature area and impact type using labels
5. **Describe** what you built and why in the PR description
6. **Submit** — maintainers will review within 48 hours

### PR Template

```markdown
## Feature Area
<!-- e.g., editor-core, ai-assistant, export -->

## Impact Type
<!-- core_feature | enhancement | bugfix | docs | tests -->

## Description
<!-- What does this PR do? Why? -->

## Testing
<!-- How did you test this? -->

## Revenue Share Notes
<!-- Any notes on how usage should be tracked for this feature -->
```

### Code Standards

- **TypeScript** for frontend (strict mode)
- **Python** with type hints for backend
- **Tests** required for core features and bug fixes
- **No console.log** in production code
- **Meaningful commit messages** (conventional commits preferred)

---

## 🤝 Code of Conduct

We're building something that pays people for their work. That means we treat each other with respect, give constructive feedback, and celebrate contributions. Harassment, discrimination, or toxicity of any kind will result in removal from the contributor program.

---

## 📧 Questions?

- **GitHub Discussions** — for feature ideas and architecture questions
- **Discord** — for real-time chat (link in README)
- **Email** — contributors@opendesk.dev

---

*Build features. Get paid. Own the future of productivity software.*
