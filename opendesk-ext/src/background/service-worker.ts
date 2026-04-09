import { AIProviderImpl } from "../ai/provider";
import { DEFAULT_SETTINGS } from "../shared/types";
import type { ExtensionSettings } from "../shared/types";

let aiProvider: AIProviderImpl = new AIProviderImpl();

// ─── Open side panel when extension icon is clicked ─────

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ─── Initialize AI provider from stored settings ────────

chrome.storage.local.get(["settings"], (result) => {
  const settings: ExtensionSettings = result.settings || DEFAULT_SETTINGS;
  aiProvider = new AIProviderImpl({
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
    baseUrl: settings.baseUrl,
  });
  console.log(`[OpenDesk] AI provider initialized: ${settings.provider} / ${settings.model} (key: ${settings.apiKey ? "set" : "not set"})`);
});

// Re-initialize when settings change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue) {
    const s = changes.settings.newValue as ExtensionSettings;
    aiProvider = new AIProviderImpl({
      provider: s.provider,
      apiKey: s.apiKey,
      model: s.model,
      baseUrl: s.baseUrl,
    });
    console.log(`[OpenDesk] AI provider updated: ${s.provider} / ${s.model} (key: ${s.apiKey ? "set" : "not set"})`);
  }
});

// ─── Message handler ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log(`[OpenDesk] SW received message: ${message.type}`);

  if (message.type === "AI_COMPLETE") {
    const { system, prompt, maxTokens } = message.payload;
    console.log(`[OpenDesk] AI request — provider: ${aiProvider.getProvider().name}, model: ${aiProvider.getProvider().model}, configured: ${aiProvider.isConfigured()}`);
    console.log(`[OpenDesk] AI prompt preview: ${prompt.slice(0, 100)}...`);

    aiProvider
      .complete({ system, prompt, maxTokens })
      .then((result) => {
        console.log(`[OpenDesk] AI response received (${result.length} chars)`);
        sendResponse({ type: "AI_RESULT", payload: result });
      })
      .catch((error) => {
        console.error(`[OpenDesk] AI error:`, error);
        sendResponse({ type: "AI_ERROR", payload: error.message || String(error) });
      });
    return true; // Keep channel open for async
  }

  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get(["settings"], (result) => {
      console.log(`[OpenDesk] Returning settings: provider=${result.settings?.provider || "default"}`);
      sendResponse({ type: "SETTINGS", payload: result.settings || DEFAULT_SETTINGS });
    });
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    console.log(`[OpenDesk] Saving settings: provider=${message.payload.provider}, key=${message.payload.apiKey ? "set" : "not set"}`);
    chrome.storage.local.set({ settings: message.payload }, () => {
      sendResponse({ type: "SETTINGS_SAVED" });
    });
    return true;
  }
});

console.log("[OpenDesk] Service worker initialized");
