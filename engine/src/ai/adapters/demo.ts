import type { AICompletionParams } from "../../plugins/types.js";
import type { AIAdapter } from "../provider.js";

/**
 * Demo adapter — returns canned responses when no LLM is configured.
 * Allows the editor to function in demo mode without an API key.
 */
export class DemoAdapter implements AIAdapter {
  async complete(params: AICompletionParams): Promise<string> {
    // Simulate a small delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const text = params.prompt.slice(0, 300);
    const prompt = params.prompt.toLowerCase();

    if (prompt.includes("summarize")) {
      return `Summary: ${text.split(".").slice(0, 2).join(". ").trim()}.\n\n[Demo mode — connect an LLM in Settings for real AI]`;
    }
    if (prompt.includes("expand")) {
      return `${text}\n\nFurthermore, this deserves deeper exploration. The implications extend beyond the immediate context, touching on broader themes worth examining.\n\n[Demo mode — connect an LLM in Settings for real AI]`;
    }
    if (prompt.includes("simplify")) {
      return `${text.split(".").slice(0, 2).join(". ").trim()}.\n\n[Simplified — Demo mode]`;
    }
    if (prompt.includes("formal")) {
      return `I would like to bring the following to your attention:\n\n${text}\n\n[Formal tone — Demo mode]`;
    }
    if (prompt.includes("casual")) {
      return `So basically — ${text.toLowerCase().replace(/\.$/, "")}!\n\n[Casual tone — Demo mode]`;
    }
    if (prompt.includes("bullet")) {
      return text
        .split(/[.!?]+/)
        .filter((s) => s.trim())
        .map((s) => `- ${s.trim()}`)
        .join("\n") + "\n\n[Demo mode]";
    }
    if (prompt.includes("continue")) {
      return `\n\nBuilding on this, the next step involves examining how these concepts apply in practice. Real-world usage reveals both challenges and opportunities.\n\n[Demo mode — connect an LLM in Settings for real AI]`;
    }
    if (prompt.includes("grammar") || prompt.includes("fix")) {
      return text.charAt(0).toUpperCase() + text.slice(1).replace(/\s{2,}/g, " ").trim() + ".\n\n[Demo mode]";
    }

    // Default: "improve"
    return (
      text.charAt(0).toUpperCase() +
      text.slice(1).replace(/\s+/g, " ").trim() +
      (text.endsWith(".") ? "" : ".") +
      "\n\n[Demo mode — connect an LLM in Settings for real AI]"
    );
  }
}
