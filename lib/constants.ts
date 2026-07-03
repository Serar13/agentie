export const STATUS_VALUES = [
  "draft",
  "needs_review",
  "approved",
  "published",
  "rejected"
] as const;

export type ArticleStatus = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "draft",
  needs_review: "needs_review",
  approved: "approved",
  published: "published",
  rejected: "rejected"
};

export const STATUS_HELP: Record<ArticleStatus, string> = {
  draft: "Capturat sau generat partial; nu este gata de review.",
  needs_review: "Are surse incomplete, scor scazut sau necesita interventie editoriala.",
  approved: "A trecut gate-ul calitatii, dar asteapta publicare manuala.",
  published: "Vizibil public.",
  rejected: "Respins de filtru, fact-check sau editor."
};

export const CATEGORY_SEED = [
  {
    name: "Romania buna",
    slug: "romania-buna",
    description: "Comunitati, initiative civice si proiecte locale cu efect pozitiv."
  },
  {
    name: "Educatie",
    slug: "educatie",
    description: "Scoli, profesori, burse si programe care cresc accesul la invatare."
  },
  {
    name: "Sanatate & bine",
    slug: "sanatate-bine",
    description: "Preventie, cercetare medicala, grija si solutii pentru viata mai buna."
  },
  {
    name: "Tech & inovatie",
    slug: "tech-inovatie",
    description: "Tehnologie utila, cercetare aplicata si produse cu impact real."
  },
  {
    name: "Mediu",
    slug: "mediu",
    description: "Biodiversitate, clima, reciclare si proiecte de restaurare."
  },
  {
    name: "Cultura & evenimente",
    slug: "cultura-evenimente",
    description: "Arta, patrimoniu, festivaluri si proiecte culturale accesibile."
  },
  {
    name: "Business pozitiv",
    slug: "business-pozitiv",
    description: "Companii, locuri de munca si economie cu efect social constructiv."
  },
  {
    name: "Sport & performanta",
    slug: "sport-performanta",
    description: "Performanta, fair-play si sport ca instrument pentru comunitate."
  }
] as const;

export const NEGATIVE_TOPIC_KEYWORDS = [
  "accident",
  "atac",
  "catastrofa",
  "crima",
  "deces",
  "explozie",
  "frauda",
  "incendiu",
  "panica",
  "razboi",
  "scandal",
  "tragedie",
  "ucis",
  "violenta"
];

export const POSITIVE_TOPIC_KEYWORDS = [
  "educatie",
  "inovatie",
  "mediu",
  "sanatate",
  "voluntari",
  "comunitate",
  "restaurare",
  "burse",
  "cercetare",
  "performanta",
  "sprijin",
  "progres",
  "solutie"
];

export const BUDGET_TARGETS = {
  monthlyBudgetEur: typeof process !== 'undefined' ? Number(process.env.MONTHLY_BUDGET_EUR || 100) : 100,
  dailyBudgetEur: typeof process !== 'undefined' ? Number(process.env.DAILY_BUDGET_EUR || 5) : 5,
  minMonthlyArticles: 450,
  targetMonthlyArticles: 525,
  maxMonthlyArticles: 600,
  targetCostMinEur: 0.16,
  targetCostMaxEur: 0.22
};
