import Link from "next/link";
import { CostSummary } from "@/components/CostSummary";
import { STATUS_VALUES } from "@/lib/constants";
import { getCostSummary } from "@/services/cost-tracker";
import { scanSourcesAction } from "@/lib/actions/source-actions";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getAdminArticles as getFirebaseAdminArticles, getCategories, getUniqueSources } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
};

type AdminArticleRow = {
  id: string;
  title: string;
  category: { name: string };
  status: string;
  positiveScore: number;
  confidenceScore: number;
  riskLevel: string;
  sourceName?: string | null;
  scannedAt?: Date | null;
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  // Parametrii de filtrare
  const status = typeof params.status === "string" ? params.status : "all";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "all";
  const riskLevel = typeof params.riskLevel === "string" ? params.riskLevel : "all";
  const scoreFilter = typeof params.scoreFilter === "string" ? params.scoreFilter : "all"; // "low_positive", "low_confidence", "all"
  const sort = typeof params.sort === "string" ? params.sort : "desc";

  const costSummary = await getCostSummary();

  // Limite de buget citite dynamically
  const monthlyLimit = Number(process.env.MONTHLY_BUDGET_EUR || 100);
  const monthlyUsagePercent = monthlyLimit > 0 ? (costSummary.monthlyCost / monthlyLimit) * 100 : 0;

  // Interogam categoriile si sursele pentru filtre
  const [categories, uniqueSources] = await Promise.all([getCategories(), getUniqueSources()]);

  const articles = await getFirebaseAdminArticles({ status, categoryId, riskLevel, scoreFilter, sort });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Alerta de buget AI */}
      {monthlyUsagePercent >= 70 && (
        <div className={`rounded-lg border p-4 text-sm ${
          monthlyUsagePercent >= 100 
            ? "bg-red-50 border-red-200 text-red-800" 
            : monthlyUsagePercent >= 90 
            ? "bg-orange-50 border-orange-200 text-orange-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="font-bold">
                {monthlyUsagePercent >= 100 
                  ? "🔴 Buget AI epuizat (100%+)" 
                  : monthlyUsagePercent >= 90 
                  ? "🟠 Alertă buget AI (90%+)" 
                  : "🟡 Alertă buget AI (70%+)"}
              </span>
              <p className="mt-1">
                Consumul lunar curent este de {costSummary.monthlyCost.toFixed(2)} EUR din bugetul de {monthlyLimit} EUR ({monthlyUsagePercent.toFixed(1)}%).
                {monthlyUsagePercent >= 70 && monthlyUsagePercent < 100 && " Fallback-ul la modele AI ieftine a fost activat automat."}
                {monthlyUsagePercent >= 100 && " Procesările noi au fost blocate pentru a preveni costurile suplimentare."}
              </p>
            </div>
            <span className="text-xs uppercase font-semibold px-2 py-1 rounded bg-black/10">
              {monthlyUsagePercent >= 70 && "Downgrade activ"}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-moss">Control Editorial</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Știri Propuse</h1>
        </div>
        <div className="flex gap-2">
          <form action={scanSourcesAction}>
            <button className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf">
              Scanează surse RSS acum
            </button>
          </form>
        </div>
      </section>

      {/* Sumar costuri */}
      <CostSummary summary={costSummary} />

      {/* Sectiune Filtre */}
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink mb-4">Filtrează articolele</h2>
        <form className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink/65">Status</span>
            <select name="status" defaultValue={status} className="input h-9 text-xs">
              <option value="all">Toate</option>
              {STATUS_VALUES.map((val) => (
                <option value={val} key={val}>{val}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink/65">Categorie</span>
            <select name="categoryId" defaultValue={categoryId} className="input h-9 text-xs">
              <option value="all">Toate</option>
              {(categories as CategoryRow[]).map((c: CategoryRow) => (
                <option value={c.id} key={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink/65">Nivel Risc</span>
            <select name="riskLevel" defaultValue={riskLevel} className="input h-9 text-xs">
              <option value="all">Toate</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink/65">Filtrare Scoruri</span>
            <select name="scoreFilter" defaultValue={scoreFilter} className="input h-9 text-xs">
              <option value="all">Toate scorurile</option>
              <option value="low_positive">Scor Pozitiv &lt; 75 (Blocate)</option>
              <option value="low_confidence">Scor Încredere &lt; 80 (Blocate)</option>
            </select>
          </label>

          <div className="flex gap-2 items-end">
            <button type="submit" className="rounded bg-ink px-4 h-9 text-xs font-semibold text-white hover:bg-leaf flex-1">
              Filtrează
            </button>
            <Link href="/admin" className="rounded border border-line bg-paper px-3 h-9 text-xs font-semibold text-ink flex items-center justify-center">
              Reset
            </Link>
          </div>
        </form>
      </section>

      {/* Tabel articole */}
      <section className="rounded-lg border border-line bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink border-collapse">
            <thead>
              <tr className="bg-paper border-b border-line text-xs font-semibold text-moss uppercase tracking-wider">
                <th className="px-6 py-3.5">Titlu</th>
                <th className="px-6 py-3.5">Categorie</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Pozitiv</th>
                <th className="px-6 py-3.5 text-center">Încredere</th>
                <th className="px-6 py-3.5 text-center">Risc</th>
                <th className="px-6 py-3.5">Dată scan</th>
                <th className="px-6 py-3.5 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(articles as AdminArticleRow[]).map((art: AdminArticleRow) => (
                <tr key={art.id} className="hover:bg-paper/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink line-clamp-1">{art.title}</p>
                    <p className="text-xs text-ink/55 mt-0.5">{art.sourceName || "Sursă directă"}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-ink/75">{art.category.name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={art.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ScoreBadge label="" score={art.positiveScore} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ScoreBadge label="" score={art.confidenceScore} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      art.riskLevel === "high" 
                        ? "bg-red-50 text-red-700 border border-red-100" 
                        : art.riskLevel === "medium" 
                        ? "bg-amber-50 text-amber-700 border border-amber-100" 
                        : "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {art.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-ink/50">{art.scannedAt ? formatDateTime(art.scannedAt) : "N/A"}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/articles/${art.id}`}
                      className="text-xs font-bold text-moss hover:underline"
                    >
                      Editează &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-ink/55">
                    Nu s-a găsit niciun articol conform filtrelor selectate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
