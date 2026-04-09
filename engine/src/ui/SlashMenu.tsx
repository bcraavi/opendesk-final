/**
 * SlashMenu — Popup command menu triggered by typing "/".
 *
 * This component is rendered as a floating menu and controlled by
 * the TipTap Suggestion extension callbacks.
 */

"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { SlashCommandConfig } from "../plugins/types.js";
import { setSlashMenuCallbacks } from "../core/extensions.js";

interface SlashMenuProps {
  className?: string;
}

export interface SlashMenuRef {
  isOpen: boolean;
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  function SlashMenu({ className }, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<SlashCommandConfig[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
    });
    const menuRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({ isOpen }), [isOpen]);

    const updatePosition = useCallback((clientRect: (() => DOMRect) | null) => {
      if (!clientRect) return;
      const rect = clientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
    }, []);

    useEffect(() => {
      setSlashMenuCallbacks({
        onStart: ({ items: newItems, clientRect }) => {
          setItems(newItems);
          setSelectedIndex(0);
          setIsOpen(true);
          updatePosition(clientRect);
        },
        onUpdate: ({ items: newItems, clientRect }) => {
          setItems(newItems);
          setSelectedIndex(0);
          updatePosition(clientRect);
        },
        onExit: () => {
          setIsOpen(false);
          setItems([]);
        },
        onKeyDown: ({ event }) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
            return true;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
            return true;
          }
          if (event.key === "Escape") {
            setIsOpen(false);
            return true;
          }
          return false;
        },
      });
    }, [items.length, updatePosition]);

    if (!isOpen || items.length === 0) return null;

    return (
      <div
        ref={menuRef}
        className={className}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          zIndex: 1000,
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          padding: 4,
          minWidth: 200,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              background: index === selectedIndex ? "#f5f5f5" : "transparent",
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>
              {item.icon}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);
