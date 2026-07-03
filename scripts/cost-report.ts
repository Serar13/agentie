import { BUDGET_TARGETS } from "../lib/constants";
import { formatCurrency } from "../lib/format";
import { prisma } from "../lib/prisma";
import { getCostSummary } from "../services/cost-tracker";

async function main() {
  const summary = await getCostSummary();
  const remaining = Math.max(0, BUDGET_TARGETS.monthlyBudgetEur - summary.monthlyCost);

  console.log("Positive News Agency cost report");
  console.table({
    dailyCost: formatCurrency(summary.dailyCost),
    monthlyCost: formatCurrency(summary.monthlyCost),
    remainingBudget: formatCurrency(remaining),
    articlesThisMonth: summary.articlesThisMonth,
    averageCostPerArticle: formatCurrency(summary.averageCostPerArticle),
    monthlyTarget: `${BUDGET_TARGETS.minMonthlyArticles}-${BUDGET_TARGETS.maxMonthlyArticles}`
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
