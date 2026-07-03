import { clampScore } from "@/lib/format";

export function ScoreBadge({ label, score }: { label: string; score: number }) {
  const normalized = clampScore(score);
  const tone =
    normalized >= 80
      ? "border-leaf/30 bg-leaf/10 text-leaf"
      : normalized >= 60
        ? "border-honey/40 bg-honey/15 text-ink"
        : "border-coral/30 bg-coral/10 text-coral";

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}: {normalized}
    </span>
  );
}
