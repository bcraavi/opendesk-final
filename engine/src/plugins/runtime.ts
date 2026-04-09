/**
 * PluginEngineImpl — The concrete implementation of the PluginEngine interface.
 *
 * Plugins call register*() methods during setup(). The engine collects all
 * registrations and exposes them to the editor during Phase 2 initialization.
 */

import type { Editor } from "@tiptap/core";
import mitt, { type Emitter } from "mitt";
import type {
  PluginEngine,
  BlockTypeConfig,
  SidebarPanelConfig,
  SlashCommandConfig,
  ToolbarItemConfig,
  AIPipelineConfig,
  ExportFormatConfig,
  ImportParserConfig,
  KeyboardShortcutConfig,
  WebhookConfig,
  DocumentContext,
  SelectionContext,
  AIProvider,
} from "./types.js";
import { buildDocumentContext, buildSelectionContext } from "../core/context.js";

type Events = Record<string, unknown>;

export class PluginEngineImpl implements PluginEngine {
  // ─── Registries ──────────────────────────────────────
  private _blockTypes: BlockTypeConfig[] = [];
  private _sidebarPanels: SidebarPanelConfig[] = [];
  private _slashCommands: SlashCommandConfig[] = [];
  private _toolbarItems: ToolbarItemConfig[] = [];
  private _aiPipelines: AIPipelineConfig[] = [];
  private _exportFormats: ExportFormatConfig[] = [];
  private _importParsers: ImportParserConfig[] = [];
  private _keyboardShortcuts: KeyboardShortcutConfig[] = [];
  private _webhooks: WebhookConfig[] = [];

  // ─── Event listeners ────────────────────────────────
  private _docChangeCallbacks: Array<(doc: DocumentContext) => void> = [];
  private _selChangeCallbacks: Array<(sel: SelectionContext) => void> = [];
  private _eventBus: Emitter<Events> = mitt<Events>();

  // ─── Dependencies ───────────────────────────────────
  ai: AIProvider;
  private _editorRef: () => Editor | null;

  // ─── Document metadata (set by app layer) ───────────
  private _docId = "";
  private _docTitle = "";
  private _docMetadata: Record<string, unknown> = {};

  // ─── Panel open callback (set by UI) ────────────────
  private _openPanelCallback: ((panelId: string) => void) | null = null;

  constructor(aiProvider: AIProvider) {
    this.ai = aiProvider;
    this._editorRef = () => null;
  }

  // ─── Called by OpenDeskEditor after Phase 2 ─────────
  setEditorRef(ref: () => Editor | null): void {
    this._editorRef = ref;
  }

  setDocumentInfo(id: string, title: string, metadata?: Record<string, unknown>): void {
    this._docId = id;
    this._docTitle = title;
    if (metadata) this._docMetadata = metadata;
  }

  setOpenPanelCallback(cb: (panelId: string) => void): void {
    this._openPanelCallback = cb;
  }

  // ─── Registration methods (Phase 1) ─────────────────

  registerBlockType(config: BlockTypeConfig): void {
    this._blockTypes.push(config);
    if (config.slashCommand) {
      this.registerSlashCommand({
        name: config.slashCommand.replace(/^\//, ""),
        label: config.label,
        description: `Insert ${config.label}`,
        icon: config.icon,
        action: (ctx) => ctx.insertBlock(config.name, config.defaultAttrs),
      });
    }
  }

  registerSidebarPanel(panel: SidebarPanelConfig): void {
    this._sidebarPanels.push(panel);
  }

  registerSlashCommand(command: SlashCommandConfig): void {
    this._slashCommands.push(command);
  }

  registerToolbarItem(item: ToolbarItemConfig): void {
    this._toolbarItems.push(item);
  }

  registerAIPipeline(pipeline: AIPipelineConfig): void {
    this._aiPipelines.push(pipeline);
  }

  registerExportFormat(format: ExportFormatConfig): void {
    this._exportFormats.push(format);
  }

  registerImportParser(parser: ImportParserConfig): void {
    this._importParsers.push(parser);
  }

  registerKeyboardShortcut(shortcut: KeyboardShortcutConfig): void {
    this._keyboardShortcuts.push(shortcut);
  }

  registerWebhook(config: WebhookConfig): void {
    this._webhooks.push(config);
  }

  // ─── Document/Selection listeners ───────────────────

  onDocumentChange(callback: (doc: DocumentContext) => void): () => void {
    this._docChangeCallbacks.push(callback);
    return () => {
      this._docChangeCallbacks = this._docChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  onSelectionChange(callback: (sel: SelectionContext) => void): () => void {
    this._selChangeCallbacks.push(callback);
    return () => {
      this._selChangeCallbacks = this._selChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ─── Context accessors (Phase 2 — after editor exists) ──

  getDocument(): DocumentContext {
    const editor = this._editorRef();
    if (!editor) {
      throw new Error("Editor not initialized. getDocument() is only available after initialization.");
    }
    return buildDocumentContext(editor, this._docId, this._docTitle, this._docMetadata);
  }

  getSelection(): SelectionContext {
    const editor = this._editorRef();
    if (!editor) {
      throw new Error("Editor not initialized. getSelection() is only available after initialization.");
    }
    return buildSelectionContext(editor);
  }

  // ─── Plugin-to-plugin communication ─────────────────

  emit(event: string, data: unknown): void {
    this._eventBus.emit(event, data);
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    this._eventBus.on(event, callback);
    return () => this._eventBus.off(event, callback);
  }

  // ─── Internal: called by bridge extension ───────────

  notifyDocumentChange(): void {
    const editor = this._editorRef();
    if (!editor) return;
    const doc = buildDocumentContext(editor, this._docId, this._docTitle, this._docMetadata);
    for (const cb of this._docChangeCallbacks) {
      try {
        cb(doc);
      } catch (e) {
        console.error("[OpenDesk] Plugin document change callback error:", e);
      }
    }
  }

  notifySelectionChange(): void {
    const editor = this._editorRef();
    if (!editor) return;
    const sel = buildSelectionContext(editor);
    for (const cb of this._selChangeCallbacks) {
      try {
        cb(sel);
      } catch (e) {
        console.error("[OpenDesk] Plugin selection change callback error:", e);
      }
    }
  }

  // ─── Internal: open panel helper ────────────────────

  openPanel(panelId: string): void {
    if (this._openPanelCallback) {
      this._openPanelCallback(panelId);
    }
  }

  // ─── Registry getters (used by editor in Phase 2) ───

  get blockTypes(): readonly BlockTypeConfig[] {
    return this._blockTypes;
  }
  get sidebarPanels(): readonly SidebarPanelConfig[] {
    return this._sidebarPanels;
  }
  get slashCommands(): readonly SlashCommandConfig[] {
    return this._slashCommands;
  }
  get toolbarItems(): readonly ToolbarItemConfig[] {
    return this._toolbarItems;
  }
  get aiPipelines(): readonly AIPipelineConfig[] {
    return this._aiPipelines;
  }
  get exportFormats(): readonly ExportFormatConfig[] {
    return this._exportFormats;
  }
  get importParsers(): readonly ImportParserConfig[] {
    return this._importParsers;
  }
  get keyboardShortcuts(): readonly KeyboardShortcutConfig[] {
    return this._keyboardShortcuts;
  }
  get webhooks(): readonly WebhookConfig[] {
    return this._webhooks;
  }

  // ─── Removal (used by plugin unload) ────────────────

  removeRegistrationsByPlugin(pluginName: string): void {
    // Block types and slash commands include the plugin name in their IDs
    // For now, we can't easily track which plugin registered what.
    // This will be enhanced when we add plugin metadata tracking.
  }
}
