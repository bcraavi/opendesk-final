/**
 * Word Count Plugin — Example OpenDesk Plugin
 * Shows word count in the toolbar.
 */

import type { OpenDeskPlugin } from "../../engine/src/plugins/types";

const plugin: OpenDeskPlugin = {
  name: "word-count",
  version: "1.0.0",
  displayName: "Word Count",
  description: "Shows word count in the toolbar",
  icon: "📊",
  author: "OpenDesk",

  setup(engine) {
    engine.registerToolbarItem({
      id: "word-count",
      icon: "📊",
      tooltip: "Word count",
      position: "right",
      render: (doc) => {
        const count = doc.wordCount;
        return `${count} ${count === 1 ? "word" : "words"}`;
      },
    });
  },
};

export default plugin;
