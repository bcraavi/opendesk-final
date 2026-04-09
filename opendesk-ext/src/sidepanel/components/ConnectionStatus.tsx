interface ConnectionStatusProps {
  connected: boolean;
  editor: string;
}

export function ConnectionStatus({ connected, editor }: ConnectionStatusProps) {
  if (connected) {
    return (
      <div className="connection-status connected">
        <span className="status-dot active" />
        <span>Connected to {editor === "google-docs" ? "Google Docs" : editor}</span>
      </div>
    );
  }

  return (
    <div className="connection-status disconnected">
      <span className="status-dot" />
      <span>Open a Google Doc to get started</span>
    </div>
  );
}
