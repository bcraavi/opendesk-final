/**
 * AIProviderImpl — Implements the AIProvider interface.
 * Routes requests to the appropriate adapter based on the user's configuration.
 */

import type { AIProvider, AICompletionParams } from "../plugins/types.js";
import { AnthropicAdapter } from "./adapters/anthropic.js";
import { OpenAIAdapter } from "./adapters/openai.js";
import { GeminiAdapter } from "./adapters/gemini.js";
import { OllamaAdapter } from "./adapters/ollama.js";
import { DemoAdapter } from "./adapters/demo.js";

export type AIProviderName = "anthropic" | "openai" | "gemini" | "ollama" | "custom";

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIAdapter {
  complete(params: AICompletionParams): Promise<string>;
}

export class AIProviderImpl implements AIProvider {
  private _config: AIProviderConfig;
  private _adapter: AIAdapter;

  constructor(config?: Partial<AIProviderConfig>) {
    this._config = {
      provider: config?.provider || "anthropic",
      apiKey: config?.apiKey,
      model: config?.model,
      baseUrl: config?.baseUrl,
    };
    this._adapter = this._createAdapter();
  }

  private _createAdapter(): AIAdapter {
    if (!this.isConfigured()) {
      return new DemoAdapter();
    }

    switch (this._config.provider) {
      case "anthropic":
        return new AnthropicAdapter(this._config);
      case "openai":
      case "custom":
        return new OpenAIAdapter(this._config);
      case "gemini":
        return new GeminiAdapter(this._config);
      case "ollama":
        return new OllamaAdapter(this._config);
      default:
        return new DemoAdapter();
    }
  }

  async complete(params: AICompletionParams): Promise<string> {
    return this._adapter.complete(params);
  }

  isConfigured(): boolean {
    if (this._config.provider === "ollama") return true;
    return !!this._config.apiKey;
  }

  getProvider(): { name: string; model: string } {
    return {
      name: this._config.provider,
      model: this._config.model || "default",
    };
  }

  updateConfig(config: Partial<AIProviderConfig>): void {
    this._config = { ...this._config, ...config };
    this._adapter = this._createAdapter();
  }

  getConfig(): Readonly<AIProviderConfig> {
    return { ...this._config };
  }
}
