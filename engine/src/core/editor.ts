/**
 * OpenDeskEditor — Main entry point for the engine.
 *
 * Usage:
 *   const opendesk = new OpenDeskEditor({ ai: { provider: 'anthropic', apiKey: '...' } });
 *   await opendesk.loadPlugins([readingTime, aiAssistant, legalReview]);
 *   const editor = opendesk.initialize();
 */

import { Editor, type Extensions } from "@tiptap/core";
import type { OpenDeskPlugin } from "../plugins/types.js";
import { PluginEngineImpl } from "../plugins/runtime.js";
import { PluginLoader } from "../plugins/loader.js";
import { AIProviderImpl, type AIProviderConfig } from "../ai/provider.js";
import {
  getBaseExtensions,
  createBlockExtension,
  createSlashCommandExtension,
  createKeyboardShortcutExtension,
  createBridgeExtension,
} from "./extensions.js";

export interface OpenDeskConfig {
  ai?: Partial<AIProviderConfig>;
  content?: string;
  placeholder?: string;
  editable?: boolean;
}

export class OpenDeskEditor {
  private _editor: Editor | null = null;
  private _pluginEngine: PluginEngineImpl;
  private _pluginLoader: PluginLoader;
  private _aiProvider: AIProviderImpl;
  private _config: OpenDeskConfig;

  constructor(config: OpenDeskConfig = {}) {
    this._config = config;
    this._aiProvider = new AIProviderImpl(config.ai);
    this._pluginEngine = new PluginEngineImpl(this._aiProvider);
    this._pluginLoader = new PluginLoader(this._pluginEngine);
  }

  /** Phase 1: Load all plugins. They register extensions but the editor isn't created yet. */
  async loadPlugins(plugins: OpenDeskPlugin[]): Promise<void> {
    await this._pluginLoader.loadPlugins(plugins);
  }

  /** Phase 2: Create the TipTap editor with all collected registrations. */
  initialize(): Editor {
    if (this._editor) {
      return this._editor;
    }

    const extensions: Extensions = [
      ...getBaseExtensions({ placeholder: this._config.placeholder }),
    ];

    // Add plugin-registered block types as TipTap nodes
    for (const blockType of this._pluginEngine.blockTypes) {
      extensions.push(createBlockExtension(blockType) as any);
    }

    // Add slash command extension (if any commands registered)
    if (this._pluginEngine.slashCommands.length > 0) {
      extensions.push(
        createSlashCommandExtension(this._pluginEngine.slashCommands) as any
      );
    }

    // Add keyboard shortcuts extension (if any registered)
    if (this._pluginEngine.keyboardShortcuts.length > 0) {
      extensions.push(
        createKeyboardShortcutExtension(this._pluginEngine.keyboardShortcuts) as any
      );
    }

    // Add bridge extension for document/selection change notifications
    extensions.push(createBridgeExtension(this._pluginEngine) as any);

    this._editor = new Editor({
      extensions,
      content: this._config.content || "",
      editable: this._config.editable !== false,
    });

    // Wire up the editor ref so the plugin engine can access it
    this._pluginEngine.setEditorRef(() => this._editor);

    return this._editor;
  }

  /** Get the TipTap editor instance (null before initialize()) */
  getEditor(): Editor | null {
    return this._editor;
  }

  /** Get the plugin engine (for UI components to read registries) */
  getPluginEngine(): PluginEngineImpl {
    return this._pluginEngine;
  }

  /** Get the AI provider (for UI components to configure LLM) */
  getAIProvider(): AIProviderImpl {
    return this._aiProvider;
  }

  /** Get the plugin loader */
  getPluginLoader(): PluginLoader {
    return this._pluginLoader;
  }

  /** Destroy the editor and clean up */
  destroy(): void {
    if (this._editor) {
      this._editor.destroy();
      this._editor = null;
    }
  }
}
