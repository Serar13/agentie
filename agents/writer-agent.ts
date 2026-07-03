import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, DraftResult, FactCheckResult, ResearchResult } from "./types";

export async function runWriterAgent(
  context: AgentContext,
  research: ResearchResult,
  factCheck: FactCheckResult
): Promise<DraftResult> {
  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: DraftResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("writer_agent");
      const system = "Esti un scriitor si jurnalist premium, specializat in redactarea de articole de stiri constructive, clare si inspirante. Raspunzi doar in format JSON valid.";
      const prompt = `Redacteaza un articol complet de stiri pozitive pe baza faptelor verificate si a surselor.
- Articolul trebuie sa fie scris in limba romana, cu un ton neutru, profesionist si optimist, axat pe impact si solutii (fara clickbait).
- Evita cuvintele senzationaliste (miraculos, incredibil, socant).

Date initiale:
Titlu propus: ${context.title}
Lead propus: ${context.lead}
Continut propus: ${context.content}

Date cercetare & fact check:
Fapte verificate: ${research.verifiedFacts.join(" ; ")}
Scor de incredere: ${factCheck.confidenceScore}/100
Observatii fact-check: ${factCheck.notes}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "title": "Titlu curat si descriptiv in limba romana",
  "subtitle": "Subtitlu explicativ si concis",
  "lead": "Un singur paragraf de lead captivant si informativ (aproximativ 30-50 cuvinte)",
  "content": "Continutul complet al articolului, structurat in paragrafe clare (separate cu \\n\\n). Minim 3 paragrafe."
}`;

      const response = await provider.generateText({ model, system, prompt });
      const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        title: string;
        subtitle: string;
        lead: string;
        content: string;
      };

      output = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        lead: parsed.lead,
        content: parsed.content
      };
    } catch (e) {
      console.warn("LLM writer agent failed, falling back to mock", e);
      output = runMockWriter(context, research, factCheck);
    }
  } else {
    output = runMockWriter(context, research, factCheck);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "writer_agent",
    model: modelForAgent("writer_agent"),
    input: JSON.stringify({ context, research, factCheck }),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockWriter(
  context: AgentContext,
  research: ResearchResult,
  factCheck: FactCheckResult
): DraftResult {
  const sourceLine = research.sources
    .slice(0, 3)
    .map((source) => `${source.outlet}: ${source.url}`)
    .join("\n");

  const content = [
    `${context.lead}`,
    `Materialul ramane in registru pozitiv si factual: subiectul este prezentat prin impact, progres si solutii, fara ton alarmist sau promisiuni neverificate. Faptele folosite de draft sunt: ${research.verifiedFacts.join(" ")}`,
    `Sursele luate in calcul sunt:\n${sourceLine || "Nu exista suficiente surse salvate."}`,
    factCheck.confidenceScore >= 75
      ? "Scorul de incredere permite trimiterea spre aprobare editoriala, dar publicarea ramane o decizie umana."
      : "Scorul de incredere este sub pragul recomandat, deci articolul trebuie completat de editor inainte de aprobare."
  ].join("\n\n");

  return {
    title: context.title,
    subtitle: "Stire pozitiva verificata editorial, pregatita pentru review.",
    lead: context.lead,
    content
  };
}
