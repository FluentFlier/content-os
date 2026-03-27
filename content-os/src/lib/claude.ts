import { createClient } from "@insforge/sdk";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

const BASE_SYSTEM_PROMPT = `You are a content strategist. Help create engaging, authentic content based on the creator's voice and identity. No em dashes anywhere. Ever.`;

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
  systemPromptOverride?: string
): Promise<string> {
  const systemPrompt = systemPromptOverride || BASE_SYSTEM_PROMPT;
  const client = getInsforgeServer();

  const completion = await client.ai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    maxTokens: 2048,
  });

  return completion.choices[0]?.message?.content || "";
}
