import { usesFirebaseData } from "../lib/data-provider";
import {
  getAdminArticles as getFirebaseAdminArticles,
  getArticleForEdit as getFirebaseArticleForEdit,
  getPublishedArticles as getFirebasePublishedArticles
} from "./firebase-store";

export async function getPublishedArticles(categorySlug?: string) {
  if (usesFirebaseData()) {
    return getFirebasePublishedArticles(categorySlug);
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsArticle.findMany({
    where: {
      status: "published",
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug
            }
          }
        : {})
    },
    include: {
      category: true,
      references: true
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getAdminArticles(status?: string) {
  if (usesFirebaseData()) {
    return getFirebaseAdminArticles({ status });
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsArticle.findMany({
    where: status && status !== "all" ? { status } : {},
    include: {
      category: true,
      references: true,
      costs: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getArticleForEdit(id: string) {
  if (usesFirebaseData()) {
    return getFirebaseArticleForEdit(id);
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsArticle.findUnique({
    where: { id },
    include: {
      category: true,
      references: true,
      costs: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });
}
