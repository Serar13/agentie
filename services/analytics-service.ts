import { getAnalyticsSummaryFirebase, trackEventFirebase } from "./firebase-store";

export async function trackEvent(params: {
  eventType: "view" | "share" | "newsletter_subscribe" | "donation";
  articleId?: string;
  category?: string;
  source?: string;
  readingTime?: number;
}) {
  return trackEventFirebase({
    eventType: params.eventType,
    articleId: params.articleId || null,
    category: params.category || null,
    source: params.source || null,
    readingTime: params.readingTime || null
  });
}

export async function getAnalyticsSummary() {
  return getAnalyticsSummaryFirebase();
}
