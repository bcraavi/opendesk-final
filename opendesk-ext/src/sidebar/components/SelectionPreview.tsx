import type { SelectionInfo } from "../../content-scripts/adapters/types";

interface SelectionPreviewProps {
  selection: SelectionInfo;
}

export function SelectionPreview({ selection }: SelectionPreviewProps) {
  if (selection.isEmpty) {
    return (
      <div className="selection-empty">
        <div className="selection-empty-icon">&#9998;</div>
        <div>Select text in your document to use AI actions</div>
      </div>
    );
  }

  const wordCount = selection.text.split(/\s+/).filter(Boolean).length;
  const truncated = selection.text.length > 200
    ? selection.text.slice(0, 200) + "..."
    : selection.text;

  return (
    <div className="selection-preview">
      <div className="selection-preview-label">Selected Text</div>
      <div className="selection-preview-text">{truncated}</div>
      <div className="selection-preview-meta">{wordCount} words</div>
    </div>
  );
}
