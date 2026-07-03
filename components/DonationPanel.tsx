const oneTime = ["5 EUR", "10 EUR", "25 EUR"];
const monthly = ["3 EUR", "5 EUR", "10 EUR"];

export function DonationPanel() {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <div className="grid gap-3">
        <p className="text-sm uppercase tracking-[0.18em] text-moss">Sustine proiectul</p>
        <h2 className="font-serif text-3xl font-semibold text-ink">Nu avem reclame.</h2>
        <p className="leading-7 text-ink/72">
          Dacă vrei să existe un loc cu știri pozitive, ne poți susține printr-o contribuție. Fiecare donație ne ajută să rămânem independenți și complet fără reclame.
        </p>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            Donatie unica
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {oneTime.map((amount) => (
              <button
                type="button"
                key={amount}
                className="rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink"
              >
                {amount}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            Membership lunar
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {monthly.map((amount) => (
              <button
                type="button"
                key={amount}
                className="rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink"
              >
                {amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
