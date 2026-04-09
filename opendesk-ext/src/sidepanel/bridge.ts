/**
 * Bridge — Side panel uses this to communicate with the content script
 * running on the active Google Docs tab.
 */

import type { ContentScriptMessage, ContentScriptResponse } from "../shared/types";

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function sendToContentScript(message: ContentScriptMessage): Promise<ContentScriptResponse> {
  const tabId = await getActiveTabId();
  if (!tabId) {
    return { type: "ERROR", payload: "No active tab found" } as ContentScriptResponse;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ type: "ERROR", payload: chrome.runtime.lastError.message || "Content script not available" } as ContentScriptResponse);
        return;
      }
      resolve(response);
    });
  });
}

export async function ping(): Promise<{ connected: boolean; editor: string }> {
  const response = await sendToContentScript({ type: "PING" });
  if (response.type === "PONG") {
    return { connected: true, editor: response.payload.editor };
  }
  return { connected: false, editor: "" };
}

export async function getSelection(): Promise<{ text: string; isEmpty: boolean }> {
  const response = await sendToContentScript({ type: "GET_SELECTION" });
  if (response.type === "SELECTION") {
    return response.payload;
  }
  return { text: "", isEmpty: true };
}

export async function getDocumentText(): Promise<string> {
  const response = await sendToContentScript({ type: "GET_DOCUMENT_TEXT" });
  if (response.type === "DOCUMENT_TEXT") {
    return response.payload;
  }
  return "";
}

export async function getDocumentInfo(): Promise<{ id: string; title: string }> {
  const response = await sendToContentScript({ type: "GET_DOCUMENT_INFO" });
  if (response.type === "DOCUMENT_INFO") {
    return response.payload;
  }
  return { id: "", title: "" };
}

export async function insertText(text: string): Promise<boolean> {
  const response = await sendToContentScript({ type: "INSERT_TEXT", payload: text });
  return response.type === "INSERT_DONE";
}

export async function replaceSelection(text: string): Promise<boolean> {
  const response = await sendToContentScript({ type: "REPLACE_SELECTION", payload: text });
  return response.type === "REPLACE_DONE";
}
