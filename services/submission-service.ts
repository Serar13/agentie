import crypto from "node:crypto";
import { getFirebaseDb } from "../lib/firebase-admin";
import { createModelProvider } from "../agents/model-provider";
import { modelForTier } from "../agents/model-router";
import { uniqueSlug } from "../lib/slug";
import { getCategories } from "./firebase-store";

export type SubmissionAnalysis = {
  isPositive: boolean;
  hasSources: boolean;
  draftTitle: string;
  draftLead: string;
  draftContent: string;
  needsClarification: boolean;
  clarificationQuestion: string;
};

export async function analyzeSubmission(submissionId: string): Promise<SubmissionAnalysis> {
  const submission = await getFirebaseDb()
    .collection("communitySubmissions")
    .doc(submissionId)
    .get()
    .then((doc) => (doc.exists ? ({ id: doc.id, ...doc.data() } as any) : null));

  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  const providerType = process.env.MODEL_PROVIDER ?? "mock";

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForTier("cheap");
      const system = "Esti un editor senior de stiri pozitive. Analizezi propuneri de la comunitate. Raspunzi doar in format JSON valid.";
      const prompt = `Analizeaza urmatoarea propunere de stiri pozitive trimisa de un cititor si determina calitatea acesteia.

Titlu propus: ${submission.title}
Descriere/Detalii: ${submission.description}
Localitate/Oras/Judet: ${submission.location}
Link sursa: ${submission.sourceLink}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "isPositive": boolean (este un subiect constructiv/pozitiv, fara tragedii?),
  "hasSources": boolean (linkul de sursa este complet si pare valid?),
  "draftTitle": "Propunere de titlu curat",
  "draftLead": "Propunere de lead de 1 paragraf",
  "draftContent": "Propunere de continut structurat in paragrafe pe baza descrierii",
  "needsClarification": boolean (lipsesc informatii importante?),
  "clarificationQuestion": "Intrebare catre utilizator daca needsClarification este true, altfel sir gol"
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as SubmissionAnalysis;

      await saveSubmissionAnalysis(submissionId, parsed);

      return parsed;
    } catch (e) {
      console.warn("LLM submission analysis failed, falling back to mock", e);
      return runMockAnalysis(submissionId);
    }
  } else {
    return runMockAnalysis(submissionId);
  }
}

async function runMockAnalysis(submissionId: string): Promise<SubmissionAnalysis> {
  const submission = await getFirebaseDb()
    .collection("communitySubmissions")
    .doc(submissionId)
    .get()
    .then((doc) => {
      if (!doc.exists) throw new Error(`Submission not found: ${submissionId}`);
      return { id: doc.id, ...doc.data() } as any;
    });

  const analysis: SubmissionAnalysis = {
    isPositive: !submission.title.toLowerCase().includes("accident") && !submission.description.toLowerCase().includes("tragedie"),
    hasSources: submission.sourceLink.startsWith("http"),
    draftTitle: `Proiect comunitar: ${submission.title}`,
    draftLead: `O initiativa locala din ${submission.location} aduce un impact pozitiv: ${submission.description.slice(0, 120)}...`,
    draftContent: `Detaliile propuse de cititor:\n\n${submission.description}\n\nSursa indicata: ${submission.sourceLink}`,
    needsClarification: submission.description.length < 50,
    clarificationQuestion: submission.description.length < 50 ? "Ai putea sa ne oferi mai multe detalii despre proiect si persoanele implicate?" : ""
  };

  await saveSubmissionAnalysis(submissionId, analysis);

  return analysis;
}

export async function convertSubmissionToArticle(submissionId: string) {
  const submissionDoc = await getFirebaseDb().collection("communitySubmissions").doc(submissionId).get();
  if (!submissionDoc.exists) {
    throw new Error(`Submission not found: ${submissionId}`);
  }
  const submission = { id: submissionDoc.id, ...submissionDoc.data() } as any;

  let analysis: SubmissionAnalysis;
  if (submission.aiAnalysis) {
    analysis = JSON.parse(submission.aiAnalysis) as SubmissionAnalysis;
  } else {
    analysis = await analyzeSubmission(submissionId);
  }

  // Cauta categoria potrivita sau foloseste prima
  const categories = await getCategories();
  const category =
    categories.find((c) => c.name.toLowerCase().includes(String(submission.category || "").toLowerCase())) ||
    categories[0];

  if (!category) {
    throw new Error("Nu exista nicio categorie creata.");
  }

  const title = analysis.draftTitle || submission.title;
  const articleId = `article_${crypto.randomUUID()}`;
  const article = {
    title,
    slug: uniqueSlug(title, Date.now()),
    lead: analysis.draftLead || submission.description.slice(0, 200),
    content: analysis.draftContent || submission.description,
    categoryId: category.id || category.slug,
    categorySlug: category.slug,
    categoryName: category.name,
    status: "draft",
    sourceName: submission.contactName || "Comunitate",
    originalUrl: submission.sourceLink,
    scannedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    positiveScore: 0,
    confidenceScore: 0,
    references: [
      {
        id: `ref_${crypto.randomUUID()}`,
        title: submission.title,
        outlet: "Propus de cititor",
        url: submission.sourceLink,
        verified: true,
        checkedAt: new Date()
      }
    ]
  };

  await getFirebaseDb().collection("articles").doc(articleId).set(article);

  await getFirebaseDb()
    .collection("communitySubmissions")
    .doc(submissionId)
    .set({ status: "converted_to_article", articleId, updatedAt: new Date() }, { merge: true });

  return { id: articleId, ...article };
}

async function saveSubmissionAnalysis(submissionId: string, analysis: SubmissionAnalysis) {
  await getFirebaseDb()
    .collection("communitySubmissions")
    .doc(submissionId)
    .set({ aiAnalysis: JSON.stringify(analysis), updatedAt: new Date() }, { merge: true });
}
