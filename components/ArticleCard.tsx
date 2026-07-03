import Image from "next/image";
import Link from "next/link";
import type { ArticleReference, Category, NewsArticle } from "@/lib/app-types";
import { formatDate } from "@/lib/format";

type Article = NewsArticle & {
  category: Category;
  references: ArticleReference[];
};

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className={featured ? "relative aspect-[16/8]" : "relative aspect-[16/10]"}>
          <Image
            src={article.imageUrl || "/images/romania-buna.png"}
            alt=""
            fill
            sizes={featured ? "(min-width: 768px) 680px, 100vw" : "(min-width: 768px) 360px, 100vw"}
            className="object-cover"
            priority={featured}
          />
        </div>
      </Link>
      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-moss">
          <span>{article.category.name}</span>
          <span aria-hidden="true">/</span>
          <time>{formatDate(article.publishedAt)}</time>
        </div>
        <Link href={`/articles/${article.slug}`} className="group">
          <h2
            className={
              featured
                ? "font-serif text-3xl font-semibold leading-tight text-ink group-hover:text-leaf"
                : "font-serif text-xl font-semibold leading-snug text-ink group-hover:text-leaf"
            }
          >
            {article.title}
          </h2>
        </Link>
        <p className="text-sm leading-6 text-ink/72">{article.lead}</p>
        <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="text-moss">{article.references.length} surse</span>
          <Link href={`/articles/${article.slug}`} className="font-medium text-ink hover:text-leaf">
            Citeste
          </Link>
        </div>
      </div>
    </article>
  );
}
