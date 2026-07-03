import { BUDGET_TARGETS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

type Props = {
  summary: {
    dailyCost: number;
    monthlyCost: number;
    articlesThisMonth: number;
    averageCostPerArticle: number;
  };
};

export function CostSummary({ summary }: Props) {
  return (
    <section className="grid gap-3 rounded-lg border border-line bg-white p-5 shadow-sm md:grid-cols-4">
      <Metric label="Cost azi" value={formatCurrency(summary.dailyCost)} />
      <Metric label="Cost luna" value={formatCurrency(summary.monthlyCost)} />
      <Metric label="Articole luna" value={String(summary.articlesThisMonth)} />
      <Metric
        label="Mediu / articol"
        value={formatCurrency(summary.averageCostPerArticle)}
        hint={`Tinta ${BUDGET_TARGETS.targetCostMinEur}-${BUDGET_TARGETS.targetCostMaxEur} EUR`}
      />
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-paper p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-moss">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/55">{hint}</p> : null}
    </div>
  );
}
