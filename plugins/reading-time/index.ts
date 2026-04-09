/**
 * Reading Time Plugin — Example OpenDesk Plugin
 * Shows estimated reading time in the toolbar.
 */

import type { OpenDeskPlugin } from "../../engine/plugins/types";

const plugin: OpenDeskPlugin = {
  name: "reading-time",
  version: "1.0.0",
  displayName: "Reading Time",
  description: "Shows estimated reading time in the toolbar",
  icon: "⏱️",
  author: "OpenDesk",

  setup(engine) {
    engine.registerToolbarItem({
      id: "reading-time",
      icon: "⏱️",
      tooltip: "Estimated reading time",
      position: "right",
      render: (doc) => {
        const words = doc.wordCount;
        const minutes = Math.max(1, Math.ceil(words / 200));
        return `${minutes} min read`;
      },
    });
  },
};

export default plugin;
