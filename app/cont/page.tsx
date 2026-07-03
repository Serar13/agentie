import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth-helpers";
import { logoutAction } from "@/lib/actions/auth-actions";
import { ArticleCard } from "@/components/ArticleCard";
import { usesFirebaseData } from "@/lib/data-provider";
import { findUserById, getAccountOverview } from "@/services/firebase-store";
import type { ArticleReference, Category, NewsArticle } from "@/lib/app-types";

export const dynamic = "force-dynamic";

type ArticleRow = NewsArticle & {
  category: Category;
  references: ArticleReference[];
};

type SubmissionRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  createdAt: Date;
};

export default async function ProfilePage() {
  const session = await getRequiredSession();

  const user = usesFirebaseData()
    ? await findUserById(session.userId)
    : await (async () => {
        const { prisma } = await import("@/lib/prisma");
        return prisma.user.findUnique({ where: { id: session.userId } });
      })();

  if (!user) {
    redirect("/login");
  }

  const savedIds = user.savedArticles ? user.savedArticles.split(",").filter(Boolean) : [];
  const followedSlugs = user.followedCategories ? user.followedCategories.split(",").filter(Boolean) : [];
  const overview = usesFirebaseData()
    ? await getAccountOverview(user.email, savedIds, followedSlugs)
    : await (async () => {
        const { prisma } = await import("@/lib/prisma");
        const [submissions, donations, membership, savedArticles, followedCategories] = await Promise.all([
          prisma.communitySubmission.findMany({
            where: { contactEmail: user.email },
            orderBy: { createdAt: "desc" }
          }),
          prisma.donation.findMany({
            where: { email: user.email, status: "completed" },
            orderBy: { createdAt: "desc" }
          }),
          prisma.member.findUnique({
            where: { email: user.email }
          }),
          savedIds.length > 0
            ? prisma.newsArticle.findMany({
                where: { id: { in: savedIds }, status: "published" },
                include: { category: true, references: true }
              })
            : [],
          followedSlugs.length > 0
            ? prisma.category.findMany({
                where: { slug: { in: followedSlugs } }
              })
            : []
        ]);
        return { submissions, donations, membership, savedArticles, followedCategories };
      })();

  const submissions = overview.submissions as SubmissionRow[];
  const donations = overview.donations as Array<{ id: string }>;
  const membership = overview.membership as { status: string; plan: string } | null;
  const savedArticles = overview.savedArticles as ArticleRow[];
  const followedCategories = overview.followedCategories as Category[];

  const isSupporter = donations.length > 0 || (membership && membership.status === "active");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-line pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-moss">Contul meu</span>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Salut, {user.name || user.email}!</h1>
          <p className="mt-1 text-sm text-ink/65">Locație: {user.location || "Nespecificată"}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-moss"
            >
              Panou Admin
            </Link>
          )}
          <form action={logoutAction}>
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
              Deconectare
            </button>
          </form>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Sectiunea principala: Articole Salvate si Propuneri */}
        <div className="grid gap-8">
          <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-ink border-b border-line pb-3">
              Articole Salvate ({savedArticles.length})
            </h2>
            {savedArticles.length > 0 ? (
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {savedArticles.map((article: ArticleRow) => (
                  <ArticleCard article={article} key={article.id} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/55 text-center py-6">
                Nu ai salvat niciun articol deocamdată.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-ink border-b border-line pb-3">
              Istoric Propuneri Știri ({submissions.length})
            </h2>
            {submissions.length > 0 ? (
              <div className="mt-4 divide-y divide-line">
                {submissions.map((sub: SubmissionRow) => (
                  <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-ink">{sub.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider
                        ${
                          sub.status === "converted_to_article"
                            ? "bg-green-100 text-green-800"
                            : sub.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink/70 line-clamp-2">{sub.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-ink/50">
                      <span>Categorie: {sub.category} • Locație: {sub.location}</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/55 text-center py-6">
                Nu ai trimis nicio propunere de știre deocamdată.{" "}
                <Link href="/trimite-o-veste-buna" className="text-moss font-semibold hover:underline">
                  Trimite una acum!
                </Link>
              </p>
            )}
          </section>
        </div>

        {/* Sidebar: Sustinere si Categorii urmarite */}
        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-ink">Statut Susținător</h2>
            {isSupporter ? (
              <div className="mt-3 rounded-md bg-green-50 p-4 border border-green-200">
                <p className="text-sm font-semibold text-green-800">Ești membru activ!</p>
                <p className="mt-1 text-xs text-green-700">
                  Îți mulțumim din suflet că susții Positive News Agency și ne ajuți să rămânem liberi de reclame.
                </p>
                {membership && (
                  <p className="mt-3 text-xs font-medium text-green-800">
                    Abonament lunar: {membership.plan === "monthly_3" ? "3 EUR" : membership.plan === "monthly_5" ? "5 EUR" : "10 EUR"}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-ink/65">
                  Nu ești înregistrat ca membru sau donator. Susținerea ta ne ajută să rămânem fără reclame!
                </p>
                <Link
                  href="/sustine"
                  className="mt-4 block w-full rounded-md bg-ink py-2.5 text-center text-sm font-semibold text-white hover:bg-leaf"
                >
                  Devino membru / Donează
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-ink">Categorii Urmărite</h2>
            {followedCategories.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {followedCategories.map((cat: Category) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-paper border border-line px-3 py-1 text-xs font-semibold text-moss"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink/55">
                Nu urmărești nicio categorie specifică deocamdată.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
