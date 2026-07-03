import type { ModelTier } from "./types";

export function modelForTier(tier: ModelTier) {
  const provider = process.env.MODEL_PROVIDER ?? "mock";

  if (provider === "mock") {
    const mockModels: Record<ModelTier, string> = {
      cheap: "mock-cheap",
      writer: "mock-writer",
      editor: "mock-editor",
      factcheck: "mock-factcheck"
    };
    return mockModels[tier];
  }

  // Fallback automat la model mai ieftin daca depasim 70% din buget
  const isDowngraded = typeof process !== "undefined" && process.env.AI_BUDGET_DOWNGRADE === "true";
  const activeTier = isDowngraded ? "cheap" : tier;

  const envMap: Record<ModelTier, string | undefined> = {
    cheap: process.env.DEFAULT_CHEAP_MODEL,
    writer: process.env.DEFAULT_WRITER_MODEL,
    editor: process.env.DEFAULT_EDITOR_MODEL,
    factcheck: process.env.DEFAULT_FACTCHECK_MODEL
  };

  return envMap[activeTier] ?? process.env.DEFAULT_CHEAP_MODEL ?? "gpt-4o-mini";
}

export function modelForAgent(agentName: string) {
  if (agentName.includes("writer")) return modelForTier("writer");
  if (agentName.includes("editor")) return modelForTier("editor");
  if (agentName.includes("fact") || agentName.includes("quality")) return modelForTier("factcheck");
  return modelForTier("cheap");
}
