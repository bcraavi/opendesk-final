/**
 * ExtensionAIProvider — Content-script-side AI provider.
 * Routes all AI calls through chrome.runtime.sendMessage to the background service worker.
 */

import type { ExtensionSettings } from "../shared/types";

export interface AIProvider {
  complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string>;
  isConfigured(): boolean;
  getProvider(): { name: string; model: string };
}

export class ExtensionAIProvider implements AIProvider {
  private _settings: ExtensionSettings | null = null;

  setSettings(settings: ExtensionSettings) {
    this._settings = settings;
  }

  async complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "AI_COMPLETE", payload: params },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.type === "AI_ERROR") {
            reject(new Error(response.payload));
            return;
          }
          resolve(response?.payload || "");
        }
      );
    });
  }

  isConfigured(): boolean {
    if (!this._settings) return false;
    if (this._settings.provider === "ollama") return true;
    return !!this._settings.apiKey;
  }

  getProvider(): { name: string; model: string } {
    return {
      name: this._settings?.provider || "none",
      model: this._settings?.model || "none",
    };
  }
}
