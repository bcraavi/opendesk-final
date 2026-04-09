/**
 * Content script — runs on Google Docs pages.
 * Acts as a bridge: handles messages from the side panel
 * and interacts with the Google Docs DOM via the adapter.
 */

import { detectEditor } from "./detector";
import { createGoogleDocsAdapter } from "./adapters/google-docs";
import type { EditorAdapter } from "./adapters/types";

// ─── Dedup guard: only run once per page ────────────────
// Google Docs has many frames; `all_frames: false` + this guard ensures single init.

function isTopFrame(): boolean {
  try {
    return window.self === window.top;
  } catch {
    // Cross-origin iframe — window.top access throws SecurityError
    return false;
  }
}

if (!isTopFrame()) {
  // Stop execution entirely in iframes
} else if ((window as any).__opendesk_initialized) {
  console.log("[OpenDesk] Already initialized, skipping duplicate");
} else {
  (window as any).__opendesk_initialized = true;
  init();
}

// ─── Main initialization ────────────────────────────────

function init() {
  let adapter: EditorAdapter | null = null;
  let editorType: string | null = null;

  // Message handler: side panel / background → content script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!adapter) {
      sendResponse({ type: "ERROR", payload: "Editor not ready" });
      return;
    }

    switch (message.type) {
      case "PING":
        sendResponse({ type: "PONG", payload: { editor: editorType || "unknown" } });
        break;

      case "GET_SELECTION":
        sendResponse({ type: "SELECTION", payload: adapter.getSelection() });
        break;

      case "GET_DOCUMENT_TEXT":
        sendResponse({ type: "DOCUMENT_TEXT", payload: adapter.getDocumentText() });
        break;

      case "GET_DOCUMENT_INFO":
        sendResponse({
          type: "DOCUMENT_INFO",
          payload: { id: adapter.getDocumentId(), title: adapter.getDocumentTitle() },
        });
        break;

      case "INSERT_TEXT":
        adapter.insertText(message.payload);
        sendResponse({ type: "INSERT_DONE" });
        break;

      case "REPLACE_SELECTION":
        adapter.replaceSelection(message.payload);
        sendResponse({ type: "REPLACE_DONE" });
        break;

      default:
        // Ignore messages not meant for us (e.g. from background → sidepanel)
        break;
    }
  });

  // Detect and initialize
  (async () => {
    editorType = detectEditor();
    if (!editorType) return;

    console.log(`[OpenDesk] Detected editor: ${editorType}`);

    try {
      await waitForElement(".kix-appview-editor");
      adapter = createGoogleDocsAdapter();
      console.log("[OpenDesk] Content script ready");
    } catch (e) {
      console.error("[OpenDesk] Failed to initialize:", e);
    }
  })();
}

function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`[OpenDesk] Timeout waiting for ${selector}`));
    }, timeout);
  });
}
