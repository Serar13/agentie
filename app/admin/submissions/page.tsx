import {
  analyzeSubmissionAction,
  convertSubmissionAction,
  rejectSubmissionAction
} from "@/lib/actions/submission-actions";
import { formatDateTime } from "@/lib/format";
import { usesFirebaseData } from "@/lib/data-provider";
import { listSubmissions } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type SubmissionRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  sourceLink: string;
  contactName: string;
  contactEmail: string;
  status: string;
  aiAnalysis?: string | null;
  createdAt: Date;
};

export default async function AdminSubmissionsPage() {
  const submissions = (usesFirebaseData()
    ? await listSubmissions()
    : await (async () => {
        const { prisma } = await import("@/lib/prisma");
        return prisma.communitySubmission.findMany({
          orderBy: { createdAt: "desc" }
        });
      })()) as SubmissionRow[];

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Control Editorial</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Propuneri de la Cititori</h1>
      </div>

      <div className="grid gap-6">
        {submissions.map((sub: SubmissionRow) => {
          const aiAnalysis = sub.aiAnalysis ? JSON.parse(sub.aiAnalysis) : null;

          return (
            <section
              key={sub.id}
              className="rounded-lg border border-line bg-white p-6 shadow-sm flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start"
            >
              {/* Detalii propunere */}
              <div className="flex-1 grid gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider
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
                  <span className="text-xs text-ink/50">{formatDateTime(sub.createdAt)}</span>
                </div>

                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">{sub.title}</h2>
                  <p className="text-xs text-moss font-semibold mt-1">
                    Categorie propusă: {sub.category} • Oraș/Județ: {sub.location}
                  </p>
                </div>

                <div className="rounded bg-paper p-4 text-sm text-ink/75 leading-relaxed">
                  <p className="font-bold text-xs text-ink/50 uppercase mb-2">Descriere cititor:</p>
                  {sub.description}
                </div>

                <div className="text-xs text-ink/65 grid gap-1">
                  <p>
                    <span className="font-semibold">Link sursă:</span>{" "}
                    <a
                      href={sub.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-moss hover:underline"
                    >
                      {sub.sourceLink}
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold">Trimis de:</span> {sub.contactName} (
                    <a href={`mailto:${sub.contactEmail}`} className="hover:underline text-moss">
                      {sub.contactEmail}
                    </a>
                    )
                  </p>
                </div>
              </div>

              {/* Analiza AI si Actiuni */}
              <div className="lg:w-80 rounded-lg border border-line bg-paper p-4 flex flex-col gap-4">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-moss">Analiză AI</h3>
                {aiAnalysis ? (
                  <div className="text-xs grid gap-2.5 text-ink/75">
                    <p className="flex justify-between">
                      <span>Este Pozitivă?</span>
                      <span className={aiAnalysis.isPositive ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                        {aiAnalysis.isPositive ? "DA" : "NU"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Are Surse valide?</span>
                      <span className={aiAnalysis.hasSources ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                        {aiAnalysis.hasSources ? "DA" : "NU"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Are nevoie de detalii?</span>
                      <span className={aiAnalysis.needsClarification ? "text-amber-700 font-bold" : "text-green-700 font-bold"}>
                        {aiAnalysis.needsClarification ? "DA" : "NU"}
                      </span>
                    </p>
                    {aiAnalysis.needsClarification && aiAnalysis.clarificationQuestion && (
                      <div className="mt-2 rounded bg-amber-50 p-2.5 border border-amber-100 text-amber-800">
                        <p className="font-bold">Întrebare de clarificare propusă:</p>
                        <p className="mt-1 italic">&ldquo;{aiAnalysis.clarificationQuestion}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-ink/50 italic">Analiza AI nu a fost rulată încă.</p>
                )}

                {/* Butoane Actiune */}
                <div className="mt-2 grid gap-2">
                  {!aiAnalysis && (
                    <form action={analyzeSubmissionAction.bind(null, sub.id)}>
                      <button className="w-full rounded bg-white border border-line py-2 text-xs font-semibold text-ink hover:border-moss">
                        Rulează Analiza AI
                      </button>
                    </form>
                  )}

                  {sub.status === "submitted" && (
                    <>
                      <form action={convertSubmissionAction.bind(null, sub.id)}>
                        <button className="w-full rounded bg-ink py-2 text-xs font-semibold text-white hover:bg-leaf">
                          Convertește în Draft Articol
                        </button>
                      </form>
                      <form action={rejectSubmissionAction.bind(null, sub.id)}>
                        <button className="w-full rounded border border-line py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                          Respinge Propunerea
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
        {submissions.length === 0 && (
          <div className="rounded-lg border border-line bg-white p-12 text-center text-ink/55">
            Nu există propuneri de la cititori în baza de date deocamdată.
          </div>
        )}
      </div>
    </main>
  );
}
