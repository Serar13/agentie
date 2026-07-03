import type { ArticleReference, NewsArticle } from "@/lib/app-types";

export type ModelTier = "cheap" | "writer" | "editor" | "factcheck";

export type AgentContext = {
  articleId?: string;
  title: string;
  lead: string;
  content: string;
  sourceName?: string | null;
  originalUrl?: string | null;
  references: ArticleReference[];
};

export type PositiveFilterResult = {
  accepted: boolean;
  positiveScore: number;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  editorialRiskNotes: string;
};

export type ResearchResult = {
  verifiedFacts: string[];
  openQuestions: string[];
  sources: Array<{
    title: string;
    outlet: string;
    url: string;
    verified: boolean;
  }>;
};

export type FactCheckResult = {
  confidenceScore: number;
  contradictions: string[];
  notes: string;
};

export type DraftResult = {
  title: string;
  subtitle: string;
  lead: string;
  content: string;
};

export type SeoSocialResult = {
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

export type QualityGateResult = {
  passed: boolean;
  recommendedStatus: "approved" | "needs_review" | "rejected";
  notes: string;
  sourceQualityScore: number;
  originalityScore: number;
  editorialScore: number;
  riskLevel: "low" | "medium" | "high";
};

export type PipelineArticle = NewsArticle & {
  references: ArticleReference[];
};
