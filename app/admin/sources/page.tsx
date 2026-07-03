import { addSource, updateSource, deleteSource } from "@/lib/actions/source-actions";
import { getCategories, listSources } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type SourceRow = {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
  category?: { name: string } | null;
  trustScore: number;
  articlesExtracted: number;
  articlesAccepted: number;
  articlesRejected: number;
  status: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

export default async function AdminSourcesPage() {
  const [sources, categories] = await Promise.all([listSources(), getCategories()]);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Control Editorial</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Surse RSS &amp; Manuale</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Lista surse */}
        <section className="rounded-lg border border-line bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink border-collapse">
              <thead>
                <tr className="bg-paper border-b border-line text-xs font-semibold text-moss uppercase tracking-wider">
                  <th className="px-6 py-3.5">Sursă</th>
                  <th className="px-6 py-3.5">Categorie Implicită</th>
                  <th className="px-6 py-3.5 text-center">Scor Încredere</th>
                  <th className="px-6 py-3.5 text-center">Extrase</th>
                  <th className="px-6 py-3.5 text-center">Acceptate</th>
                  <th className="px-6 py-3.5 text-center">Respinse</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(sources as SourceRow[]).map((source: SourceRow) => (
                  <tr key={source.id} className="hover:bg-paper/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ink">{source.name}</p>
                      <p className="text-xs text-ink/55 mt-0.5 max-w-sm truncate">{source.url}</p>
                      {source.notes && <p className="text-xs italic text-ink/45 mt-1">{source.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-ink/75">
                      {source.category?.name || "Automată (inferată)"}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-moss">{source.trustScore}/100</td>
                    <td className="px-6 py-4 text-center text-ink/65">{source.articlesExtracted}</td>
                    <td className="px-6 py-4 text-center text-green-700 font-semibold">{source.articlesAccepted}</td>
                    <td className="px-6 py-4 text-center text-red-700 font-semibold">{source.articlesRejected}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider
                        ${
                          source.status === "active"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : source.status === "paused"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {source.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Formular rapid status toggle */}
                      <div className="flex justify-end gap-2">
                        <form action={updateSource}>
                          <input type="hidden" name="id" value={source.id} />
                          <input type="hidden" name="name" value={source.name} />
                          <input type="hidden" name="url" value={source.url} />
                          <input
                            type="hidden"
                            name="status"
                            value={source.status === "active" ? "paused" : "active"}
                          />
                          <button className="text-xs font-bold text-moss hover:underline">
                            {source.status === "active" ? "Pause" : "Activate"}
                          </button>
                        </form>
                        <form action={deleteSource} onSubmit={(e) => {
                          if (!confirm("Sigur vrei să ștergi această sursă?")) e.preventDefault();
                        }}>
                          <input type="hidden" name="id" value={source.id} />
                          <button className="text-xs font-bold text-red-600 hover:underline">
                            Șterge
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {sources.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-ink/55">
                      Nu există surse înregistrate deocamdată.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Formular adaugare */}
        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink mb-4">Adaugă Sursă RSS</h2>
            <form action={addSource} className="grid gap-4 text-sm">
              <label className="grid gap-1 font-medium text-ink">
                <span>Nume publicație / Sursă</span>
                <input name="name" type="text" placeholder="Ex: Știri locale Brașov" className="input" required />
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>URL Feed RSS</span>
                <input name="url" type="url" placeholder="https://exemplu.ro/rss" className="input" required />
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>Categorie Implicită</span>
                <select name="categoryId" className="input">
                  <option value="">Alege (sau folosește detectare AI)</option>
                  {(categories as CategoryRow[]).map((c: CategoryRow) => (
                    <option value={c.id} key={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>Scor încredere sursă (0-100)</span>
                <input name="trustScore" type="number" min="0" max="100" defaultValue="75" className="input" required />
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>Blacklist keywords (separate prin virgulă)</span>
                <input name="blacklistKeywords" type="text" placeholder="accident, deces, incendiu" className="input" />
                <span className="text-xs text-ink/55">Articolele cu aceste cuvinte în titlu vor fi blocate automat.</span>
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>Whitelist keywords (separate prin virgulă)</span>
                <input name="whitelistKeywords" type="text" placeholder="ecologic, campanie, burse" className="input" />
                <span className="text-xs text-ink/55">Doar articolele care conțin cel puțin un cuvânt vor fi importate.</span>
              </label>

              <label className="grid gap-1 font-medium text-ink">
                <span>Note sursă</span>
                <textarea name="notes" placeholder="Detalii administrative..." className="textarea min-h-16" />
              </label>

              <button type="submit" className="rounded-md bg-ink py-2.5 font-semibold text-white hover:bg-leaf">
                Adaugă sursă
              </button>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
