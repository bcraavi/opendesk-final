import type { AIAdapter, AIProviderConfig } from "../provider";

export class AnthropicAdapter implements AIAdapter {
  constructor(private config: AIProviderConfig) {}

  async complete(params: { system?: string; prompt: string; maxTokens?: number }): Promise<string> {
    const body = {
      model: this.config.model || "claude-sonnet-4-20250514",
      max_tokens: params.maxTokens || 2000,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    };

    console.log(`[OpenDesk] Anthropic request: model=${body.model}, max_tokens=${body.max_tokens}`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });

    console.log(`[OpenDesk] Anthropic response status: ${response.status}`);

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error(`[OpenDesk] Anthropic error:`, data);
      throw new Error(errMsg);
    }

    return data.content[0].text;
  }
}
