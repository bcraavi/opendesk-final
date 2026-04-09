import { useState, useEffect, useCallback } from "react";
import type { EditorAdapter, SelectionInfo } from "../content-scripts/adapters/types";
import type { ExtensionSettings } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/types";
import { ExtensionAIProvider } from "../ai/ext-provider";
import { AdapterContext, SettingsContext, AIProviderContext } from "./context";
import { SidebarHeader } from "./components/SidebarHeader";
import { TabBar, type TabId } from "./components/TabBar";
import { AIPanel } from "./panels/AIPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

interface SidebarAppProps {
  adapter: EditorAdapter;
}

const aiProvider = new ExtensionAIProvider();

export function SidebarApp({ adapter }: SidebarAppProps) {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ai");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selection, setSelection] = useState<SelectionInfo>({ text: "", isEmpty: true });

  // Load settings on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response?.payload) {
        const s = response.payload as ExtensionSettings;
        setSettings(s);
        aiProvider.setSettings(s);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });
  }, []);

  // Listen for selection changes in the document
  useEffect(() => {
    return adapter.onSelectionChange(() => {
      const sel = adapter.getSelection();
      setSelection(sel);
    });
  }, [adapter]);

  const handleSaveSettings = useCallback((newSettings: ExtensionSettings) => {
    setSettings(newSettings);
    aiProvider.setSettings(newSettings);
  }, []);

  if (isCollapsed) {
    return (
      <button
        className="opendesk-collapsed-tab"
        onClick={() => setIsCollapsed(false)}
      >
        OpenDesk
      </button>
    );
  }

  return (
    <AdapterContext.Provider value={adapter}>
      <SettingsContext.Provider value={settings}>
        <AIProviderContext.Provider value={aiProvider}>
          <div className="opendesk-sidebar">
            <SidebarHeader onCollapse={() => setIsCollapsed(true)} />
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === "ai" && <AIPanel selection={selection} />}
            {activeTab === "settings" && (
              <SettingsPanel settings={settings} onSave={handleSaveSettings} />
            )}
          </div>
        </AIProviderContext.Provider>
      </SettingsContext.Provider>
    </AdapterContext.Provider>
  );
}
