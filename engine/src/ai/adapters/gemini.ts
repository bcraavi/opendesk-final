import type { AICompletionParams } from "../../plugins/types.js";
import type { AIAdapter, AIProviderConfig } from "../provider.js";

export class GeminiAdapter implements AIAdapter {
  constructor(private config: AIProviderConfig) {}

  async complete(params: AICompletionParams): Promise<string> {
    const model = this.config.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

    const prompt = params.system
      ? `${params.system}\n\n${params.prompt}`
      : params.prompt;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: params.maxTokens || 2000 },
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  }
}
