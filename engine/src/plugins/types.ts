/**
 * OpenDesk Plugin API — Type Definitions
 *
 * This is the contract between the core engine and plugins.
 * Plugin developers implement the OpenDeskPlugin interface.
 */

import type { ComponentType, ReactNode } from "react";

// ─── Core Types ──────────────────────────────────────────

export interface OpenDeskPlugin {
  /** Unique plugin identifier (e.g., "legal-clause-checker") */
  name: string;
  /** Semver version (e.g., "1.0.0") */
  version: string;
  /** Human-readable display name */
  displayName?: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin icon (emoji or URL) */
  icon?: string;
  /** Setup function — called when plugin is loaded */
  setup(engine: PluginEngine): void | Promise<void>;
  /** Teardown function — called when plugin is unloaded */
  teardown?(): void | Promise<void>;
}

// ─── Engine API (available to plugins) ───────────────────

export interface PluginEngine {
  /** Register a custom block type in the editor */
  registerBlockType(config: BlockTypeConfig): void;

  /** Register a sidebar panel */
  registerSidebarPanel(panel: SidebarPanelConfig): void;

  /** Register a slash command (triggered by typing /) */
  registerSlashCommand(command: SlashCommandConfig): void;

  /** Register a toolbar item (button or indicator) */
  registerToolbarItem(item: ToolbarItemConfig): void;

  /** Register a custom AI pipeline */
  registerAIPipeline(pipeline: AIPipelineConfig): void;

  /** Register a custom export format */
  registerExportFormat(format: ExportFormatConfig): void;

  /** Register a custom import parser */
  registerImportParser(parser: ImportParserConfig): void;

  /** Register a keyboard shortcut */
  registerKeyboardShortcut(shortcut: KeyboardShortcutConfig): void;

  /** Register a webhook/external integration */
  registerWebhook(config: WebhookConfig): void;

  /** Listen to document changes */
  onDocumentChange(
    callback: (doc: DocumentContext) => void
  ): () => void;

  /** Listen to selection changes */
  onSelectionChange(
    callback: (selection: SelectionContext) => void
  ): () => void;

  /** Get current document context */
  getDocument(): DocumentContext;

  /** Get current selection */
  getSelection(): SelectionContext;

  /** Access the user's configured AI provider */
  ai: AIProvider;

  /** Plugin-to-plugin communication */
  emit(event: string, data: unknown): void;
  on(event: string, callback: (data: unknown) => void): () => void;
}

// ─── Block Types ─────────────────────────────────────────

export interface BlockTypeConfig {
  /** Unique block type name */
  name: string;
  /** Display label */
  label: string;
  /** Icon (emoji or URL) */
  icon: string;
  /** React component to render the block */
  render: ComponentType<BlockProps> | null;
  /** Is the block content editable? */
  editable?: boolean;
  /** Default attributes when block is created */
  defaultAttrs?: Record<string, unknown>;
  /** Slash command to insert this block (e.g., "/chart") */
  slashCommand?: string;
}

export interface BlockProps {
  /** Block attributes */
  attrs: Record<string, unknown>;
  /** Update block attributes */
  updateAttrs: (attrs: Record<string, unknown>) => void;
  /** Block content (if editable) */
  content?: string;
  /** Is the block currently selected? */
  selected: boolean;
}

// ─── Sidebar Panels ──────────────────────────────────────

export interface SidebarPanelConfig {
  /** Unique panel ID */
  id: string;
  /** Panel title */
  title: string;
  /** Icon */
  icon: string;
  /** React component */
  component: ComponentType<SidebarPanelProps> | null;
  /** Default width in pixels */
  width?: number;
}

export interface SidebarPanelProps {
  /** Current document */
  document: DocumentContext;
  /** Current selection */
  selection: SelectionContext;
  /** AI provider */
  ai: AIProvider;
  /** Insert text at cursor */
  insertText: (text: string) => void;
  /** Replace selection */
  replaceSelection: (text: string) => void;
}

// ─── Slash Commands ──────────────────────────────────────

export interface SlashCommandConfig {
  /** Command trigger (without /) */
  name: string;
  /** Display label */
  label: string;
  /** Description shown in command menu */
  description: string;
  /** Icon */
  icon: string;
  /** What happens when command is selected */
  action: (context: CommandContext) => void | Promise<void>;
  /** Optional: filter/search keywords */
  keywords?: string[];
}

export interface CommandContext {
  /** Insert content at cursor */
  insertContent: (content: string) => void;
  /** Insert a custom block */
  insertBlock: (
    blockType: string,
    attrs?: Record<string, unknown>
  ) => void;
  /** Open a sidebar panel */
  openPanel: (panelId: string) => void;
  /** Current document */
  document: DocumentContext;
  /** AI provider */
  ai: AIProvider;
}

// ─── Toolbar Items ───────────────────────────────────────

export interface ToolbarItemConfig {
  /** Unique ID */
  id: string;
  /** Icon (emoji or React component) */
  icon: string | ComponentType;
  /** Tooltip text */
  tooltip: string;
  /** Click handler */
  onClick?: (context: ToolbarContext) => void;
  /** Render function for dynamic content (e.g., word count) */
  render?: (doc: DocumentContext) => string | ReactNode;
  /** Position: "left" | "center" | "right" */
  position?: "left" | "center" | "right";
}

// ─── AI Pipelines ────────────────────────────────────────

export interface AIPipelineConfig {
  /** Unique pipeline ID */
  id: string;
  /** Display label */
  label: string;
  /** Icon */
  icon: string;
  /** Description */
  description?: string;
  /** The AI processing function */
  process: (
    text: string,
    ai: AIProvider,
    context: DocumentContext
  ) => Promise<string>;
  /** Show in AI sidebar? */
  showInSidebar?: boolean;
  /** Show in context menu on text selection? */
  showInContextMenu?: boolean;
}

export interface AIProvider {
  /** Send a completion request to the user's configured LLM */
  complete(params: AICompletionParams): Promise<string>;
  /** Check if AI is configured */
  isConfigured(): boolean;
  /** Get provider info */
  getProvider(): { name: string; model: string };
}

export interface AICompletionParams {
  /** System prompt */
  system?: string;
  /** User prompt */
  prompt: string;
  /** Max tokens */
  maxTokens?: number;
}

// ─── Export & Import ─────────────────────────────────────

export interface ExportFormatConfig {
  /** Format ID */
  id: string;
  /** Display label (e.g., "PDF", "LaTeX") */
  label: string;
  /** File extension */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Icon */
  icon: string;
  /** Convert document to this format */
  convert: (doc: DocumentContext) => Promise<Blob | string>;
}

export interface ImportParserConfig {
  /** Parser ID */
  id: string;
  /** Supported file extensions */
  extensions: string[];
  /** Parse file to document content */
  parse: (file: File) => Promise<string>;
}

// ─── Keyboard Shortcuts ──────────────────────────────────

export interface KeyboardShortcutConfig {
  /** Key combo (e.g., "Ctrl+Shift+L") */
  keys: string;
  /** Description */
  description: string;
  /** Handler */
  action: (context: DocumentContext) => void;
}

// ─── Webhooks ────────────────────────────────────────────

export interface WebhookConfig {
  /** Webhook ID */
  id: string;
  /** Trigger event */
  trigger:
    | "document.save"
    | "document.change"
    | "ai.complete"
    | "custom";
  /** Endpoint URL */
  url: string;
  /** HTTP method */
  method?: "POST" | "PUT";
  /** Custom headers */
  headers?: Record<string, string>;
  /** Transform payload before sending */
  transform?: (data: unknown) => unknown;
}

// ─── Context Types ───────────────────────────────────────

export interface DocumentContext {
  /** Document ID */
  id: string;
  /** Document title */
  title: string;
  /** Full text content */
  getText(): string;
  /** Markdown content */
  getMarkdown(): string;
  /** JSON content (ProseMirror format) */
  getJSON(): unknown;
  /** Document metadata */
  metadata: Record<string, unknown>;
  /** Word count */
  wordCount: number;
}

export interface SelectionContext {
  /** Selected text */
  text: string;
  /** Selection start position */
  from: number;
  /** Selection end position */
  to: number;
  /** Is anything selected? */
  isEmpty: boolean;
}

export interface ToolbarContext {
  document: DocumentContext;
  selection: SelectionContext;
  ai: AIProvider;
  insertContent: (content: string) => void;
}
