export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export type AiProviderId = "rork" | "openai" | "gemini" | "anthropic";

export type AiCallParams = {
  provider: AiProviderId;
  model: string;
  apiKey?: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

function toOpenAI(messages: ChatMessage[]) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export async function callAi(params: AiCallParams): Promise<string> {
  if (params.provider === "openai") {
    const apiKey = (params.apiKey ?? "").trim();
    if (!apiKey) throw new Error("OpenAI API key is missing");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: toOpenAI(params.messages),
        temperature: 0.2,
      }),
      signal: params.signal,
    });

    const data = (await res.json()) as unknown;
    if (!res.ok) {
      const msg = typeof data === "object" && data && "error" in data ? JSON.stringify((data as any).error) : JSON.stringify(data);
      throw new Error(`OpenAI error: ${msg}`);
    }

    const text = (data as any)?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("OpenAI returned an unexpected response");
    return text;
  }

  if (params.provider === "gemini") {
    const apiKey = (params.apiKey ?? "").trim();
    if (!apiKey) throw new Error("Gemini API key is missing");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: params.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        systemInstruction: {
          parts: [{ text: params.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n") }],
        },
        generationConfig: {
          temperature: 0.2,
        },
      }),
      signal: params.signal,
    });

    const data = (await res.json()) as unknown;
    if (!res.ok) {
      throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    }

    const text = (data as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "";
    if (typeof text !== "string" || !text.trim()) throw new Error("Gemini returned an empty response");
    return text;
  }

  if (params.provider === "anthropic") {
    const apiKey = (params.apiKey ?? "").trim();
    if (!apiKey) throw new Error("Anthropic API key is missing");

    const system = params.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const messages = params.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: [{ type: "text", text: m.content }] }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: 900,
        temperature: 0.2,
        system,
        messages,
      }),
      signal: params.signal,
    });

    const data = (await res.json()) as unknown;
    if (!res.ok) {
      throw new Error(`Anthropic error: ${JSON.stringify(data)}`);
    }

    const text = (data as any)?.content?.map((c: any) => c?.text).filter(Boolean).join("") ?? "";
    if (typeof text !== "string" || !text.trim()) throw new Error("Anthropic returned an empty response");
    return text;
  }

  throw new Error("Unsupported provider for direct call");
}
