import type { AICompletionParams } from "../../plugins/types.js";
import type { AIAdapter, AIProviderConfig } from "../provider.js";

export class OpenAIAdapter implements AIAdapter {
  constructor(private config: AIProviderConfig) {}

  async complete(params: AICompletionParams): Promise<string> {
    const baseUrl = (this.config.baseUrl || "https://api.openai.com").replace(/\/+$/, "");
    const url = `${baseUrl}/v1/chat/completions`;

    const messages: Array<{ role: string; content: string }> = [];
    if (params.system) {
      messages.push({ role: "system", content: params.system });
    }
    messages.push({ role: "user", content: params.prompt });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o",
        messages,
        max_tokens: params.maxTokens || 2000,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }
}
