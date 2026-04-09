/**
 * @opendesk/engine — The open-source document engine.
 *
 * Core engine exports (platform-agnostic where possible).
 * For React components, import from "@opendesk/engine/react".
 */

// ─── Core ─────────────────────────────────────────────────
export { OpenDeskEditor, type OpenDeskConfig } from "./core/editor.js";
export {
  buildDocumentContext,
  buildSelectionContext,
  buildCommandContext,
  buildToolbarContext,
} from "./core/context.js";
export {
  getBaseExtensions,
  createBlockExtension,
  createSlashCommandExtension,
  createKeyboardShortcutExtension,
  createBridgeExtension,
  setSlashMenuCallbacks,
} from "./core/extensions.js";

// ─── Plugin System ────────────────────────────────────────
export type {
  OpenDeskPlugin,
  PluginEngine,
  BlockTypeConfig,
  BlockProps,
  SidebarPanelConfig,
  SidebarPanelProps,
  SlashCommandConfig,
  CommandContext,
  ToolbarItemConfig,
  ToolbarContext,
  AIPipelineConfig,
  AIProvider,
  AICompletionParams,
  ExportFormatConfig,
  ImportParserConfig,
  KeyboardShortcutConfig,
  WebhookConfig,
  DocumentContext,
  SelectionContext,
} from "./plugins/types.js";
export { PluginEngineImpl } from "./plugins/runtime.js";
export { PluginLoader } from "./plugins/loader.js";

// ─── AI ───────────────────────────────────────────────────
export {
  AIProviderImpl,
  type AIProviderConfig,
  type AIProviderName,
  type AIAdapter,
} from "./ai/provider.js";
export { AnthropicAdapter } from "./ai/adapters/anthropic.js";
export { OpenAIAdapter } from "./ai/adapters/openai.js";
export { GeminiAdapter } from "./ai/adapters/gemini.js";
export { OllamaAdapter } from "./ai/adapters/ollama.js";
export { DemoAdapter } from "./ai/adapters/demo.js";

// ─── Storage ──────────────────────────────────────────────
export type { StorageAdapter, StorageDocument } from "./storage/types.js";
export { FileSystemAdapter } from "./storage/filesystem.js";
export { BrowserStorageAdapter } from "./storage/browser.js";

// ─── React UI (re-exported for convenience) ───────────────
export {
  OpenDeskProvider,
  useOpenDesk,
  useEditor,
  usePluginEngine,
  useAI,
  OpenDeskEditorView,
  OpenDeskToolbar,
  OpenDeskSidebar,
  SlashMenu,
} from "./ui/index.js";
