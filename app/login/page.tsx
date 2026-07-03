import Link from "next/link";
import { loginAction } from "@/lib/actions/auth-actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-lg border border-line bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink text-center">Autentificare</h1>
        <p className="mt-2 text-center text-sm text-ink/65">
          Intră în contul tău Positive News Agency
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="nume@exemplu.ro"
              className="input"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Parolă</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="input"
              required
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-md bg-ink py-3 font-semibold text-white hover:bg-leaf"
          >
            Conectează-te
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Nu ai cont?{" "}
          <Link href="/register" className="font-semibold text-moss hover:underline">
            Creează cont nou
          </Link>
        </p>
      </div>
    </main>
  );
}
