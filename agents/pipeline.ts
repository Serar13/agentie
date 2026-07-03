import { prisma } from "../lib/prisma";
import { uniqueSlug } from "../lib/slug";
import { checkBudgetLimits } from "../services/cost-tracker";
import { runEditorAgent } from "./editor-agent";
import { runFactCheckAgent } from "./fact-check-agent";
import { runPositiveFilter } from "./positive-filter";
import { runQualityGate } from "./quality-gate";
import { runResearchAgent } from "./research-agent";
import { runSeoSocialAgent } from "./seo-social-agent";
import { runWriterAgent } from "./writer-agent";
import type { AgentContext, PipelineArticle } from "./types";

function toContext(article: PipelineArticle): AgentContext {
  return {
    articleId: article.id,
    title: article.title,
    lead: article.lead,
    content: article.content,
    sourceName: article.sourceName,
    originalUrl: article.originalUrl,
    references: article.references
  };
}

export async function runPipelineForArticle(articleId: string) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId },
    include: { references: true }
  });

  if (!article) {
    throw new Error(`Article not found: ${articleId}`);
  }

  const budget = await checkBudgetLimits();
  if (budget.exceeded) {
    return prisma.newsArticle.update({
      where: { id: article.id },
      data: {
        status: "needs_review",
        qualityNotes: `Procesare blocata automat de gardianul de costuri: ${budget.reason}`
      }
    });
  }

  const context = toContext(article);
  const positive = await runPositiveFilter(context);

  if (!positive.accepted) {
    return prisma.newsArticle.update({
      where: { id: article.id },
      data: {
        status: "rejected",
        positiveScore: positive.positiveScore,
        riskLevel: positive.riskLevel,
        qualityNotes: positive.reason,
        rejectionReason: positive.reason
      }
    });
  }

  const research = await runResearchAgent(context);
  const factCheck = await runFactCheckAgent(context, research);
  const draft = await runWriterAgent(context, research, factCheck);
  const edited = await runEditorAgent(context, draft);
  const seo = await runSeoSocialAgent(context, edited);
  const quality = await runQualityGate({ context, positive, research, factCheck });

  const nextStatus = quality.passed ? "approved" : quality.recommendedStatus;

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: {
      title: seo.title,
      subtitle: seo.subtitle,
      lead: edited.lead,
      content: edited.content,
      slug: uniqueSlug(seo.slug || seo.title, article.id.slice(0, 6)),
      status: nextStatus,
      positiveScore: positive.positiveScore,
      confidenceScore: factCheck.confidenceScore,
      sourceQualityScore: quality.sourceQualityScore,
      originalityScore: quality.originalityScore,
      editorialScore: quality.editorialScore,
      riskLevel: quality.riskLevel,
      rejectionReason: nextStatus === "rejected" ? quality.notes : null,
      qualityNotes: quality.notes,
      seoTitle: seo.title,
      metaDescription: seo.metaDescription,
      socialFacebook: seo.socialFacebook,
      socialInstagram: seo.socialInstagram,
      socialLinkedin: seo.socialLinkedin,
      socialTiktok: seo.socialTiktok,
      socialYoutube: seo.socialYoutube,
      socialVideoHooks: seo.socialVideoHooks,
      socialReelText: seo.socialReelText,
      socialHashtags: seo.socialHashtags,
      newsletterBlurb: seo.newsletterBlurb,
      approvedAt: nextStatus === "approved" ? new Date() : null
    }
  });
}

export async function runPipelineForPendingDrafts(limit = 10) {
  const drafts = await prisma.newsArticle.findMany({
    where: { status: "draft" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true }
  });

  const results: Awaited<ReturnType<typeof runPipelineForArticle>>[] = [];
  for (const draft of drafts) {
    results.push(await runPipelineForArticle(draft.id));
  }

  return results;
}
