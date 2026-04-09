# OpenDesk

### A browser extension that adds superpowers to Google Docs, Word Online, and Notion.

OpenDesk is **not** another document editor. It's a browser extension with a **plugin system** that injects AI tools, industry-specific workflows, and custom features directly into the tools you already use.

Think **Grammarly meets Shopify App Store** — but for document workflows.

---

## The Idea

Everyone already uses Google Docs, Word Online, or Notion. They're not switching. So we don't ask them to.

Instead, OpenDesk sits on top as a browser extension and adds what those tools will never build:

- A **plugin system** where developers build specialized tools for specific industries
- **Bring-your-own AI** — connect Claude, GPT, Gemini, Ollama, or any LLM
- A **marketplace** where plugin developers earn money

The user stays in their editor. Their storage, their login, their sharing — all untouched. We just add a sidebar with superpowers.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  Browser (Chrome / Edge / Firefox / Safari)      │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Google Docs / Word Online / Notion        │  │
│  │  (user's existing editor — untouched)      │  │
│  │                                            │  │
│  │                        ┌─────────────────┐ │  │
│  │                        │ OpenDesk        │ │  │
│  │                        │ Extension       │ │  │
│  │   user's document      │                 │ │  │
│  │   in their editor      │ • AI Sidebar    │ │  │
│  │                        │ • Plugins       │ │  │
│  │                        │ • Custom tools  │ │  │
│  │                        │                 │ │  │
│  │                        └─────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  AI calls: browser → LLM provider directly      │
│  Storage: user's existing (Google Drive, etc.)   │
│  We see: NOTHING                                │
└─────────────────────────────────────────────────┘
```

**One click install. Zero migration. Zero switching cost.**

---

## What It Adds to Your Editor

### Core Features (Free)

- **AI Sidebar** — Select text → Improve, Summarize, Expand, Simplify, Translate, Fix Grammar
- **Bring Your Own LLM** — Works with Claude, GPT-4o, Gemini, Ollama, LMStudio, any OpenAI-compatible API
- **Slash Commands** — Type `/` for quick actions inside your doc
- **Keyboard Shortcuts** — Power user workflows

### Plugin Marketplace

Developers build specialized plugins. Users install what they need:

| Plugin | For | Price |
|--------|-----|-------|
| ⚖️ Contract Review | Lawyers | $29/mo |
| 🏥 Clinical Notes | Doctors | $39/mo |
| 📚 Citation Manager | Researchers | $9/mo |
| 📊 SEO Scorer | Content teams | $15/mo |
| 🎨 Brand Voice | Marketing | $19/mo |
| 📋 RFC Templates | Engineering | Free |
| 📈 Data Viz | Analysts | $12/mo |
| 🔒 Compliance Check | Finance | $49/mo |
| ✏️ Grading Assistant | Teachers | $9/mo |
| 🌍 Translation Pro | Localization | $19/mo |

---

## Why People Pay

Google Docs is a blank canvas. It does everything okay, nothing great for any specific job.

A **lawyer** doesn't need a better editor — they need AI that understands contract law, flags risky clauses, and suggests alternative language. Google will never build that. But a legal-tech developer can build it as an OpenDesk plugin and sell it for $29/mo.

A **doctor** doesn't need a better editor — they need SOAP note templates, medical autocomplete, and coding suggestions injected right into their workflow.

Each vertical has a $10-500/mo problem that nobody is solving because Google won't and building a whole new editor is too expensive. The browser extension + plugin marketplace makes these buildable and sellable.

---

## Business Model

```
Plugin Marketplace Revenue
├── 70% → Plugin Developer
└── 30% → OpenDesk Platform

Extension Tiers
├── Free — Core AI sidebar (BYOK), 3 plugins max
├── Pro ($8/mo) — Unlimited plugins, priority support
└── Team ($15/user/mo) — Shared plugin configs, team templates
```

### Why This Works

- **Plugin developers** build once, sell to thousands of users → recurring revenue
- **Users** get specialized tools without switching editors → saves hours/week
- **Platform** takes 30% of every plugin sale → scales with ecosystem
- **Same model as** Shopify App Store, Figma plugins, VS Code extensions — all proven at scale

---

## Supported Platforms

| Platform | Support | How |
|----------|---------|-----|
| **Google Docs** | Full | Content script injection, DOM observation |
| **Microsoft Word Online** | Full | Content script injection |
| **Notion** | Full | Content script injection |
| **Google Sheets** | Planned | Phase 2 |
| **Overleaf** | Planned | Phase 2 (research vertical) |
| **Any text field** | Basic AI | Grammarly-style floating toolbar |

The extension detects which editor you're in and adapts its injection strategy. Each platform has its own adapter that knows how to read content, detect selection, and insert text.

---

## Plugin API

Developers build plugins using a simple API. The extension handles all the hard parts — editor integration, AI routing, UI rendering.

```javascript
// Example: Reading Time plugin (free)
export default {
  name: "reading-time",
  version: "1.0.0",
  icon: "⏱️",

  setup(engine) {
    engine.registerToolbarItem({
      id: "reading-time",
      position: "right",
      render: (doc) => `${Math.ceil(doc.wordCount / 200)} min read`,
    });
  },
};
```

```javascript
// Example: SEO Scorer plugin ($15/mo)
export default {
  name: "seo-scorer",
  version: "1.0.0",
  icon: "📊",

  setup(engine) {
    engine.registerAIPipeline({
      id: "seo-score",
      label: "SEO Score",
      icon: "📊",
      showInSidebar: true,
      process: async (text, ai) => {
        return ai.complete({
          system: "You are an SEO expert. Score this content 1-100.",
          prompt: text,
        });
      },
    });

    engine.registerSidebarPanel({
      id: "seo-panel",
      title: "SEO Analysis",
      icon: "📊",
      component: SEOPanel,
    });
  },
};
```

### Plugin API Hooks

| Hook | What it does |
|------|-------------|
| `registerSidebarPanel(config)` | Add a panel to the OpenDesk sidebar |
| `registerAIPipeline(config)` | Custom AI action using user's LLM |
| `registerToolbarItem(config)` | Button/indicator in the toolbar |
| `registerSlashCommand(config)` | `/command` in the editor |
| `registerContextMenuItem(config)` | Item in the right-click menu |
| `registerKeyboardShortcut(config)` | Custom keyboard shortcut |
| `registerExportFormat(config)` | Custom export (PDF template, LaTeX, etc.) |
| `onDocumentChange(callback)` | React to document edits |
| `onSelectionChange(callback)` | React to text selection |
| `getDocument()` | Read document content |
| `getSelection()` | Read selected text |
| `insertText(text)` | Insert at cursor in the editor |
| `replaceSelection(text)` | Replace selected text |
| `ai.complete(params)` | Call user's configured LLM |

Plugins never handle API keys. They call `engine.ai.complete()` and the extension routes it to whatever LLM the user configured.

---

## Technical Architecture

### Extension Structure

```
opendesk-extension/
├── manifest.json              # Chrome extension manifest (MV3)
│
├── background/
│   └── service-worker.ts      # Background service worker
│       ├── Plugin loader       # Loads/manages installed plugins
│       ├── AI router           # Routes AI calls to user's LLM
│       └── Storage             # Extension settings (chrome.storage)
│
├── content-scripts/
│   ├── detector.ts            # Detects which editor is active
│   ├── adapters/
│   │   ├── google-docs.ts     # Google Docs DOM adapter
│   │   ├── word-online.ts     # Word Online DOM adapter
│   │   ├── notion.ts          # Notion DOM adapter
│   │   └── generic.ts         # Fallback for any text area
│   └── injector.ts            # Injects OpenDesk UI into page
│
├── sidebar/                   # The OpenDesk sidebar (React)
│   ├── App.tsx
│   ├── panels/
│   │   ├── AIPanel.tsx        # Core AI actions
│   │   ├── PluginsPanel.tsx   # Installed plugin UIs
│   │   └── SettingsPanel.tsx  # LLM config, plugin management
│   └── components/
│
├── plugins/                   # Plugin runtime
│   ├── runtime.ts             # Sandbox, lifecycle management
│   ├── api.ts                 # Plugin API implementation
│   └── marketplace.ts         # Install/update/remove plugins
│
├── popup/                     # Extension popup (quick settings)
│   └── Popup.tsx
│
└── options/                   # Full settings page
    └── Options.tsx
```

### Editor Adapters

Each supported platform has an adapter that knows how to:

```typescript
interface EditorAdapter {
  /** Detect if this editor is active on the page */
  detect(): boolean;

  /** Get the full document text */
  getDocumentText(): string;

  /** Get currently selected text */
  getSelection(): { text: string; range: any };

  /** Insert text at the current cursor position */
  insertText(text: string): void;

  /** Replace the current selection */
  replaceSelection(text: string): void;

  /** Observe document changes */
  onContentChange(callback: () => void): () => void;

  /** Observe selection changes */
  onSelectionChange(callback: () => void): () => void;

  /** Get the best injection point for the sidebar */
  getSidebarAnchor(): HTMLElement;
}
```

Google Docs uses a canvas-based renderer, so the adapter uses the Docs API via the DOM. Word Online uses contenteditable divs. Notion uses its own block DOM. The adapter layer abstracts all of this.

### AI Routing (Zero Server)

```
User selects text → Plugin calls engine.ai.complete()
    → Extension routes to user's configured provider
    → Browser makes direct HTTPS call to provider API
    → Response returns to plugin
    → Plugin renders result in sidebar

Supported providers:
├── Anthropic (api.anthropic.com)
├── OpenAI (api.openai.com)
├── Google Gemini (generativelanguage.googleapis.com)
├── Ollama (localhost:11434)
└── Custom (any OpenAI-compatible endpoint)
```

API keys stored in `chrome.storage.local` — encrypted, never leaves the device, never touches our servers.

### Data Flow

```
What we see: NOTHING
What we store: Plugin registry, marketplace listings, payment processing
What the user owns: Everything else

The extension runs entirely in the browser.
Documents stay in Google Drive / OneDrive / wherever they already are.
AI calls go direct to the provider.
Plugin code runs sandboxed in the extension.
```

---

## Roadmap

### Phase 1: Core Extension (8 weeks)
- [ ] Chrome extension (Manifest V3)
- [ ] Google Docs adapter (read content, selection, insert text)
- [ ] AI sidebar with BYOK (Claude, GPT, Gemini, Ollama)
- [ ] Core AI actions (improve, summarize, expand, simplify, fix grammar)
- [ ] Plugin API (core hooks)
- [ ] 2-3 example plugins bundled
- [ ] Settings page (LLM configuration)
- [ ] Chrome Web Store listing

### Phase 2: Marketplace + More Platforms
- [ ] Word Online adapter
- [ ] Notion adapter
- [ ] Plugin marketplace (browse, install, purchase)
- [ ] Plugin developer SDK + docs
- [ ] Payment integration (Stripe)
- [ ] Firefox and Edge extension ports
- [ ] 10+ plugins from early developers

### Phase 3: Mobile + Ecosystem
- [ ] Safari extension (iOS/macOS)
- [ ] Plugin developer program
- [ ] Enterprise vertical partnerships
- [ ] Team features (shared plugin configs)
- [ ] Plugin analytics dashboard for developers

### Phase 4: Scale
- [ ] 100+ plugins in marketplace
- [ ] Enterprise accounts
- [ ] Private plugin registries (for companies)
- [ ] API for headless plugin usage
- [ ] Safari extension for iPad

---

## Market Size

| Metric | Value |
|--------|-------|
| Chrome extension users (Grammarly alone) | 30M+ |
| Google Docs users | 1B+ |
| MS Office Online users | 400M+ |
| Notion users | 30M+ |
| Avg. SaaS plugin spend per user | $20-100/mo |
| Browser extension conversion rate | 2-5% |

If we reach **1M extension installs** (Grammarly has 30M) and **3% convert to Pro + plugins** at an average **$25/mo**, that's **$9M ARR**. And that's conservative.

---

## Competitive Landscape

| | Grammarly | Jasper | OpenDesk |
|---|---|---|---|
| Works inside Google Docs | ✅ | ❌ (own editor) | ✅ |
| Works inside Word Online | ✅ | ❌ | ✅ |
| Custom AI provider | ❌ (their own) | ❌ (their own) | ✅ (any LLM) |
| Plugin ecosystem | ❌ | ❌ | ✅ |
| Industry-specific tools | ❌ | ❌ | ✅ (via plugins) |
| Open source | ❌ | ❌ | ✅ |
| Developer marketplace | ❌ | ❌ | ✅ |
| Data privacy | ❌ (their servers) | ❌ (their servers) | ✅ (direct to LLM) |

Grammarly does one thing (grammar). Jasper does one thing (marketing copy). OpenDesk is a **platform** where anyone can build the next Grammarly for their industry.

---

## For Plugin Developers

The document tool market is massive and fragmented. Every industry needs specialized document workflows, but nobody has a platform to build and sell them on.

OpenDesk gives you:
- **Distribution** — access to every Google Docs / Word user who installs the extension
- **Infrastructure** — editor integration, AI routing, UI framework — all handled
- **Revenue** — 70% of every subscription sale, paid monthly
- **Simplicity** — build a plugin in a weekend, publish in minutes

```bash
npx create-opendesk-plugin my-plugin
cd my-plugin
npm run dev     # Hot reload in Chrome
npm run publish # List on marketplace
```

---

## License

Extension core: **AGPL-3.0**
Plugins: Licensed individually by creators

---

<p align="center">
  <strong>Don't replace the editor. Upgrade it.</strong>
  <br/>
  <em>One extension. Any LLM. Infinite plugins.</em>
</p>
