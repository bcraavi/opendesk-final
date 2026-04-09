/**
 * AI Writing Assistant Plugin — Ships with OpenDesk Core
 * Provides base AI actions: improve, summarize, expand, simplify, etc.
 */

import type { OpenDeskPlugin } from "../../engine/plugins/types";

const ACTIONS = [
  { id: "improve", label: "Improve Writing", icon: "✨", prompt: "Improve the writing quality, grammar, clarity, and flow. Return only the improved text." },
  { id: "summarize", label: "Summarize", icon: "📝", prompt: "Summarize concisely. Return only the summary." },
  { id: "expand", label: "Expand", icon: "📖", prompt: "Expand with more detail and depth. Return only the expanded text." },
  { id: "simplify", label: "Simplify", icon: "🎯", prompt: "Simplify to be clearer. Return only the simplified text." },
  { id: "fix-grammar", label: "Fix Grammar", icon: "🔧", prompt: "Fix all grammar and spelling errors. Return only the corrected text." },
  { id: "formal-tone", label: "Make Formal", icon: "👔", prompt: "Rewrite in professional tone. Return only the rewritten text." },
  { id: "casual-tone", label: "Make Casual", icon: "💬", prompt: "Rewrite in casual tone. Return only the rewritten text." },
  { id: "to-bullets", label: "To Bullets", icon: "📋", prompt: "Convert into clear bullet points. Return only the bullets." },
  { id: "continue-writing", label: "Continue", icon: "➡️", prompt: "Continue writing from where this leaves off, matching style. Return only the continuation." },
];

const plugin: OpenDeskPlugin = {
  name: "ai-writing-assistant",
  version: "1.0.0",
  displayName: "AI Writing Assistant",
  description: "Core AI writing tools: improve, summarize, expand, simplify, and more",
  icon: "✨",
  author: "OpenDesk",

  setup(engine) {
    // Register each action as an AI pipeline
    for (const action of ACTIONS) {
      engine.registerAIPipeline({
        id: `ai-write-${action.id}`,
        label: action.label,
        icon: action.icon,
        showInSidebar: true,
        showInContextMenu: true,
        process: async (text, ai) => {
          return ai.complete({
            system: "You are a writing assistant. Be direct — return only the requested output.",
            prompt: `${action.prompt}\n\n---\n\n${text}`,
          });
        },
      });
    }

    // Register slash commands for common actions
    engine.registerSlashCommand({
      name: "ai",
      label: "AI Assistant",
      description: "Open AI writing assistant",
      icon: "✨",
      keywords: ["ai", "write", "improve", "fix"],
      action: (ctx) => ctx.openPanel("ai-assistant"),
    });

    // Register sidebar panel
    engine.registerSidebarPanel({
      id: "ai-assistant",
      title: "AI Assistant",
      icon: "✨",
      width: 280,
      component: null, // React component — implemented in UI layer
    });

    // Register keyboard shortcut
    engine.registerKeyboardShortcut({
      keys: "Ctrl+J",
      description: "Toggle AI Assistant panel",
      action: () => {
        // Toggle handled by engine
      },
    });
  },
};

export default plugin;
