import Link from "next/link";
import { ClientArticleGrid } from "@/components/ClientArticleGrid";
import { DonationPanel } from "@/components/DonationPanel";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getPublishedArticles } from "@/services/news-service";
import type { ArticleReference, Category, NewsArticle } from "@/lib/app-types";

export const dynamic = "force-dynamic";

type ArticleRow = NewsArticle & {
  category: Category;
  references: ArticleReference[];
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage() {
  const articles = JSON.parse(JSON.stringify(await getPublishedArticles())) as ArticleRow[];

  return (
    <main>
      <section className="border-b border-line bg-white text-center">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16 flex flex-col items-center gap-5">
          <p className="text-sm uppercase tracking-[0.18em] text-moss">Canal editorial premium</p>
          <h1 className="font-serif text-5xl font-semibold leading-tight text-ink md:text-6xl max-w-2xl">
            Jurnalism constructiv, bazat pe soluții
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-ink/72">
            Fără reclame. Fără panică. Doar vești bune, verificate și selectate manual de editori.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <Link
              href="/sustine"
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-leaf"
            >
              Susține proiectul
            </Link>
            <Link
              href="/trimite-o-veste-buna"
              className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-moss bg-white"
            >
              Trimite o veste bună
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ClientArticleGrid articles={articles} />
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr]">
          <DonationPanel />
          <div className="rounded-lg border border-line bg-paper p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-moss">Newsletter</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
              5 vesti bune in 5 minute
            </h2>
            <p className="mt-3 leading-7 text-ink/72">
              Un rezumat zilnic, fara reclame si fara doomscrolling.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
