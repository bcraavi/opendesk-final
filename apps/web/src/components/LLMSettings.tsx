"use client";

import { useState } from "react";
import { useAI } from "@opendesk/engine";
import type { AIProviderName } from "@opendesk/engine";

const PROVIDERS: {
  key: AIProviderName;
  name: string;
  icon: string;
  models: string[];
  defaultModel: string;
}[] = [
  {
    key: "anthropic",
    name: "Claude",
    icon: "🟤",
    models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20250929", "claude-opus-4-20250514"],
    defaultModel: "claude-sonnet-4-20250514",
  },
  {
    key: "openai",
    name: "OpenAI",
    icon: "🟢",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"],
    defaultModel: "gpt-4o",
  },
  {
    key: "gemini",
    name: "Gemini",
    icon: "🔵",
    models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro"],
    defaultModel: "gemini-2.0-flash",
  },
  {
    key: "ollama",
    name: "Ollama",
    icon: "🦙",
    models: ["llama3.1", "mistral", "phi3", "gemma2"],
    defaultModel: "llama3.1",
  },
];

export function LLMSettings({ onClose }: { onClose: () => void }) {
  const ai = useAI();
  const current = ai.getConfig();
  const [provider, setProvider] = useState<AIProviderName>(current.provider);
  const [apiKey, setApiKey] = useState(current.apiKey || "");
  const [model, setModel] = useState(current.model || "");
  const [baseUrl, setBaseUrl] = useState(current.baseUrl || "");

  const prov = PROVIDERS.find((p) => p.key === provider) || PROVIDERS[0];

  const handleSave = () => {
    ai.updateConfig({
      provider,
      apiKey: apiKey || undefined,
      model: model || prov.defaultModel,
      baseUrl: baseUrl || undefined,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(44,36,22,0.35)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "90%",
          maxWidth: 460,
          background: "var(--bg)",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(44,36,22,0.25)",
          padding: 28,
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
            LLM Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            x
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          API calls go <strong>directly from your browser</strong> to the
          provider. Your key never touches any server.
        </p>

        {/* Provider select */}
        <label style={fieldStyle}>
          <span style={labelStyle}>Provider</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setProvider(p.key);
                  setModel(p.defaultModel);
                  if (p.key === "ollama") setBaseUrl("http://localhost:11434");
                }}
                style={{
                  padding: 10,
                  border:
                    provider === p.key
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                  borderRadius: 10,
                  background:
                    provider === p.key ? "var(--accent-bg)" : "var(--white)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: provider === p.key ? 700 : 500,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text)",
                }}
              >
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </label>

        {/* API Key */}
        {provider !== "ollama" && (
          <label style={fieldStyle}>
            <span style={labelStyle}>API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Your ${prov.name} API key`}
              style={inputStyle}
            />
          </label>
        )}

        {/* Base URL */}
        {(provider === "ollama" || provider === "custom") && (
          <label style={fieldStyle}>
            <span style={labelStyle}>Base URL</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              style={inputStyle}
            />
          </label>
        )}

        {/* Model */}
        <label style={fieldStyle}>
          <span style={labelStyle}>Model</span>
          <select
            value={model || prov.defaultModel}
            onChange={(e) => setModel(e.target.value)}
            style={inputStyle}
          >
            {prov.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--white)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-muted)",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 10,
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              boxShadow: "0 2px 8px rgba(107,66,38,0.25)",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = { display: "block", marginBottom: 16 };

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', monospace",
  background: "var(--white)",
  boxSizing: "border-box",
  outline: "none",
  color: "var(--text)",
};
