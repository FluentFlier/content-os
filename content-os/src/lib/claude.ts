import { createClient } from "@insforge/sdk";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

const BASE_SYSTEM_PROMPT = `You are a content strategist. Help create engaging, authentic content based on the creator's voice and identity. No em dashes anywhere. Ever.`;

export const AVAILABLE_MODELS = [
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { id: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro", provider: "Google" },
  { id: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek" },
  { id: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast", provider: "xAI" },
  { id: "minimax/minimax-m2.1", label: "MiniMax M2.1", provider: "MiniMax" },
];

function getInsforgeServer() {
  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing InsForge env vars for AI gateway");
  }

  return createClient({ baseUrl: url, anonKey });
}

export async function generateContent(
  prompt: string,
  systemPromptOverride?: string,
  model?: string
): Promise<string> {
  const systemPrompt = systemPromptOverride || BASE_SYSTEM_PROMPT;
  const selectedModel = model || DEFAULT_MODEL;
  const client = getInsforgeServer();

  const completion = await client.ai.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    maxTokens: 2048,
  });

  return completion.choices[0]?.message?.content || "";
}
