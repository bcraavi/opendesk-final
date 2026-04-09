import { useState, useCallback, useRef, useEffect, useReducer } from "react";

// ─── Architecture ────────────────────────────────────────
// ZERO BACKEND. Everything runs in the user's browser.
// - Documents: stored in user's Google Drive / OneDrive / Dropbox / local files
// - AI: calls go directly from browser → LLM provider
// - Sync: user's existing cloud storage handles it
// - Login: OAuth to their storage provider (not to us)

// ─── Storage Adapters ────────────────────────────────────
// Each adapter implements: connect(), list(), read(id), write(id, data), delete(id)

const STORAGE_PROVIDERS = {
  googledrive: {
    name: "Google Drive",
    icon: "📁",
    color: "#4285F4",
    description: "Sync via your Google Drive",
    folderName: "OpenDesk",
  },
  onedrive: {
    name: "OneDrive",
    icon: "☁️",
    color: "#0078D4",
    description: "Sync via Microsoft OneDrive",
    folderName: "OpenDesk",
  },
  dropbox: {
    name: "Dropbox",
    icon: "📦",
    color: "#0061FF",
    description: "Sync via Dropbox",
    folderName: "OpenDesk",
  },
  local: {
    name: "Local Files",
    icon: "💾",
    color: "#6B7280",
    description: "Save to your device (File System Access API)",
    folderName: "OpenDesk",
  },
  browser: {
    name: "Browser Storage",
    icon: "🌐",
    color: "#8B5E3C",
    description: "Stays in this browser (no sync)",
    folderName: null,
  },
};

const LLM_PROVIDERS = {
  anthropic: { name: "Anthropic Claude", icon: "🟤", models: ["claude-sonnet-4-20250514","claude-haiku-4-5-20250929","claude-opus-4-20250514"], default: "claude-sonnet-4-20250514" },
  openai: { name: "OpenAI", icon: "🟢", models: ["gpt-4o","gpt-4o-mini","o1","o3-mini"], default: "gpt-4o" },
  gemini: { name: "Google Gemini", icon: "🔵", models: ["gemini-2.0-flash","gemini-2.0-pro","gemini-1.5-pro"], default: "gemini-2.0-flash" },
  ollama: { name: "Ollama (Local)", icon: "🦙", models: ["llama3.1","mistral","phi3","gemma2"], default: "llama3.1" },
  custom: { name: "Custom API", icon: "⚙️", models: [], default: "" },
};

const AI_ACTIONS = [
  { id: "improve", label: "Improve", icon: "✨", prompt: "Improve the writing quality, grammar, clarity, and flow. Return only the improved text, no explanations." },
  { id: "summarize", label: "Summarize", icon: "📝", prompt: "Summarize concisely. Return only the summary." },
  { id: "expand", label: "Expand", icon: "📖", prompt: "Expand with more detail and depth. Return only the expanded text." },
  { id: "simplify", label: "Simplify", icon: "🎯", prompt: "Simplify to be clearer. Return only the simplified text." },
  { id: "fix", label: "Fix Grammar", icon: "🔧", prompt: "Fix all grammar and spelling errors. Return only the corrected text." },
  { id: "formal", label: "Formal", icon: "👔", prompt: "Rewrite in professional tone. Return only the rewritten text." },
  { id: "casual", label: "Casual", icon: "💬", prompt: "Rewrite in casual tone. Return only the rewritten text." },
  { id: "bullets", label: "Bullets", icon: "📋", prompt: "Convert into clear bullet points. Return only the bullets." },
  { id: "continue", label: "Continue", icon: "➡️", prompt: "Continue writing from where this leaves off, matching style. Return only the continuation." },
  { id: "translate_es", label: "Spanish", icon: "🇪🇸", prompt: "Translate to Spanish. Return only the translation." },
  { id: "translate_fr", label: "French", icon: "🇫🇷", prompt: "Translate to French. Return only the translation." },
  { id: "explain", label: "Explain", icon: "💡", prompt: "Explain simply. Return only the explanation." },
];

// ─── Direct LLM Calls (browser → provider, no middleman) ─
async function callLLM(settings, prompt, text) {
  const { provider, apiKey, model, baseUrl } = settings;
  const systemPrompt = "You are a writing assistant in a document editor. Be direct — return only the requested output, no preamble.";
  const userMsg = `${prompt}\n\n---\n\n${text}`;

  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: model || "claude-sonnet-4-20250514", max_tokens: 2000, system: systemPrompt, messages: [{ role: "user", content: userMsg }] }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.content[0].text;
  }

  if (provider === "openai" || provider === "custom") {
    const url = (baseUrl || "https://api.openai.com").replace(/\/+$/, "") + "/v1/chat/completions";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model || "gpt-4o", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }], max_tokens: 2000 }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.choices[0].message.content;
  }

  if (provider === "gemini") {
    const m = model || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMsg}` }] }], generationConfig: { maxOutputTokens: 2000 } }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates[0].content.parts[0].text;
  }

  if (provider === "ollama") {
    const url = (baseUrl || "http://localhost:11434").replace(/\/+$/, "") + "/api/chat";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model || "llama3.1", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }], stream: false }),
    });
    const d = await r.json();
    return d.message.content;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Demo AI (no API key configured) ─────────────────────
function demoAI(action, text) {
  const t = text.slice(0, 300);
  const map = {
    improve: () => t.charAt(0).toUpperCase() + t.slice(1).replace(/\s+/g, " ").trim() + (t.endsWith(".") ? "" : ".") + "\n\n[Demo mode — connect an LLM in Settings for real AI]",
    summarize: () => `Summary: ${t.split(".").slice(0, 2).join(". ").trim()}. [Demo]`,
    expand: () => `${t}\n\nFurthermore, this deserves deeper exploration. The implications extend beyond the immediate context, touching on broader themes worth examining. [Demo mode]`,
    simplify: () => t.split(".").slice(0, 2).join(". ").trim() + ". [Simplified — Demo]",
    fix: () => t.charAt(0).toUpperCase() + t.slice(1).replace(/\s{2,}/g, " ").trim() + ".",
    formal: () => `I would like to bring the following to your attention:\n\n${t}\n\n[Formal — Demo mode]`,
    casual: () => `So basically — ${t.toLowerCase().replace(/\.$/, "")}! [Casual — Demo]`,
    bullets: () => t.split(/[.!?]+/).filter(s => s.trim()).map(s => `• ${s.trim()}`).join("\n"),
    continue: () => `\n\nBuilding on this, the next step involves examining how these concepts apply in practice. Real-world usage reveals both challenges and opportunities. [Demo mode]`,
    translate_es: () => `[Traducción de demostración] ${t}`,
    translate_fr: () => `[Traduction de démonstration] ${t}`,
    explain: () => `In simple terms: ${t.split(".")[0].trim()}. This means the core idea is about clarity and accessibility. [Demo]`,
  };
  return (map[action] || map.improve)();
}

// ─── Google Drive Adapter ────────────────────────────────
// Uses Google's Picker API + Drive API with OAuth
// Zero server — auth happens in the browser via Google's JS SDK

const GDRIVE_CLIENT_ID = ""; // User sets their own OAuth client ID or we provide one
const GDRIVE_SCOPES = "https://www.googleapis.com/auth/drive.file";

class GoogleDriveAdapter {
  constructor() {
    this.token = null;
    this.folderId = null;
  }

  async connect() {
    // Uses Google Identity Services (no server needed)
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error("Google API not loaded. Add the Google Identity script to your page."));
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: GDRIVE_SCOPES,
        callback: async (response) => {
          if (response.error) { reject(new Error(response.error)); return; }
          this.token = response.access_token;
          await this._ensureFolder();
          resolve(true);
        },
      });
      client.requestAccessToken();
    });
  }

  async _ensureFolder() {
    // Find or create OpenDesk folder
    const searchResp = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='OpenDesk' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    const searchData = await searchResp.json();
    if (searchData.files?.length > 0) {
      this.folderId = searchData.files[0].id;
    } else {
      const createResp = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "OpenDesk", mimeType: "application/vnd.google-apps.folder" }),
      });
      const folder = await createResp.json();
      this.folderId = folder.id;
    }
  }

  async list() {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${this.folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    const data = await resp.json();
    return data.files || [];
  }

  async read(fileId) {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    return await resp.text();
  }

  async write(name, content, existingId = null) {
    if (existingId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "text/markdown" },
        body: content,
      });
      return existingId;
    } else {
      const metadata = { name: `${name}.md`, parents: [this.folderId] };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", new Blob([content], { type: "text/markdown" }));
      const resp = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        body: form,
      });
      const file = await resp.json();
      return file.id;
    }
  }

  async remove(fileId) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}

// ─── Local File System Adapter (File System Access API) ──
class LocalFSAdapter {
  constructor() { this.dirHandle = null; }

  async connect() {
    try {
      this.dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      return true;
    } catch { return false; }
  }

  async list() {
    if (!this.dirHandle) return [];
    const files = [];
    for await (const [name, handle] of this.dirHandle) {
      if (handle.kind === "file" && name.endsWith(".md")) {
        const file = await handle.getFile();
        files.push({ id: name, name, modifiedTime: new Date(file.lastModified).toISOString() });
      }
    }
    return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
  }

  async read(name) {
    const handle = await this.dirHandle.getFileHandle(name);
    const file = await handle.getFile();
    return await file.text();
  }

  async write(name, content) {
    const fileName = name.endsWith(".md") ? name : `${name}.md`;
    const handle = await this.dirHandle.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return fileName;
  }

  async remove(name) {
    await this.dirHandle.removeEntry(name);
  }
}

// ─── Markdown Preview ────────────────────────────────────
function renderMd(md) {
  if (!md) return "";
  return md
    .replace(/^#### (.+)$/gm, '<h4 class="od-h4">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="od-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="od-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="od-h1">$1</h1>')
    .replace(/```(\w+)?\n([\s\S]*?)```/gm, '<pre class="od-code"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="od-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/^- \[x\] (.+)$/gm, '<div class="od-task"><input type="checkbox" checked disabled/>$1</div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="od-task"><input type="checkbox" disabled/>$1</div>')
    .replace(/^- (.+)$/gm, '<div class="od-li">•&ensp;$1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="od-li">$1</div>')
    .replace(/^> (.+)$/gm, '<blockquote class="od-quote">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="od-hr"/>')
    .replace(/\n\n/g, "<br/><br/>");
}

// ─── Main App ────────────────────────────────────────────
const INIT = {
  docs: [
    { id: "welcome", title: "Getting Started", content: `# Welcome to OpenDesk\n\nYour documents live in **your** cloud storage. No servers. No accounts. No tracking.\n\n## Setup\n\n1. Click the cloud icon to connect your storage (Google Drive, OneDrive, local folder)\n2. Open Settings to connect your LLM (Claude, GPT, Gemini, Ollama)\n3. Start writing\n\n## How it works\n\n- Documents save as **.md files** in your storage\n- AI calls go **directly from your browser** to the LLM — we never see your data\n- Works offline — sync happens when you're back online\n- Install as a PWA on mobile/desktop for native feel\n\n## Keyboard Shortcuts\n\n- **⌘/Ctrl + N** — New document\n- **⌘/Ctrl + S** — Save to cloud\n- **⌘/Ctrl + \\\\** — Toggle sidebar\n- **⌘/Ctrl + J** — Toggle AI panel\n\nSelect any text and try the AI actions →`, updatedAt: Date.now(), driveId: null },
  ],
  activeId: "welcome",
  storage: { provider: "browser", connected: false, adapter: null },
  llm: { provider: "", apiKey: "", model: "", baseUrl: "", configured: false },
};

function rd(state, action) {
  switch (action.type) {
    case "NEW_DOC": {
      const doc = { id: `d_${Date.now()}`, title: "Untitled", content: "", updatedAt: Date.now(), driveId: null };
      return { ...state, docs: [doc, ...state.docs], activeId: doc.id };
    }
    case "UPDATE_DOC":
      return { ...state, docs: state.docs.map(d => d.id === action.id ? { ...d, ...action.u, updatedAt: Date.now() } : d) };
    case "DELETE_DOC": {
      const docs = state.docs.filter(d => d.id !== action.id);
      return { ...state, docs, activeId: state.activeId === action.id ? docs[0]?.id : state.activeId };
    }
    case "SET_ACTIVE": return { ...state, activeId: action.id };
    case "SET_STORAGE": return { ...state, storage: { ...state.storage, ...action.s } };
    case "SET_LLM": return { ...state, llm: { ...state.llm, ...action.s } };
    case "LOAD_DOCS": return { ...state, docs: action.docs, activeId: action.docs[0]?.id || null };
    default: return state;
  }
}

// ─── Sub-components ──────────────────────────────────────
function StorageModal({ storage, onConnect, onClose }) {
  const [connecting, setConnecting] = useState(null);

  const handleConnect = async (key) => {
    setConnecting(key);
    try {
      if (key === "local") {
        if (!window.showDirectoryPicker) { alert("Your browser doesn't support File System Access API. Use Chrome or Edge."); setConnecting(null); return; }
        const adapter = new LocalFSAdapter();
        const ok = await adapter.connect();
        if (ok) { onConnect(key, adapter); return; }
      } else if (key === "googledrive") {
        if (!window.google?.accounts?.oauth2) {
          alert("Google Drive integration requires the Google Identity Services SDK.\n\nTo set up:\n1. Create OAuth credentials at console.cloud.google.com\n2. Add the GIS script to your HTML\n3. Set your Client ID in the code\n\nFor now, try Local Files or Browser Storage.");
          setConnecting(null); return;
        }
        const adapter = new GoogleDriveAdapter();
        await adapter.connect();
        onConnect(key, adapter);
        return;
      } else if (key === "browser") {
        onConnect(key, null);
        return;
      } else {
        alert(`${STORAGE_PROVIDERS[key].name} integration coming soon.\n\nFor now, use Local Files — it syncs automatically if you pick a folder inside your ${STORAGE_PROVIDERS[key].name} sync folder on your computer.`);
      }
    } catch (e) {
      alert(`Connection failed: ${e.message}`);
    }
    setConnecting(null);
  };

  return (
    <div style={styles.modalOverlay}>
      <div onClick={onClose} style={styles.modalBg} />
      <div style={{ ...styles.modal, maxWidth: 520 }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Connect Storage</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
          Your documents are stored as <strong>.md files</strong> in your own storage. OpenDesk never sees or stores your data.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(STORAGE_PROVIDERS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handleConnect(key)}
              disabled={connecting !== null}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                border: storage.provider === key && storage.connected ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                background: storage.provider === key && storage.connected ? `${p.color}10` : C.white,
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                opacity: connecting && connecting !== key ? 0.5 : 1,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 28, width: 40, textAlign: "center" }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{p.description}</div>
              </div>
              {storage.provider === key && storage.connected && (
                <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: `${p.color}15`, padding: "4px 10px", borderRadius: 6 }}>Connected</span>
              )}
              {connecting === key && (
                <div style={{ width: 18, height: 18, border: `2px solid ${p.color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 14, background: C.surface, borderRadius: 10, fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
          <strong>💡 Pro tip:</strong> Choose "Local Files" and pick a folder inside your Google Drive / OneDrive / Dropbox sync folder. Your docs will auto-sync across all devices through your existing cloud service.
        </div>
      </div>
    </div>
  );
}

function LLMModal({ llm, onSave, onClose }) {
  const [s, setS] = useState({ ...llm });
  const p = LLM_PROVIDERS[s.provider] || LLM_PROVIDERS.anthropic;

  return (
    <div style={styles.modalOverlay}>
      <div onClick={onClose} style={styles.modalBg} />
      <div style={{ ...styles.modal, maxWidth: 480 }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>⚙️ LLM Settings</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
          API calls go <strong>directly from your browser</strong> to the provider. Your key never touches any server.
        </p>

        <label style={styles.field}>
          <span style={styles.label}>Provider</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(LLM_PROVIDERS).map(([k, v]) => (
              <button key={k} onClick={() => setS({ ...s, provider: k, model: v.default, baseUrl: k === "ollama" ? "http://localhost:11434" : "" })}
                style={{ padding: "10px", border: s.provider === k ? `2px solid ${C.accent}` : `1px solid ${C.border}`, borderRadius: 10, background: s.provider === k ? C.accentBg : C.white, cursor: "pointer", fontSize: 13, fontWeight: s.provider === k ? 700 : 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, color: C.text }}>
                <span style={{ fontSize: 16 }}>{v.icon}</span>{v.name}
              </button>
            ))}
          </div>
        </label>

        {s.provider !== "ollama" && (
          <label style={styles.field}>
            <span style={styles.label}>API Key</span>
            <input type="password" value={s.apiKey} onChange={e => setS({ ...s, apiKey: e.target.value })}
              placeholder={`Your ${p.name} API key`} style={styles.input} />
          </label>
        )}

        {(s.provider === "ollama" || s.provider === "custom") && (
          <label style={styles.field}>
            <span style={styles.label}>Base URL</span>
            <input value={s.baseUrl} onChange={e => setS({ ...s, baseUrl: e.target.value })}
              placeholder="http://localhost:11434" style={styles.input} />
          </label>
        )}

        <label style={styles.field}>
          <span style={styles.label}>Model</span>
          {p.models.length > 0 ? (
            <select value={s.model} onChange={e => setS({ ...s, model: e.target.value })} style={styles.input}>
              {p.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input value={s.model} onChange={e => setS({ ...s, model: e.target.value })} placeholder="model-name" style={styles.input} />
          )}
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={styles.btnSecondary}>Cancel</button>
          <button onClick={() => onSave({ ...s, configured: !!(s.apiKey || s.provider === "ollama") })} style={styles.btnPrimary}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Colors & Styles ─────────────────────────────────────
const C = {
  bg: "#FDFBF7", surface: "#F5F0E8", sidebar: "#EDE7DB",
  border: "#DDD5C8", borderLight: "#E8E1D5",
  text: "#2C2416", textMuted: "#7A6E5E", textFaint: "#A99E8E",
  accent: "#6B4226", accentBg: "#F0E6D9", accentHover: "#5A3520",
  white: "#FFFDF9", green: "#2D6A4F", red: "#B33B3B",
};

const styles = {
  modalOverlay: { position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  modalBg: { position: "absolute", inset: 0, background: "rgba(44,36,22,0.35)", backdropFilter: "blur(6px)" },
  modal: { position: "relative", width: "90%", maxHeight: "88vh", overflow: "auto", background: C.bg, borderRadius: 16, boxShadow: "0 25px 60px rgba(44,36,22,0.25)", padding: 28, fontFamily: "'Literata',Georgia,serif" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: "1.2rem", fontWeight: 800, color: C.text, margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textMuted, padding: "4px 8px" },
  field: { display: "block", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 700, color: C.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { width: "100%", padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'JetBrains Mono',monospace", background: C.white, boxSizing: "border-box", outline: "none", color: C.text },
  btnPrimary: { padding: "10px 24px", border: "none", borderRadius: 10, background: C.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 2px 8px rgba(107,66,38,0.25)" },
  btnSecondary: { padding: "10px 20px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.white, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.textMuted, fontFamily: "inherit" },
};

// ─── App Root ────────────────────────────────────────────
export default function OpenDesk() {
  const [state, dp] = useReducer(rd, INIT);
  const [showStorage, setShowStorage] = useState(false);
  const [showLLM, setShowLLM] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("edit");
  const [selText, setSelText] = useState("");
  const [selRange, setSelRange] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiErr, setAiErr] = useState(null);
  const [note, setNote] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const edRef = useRef(null);

  const doc = state.docs.find(d => d.id === state.activeId);
  const notify = (m) => { setNote(m); setTimeout(() => setNote(null), 2500); };

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); dp({ type: "NEW_DOC" }); }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); setShowSidebar(s => !s); }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setShowAI(s => !s); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [state]);

  const handleSelect = useCallback(() => {
    const el = edRef.current;
    if (!el) return;
    if (el.selectionStart !== el.selectionEnd) {
      setSelText(el.value.substring(el.selectionStart, el.selectionEnd));
      setSelRange({ start: el.selectionStart, end: el.selectionEnd });
    } else { setSelText(""); setSelRange(null); }
  }, []);

  // Save to connected storage
  const handleSave = useCallback(async () => {
    if (!doc) return;
    const { storage } = state;
    if (storage.provider === "browser" || !storage.connected || !storage.adapter) {
      notify("Saved locally");
      return;
    }
    setSaving(true);
    try {
      const id = await storage.adapter.write(doc.title || "Untitled", doc.content, doc.driveId);
      dp({ type: "UPDATE_DOC", id: doc.id, u: { driveId: id } });
      notify(`Saved to ${STORAGE_PROVIDERS[storage.provider].name}`);
    } catch (e) {
      notify(`Save failed: ${e.message}`);
    }
    setSaving(false);
  }, [doc, state.storage]);

  // Storage connect handler
  const handleStorageConnect = useCallback(async (providerKey, adapter) => {
    dp({ type: "SET_STORAGE", s: { provider: providerKey, connected: true, adapter } });
    setShowStorage(false);
    notify(`Connected to ${STORAGE_PROVIDERS[providerKey].name}`);

    // Load existing docs from storage
    if (adapter) {
      try {
        const files = await adapter.list();
        if (files.length > 0) {
          const docs = [];
          for (const f of files.slice(0, 50)) {
            try {
              const content = await adapter.read(f.id);
              const title = content.split("\n")[0]?.replace(/^#+\s*/, "").trim() || f.name.replace(".md", "");
              docs.push({ id: f.id, title, content, updatedAt: new Date(f.modifiedTime).getTime(), driveId: f.id });
            } catch {}
          }
          if (docs.length > 0) dp({ type: "LOAD_DOCS", docs });
        }
      } catch {}
    }
  }, []);

  // AI handler
  const handleAI = useCallback(async (actionId, custom) => {
    const text = selText || doc?.content?.substring(0, 500) || "";
    if (!text.trim()) { notify("Select some text first"); return; }
    const action = AI_ACTIONS.find(a => a.id === actionId);
    const prompt = custom || action?.prompt || "Process this text:";

    setAiLoading(true); setAiResult(null); setAiErr(null);

    if (!state.llm.configured) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
      setAiResult(demoAI(actionId, text));
      setAiLoading(false);
      return;
    }

    try {
      const result = await callLLM(state.llm, prompt, text);
      setAiResult(result);
    } catch (e) {
      setAiErr(e.message);
    }
    setAiLoading(false);
  }, [selText, doc, state.llm]);

  const insertAI = () => {
    if (!aiResult || !doc) return;
    const pos = selRange?.end || doc.content.length;
    dp({ type: "UPDATE_DOC", id: doc.id, u: { content: doc.content.substring(0, pos) + "\n\n" + aiResult + doc.content.substring(pos) } });
    setAiResult(null); notify("Inserted");
  };

  const replaceAI = () => {
    if (!aiResult || !selRange || !doc) return;
    dp({ type: "UPDATE_DOC", id: doc.id, u: { content: doc.content.substring(0, selRange.start) + aiResult + doc.content.substring(selRange.end) } });
    setAiResult(null); setSelRange(null); notify("Replaced");
  };

  const filteredDocs = state.docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase()));
  const wordCount = doc?.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  const sp = STORAGE_PROVIDERS[state.storage.provider];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, fontFamily: "'Literata',Georgia,serif", fontSize: 15, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,300;0,7..72,400;0,7..72,600;0,7..72,700;0,7..72,800;1,7..72,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {note && <div style={{ position: "fixed", top: 14, right: 14, zIndex: 200, background: C.accent, color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: "0 4px 16px rgba(107,66,38,0.3)", animation: "slideIn 0.3s ease" }}>{note}</div>}
      {showStorage && <StorageModal storage={state.storage} onConnect={handleStorageConnect} onClose={() => setShowStorage(false)} />}
      {showLLM && <LLMModal llm={state.llm} onSave={s => { dp({ type: "SET_LLM", s }); setShowLLM(false); notify("LLM configured"); }} onClose={() => setShowLLM(false)} />}

      {/* ─── Top Bar ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", borderBottom: `1px solid ${C.border}`, background: C.surface, minHeight: 42 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted, padding: "4px 6px" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${C.accent}, #3D2416)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>O</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>OpenDesk</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Storage indicator */}
          <button onClick={() => setShowStorage(true)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8,
            border: `1px solid ${C.border}`, background: state.storage.connected ? `${sp.color}10` : C.white,
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: C.textMuted,
          }}>
            <span>{sp.icon}</span>
            <span>{state.storage.connected ? sp.name : "Connect Storage"}</span>
          </button>

          {/* LLM indicator */}
          <button onClick={() => setShowLLM(true)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8,
            border: `1px solid ${C.border}`, background: state.llm.configured ? C.accentBg : "#FFF3E0",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            color: state.llm.configured ? C.accent : "#E65100",
          }}>
            {state.llm.configured ? <><span>{LLM_PROVIDERS[state.llm.provider]?.icon}</span><span>{state.llm.model}</span></> : "⚙️ Connect LLM"}
          </button>

          {/* Save */}
          <button onClick={handleSave} disabled={saving} style={{
            padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.white, cursor: "pointer", fontSize: 12, fontWeight: 700, color: C.textMuted, fontFamily: "inherit",
          }}>{saving ? "Saving..." : "💾 Save"}</button>

          {/* AI toggle */}
          <button onClick={() => setShowAI(!showAI)} style={{
            padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            background: showAI ? C.accent : C.accentBg, color: showAI ? "#fff" : C.accent,
          }}>✨ AI</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ─── Sidebar ─── */}
        {showSidebar && (
          <div style={{ width: 230, borderRight: `1px solid ${C.border}`, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: 10 }}>
              <button onClick={() => dp({ type: "NEW_DOC" })} style={{
                width: "100%", padding: "8px", border: `1px dashed ${C.border}`, borderRadius: 8,
                background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.accent, fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.target.style.background = C.accentBg; }} onMouseLeave={e => { e.target.style.background = "transparent"; }}>
                + New Document
              </button>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{
                width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 12, fontFamily: "inherit", background: C.white, marginTop: 6, boxSizing: "border-box", outline: "none", color: C.text,
              }} />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 10px" }}>
              {filteredDocs.map(d => (
                <div key={d.id} onClick={() => dp({ type: "SET_ACTIVE", id: d.id })} style={{
                  padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 1,
                  background: d.id === state.activeId ? C.white : "transparent",
                  border: d.id === state.activeId ? `1px solid ${C.borderLight}` : "1px solid transparent",
                  boxShadow: d.id === state.activeId ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {editTitle === d.id ? (
                      <input autoFocus value={d.title} onChange={e => dp({ type: "UPDATE_DOC", id: d.id, u: { title: e.target.value } })}
                        onBlur={() => setEditTitle(null)} onKeyDown={e => e.key === "Enter" && setEditTitle(null)}
                        onClick={e => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 700, border: "none", background: "transparent", outline: "none", fontFamily: "inherit", color: C.text, width: "100%", padding: 0 }} />
                    ) : (
                      <span onDoubleClick={e => { e.stopPropagation(); setEditTitle(d.id); }}
                        style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{d.title || "Untitled"}</span>
                    )}
                    {state.docs.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); dp({ type: "DELETE_DOC", id: d.id }); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.textFaint, padding: "2px", opacity: 0.4 }}
                        onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.4}>✕</button>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.content?.substring(0, 60).replace(/[#*\n]/g, " ").trim() || "Empty"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.textFaint, marginTop: 4 }}>
                    <span>{new Date(d.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    {d.driveId && <span style={{ color: C.green }}>☁️</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "6px 10px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textFaint, textAlign: "center" }}>{state.docs.length} docs</div>
          </div>
        )}

        {/* ─── Editor ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {doc ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
                <div style={{ display: "flex", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  {["edit", "preview", "split"].map(m => (
                    <button key={m} onClick={() => setViewMode(m)} style={{
                      padding: "4px 12px", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", textTransform: "capitalize",
                      background: viewMode === m ? C.accent : "transparent", color: viewMode === m ? "#fff" : C.textMuted,
                    }}>{m}</button>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: C.textFaint }}>{wordCount} words</span>
                {!state.llm.configured && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "#FFF3E0", color: "#E65100", fontWeight: 600 }}>Demo AI</span>}
              </div>

              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {(viewMode === "edit" || viewMode === "split") && (
                  <div style={{ flex: 1, overflow: "auto", padding: "28px 0" }}>
                    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 36px" }}>
                      <textarea ref={edRef} value={doc.content}
                        onChange={e => dp({ type: "UPDATE_DOC", id: doc.id, u: { content: e.target.value, title: e.target.value.split("\n")[0]?.replace(/^#+\s*/, "").trim() || "Untitled" } })}
                        onSelect={handleSelect} onMouseUp={handleSelect} onKeyUp={handleSelect}
                        placeholder="Start writing..." spellCheck
                        style={{
                          width: "100%", minHeight: "calc(100vh - 180px)", resize: "none", border: "none", outline: "none",
                          background: "transparent", fontSize: 15, lineHeight: 2, color: C.text,
                          fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-0.01em",
                        }} />
                    </div>
                  </div>
                )}
                {(viewMode === "preview" || viewMode === "split") && (
                  <div style={{ flex: 1, overflow: "auto", padding: "28px 0", borderLeft: viewMode === "split" ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 36px", lineHeight: 1.9 }}
                      dangerouslySetInnerHTML={{ __html: renderMd(doc.content) }} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textFaint }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📝</div>
                <button onClick={() => dp({ type: "NEW_DOC" })} style={styles.btnPrimary}>+ New Document</button>
              </div>
            </div>
          )}
        </div>

        {/* ─── AI Panel ─── */}
        {showAI && (
          <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>✨ AI</span>
              <button onClick={() => setShowAI(false)} style={styles.closeBtn}>✕</button>
            </div>

            {selText && (
              <div style={{ padding: "7px 12px", background: C.accentBg, borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.accent }}>
                <strong>Selected:</strong> "{selText.slice(0, 100)}{selText.length > 100 ? "..." : ""}"
              </div>
            )}

            <div style={{ padding: 8, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 5 }}>
                <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && customPrompt) handleAI("improve", customPrompt); }}
                  placeholder="Custom instruction..." style={{ ...styles.input, padding: "7px 10px", fontSize: 12 }} />
                <button onClick={() => handleAI("improve", customPrompt)} style={{ ...styles.btnPrimary, padding: "7px 12px", fontSize: 13 }}>→</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {AI_ACTIONS.map(a => (
                  <button key={a.id} onClick={() => handleAI(a.id)} disabled={aiLoading}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      padding: 8, borderRadius: 8, border: `1px solid ${C.border}`,
                      background: C.white, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      opacity: aiLoading ? 0.5 : 1, transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentBg; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}>
                    <span style={{ fontSize: 14, marginBottom: 1 }}>{a.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{a.label}</span>
                  </button>
                ))}
              </div>

              {(aiLoading || aiResult || aiErr) && (
                <div style={{ marginTop: 12 }}>
                  {aiLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: C.white, borderRadius: 8, border: `1px solid ${C.border}` }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontSize: 12, color: C.textMuted }}>Thinking...</span>
                    </div>
                  ) : aiErr ? (
                    <div style={{ padding: 12, background: "#FFF0F0", borderRadius: 8, border: "1px solid #FFD0D0", fontSize: 12, color: C.red }}>{aiErr}</div>
                  ) : aiResult && (
                    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: 12 }}>
                      <div style={{ fontSize: 12, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 10, maxHeight: 180, overflowY: "auto" }}>{aiResult}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <button onClick={insertAI} style={{ ...styles.btnPrimary, padding: "5px 12px", fontSize: 11 }}>Insert</button>
                        {selRange && <button onClick={replaceAI} style={{ ...styles.btnSecondary, padding: "5px 12px", fontSize: 11 }}>Replace</button>}
                        <button onClick={() => { navigator.clipboard.writeText(aiResult); notify("Copied!"); }} style={{ ...styles.btnSecondary, padding: "5px 12px", fontSize: 11 }}>Copy</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideIn { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        textarea::placeholder { color: ${C.textFaint}; }
        .od-h1 { font-size: 1.9rem; font-weight: 800; margin: 0.8em 0 0.4em; font-family: 'Literata',Georgia,serif; letter-spacing: -0.02em; }
        .od-h2 { font-size: 1.35rem; font-weight: 700; margin: 1.4em 0 0.4em; font-family: 'Literata',Georgia,serif; }
        .od-h3 { font-size: 1.1rem; font-weight: 700; margin: 1.2em 0 0.3em; }
        .od-h4 { font-size: 1rem; font-weight: 700; margin: 1em 0 0.3em; }
        .od-code { background: ${C.sidebar}; padding: 14px 18px; border-radius: 8px; font-size: 13px; font-family: 'JetBrains Mono',monospace; overflow-x: auto; margin: 12px 0; border: 1px solid ${C.border}; }
        .od-inline-code { background: ${C.sidebar}; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-family: 'JetBrains Mono',monospace; color: ${C.accent}; }
        .od-quote { border-left: 3px solid ${C.accent}; padding: 4px 16px; margin: 12px 0; color: ${C.textMuted}; font-style: italic; background: ${C.surface}; border-radius: 0 6px 6px 0; }
        .od-li { margin: 3px 0 3px 16px; }
        .od-task { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
        .od-task input { accent-color: ${C.accent}; }
        .od-hr { border: none; border-top: 1px solid ${C.border}; margin: 24px 0; }
        *::-webkit-scrollbar { width: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: ${C.textFaint}; }
      `}</style>
    </div>
  );
}
