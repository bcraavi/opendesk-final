import { useState } from "react";
import * as bridge from "../bridge";
import { SelectionPreview } from "../components/SelectionPreview";
import { ActionButton } from "../components/ActionButton";
import { ResponseCard } from "../components/ResponseCard";

const AI_ACTIONS = [
  { id: "improve", label: "Improve", icon: "\u2728", prompt: "Improve the writing quality, grammar, clarity, and flow. Return only the improved text." },
  { id: "summarize", label: "Summarize", icon: "\ud83d\udcdd", prompt: "Summarize concisely. Return only the summary." },
  { id: "expand", label: "Expand", icon: "\ud83d\udcd6", prompt: "Expand with more detail and depth. Return only the expanded text." },
  { id: "simplify", label: "Simplify", icon: "\ud83c\udfaf", prompt: "Simplify to be clearer. Return only the simplified text." },
  { id: "fix-grammar", label: "Fix Grammar", icon: "\ud83d\udd27", prompt: "Fix all grammar and spelling errors. Return only the corrected text." },
  { id: "formal-tone", label: "Make Formal", icon: "\ud83d\udc54", prompt: "Rewrite in professional tone. Return only the rewritten text." },
  { id: "casual-tone", label: "Make Casual", icon: "\ud83d\udcac", prompt: "Rewrite in casual tone. Return only the rewritten text." },
  { id: "to-bullets", label: "To Bullets", icon: "\ud83d\udccb", prompt: "Convert into clear bullet points. Return only the bullets." },
  { id: "continue", label: "Continue", icon: "\u27a1\ufe0f", prompt: "Continue writing from where this leaves off, matching style. Return only the continuation." },
];

interface AIPanelProps {
  selection: { text: string; isEmpty: boolean };
  connected: boolean;
}

export function AIPanel({ selection, connected }: AIPanelProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState("");

  async function runAction(action: typeof AI_ACTIONS[number]) {
    if (!connected) return;
    if (selection.isEmpty && action.id !== "continue") return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setLastAction(action.label);

    try {
      const result = await new Promise<{ type: string; payload: string }>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "AI_COMPLETE",
            payload: {
              system: "You are a writing assistant. Be direct \u2014 return only the requested output, no preamble or explanation.",
              prompt: `${action.prompt}\n\n---\n\n${selection.text}`,
            },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res);
            }
          }
        );
      });

      if (result.type === "AI_ERROR") {
        throw new Error(result.payload);
      }
      setResponse(result.payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplace() {
    if (response) {
      await bridge.replaceSelection(response);
      setResponse(null);
    }
  }

  async function handleInsert() {
    if (response) {
      await bridge.insertText(response);
      setResponse(null);
    }
  }

  function handleCopy() {
    if (response) {
      navigator.clipboard.writeText(response);
    }
  }

  return (
    <div className="panel-content">
      <SelectionPreview selection={selection} />

      <div className="actions-grid">
        {AI_ACTIONS.map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            disabled={loading || !connected || (selection.isEmpty && action.id !== "continue")}
            onClick={() => runAction(action)}
          />
        ))}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
          <span>Running {lastAction}...</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {response && (
        <ResponseCard
          response={response}
          onReplace={handleReplace}
          onInsert={handleInsert}
          onCopy={handleCopy}
          onDismiss={() => setResponse(null)}
        />
      )}
    </div>
  );
}
