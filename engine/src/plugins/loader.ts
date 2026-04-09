/**
 * Plugin Loader — Manages plugin lifecycle (load, unload, list).
 */

import type { OpenDeskPlugin } from "./types.js";
import type { PluginEngineImpl } from "./runtime.js";

interface LoadedPlugin {
  plugin: OpenDeskPlugin;
  loadedAt: number;
}

export class PluginLoader {
  private _loaded: Map<string, LoadedPlugin> = new Map();
  private _engine: PluginEngineImpl;

  constructor(engine: PluginEngineImpl) {
    this._engine = engine;
  }

  async loadPlugin(plugin: OpenDeskPlugin): Promise<void> {
    if (this._loaded.has(plugin.name)) {
      console.warn(`[OpenDesk] Plugin "${plugin.name}" is already loaded. Skipping.`);
      return;
    }

    try {
      await plugin.setup(this._engine);
      this._loaded.set(plugin.name, { plugin, loadedAt: Date.now() });
      console.log(`[OpenDesk] Loaded plugin: ${plugin.displayName || plugin.name} v${plugin.version}`);
    } catch (e) {
      console.error(`[OpenDesk] Failed to load plugin "${plugin.name}":`, e);
      throw e;
    }
  }

  async loadPlugins(plugins: OpenDeskPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.loadPlugin(plugin);
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    const entry = this._loaded.get(name);
    if (!entry) {
      console.warn(`[OpenDesk] Plugin "${name}" is not loaded.`);
      return;
    }

    try {
      if (entry.plugin.teardown) {
        await entry.plugin.teardown();
      }
      this._engine.removeRegistrationsByPlugin(name);
      this._loaded.delete(name);
      console.log(`[OpenDesk] Unloaded plugin: ${name}`);
    } catch (e) {
      console.error(`[OpenDesk] Error unloading plugin "${name}":`, e);
    }
  }

  getLoadedPlugins(): OpenDeskPlugin[] {
    return Array.from(this._loaded.values()).map((e) => e.plugin);
  }

  isLoaded(name: string): boolean {
    return this._loaded.has(name);
  }
}
