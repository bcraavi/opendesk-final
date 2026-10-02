/**
 * Legal Contract Review Plugin — Example Paid/Vertical Plugin
 *
 * Demonstrates how a developer would build an industry-specific
 * plugin that sells for $29/mo on the OpenDesk marketplace.
 *
 * Features:
 * - AI clause risk analysis
 * - Clause library sidebar
 * - Custom "legal-clause" block type
 * - Contract comparison slash command
 * - Export to redlined DOCX
 */

import type { OpenDeskPlugin } from "../../engine/src/plugins/types";

const RISKY_PATTERNS = [
  { pattern: /indemnif/i, risk: "high", label: "Indemnification clause" },
  { pattern: /limitation of liability/i, risk: "high", label: "Liability limitation" },
  { pattern: /non-compete/i, risk: "medium", label: "Non-compete clause" },
  { pattern: /auto-renew/i, risk: "medium", label: "Auto-renewal" },
  { pattern: /governing law/i, risk: "low", label: "Governing law" },
  { pattern: /force majeure/i, risk: "low", label: "Force majeure" },
  { pattern: /termination for convenience/i, risk: "medium", label: "Termination clause" },
];

const plugin: OpenDeskPlugin = {
  name: "legal-contract-review",
  version: "1.0.0",
  displayName: "Contract Review",
  description: "AI-powered contract analysis, clause library, and risk flagging",
  icon: "⚖️",
  author: "LegalTech Labs",

  setup(engine) {
    // ─── AI Pipeline: Clause Risk Analysis ─────────────
    engine.registerAIPipeline({
      id: "clause-risk-analysis",
      label: "Analyze Clause Risk",
      icon: "🔍",
      description: "Flag risky clauses and suggest alternatives",
      showInSidebar: true,
      showInContextMenu: true,
      process: async (text, ai, doc) => {
        // First: pattern-based quick scan
        const flags = RISKY_PATTERNS.filter(p => p.pattern.test(text));

        // Then: AI deep analysis
        const analysis = await ai.complete({
          system: `You are an experienced contract attorney. Analyze the following clause for:
1. Risk level (High/Medium/Low)
2. Key concerns
3. Suggested alternative language
4. Missing protections

Be specific and actionable. Format as a structured review.`,
          prompt: text,
        });

        const flagSummary = flags.length > 0
          ? `⚠️ Pattern flags: ${flags.map(f => `${f.label} (${f.risk})`).join(", ")}\n\n`
          : "";

        return `${flagSummary}${analysis}`;
      },
    });

    // ─── AI Pipeline: Compare Clauses ──────────────────
    engine.registerAIPipeline({
      id: "clause-comparison",
      label: "Compare with Standard",
      icon: "⚖️",
      showInSidebar: true,
      process: async (text, ai) => {
        return ai.complete({
          system: "You are a contract attorney. Compare this clause against standard market terms. Highlight deviations and assess whether they favor the drafter or the counterparty.",
          prompt: text,
        });
      },
    });

    // ─── Sidebar: Clause Library ───────────────────────
    engine.registerSidebarPanel({
      id: "clause-library",
      title: "Clause Library",
      icon: "📜",
      width: 300,
      component: null, // ClauseLibraryPanel — React component
    });

    // ─── Custom Block: Legal Clause ────────────────────
    engine.registerBlockType({
      name: "legal-clause",
      label: "Legal Clause",
      icon: "§",
      editable: true,
      slashCommand: "/clause",
      defaultAttrs: {
        clauseType: "custom",
        riskLevel: "unreviewed",
        notes: "",
      },
      render: null, // LegalClauseBlock — React component
    });

    // ─── Slash Commands ────────────────────────────────
    engine.registerSlashCommand({
      name: "clause",
      label: "Insert Clause",
      description: "Insert a tracked legal clause block",
      icon: "§",
      keywords: ["clause", "legal", "contract", "section"],
      action: (ctx) => {
        ctx.insertBlock("legal-clause", {
          clauseType: "custom",
          riskLevel: "unreviewed",
        });
      },
    });

    engine.registerSlashCommand({
      name: "review",
      label: "Review Contract",
      description: "AI-review the entire document for risks",
      icon: "🔍",
      keywords: ["review", "analyze", "risk", "contract"],
      action: async (ctx) => {
        const fullText = ctx.document.getText();
        const review = await ctx.ai.complete({
          system: "You are a senior contract attorney. Review this entire contract and provide: 1) Executive summary, 2) Key risks ranked by severity, 3) Missing clauses, 4) Recommended changes. Be thorough but concise.",
          prompt: fullText,
        });
        ctx.openPanel("clause-library");
        // Result displayed in sidebar
      },
    });

    // ─── Export: Redlined DOCX ─────────────────────────
    engine.registerExportFormat({
      id: "redlined-docx",
      label: "Redlined DOCX",
      extension: "docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      icon: "📄",
      convert: async (doc) => {
        // Would generate a DOCX with tracked changes
        // Using docx-js or similar library
        const content = doc.getMarkdown();
        return new Blob([content], { type: "text/plain" });
      },
    });

    // ─── Keyboard Shortcuts ────────────────────────────
    engine.registerKeyboardShortcut({
      keys: "Ctrl+Shift+R",
      description: "Quick review selected clause",
      action: () => {
        // Trigger clause-risk-analysis on selection
      },
    });
  },
};

export default plugin;
