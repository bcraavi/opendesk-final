/**
 * Context builders — create DocumentContext, SelectionContext, CommandContext,
 * and ToolbarContext from the TipTap editor state.
 */

import type { Editor } from "@tiptap/core";
import type {
  DocumentContext,
  SelectionContext,
  CommandContext,
  ToolbarContext,
  AIProvider,
} from "../plugins/types.js";
import type { PluginEngineImpl } from "../plugins/runtime.js";

export function buildDocumentContext(
  editor: Editor,
  id: string = "",
  title: string = "",
  metadata: Record<string, unknown> = {}
): DocumentContext {
  return {
    id,
    title,
    getText: () => editor.getText(),
    getMarkdown: () => {
      // Simple JSON-to-markdown conversion from the editor's document tree
      try {
        return jsonToMarkdown(editor.getJSON());
      } catch {
        return editor.getText();
      }
    },
    getJSON: () => editor.getJSON(),
    metadata,
    wordCount: editor.storage.characterCount?.words?.() ?? 0,
  };
}

export function buildSelectionContext(editor: Editor): SelectionContext {
  const { from, to } = editor.state.selection;
  const text = from === to ? "" : editor.state.doc.textBetween(from, to, " ");
  return { text, from, to, isEmpty: from === to };
}

export function buildCommandContext(
  editor: Editor,
  engine: PluginEngineImpl
): CommandContext {
  return {
    insertContent: (content: string) => {
      editor.chain().focus().insertContent(content).run();
    },
    insertBlock: (blockType: string, attrs?: Record<string, unknown>) => {
      editor
        .chain()
        .focus()
        .insertContent({ type: blockType, attrs: attrs || {} })
        .run();
    },
    openPanel: (panelId: string) => {
      engine.openPanel(panelId);
    },
    document: buildDocumentContext(editor),
    ai: engine.ai,
  };
}

export function buildToolbarContext(
  editor: Editor,
  engine: PluginEngineImpl
): ToolbarContext {
  return {
    document: buildDocumentContext(editor),
    selection: buildSelectionContext(editor),
    ai: engine.ai,
    insertContent: (content: string) => {
      editor.chain().focus().insertContent(content).run();
    },
  };
}

// ─── Simple ProseMirror JSON → Markdown converter ────────

interface ProseMirrorNode {
  type: string;
  content?: ProseMirrorNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function jsonToMarkdown(doc: unknown): string {
  const node = doc as ProseMirrorNode;
  if (!node || !node.content) return "";
  return node.content.map((child) => nodeToMd(child)).join("\n\n");
}

function nodeToMd(node: ProseMirrorNode): string {
  switch (node.type) {
    case "paragraph":
      return inlineContent(node);
    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      return "#".repeat(level) + " " + inlineContent(node);
    }
    case "bulletList":
      return (node.content || [])
        .map((item) => "- " + inlineContent(item.content?.[0] || item))
        .join("\n");
    case "orderedList":
      return (node.content || [])
        .map(
          (item, i) =>
            `${i + 1}. ` + inlineContent(item.content?.[0] || item)
        )
        .join("\n");
    case "taskList":
      return (node.content || [])
        .map((item) => {
          const checked = item.attrs?.checked ? "x" : " ";
          return `- [${checked}] ` + inlineContent(item.content?.[0] || item);
        })
        .join("\n");
    case "blockquote":
      return (node.content || [])
        .map((child) => "> " + nodeToMd(child))
        .join("\n");
    case "codeBlock": {
      const lang = (node.attrs?.language as string) || "";
      return "```" + lang + "\n" + (node.content?.map((c) => c.text || "").join("") || "") + "\n```";
    }
    case "horizontalRule":
      return "---";
    case "image": {
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      return `![${alt}](${src})`;
    }
    case "hardBreak":
      return "  \n";
    default:
      return inlineContent(node);
  }
}

function inlineContent(node: ProseMirrorNode): string {
  if (!node.content) return node.text || "";
  return node.content.map((child) => inlineNode(child)).join("");
}

function inlineNode(node: ProseMirrorNode): string {
  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
          case "strong":
            text = `**${text}**`;
            break;
          case "italic":
          case "em":
            text = `*${text}*`;
            break;
          case "strike":
            text = `~~${text}~~`;
            break;
          case "code":
            text = "`" + text + "`";
            break;
          case "link":
            text = `[${text}](${mark.attrs?.href || ""})`;
            break;
        }
      }
    }
    return text;
  }
  if (node.type === "hardBreak") return "  \n";
  return inlineContent(node);
}
