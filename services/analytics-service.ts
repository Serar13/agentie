import { usesFirebaseData } from "../lib/data-provider";
import { getAnalyticsSummaryFirebase, trackEventFirebase } from "./firebase-store";

export async function trackEvent(params: {
  eventType: "view" | "share" | "newsletter_subscribe" | "donation";
  articleId?: string;
  category?: string;
  source?: string;
  readingTime?: number;
}) {
  if (usesFirebaseData()) {
    return trackEventFirebase({
      eventType: params.eventType,
      articleId: params.articleId || null,
      category: params.category || null,
      source: params.source || null,
      readingTime: params.readingTime || null
    });
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.analyticsEvent.create({
    data: {
      eventType: params.eventType,
      articleId: params.articleId || null,
      category: params.category || null,
      source: params.source || null,
      readingTime: params.readingTime || null
    }
  });
}

export async function getAnalyticsSummary() {
  if (usesFirebaseData()) {
    return getAnalyticsSummaryFirebase();
  }

  const { prisma } = await import("../lib/prisma");
  const [totalEvents, topArticles, topCategories, topSources, readingStats] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      _count: { _all: true }
    }),
    prisma.analyticsEvent.groupBy({
      by: ["articleId"],
      where: { eventType: "view", articleId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { articleId: "desc" } },
      take: 10
    }),
    prisma.analyticsEvent.groupBy({
      by: ["category"],
      where: { eventType: "view", category: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 5
    }),
    prisma.analyticsEvent.groupBy({
      by: ["source"],
      where: { eventType: "view", source: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 5
    }),
    prisma.analyticsEvent.aggregate({
      where: { eventType: "view", readingTime: { not: null } },
      _avg: { readingTime: true }
    })
  ]);

  // Mapam articolele pentru a le obtine titlurile
  const articleIds = topArticles.map((a: { articleId: string | null }) => a.articleId).filter(Boolean) as string[];
  const articles = await prisma.newsArticle.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, title: true, slug: true }
  });

  const formattedArticles = topArticles.map((item: { articleId: string | null; _count: { _all: number } }) => {
    const article = articles.find((a: { id: string; title: string; slug: string }) => a.id === item.articleId);
    return {
      title: article?.title || "Articol necunoscut",
      slug: article?.slug || "",
      views: item._count._all
    };
  });

  const getCount = (type: string) => {
    const found = totalEvents.find((e: { eventType: string; _count: { _all: number } }) => e.eventType === type);
    return found?._count._all ?? 0;
  };

  return {
    viewsCount: getCount("view"),
    sharesCount: getCount("share"),
    newsletterConversions: getCount("newsletter_subscribe"),
    donationConversions: getCount("donation"),
    topArticles: formattedArticles,
    topCategories: topCategories.map((c: { category: string | null; _count: { _all: number } }) => ({ name: c.category || "Altele", views: c._count._all })),
    topSources: topSources.map((s: { source: string | null; _count: { _all: number } }) => ({ name: s.source || "Direct", views: s._count._all })),
    averageReadingTime: Math.round(readingStats._avg.readingTime ?? 0)
  };
}
