import { AnthropicAdapter } from "./adapters/anthropic";
import { OpenAIAdapter } from "./adapters/openai";
import { DemoAdapter } from "./adapters/demo";

export type AIProviderName = "anthropic" | "openai" | "gemini" | "ollama" | "custom";

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIAdapter {
  complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string>;
}

export class AIProviderImpl {
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
        // Reuse OpenAI adapter for Gemini's OpenAI-compatible endpoint
        return new OpenAIAdapter({
          ...this._config,
          baseUrl: this._config.baseUrl || "https://generativelanguage.googleapis.com",
        });
      case "ollama":
        return new OpenAIAdapter({
          ...this._config,
          baseUrl: this._config.baseUrl || "http://localhost:11434",
        });
      default:
        return new DemoAdapter();
    }
  }

  async complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string> {
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
}
