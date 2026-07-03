import {
  getAdminArticles as getFirebaseAdminArticles,
  getArticleForEdit as getFirebaseArticleForEdit,
  getPublishedArticles as getFirebasePublishedArticles
} from "./firebase-store";

export async function getPublishedArticles(categorySlug?: string) {
  return getFirebasePublishedArticles(categorySlug);
}

export async function getAdminArticles(status?: string) {
  return getFirebaseAdminArticles({ status });
}

export async function getArticleForEdit(id: string) {
  return getFirebaseArticleForEdit(id);
}
