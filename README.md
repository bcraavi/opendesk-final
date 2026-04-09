# OpenDesk Engine

### The open-source document engine that anyone can build on.

OpenDesk is not another Google Docs clone. It's a fast, extensible document editor with a **plugin system** that lets developers build specialized tools for any industry — legal, healthcare, research, finance, sales, education, and more.

Think of it like **WordPress for documents**. The core is a clean, fast editor. The real product is the ecosystem of plugins that transform it into the exact tool each industry needs.

---

## Why This Exists

Google Docs is fine for everyone, perfect for nobody. Every industry has specific document workflows that Google will never build because each vertical is "too small" for them — but massive as a market.

- A **lawyer** needs AI contract review, clause comparison, redlining
- A **doctor** needs SOAP note templates, medical terminology, coding suggestions
- A **researcher** needs citations, literature review AI, LaTeX export
- A **sales team** needs brand voice enforcement, CRM context, proposal templates
- A **finance team** needs SEC filing templates, compliance checking, audit trails

These users are stuck duct-taping 5 tools together. OpenDesk lets plugin developers build exactly what each vertical needs — inside one editor.

---

## How It Works

```
OpenDesk Engine (free, open source)
│
├── Core Editor
│   ├── Rich text, markdown, tables, images, code blocks
│   ├── Real-time collaboration (Yjs/CRDT)
│   ├── Base AI (bring your own LLM — Claude, GPT, Gemini, Ollama)
│   ├── Self-hostable, data-portable
│   └── Fast. No bloat.
│
└── Plugin System
    ├── Custom block types (render anything inline)
    ├── Sidebar panels
    ├── Slash commands
    ├── Toolbar items
    ├── AI pipelines (chain custom AI workflows)
    ├── Export formats
    ├── Keyboard shortcuts
    ├── Webhooks & integrations
    └── Full access to document context + user's LLM
```

---

## Plugin Marketplace & Revenue Model

This is the business model. Plugin developers build and sell specialized tools:

```
Plugin Marketplace Revenue Split
├── 70% → Plugin Creator
└── 30% → Platform (OpenDesk)
```

| Tier | Price Range | Examples |
|------|-------------|---------|
| **Free plugins** | $0 | Word count, dark mode themes, emoji picker |
| **Pro plugins** | $5–50/mo | Citation manager, SEO scorer, brand voice |
| **Enterprise plugins** | $100–500/mo | Legal contract AI, HIPAA clinical notes, compliance engine |

**Plugin creators are the contributors who get paid** — not through complex usage tracking, but through direct marketplace sales. Simple, proven, understood by everyone. The Shopify App Store model.

---

## Plugin API

Developers build plugins using a simple, well-documented API:

```javascript
// Example: A "Reading Time" plugin
export default {
  name: "reading-time",
  version: "1.0.0",

  setup(engine) {
    // Add a toolbar item
    engine.registerToolbarItem({
      id: "reading-time",
      icon: "⏱️",
      tooltip: "Estimated reading time",
      render: (doc) => {
        const words = doc.getText().split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
      },
    });
  },
};
```

```javascript
// Example: A "Legal Clause Checker" plugin
export default {
  name: "legal-clause-checker",
  version: "1.0.0",
  price: "$29/mo",

  setup(engine) {
    // Register a custom AI pipeline
    engine.registerAIPipeline({
      id: "clause-review",
      label: "Review Clauses",
      icon: "⚖️",
      process: async (selectedText, ai) => {
        return ai.complete({
          system: "You are a contract attorney. Analyze clauses for risk.",
          prompt: `Review this clause and flag risks:\n\n${selectedText}`,
        });
      },
    });

    // Register a sidebar panel
    engine.registerSidebarPanel({
      id: "clause-library",
      title: "Clause Library",
      icon: "📜",
      component: ClauseLibraryPanel,
    });

    // Register a custom block type
    engine.registerBlockType({
      name: "legal-clause",
      label: "Legal Clause",
      icon: "§",
      render: LegalClauseBlock,
      editable: true,
    });
  },
};
```

### Plugin API Hooks

| Hook | Description |
|------|-------------|
| `registerBlockType(config)` | Custom blocks that render inline (charts, embeds, forms, etc.) |
| `registerSidebarPanel(panel)` | Sidebar panels with custom UI |
| `registerSlashCommand(command)` | `/commands` in the editor |
| `registerToolbarItem(item)` | Buttons and indicators in the toolbar |
| `registerAIPipeline(pipeline)` | Custom AI workflows using the user's LLM |
| `registerExportFormat(format)` | Custom export (PDF templates, LaTeX, DOCX styles, etc.) |
| `registerKeyboardShortcut(shortcut)` | Custom keyboard shortcuts |
| `registerImportParser(parser)` | Import from custom file formats |
| `onDocumentChange(callback)` | React to document changes |
| `onSelectionChange(callback)` | React to selection changes |
| `registerWebhook(config)` | Connect to external APIs and services |

### Context Available to Plugins

Plugins have access to:
- Document content and metadata
- Current selection
- User preferences and settings
- User's configured LLM (call AI without managing keys)
- Other installed plugins (inter-plugin communication)

---

## Architecture

### Zero Backend for End Users

OpenDesk runs entirely on the user's device. No accounts, no servers, no data collection.

```
┌─────────────────────────────────────────────┐
│              User's Device                   │
│                                             │
│  OpenDesk App (Web / Desktop / Mobile)      │
│    ├── Core Editor                          │
│    ├── Plugin Runtime                       │
│    ├── AI calls → directly to LLM provider  │
│    └── Storage → user's own files           │
│         ├── Local filesystem                │
│         ├── Google Drive sync folder        │
│         ├── OneDrive sync folder            │
│         ├── Dropbox sync folder             │
│         └── iCloud Drive                    │
└─────────────────────────────────────────────┘

We host: Plugin marketplace & registry (like npm)
Users host: Everything else — their data never touches us
```

Documents are saved as **standard .md and .json files** in whatever folder the user picks. If they pick a folder inside their Google Drive / OneDrive / iCloud / Dropbox sync directory, sync happens automatically through their existing cloud service. No OAuth, no API integration needed.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Editor** | TipTap (ProseMirror) | Best extensible rich text framework, plugins map naturally to TipTap extensions |
| **Collaboration** | Yjs (CRDT) | Proven real-time sync, offline-first, conflict-free |
| **Plugin Runtime** | Sandboxed iframe + postMessage API | Security isolation, plugins can't access user data outside their scope |
| **Desktop App** | Tauri | 5MB binary vs 200MB Electron, native file system access, Rust-based security |
| **Mobile** | React Native | Shared logic with web |
| **Web** | PWA (Next.js) | Installable, works offline, no app store needed |
| **AI** | Multi-provider (Claude, GPT, Gemini, Ollama, any OpenAI-compatible) | User brings their own key, calls go direct from device |
| **Plugin Registry** | Simple API (like npm registry) | Developers publish, users install, marketplace handles payments |

### Project Structure

```
opendesk/
├── engine/
│   ├── core/                    # Core editor (TipTap + ProseMirror)
│   │   ├── editor.ts            # Main editor setup
│   │   ├── schema.ts            # Document schema
│   │   ├── collaboration.ts     # Yjs integration
│   │   └── ai.ts                # Base AI provider abstraction
│   │
│   ├── plugins/                 # Plugin system
│   │   ├── runtime.ts           # Plugin loader and sandbox
│   │   ├── api.ts               # Plugin API (hooks, context)
│   │   ├── registry.ts          # Plugin marketplace client
│   │   └── types.ts             # Plugin type definitions
│   │
│   ├── storage/                 # File I/O adapters
│   │   ├── filesystem.ts        # File System Access API
│   │   └── types.ts
│   │
│   └── ui/                      # Core UI components
│       ├── Editor.tsx
│       ├── Sidebar.tsx
│       ├── Toolbar.tsx
│       └── PluginHost.tsx       # Renders plugin UI
│
├── apps/
│   ├── web/                     # PWA (Next.js)
│   ├── desktop/                 # Tauri wrapper
│   └── mobile/                  # React Native
│
├── plugins/                     # Example plugins (ship with core)
│   ├── reading-time/
│   ├── word-count/
│   ├── export-pdf/
│   └── ai-writing-assistant/
│
├── docs/
│   ├── plugin-development.md    # How to build plugins
│   ├── plugin-api-reference.md  # Full API reference
│   ├── architecture.md
│   └── self-hosting.md
│
├── marketplace/                 # Plugin registry server (the only thing we host)
│   ├── api/
│   └── web/
│
└── README.md
```

---

## Roadmap

### Phase 1: Core Engine + Plugin API (Now)
- [ ] Core editor with TipTap
- [ ] Plugin API with all hooks
- [ ] 3-4 example plugins (reading time, word count, export PDF, AI assistant)
- [ ] Local file storage
- [ ] Web app (PWA)
- [ ] LLM integration (Claude, GPT, Gemini, Ollama)

### Phase 2: Desktop + Plugin Marketplace
- [ ] Tauri desktop app
- [ ] Plugin marketplace / registry
- [ ] Plugin developer SDK and docs
- [ ] Payment integration for paid plugins
- [ ] Real-time collaboration (Yjs WebSocket)

### Phase 3: Mobile + Ecosystem Growth
- [ ] React Native mobile app
- [ ] Plugin developer program
- [ ] Enterprise plugin partnerships (legal, healthcare, finance verticals)
- [ ] Self-hosted marketplace for enterprise (private plugin registries)

### Phase 4: Scale
- [ ] Plugin analytics for developers
- [ ] Enterprise team features (via plugins)
- [ ] API for headless usage (documents as a service)
- [ ] Plugin composability (plugins that enhance other plugins)

---

## Target Verticals (In Priority Order)

| Vertical | Pain Point | Plugin Opportunity | Willingness to Pay |
|----------|-----------|-------------------|-------------------|
| **Legal** | Contract review is manual, expensive | AI clause review, redlining, template library | Very high ($100-500/user/mo) |
| **Healthcare** | EHR note-taking is universally hated | Clinical note templates, medical AI, coding | Very high ($100-300/user/mo) |
| **Research/Academia** | Juggling Overleaf + Zotero + Google Docs | Citations, LaTeX, literature review AI | Medium ($10-30/user/mo) |
| **Sales/Marketing** | Brand consistency across teams | Brand voice AI, SEO, CRM integration | High ($20-50/user/mo) |
| **Finance** | Compliance and regulatory burden | SEC templates, compliance checking, audit trail | Very high ($100-500/user/mo) |
| **Software Teams** | RFCs/ADRs scattered across tools | Templates, code execution, Jira integration | Medium ($10-20/user/mo) |
| **Education** | Grading and feedback is tedious | Rubric AI, plagiarism context, feedback workflows | Low-Medium ($5-15/user/mo) |

---

## Competitive Positioning

| | Google Docs | Notion | MS Word | OpenDesk Engine |
|---|---|---|---|---|
| Plugin/extension system | ❌ Limited | ❌ Closed | ❌ Legacy (COM/VSTO) | ✅ Modern, open API |
| Self-hostable | ❌ | ❌ | ❌ | ✅ |
| Bring your own AI | ❌ Gemini only | ❌ Built-in only | ❌ Copilot only | ✅ Any provider |
| Industry-specific tools | ❌ | ❌ | ❌ | ✅ Via plugins |
| Data ownership | ❌ Google's servers | ❌ Notion's servers | ❌ Microsoft's servers | ✅ Your files, your device |
| Developer ecosystem | ❌ | ❌ | ❌ | ✅ Marketplace with revenue |
| Open source | ❌ | ❌ | ❌ | ✅ AGPL-3.0 |

The key insight: **we don't compete with Google Docs horizontally. We enable vertical solutions that Google will never build.** A lawyer doesn't switch to OpenDesk because it's a "better Google Docs" — they switch because the legal plugin makes contract work 10x faster. Each vertical has its own reason.

---

## For Plugin Developers

Build a plugin, list it on the marketplace, earn 70% of every sale. The market for vertical document tools is massive and untapped because no platform has made it easy to build them. Until now.

```bash
# Create a new plugin
npx create-opendesk-plugin my-plugin

# Develop with hot reload
cd my-plugin && npm run dev

# Publish to marketplace
npm run publish
```

Full docs: [plugin-development.md](./docs/plugin-development.md)

---

## License

Core engine: **AGPL-3.0** — free to use, modify, self-host.
Plugins: Licensed individually by their creators.

---

<p align="center">
  <strong>The document engine for builders.</strong>
  <br/>
  <em>Don't build another editor. Build on this one.</em>
</p>
