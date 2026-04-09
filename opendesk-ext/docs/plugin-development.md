# Building OpenDesk Plugins

## Quick Start

```bash
npx create-opendesk-plugin my-plugin
cd my-plugin
npm run dev
```

## Plugin Structure

A plugin is a single file (or package) that exports an `OpenDeskPlugin` object:

```typescript
import type { OpenDeskPlugin } from "@opendesk/plugin-api";

const plugin: OpenDeskPlugin = {
  name: "my-plugin",        // Unique ID (kebab-case)
  version: "1.0.0",         // Semver
  displayName: "My Plugin", // Shown in UI
  description: "What it does",
  icon: "🔥",
  author: "Your Name",

  setup(engine) {
    // Register your hooks here
    // engine.registerBlockType(...)
    // engine.registerSidebarPanel(...)
    // engine.registerSlashCommand(...)
    // engine.registerAIPipeline(...)
  },

  teardown() {
    // Cleanup (optional)
  },
};

export default plugin;
```

## Available Hooks

### registerBlockType — Custom Blocks

Add new types of content blocks to the editor:

```typescript
engine.registerBlockType({
  name: "poll",
  label: "Poll",
  icon: "📊",
  slashCommand: "/poll",
  defaultAttrs: { question: "", options: ["Yes", "No"] },
  render: PollBlock, // Your React component
  editable: false,
});
```

### registerSidebarPanel — Sidebar Panels

Add a panel to the right sidebar:

```typescript
engine.registerSidebarPanel({
  id: "my-panel",
  title: "My Tool",
  icon: "🔧",
  width: 280,
  component: MyPanelComponent,
});
```

Your component receives these props:
- `document` — current document (getText, getMarkdown, getJSON, wordCount)
- `selection` — current selection (text, from, to, isEmpty)
- `ai` — call the user's LLM
- `insertText(text)` — insert at cursor
- `replaceSelection(text)` — replace selected text

### registerSlashCommand — Slash Commands

```typescript
engine.registerSlashCommand({
  name: "chart",
  label: "Insert Chart",
  description: "Create a chart from data",
  icon: "📈",
  keywords: ["chart", "graph", "data", "visualization"],
  action: async (ctx) => {
    ctx.insertBlock("chart", { type: "bar", data: [] });
  },
});
```

### registerAIPipeline — Custom AI Actions

The most powerful hook. Lets you create specialized AI workflows using the user's own LLM:

```typescript
engine.registerAIPipeline({
  id: "seo-score",
  label: "SEO Score",
  icon: "📊",
  showInSidebar: true,
  showInContextMenu: true,
  process: async (text, ai, doc) => {
    return ai.complete({
      system: "You are an SEO expert. Score this content 1-100 and give specific improvement suggestions.",
      prompt: text,
    });
  },
});
```

`ai.complete()` calls whatever LLM the user has configured (Claude, GPT, Gemini, Ollama, etc.). You never handle API keys — the engine manages that.

### registerExportFormat — Custom Exports

```typescript
engine.registerExportFormat({
  id: "latex",
  label: "LaTeX",
  extension: "tex",
  mimeType: "text/x-latex",
  icon: "📐",
  convert: async (doc) => {
    const md = doc.getMarkdown();
    const latex = convertMarkdownToLatex(md); // Your logic
    return new Blob([latex], { type: "text/x-latex" });
  },
});
```

### registerToolbarItem — Toolbar Buttons

```typescript
engine.registerToolbarItem({
  id: "word-count",
  icon: "📊",
  tooltip: "Word count",
  position: "right",
  render: (doc) => `${doc.wordCount} words`,
});
```

### registerKeyboardShortcut — Shortcuts

```typescript
engine.registerKeyboardShortcut({
  keys: "Ctrl+Shift+S",
  description: "Run SEO analysis",
  action: (doc) => { /* your logic */ },
});
```

## Using the AI Provider

Every plugin has access to the user's configured LLM via `engine.ai`:

```typescript
// Simple completion
const result = await engine.ai.complete({
  prompt: "Summarize this: " + text,
});

// With system prompt
const result = await engine.ai.complete({
  system: "You are a medical terminology expert.",
  prompt: `Define: ${term}`,
  maxTokens: 500,
});

// Check if AI is configured
if (engine.ai.isConfigured()) {
  // AI is available
} else {
  // Show message asking user to configure LLM in settings
}
```

## Plugin-to-Plugin Communication

Plugins can communicate via events:

```typescript
// Plugin A emits an event
engine.emit("clause-reviewed", { clauseId: "123", risk: "high" });

// Plugin B listens
engine.on("clause-reviewed", (data) => {
  console.log(`Clause ${data.clauseId} flagged as ${data.risk}`);
});
```

## Publishing to Marketplace

```bash
# Login to marketplace
npx opendesk login

# Validate plugin
npx opendesk validate

# Publish
npx opendesk publish

# Set pricing (optional — free by default)
npx opendesk set-price 9.99/month
```

### Revenue Split
- **Free plugins**: No charge, great for community building
- **Paid plugins**: You keep 70%, platform keeps 30%
- Payouts are monthly via Stripe

## Security & Sandboxing

Plugins run in a sandboxed environment:
- No direct DOM access outside their registered UI areas
- No access to other users' data
- Network requests go through the engine's proxy (logged, rate-limited)
- File system access only through the engine's storage API
- Can be audited before marketplace listing

## Examples

See the `plugins/` directory for complete examples:
- `reading-time/` — Simple toolbar plugin
- `ai-writing-assistant/` — AI pipelines + sidebar + shortcuts
- `legal-contract-review/` — Full vertical plugin with custom blocks, AI, export
