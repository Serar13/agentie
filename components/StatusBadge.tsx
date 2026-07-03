import type { ArticleStatus } from "@/lib/constants";
import { statusTone } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const typed = status as ArticleStatus;
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusTone(typed)}`}>
      {status}
    </span>
  );
}
