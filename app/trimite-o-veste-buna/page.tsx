import { submitVesteBuna } from "@/lib/actions/submission-actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubmitVesteBunaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const success = params.success === "true";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-lg border border-line bg-white p-8 shadow-sm">
        <span className="text-xs uppercase tracking-[0.18em] text-moss">Implică-te</span>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Trimite o veste bună</h1>
        <p className="mt-2 leading-7 text-ink/72">
          Ai văzut sau ai participat la o inițiativă constructivă, un proiect educațional reușit, o inovație utilă sau o acțiune ecologică locală? Trimite-ne detalii! Redacția noastră (împreună cu asistenții AI) va verifica sursele și, dacă știrea se încadrează în criteriile noastre, o vom publica.
        </p>

        {error && (
          <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-6 rounded-md bg-green-50 p-5 border border-green-200 text-green-800 text-sm">
            <h3 className="font-semibold text-green-900">Vestea a fost trimisă cu succes!</h3>
            <p className="mt-1">
              Îți mulțumim pentru contribuție. Redactorul nostru va analiza detaliile și sursele. În caz de publicare, vei fi notificat pe email!
            </p>
          </div>
        ) : (
          <form action={submitVesteBuna} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Titlu propus*</span>
              <input
                name="title"
                type="text"
                placeholder="Ex: Elevii din localitate au plantat 500 de copaci"
                className="input"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Categorie*</span>
                <select name="category" className="input" required>
                  <option value="Romania buna">România bună</option>
                  <option value="Educatie">Educație</option>
                  <option value="Sanatate & bine">Sănătate & bine</option>
                  <option value="Tech & inovatie">Tech & inovație</option>
                  <option value="Mediu">Mediu</option>
                  <option value="Cultura & evenimente">Cultură & evenimente</option>
                  <option value="Business pozitiv">Business pozitiv</option>
                  <option value="Sport & performanta">Sport & performanță</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Oraș / Județ*</span>
                <input
                  name="location"
                  type="text"
                  placeholder="Ex: Brașov"
                  className="input"
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Descriere / Ce s-a întâmplat exact*</span>
              <textarea
                name="description"
                placeholder="Explică inițiativa în câteva paragrafe. Menționează impactul și persoanele implicate..."
                className="textarea min-h-32"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Link către o sursă de verificare*</span>
              <input
                name="sourceLink"
                type="url"
                placeholder="Ex: https://pagina-proiectului.ro sau link articol local"
                className="input"
                required
              />
              <span className="text-xs text-ink/50">
                Avem nevoie de un link public pentru a verifica factual informațiile (ex: site local, postare oficială, presă locală).
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Numele tău*</span>
                <input
                  name="contactName"
                  type="text"
                  placeholder="Mihai Ionescu"
                  className="input"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Email de contact*</span>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="mihai@exemplu.ro"
                  className="input"
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Alte linkuri / surse foto (Opțional)</span>
              <input
                name="optionalLinks"
                type="text"
                placeholder="Linkuri suplimentare separate prin virgulă"
                className="input"
              />
            </label>

            <label className="mt-2 flex items-start gap-2.5 text-sm text-ink/75">
              <input
                name="contactConsent"
                type="checkbox"
                className="mt-1 size-4 accent-leaf"
                required
              />
              <span>
                Sunt de acord să fiu contactat pe email de redacția Positive News Agency dacă sunt necesare clarificări sau detalii suplimentare referitoare la această propunere.
              </span>
            </label>

            <button
              type="submit"
              className="mt-3 rounded-md bg-ink py-3 font-semibold text-white hover:bg-leaf"
            >
              Trimite propunerea
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
