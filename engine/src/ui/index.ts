/**
 * @opendesk/engine/react — React UI components for OpenDesk.
 */

export {
  OpenDeskProvider,
  useOpenDesk,
  useEditor,
  usePluginEngine,
  useAI,
} from "./OpenDeskProvider.js";
export { OpenDeskEditorView } from "./Editor.js";
export { OpenDeskToolbar } from "./Toolbar.js";
export { OpenDeskSidebar } from "./Sidebar.js";
export { SlashMenu } from "./SlashMenu.js";

// Preserve Tiptap's command augmentations in the bundled public declarations.
export type { StarterKitOptions } from "@tiptap/starter-kit";
export type { TaskListOptions } from "@tiptap/extension-task-list";
export type { ImageOptions } from "@tiptap/extension-image";
export type { TableOptions } from "@tiptap/extension-table";
