/**
 * OpenDeskEditorView — Renders the TipTap editor content.
 */

"use client";

import { EditorContent } from "@tiptap/react";
import { useOpenDesk } from "./OpenDeskProvider.js";

interface EditorViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export function OpenDeskEditorView({ className, style }: EditorViewProps) {
  const { editor, ready } = useOpenDesk();

  if (!ready || !editor) {
    return (
      <div className={className} style={{ ...style, opacity: 0.5 }}>
        Loading editor...
      </div>
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={className}
      style={style}
    />
  );
}
