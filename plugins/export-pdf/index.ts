/**
 * Export PDF Plugin — Example OpenDesk Plugin
 * Registers a PDF export format using the browser's print API.
 */

import type { OpenDeskPlugin } from "../../engine/src/plugins/types";

const plugin: OpenDeskPlugin = {
  name: "export-pdf",
  version: "1.0.0",
  displayName: "Export PDF",
  description: "Export documents as PDF using the browser print dialog",
  icon: "📄",
  author: "OpenDesk",

  setup(engine) {
    engine.registerExportFormat({
      id: "pdf",
      label: "PDF",
      extension: "pdf",
      mimeType: "application/pdf",
      icon: "📄",
      convert: async (doc) => {
        // Generate a clean HTML document for printing
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 700px;
      margin: 40px auto;
      padding: 0 20px;
      line-height: 1.8;
      color: #333;
      font-size: 14px;
    }
    h1 { font-size: 1.8em; margin-top: 1em; }
    h2 { font-size: 1.4em; margin-top: 1.2em; }
    h3 { font-size: 1.2em; margin-top: 1em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; padding-left: 16px; color: #666; font-style: italic; }
    @media print { body { margin: 0; padding: 20px; } }
  </style>
</head>
<body>${doc.getMarkdown()}</body>
</html>`;
        return new Blob([html], { type: "text/html" });
      },
    });

    engine.registerSlashCommand({
      name: "export-pdf",
      label: "Export as PDF",
      description: "Export the current document as PDF",
      icon: "📄",
      keywords: ["pdf", "export", "print", "download"],
      action: async () => {
        // Trigger browser print dialog as a simple PDF export
        if (typeof window !== "undefined") {
          window.print();
        }
      },
    });
  },
};

export default plugin;
