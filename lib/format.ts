import type { ArticleStatus } from "./constants";

export function formatDate(date?: Date | string | null) {
  if (!date) return "Nepublicat";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

export function formatDateTime(date?: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(value);
}

export function statusTone(status: ArticleStatus) {
  switch (status) {
    case "published":
      return "bg-leaf text-white";
    case "approved":
      return "bg-sky text-white";
    case "needs_review":
      return "bg-honey text-ink";
    case "rejected":
      return "bg-coral text-white";
    default:
      return "bg-white text-ink ring-1 ring-line";
  }
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
