import Link from "next/link";
import type { ArticleReference, Category, CostLog, NewsArticle } from "@/lib/app-types";
import { runPipelineAction, updateArticleStatus } from "@/lib/actions";
import { STATUS_VALUES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

type AdminArticle = NewsArticle & {
  category: Category;
  references: ArticleReference[];
  costs: CostLog[];
};

export function AdminArticleTable({ articles }: { articles: AdminArticle[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-[0.14em] text-moss">
            <tr>
              <th className="px-4 py-3">Articol</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scoruri</th>
              <th className="px-4 py-3">Surse</th>
              <th className="px-4 py-3">Actualizat</th>
              <th className="px-4 py-3">Actiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {articles.map((article) => (
              <tr key={article.id} className="align-top">
                <td className="max-w-md px-4 py-4">
                  <p className="font-semibold text-ink">{article.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-moss">
                    {article.category.name}
                  </p>
                  {article.qualityNotes ? (
                    <p className="mt-2 line-clamp-2 text-xs text-ink/60">{article.qualityNotes}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={article.status} />
                </td>
                <td className="space-y-2 px-4 py-4">
                  <ScoreBadge label="pozitiv" score={article.positiveScore} />
                  <ScoreBadge label="incredere" score={article.confidenceScore} />
                </td>
                <td className="px-4 py-4 text-ink/70">
                  <p>{article.references.length} referinte</p>
                  <p className="mt-1 text-xs">{article.sourceName ?? "Sursa nesetata"}</p>
                </td>
                <td className="px-4 py-4 text-ink/70">{formatDateTime(article.updatedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex min-w-64 flex-wrap gap-2">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-md border border-line px-3 py-2 font-medium text-ink hover:border-moss"
                    >
                      Edit
                    </Link>
                    <form action={runPipelineAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-line px-3 py-2 font-medium text-ink hover:border-moss"
                      >
                        Pipeline
                      </button>
                    </form>
                    {STATUS_VALUES.filter((status) => status !== article.status).map((status) => (
                      <form action={updateArticleStatus} key={status}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className="rounded-md border border-line px-3 py-2 font-medium text-ink hover:border-moss"
                        >
                          {status}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {articles.length === 0 ? (
        <div className="p-8 text-center text-ink/60">Nu exista articole pentru filtrul ales.</div>
      ) : null}
    </div>
  );
}
