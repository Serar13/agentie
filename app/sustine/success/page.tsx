import Link from "next/link";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupportSuccessPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const isMock = params.payment_mock_success === "true";

  return (
    <main className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200">
          <svg
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="mt-5 font-serif text-3xl font-semibold text-ink">Plată Reușită!</h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          Îți mulțumim din suflet pentru sprijinul acordat. Contribuția ta a fost înregistrată cu succes.
        </p>

        {isMock && (
          <div className="mt-4 rounded-md bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200">
            Simulare locală de plată finalizată cu succes. Contribuția a fost înregistrată.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/"
            className="rounded-md bg-ink py-2.5 text-sm font-semibold text-white hover:bg-leaf"
          >
            Înapoi la știri
          </Link>
          <Link
            href="/cont"
            className="rounded-md border border-line py-2.5 text-sm font-semibold text-ink hover:border-moss bg-white"
          >
            Vezi profilul meu
          </Link>
        </div>
      </div>
    </main>
  );
}
