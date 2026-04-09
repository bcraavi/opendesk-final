# CLAUDE.md - OpenDesk

## Build & Run Commands

```bash
# Engine (core library) - must build first, other packages depend on it
cd engine && npm install && npm run build    # one-time build
cd engine && npm run dev                     # watch mode

# Web app (Next.js PWA)
cd apps/web && npm install && npm run dev    # http://localhost:3000

# Browser extension (Chrome MV3)
cd opendesk-ext && npm install && npm run dev   # Vite dev server + HMR
cd opendesk-ext && npm run build                # production build to dist/

# Marketplace server (Python/FastAPI)
cd marketplace && pip install -r requirements.txt && python server.py   # http://localhost:8080
# Or with Docker:
cd marketplace && docker build -t opendesk . && docker run -p 8080:8080 opendesk

# Type checking
cd engine && npm run typecheck
```

## Overview

OpenDesk is an open-source document engine with a plugin system. Two deployment targets exist in this repo:

1. **Standalone editor** (`engine/` + `apps/web/`) -- a TipTap-based rich text editor with plugin API, AI integration, and local-first storage. Think "WordPress for documents."
2. **Browser extension** (`opendesk-ext/`) -- a Chrome extension that injects an AI sidebar and plugin system into Google Docs (and planned Word Online / Notion). Think "Grammarly meets Shopify App Store."

Both share the same plugin API contract and AI provider abstraction. Users bring their own LLM keys (Anthropic, OpenAI, Gemini, Ollama, or any OpenAI-compatible endpoint). No user data touches OpenDesk servers.

License: AGPL-3.0.

## Architecture

### Monorepo Structure

```
opendesk-final/
├── engine/                  # @opendesk/engine -- core library (npm package)
│   ├── src/
│   │   ├── core/            # TipTap editor setup, extensions, context builders
│   │   ├── plugins/         # Plugin system: types, runtime (PluginEngineImpl), loader
│   │   ├── ai/              # AI provider abstraction + adapters per LLM
│   │   ├── storage/         # Storage adapters (File System Access API, browser localStorage)
│   │   └── ui/              # React components (Provider, EditorView, Toolbar, Sidebar, SlashMenu)
│   ├── dist/                # Built output (ESM + CJS + .d.ts)
│   ├── tsup.config.ts       # Build config (two entry points: index.ts and ui/index.ts)
│   ├── package.json         # name: @opendesk/engine
│   └── tsconfig.json
│
├── apps/
│   ├── web/                 # Next.js 15 PWA -- the standalone editor app
│   │   ├── src/app/         # App router (single page: page.tsx)
│   │   ├── src/components/  # OpenDeskApp, AIPanel, Sidebar, LLMSettings
│   │   └── package.json     # depends on @opendesk/engine via file: link
│   ├── desktop/             # Tauri wrapper (placeholder, not yet implemented)
│   └── mobile/              # React Native (placeholder, not yet implemented)
│
├── plugins/                 # Example plugins (ship with core)
│   ├── reading-time/        # Toolbar indicator -- reading time estimate
│   ├── word-count/          # Toolbar indicator -- word/char count
│   ├── ai-writing-assistant/ # AI pipelines: improve, summarize, expand, simplify, etc.
│   ├── export-pdf/          # PDF export
│   └── legal-contract-review/ # Vertical plugin example: clause risk analysis, clause library
│
├── opendesk-ext/            # Chrome extension (Manifest V3)
│   ├── manifest.json        # Permissions: storage, activeTab, sidePanel, tabs
│   ├── src/
│   │   ├── background/      # Service worker
│   │   ├── content-scripts/  # Editor detection + adapters (Google Docs adapter exists)
│   │   ├── sidepanel/       # React sidebar injected via Chrome Side Panel API
│   │   ├── sidebar/         # Older sidebar approach (content script injection)
│   │   ├── popup/           # Extension popup
│   │   ├── ai/              # AI provider + adapters (Anthropic, OpenAI, demo)
│   │   ├── plugins/         # Plugin runtime + bundled AI assistant plugin
│   │   └── shared/          # Shared types and chrome.storage helpers
│   ├── vite.config.ts       # Vite + @crxjs/vite-plugin for Chrome extension builds
│   └── package.json
│
├── marketplace/             # Plugin registry & document API server
│   ├── server.py            # FastAPI single-file server (docs CRUD + LLM proxy)
│   ├── requirements.txt     # fastapi, uvicorn, httpx, pydantic
│   └── Dockerfile
│
├── docs/
│   ├── plugin-development.md
│   └── original-blueprint.md
│
├── CONTRIBUTING.md          # Revenue-share contributor model details
└── README.md
```

### Key Architectural Patterns

**Two-phase plugin initialization:**
1. Phase 1: Plugins call `engine.register*()` methods to declare blocks, sidebar panels, slash commands, toolbar items, AI pipelines, keyboard shortcuts, export formats, webhooks.
2. Phase 2: `OpenDeskEditor.initialize()` creates the TipTap editor with all collected registrations converted to TipTap extensions.

**Plugin API contract** (`engine/src/plugins/types.ts`): The `OpenDeskPlugin` interface requires `name`, `version`, and `setup(engine: PluginEngine)`. The `PluginEngine` exposes registration methods, document/selection context, AI provider, and an event bus for plugin-to-plugin communication.

**AI provider abstraction** (`engine/src/ai/provider.ts`): `AIProviderImpl` delegates to adapter classes (Anthropic, OpenAI, Gemini, Ollama, Demo). Falls back to `DemoAdapter` when no API key is configured. Ollama needs no key.

**Bridge extension** (`engine/src/core/extensions.ts`): A TipTap extension that connects editor events (onUpdate, onSelectionUpdate) to the plugin engine's notification system, enabling `onDocumentChange` and `onSelectionChange` callbacks.

**Engine exports two entry points:**
- `@opendesk/engine` -- core classes, plugin types, AI adapters, storage (platform-agnostic)
- `@opendesk/engine/react` -- React components (OpenDeskProvider, EditorView, Toolbar, Sidebar, SlashMenu)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Editor | TipTap 3.x (ProseMirror) |
| UI | React 18/19 |
| Web app | Next.js 15 (App Router) |
| Engine build | tsup (ESM + CJS + dts) |
| Extension build | Vite + @crxjs/vite-plugin |
| Marketplace | Python FastAPI + uvicorn |
| AI | Multi-provider (Anthropic, OpenAI, Gemini, Ollama, custom) |

## Key Files

| File | Purpose |
|------|---------|
| `engine/src/core/editor.ts` | `OpenDeskEditor` class -- main entry point, two-phase init |
| `engine/src/plugins/types.ts` | Full plugin API type definitions (the developer contract) |
| `engine/src/plugins/runtime.ts` | `PluginEngineImpl` -- collects registrations, manages event bus |
| `engine/src/core/extensions.ts` | TipTap extension factories (blocks, slash commands, keyboard shortcuts, bridge) |
| `engine/src/ai/provider.ts` | `AIProviderImpl` -- routes AI calls to configured adapter |
| `engine/src/ui/index.ts` | React component exports (Provider, EditorView, Toolbar, etc.) |
| `apps/web/src/components/OpenDeskApp.tsx` | Main web app shell -- loads plugins, renders editor + AI panel |
| `opendesk-ext/manifest.json` | Chrome extension manifest (MV3, side panel, Google Docs host) |
| `opendesk-ext/src/content-scripts/adapters/google-docs.ts` | Google Docs DOM adapter |
| `opendesk-ext/src/sidepanel/App.tsx` | Extension sidebar React app |
| `marketplace/server.py` | FastAPI server: document CRUD + multi-provider LLM proxy |
| `plugins/legal-contract-review/index.ts` | Best example of a full vertical plugin |

## Dependencies & Prerequisites

- **Node.js 20+** and npm (or pnpm)
- **Python 3.11+** for the marketplace server
- **Docker** (optional) for containerized marketplace
- The engine must be built (`npm run build` in `engine/`) before `apps/web` can run, since the web app depends on it via `file:../../engine`

## Common Gotchas

- **Build order matters:** `engine/` must be built before `apps/web/` can start. The web app uses a `file:` dependency on the engine, so it reads from `engine/dist/`.
- **Plugin components are null:** Several example plugins set `component: null` for sidebar panels and block renders. The React components are implemented in the app layer (`apps/web/src/components/`), not in the plugin files themselves.
- **Two sidebar implementations in the extension:** `opendesk-ext/src/sidebar/` is an older content-script-injected sidebar; `opendesk-ext/src/sidepanel/` is the newer Chrome Side Panel API approach. The manifest points to the sidepanel version.
- **DemoAdapter fallback:** When no AI API key is configured, the engine uses `DemoAdapter` which returns canned responses. Check `ai.isConfigured()` to know if real AI is available.
- **Slash command engine reference:** The slash command extension stores the `PluginEngineImpl` reference on the TipTap editor via `(editor as any).__opendeskEngine`. This is an internal pattern; do not remove it.
- **apps/desktop/ and apps/mobile/ are empty placeholders** -- Tauri and React Native apps are not yet implemented.
- **The marketplace server stores documents as JSON files** on disk in `DATA_DIR/documents/`. No database required.
- **Extension host permissions** are scoped to `docs.google.com`, LLM API domains, and `localhost`. Adding new editor adapters (Word Online, Notion) will require updating `manifest.json` host permissions.
