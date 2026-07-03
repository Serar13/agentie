import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor";
import { getArticleForEdit } from "@/services/news-service";
import { usesFirebaseData } from "@/lib/data-provider";
import { getCategories } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminArticlePage({ params }: PageProps) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    getArticleForEdit(id),
    usesFirebaseData()
      ? getCategories()
      : (async () => {
          const { prisma } = await import("@/lib/prisma");
          return prisma.category.findMany({ orderBy: { name: "asc" } });
        })()
  ]);

  if (!article) notFound();

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-moss hover:text-ink">
          Inapoi la dashboard
        </Link>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">Editor articol</h1>
      </div>
      <ArticleEditor article={article} categories={categories} />
    </main>
  );
}
