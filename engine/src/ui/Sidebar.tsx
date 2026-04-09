/**
 * OpenDeskSidebar — Renders plugin-registered sidebar panels.
 */

"use client";

import { createElement } from "react";
import { useOpenDesk } from "./OpenDeskProvider.js";
import { buildDocumentContext, buildSelectionContext } from "../core/context.js";
import type { SidebarPanelProps } from "../plugins/types.js";

interface SidebarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function OpenDeskSidebar({ className, style }: SidebarProps) {
  const { editor, engine, activePanel, setActivePanel } = useOpenDesk();

  const panels = engine.sidebarPanels;
  if (panels.length === 0) return null;

  const active = panels.find((p) => p.id === activePanel) || null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Panel tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "4px",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        {panels.map((panel) => (
          <button
            key={panel.id}
            title={panel.title}
            onClick={() =>
              setActivePanel(activePanel === panel.id ? null : panel.id)
            }
            style={{
              background: activePanel === panel.id ? "#f0f0f0" : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {panel.icon} {panel.title}
          </button>
        ))}
      </div>

      {/* Active panel content */}
      {active && active.component && editor && (
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          {createElement<SidebarPanelProps>(active.component, {
            document: buildDocumentContext(editor),
            selection: buildSelectionContext(editor),
            ai: engine.ai,
            insertText: (text: string) => {
              editor.chain().focus().insertContent(text).run();
            },
            replaceSelection: (text: string) => {
              const { from, to } = editor.state.selection;
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContent(text)
                .run();
            },
          })}
        </div>
      )}
    </div>
  );
}
