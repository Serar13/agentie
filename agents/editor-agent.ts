import { logAgentCost } from "../services/cost-tracker";
import { createModelProvider } from "./model-provider";
import { modelForAgent } from "./model-router";
import type { AgentContext, DraftResult } from "./types";

const PROMOTIONAL_WORDS = ["incredibil", "miraculos", "socant", "revolutionar"];

export async function runEditorAgent(context: AgentContext, draft: DraftResult): Promise<DraftResult> {
  const providerType = process.env.MODEL_PROVIDER ?? "mock";
  let output: DraftResult;

  if (providerType !== "mock") {
    try {
      const provider = createModelProvider();
      const model = modelForAgent("editor_agent");
      const system = "Esti un redactor-sef senior, specializat in curatarea textelor jurnalistice de exagerari, senzationalism si greseli gramaticale. Raspunzi doar in format JSON valid.";
      const prompt = `Corecteaza si optimizeaza stilistic urmatorul draft de articol.
- Elimina cuvintele senzationaliste si reclamele mascate. Tone down publicitatea.
- Corecteaza exprimarea in limba romana si asigura-te ca diacriticele sunt utilizate corect.
- Titlul trebuie sa inceapa simplu si clar, fara 'DEMO:'.

Draft articol:
Titlu: ${draft.title}
Subtitlu: ${draft.subtitle}
Lead: ${draft.lead}
Continut: ${draft.content}

Returneaza raspunsul sub forma de obiect JSON valid (si nimic altceva) cu urmatoarea structura:
{
  "title": "Titlu optimizat",
  "subtitle": "Subtitlu optimizat",
  "lead": "Lead optimizat",
  "content": "Continut complet corectat (paragrafe separate prin \\n\\n)"
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
      console.warn("LLM editor agent failed, falling back to mock", e);
      output = runMockEditor(draft);
    }
  } else {
    output = runMockEditor(draft);
  }

  await logAgentCost({
    articleId: context.articleId,
    agentName: "editor_agent",
    model: modelForAgent("editor_agent"),
    input: JSON.stringify(draft),
    output: JSON.stringify(output)
  });

  return output;
}

function runMockEditor(draft: DraftResult): DraftResult {
  let content = draft.content;
  for (const word of PROMOTIONAL_WORDS) {
    content = content.replace(new RegExp(word, "gi"), "important");
  }

  return {
    ...draft,
    title: draft.title.replace(/^DEMO:\s*/i, "DEMO: "),
    content
  };
}
