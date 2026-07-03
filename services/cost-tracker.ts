import { BUDGET_TARGETS } from "../lib/constants";
import { getCostSummaryFirebase, logCostFirebase } from "./firebase-store";

type Rate = {
  inputPer1k: number;
  outputPer1k: number;
};

const MODEL_RATES_EUR: Record<string, Rate> = {
  "mock-cheap": { inputPer1k: 0.001, outputPer1k: 0.002 },
  "mock-writer": { inputPer1k: 0.003, outputPer1k: 0.006 },
  "mock-editor": { inputPer1k: 0.005, outputPer1k: 0.01 },
  "mock-factcheck": { inputPer1k: 0.004, outputPer1k: 0.008 },
  "gpt-4o-mini": { inputPer1k: 0.00014, outputPer1k: 0.00056 },
  "gpt-4o": { inputPer1k: 0.0047, outputPer1k: 0.014 },
  "deepseek-chat": { inputPer1k: 0.00013, outputPer1k: 0.00025 },
  "gemini-1.5-flash": { inputPer1k: 0.00007, outputPer1k: 0.00028 },
  "claude-3-5-haiku": { inputPer1k: 0.00075, outputPer1k: 0.00375 }
};

export function estimateTokens(input: string) {
  return Math.max(1, Math.ceil(input.length / 4));
}

export function estimateRunCost(model: string, inputTokens: number, outputTokens: number) {
  const rate = MODEL_RATES_EUR[model] ?? MODEL_RATES_EUR["mock-cheap"];
  return (inputTokens / 1000) * rate.inputPer1k + (outputTokens / 1000) * rate.outputPer1k;
}

export async function logAgentCost(params: {
  articleId?: string;
  agentName: string;
  model: string;
  input: string;
  output: string;
}) {
  const inputTokens = estimateTokens(params.input);
  const outputTokens = estimateTokens(params.output);
  const estimatedCostEur = estimateRunCost(params.model, inputTokens, outputTokens);

  return logCostFirebase({
    articleId: params.articleId || null,
    agentName: params.agentName,
    model: params.model,
    inputTokens,
    outputTokens,
    estimatedCostEur
  });
}

export async function getCostSummary() {
  return getCostSummaryFirebase();
}

export async function checkBudgetLimits(): Promise<{ exceeded: boolean; reason?: string }> {
  const summary = await getCostSummary();
  const monthlyLimit = typeof process !== 'undefined' && process.env.MONTHLY_BUDGET_EUR 
    ? Number(process.env.MONTHLY_BUDGET_EUR) 
    : BUDGET_TARGETS.monthlyBudgetEur;
  const dailyLimit = typeof process !== 'undefined' && process.env.DAILY_BUDGET_EUR 
    ? Number(process.env.DAILY_BUDGET_EUR) 
    : BUDGET_TARGETS.dailyBudgetEur;

  const monthlyUsagePercent = monthlyLimit > 0 ? (summary.monthlyCost / monthlyLimit) * 100 : 0;
  if (typeof process !== "undefined") {
    if (monthlyUsagePercent >= 70) {
      process.env.AI_BUDGET_DOWNGRADE = "true";
    } else {
      process.env.AI_BUDGET_DOWNGRADE = "false";
    }
  }

  if (summary.monthlyCost >= monthlyLimit) {
    return {
      exceeded: true,
      reason: `Bugetul lunar pentru AI (${monthlyLimit} EUR) a fost atins/depasit. Cost curent luna: ${summary.monthlyCost.toFixed(4)} EUR.`
    };
  }

  if (summary.dailyCost >= dailyLimit) {
    return {
      exceeded: true,
      reason: `Bugetul zilnic pentru AI (${dailyLimit} EUR) a fost atins/depasit. Cost curent azi: ${summary.dailyCost.toFixed(4)} EUR.`
    };
  }

  return { exceeded: false };
}
