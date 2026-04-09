import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { SidebarApp } from "../sidebar/App";
import type { EditorAdapter } from "./adapters/types";
import sidebarStyles from "../styles/sidebar.css?inline";

export function injectSidebar(adapter: EditorAdapter) {
  // Prevent double injection
  if (document.getElementById("opendesk-sidebar-root")) {
    console.log("[OpenDesk] Sidebar already injected");
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "opendesk-sidebar-root";
  container.style.cssText = "all: initial; position: fixed; top: 0; right: 0; z-index: 10000; height: 100vh;";
  document.body.appendChild(container);

  // Shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: "open" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = sidebarStyles;
  shadow.appendChild(style);

  // Mount point
  const mount = document.createElement("div");
  mount.id = "opendesk-mount";
  shadow.appendChild(mount);

  // Render React sidebar
  const root = createRoot(mount);
  root.render(createElement(SidebarApp, { adapter }));

  console.log("[OpenDesk] Sidebar injected");
}
