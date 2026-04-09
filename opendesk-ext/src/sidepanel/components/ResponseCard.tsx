interface ResponseCardProps {
  response: string;
  onReplace: () => void;
  onInsert: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}

export function ResponseCard({ response, onReplace, onInsert, onCopy, onDismiss }: ResponseCardProps) {
  return (
    <div className="response-card">
      <div className="response-card-header">
        <span className="response-card-title">AI Response</span>
        <button className="response-card-dismiss" onClick={onDismiss} title="Dismiss">
          &times;
        </button>
      </div>
      <div className="response-card-body">{response}</div>
      <div className="response-card-actions">
        <button className="response-action-btn" onClick={onCopy}>
          Copy
        </button>
        <button className="response-action-btn" onClick={onInsert}>
          Insert
        </button>
        <button className="response-action-btn primary" onClick={onReplace}>
          Replace
        </button>
      </div>
    </div>
  );
}
