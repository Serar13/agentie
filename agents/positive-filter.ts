import { NEGATIVE_TOPIC_KEYWORDS, POSITIVE_TOPIC_KEYWORDS } from "../lib/constants";
import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, PositiveFilterResult } from "./types";

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function runPositiveFilter(context: AgentContext): Promise<PositiveFilterResult> {
  const input = `${context.title}\n${context.lead}\n${context.content}`;
  const providerType = process.env.MODEL_PROVIDER ?? "mock";

  let output: PositiveFilterResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("positive_filter");
      const system = "Esti un editor senior specializat in selectarea si clasificarea stirilor pozitive si constructive. Raspunzi doar in format JSON valid.";
      const prompt = `Analizeaza urmatorul text si determina daca respecta criteriile noastre editoriale stricte pentru o agentie de stiri exclusiv pozitive:
- Respinge automat: crime, accidente, tragedii, razboaie, scandal politic toxic, panica economica, violenta, frica, clickbait, stiri negative cu final vag pozitiv, continut polarizant, continut fara impact pozitiv clar.
- Accepta doar: progres real, solutii constructive, oameni care fac ceva util, initiative comunitare, educatie, sanatate, mediu/sustenabilitate, cultura, sport ca instrument comunitar, business pozitiv/etic, tech/inovatie utila, proiecte locale bune.

Date stire:
Titlu: ${context.title}
Lead: ${context.lead}
Continut: ${context.content}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "accepted": boolean,
  "positiveScore": number (0-100),
  "reason": "explicatie detaliata a deciziei (de ce a fost acceptata sau de ce a fost respinsa)",
  "riskLevel": "low" | "medium" | "high",
  "editorialRiskNotes": "explicatie a oricarui risc editorial (clickbait, controverse, partizanat politic) sau sir gol daca nu exista risc"
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        accepted: boolean;
        positiveScore: number;
        reason: string;
        riskLevel?: "low" | "medium" | "high";
        editorialRiskNotes?: string;
      };

      output = {
        accepted: parsed.accepted && parsed.positiveScore >= 75, // strict rule: positiveScore >= 75
        positiveScore: parsed.positiveScore,
        reason: parsed.reason,
        riskLevel: parsed.riskLevel || "low",
        editorialRiskNotes: parsed.editorialRiskNotes || ""
      };
    } catch (e) {
      console.warn("LLM positive filter failed, falling back to mock filter", e);
      output = runMockFilter(input);
    }
  } else {
    output = runMockFilter(input);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "positive_filter",
    model: modelForAgent("positive_filter"),
    input,
    output: JSON.stringify(output)
  });

  return output;
}

function runMockFilter(input: string): PositiveFilterResult {
  const normalized = normalize(input);
  const negativeSignals = NEGATIVE_TOPIC_KEYWORDS.filter((keyword) =>
    normalized.includes(normalize(keyword))
  );
  const positiveSignals = POSITIVE_TOPIC_KEYWORDS.filter((keyword) =>
    normalized.includes(normalize(keyword))
  );

  const positiveScore = Math.max(
    0,
    Math.min(100, 62 + positiveSignals.length * 8 - negativeSignals.length * 18)
  );
  const accepted = negativeSignals.length === 0 && positiveScore >= 75; // rule: positiveScore >= 75
  const riskLevel = negativeSignals.length > 0 ? "high" : positiveScore < 80 ? "medium" : "low";

  return {
    accepted,
    positiveScore,
    reason: accepted
      ? "Subiectul are semnale constructive si nu contine teme negative blocate."
      : `Subiectul necesita respingere: contine semnale negative (${negativeSignals.join(", ")}) sau are scor scazut.`,
    riskLevel,
    editorialRiskNotes: negativeSignals.length > 0 ? `Semnale negative detectate: ${negativeSignals.join(", ")}` : ""
  };
}
