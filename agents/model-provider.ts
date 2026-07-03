export type GenerateParams = {
  model: string;
  system: string;
  prompt: string;
  temperature?: number;
};

export interface ModelProvider {
  name: string;
  generateText(params: GenerateParams): Promise<string>;
}

class MockProvider implements ModelProvider {
  name = "mock";

  async generateText(params: GenerateParams) {
    return JSON.stringify({
      model: params.model,
      mode: "mock",
      message: "Mock provider activ. Configureaza MODEL_PROVIDER si cheia API pentru raspunsuri reale."
    });
  }
}

class OpenAICompatibleProvider implements ModelProvider {
  constructor(
    public name: string,
    private apiKey: string,
    private endpoint: string
  ) {}

  async generateText(params: GenerateParams) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: params.model,
        temperature: params.temperature ?? 0.2,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`${this.name} request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content ?? "";
  }
}

class GeminiProvider implements ModelProvider {
  name = "gemini";

  constructor(private apiKey: string) {}

  async generateText(params: GenerateParams) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: params.system }] },
          contents: [{ role: "user", parts: [{ text: params.prompt }] }],
          generationConfig: { temperature: params.temperature ?? 0.2 }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  }
}

class AnthropicProvider implements ModelProvider {
  name = "anthropic";

  constructor(private apiKey: string) {}

  async generateText(params: GenerateParams) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: 1200,
        temperature: params.temperature ?? 0.2,
        system: params.system,
        messages: [{ role: "user", content: params.prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    return data.content?.map((part) => part.text ?? "").join("") ?? "";
  }
}

export function createModelProvider(): ModelProvider {
  const provider = process.env.MODEL_PROVIDER ?? "mock";

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAICompatibleProvider(
      "openai",
      process.env.OPENAI_API_KEY,
      "https://api.openai.com/v1/chat/completions"
    );
  }

  if (provider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    return new OpenAICompatibleProvider(
      "deepseek",
      process.env.DEEPSEEK_API_KEY,
      "https://api.deepseek.com/v1/chat/completions"
    );
  }

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return new GeminiProvider(process.env.GEMINI_API_KEY);
  }

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  }

  return new MockProvider();
}
