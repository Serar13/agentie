import Link from "next/link";
import { getAnalyticsSummary } from "@/services/analytics-service";
import { getDonationStats } from "@/services/donation-service";
import { getCostSummary } from "@/services/cost-tracker";
import { formatCurrency } from "@/lib/format";
import { usesFirebaseData } from "@/lib/data-provider";
import { getTotalsFirebase } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

function Bar({
  label,
  value,
  max,
  href
}: {
  label: string;
  value: number;
  max: number;
  href?: string;
}) {
  const width = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  const content = (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink line-clamp-1">{label}</span>
        <span className="font-semibold text-moss">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-leaf" style={{ width: `${width}%` }} />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block rounded-md p-2 hover:bg-paper">
      {content}
    </Link>
  ) : (
    <div className="rounded-md p-2">{content}</div>
  );
}

type ViewsItem = { views: number };

export default async function AdminAnalyticsPage() {
  const [analytics, donationStats, costSummary, totals] = await Promise.all([
    getAnalyticsSummary(),
    getDonationStats(),
    getCostSummary(),
    usesFirebaseData()
      ? getTotalsFirebase()
      : (async () => {
          const { prisma } = await import("@/lib/prisma");
          return Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "admin" } }),
            prisma.newsletterSubscriber.count({ where: { status: "active" } }),
            prisma.newsArticle.count({ where: { status: "published" } }),
            prisma.communitySubmission.count()
          ]);
        })()
  ]);

  const [usersCount, adminsCount, subscribersCount, publishedCount, submissionsCount] = totals;
  const maxArticleViews = Math.max(0, ...analytics.topArticles.map((article: ViewsItem) => article.views));
  const maxCategoryViews = Math.max(0, ...analytics.topCategories.map((category: ViewsItem) => category.views));
  const maxSourceViews = Math.max(0, ...analytics.topSources.map((source: ViewsItem) => source.views));

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <section>
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Admin</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Statistici & Grafice</h1>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Utilizatori</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{usersCount}</p>
          <p className="mt-1 text-xs text-ink/50">{adminsCount} admin</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Newsletter</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{subscribersCount}</p>
          <p className="mt-1 text-xs text-ink/50">{analytics.newsletterConversions} conversii urmărite</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Venit lunar</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{formatCurrency(donationStats.monthlyTotal)}</p>
          <p className="mt-1 text-xs text-ink/50">{donationStats.supportersCount} susținători</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Cost AI luna asta</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{formatCurrency(costSummary.monthlyCost)}</p>
          <p className="mt-1 text-xs text-ink/50">{publishedCount} articole publicate, {submissionsCount} propuneri</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-ink">Articole populare</h2>
          <div className="mt-4 grid gap-2">
            {analytics.topArticles.length > 0 ? (
              analytics.topArticles.map((article: { title: string; slug: string; views: number }) => (
                <Bar
                  key={article.slug || article.title}
                  label={article.title}
                  value={article.views}
                  max={maxArticleViews}
                  href={article.slug ? `/articles/${article.slug}` : undefined}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">Nu există încă date de vizualizare.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-ink">Categorii citite</h2>
          <div className="mt-4 grid gap-2">
            {analytics.topCategories.length > 0 ? (
              analytics.topCategories.map((category: { name: string; views: number }) => (
                <Bar key={category.name} label={category.name} value={category.views} max={maxCategoryViews} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">Nu există încă date pe categorii.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-ink">Surse trafic</h2>
          <div className="mt-4 grid gap-2">
            {analytics.topSources.length > 0 ? (
              analytics.topSources.map((source: { name: string; views: number }) => (
                <Bar key={source.name} label={source.name} value={source.views} max={maxSourceViews} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">Nu există încă date pe surse.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-ink">Evenimente</h2>
          <div className="mt-4 grid gap-3">
            <Bar label="Vizualizări" value={analytics.viewsCount} max={Math.max(analytics.viewsCount, analytics.sharesCount, 1)} />
            <Bar label="Distribuiri" value={analytics.sharesCount} max={Math.max(analytics.viewsCount, analytics.sharesCount, 1)} />
            <Bar label="Newsletter" value={analytics.newsletterConversions} max={Math.max(analytics.newsletterConversions, analytics.donationConversions, 1)} />
            <Bar label="Donații" value={analytics.donationConversions} max={Math.max(analytics.newsletterConversions, analytics.donationConversions, 1)} />
          </div>
          <p className="mt-5 rounded-md bg-paper p-3 text-sm text-ink/65">
            Timp mediu de citire urmărit: {analytics.averageReadingTime || 0} secunde.
          </p>
        </div>
      </section>
    </main>
  );
}
