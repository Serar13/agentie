"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { analyzeSubmission, convertSubmissionToArticle } from "../../services/submission-service";
import { getRequiredAdmin } from "../auth-helpers";
import { usesFirebaseData } from "../data-provider";
import { getFirebaseDb } from "../firebase-admin";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitVesteBuna(formData: FormData) {
  const title = getField(formData, "title");
  const description = getField(formData, "description");
  const category = getField(formData, "category");
  const location = getField(formData, "location");
  const sourceLink = getField(formData, "sourceLink");
  const contactName = getField(formData, "contactName");
  const contactEmail = getField(formData, "contactEmail");
  const optionalLinks = getField(formData, "optionalLinks") || null;
  const contactConsent = getField(formData, "contactConsent") === "on";

  if (!title || !description || !category || !location || !sourceLink || !contactName || !contactEmail) {
    redirect("/trimite-o-veste-buna?error=Toate campurile marcate sunt obligatorii.");
  }

  const data = {
      title,
      description,
      category,
      location,
      sourceLink,
      contactName,
      contactEmail,
      optionalLinks,
      contactConsent,
      status: "submitted"
  };

  const submission = usesFirebaseData()
    ? await (async () => {
        const ref = getFirebaseDb().collection("communitySubmissions").doc();
        await ref.set({ ...data, createdAt: new Date(), updatedAt: new Date() });
        return { id: ref.id };
      })()
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.communitySubmission.create({ data });
      })();

  // Declansam analiza AI in background (in Next.js se ruleaza direct)
  try {
    await analyzeSubmission(submission.id);
  } catch (err) {
    console.error("Failed to run AI analysis on new submission:", err);
  }

  redirect("/trimite-o-veste-buna?success=true");
}

export async function analyzeSubmissionAction(submissionId: string) {
  await getRequiredAdmin();
  await analyzeSubmission(submissionId);
  revalidatePath("/admin/submissions");
}

export async function convertSubmissionAction(submissionId: string) {
  await getRequiredAdmin();
  const article = await convertSubmissionToArticle(submissionId);
  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  redirect(`/admin/articles/${article.id}`);
}

export async function rejectSubmissionAction(submissionId: string) {
  await getRequiredAdmin();
  if (usesFirebaseData()) {
    await getFirebaseDb().collection("communitySubmissions").doc(submissionId).set({ status: "rejected", updatedAt: new Date() }, { merge: true });
  } else {
    const { prisma } = await import("../prisma");
    await prisma.communitySubmission.update({
      where: { id: submissionId },
      data: { status: "rejected" }
    });
  }
  revalidatePath("/admin/submissions");
}
