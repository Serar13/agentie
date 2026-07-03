import { CATEGORY_SEED } from "../lib/constants";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "romania-buna": ["romania", "local", "oras", "sat", "comunitate", "voluntar"],
  educatie: ["elev", "student", "scoala", "profesor", "educatie", "bursa"],
  "sanatate-bine": ["sanatate", "spital", "medic", "preventie", "terapie", "bine"],
  "tech-inovatie": ["tehnologie", "tech", "inovatie", "cercetare", "startup", "aplicatie"],
  mediu: ["mediu", "padure", "reciclare", "clima", "energie", "biodiversitate"],
  "cultura-evenimente": ["cultura", "festival", "muzeu", "carte", "film", "teatru"],
  "business-pozitiv": ["business", "companie", "locuri de munca", "social", "antreprenor"],
  "sport-performanta": ["sport", "echipa", "campion", "performanta", "atlet"]
};

export function inferCategorySlug(text: string) {
  const normalized = text.toLowerCase();
  let best: (typeof CATEGORY_SEED)[number]["slug"] = CATEGORY_SEED[0].slug;
  let bestScore = 0;

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((total, keyword) => {
      return normalized.includes(keyword) ? total + 1 : total;
    }, 0);
    if (score > bestScore) {
      best = slug as (typeof CATEGORY_SEED)[number]["slug"];
      bestScore = score;
    }
  }

  return best;
}
