"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runPipelineForArticle } from "../agents/pipeline";
import { STATUS_VALUES, type ArticleStatus } from "./constants";
import { uniqueSlug } from "./slug";
import { getSession } from "./auth";
import {
  findUserById,
  getArticleForEdit as getFirebaseArticleForEdit,
  updateArticleFirebase,
  updateArticleStatusFirebase,
  updateUser,
  upsertNewsletterSubscriber
} from "@/services/firebase-store";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeStatus(value: string): ArticleStatus {
  return STATUS_VALUES.includes(value as ArticleStatus) ? (value as ArticleStatus) : "needs_review";
}

export async function subscribeNewsletter(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/&error=Pentru newsletter trebuie sa ai cont.");
  }

  const email = field(formData, "email").toLowerCase();
  if (!email || !email.includes("@")) {
    return;
  }

  const user = await findUserById(session.userId);

  if (!user || user.email.toLowerCase() !== email) {
    redirect("/cont?error=Newsletterul trebuie activat cu emailul contului tau.");
  }

  await upsertNewsletterSubscriber(email);
  await updateUser(user.id, { newsletterOptIn: true });

  revalidatePath("/");
  revalidatePath("/support");
  revalidatePath("/cont");
}

export async function updateArticleStatus(formData: FormData) {
  const id = field(formData, "id");
  const status = safeStatus(field(formData, "status"));
  const article = await getFirebaseArticleForEdit(id);

  if (!article) return;

  if (status === "published" || status === "approved") {
    if (article.positiveScore < 75) {
      await updateArticleStatusFirebase(id, {
        status: "needs_review",
        qualityNotes: `Aprobare/Publicare blocata: Scorul pozitiv (${article.positiveScore}) este sub pragul de 75.`
      });
      revalidatePath("/");
      revalidatePath("/admin");
      return;
    }
    if (article.confidenceScore < 80) {
      await updateArticleStatusFirebase(id, {
        status: "needs_review",
        qualityNotes: `Aprobare/Publicare blocata: Scorul de incredere (${article.confidenceScore}) este sub pragul de 80.`
      });
      revalidatePath("/");
      revalidatePath("/admin");
      return;
    }
    if (article.riskLevel === "high") {
      await updateArticleStatusFirebase(id, {
        status: "needs_review",
        qualityNotes: "Aprobare/Publicare blocata: Nivelul de risc este High. Necesita rezolvarea problemelor."
      });
      revalidatePath("/");
      revalidatePath("/admin");
      return;
    }
  }

  if (status === "published" && article.status !== "approved" && article.status !== "published") {
    await updateArticleStatusFirebase(id, {
      status: "needs_review",
      qualityNotes: "Publicarea a fost blocata: articolul trebuie aprobat manual inainte."
    });
  } else {
    await updateArticleStatusFirebase(id, {
      status,
      approvedAt: status === "approved" ? new Date() : article.approvedAt,
      publishedAt: status === "published" ? new Date() : status === "approved" ? null : article.publishedAt
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/articles/${id}`);
}

export async function saveArticle(formData: FormData) {
  const id = field(formData, "id");
  const title = field(formData, "title");
  const referenceUrl = field(formData, "referenceUrl");
  const referenceTitle = field(formData, "referenceTitle") || title;
  const referenceOutlet = field(formData, "referenceOutlet") || field(formData, "sourceName") || "Sursa";

  const articleData = {
      title,
      slug: uniqueSlug(title, id.slice(0, 6)),
      subtitle: field(formData, "subtitle") || null,
      lead: field(formData, "lead"),
      content: field(formData, "content"),
      categoryId: field(formData, "categoryId"),
      sourceName: field(formData, "sourceName") || null,
      originalUrl: field(formData, "originalUrl") || null,
      positiveScore: Number(field(formData, "positiveScore")) || 0,
      confidenceScore: Number(field(formData, "confidenceScore")) || 0,
      sourceQualityScore: Number(field(formData, "sourceQualityScore")) || 0,
      originalityScore: Number(field(formData, "originalityScore")) || 0,
      editorialScore: Number(field(formData, "editorialScore")) || 0,
      riskLevel: field(formData, "riskLevel") || "low",
      rejectionReason: field(formData, "rejectionReason") || null,
      editorNotes: field(formData, "editorNotes") || null,
      reviewedBy: field(formData, "reviewedBy") || null,
      qualityNotes: field(formData, "qualityNotes") || null,
      metaDescription: field(formData, "metaDescription") || null,
      newsletterBlurb: field(formData, "newsletterBlurb") || null,
      socialFacebook: field(formData, "socialFacebook") || null,
      socialInstagram: field(formData, "socialInstagram") || null,
      socialLinkedin: field(formData, "socialLinkedin") || null
    };

  await updateArticleFirebase(id, articleData);

  if (referenceUrl) {
    const article = await getFirebaseArticleForEdit(id);
    const references: any[] = article?.references || [];
    const existing = references.find((ref) => ref.url === referenceUrl);

    if (!existing) {
      references.push({
        id: `ref_${Date.now()}`,
        title: referenceTitle,
        outlet: referenceOutlet,
        url: referenceUrl,
        verified: field(formData, "referenceVerified") === "on",
        checkedAt: field(formData, "referenceVerified") === "on" ? new Date() : null
      });
      await updateArticleFirebase(id, { references });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/articles/${id}`);
  redirect(`/admin/articles/${id}`);
}

export async function regenerateSocialCopy(formData: FormData) {
  const id = field(formData, "id");
  const article = await getFirebaseArticleForEdit(id);
  if (!article) return;

  const cleanTitle = article.title.replace(/^DEMO:\s*/i, "").trim();
  await updateArticleFirebase(id, {
    seoTitle: article.title,
    metaDescription: article.lead.slice(0, 155),
    socialFacebook: `${cleanTitle}\n\nFara reclame. Fara panica. Doar vesti bune, verificate.`,
    socialInstagram: `${cleanTitle}\n\nO veste buna pe zi schimba ritmul informatiei. #vestibune #stiripozitive`,
    socialLinkedin: `${cleanTitle}\n\nUn exemplu de progres verificabil, pregatit pentru cititori fara clickbait.`,
    newsletterBlurb: `5 vesti bune in 5 minute: ${article.lead}`
  });

  revalidatePath(`/admin/articles/${id}`);
}

export async function runPipelineAction(formData: FormData) {
  const id = field(formData, "id");
  if (!id) return;

  await runPipelineForArticle(id);
  revalidatePath("/admin");
  revalidatePath(`/admin/articles/${id}`);
}
