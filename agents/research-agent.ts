import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, ResearchResult } from "./types";

export async function runResearchAgent(context: AgentContext): Promise<ResearchResult> {
  const sources = context.references.map((reference) => ({
    title: reference.title,
    outlet: reference.outlet,
    url: reference.url,
    verified: reference.verified
  }));

  if (context.originalUrl && !sources.some((source) => source.url === context.originalUrl)) {
    sources.push({
      title: context.title,
      outlet: context.sourceName ?? "Sursa originala",
      url: context.originalUrl,
      verified: false
    });
  }

  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: ResearchResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("research_agent");
      const system = "Esti un jurnalist de investigatie senior. Extragi informatii factuale din surse. Raspunzi doar in format JSON valid.";
      const prompt = `Analizeaza contextul stirii si sursele disponibile pentru a extrage:
1. O lista de fapte verificate (propozitii clare, factuale, sustinute de surse).
2. O lista de intrebari deschise (aspecte neclare, detalii care lipsesc sau contradictii care ar trebui clarificate de un editor).

Titlu: ${context.title}
Lead: ${context.lead}
Continut: ${context.content}
Surse disponibile:
${sources.map((s, idx) => `[Sursa ${idx + 1}] Titlu: ${s.title}, Outlet: ${s.outlet}, URL: ${s.url}, Verificata: ${s.verified ? "Da" : "Nu"}`).join("\n")}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "verifiedFacts": ["fapt 1", "fapt 2", ...],
  "openQuestions": ["intrebare 1", ...]
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        verifiedFacts: string[];
        openQuestions: string[];
      };

      output = {
        verifiedFacts: parsed.verifiedFacts || [],
        openQuestions: parsed.openQuestions || [],
        sources
      };
    } catch (e) {
      console.warn("LLM research agent failed, falling back to mock", e);
      output = runMockResearch(context, sources);
    }
  } else {
    output = runMockResearch(context, sources);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "research_agent",
    model: modelForAgent("research_agent"),
    input: JSON.stringify(context),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockResearch(context: AgentContext, sources: any[]): ResearchResult {
  const verifiedFacts = [
    `Subiect identificat: ${context.title}`,
    `Sursa principala: ${context.sourceName ?? "necunoscuta"}`,
    `Lead editorial: ${context.lead}`
  ];

  const openQuestions =
    sources.length >= 2
      ? []
      : ["Adauga inca una-doua surse independente inainte de publicare."];

  return { verifiedFacts, openQuestions, sources };
}
