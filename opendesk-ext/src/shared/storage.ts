import { DEFAULT_SETTINGS, type ExtensionSettings } from "./types";

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => resolve());
  });
}
