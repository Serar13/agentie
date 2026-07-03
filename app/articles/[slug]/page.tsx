import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsletterForm } from "@/components/NewsletterForm";
import { formatDate } from "@/lib/format";
import { getPublishedArticleBySlug } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) notFound();

  return (
    <main>
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-moss hover:text-ink">
          Inapoi la stiri
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-moss">
          <span>{article.category.name}</span>
          <span aria-hidden="true">/</span>
          <time>{formatDate(article.publishedAt)}</time>
        </div>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink md:text-6xl">
          {article.title}
        </h1>
        {article.subtitle ? (
          <p className="mt-4 text-xl leading-8 text-ink/72">{article.subtitle}</p>
        ) : null}
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg border border-line">
          <Image
            src={article.imageUrl || "/images/romania-buna.png"}
            alt=""
            fill
            sizes="(min-width: 768px) 860px, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="prose prose-neutral mt-8 max-w-none">
          {String(article.content).split("\n\n").map((paragraph: string) => (
            <p key={paragraph} className="text-lg leading-8 text-ink/78">
              {paragraph}
            </p>
          ))}
        </div>
        <section className="mt-10 rounded-lg border border-line bg-white p-5">
          <h2 className="font-semibold text-ink">Surse</h2>
          <div className="mt-4 grid gap-3">
            {article.references.map((reference: { id: string; url: string; title: string; outlet: string }) => (
              <a
                href={reference.url}
                key={reference.id}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line p-3 text-sm hover:border-moss"
              >
                <span className="block font-semibold text-ink">{reference.title}</span>
                <span className="mt-1 block text-moss">{reference.outlet}</span>
              </a>
            ))}
          </div>
        </section>
      </article>
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-ink">Newsletter</h2>
          <p className="mt-2 text-ink/70">Primeste zilnic 5 vesti bune in 5 minute.</p>
          <div className="mt-5">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
