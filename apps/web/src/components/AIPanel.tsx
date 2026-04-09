"use client";

import { useState, useCallback } from "react";
import {
  useOpenDesk,
  useEditor,
  usePluginEngine,
  useAI,
  buildDocumentContext,
  buildSelectionContext,
} from "@opendesk/engine";
import type { AIPipelineConfig } from "@opendesk/engine";

const QUICK_ACTIONS = [
  { id: "improve", label: "Improve", icon: "✨" },
  { id: "summarize", label: "Summarize", icon: "📝" },
  { id: "expand", label: "Expand", icon: "📖" },
  { id: "simplify", label: "Simplify", icon: "🎯" },
  { id: "fix-grammar", label: "Fix Grammar", icon: "🔧" },
  { id: "formal-tone", label: "Formal", icon: "👔" },
  { id: "casual-tone", label: "Casual", icon: "💬" },
  { id: "to-bullets", label: "Bullets", icon: "📋" },
  { id: "continue-writing", label: "Continue", icon: "➡️" },
];

export function AIPanel({ onClose }: { onClose: () => void }) {
  const editor = useEditor();
  const engine = usePluginEngine();
  const ai = useAI();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const getSelectedText = useCallback(() => {
    if (!editor) return "";
    const sel = buildSelectionContext(editor);
    if (!sel.isEmpty) return sel.text;
    // Fall back to first 500 chars of document
    return editor.getText().substring(0, 500);
  }, [editor]);

  const runPipeline = useCallback(
    async (pipelineId: string) => {
      const text = getSelectedText();
      if (!text.trim()) return;

      setLoading(true);
      setResult(null);
      setError(null);

      try {
        // Find the pipeline in the registered AI pipelines
        const pipeline = engine.aiPipelines.find(
          (p) => p.id === `ai-write-${pipelineId}` || p.id === pipelineId
        );

        if (pipeline && editor) {
          const docCtx = buildDocumentContext(editor);
          const res = await pipeline.process(text, ai, docCtx);
          setResult(res);
        } else {
          // Direct AI call as fallback
          const action = QUICK_ACTIONS.find((a) => a.id === pipelineId);
          const prompt = action
            ? `${action.label} this text. Return only the result.`
            : "Process this text:";
          const res = await ai.complete({ prompt: `${prompt}\n\n${text}` });
          setResult(res);
        }
      } catch (e: any) {
        setError(e.message || "AI request failed");
      }

      setLoading(false);
    },
    [editor, engine, ai, getSelectedText]
  );

  const runCustom = useCallback(async () => {
    if (!customPrompt.trim()) return;
    const text = getSelectedText();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await ai.complete({
        system:
          "You are a writing assistant. Be direct — return only the requested output.",
        prompt: `${customPrompt}\n\n---\n\n${text}`,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || "AI request failed");
    }

    setLoading(false);
  }, [ai, customPrompt, getSelectedText]);

  const insertResult = useCallback(() => {
    if (!result || !editor) return;
    editor.chain().focus().insertContent(`\n\n${result}`).run();
    setResult(null);
  }, [result, editor]);

  const replaceSelection = useCallback(() => {
    if (!result || !editor) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(result)
        .run();
    } else {
      editor.chain().focus().insertContent(result).run();
    }
    setResult(null);
  }, [result, editor]);

  const selText = editor ? buildSelectionContext(editor) : null;

  return (
    <div
      style={{
        width: 270,
        borderLeft: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800 }}>AI Assistant</span>
        {!ai.isConfigured() && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#FFF3E0",
              color: "#E65100",
              fontWeight: 600,
            }}
          >
            Demo
          </span>
        )}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "var(--text-muted)",
            padding: "2px 4px",
          }}
        >
          x
        </button>
      </div>

      {/* Selection indicator */}
      {selText && !selText.isEmpty && (
        <div
          style={{
            padding: "6px 12px",
            background: "var(--accent-bg)",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--accent)",
          }}
        >
          <strong>Selected:</strong> &ldquo;
          {selText.text.slice(0, 80)}
          {selText.text.length > 80 ? "..." : ""}
          &rdquo;
        </div>
      )}

      {/* Custom prompt */}
      <div
        style={{
          padding: 8,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: 5,
        }}
      >
        <input
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customPrompt) runCustom();
          }}
          placeholder="Custom instruction..."
          style={{
            flex: 1,
            padding: "7px 10px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "inherit",
            background: "var(--white)",
            outline: "none",
            color: "var(--text)",
          }}
        />
        <button
          onClick={runCustom}
          disabled={loading}
          style={{
            padding: "7px 12px",
            border: "none",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
          }}
        >
          Go
        </button>
      </div>

      {/* Action grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 5,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => runPipeline(action.id)}
              disabled={loading}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: 8,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--white)",
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 14, marginBottom: 1 }}>
                {action.icon}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Result / Loading / Error */}
        {(loading || result || error) && (
          <div style={{ marginTop: 12 }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  background: "var(--white)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Thinking...
              </div>
            ) : error ? (
              <div
                style={{
                  padding: 12,
                  background: "#FFF0F0",
                  borderRadius: 8,
                  border: "1px solid #FFD0D0",
                  fontSize: 12,
                  color: "var(--red)",
                }}
              >
                {error}
              </div>
            ) : result ? (
              <div
                style={{
                  background: "var(--white)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                    marginBottom: 10,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {result}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <ActionBtn onClick={insertResult}>Insert</ActionBtn>
                  <ActionBtn onClick={replaceSelection} secondary>
                    Replace
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                    }}
                    secondary
                  >
                    Copy
                  </ActionBtn>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  secondary,
  children,
}: {
  onClick: () => void;
  secondary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        border: secondary ? "1px solid var(--border)" : "none",
        borderRadius: 8,
        background: secondary ? "var(--white)" : "var(--accent)",
        color: secondary ? "var(--text-muted)" : "#fff",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
