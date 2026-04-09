import type { EditorAdapter, SelectionInfo } from "./types";

// ─── Google Docs DOM Selectors ──────────────────────────
// Centralized here for easy maintenance when Google changes their DOM.

const SELECTORS = {
  /** The main editor view container */
  editorContainer: ".kix-appview-editor",
  /** Individual paragraph renderers containing text */
  paragraphs: ".kix-paragraphrenderer",
  /** The page container */
  page: ".kix-page",
  /** Document title input */
  titleInput: ".docs-title-input",
  /** The editor canvas area (where text is rendered) */
  canvas: ".kix-canvas-tile-content",
  /** Contenteditable element for input */
  contentEditable: "[contenteditable='true']",
} as const;

class GoogleDocsAdapter implements EditorAdapter {
  getDocumentText(): string {
    const paragraphs = document.querySelectorAll(SELECTORS.paragraphs);
    if (paragraphs.length === 0) {
      // Fallback: try getting text from the editor container
      const editor = document.querySelector(SELECTORS.editorContainer);
      return editor?.textContent?.trim() || "";
    }

    const lines: string[] = [];
    paragraphs.forEach((p) => {
      lines.push(p.textContent || "");
    });
    return lines.join("\n");
  }

  getDocumentTitle(): string {
    const titleEl = document.querySelector(SELECTORS.titleInput);
    if (titleEl) {
      return (titleEl as HTMLInputElement).value || titleEl.textContent || "";
    }
    // Fallback: parse from page title ("Document Title - Google Docs")
    const pageTitle = document.title;
    return pageTitle.replace(/ - Google Docs$/, "").trim();
  }

  getDocumentId(): string {
    // URL format: /document/d/{docId}/edit
    const match = window.location.pathname.match(/\/document\/d\/([^/]+)/);
    return match?.[1] || "";
  }

  getSelection(): SelectionInfo {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return { text: "", isEmpty: true };
    }
    return {
      text: selection.toString(),
      isEmpty: false,
    };
  }

  insertText(text: string): void {
    this.focus();

    // Use execCommand which Google Docs' contenteditable layer listens to
    // This is deprecated but still works in Chrome and is the most reliable
    // way to programmatically insert text into Google Docs
    const success = document.execCommand("insertText", false, text);

    if (!success) {
      // Fallback: clipboard-based insertion
      this._insertViaClipboard(text);
    }
  }

  replaceSelection(text: string): void {
    const selection = this.getSelection();
    if (selection.isEmpty) {
      // No selection — just insert
      this.insertText(text);
      return;
    }

    this.focus();

    // insertText with active selection replaces it
    const success = document.execCommand("insertText", false, text);
    if (!success) {
      this._insertViaClipboard(text);
    }
  }

  onSelectionChange(callback: () => void): () => void {
    const handler = () => callback();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }

  onContentChange(callback: () => void): () => void {
    const editor = document.querySelector(SELECTORS.editorContainer);
    if (!editor) {
      console.warn("[OpenDesk] Editor container not found for content observation");
      return () => {};
    }

    const observer = new MutationObserver(() => callback());
    observer.observe(editor, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }

  getSidebarAnchor(): HTMLElement {
    return (
      (document.querySelector(SELECTORS.editorContainer) as HTMLElement) ||
      document.body
    );
  }

  focus(): void {
    // Find the contenteditable element and focus it
    const editable = document.querySelector(SELECTORS.contentEditable) as HTMLElement;
    if (editable) {
      editable.focus();
    } else {
      // Fallback: click on the editor area
      const editor = document.querySelector(SELECTORS.editorContainer) as HTMLElement;
      editor?.click();
    }
  }

  private _insertViaClipboard(text: string): void {
    // Save current clipboard, write our text, paste, restore
    navigator.clipboard.writeText(text).then(() => {
      document.execCommand("paste");
    });
  }
}

export function createGoogleDocsAdapter(): EditorAdapter {
  return new GoogleDocsAdapter();
}
