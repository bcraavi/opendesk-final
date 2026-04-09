// ─── Message Protocol (side panel / content script ↔ background) ──

export type CSMessage =
  | { type: "AI_COMPLETE"; payload: AICompletePayload }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; payload: ExtensionSettings };

export type BGResponse =
  | { type: "AI_RESULT"; payload: string }
  | { type: "AI_ERROR"; payload: string }
  | { type: "SETTINGS"; payload: ExtensionSettings }
  | { type: "SETTINGS_SAVED" };

export interface AICompletePayload {
  system?: string;
  prompt: string;
  maxTokens?: number;
}

// ─── Content Script Messages (side panel ↔ content script) ──

export type ContentScriptMessage =
  | { type: "GET_SELECTION" }
  | { type: "GET_DOCUMENT_TEXT" }
  | { type: "GET_DOCUMENT_INFO" }
  | { type: "INSERT_TEXT"; payload: string }
  | { type: "REPLACE_SELECTION"; payload: string }
  | { type: "PING" };

export type ContentScriptResponse =
  | { type: "SELECTION"; payload: { text: string; isEmpty: boolean } }
  | { type: "DOCUMENT_TEXT"; payload: string }
  | { type: "DOCUMENT_INFO"; payload: { id: string; title: string } }
  | { type: "INSERT_DONE" }
  | { type: "REPLACE_DONE" }
  | { type: "PONG"; payload: { editor: string } }
  | { type: "ERROR"; payload: string };

// ─── Settings ───────────────────────────────────────────

export interface ExtensionSettings {
  provider: "anthropic" | "openai" | "gemini" | "ollama" | "custom";
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: "anthropic",
  apiKey: "",
  model: "claude-sonnet-4-20250514",
};

// ─── Provider Models ────────────────────────────────────

export const PROVIDER_MODELS: Record<string, { label: string; models: { id: string; label: string }[] }> = {
  anthropic: {
    label: "Anthropic",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-haiku-4-20250414", label: "Claude Haiku 4" },
    ],
  },
  openai: {
    label: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
  },
  gemini: {
    label: "Google Gemini",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
  },
  ollama: {
    label: "Ollama (Local)",
    models: [
      { id: "llama3.2", label: "Llama 3.2" },
      { id: "mistral", label: "Mistral" },
    ],
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    models: [
      { id: "custom", label: "Custom Model" },
    ],
  },
};
