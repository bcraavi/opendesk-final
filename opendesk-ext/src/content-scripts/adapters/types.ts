export interface EditorAdapter {
  /** Get the full document text */
  getDocumentText(): string;

  /** Get the document title */
  getDocumentTitle(): string;

  /** Get the document ID (from URL) */
  getDocumentId(): string;

  /** Get currently selected text */
  getSelection(): SelectionInfo;

  /** Insert text at the current cursor position */
  insertText(text: string): void;

  /** Replace the current selection with new text */
  replaceSelection(text: string): void;

  /** Listen for selection changes, returns unsubscribe function */
  onSelectionChange(callback: () => void): () => void;

  /** Listen for content changes, returns unsubscribe function */
  onContentChange(callback: () => void): () => void;

  /** Get the element to anchor the sidebar next to */
  getSidebarAnchor(): HTMLElement;

  /** Focus the editor (needed before insertText) */
  focus(): void;
}

export interface SelectionInfo {
  text: string;
  isEmpty: boolean;
}
