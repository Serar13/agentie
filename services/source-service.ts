import crypto from "node:crypto";
import { usesFirebaseData } from "../lib/data-provider";
import { uniqueSlug } from "../lib/slug";
import { fetchRssItems, type RssItem } from "./rss";
import { inferCategorySlug } from "./category-router";

export type ScanResult = {
  scannedSources: number;
  createdDrafts: number;
  skippedDuplicates: number;
  rejectedKeywords: number;
  errors: Array<{ source: string; message: string }>;
};

function hashUrl(url: string) {
  return crypto.createHash("sha256").update(url).digest("hex");
}

export async function saveCandidateAsDraft(item: RssItem, defaultCategoryId?: string | null) {
  if (usesFirebaseData()) {
    throw new Error("Scanarea RSS pe Firestore nu este migrata inca.");
  }

  const { prisma } = await import("../lib/prisma");
  const duplicate = await prisma.newsArticle.findFirst({
    where: {
      originalUrl: item.url
    },
    select: { id: true }
  });

  if (duplicate) return { created: false, isDuplicate: true, articleId: duplicate.id };

  let categoryId = defaultCategoryId;

  if (!categoryId) {
    const categorySlug = inferCategorySlug(`${item.title} ${item.excerpt ?? ""}`);
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });
    if (category) {
      categoryId = category.id;
    } else {
      // Fallback la prima categorie daca nu gasim potrivire
      const firstCat = await prisma.category.findFirst();
      categoryId = firstCat?.id || "";
    }
  }

  if (!categoryId) {
    throw new Error("Nu exista nicio categorie definita in sistem.");
  }

  const article = await prisma.newsArticle.create({
    data: {
      title: item.title,
      slug: uniqueSlug(item.title, Date.now()),
      lead: item.excerpt?.slice(0, 280) || "Draft capturat din sursa RSS. Necesita research si verificare.",
      content:
        item.excerpt || "Draft capturat din sursa RSS. Pipeline-ul trebuie sa completeze articolul doar pe baza surselor.",
      categoryId: categoryId,
      status: "draft",
      sourceName: item.sourceName,
      originalUrl: item.url,
      scannedAt: new Date(),
      positiveScore: 0,
      confidenceScore: 0
    }
  });

  await prisma.articleReference.create({
    data: {
      articleId: article.id,
      title: item.title,
      outlet: item.sourceName,
      url: item.url,
      verified: false
    }
  });

  return { created: true, isDuplicate: false, articleId: article.id };
}

export async function scanConfiguredSources(limitPerSource = 15): Promise<ScanResult> {
  if (usesFirebaseData()) {
    return {
      scannedSources: 0,
      createdDrafts: 0,
      skippedDuplicates: 0,
      rejectedKeywords: 0,
      errors: [{ source: "Firestore", message: "Scanarea RSS va fi migrata in pasul urmator; nu folosesc SQLite in live." }]
    };
  }

  const { prisma } = await import("../lib/prisma");
  const result: ScanResult = {
    scannedSources: 0,
    createdDrafts: 0,
    skippedDuplicates: 0,
    rejectedKeywords: 0,
    errors: []
  };

  const sources = await prisma.source.findMany({
    where: {
      status: "active",
      type: "rss"
    },
    orderBy: { createdAt: "asc" }
  });

  for (const source of sources) {
    result.scannedSources += 1;
    let localExtracted = 0;
    let localAccepted = 0;
    let localRejected = 0;

    try {
      const cacheKey = hashUrl(source.url);
      const now = new Date();
      const cache = await prisma.scanCache.findUnique({
        where: { urlHash: cacheKey }
      });

      let items: RssItem[];
      if (cache && cache.expiresAt > now) {
        items = JSON.parse(cache.payload) as RssItem[];
      } else {
        items = await fetchRssItems(source.url, source.name);
        await prisma.scanCache.upsert({
          where: { urlHash: cacheKey },
          create: {
            urlHash: cacheKey,
            originalUrl: source.url,
            payload: JSON.stringify(items),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
          },
          update: {
            payload: JSON.stringify(items),
            fetchedAt: now,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
          }
        });
      }

      const blacklist = source.blacklistKeywords
        ? source.blacklistKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
        : [];
      const whitelist = source.whitelistKeywords
        ? source.whitelistKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
        : [];

      for (const item of items.slice(0, limitPerSource)) {
        localExtracted += 1;

        const checkText = `${item.title} ${item.excerpt || ""}`.toLowerCase();

        // Verificare blacklist
        const matchesBlacklist = blacklist.some((keyword) => checkText.includes(keyword));
        if (matchesBlacklist) {
          localRejected += 1;
          result.rejectedKeywords += 1;
          continue;
        }

        // Verificare whitelist
        if (whitelist.length > 0) {
          const matchesWhitelist = whitelist.some((keyword) => checkText.includes(keyword));
          if (!matchesWhitelist) {
            localRejected += 1;
            result.rejectedKeywords += 1;
            continue;
          }
        }

        const saved = await saveCandidateAsDraft(item, source.categoryId);
        if (saved.created) {
          localAccepted += 1;
          result.createdDrafts += 1;
        } else if (saved.isDuplicate) {
          result.skippedDuplicates += 1;
        }
      }

      await prisma.source.update({
        where: { id: source.id },
        data: {
          lastScannedAt: new Date(),
          articlesExtracted: { increment: localExtracted },
          articlesAccepted: { increment: localAccepted },
          articlesRejected: { increment: localRejected }
        }
      });
    } catch (error) {
      result.errors.push({
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return result;
}
