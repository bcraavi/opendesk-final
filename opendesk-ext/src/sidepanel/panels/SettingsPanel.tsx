import { useState, useEffect } from "react";
import {
  DEFAULT_SETTINGS,
  PROVIDER_MODELS,
  type ExtensionSettings,
} from "../../shared/types";

interface SettingsPanelProps {
  settings: ExtensionSettings | null;
  onSave: (settings: ExtensionSettings) => void;
}

export function SettingsPanel({ settings: initialSettings, onSave }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ExtensionSettings>(
    initialSettings || DEFAULT_SETTINGS
  );
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (initialSettings) setSettings(initialSettings);
  }, [initialSettings]);

  const providerConfig = PROVIDER_MODELS[settings.provider];
  const showBaseUrl = settings.provider === "ollama" || settings.provider === "custom";
  const showApiKey = settings.provider !== "ollama";

  function updateField<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) {
    const updated = { ...settings, [key]: value };
    if (key === "provider") {
      const newProvider = PROVIDER_MODELS[value as string];
      if (newProvider?.models[0]) {
        updated.model = newProvider.models[0].id;
      }
    }
    setSettings(updated);
    setStatus(null);
  }

  function handleSave() {
    chrome.runtime.sendMessage(
      { type: "SAVE_SETTINGS", payload: settings },
      () => {
        onSave(settings);
        setStatus({ type: "success", message: "Settings saved" });
        setTimeout(() => setStatus(null), 3000);
      }
    );
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);

    try {
      const response = await new Promise<{ type: string; payload: string }>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "AI_COMPLETE",
            payload: { prompt: "Say 'OpenDesk connected!' in exactly those words.", maxTokens: 20 },
          },
          (res) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(res);
          }
        );
      });

      if (response.type === "AI_ERROR") {
        setStatus({ type: "error", message: response.payload });
      } else {
        setStatus({ type: "success", message: `Connected! Response: "${response.payload.slice(0, 50)}"` });
      }
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="panel-content">
      <div className="settings-group">
        <label className="settings-label">AI Provider</label>
        <select
          className="settings-select"
          value={settings.provider}
          onChange={(e) => updateField("provider", e.target.value as ExtensionSettings["provider"])}
        >
          {Object.entries(PROVIDER_MODELS).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {showApiKey && (
        <div className="settings-group">
          <label className="settings-label">API Key</label>
          <input
            className="settings-input"
            type="password"
            placeholder={`Enter your ${providerConfig?.label || ""} API key`}
            value={settings.apiKey}
            onChange={(e) => updateField("apiKey", e.target.value)}
          />
          <div className="settings-hint">Stored locally. Never sent to our servers.</div>
        </div>
      )}

      <div className="settings-group">
        <label className="settings-label">Model</label>
        <select
          className="settings-select"
          value={settings.model}
          onChange={(e) => updateField("model", e.target.value)}
        >
          {providerConfig?.models.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {showBaseUrl && (
        <div className="settings-group">
          <label className="settings-label">Base URL</label>
          <input
            className="settings-input"
            type="text"
            placeholder={settings.provider === "ollama" ? "http://localhost:11434" : "https://your-api.com"}
            value={settings.baseUrl || ""}
            onChange={(e) => updateField("baseUrl", e.target.value)}
          />
        </div>
      )}

      <button className="settings-btn settings-btn-primary" onClick={handleSave}>
        Save Settings
      </button>

      <button
        className="settings-btn settings-btn-secondary"
        onClick={handleTest}
        disabled={testing}
      >
        {testing ? "Testing..." : "Test Connection"}
      </button>

      {status && (
        <div className={`settings-status ${status.type}`}>{status.message}</div>
      )}
    </div>
  );
}
