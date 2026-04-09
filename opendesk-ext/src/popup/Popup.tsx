import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import type { ExtensionSettings } from "../shared/types";

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isOnGoogleDocs, setIsOnGoogleDocs] = useState(false);

  useEffect(() => {
    // Get settings
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response?.payload) {
        setSettings(response.payload);
      }
    });

    // Check if current tab is Google Docs
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setIsOnGoogleDocs(url.includes("docs.google.com/document"));
    });
  }, []);

  const providerLabel = settings?.provider
    ? settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1)
    : "Not configured";

  return (
    <div>
      <div className="popup-header">
        <div className="popup-logo">O</div>
        <span className="popup-title">OpenDesk</span>
      </div>

      <div className={`popup-status ${isOnGoogleDocs ? "active" : "inactive"}`}>
        {isOnGoogleDocs
          ? "Active on this page"
          : "Open a Google Doc to use OpenDesk"}
      </div>

      <div className="popup-info">
        <strong>Provider:</strong> {providerLabel}
        <br />
        <strong>Model:</strong> {settings?.model || "—"}
        <br />
        {!settings?.apiKey && settings?.provider !== "ollama" && (
          <span style={{ color: "#dc2626" }}>
            No API key set. Configure in the sidebar Settings tab.
          </span>
        )}
      </div>

      <div className="popup-version">OpenDesk v0.1.0</div>
    </div>
  );
}

const root = createRoot(document.getElementById("popup-root")!);
root.render(<Popup />);
