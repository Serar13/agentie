import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-line bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group">
          <p className="font-serif text-2xl font-semibold tracking-normal text-ink">
            Positive News Agency
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-moss">
            Fără reclame. Fără panică.
          </p>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              {session.role === "admin" && (
                <Link href="/admin" className="rounded-md px-3 py-2 text-moss font-bold hover:bg-paper">
                  Admin
                </Link>
              )}
              <Link href="/cont" className="rounded-md px-3 py-2 text-ink hover:bg-paper font-medium">
                Contul meu
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded-md px-3 py-2 text-ink hover:bg-paper font-medium">
              Conectare
            </Link>
          )}
          <Link
            href="/sustine"
            className="rounded-md bg-ink px-4 py-2 font-medium text-white hover:bg-leaf"
          >
            Susține proiectul
          </Link>
        </nav>
      </div>
    </header>
  );
}
