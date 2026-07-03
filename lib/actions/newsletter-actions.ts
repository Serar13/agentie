"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { subscribeToNewsletter, unsubscribeFromNewsletter, createNewsletterDraft, sendNewsletterToAllSubscribers } from "../../services/newsletter-service";
import { getRequiredAdmin } from "../auth-helpers";
import { trackEvent } from "../../services/analytics-service";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function subscribeNewsletterAction(formData: FormData) {
  const email = getField(formData, "email");
  if (!email) return { error: "Emailul este obligatoriu." };

  try {
    await subscribeToNewsletter(email, "website");
    // Track conversion
    await trackEvent({ eventType: "newsletter_subscribe" });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Eroare la abonare." };
  }
}

export async function unsubscribeNewsletterAction(formData: FormData) {
  const email = getField(formData, "email");
  if (!email) {
    redirect("/unsubscribe?error=Emailul este obligatoriu.");
  }

  try {
    await unsubscribeFromNewsletter(email);
    redirect("/unsubscribe?success=true");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare la dezabonare.";
    redirect(`/unsubscribe?error=${encodeURIComponent(msg)}`);
  }
}

export async function createNewsletterAction(formData: FormData) {
  await getRequiredAdmin();

  const subject = getField(formData, "subject");
  const intro = getField(formData, "intro");
  const articlesRaw = formData.getAll("articles") as string[];

  if (!subject || !intro || articlesRaw.length === 0) {
    throw new Error("Subiectul, intro-ul si cel putin o stire sunt obligatorii.");
  }

  const newsletter = await createNewsletterDraft({
    subject,
    intro,
    articleIds: articlesRaw
  });

  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter?preview=${newsletter.id}`);
}

export async function sendNewsletterAction(newsletterId: string) {
  await getRequiredAdmin();

  await sendNewsletterToAllSubscribers(newsletterId);
  revalidatePath("/admin/newsletter");
}
