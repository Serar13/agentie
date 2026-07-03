import { usesFirebaseData } from "../lib/data-provider";
import { getFirebaseDb } from "../lib/firebase-admin";
import { createModelProvider } from "../agents/model-provider";
import { modelForTier } from "../agents/model-router";
import { uniqueSlug } from "../lib/slug";

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
  const submission = usesFirebaseData()
    ? await getFirebaseDb()
        .collection("communitySubmissions")
        .doc(submissionId)
        .get()
        .then((doc) => (doc.exists ? ({ id: doc.id, ...doc.data() } as any) : null))
    : await (async () => {
        const { prisma } = await import("../lib/prisma");
        return prisma.communitySubmission.findUnique({ where: { id: submissionId } });
      })();

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
  const submission = usesFirebaseData()
    ? await getFirebaseDb()
        .collection("communitySubmissions")
        .doc(submissionId)
        .get()
        .then((doc) => {
          if (!doc.exists) throw new Error(`Submission not found: ${submissionId}`);
          return { id: doc.id, ...doc.data() } as any;
        })
    : await (async () => {
        const { prisma } = await import("../lib/prisma");
        return prisma.communitySubmission.findUniqueOrThrow({ where: { id: submissionId } });
      })();

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
  if (usesFirebaseData()) {
    throw new Error("Conversia propunerilor in articole Firestore va fi migrata in pasul urmator.");
  }

  const { prisma } = await import("../lib/prisma");
  const submission = await prisma.communitySubmission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  let analysis: SubmissionAnalysis;
  if (submission.aiAnalysis) {
    analysis = JSON.parse(submission.aiAnalysis) as SubmissionAnalysis;
  } else {
    analysis = await analyzeSubmission(submissionId);
  }

  // Cauta categoria potrivita in DB sau foloseste prima
  let category = await prisma.category.findFirst({
    where: { name: { contains: submission.category } }
  });

  if (!category) {
    category = await prisma.category.findFirst();
  }

  if (!category) {
    throw new Error("Nu exista nicio categorie creata.");
  }

  const article = await prisma.newsArticle.create({
    data: {
      title: analysis.draftTitle || submission.title,
      slug: uniqueSlug(analysis.draftTitle || submission.title, Date.now()),
      lead: analysis.draftLead || submission.description.slice(0, 200),
      content: analysis.draftContent || submission.description,
      categoryId: category.id,
      status: "draft",
      sourceName: submission.contactName || "Comunitate",
      originalUrl: submission.sourceLink
    }
  });

  // Salveaza referinta
  await prisma.articleReference.create({
    data: {
      articleId: article.id,
      title: submission.title,
      outlet: "Propus de cititor",
      url: submission.sourceLink,
      verified: true
    }
  });

  await prisma.communitySubmission.update({
    where: { id: submissionId },
    data: {
      status: "converted_to_article",
      articleId: article.id
    }
  });

  return article;
}

async function saveSubmissionAnalysis(submissionId: string, analysis: SubmissionAnalysis) {
  if (usesFirebaseData()) {
    await getFirebaseDb()
      .collection("communitySubmissions")
      .doc(submissionId)
      .set({ aiAnalysis: JSON.stringify(analysis), updatedAt: new Date() }, { merge: true });
    return;
  }

  const { prisma } = await import("../lib/prisma");
  await prisma.communitySubmission.update({
    where: { id: submissionId },
    data: {
      aiAnalysis: JSON.stringify(analysis)
    }
  });
}
