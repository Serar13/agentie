export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ArticleReference = {
  id: string;
  articleId?: string;
  title: string;
  outlet: string;
  url: string;
  verified: boolean;
  checkedAt?: Date | null;
  contradictionNotes?: string | null;
  createdAt?: Date;
};

export type CostLog = {
  id: string;
  articleId?: string | null;
  agentName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostEur: number;
  createdAt: Date;
};

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  lead: string;
  content: string;
  imageUrl?: string | null;
  categoryId: string;
  status: string;
  positiveScore: number;
  confidenceScore: number;
  sourceQualityScore: number;
  originalityScore: number;
  editorialScore: number;
  riskLevel: string;
  rejectionReason?: string | null;
  editorNotes?: string | null;
  reviewedBy?: string | null;
  reviewHistory?: string | null;
  qualityNotes?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialLinkedin?: string | null;
  socialTiktok?: string | null;
  socialYoutube?: string | null;
  socialVideoHooks?: string | null;
  socialReelText?: string | null;
  socialHashtags?: string | null;
  newsletterBlurb?: string | null;
  originalUrl?: string | null;
  sourceName?: string | null;
  scannedAt?: Date | null;
  approvedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
