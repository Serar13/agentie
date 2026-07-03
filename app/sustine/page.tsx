import Link from "next/link";
import { getDonationStats } from "@/services/donation-service";
import { createMockDonationAction, createDonationSessionAction } from "@/lib/actions/donation-actions";
import { getSession } from "@/lib/auth";
import { usesFirebaseData } from "@/lib/data-provider";
import { findUserById } from "@/services/firebase-store";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type FounderRow = {
  name: string;
};

export default async function SupportUsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const stats = await getDonationStats();
  const session = await getSession();
  const user = session
    ? usesFirebaseData()
      ? await findUserById(session.userId)
      : await (async () => {
          const { prisma } = await import("@/lib/prisma");
          return prisma.user.findUnique({ where: { id: session.userId } });
        })()
    : null;

  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const actionToUse = isStripeConfigured ? createDonationSessionAction : createMockDonationAction;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Sectiunea intro */}
      <section className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-[0.18em] text-moss">Susține-ne</span>
        <h1 className="mt-2 font-serif text-5xl font-semibold text-ink leading-tight">Jurnalism pozitiv fără reclame</h1>
        <p className="mt-4 text-lg text-ink/72">
          Deoarece credem că știrile nu ar trebui să provoace panică și anxietate, am creat un spațiu curat. Nu vindem spații publicitare și nu îți urmărim datele. Suntem susținuți 100% de cititori.
        </p>
      </section>

      {/* Grid de plata & Progres Fondatori */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Formularul de donatie/membership */}
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-ink mb-6">Alege cum vrei să contribui</h2>



          {!user && (
            <div className="mb-6 rounded-md border border-line bg-paper p-4 text-sm text-ink/75">
              Pentru donații sau membership trebuie să ai cont. Poți citi știrile liber, dar susținerea și newsletterul sunt legate de profilul tău.
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/login" className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-leaf">
                  Autentificare
                </Link>
                <Link href="/register" className="rounded-md border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-moss">
                  Creează cont
                </Link>
              </div>
            </div>
          )}

          <form action={actionToUse} className="grid gap-6">
            {/* Toggle de plata */}
            <div className="grid gap-4">
              <span className="text-sm font-semibold text-ink">Tip contribuție</span>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 rounded-md border border-line p-3 cursor-pointer hover:border-moss">
                  <input
                    type="radio"
                    name="type"
                    value="one_time"
                    defaultChecked
                    className="accent-leaf"
                  />
                  <div>
                    <p className="text-sm font-bold text-ink">Donație unică</p>
                    <p className="text-xs text-ink/55">Suma pe care o dorești</p>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 rounded-md border border-line p-3 cursor-pointer hover:border-moss">
                  <input
                    type="radio"
                    name="type"
                    value="monthly"
                    className="accent-leaf"
                  />
                  <div>
                    <p className="text-sm font-bold text-ink">Membru lunar</p>
                    <p className="text-xs text-ink/55">Abonament recurent</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Optiuni sume */}
            <div className="grid gap-3">
              <span className="text-sm font-semibold text-ink">Suma dorită</span>
              
              {/* Sume Donatie Unica */}
              <div className="grid grid-cols-4 gap-2">
                <label className="rounded-md border border-line p-2 text-center cursor-pointer hover:border-moss font-semibold text-ink text-sm">
                  <input type="radio" name="amount" value="5" className="sr-only" />
                  5 €
                </label>
                <label className="rounded-md border border-line p-2 text-center cursor-pointer hover:border-moss font-semibold text-ink text-sm">
                  <input type="radio" name="amount" value="10" defaultChecked className="sr-only" />
                  10 €
                </label>
                <label className="rounded-md border border-line p-2 text-center cursor-pointer hover:border-moss font-semibold text-ink text-sm">
                  <input type="radio" name="amount" value="25" className="sr-only" />
                  25 €
                </label>
                <label className="rounded-md border border-line p-2 text-center cursor-pointer hover:border-moss font-semibold text-ink text-sm">
                  <input type="radio" name="amount" value="50" className="sr-only" />
                  50 €
                </label>
              </div>

              {/* Sume Membership (Planuri) */}
              <div className="grid gap-2 mt-2">
                <label className="flex items-center justify-between rounded-md border border-line p-3 cursor-pointer hover:border-moss text-sm">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="plan" value="monthly_3" defaultChecked className="accent-leaf" />
                    <span>Membru Susținător</span>
                  </span>
                  <span className="font-bold text-ink">3 € / lună</span>
                </label>
                <label className="flex items-center justify-between rounded-md border border-line p-3 cursor-pointer hover:border-moss text-sm">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="plan" value="monthly_5" className="accent-leaf" />
                    <span>Membru Activ</span>
                  </span>
                  <span className="font-bold text-ink">5 € / lună</span>
                </label>
                <label className="flex items-center justify-between rounded-md border border-line p-3 cursor-pointer hover:border-moss text-sm">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="plan" value="monthly_10" className="accent-leaf" />
                    <span>Membru Premium (Fondator)</span>
                  </span>
                  <span className="font-bold text-ink">10 € / lună</span>
                </label>
              </div>
            </div>

            {/* Date contact */}
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Nume complet</span>
                <input name="name" type="text" defaultValue={user?.name || ""} placeholder="Ex: Alexandru Pop" className="input" />
              </label>
              <div className="rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink/70">
                Email cont: <span className="font-semibold text-ink">{user?.email || "neautentificat"}</span>
              </div>
            </div>

            {/* Optiuni suplimentare */}
            <div className="grid gap-2.5">
              <label className="flex items-start gap-2 text-sm text-ink/75">
                <input name="isPublic" type="checkbox" defaultChecked className="mt-1 size-4 accent-leaf" />
                <span>Afișează numele meu public în lista susținătorilor.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-ink/75">
                <input name="isFounder" type="checkbox" className="mt-1 size-4 accent-leaf" />
                <span>Vreau să devin Susținător Fondator (recomandat pentru contribuții unice de minim 50 € sau memberships de 10 €).</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!user}
              className="mt-2 w-full rounded-md bg-ink py-3.5 font-semibold text-white hover:bg-leaf text-center"
            >
              Trimite contribuția
            </button>
          </form>
        </div>

        {/* Sidebar: Susţinători Fondatori */}
        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-line bg-paper p-5">
            <h3 className="font-serif text-xl font-semibold text-ink">100 Susținători Fondatori</h3>
            <p className="mt-2 text-xs text-ink/65 leading-relaxed">
              Căutăm primii 100 de cititori vizionari care să susțină platforma chiar de la lansare. Fondatorii vor fi listați permanent pe site.
            </p>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-ink/70 mb-2">
                <span>Fondatori înregistrați:</span>
                <span>{stats.foundersCount} / 100</span>
              </div>
              <div className="w-full bg-line rounded-full h-3 overflow-hidden">
                <div
                  className="bg-leaf h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.foundersCount)}%` }}
                ></div>
              </div>
            </div>

            {/* Lista nume fondatori */}
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-moss mb-3">Mulțumiri speciale către:</p>
              {stats.founders.length > 0 ? (
                <ul className="grid gap-2 max-h-56 overflow-y-auto pr-2 text-sm font-medium text-ink">
                  {stats.founders.map((founder: FounderRow, idx: number) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <span className="size-1.5 rounded-full bg-leaf"></span>
                      <span>{founder.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-ink/50 italic">
                  Fii primul susținător fondator listat aici!
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
