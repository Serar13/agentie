import { subscribeNewsletter } from "@/lib/actions";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={subscribeNewsletter} className="grid gap-3 sm:flex">
      <label className="sr-only" htmlFor={compact ? "newsletter-compact" : "newsletter"}>
        Email
      </label>
      <input
        id={compact ? "newsletter-compact" : "newsletter"}
        name="email"
        type="email"
        required
        placeholder="email@exemplu.ro"
        className="min-h-11 flex-1 rounded-md border border-line bg-white px-4 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
      />
      <button
        type="submit"
        className="min-h-11 rounded-md bg-leaf px-5 text-sm font-semibold text-white hover:bg-ink"
      >
        Ma abonez
      </button>
    </form>
  );
}
