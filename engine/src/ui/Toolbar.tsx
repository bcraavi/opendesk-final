/**
 * OpenDeskToolbar — Renders plugin-registered toolbar items.
 */

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useOpenDesk } from "./OpenDeskProvider.js";
import { buildDocumentContext, buildToolbarContext } from "../core/context.js";

interface ToolbarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function OpenDeskToolbar({ className, style }: ToolbarProps) {
  const { editor, engine } = useOpenDesk();
  const [, forceUpdate] = useState(0);

  // Re-render toolbar when document changes (for dynamic items like word count)
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate((n) => n + 1);
    editor.on("update", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("update", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const items = engine.toolbarItems;
  if (items.length === 0) return null;

  const left = items.filter((i) => i.position === "left" || !i.position);
  const center = items.filter((i) => i.position === "center");
  const right = items.filter((i) => i.position === "right");

  const docContext = buildDocumentContext(editor);

  const renderItem = (item: (typeof items)[number]) => {
    const toolbarCtx = buildToolbarContext(editor, engine);
    let content: ReactNode = null;

    if (item.render) {
      content = item.render(docContext) as ReactNode;
    } else {
      content = typeof item.icon === "string" ? item.icon : null;
    }

    return (
      <button
        key={item.id}
        title={item.tooltip}
        onClick={() => item.onClick?.(toolbarCtx)}
        style={{
          background: "none",
          border: "none",
          cursor: item.onClick ? "pointer" : "default",
          padding: "4px 8px",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {left.map(renderItem)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {center.map(renderItem)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {right.map(renderItem)}
      </div>
    </div>
  );
}
