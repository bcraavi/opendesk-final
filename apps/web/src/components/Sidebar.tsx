"use client";

import { useState } from "react";

interface Doc {
  id: string;
  title: string;
  preview: string;
  active: boolean;
}

export function Sidebar() {
  // For now, just show a simple document list
  // This will be wired to the storage adapter in the future
  const [docs] = useState<Doc[]>([
    {
      id: "welcome",
      title: "Welcome to OpenDesk",
      preview: "Your documents, your storage, your AI...",
      active: true,
    },
  ]);

  return (
    <div
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        background: "var(--sidebar)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: 10 }}>
        <button
          style={{
            width: "100%",
            padding: 8,
            border: "1px dashed var(--border)",
            borderRadius: 8,
            background: "transparent",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            fontFamily: "inherit",
          }}
        >
          + New Document
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 10px" }}>
        {docs.map((doc) => (
          <div
            key={doc.id}
            style={{
              padding: "9px 10px",
              borderRadius: 8,
              cursor: "pointer",
              marginBottom: 1,
              background: doc.active ? "var(--white)" : "transparent",
              border: doc.active
                ? "1px solid var(--border-light)"
                : "1px solid transparent",
              boxShadow: doc.active
                ? "0 1px 3px rgba(0,0,0,0.04)"
                : "none",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.preview}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "6px 10px",
          borderTop: "1px solid var(--border)",
          fontSize: 10,
          color: "var(--text-faint)",
          textAlign: "center",
        }}
      >
        {docs.length} doc{docs.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
