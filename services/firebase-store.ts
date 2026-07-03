import crypto from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { CATEGORY_SEED } from "@/lib/constants";
import { getFirebaseDb } from "@/lib/firebase-admin";

export type FireUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  location: string | null;
  followedCategories: string;
  savedArticles: string;
  newsletterOptIn: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate();
  return new Date(String(value));
}

function fromDoc<T extends Record<string, any>>(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    createdAt: asDate(data.createdAt) || new Date(),
    updatedAt: asDate(data.updatedAt) || asDate(data.createdAt) || new Date(),
    publishedAt: asDate(data.publishedAt),
    approvedAt: asDate(data.approvedAt),
    scannedAt: asDate(data.scannedAt),
    checkedAt: asDate(data.checkedAt),
    sentAt: asDate(data.sentAt)
  } as unknown as T;
}

async function ensureSeed() {
  const db = getFirebaseDb();
  const categoriesSnap = await db.collection("categories").limit(1).get();
  if (categoriesSnap.empty) {
    const batch = db.batch();
    CATEGORY_SEED.forEach((category) => {
      batch.set(db.collection("categories").doc(category.slug), {
        ...category,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
  }

  const articlesSnap = await db.collection("articles").limit(1).get();
  if (!articlesSnap.empty) return;

  const now = new Date();
  const demoArticles = [
    {
      id: "demo_romania_buna",
      title: "O retea de voluntari duce carti si ateliere in sate mici",
      slug: "retea-voluntari-carti-ateliere-sate",
      subtitle: "Un model simplu de educatie comunitara poate fi replicat rapid local.",
      lead: "Bibliotecile mobile si atelierele de weekend aduc resurse educationale acolo unde oferta locala este limitata.",
      content:
        "Programul combina donatii de carte, mentorat si sesiuni practice tinute de voluntari locali.\n\nEchipa editoriala marcheaza acest articol ca demo pana cand fluxul de surse reale este conectat la Firestore.",
      imageUrl: "/images/romania-buna.png",
      categoryId: "romania-buna",
      categorySlug: "romania-buna",
      categoryName: "Romania buna",
      status: "published",
      positiveScore: 91,
      confidenceScore: 87,
      sourceQualityScore: 82,
      originalityScore: 80,
      editorialScore: 88,
      riskLevel: "low",
      sourceName: "Demo editorial",
      references: [
        {
          id: "ref_demo_1",
          title: "Program comunitar local",
          outlet: "Demo",
          url: "https://example.com",
          verified: true,
          checkedAt: now
        }
      ]
    },
    {
      id: "demo_mediu",
      title: "Scoli si primarii planteaza perdele verzi in jurul curtilor",
      slug: "scoli-primarii-perdele-verzi",
      subtitle: "Initiativele locale mici pot imbunatati confortul urban si educatia de mediu.",
      lead: "Elevii participa la plantari si monitorizeaza evolutia arborilor pe parcursul anului scolar.",
      content:
        "Proiectele de vegetatie urbana creeaza umbra, reduc praful si transforma curtea scolii intr-un spatiu de invatare aplicata.\n\nAcesta este continut demo pentru etapa Firebase.",
      imageUrl: "/images/mediu.png",
      categoryId: "mediu",
      categorySlug: "mediu",
      categoryName: "Mediu",
      status: "published",
      positiveScore: 89,
      confidenceScore: 84,
      sourceQualityScore: 80,
      originalityScore: 76,
      editorialScore: 86,
      riskLevel: "low",
      sourceName: "Demo editorial",
      references: [
        {
          id: "ref_demo_2",
          title: "Initiativa de mediu",
          outlet: "Demo",
          url: "https://example.com",
          verified: true,
          checkedAt: now
        }
      ]
    }
  ];

  const batch = db.batch();
  demoArticles.forEach((article) => {
    batch.set(db.collection("articles").doc(article.id), {
      ...article,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      approvedAt: now,
      scannedAt: now
    });
  });
  await batch.commit();
}

export async function getCategories() {
  await ensureSeed();
  const snap = await getFirebaseDb().collection("categories").orderBy("name", "asc").get();
  return snap.docs.map((doc) => fromDoc<any>(doc));
}

export async function getPublishedArticles(categorySlug?: string, todayOnly = false) {
  await ensureSeed();
  const snap = await getFirebaseDb().collection("articles").where("status", "==", "published").get();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return snap.docs
    .map((doc) => normalizeArticle(fromDoc<any>(doc)))
    .filter((article) => !categorySlug || article.category.slug === categorySlug)
    .filter((article) => !todayOnly || !article.publishedAt || article.publishedAt >= startOfToday)
    .sort((a, b) => (b.publishedAt?.getTime() || b.createdAt.getTime()) - (a.publishedAt?.getTime() || a.createdAt.getTime()));
}

export async function getPublishedArticleBySlug(slug: string) {
  const articles = await getPublishedArticles();
  return articles.find((article) => article.slug === slug) || null;
}

export async function getAdminArticles(filters?: {
  status?: string;
  categoryId?: string;
  riskLevel?: string;
  scoreFilter?: string;
  sort?: string;
}) {
  await ensureSeed();
  const snap = await getFirebaseDb().collection("articles").get();
  return snap.docs
    .map((doc) => normalizeArticle(fromDoc<any>(doc)))
    .filter((article) => !filters?.status || filters.status === "all" || article.status === filters.status)
    .filter((article) => !filters?.categoryId || filters.categoryId === "all" || article.categoryId === filters.categoryId)
    .filter((article) => !filters?.riskLevel || filters.riskLevel === "all" || article.riskLevel === filters.riskLevel)
    .filter((article) => filters?.scoreFilter !== "low_positive" || article.positiveScore < 75)
    .filter((article) => filters?.scoreFilter !== "low_confidence" || article.confidenceScore < 80)
    .sort((a, b) => {
      const diff = a.updatedAt.getTime() - b.updatedAt.getTime();
      return filters?.sort === "asc" ? diff : -diff;
    });
}

export async function getUniqueSources() {
  const articles = await getAdminArticles();
  return Array.from(new Set(articles.map((article) => article.sourceName).filter(Boolean))).map((sourceName) => ({ sourceName }));
}

export async function getArticleForEdit(idValue: string) {
  await ensureSeed();
  const doc = await getFirebaseDb().collection("articles").doc(idValue).get();
  return doc.exists ? normalizeArticle(fromDoc<any>(doc)) : null;
}

export async function updateArticleStatusFirebase(idValue: string, data: Record<string, unknown>) {
  await getFirebaseDb()
    .collection("articles")
    .doc(idValue)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function updateArticleFirebase(idValue: string, data: Record<string, unknown>) {
  await updateArticleStatusFirebase(idValue, data);
}

function normalizeArticle(article: any) {
  return {
    ...article,
    category: article.category || {
      id: article.categoryId || article.categorySlug,
      name: article.categoryName || article.categorySlug || "General",
      slug: article.categorySlug || article.categoryId || "general",
      description: ""
    },
    references: article.references || [],
    costs: article.costs || []
  };
}

export async function findUserByEmail(email: string) {
  const snap = await getFirebaseDb().collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
  return snap.empty ? null : fromDoc<FireUser>(snap.docs[0]);
}

export async function findUserById(userId: string) {
  const doc = await getFirebaseDb().collection("users").doc(userId).get();
  return doc.exists ? fromDoc<FireUser>(doc) : null;
}

export async function countUsers() {
  const snap = await getFirebaseDb().collection("users").count().get();
  return snap.data().count;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name?: string | null;
  location?: string | null;
  role: string;
}) {
  const userId = id("user");
  const now = new Date();
  const user = {
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    name: data.name || null,
    location: data.location || null,
    role: data.role,
    followedCategories: "",
    savedArticles: "",
    newsletterOptIn: true,
    createdAt: now,
    updatedAt: now
  };
  await getFirebaseDb().collection("users").doc(userId).set(user);
  return { id: userId, ...user };
}

export async function updateUser(userId: string, data: Record<string, unknown>) {
  await getFirebaseDb()
    .collection("users")
    .doc(userId)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function upsertNewsletterSubscriber(email: string) {
  const normalized = email.toLowerCase();
  await getFirebaseDb()
    .collection("newsletterSubscribers")
    .doc(normalized)
    .set(
      {
        email: normalized,
        source: "website",
        status: "active",
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}

export async function createDonation(data: any) {
  const donation = {
    ...data,
    email: data.email.toLowerCase(),
    currency: data.currency || "EUR",
    status: data.status || "completed",
    createdAt: new Date()
  };
  const ref = getFirebaseDb().collection("donations").doc(id("donation"));
  await ref.set(donation);
  return { id: ref.id, ...donation };
}

export async function upsertMember(data: any) {
  const email = data.email.toLowerCase();
  const member = {
    ...data,
    email,
    status: data.status || "active",
    updatedAt: new Date(),
    createdAt: data.createdAt || new Date()
  };
  await getFirebaseDb().collection("members").doc(email).set(member, { merge: true });
  return { id: email, ...member };
}

export async function listDonations() {
  const snap = await getFirebaseDb().collection("donations").get();
  return snap.docs.map((doc) => fromDoc<any>(doc)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listMembers() {
  const snap = await getFirebaseDb().collection("members").get();
  return snap.docs.map((doc) => fromDoc<any>(doc)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getDonationStatsFirebase() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [donations, members] = await Promise.all([listDonations(), listMembers()]);
  const completedDonations = donations.filter((donation) => donation.status === "completed");
  const activeMembers = members.filter((member) => member.status === "active");
  const donationTotal = completedDonations
    .filter((donation) => donation.createdAt >= startOfMonth)
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const membershipTotal = activeMembers.reduce((sum, member) => {
    if (member.plan === "monthly_3") return sum + 3;
    if (member.plan === "monthly_5") return sum + 5;
    if (member.plan === "monthly_10") return sum + 10;
    return sum;
  }, 0);
  const uniqueEmails = new Set([...completedDonations.map((d) => d.email), ...activeMembers.map((m) => m.email)]);
  const founders = completedDonations.filter((donation) => donation.isFounder);

  return {
    monthlyTotal: donationTotal + membershipTotal,
    monthlyTarget: 1000,
    supportersCount: uniqueEmails.size,
    foundersCount: Math.min(100, founders.length),
    founders: founders.map((founder) => ({
      name: founder.isPublic ? founder.name || "Sustinător Anonim" : "Sustinător Anonim",
      isPublic: founder.isPublic,
      email: founder.email
    }))
  };
}

export async function trackEventFirebase(data: any) {
  await getFirebaseDb()
    .collection("analyticsEvents")
    .doc(id("event"))
    .set({ ...data, createdAt: FieldValue.serverTimestamp() });
}

export async function getAnalyticsSummaryFirebase() {
  const eventsSnap = await getFirebaseDb().collection("analyticsEvents").get();
  const events = eventsSnap.docs.map((doc) => fromDoc<any>(doc));
  const articles = await getAdminArticles();
  const countBy = (key: string, filter?: (event: any) => boolean) => {
    const map = new Map<string, number>();
    events.filter(filter || (() => true)).forEach((event) => {
      const value = event[key];
      if (!value) return;
      map.set(value, (map.get(value) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };
  const topArticles = countBy("articleId", (event) => event.eventType === "view").slice(0, 10).map(([articleId, views]) => {
    const article = articles.find((item) => item.id === articleId);
    return { title: article?.title || "Articol necunoscut", slug: article?.slug || "", views };
  });
  const readingTimes = events.filter((event) => event.eventType === "view" && event.readingTime).map((event) => Number(event.readingTime));

  return {
    viewsCount: events.filter((event) => event.eventType === "view").length,
    sharesCount: events.filter((event) => event.eventType === "share").length,
    newsletterConversions: events.filter((event) => event.eventType === "newsletter_subscribe").length,
    donationConversions: events.filter((event) => event.eventType === "donation").length,
    topArticles,
    topCategories: countBy("category", (event) => event.eventType === "view").slice(0, 5).map(([name, views]) => ({ name, views })),
    topSources: countBy("source", (event) => event.eventType === "view").slice(0, 5).map(([name, views]) => ({ name, views })),
    averageReadingTime: readingTimes.length ? Math.round(readingTimes.reduce((sum, value) => sum + value, 0) / readingTimes.length) : 0
  };
}

export async function logCostFirebase(data: any) {
  await getFirebaseDb()
    .collection("costLogs")
    .doc(id("cost"))
    .set({ ...data, createdAt: FieldValue.serverTimestamp() });
}

export async function getCostSummaryFirebase() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [costSnap, articleSnap] = await Promise.all([
    getFirebaseDb().collection("costLogs").get(),
    getFirebaseDb().collection("articles").get()
  ]);
  const logs = costSnap.docs.map((doc) => fromDoc<any>(doc));
  const monthLogs = logs.filter((log) => log.createdAt >= startOfMonth);
  const dayLogs = logs.filter((log) => log.createdAt >= startOfDay);
  const articlesThisMonth = articleSnap.docs
    .map((doc) => fromDoc<any>(doc))
    .filter((article) => article.createdAt >= startOfMonth && ["approved", "published"].includes(article.status)).length;
  const monthlyCost = monthLogs.reduce((sum, log) => sum + Number(log.estimatedCostEur || 0), 0);

  return {
    dailyCost: dayLogs.reduce((sum, log) => sum + Number(log.estimatedCostEur || 0), 0),
    monthlyCost,
    inputTokensMonth: monthLogs.reduce((sum, log) => sum + Number(log.inputTokens || 0), 0),
    outputTokensMonth: monthLogs.reduce((sum, log) => sum + Number(log.outputTokens || 0), 0),
    articlesThisMonth,
    averageCostPerArticle: articlesThisMonth > 0 ? monthlyCost / articlesThisMonth : 0
  };
}

export async function getTotalsFirebase() {
  const [users, admins, subscribers, published, submissions] = await Promise.all([
    getFirebaseDb().collection("users").count().get(),
    getFirebaseDb().collection("users").where("role", "==", "admin").count().get(),
    getFirebaseDb().collection("newsletterSubscribers").where("status", "==", "active").count().get(),
    getFirebaseDb().collection("articles").where("status", "==", "published").count().get(),
    getFirebaseDb().collection("communitySubmissions").count().get()
  ]);
  return [
    users.data().count,
    admins.data().count,
    subscribers.data().count,
    published.data().count,
    submissions.data().count
  ] as const;
}

export async function getAccountOverview(email: string, savedArticleIds: string[], followedSlugs: string[]) {
  const [submissionsSnap, donations, members, articles, categories] = await Promise.all([
    getFirebaseDb().collection("communitySubmissions").where("contactEmail", "==", email).get(),
    listDonations(),
    listMembers(),
    getPublishedArticles(),
    getCategories()
  ]);
  return {
    submissions: submissionsSnap.docs.map((doc) => fromDoc<any>(doc)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    donations: donations.filter((donation) => donation.email === email && donation.status === "completed"),
    membership: members.find((member) => member.email === email) || null,
    savedArticles: articles.filter((article) => savedArticleIds.includes(article.id)),
    followedCategories: categories.filter((category) => followedSlugs.includes(category.slug))
  };
}

export async function listSources() {
  const [sourcesSnap, categories] = await Promise.all([getFirebaseDb().collection("sources").get(), getCategories()]);
  return sourcesSnap.docs
    .map((doc) => {
      const source = fromDoc<any>(doc);
      return {
        ...source,
        category: source.categoryId ? categories.find((category) => category.id === source.categoryId || category.slug === source.categoryId) || null : null,
        articlesExtracted: source.articlesExtracted || 0,
        articlesAccepted: source.articlesAccepted || 0,
        articlesRejected: source.articlesRejected || 0
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createSource(data: any) {
  const sourceId = id("source");
  await getFirebaseDb()
    .collection("sources")
    .doc(sourceId)
    .set({
      ...data,
      type: data.type || "rss",
      status: data.status || "active",
      articlesExtracted: 0,
      articlesAccepted: 0,
      articlesRejected: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
}

export async function updateSourceFirebase(sourceId: string, data: any) {
  await getFirebaseDb()
    .collection("sources")
    .doc(sourceId)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteSourceFirebase(sourceId: string) {
  await getFirebaseDb().collection("sources").doc(sourceId).delete();
}

export async function listSubmissions() {
  const snap = await getFirebaseDb().collection("communitySubmissions").get();
  return snap.docs.map((doc) => fromDoc<any>(doc)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
