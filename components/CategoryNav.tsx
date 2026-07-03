import Link from "next/link";
import { CATEGORY_SEED } from "@/lib/constants";

export function CategoryNav({ active }: { active?: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Categorii">
      <Link
        href="/"
        className={`shrink-0 rounded-md border px-3 py-2 text-sm ${
          !active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-moss"
        }`}
      >
        Toate
      </Link>
      {CATEGORY_SEED.map((category) => (
        <Link
          key={category.slug}
          href={`/?category=${category.slug}`}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm ${
            active === category.slug
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink hover:border-moss"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
