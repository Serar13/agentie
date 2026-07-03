import {
  createDonation,
  getDonationStatsFirebase,
  listDonations,
  listMembers,
  upsertMember
} from "./firebase-store";

export type DonationStats = {
  monthlyTotal: number;
  monthlyTarget: number;
  supportersCount: number;
  foundersCount: number;
  founders: Array<{ name: string; isPublic: boolean; email: string }>;
};

export async function createMockDonation(params: {
  amount: number;
  email: string;
  name?: string;
  isPublic: boolean;
  isFounder: boolean;
}) {
  return createDonation({
    amount: params.amount,
    currency: "EUR",
    email: params.email.trim().toLowerCase(),
    name: params.name || null,
    isPublic: params.isPublic,
    status: "completed",
    isFounder: params.isFounder,
    providerId: "mock_ch_" + Math.random().toString(36).substring(7)
  });
}

export async function createMockSubscription(params: {
  email: string;
  name?: string;
  plan: string;
  isPublic: boolean;
}) {
  return upsertMember({
    email: params.email.trim().toLowerCase(),
    name: params.name || null,
    status: "active",
    plan: params.plan,
    isPublic: params.isPublic,
    providerId: "mock_sub_" + Math.random().toString(36).substring(7)
  });
}

export async function getDonationStats(): Promise<DonationStats> {
  return getDonationStatsFirebase();
}

export async function createStripeCheckoutSession(params: {
  email: string;
  amount: number;
  plan?: string;
  isPublic: boolean;
  isFounder: boolean;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    // Daca nu este configurata cheia Stripe, intoarcem un URL de tip mock redirectionat catre success direct
    const url = new URL(params.successUrl);
    url.searchParams.set("payment_mock_success", "true");
    url.searchParams.set("email", params.email);
    url.searchParams.set("amount", params.amount.toString());
    url.searchParams.set("isPublic", params.isPublic ? "true" : "false");
    url.searchParams.set("isFounder", params.isFounder ? "true" : "false");
    if (params.plan) url.searchParams.set("plan", params.plan);

    return { url: url.toString() };
  }

  // Import dynamic pentru a evita erori la build daca nu e instalat SDK-ul
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" as any });

  let sessionParams: any;

  if (params.plan) {
    // Pentru membership (recurent)
    const priceIdMap: Record<string, string> = {
      monthly_3: process.env.STRIPE_PRICE_MONTHLY_3 || "",
      monthly_5: process.env.STRIPE_PRICE_MONTHLY_5 || "",
      monthly_10: process.env.STRIPE_PRICE_MONTHLY_10 || ""
    };

    const priceId = priceIdMap[params.plan];
    if (!priceId) {
      throw new Error(`Price ID not found for plan: ${params.plan}. Configureaza-l in .env.`);
    }

    sessionParams = {
      mode: "subscription",
      customer_email: params.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        isPublic: params.isPublic ? "true" : "false",
        isFounder: params.isFounder ? "true" : "false",
        plan: params.plan
      }
    };
  } else {
    // Pentru donatie unica
    sessionParams = {
      mode: "payment",
      customer_email: params.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: params.isFounder ? "Sustinator Fondator - Positive News Agency" : "Donatie Unica - Positive News Agency",
              description: "Iti multumim ca sustii un flux curat de stiri pozitive, fara reclame."
            },
            unit_amount: Math.round(params.amount * 100) // in centi
          },
          quantity: 1
        }
      ],
      metadata: {
        isPublic: params.isPublic ? "true" : "false",
        isFounder: params.isFounder ? "true" : "false",
        amount: params.amount.toString()
      }
    };
  }

  const session = await stripe.checkout.sessions.create({
    ...sessionParams,
    success_url: params.successUrl + "?stripe_session_id={CHECKOUT_SESSION_ID}",
    cancel_url: params.cancelUrl
  });

  return { url: session.url };
}

export async function handleStripeWebhookEvent(rawBody: string, signature: string) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    throw new Error("Stripe secret keys are missing.");
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" as any });

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const email = session.customer_details?.email || session.customer_email;
    const isPublic = session.metadata?.isPublic === "true";
    const isFounder = session.metadata?.isFounder === "true";
    const plan = session.metadata?.plan;

    if (session.mode === "subscription") {
      await upsertMember({
        email,
        name: session.customer_details?.name || null,
        status: "active",
        plan: plan || "monthly_3",
        isPublic,
        providerId: session.subscription
      });
      return { success: true };
    } else {
      const amount = Number(session.metadata?.amount || (session.amount_total / 100));
      await createDonation({
        amount,
        currency: "EUR",
        email,
        name: session.customer_details?.name || null,
        isPublic,
        status: "completed",
        isFounder,
        providerId: session.payment_intent
      });
      return { success: true };
    }
  }

  return { success: true };
}

export async function getDonationRows() {
  const [donations, members] = await Promise.all([listDonations(), listMembers()]);
  return { donations, members };
}
