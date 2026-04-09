import type { AICompletionParams } from "../../plugins/types.js";
import type { AIAdapter, AIProviderConfig } from "../provider.js";

export class AnthropicAdapter implements AIAdapter {
  constructor(private config: AIProviderConfig) {}

  async complete(params: AICompletionParams): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.config.model || "claude-sonnet-4-20250514",
        max_tokens: params.maxTokens || 2000,
        system: params.system,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }
}
