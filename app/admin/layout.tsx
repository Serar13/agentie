import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth-helpers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Securizam toate rutele admin/ la nivel de layout!
  await getRequiredAdmin();

  return (
    <div className="bg-paper min-h-screen">
      {/* Sub-header admin nav */}
      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex flex-wrap gap-1 text-sm font-semibold">
            <Link
              href="/admin"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Articole
            </Link>
            <Link
              href="/admin/sources"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Surse RSS / Manuale
            </Link>
            <Link
              href="/admin/submissions"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Propuneri Cititori
            </Link>
            <Link
              href="/admin/newsletter"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Newsletter
            </Link>
            <Link
              href="/admin/donations"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Donații & Membri
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-md px-3.5 py-2 text-ink hover:bg-paper"
            >
              Statistici
            </Link>
          </div>
          <div className="text-xs uppercase tracking-wider text-moss font-bold">
            Portal Control Editorial
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
