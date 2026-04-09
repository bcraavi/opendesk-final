import type { AICompletionParams } from "../../plugins/types.js";
import type { AIAdapter, AIProviderConfig } from "../provider.js";

export class OllamaAdapter implements AIAdapter {
  constructor(private config: AIProviderConfig) {}

  async complete(params: AICompletionParams): Promise<string> {
    const baseUrl = (this.config.baseUrl || "http://localhost:11434").replace(/\/+$/, "");
    const url = `${baseUrl}/api/chat`;

    const messages: Array<{ role: string; content: string }> = [];
    if (params.system) {
      messages.push({ role: "system", content: params.system });
    }
    messages.push({ role: "user", content: params.prompt });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model || "llama3.1",
        messages,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.message.content;
  }
}
