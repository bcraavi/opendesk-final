import { createContext } from "react";
import type { EditorAdapter } from "../content-scripts/adapters/types";
import type { ExtensionSettings } from "../shared/types";
import type { ExtensionAIProvider } from "../ai/ext-provider";

export const AdapterContext = createContext<EditorAdapter | null>(null);
export const SettingsContext = createContext<ExtensionSettings | null>(null);
export const AIProviderContext = createContext<ExtensionAIProvider | null>(null);
