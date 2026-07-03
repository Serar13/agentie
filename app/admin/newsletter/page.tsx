import { createNewsletterAction, sendNewsletterAction } from "@/lib/actions/newsletter-actions";
import { renderNewsletterHtml } from "@/services/newsletter-service";
import { formatDateTime } from "@/lib/format";
import { usesFirebaseData } from "@/lib/data-provider";
import { getFirebaseDb } from "@/lib/firebase-admin";
import { getAdminArticles } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type SubscriberRow = {
  id: string;
  email: string;
  source?: string;
  status: string;
  createdAt: Date;
};

type NewsletterArticleRow = {
  id: string;
  title: string;
  status: string;
  sourceName?: string | null;
};

type CampaignRow = {
  id: string;
  subject: string;
  type: string;
  status: string;
  sentAt?: Date | null;
  createdAt: Date;
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminNewsletterPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const previewId = typeof params.preview === "string" ? params.preview : undefined;

  const [subscribers, approvedArticles, campaigns] = usesFirebaseData()
    ? await Promise.all([
        getFirebaseDb()
          .collection("newsletterSubscribers")
          .get()
          .then((snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() || new Date() })) as any[]),
        getAdminArticles({ status: "all" }).then((articles) =>
          articles.filter((article) => ["approved", "published"].includes(article.status)).slice(0, 20)
        ),
        getFirebaseDb()
          .collection("newsletters")
          .get()
          .then((snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.() || new Date() })) as any[])
      ])
    : await (async () => {
        const { prisma } = await import("@/lib/prisma");
        return Promise.all([
          prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }),
          prisma.newsArticle.findMany({
            where: { status: { in: ["approved", "published"] } },
            orderBy: { updatedAt: "desc" },
            take: 20
          }),
          prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } })
        ]);
      })();

  let previewData: { subject: string; html: string } | null = null;
  if (previewId) {
    try {
      previewData = await renderNewsletterHtml(previewId);
    } catch (e) {
      console.error("Failed to render newsletter preview:", e);
    }
  }

  const typedSubscribers = subscribers as SubscriberRow[];
  const typedApprovedArticles = approvedArticles as NewsletterArticleRow[];
  const typedCampaigns = campaigns as CampaignRow[];
  const activeSubscribers = typedSubscribers.filter((s: SubscriberRow) => s.status === "active");

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Control Editorial</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Newsletter: 5 Vești Bune în 5 Minute</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Sectiunea principala: Builder campanie si Preview */}
        <div className="grid gap-6">
          {previewId && previewData ? (
            <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <h2 className="font-serif text-2xl font-semibold text-ink">Previzualizare Campanie</h2>
                <div className="flex gap-2">
                  <form action={sendNewsletterAction.bind(null, previewId)}>
                    <button className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-leaf">
                      Trimite acum către cei {activeSubscribers.length} abonați activi
                    </button>
                  </form>
                  <a
                    href="/admin/newsletter"
                    className="rounded-md border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper"
                  >
                    Închide
                  </a>
                </div>
              </div>
              <p className="text-sm text-ink/70 mb-4">
                <span className="font-bold">Subiect:</span> {previewData.subject}
              </p>
              <div
                className="border border-line rounded p-4 bg-paper overflow-auto max-h-[600px]"
                dangerouslySetInnerHTML={{ __html: previewData.html }}
              />
            </section>
          ) : (
            <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-semibold text-ink mb-4">Creează Campanie Nouă</h2>
              <form action={createNewsletterAction} className="grid gap-4 text-sm">
                <label className="grid gap-1 font-medium text-ink">
                  <span>Subiect Email</span>
                  <input
                    name="subject"
                    type="text"
                    placeholder="Ex: 5 vești bune pentru o zi mai luminoasă 🌟"
                    className="input"
                    required
                  />
                </label>

                <label className="grid gap-1 font-medium text-ink">
                  <span>Mesaj Introductiv</span>
                  <textarea
                    name="intro"
                    placeholder="Un scurt intro editorial cu ton cald si optimist..."
                    className="textarea min-h-24"
                    required
                  />
                </label>

                {/* Checklist articole */}
                <div className="grid gap-2">
                  <span className="font-semibold text-ink">Alege exact 5 știri pozitive (aprobate/publicate):</span>
                  {typedApprovedArticles.length > 0 ? (
                    <div className="grid gap-2 border border-line rounded p-3 max-h-64 overflow-y-auto bg-paper">
                      {typedApprovedArticles.map((art: NewsletterArticleRow) => (
                        <label
                          key={art.id}
                          className="flex items-start gap-2.5 p-2 rounded hover:bg-white cursor-pointer border border-transparent hover:border-line"
                        >
                          <input
                            type="checkbox"
                            name="articles"
                            value={art.id}
                            className="mt-1 size-4 accent-leaf"
                          />
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-moss">
                              {art.status}
                            </span>
                            <p className="font-semibold text-ink text-xs line-clamp-1">{art.title}</p>
                            <p className="text-[10px] text-ink/50">{art.sourceName || "Sursă directă"}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink/50 italic py-4 border border-dashed border-line rounded text-center">
                      Nu există articole aprobate/publicate disponibile pentru newsletter. Aprobă câteva articole din dashboard mai întâi!
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-ink py-2.5 font-semibold text-white hover:bg-leaf text-center mt-2"
                >
                  Generează Previzualizare Campanie
                </button>
              </form>
            </section>
          )}

          {/* Istoric trimiteri */}
          <section className="rounded-lg border border-line bg-white shadow-sm overflow-hidden">
            <h2 className="font-serif text-xl font-semibold text-ink px-6 py-4 border-b border-line bg-paper">
              Istoric Campanii Trimise
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink border-collapse">
                <thead>
                  <tr className="border-b border-line text-xs font-semibold text-moss uppercase">
                    <th className="px-6 py-3">Subiect</th>
                    <th className="px-6 py-3">Tip</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Dată Trimitere</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {typedCampaigns.map((camp: CampaignRow) => (
                    <tr key={camp.id} className="hover:bg-paper/40">
                      <td className="px-6 py-4 font-semibold">{camp.subject}</td>
                      <td className="px-6 py-4 uppercase text-xs font-bold text-moss">{camp.type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase
                          ${camp.status === "sent" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink/50">
                        {camp.sentAt ? formatDateTime(camp.sentAt) : "Netrimis"}
                      </td>
                    </tr>
                  ))}
                  {typedCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-ink/50 italic">
                        Nicio campanie trimisă deocamdată.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar: Lista abonați */}
        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-semibold text-ink">Abonați activi</h3>
              <span className="rounded bg-moss/10 px-2 py-0.5 text-xs font-bold text-moss">
                {activeSubscribers.length} total
              </span>
            </div>

            <div className="grid gap-3 max-h-96 overflow-y-auto pr-1">
              {typedSubscribers.map((sub: SubscriberRow) => (
                <div key={sub.id} className="text-xs border-b border-line pb-2.5 last:border-0 last:pb-0">
                  <div className="flex justify-between font-semibold">
                    <span className="text-ink truncate max-w-[180px]">{sub.email}</span>
                    <span className={`text-[10px] uppercase font-bold ${sub.status === "active" ? "text-green-700" : "text-red-600"}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-ink/40 mt-1">
                    <span>Sursă: {sub.source}</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString("ro-RO")}</span>
                  </div>
                </div>
              ))}
              {typedSubscribers.length === 0 && (
                <p className="text-xs text-ink/50 italic text-center py-6">
                  Niciun abonat înregistrat deocamdată.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
