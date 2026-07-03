import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type {
  AgentContext,
  FactCheckResult,
  PositiveFilterResult,
  QualityGateResult,
  ResearchResult
} from "./types";

export async function runQualityGate(params: {
  context: AgentContext;
  positive: PositiveFilterResult;
  research: ResearchResult;
  factCheck: FactCheckResult;
}): Promise<QualityGateResult> {
  const { context, positive, research, factCheck } = params;
  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: QualityGateResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("quality_gate");
      const system = "Esti un redactor-sef responsabil de auditul editorial si controlul calitatii. Evaluezi scoruri factuale si riscuri editoriale. Raspunzi doar in format JSON valid.";
      const prompt = `Evalueaza calitatea finala a articolului de stiri pe baza informatiilor de mai jos.
Calculeaza urmatoarele scoruri (0-100):
1. sourceQualityScore: cat de sigure, diverse si de incredere sunt sursele.
2. originalityScore: gradul de diferentiere fata de stirea originala, lipsa de plagiat si structura proprie.
3. editorialScore: stilul general, lipsa senzationalismului, relevanta titlului si a leadului.

Reguli editoriale stricte de aplicat:
- Daca positiveScore este sub 75 (positiveScore: ${positive.positiveScore}), stirea NU TREBUIE SA TREACA (passed: false, recommendedStatus: rejected).
- Daca confidenceScore este sub 80 (confidenceScore: ${factCheck.confidenceScore}), stirea NU TREBUIE SA TREACA (passed: false, recommendedStatus: needs_review).
- Daca nu exista nicio sursa valida de incredere sau daca toate sursele au verified: false, stirea trebuie sa fie blocata (passed: false, recommendedStatus: needs_review).
- Daca nivelul de risc (riskLevel) este estimat ca "high", stirea trebuie blocata (passed: false, recommendedStatus: needs_review).

Date intrare:
Titlu: ${context.title}
Surse: ${research.sources.map((s) => `${s.outlet} (Verificata: ${s.verified})`).join(", ")}
Scor pozitiv: ${positive.positiveScore}/100, Nivel risc filtru: ${positive.riskLevel}, Risc filter notes: ${positive.editorialRiskNotes}
Scor incredere fact-check: ${factCheck.confidenceScore}/100, Note: ${factCheck.notes}, Contradictii: ${factCheck.contradictions.join(" ; ")}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "passed": boolean,
  "recommendedStatus": "approved" | "needs_review" | "rejected",
  "notes": "argumentare detaliata a deciziei si scorurilor acordate",
  "sourceQualityScore": number (0-100),
  "originalityScore": number (0-100),
  "editorialScore": number (0-100),
  "riskLevel": "low" | "medium" | "high"
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        passed: boolean;
        recommendedStatus: "approved" | "needs_review" | "rejected";
        notes: string;
        sourceQualityScore: number;
        originalityScore: number;
        editorialScore: number;
        riskLevel?: "low" | "medium" | "high";
      };

      // Double check rules inside code as a safety fallback
      let passed = parsed.passed;
      let recommendedStatus = parsed.recommendedStatus;

      if (positive.positiveScore < 75) {
        passed = false;
        recommendedStatus = "rejected";
      } else if (factCheck.confidenceScore < 80) {
        passed = false;
        recommendedStatus = "needs_review";
      } else if (parsed.riskLevel === "high") {
        passed = false;
        recommendedStatus = "needs_review";
      }

      output = {
        passed,
        recommendedStatus,
        notes: parsed.notes,
        sourceQualityScore: parsed.sourceQualityScore || 70,
        originalityScore: parsed.originalityScore || 80,
        editorialScore: parsed.editorialScore || 75,
        riskLevel: parsed.riskLevel || positive.riskLevel || "low"
      };
    } catch (e) {
      console.warn("LLM quality gate failed, falling back to mock quality gate", e);
      output = runMockQualityGate(params);
    }
  } else {
    output = runMockQualityGate(params);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "quality_gate",
    model: modelForAgent("quality_gate"),
    input: JSON.stringify(params),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockQualityGate(params: {
  context: AgentContext;
  positive: PositiveFilterResult;
  research: ResearchResult;
  factCheck: FactCheckResult;
}): QualityGateResult {
  const { context, positive, research, factCheck } = params;
  const hasEnoughSources = research.sources.length >= 1 && !context.originalUrl?.includes("example.com");
  const hasContradictions = factCheck.contradictions.length > 0;

  const verifiedCount = research.sources.filter((s) => s.verified).length;
  const sourceQualityScore = research.sources.length === 0 ? 0 : Math.round((verifiedCount / research.sources.length) * 40 + 60);
  const originalityScore = research.sources.length <= 1 ? 75 : 90;
  const editorialScore = Math.round((positive.positiveScore + factCheck.confidenceScore) / 2);
  const riskLevel = positive.riskLevel === "high" || hasContradictions ? "high" : positive.positiveScore < 80 ? "medium" : "low";

  let passed = true;
  let recommendedStatus: "approved" | "needs_review" | "rejected" = "approved";
  let notes = "A trecut Quality Gate. Articolul este echilibrat si pozitiv.";

  if (positive.positiveScore < 75) {
    passed = false;
    recommendedStatus = "rejected";
    notes = `Respins de filtru pozitiv: Scorul pozitiv de ${positive.positiveScore} este sub pragul minim de 75.`;
  } else if (factCheck.confidenceScore < 80) {
    passed = false;
    recommendedStatus = "needs_review";
    notes = `Necesita review: Scorul de incredere (${factCheck.confidenceScore}) este sub pragul de 80.`;
  } else if (!hasEnoughSources) {
    passed = false;
    recommendedStatus = "needs_review";
    notes = "Necesita review: Nu exista surse externe validate sau stirea este neverificata.";
  } else if (riskLevel === "high") {
    passed = false;
    recommendedStatus = "needs_review";
    notes = "Necesita review: Risc editorial ridicat din cauza contradictiilor sau cuvintelor cheie suspecte.";
  }

  return {
    passed,
    recommendedStatus,
    notes,
    sourceQualityScore,
    originalityScore,
    editorialScore,
    riskLevel
  };
}
