import { slugify } from "../lib/slug";
import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, DraftResult, SeoSocialResult } from "./types";

export async function runSeoSocialAgent(
  context: AgentContext,
  draft: DraftResult
): Promise<SeoSocialResult> {
  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: SeoSocialResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("seo_social_agent");
      const system = "Esti un expert SEO si Social Media Manager. Raspunzi doar in format JSON valid.";
      const prompt = `Analizeaza stirea de mai jos si genereaza pachetul complet de SEO si distributie Social Media:
1. Meta Title si Meta Description optimizate SEO.
2. Slug URL curat si sugestiv.
3. Postare Facebook (stil informativ, apel la progres, fara clickbait, CTA discret spre site/sustinere).
4. Postare Instagram (stil vizual, inspirational, cu hashtags incluse).
5. Postare LinkedIn (stil profesional, orientat pe initiative si business pozitiv).
6. TikTok/Reels Script (script video scurt de 30-60 de secunde, cu indicatii vizuale si text pe ecran).
7. YouTube Shorts Script (script video scurt, orientat pe fapte rapide).
8. 3 hook-uri video de impact (fraze scurte pentru startul unui video).
9. Text on-screen pentru Reels (indicatii de text scurt de plasat pe ecran).
10. Hashtags curate si relevante.
11. Rezumat Newsletter (o fraza de impact pentru newsletter-ul "5 vesti bune in 5 minute").

Articol:
Titlu: ${draft.title}
Subtitlu: ${draft.subtitle}
Lead: ${draft.lead}
Continut: ${draft.content}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "title": "Meta Title optimizat SEO",
  "subtitle": "Subtitlu SEO",
  "slug": "slug-url-sugerat",
  "metaDescription": "Meta Description de max 155 caractere",
  "socialFacebook": "Textul complet al postarii de Facebook",
  "socialInstagram": "Textul complet al postarii de Instagram",
  "socialLinkedin": "Textul complet al postarii de LinkedIn",
  "socialTiktok": "Script video TikTok cu structura: Hook, Corp, CTA",
  "socialYoutube": "Script video YouTube Shorts",
  "socialVideoHooks": "1. Hook 1\\n2. Hook 2\\n3. Hook 3",
  "socialReelText": "Text pe ecran indicat",
  "socialHashtags": "#hashtag1 #hashtag2 #hashtag3",
  "newsletterBlurb": "Text rezumat pe scurt pentru newsletter"
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        title: string;
        subtitle: string;
        slug: string;
        metaDescription: string;
        socialFacebook: string;
        socialInstagram: string;
        socialLinkedin: string;
        socialTiktok: string;
        socialYoutube: string;
        socialVideoHooks: string;
        socialReelText: string;
        socialHashtags: string;
        newsletterBlurb: string;
      };

      output = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        slug: slugify(parsed.slug || draft.title),
        metaDescription: parsed.metaDescription,
        socialFacebook: parsed.socialFacebook,
        socialInstagram: parsed.socialInstagram,
        socialLinkedin: parsed.socialLinkedin,
        socialTiktok: parsed.socialTiktok || "",
        socialYoutube: parsed.socialYoutube || "",
        socialVideoHooks: parsed.socialVideoHooks || "",
        socialReelText: parsed.socialReelText || "",
        socialHashtags: parsed.socialHashtags || "",
        newsletterBlurb: parsed.newsletterBlurb
      };
    } catch (e) {
      console.warn("LLM SEO Social agent failed, falling back to mock", e);
      output = runMockSeoSocial(draft);
    }
  } else {
    output = runMockSeoSocial(draft);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "seo_social_agent",
    model: modelForAgent("seo_social_agent"),
    input: JSON.stringify(draft),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockSeoSocial(draft: DraftResult): SeoSocialResult {
  const cleanTitle = draft.title.replace(/^DEMO:\s*/i, "").trim();
  const slug = slugify(cleanTitle);
  const metaDescription = draft.lead.slice(0, 155);

  return {
    title: draft.title,
    subtitle: draft.subtitle,
    slug,
    metaDescription,
    socialFacebook: `${cleanTitle}\n\nFara reclame. Fara panica. Doar vesti bune, verificate. Citește mai mult pe site!`,
    socialInstagram: `${cleanTitle}\n\nO veste buna pe zi schimba ritmul informatiei.`,
    socialLinkedin: `${cleanTitle}\n\nUn exemplu de progres verificabil, pregatit pentru cititori fara clickbait.`,
    socialTiktok: `[Video Script] Hook: Știai că ${cleanTitle}? Iată ce s-a întâmplat...`,
    socialYoutube: `[YouTube Shorts] Faptele pe scurt: ${cleanTitle}`,
    socialVideoHooks: `1. Aceasta este cea mai bună veste a zilei!\n2. Iată un motiv de mândrie locală.\n3. Cum s-a schimbat totul în bine.`,
    socialReelText: `Progres Real; Soluții Concrete`,
    socialHashtags: `#vestibune #romaniabuna #progrestic #stiripozitive`,
    newsletterBlurb: `Pe scurt: ${draft.lead}`
  };
}
