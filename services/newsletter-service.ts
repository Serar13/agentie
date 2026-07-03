import { usesFirebaseData } from "../lib/data-provider";
import { getFirebaseDb } from "../lib/firebase-admin";
import { getAdminArticles, upsertNewsletterSubscriber } from "./firebase-store";

export async function subscribeToNewsletter(email: string, source = "website") {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Adresa de email este invalida.");
  }

  if (usesFirebaseData()) {
    return upsertNewsletterSubscriber(cleanEmail);
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsletterSubscriber.upsert({
    where: { email: cleanEmail },
    create: {
      email: cleanEmail,
      source,
      status: "active"
    },
    update: {
      status: "active"
    }
  });
}

export async function unsubscribeFromNewsletter(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (usesFirebaseData()) {
    return getFirebaseDb().collection("newsletterSubscribers").doc(cleanEmail).set({ status: "unsubscribed" }, { merge: true });
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsletterSubscriber.update({
    where: { email: cleanEmail },
    data: { status: "unsubscribed" }
  });
}

export async function getNewsletterSubscribers() {
  if (usesFirebaseData()) {
    const snap = await getFirebaseDb().collection("newsletterSubscribers").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createNewsletterDraft(params: {
  subject: string;
  intro: string;
  articleIds: string[];
  type?: "daily" | "weekly";
}) {
  if (usesFirebaseData()) {
    const ref = getFirebaseDb().collection("newsletters").doc();
    await ref.set({
      subject: params.subject,
      intro: params.intro,
      articles: JSON.stringify(params.articleIds),
      type: params.type || "daily",
      status: "draft",
      createdAt: new Date()
    });
    return { id: ref.id };
  }

  const { prisma } = await import("../lib/prisma");
  return prisma.newsletter.create({
    data: {
      subject: params.subject,
      intro: params.intro,
      articles: JSON.stringify(params.articleIds),
      type: params.type || "daily",
      status: "draft"
    }
  });
}

export async function renderNewsletterHtml(newsletterId: string): Promise<{ subject: string; html: string }> {
  const newsletter = usesFirebaseData()
    ? await getFirebaseDb()
        .collection("newsletters")
        .doc(newsletterId)
        .get()
        .then((doc) => (doc.exists ? ({ id: doc.id, ...doc.data() } as any) : null))
    : await (async () => {
        const { prisma } = await import("../lib/prisma");
        return prisma.newsletter.findUnique({ where: { id: newsletterId } });
      })();

  if (!newsletter) {
    throw new Error(`Newsletter not found: ${newsletterId}`);
  }

  const articleIds = JSON.parse(newsletter.articles) as string[];
  const articles = usesFirebaseData()
    ? (await getAdminArticles({ status: "all" })).filter((article) => articleIds.includes(article.id))
    : await (async () => {
        const { prisma } = await import("../lib/prisma");
        return prisma.newsArticle.findMany({
          where: { id: { in: articleIds } },
          include: { category: true }
        });
      })();

  // Pastram ordinea selectata
  const orderedArticles = articleIds
    .map((id) => articles.find((a) => a.id === id))
    .filter(Boolean) as typeof articles;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let articlesHtml = "";
  orderedArticles.forEach((article, idx) => {
    articlesHtml += `
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #1e3a8a; font-weight: bold;">
          ${article.category.name}
        </span>
        <h3 style="margin-top: 4px; margin-bottom: 8px; font-family: Georgia, serif; font-size: 20px; color: #0f172a;">
          ${idx + 1}. ${article.title}
        </h3>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">
          ${article.lead}
        </p>
        <a href="${appUrl}/articles/${article.slug}" style="color: #10b981; font-weight: bold; text-decoration: none; font-size: 14px;">
          Citește articolul complet &rarr;
        </a>
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${newsletter.subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background-color: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal;">Positive News Agency</h1>
          <p style="margin-top: 8px; margin-bottom: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #10b981;">
            Fără reclame. Fără panică. Doar vești bune.
          </p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px; font-style: italic;">
            ${newsletter.intro}
          </p>
          
          <h2 style="font-size: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 24px; color: #0f172a;">
            5 vești bune în 5 minute
          </h2>
          
          ${articlesHtml}

          <div style="margin-top: 32px; padding: 24px; background-color: #f8fafc; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">Susține jurnalismul constructiv</h4>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">
              Nu avem reclame și nu vindem date. Suntem susținuți 100% de cititori ca tine.
            </p>
            <a href="${appUrl}/sustine" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
              Fă o donație sau devino membru
            </a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Primești acest email deoarece te-ai abonat la newsletter-ul Positive News Agency.<br>
          <a href="${appUrl}/unsubscribe?email=${encodeURIComponent("{{subscriber_email}}")}" style="color: #64748b; text-decoration: underline; margin-top: 8px; display: inline-block;">
            Dezabonare
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: newsletter.subject, html };
}

export async function sendNewsletterToAllSubscribers(newsletterId: string) {
  const subscribers: any[] = usesFirebaseData()
    ? (await getNewsletterSubscribers()).filter((subscriber: any) => subscriber.status === "active")
    : await (async () => {
        const { prisma } = await import("../lib/prisma");
        return prisma.newsletterSubscriber.findMany({
          where: { status: "active" }
        });
      })();

  const { subject, html } = await renderNewsletterHtml(newsletterId);
  const apiKey = process.env.RESEND_API_KEY;

  console.log(`Sending newsletter ${newsletterId} to ${subscribers.length} active subscribers...`);

  for (const sub of subscribers) {
    const personalizedHtml = html.replace("{{subscriber_email}}", sub.email);

    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Positive News Agency <newsletter@vestibune.ro>",
            to: sub.email,
            subject: subject,
            html: personalizedHtml
          })
        });
      } catch (err) {
        console.error(`Failed to send newsletter email to ${sub.email}:`, err);
      }
    } else {
      // Mock log
      console.log(`[Mock Send] To: ${sub.email}, Subject: ${subject}`);
    }
  }

  if (usesFirebaseData()) {
    await getFirebaseDb().collection("newsletters").doc(newsletterId).set({ status: "sent", sentAt: new Date() }, { merge: true });
  } else {
    const { prisma } = await import("../lib/prisma");
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: "sent",
        sentAt: new Date()
      }
    });
  }

  return subscribers.length;
}
