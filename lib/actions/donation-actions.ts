"use server";

import { redirect } from "next/navigation";
import { createStripeCheckoutSession, createMockDonation, createMockSubscription } from "../../services/donation-service";
import { trackEvent } from "../../services/analytics-service";
import { getRequiredSession } from "../auth-helpers";
import { usesFirebaseData } from "../data-provider";
import { findUserById } from "@/services/firebase-store";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDonationSessionAction(formData: FormData) {
  const authSession = await getRequiredSession();
  const user = usesFirebaseData()
    ? await findUserById(authSession.userId)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { id: authSession.userId } });
      })();
  if (!user) redirect("/login?error=Contul nu a fost gasit.");

  const email = user.email;
  const amount = Number(getField(formData, "amount") || 10);
  const type = getField(formData, "type"); // "one_time" | "monthly"
  const plan = getField(formData, "plan"); // "monthly_3" | "monthly_5" | "monthly_10"
  const isPublic = getField(formData, "isPublic") === "on";
  const isFounder = getField(formData, "isFounder") === "on";
  const name = getField(formData, "name") || user.name || null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = `${appUrl}/sustine/success`;
  const cancelUrl = `${appUrl}/sustine`;

  const checkoutSession = await createStripeCheckoutSession({
    email,
    amount: type === "one_time" ? amount : 0,
    plan: type === "monthly" ? plan : undefined,
    isPublic,
    isFounder,
    successUrl,
    cancelUrl
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  } else {
    throw new Error("Eroare la generarea sesiunii de plata.");
  }
}

export async function createMockDonationAction(formData: FormData) {
  const authSession = await getRequiredSession();
  const user = usesFirebaseData()
    ? await findUserById(authSession.userId)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { id: authSession.userId } });
      })();
  if (!user) redirect("/login?error=Contul nu a fost gasit.");

  const email = user.email;
  const amount = Number(getField(formData, "amount") || 10);
  const type = getField(formData, "type"); // "one_time" | "monthly"
  const plan = getField(formData, "plan") || "monthly_3";
  const isPublic = getField(formData, "isPublic") === "on";
  const isFounder = getField(formData, "isFounder") === "on";
  const name = getField(formData, "name") || user.name || "Sustinător Anonim";

  if (type === "monthly") {
    await createMockSubscription({
      email,
      name,
      plan,
      isPublic
    });
  } else {
    await createMockDonation({
      amount,
      email,
      name,
      isPublic,
      isFounder
    });
  }

  // Log analytics event
  await trackEvent({ eventType: "donation" });

  redirect("/sustine/success?payment_mock_success=true");
}
