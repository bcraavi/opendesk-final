import type { OpenDeskPlugin } from "../runtime";

const ACTIONS = [
  { id: "improve", label: "Improve Writing", icon: "\u2728", prompt: "Improve the writing quality, grammar, clarity, and flow. Return only the improved text." },
  { id: "summarize", label: "Summarize", icon: "\ud83d\udcdd", prompt: "Summarize concisely. Return only the summary." },
  { id: "expand", label: "Expand", icon: "\ud83d\udcd6", prompt: "Expand with more detail and depth. Return only the expanded text." },
  { id: "simplify", label: "Simplify", icon: "\ud83c\udfaf", prompt: "Simplify to be clearer. Return only the simplified text." },
  { id: "fix-grammar", label: "Fix Grammar", icon: "\ud83d\udd27", prompt: "Fix all grammar and spelling errors. Return only the corrected text." },
  { id: "formal-tone", label: "Make Formal", icon: "\ud83d\udc54", prompt: "Rewrite in professional tone. Return only the rewritten text." },
  { id: "casual-tone", label: "Make Casual", icon: "\ud83d\udcac", prompt: "Rewrite in casual tone. Return only the rewritten text." },
  { id: "to-bullets", label: "To Bullets", icon: "\ud83d\udccb", prompt: "Convert into clear bullet points. Return only the bullets." },
  { id: "continue-writing", label: "Continue", icon: "\u27a1\ufe0f", prompt: "Continue writing from where this leaves off, matching style. Return only the continuation." },
];

const aiAssistantPlugin: OpenDeskPlugin = {
  name: "ai-writing-assistant",
  version: "1.0.0",
  displayName: "AI Writing Assistant",
  description: "Core AI writing tools: improve, summarize, expand, simplify, and more",
  icon: "\u2728",

  setup(engine) {
    for (const action of ACTIONS) {
      engine.registerAIPipeline({
        id: `ai-write-${action.id}`,
        label: action.label,
        icon: action.icon,
        showInSidebar: true,
        showInContextMenu: true,
        process: async (text, ai) => {
          return ai.complete({
            system: "You are a writing assistant. Be direct \u2014 return only the requested output.",
            prompt: `${action.prompt}\n\n---\n\n${text}`,
          });
        },
      });
    }

    engine.registerSlashCommand({
      name: "ai",
      label: "AI Assistant",
      description: "Open AI writing assistant",
      icon: "\u2728",
      keywords: ["ai", "write", "improve", "fix"],
      action: () => {},
    });

    engine.registerKeyboardShortcut({
      keys: "Ctrl+J",
      description: "Toggle AI Assistant panel",
      action: () => {},
    });
  },
};

export default aiAssistantPlugin;
