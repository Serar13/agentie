import crypto from "node:crypto";
import { usesFirebaseData } from "../lib/data-provider";
import { uniqueSlug } from "../lib/slug";
import { fetchRssItems, type RssItem } from "./rss";
import { inferCategorySlug } from "./category-router";
import { getCategories } from "./firebase-store";
import { getFirebaseDb } from "../lib/firebase-admin";

export type ScanResult = {
  scannedSources: number;
  createdDrafts: number;
  skippedDuplicates: number;
  rejectedKeywords: number;
  errors: Array<{ source: string; message: string }>;
};

const fromDoc = (doc: any) => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
  };
};

function hashUrl(url: string) {
  return crypto.createHash("sha256").update(url).digest("hex");
}

export async function saveCandidateAsDraft(item: RssItem, defaultCategoryId?: string | null) {
  if (usesFirebaseData()) {
    const snap = await getFirebaseDb()
      .collection("articles")
      .where("originalUrl", "==", item.url)
      .limit(1)
      .get();

    if (!snap.empty) {
      return { created: false, isDuplicate: true, articleId: snap.docs[0].id };
    }

    const categories = await getCategories();
    let categoryId = defaultCategoryId;

    if (!categoryId) {
      const categorySlug = inferCategorySlug(`${item.title} ${item.excerpt ?? ""}`);
      const category = categories.find((c) => c.slug === categorySlug);
      if (category) {
        categoryId = category.id || category.slug;
      } else {
        categoryId = categories[0]?.id || categories[0]?.slug || "";
      }
    }

    if (!categoryId) {
      throw new Error("Nu exista nicio categorie definita in sistem.");
    }

    const matchedCategory = categories.find((c) => c.id === categoryId || c.slug === categoryId);
    const categorySlug = matchedCategory?.slug || "general";
    const categoryName = matchedCategory?.name || "General";

    const articleId = `article_${crypto.randomUUID()}`;
    const article = {
      title: item.title,
      slug: uniqueSlug(item.title, Date.now()),
      lead: item.excerpt?.slice(0, 280) || "Draft capturat din sursa RSS. Necesita research si verificare.",
      content: item.excerpt || "Draft capturat din sursa RSS. Pipeline-ul trebuie sa completeze articolul doar pe baza surselor.",
      categoryId: categoryId,
      categorySlug: categorySlug,
      categoryName: categoryName,
      status: "draft",
      sourceName: item.sourceName,
      originalUrl: item.url,
      scannedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      positiveScore: 0,
      confidenceScore: 0,
      references: [
        {
          id: `ref_${crypto.randomUUID()}`,
          title: item.title,
          outlet: item.sourceName,
          url: item.url,
          verified: false,
          checkedAt: new Date()
        }
      ]
    };

    await getFirebaseDb().collection("articles").doc(articleId).set(article);
    return { created: true, isDuplicate: false, articleId };
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
  const result: ScanResult = {
    scannedSources: 0,
    createdDrafts: 0,
    skippedDuplicates: 0,
    rejectedKeywords: 0,
    errors: []
  };

  let sources: any[] = [];
  if (usesFirebaseData()) {
    const snap = await getFirebaseDb()
      .collection("sources")
      .where("status", "==", "active")
      .where("type", "==", "rss")
      .get();
    sources = snap.docs.map((doc) => fromDoc(doc));
  } else {
    const { prisma } = await import("../lib/prisma");
    sources = await prisma.source.findMany({
      where: {
        status: "active",
        type: "rss"
      },
      orderBy: { createdAt: "asc" }
    });
  }

  for (const source of sources) {
    result.scannedSources += 1;
    let localExtracted = 0;
    let localAccepted = 0;
    let localRejected = 0;

    try {
      const cacheKey = hashUrl(source.url);
      const now = new Date();
      let items: RssItem[] = [];

      if (usesFirebaseData()) {
        const cacheDoc = await getFirebaseDb().collection("scanCache").doc(cacheKey).get();
        const cache = cacheDoc.exists ? cacheDoc.data() : null;
        const expiresAt = cache?.expiresAt?.toDate ? cache.expiresAt.toDate() : null;
        if (cache && expiresAt && expiresAt > now) {
          items = JSON.parse(cache.payload) as RssItem[];
        } else {
          items = await fetchRssItems(source.url, source.name);
          await getFirebaseDb().collection("scanCache").doc(cacheKey).set({
            urlHash: cacheKey,
            originalUrl: source.url,
            payload: JSON.stringify(items),
            fetchedAt: now,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
          });
        }
      } else {
        const { prisma } = await import("../lib/prisma");
        const cache = await prisma.scanCache.findUnique({
          where: { urlHash: cacheKey }
        });

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
      }

      const blacklist = source.blacklistKeywords
        ? source.blacklistKeywords.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean)
        : [];
      const whitelist = source.whitelistKeywords
        ? source.whitelistKeywords.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean)
        : [];

      for (const item of items.slice(0, limitPerSource)) {
        localExtracted += 1;

        const checkText = `${item.title} ${item.excerpt || ""}`.toLowerCase();

        // Verificare blacklist
        const matchesBlacklist = blacklist.some((keyword: string) => checkText.includes(keyword));
        if (matchesBlacklist) {
          localRejected += 1;
          result.rejectedKeywords += 1;
          continue;
        }

        // Verificare whitelist
        if (whitelist.length > 0) {
          const matchesWhitelist = whitelist.some((keyword: string) => checkText.includes(keyword));
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

      if (usesFirebaseData()) {
        const docRef = getFirebaseDb().collection("sources").doc(source.id);
        const docSnap = await docRef.get();
        const currentData = docSnap.exists ? docSnap.data() : {};
        await docRef.set({
          lastScannedAt: new Date(),
          articlesExtracted: (currentData?.articlesExtracted || 0) + localExtracted,
          articlesAccepted: (currentData?.articlesAccepted || 0) + localAccepted,
          articlesRejected: (currentData?.articlesRejected || 0) + localRejected,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        const { prisma } = await import("../lib/prisma");
        await prisma.source.update({
          where: { id: source.id },
          data: {
            lastScannedAt: new Date(),
            articlesExtracted: { increment: localExtracted },
            articlesAccepted: { increment: localAccepted },
            articlesRejected: { increment: localRejected }
          }
        });
      }
    } catch (error) {
      result.errors.push({
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return result;
}
