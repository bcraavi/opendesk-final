/**
 * TipTap extension factories — maps the plugin API to TipTap primitives.
 *
 * - createBlockExtension: BlockTypeConfig → TipTap Node
 * - createSlashCommandExtension: SlashCommandConfig[] → TipTap Extension (Suggestion)
 * - createKeyboardShortcutExtension: KeyboardShortcutConfig[] → TipTap Extension
 * - createBridgeExtension: PluginEngineImpl → TipTap Extension (onUpdate/onSelectionUpdate)
 * - getBaseExtensions: all built-in TipTap extensions
 */

import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Suggestion } from "@tiptap/suggestion";
import { createElement } from "react";
import type {
  BlockTypeConfig,
  BlockProps,
  SlashCommandConfig,
  KeyboardShortcutConfig,
} from "../plugins/types.js";
import type { PluginEngineImpl } from "../plugins/runtime.js";
import { buildDocumentContext, buildCommandContext } from "./context.js";

// ─── Base Extensions ─────────────────────────────────────

export function getBaseExtensions(options?: {
  placeholder?: string;
}): Extension[] {
  return [
    StarterKit.configure({
      codeBlock: false, // use code-block-lowlight instead if needed
    }) as unknown as Extension,
    Placeholder.configure({
      placeholder: options?.placeholder || "Start writing...",
    }) as unknown as Extension,
    Image as unknown as Extension,
    Table.configure({ resizable: true }) as unknown as Extension,
    TableRow as unknown as Extension,
    TableCell as unknown as Extension,
    TableHeader as unknown as Extension,
    TaskList as unknown as Extension,
    TaskItem.configure({ nested: true }) as unknown as Extension,
    CharacterCount as unknown as Extension,
  ];
}

// ─── Dynamic Block Extensions ────────────────────────────

export function createBlockExtension(config: BlockTypeConfig): Node {
  return Node.create({
    name: config.name,
    group: "block",
    atom: !config.editable,
    content: config.editable ? "inline*" : undefined,
    draggable: true,
    selectable: true,

    addAttributes() {
      const attrs: Record<string, { default: unknown }> = {};
      if (config.defaultAttrs) {
        for (const [key, value] of Object.entries(config.defaultAttrs)) {
          attrs[key] = { default: value };
        }
      }
      return attrs;
    },

    parseHTML() {
      return [{ tag: `div[data-type="${config.name}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": config.name }),
        config.editable ? 0 : "",
      ];
    },

    addNodeView() {
      if (!config.render) return undefined as any;

      const RenderComponent = config.render;
      const WrappedComponent = (props: any) => {
        const blockProps: BlockProps = {
          attrs: props.node.attrs,
          updateAttrs: props.updateAttributes,
          selected: props.selected,
        };
        // NodeViewWrapper is imported by the consumer — we use a simple div wrapper here
        return createElement(
          "div",
          { "data-node-view-wrapper": "", style: { position: "relative" } },
          createElement(RenderComponent, blockProps)
        );
      };
      WrappedComponent.displayName = `PluginBlock(${config.name})`;

      return ReactNodeViewRenderer(WrappedComponent);
    },
  });
}

// ─── Slash Command Extension ─────────────────────────────

export interface SlashCommandSuggestionCallbacks {
  onStart: (props: { items: SlashCommandConfig[]; clientRect: (() => DOMRect) | null }) => void;
  onUpdate: (props: { items: SlashCommandConfig[]; clientRect: (() => DOMRect) | null }) => void;
  onExit: () => void;
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

let _suggestionCallbacks: SlashCommandSuggestionCallbacks | null = null;

export function setSlashMenuCallbacks(callbacks: SlashCommandSuggestionCallbacks): void {
  _suggestionCallbacks = callbacks;
}

export function createSlashCommandExtension(
  commands: readonly SlashCommandConfig[]
): Extension {
  return Extension.create({
    name: "slashCommands",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          items: ({ query }: { query: string }) => {
            const q = query.toLowerCase();
            return commands.filter(
              (cmd) =>
                cmd.name.toLowerCase().includes(q) ||
                cmd.label.toLowerCase().includes(q) ||
                cmd.keywords?.some((k) => k.toLowerCase().includes(q))
            );
          },
          render: () => {
            return {
              onStart: (props: any) => {
                _suggestionCallbacks?.onStart({
                  items: props.items,
                  clientRect: props.clientRect,
                });
              },
              onUpdate: (props: any) => {
                _suggestionCallbacks?.onUpdate({
                  items: props.items,
                  clientRect: props.clientRect,
                });
              },
              onExit: () => {
                _suggestionCallbacks?.onExit();
              },
              onKeyDown: (props: any) => {
                return _suggestionCallbacks?.onKeyDown({ event: props.event }) ?? false;
              },
            };
          },
          command: ({
            editor,
            range,
            props: cmd,
          }: {
            editor: any;
            range: any;
            props: any;
          }) => {
            // Delete the /query text
            editor.chain().focus().deleteRange(range).run();
            // Execute the slash command action
            const engine = (editor as any).__opendeskEngine as PluginEngineImpl | undefined;
            if (engine) {
              const context = buildCommandContext(editor, engine);
              (cmd as SlashCommandConfig).action(context);
            }
          },
        }),
      ];
    },
  });
}

// ─── Keyboard Shortcut Extension ─────────────────────────

function convertKeyCombo(keys: string): string {
  return keys
    .replace(/Ctrl/gi, "Mod")
    .replace(/\+/g, "-")
    .replace(/Shift/gi, "Shift")
    .replace(/Alt/gi, "Alt")
    .split("-")
    .map((part, i, arr) =>
      i === arr.length - 1 ? part.toLowerCase() : part
    )
    .join("-");
}

export function createKeyboardShortcutExtension(
  shortcuts: readonly KeyboardShortcutConfig[]
): Extension {
  return Extension.create({
    name: "pluginKeyboardShortcuts",

    addKeyboardShortcuts() {
      const map: Record<string, () => boolean> = {};
      for (const shortcut of shortcuts) {
        const tiptapKey = convertKeyCombo(shortcut.keys);
        map[tiptapKey] = () => {
          const docContext = buildDocumentContext(this.editor);
          shortcut.action(docContext);
          return true;
        };
      }
      return map;
    },
  });
}

// ─── Bridge Extension (onUpdate/onSelectionUpdate) ───────

export function createBridgeExtension(engine: PluginEngineImpl): Extension {
  return Extension.create({
    name: "openDeskBridge",

    onUpdate() {
      engine.notifyDocumentChange();
    },

    onSelectionUpdate() {
      engine.notifySelectionChange();
    },

    onCreate() {
      // Store engine reference on the editor for slash commands to access
      (this.editor as any).__opendeskEngine = engine;
    },
  });
}
