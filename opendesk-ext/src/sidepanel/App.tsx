import { useState, useEffect, useCallback, useRef } from "react";
import { DEFAULT_SETTINGS, type ExtensionSettings } from "../shared/types";
import * as bridge from "./bridge";
import { SidebarHeader } from "./components/SidebarHeader";
import { TabBar, type TabId } from "./components/TabBar";
import { AIPanel } from "./panels/AIPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { ConnectionStatus } from "./components/ConnectionStatus";

export function SidebarApp() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ai");
  const [selection, setSelection] = useState<{ text: string; isEmpty: boolean }>({ text: "", isEmpty: true });
  const [connected, setConnected] = useState(false);
  const [editorType, setEditorType] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load settings
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response?.payload) {
        setSettings(response.payload);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });
  }, []);

  // Poll for connection + selection (side panel can't use DOM events directly)
  useEffect(() => {
    async function poll() {
      const status = await bridge.ping();
      setConnected(status.connected);
      setEditorType(status.editor);

      if (status.connected) {
        const sel = await bridge.getSelection();
        setSelection(sel);
      }
    }

    poll(); // Initial check
    pollingRef.current = setInterval(poll, 1000); // Poll every second

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSaveSettings = useCallback((newSettings: ExtensionSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <div className="sidepanel">
      <SidebarHeader />
      <ConnectionStatus connected={connected} editor={editorType} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="panel-scroll">
        {activeTab === "ai" && (
          <AIPanel selection={selection} connected={connected} />
        )}
        {activeTab === "settings" && (
          <SettingsPanel settings={settings} onSave={handleSaveSettings} />
        )}
      </div>
    </div>
  );
}
