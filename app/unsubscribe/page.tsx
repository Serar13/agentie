import Link from "next/link";
import { unsubscribeNewsletterAction } from "@/lib/actions/newsletter-actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const emailParam = typeof params.email === "string" ? params.email : "";
  const success = params.success === "true";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-lg border border-line bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink text-center">Dezabonare Newsletter</h1>
        
        {success ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200 mb-4">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink">Te-ai dezabonat cu succes.</p>
            <p className="mt-1 text-xs text-ink/60">Nu vei mai primi email-uri de la noi.</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-ink/65">
              Ne pare rău că pleci. Introdu email-ul pentru a te dezabona de la &ldquo;5 vești bune în 5 minute&rdquo;.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <form action={unsubscribeNewsletterAction} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={emailParam}
                  placeholder="nume@exemplu.ro"
                  className="input"
                  required
                />
              </label>

              <button
                type="submit"
                className="mt-2 rounded-md bg-ink py-3 font-semibold text-white hover:bg-red-600"
              >
                Dezabonare
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-semibold text-moss hover:underline">
            Înapoi la site
          </Link>
        </div>
      </div>
    </main>
  );
}
