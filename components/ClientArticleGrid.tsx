"use client";

import { useState, useTransition } from "react";
import { ArticleCard } from "./ArticleCard";
import { CATEGORY_SEED } from "@/lib/constants";
import type { ArticleReference, Category, NewsArticle } from "@/lib/app-types";

type ArticleRow = NewsArticle & {
  category: Category;
  references: ArticleReference[];
};

export function ClientArticleGrid({ articles }: { articles: ArticleRow[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtram articolele instant in memorie
  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category.slug === selectedCategory)
    : articles;

  const [featured, ...rest] = filteredArticles;

  const handleCategorySelect = (slug: string | null) => {
    startTransition(() => {
      setSelectedCategory(slug);
    });
  };

  return (
    <div className={`transition-opacity duration-200 ${isPending ? "opacity-70" : "opacity-100"}`}>
      {/* Meniu Categorii Client-Side (Instant) */}
      <nav className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-line" aria-label="Categorii">
        <button
          onClick={() => handleCategorySelect(null)}
          className={`shrink-0 rounded-md border px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
            selectedCategory === null
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink hover:border-moss hover:bg-paper"
          }`}
        >
          Toate
        </button>
        {CATEGORY_SEED.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategorySelect(cat.slug)}
            className={`shrink-0 rounded-md border px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              selectedCategory === cat.slug
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:border-moss hover:bg-paper"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Grid Articole */}
      <div className="grid gap-6">
        {featured ? <ArticleCard article={featured} featured /> : null}
        
        {rest.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        ) : null}

        {filteredArticles.length === 0 && (
          <div className="rounded-lg border border-line bg-white p-12 text-center text-ink/55">
            Nu am găsit articole active pentru această secțiune în acest moment. Rețeaua noastră de scanare adaugă conținut nou zilnic!
          </div>
        )}
      </div>
    </div>
  );
}
