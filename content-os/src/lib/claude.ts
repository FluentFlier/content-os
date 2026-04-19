import { getServerClient } from './insforge/server';

/**
 * Default template used to seed new creator profiles during onboarding.
 * Never rendered directly in AI calls - use buildSystemPrompt() instead.
 */
export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are a content strategist. You help creators write authentic, specific content for their social media. Follow the creator's voice and context provided below. Never use em dashes. If no creator context is provided, write direct, honest, punchy content.

RULES:
- No em dashes anywhere. Ever.
- No corporate speak or influencer fluff
- Never genericize a specific detail
- If a 16 year old cannot follow an explanation, simplify more
- Short punchy sentences
- Talk TO the viewer, not AT them`;

export interface CreatorProfileForPrompt {
  display_name: string;
  bio?: string;
  // Stored either as objects ({name, description}) or plain strings,
  // depending on when/where the row was created. Consumers should
  // normalize via pillarName()/pillarDescription() before rendering.
  content_pillars?: Array<{ name: string; description?: string; promptTemplate?: string } | string>;
  voice_description?: string;
  voice_rules?: string;
}

function pillarName(p: unknown): string | null {
  if (typeof p === 'string') return p.trim() || null;
  if (p && typeof p === 'object' && 'name' in p) {
    const n = (p as { name?: unknown }).name;
    if (typeof n === 'string' && n.trim()) return n.trim();
  }
  return null;
}

function pillarDescription(p: unknown): string | null {
  if (p && typeof p === 'object' && 'description' in p) {
    const d = (p as { description?: unknown }).description;
    if (typeof d === 'string' && d.trim()) return d.trim();
  }
  return null;
}

/**
 * Builds a personalized system prompt from the user's creator profile.
 * Falls back to the default template if no profile is provided.
 */
export function buildSystemPrompt(
  profile?: CreatorProfileForPrompt | null,
  contextAdditions?: string
): string {
  if (!profile) {
    const base = DEFAULT_SYSTEM_PROMPT_TEMPLATE;
    if (contextAdditions) {
      return `${base}\n\nADDITIONAL CONTEXT:\n${contextAdditions}`;
    }
    return base;
  }

  const parts: string[] = [];

  parts.push(
    `You are a content strategist for ${profile.display_name}. You help them write authentic, specific content for their social media. Follow their voice and context closely. Never use em dashes.`
  );

  parts.push(`\nRULES:
- No em dashes anywhere. Ever.
- No corporate speak or influencer fluff
- Never genericize a specific detail
- If a 16 year old cannot follow an explanation, simplify more
- Short punchy sentences
- Talk TO the viewer, not AT them`);

  if (profile.bio) {
    parts.push(`\nCREATOR BIO:\n${profile.bio}`);
  }

  if (profile.voice_description) {
    parts.push(`\nVOICE:\n${profile.voice_description}`);
  }

  if (profile.voice_rules) {
    parts.push(`\nVOICE RULES (MUST FOLLOW):\n${profile.voice_rules}`);
  }

  if (profile.content_pillars && profile.content_pillars.length > 0) {
    const pillarLines: string[] = [];
    for (const p of profile.content_pillars) {
      const name = pillarName(p);
      if (!name) continue;
      const desc = pillarDescription(p);
      pillarLines.push(desc ? `- ${name}: ${desc}` : `- ${name}`);
    }
    if (pillarLines.length > 0) {
      parts.push(`\nCONTENT PILLARS:\n${pillarLines.join('\n')}`);
    }
  }

  if (contextAdditions) {
    parts.push(`\nADDITIONAL CONTEXT:\n${contextAdditions}`);
  }

  return parts.join('\n');
}

export async function generateContent(
  prompt: string,
  contextAdditions?: string,
  systemOverride?: string,
  profile?: CreatorProfileForPrompt | null
): Promise<string> {
  const systemPrompt = systemOverride
    ? systemOverride
    : buildSystemPrompt(profile, contextAdditions);

  const client = await getServerClient();
  const completion = await client.ai.chat.completions.create({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    maxTokens: 2048,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from InsForge AI');
  return content;
}
