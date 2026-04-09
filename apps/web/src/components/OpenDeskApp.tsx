"use client";

import { useState, useCallback, useEffect } from "react";
import {
  OpenDeskProvider,
  useOpenDesk,
  useEditor,
  usePluginEngine,
  useAI,
  OpenDeskEditorView,
  OpenDeskToolbar,
  SlashMenu,
} from "@opendesk/engine";
import type { OpenDeskPlugin, AIPipelineConfig } from "@opendesk/engine";
import { AIPanel } from "./AIPanel";
import { Sidebar } from "./Sidebar";
import { LLMSettings } from "./LLMSettings";

// ─── Import example plugins ──────────────────────────────
import readingTimePlugin from "../../../../plugins/reading-time/index";
import wordCountPlugin from "../../../../plugins/word-count/index";
import aiWritingPlugin from "../../../../plugins/ai-writing-assistant/index";
import exportPdfPlugin from "../../../../plugins/export-pdf/index";

const PLUGINS: OpenDeskPlugin[] = [
  readingTimePlugin,
  wordCountPlugin,
  aiWritingPlugin,
  exportPdfPlugin,
];

const WELCOME_CONTENT = `<h1>Welcome to OpenDesk</h1>
<p>Your documents, your storage, your AI. No servers. No tracking.</p>
<h2>Try it out</h2>
<ul>
  <li>Start typing here — this is a full rich-text editor powered by TipTap</li>
  <li>Type <code>/</code> to see slash commands</li>
  <li>Select text and use the AI panel on the right</li>
  <li>Check the toolbar — plugins added the reading time and word count</li>
</ul>
<h2>Keyboard Shortcuts</h2>
<ul>
  <li><strong>Ctrl/Cmd + B</strong> — Bold</li>
  <li><strong>Ctrl/Cmd + I</strong> — Italic</li>
  <li><strong>Ctrl/Cmd + E</strong> — Code</li>
  <li><strong>Ctrl/Cmd + Shift + B</strong> — Blockquote</li>
</ul>
<blockquote><p>OpenDesk is the document engine for builders. Don't build another editor — build on this one.</p></blockquote>`;

export function OpenDeskApp() {
  return (
    <OpenDeskProvider
      plugins={PLUGINS}
      config={{
        content: WELCOME_CONTENT,
        placeholder: "Start writing...",
      }}
    >
      <AppShell />
    </OpenDeskProvider>
  );
}

function AppShell() {
  const { ready } = useOpenDesk();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showLLM, setShowLLM] = useState(false);

  // Keyboard shortcuts for the shell
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setShowSidebar((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setShowAI((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontFamily: "inherit",
        }}
      >
        Loading OpenDesk...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <TopBar
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((s) => !s)}
        showAI={showAI}
        onToggleAI={() => setShowAI((s) => !s)}
        onOpenLLM={() => setShowLLM(true)}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Document Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Editor */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "4px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <EditorToolbar />
          </div>

          {/* Editor Content */}
          <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto",
                padding: "0 40px",
              }}
            >
              <OpenDeskEditorView />
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {showAI && <AIPanel onClose={() => setShowAI(false)} />}
      </div>

      {/* Slash Menu */}
      <SlashMenu />

      {/* LLM Settings Modal */}
      {showLLM && <LLMSettings onClose={() => setShowLLM(false)} />}
    </div>
  );
}

// ─── Top Bar ─────────────────────────────────────────────

function TopBar({
  showSidebar,
  onToggleSidebar,
  showAI,
  onToggleAI,
  onOpenLLM,
}: {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showAI: boolean;
  onToggleAI: () => void;
  onOpenLLM: () => void;
}) {
  const ai = useAI();
  const configured = ai.isConfigured();
  const provider = ai.getProvider();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 14px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        minHeight: 44,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onToggleSidebar} style={iconBtn}>
          {showSidebar ? "◀" : "▶"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, var(--accent), #3D2416)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>
              O
            </span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>
            OpenDesk
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={onOpenLLM} style={chipBtn(configured)}>
          {configured ? `${provider.name}: ${provider.model}` : "Connect LLM"}
        </button>
        <button
          onClick={onToggleAI}
          style={{
            ...chipBtn(true),
            background: showAI ? "var(--accent)" : "var(--accent-bg)",
            color: showAI ? "#fff" : "var(--accent)",
            border: "none",
          }}
        >
          AI
        </button>
      </div>
    </div>
  );
}

// ─── Editor Toolbar (formatting + plugin items) ──────────

function EditorToolbar() {
  const editor = useEditor();

  if (!editor) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      {/* Formatting buttons */}
      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        B
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code (Ctrl+E)"
      >
        {"<>"}
      </ToolbarBtn>

      <div style={divider} />

      <ToolbarBtn
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        title="Heading 1"
      >
        H1
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        title="Heading 2"
      >
        H2
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        title="Heading 3"
      >
        H3
      </ToolbarBtn>

      <div style={divider} />

      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        &#8226;
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        1.
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task List"
      >
        &#9745;
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        &#8220;
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        {"{ }"}
      </ToolbarBtn>
      <ToolbarBtn
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        ---
      </ToolbarBtn>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Plugin toolbar items */}
      <OpenDeskToolbar />
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "var(--accent-bg)" : "transparent",
        border: "none",
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontFamily: "inherit",
        minWidth: 28,
        textAlign: "center",
      }}
    >
      {children}
    </button>
  );
}

// ─── Shared styles ───────────────────────────────────────

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  color: "var(--text-muted)",
  padding: "4px 6px",
};

const chipBtn = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: active ? "var(--accent-bg)" : "var(--white)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  color: active ? "var(--accent)" : "var(--text-muted)",
});

const divider: React.CSSProperties = {
  width: 1,
  height: 18,
  background: "var(--border)",
  margin: "0 4px",
};
