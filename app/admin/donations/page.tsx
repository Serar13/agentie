import { getDonationRows, getDonationStats } from "@/services/donation-service";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type DonationRow = {
  id: string;
  name?: string | null;
  email: string;
  amount: number;
  currency: string;
  isFounder?: boolean;
  createdAt: Date;
};

type MemberRow = {
  id: string;
  name?: string | null;
  email: string;
  plan: string;
  status: string;
  createdAt: Date;
};

export default async function AdminDonationsPage() {
  const [stats, rows] = await Promise.all([getDonationStats(), getDonationRows()]);
  const donations = rows.donations as DonationRow[];
  const members = rows.members as MemberRow[];

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Control Financiari</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Donații &amp; Membri</h1>
      </div>

      {/* Rezumat metrici */}
      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Venit Lunar Estimat</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{formatCurrency(stats.monthlyTotal)}</p>
          <p className="mt-1 text-xs text-ink/50">Obiectiv: {formatCurrency(stats.monthlyTarget)}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Susținători Unici</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{stats.supportersCount}</p>
          <p className="mt-1 text-xs text-ink/50">Donatori unici + membri activi</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Membri Fondatori</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{stats.foundersCount} / 100</p>
          <div className="w-full bg-line rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-leaf h-full rounded-full" style={{ width: `${stats.foundersCount}%` }}></div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-moss">Abonamente Active</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{members.filter((m: MemberRow) => m.status === 'active').length}</p>
          <p className="mt-1 text-xs text-ink/50">Membri cu plată recurentă</p>
        </div>
      </section>

      {/* Grid de liste */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista Donatii */}
        <section className="rounded-lg border border-line bg-white shadow-sm overflow-hidden flex flex-col">
          <h2 className="font-serif text-xl font-semibold text-ink px-6 py-4 border-b border-line bg-paper">
            Istoric Donații Unice ({donations.length})
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-ink border-collapse">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-moss uppercase">
                  <th className="px-6 py-3">Sustinator</th>
                  <th className="px-6 py-3 text-center">Sumă</th>
                  <th className="px-6 py-3 text-center">Tip</th>
                  <th className="px-6 py-3">Dată Plată</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {donations.map((don: DonationRow) => (
                  <tr key={don.id} className="hover:bg-paper/40">
                    <td className="px-6 py-4">
                      <span className="font-semibold">{don.name || "Anonim"}</span>
                      <p className="text-xs text-ink/50 mt-0.5">{don.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-ink">
                      {don.amount} {don.currency}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase
                        ${don.isFounder ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {don.isFounder ? "Fondator" : "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink/50">{formatDateTime(don.createdAt)}</td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-ink/50 italic">
                      Nicio donație unică primită deocamdată.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lista Membri */}
        <section className="rounded-lg border border-line bg-white shadow-sm overflow-hidden flex flex-col">
          <h2 className="font-serif text-xl font-semibold text-ink px-6 py-4 border-b border-line bg-paper">
            Membri Înregistrați ({members.length})
          </h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-ink border-collapse">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-moss uppercase">
                  <th className="px-6 py-3">Membru</th>
                  <th className="px-6 py-3 text-center">Plan</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3">Creat în</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((mem: MemberRow) => (
                  <tr key={mem.id} className="hover:bg-paper/40">
                    <td className="px-6 py-4">
                      <span className="font-semibold">{mem.name || "Membru Anonim"}</span>
                      <p className="text-xs text-ink/50 mt-0.5">{mem.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-moss uppercase">
                      {mem.plan.replace("monthly_", "")} EUR/lună
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase
                        ${mem.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {mem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink/50">{formatDateTime(mem.createdAt)}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-ink/50 italic">
                      Niciun abonament de membru înregistrat deocamdată.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
