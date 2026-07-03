import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, FactCheckResult, ResearchResult } from "./types";

export async function runFactCheckAgent(
  context: AgentContext,
  research: ResearchResult
): Promise<FactCheckResult> {
  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: FactCheckResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("fact_check_agent");
      const system = "Esti un expert in fact-checking si integritate editoriala. Depistezi exagerari, stiri false si informatii nefondate. Raspunzi doar in format JSON valid.";
      const prompt = `Analizeaza stirea si rezultatele cercetarii de mai jos pentru a determina corectitudinea datelor si credibilitatea surselor.
Verifica daca exista contradictii intre textul stirii si surse. Calculeaza un scor de incredere (confidenceScore de la 0 la 100).

Titlu stire: ${context.title}
Lead stire: ${context.lead}
Continut stire: ${context.content}

Date cercetare:
Fapte verificate extrase: ${research.verifiedFacts.join(" | ")}
Intrebari deschise: ${research.openQuestions.join(" | ")}
Surse: ${research.sources.map((s) => `${s.outlet} (${s.url}) - Verificata: ${s.verified}`).join(" ; ")}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "confidenceScore": number (0-100),
  "contradictions": ["contradictie sau neconcordanta detectata", ...],
  "notes": "observatii de audit factual (de ce are acest scor, ce este sau nu sigur)"
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        confidenceScore: number;
        contradictions: string[];
        notes: string;
      };

      output = {
        confidenceScore: parsed.confidenceScore,
        contradictions: parsed.contradictions || [],
        notes: parsed.notes
      };
    } catch (e) {
      console.warn("LLM fact check failed, falling back to mock", e);
      output = runMockFactCheck(research);
    }
  } else {
    output = runMockFactCheck(research);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "fact_check_agent",
    model: modelForAgent("fact_check_agent"),
    input: JSON.stringify({ context, research }),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockFactCheck(research: ResearchResult): FactCheckResult {
  const sourceCount = research.sources.length;
  const verifiedCount = research.sources.filter((source) => source.verified).length;
  const confidenceScore = Math.min(96, 35 + sourceCount * 22 + verifiedCount * 12);
  const contradictions = research.sources.some((source) => source.url.includes("example.com"))
    ? ["Sursele demo nu sunt dovezi reale; inlocuieste-le cu surse verificabile."]
    : [];

  return {
    confidenceScore,
    contradictions,
    notes:
      sourceCount >= 2
        ? "Exista mai multe surse pentru comparatie."
        : "Sunt necesare surse suplimentare pentru publicare fara risc editorial."
  };
}
