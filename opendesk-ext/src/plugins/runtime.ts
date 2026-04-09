/**
 * PluginEngineImpl — Adapted for Chrome extension.
 * Replaces TipTap Editor dependency with EditorAdapter.
 */

import mitt, { type Emitter } from "mitt";
import type { EditorAdapter } from "../content-scripts/adapters/types";
import type { ExtensionAIProvider } from "../ai/ext-provider";

// ─── Config Types (subset of the full plugin types) ─────

export interface AIPipelineConfig {
  id: string;
  label: string;
  icon: string;
  description?: string;
  process: (text: string, ai: any, context: any) => Promise<string>;
  showInSidebar?: boolean;
  showInContextMenu?: boolean;
}

export interface SidebarPanelConfig {
  id: string;
  title: string;
  icon: string;
  component: any;
  width?: number;
}

export interface SlashCommandConfig {
  name: string;
  label: string;
  description: string;
  icon: string;
  action: (context: any) => void | Promise<void>;
  keywords?: string[];
}

export interface KeyboardShortcutConfig {
  keys: string;
  description: string;
  action: (context: any) => void;
}

export interface OpenDeskPlugin {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  icon?: string;
  setup(engine: PluginEngineImpl): void | Promise<void>;
  teardown?(): void | Promise<void>;
}

// ─── Engine Implementation ──────────────────────────────

type Events = Record<string, unknown>;

export class PluginEngineImpl {
  // Registries
  private _aiPipelines: AIPipelineConfig[] = [];
  private _sidebarPanels: SidebarPanelConfig[] = [];
  private _slashCommands: SlashCommandConfig[] = [];
  private _keyboardShortcuts: KeyboardShortcutConfig[] = [];

  // Event system
  private _eventBus: Emitter<Events> = mitt<Events>();

  // Dependencies
  ai: ExtensionAIProvider;
  private _adapterRef: () => EditorAdapter | null;

  constructor(aiProvider: ExtensionAIProvider, adapterRef: () => EditorAdapter | null) {
    this.ai = aiProvider;
    this._adapterRef = adapterRef;
  }

  // ─── Registration methods ─────────────────────────────

  registerAIPipeline(pipeline: AIPipelineConfig): void {
    this._aiPipelines.push(pipeline);
  }

  registerSidebarPanel(panel: SidebarPanelConfig): void {
    this._sidebarPanels.push(panel);
  }

  registerSlashCommand(command: SlashCommandConfig): void {
    this._slashCommands.push(command);
  }

  registerKeyboardShortcut(shortcut: KeyboardShortcutConfig): void {
    this._keyboardShortcuts.push(shortcut);
  }

  // ─── Context accessors ────────────────────────────────

  getDocument() {
    const adapter = this._adapterRef();
    if (!adapter) throw new Error("Adapter not initialized");

    const text = adapter.getDocumentText();
    return {
      id: adapter.getDocumentId(),
      title: adapter.getDocumentTitle(),
      getText: () => text,
      getMarkdown: () => text,
      getJSON: () => ({ type: "doc", content: [{ type: "text", text }] }),
      metadata: {},
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  }

  getSelection() {
    const adapter = this._adapterRef();
    if (!adapter) throw new Error("Adapter not initialized");
    const sel = adapter.getSelection();
    return { text: sel.text, from: 0, to: sel.text.length, isEmpty: sel.isEmpty };
  }

  // ─── Plugin-to-plugin communication ───────────────────

  emit(event: string, data: unknown): void {
    this._eventBus.emit(event, data);
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    this._eventBus.on(event, callback);
    return () => this._eventBus.off(event, callback);
  }

  // ─── Registry getters ─────────────────────────────────

  get aiPipelines(): readonly AIPipelineConfig[] {
    return this._aiPipelines;
  }
  get sidebarPanels(): readonly SidebarPanelConfig[] {
    return this._sidebarPanels;
  }
  get slashCommands(): readonly SlashCommandConfig[] {
    return this._slashCommands;
  }
  get keyboardShortcuts(): readonly KeyboardShortcutConfig[] {
    return this._keyboardShortcuts;
  }

  removeRegistrationsByPlugin(_pluginName: string): void {
    // TODO: track registrations per plugin for clean unload
  }
}
