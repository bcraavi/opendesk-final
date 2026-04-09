/**
 * OpenDeskProvider — React context that orchestrates plugin loading + editor init.
 *
 * Usage:
 *   <OpenDeskProvider plugins={[readingTime, aiAssistant]} config={{ ai: { ... } }}>
 *     <OpenDeskEditor />
 *     <OpenDeskToolbar />
 *     <OpenDeskSidebar />
 *   </OpenDeskProvider>
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/core";
import {
  OpenDeskEditor as OpenDeskEditorCore,
  type OpenDeskConfig,
} from "../core/editor.js";
import type { PluginEngineImpl } from "../plugins/runtime.js";
import type { AIProviderImpl } from "../ai/provider.js";
import type { OpenDeskPlugin } from "../plugins/types.js";

interface OpenDeskContextValue {
  editor: Editor | null;
  engine: PluginEngineImpl;
  aiProvider: AIProviderImpl;
  core: OpenDeskEditorCore;
  ready: boolean;
  activePanel: string | null;
  setActivePanel: (panelId: string | null) => void;
}

const OpenDeskContext = createContext<OpenDeskContextValue | null>(null);

export function useOpenDesk(): OpenDeskContextValue {
  const ctx = useContext(OpenDeskContext);
  if (!ctx) throw new Error("useOpenDesk must be used within <OpenDeskProvider>");
  return ctx;
}

export function useEditor(): Editor | null {
  return useOpenDesk().editor;
}

export function usePluginEngine(): PluginEngineImpl {
  return useOpenDesk().engine;
}

export function useAI(): AIProviderImpl {
  return useOpenDesk().aiProvider;
}

interface OpenDeskProviderProps {
  plugins?: OpenDeskPlugin[];
  config?: OpenDeskConfig;
  children: ReactNode;
}

export function OpenDeskProvider({
  plugins = [],
  config = {},
  children,
}: OpenDeskProviderProps) {
  const [core] = useState(() => new OpenDeskEditorCore(config));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [ready, setReady] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Wire up the panel open callback
  const handleOpenPanel = useCallback((panelId: string) => {
    setActivePanel(panelId);
  }, []);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      // Phase 1: Load plugins
      await core.loadPlugins(plugins);

      if (destroyed) return;

      // Wire up panel callback before initialize
      core.getPluginEngine().setOpenPanelCallback(handleOpenPanel);

      // Phase 2: Initialize editor
      const ed = core.initialize();

      if (destroyed) {
        ed.destroy();
        return;
      }

      setEditor(ed);
      setReady(true);
    }

    init();

    return () => {
      destroyed = true;
      core.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OpenDeskContext.Provider
      value={{
        editor,
        engine: core.getPluginEngine(),
        aiProvider: core.getAIProvider(),
        core,
        ready,
        activePanel,
        setActivePanel,
      }}
    >
      {children}
    </OpenDeskContext.Provider>
  );
}
