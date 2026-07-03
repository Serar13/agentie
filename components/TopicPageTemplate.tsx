import type { Metadata } from "next";
import { ArticleCard } from "./ArticleCard";
import { CategoryNav } from "./CategoryNav";
import { getPublishedArticles } from "@/services/news-service";
import type { ArticleReference, Category, NewsArticle } from "@/lib/app-types";

type ArticleRow = NewsArticle & {
  category: Category;
  references: ArticleReference[];
};

export type TopicPageProps = {
  title: string;
  intro: string;
  categorySlug?: string;
  isRomaniaBuna?: boolean;
  isTodayOnly?: boolean;
};

export async function TopicPageTemplate({
  title,
  intro,
  categorySlug,
  isRomaniaBuna = false,
  isTodayOnly = false
}: TopicPageProps) {
  const allArticles = (await getPublishedArticles(categorySlug)) as ArticleRow[];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const articles = isTodayOnly
    ? allArticles.filter((article) => !article.publishedAt || article.publishedAt >= startOfToday)
    : allArticles;

  const [featured, ...rest] = articles;

  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 text-center">
          <span className="text-xs uppercase tracking-[0.18em] text-moss">Flux editorial</span>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-ink/72">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <CategoryNav active={categorySlug} />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6">
        {featured ? <ArticleCard article={featured} featured /> : null}
        {rest.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((article: ArticleRow) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        ) : null}
        {articles.length === 0 && (
          <div className="rounded-lg border border-line bg-white p-12 text-center text-ink/55">
            Nu am găsit articole active pentru această secțiune în acest moment. Rețeaua noastră de scanare adaugă conținut nou zilnic!
          </div>
        )}
      </section>
    </main>
  );
}
