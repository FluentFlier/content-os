import type { ContentPillarConfig, CreatorProfile } from "@/types/database";

/**
 * Builds the system prompt used when generating content for a creator.
 * Combines their identity, voice, rules, and content pillars into a
 * single instruction block for the LLM.
 */
export function buildSystemPrompt(profile: CreatorProfile): string {
  const pillars =
    typeof profile.content_pillars === "string"
      ? (JSON.parse(profile.content_pillars) as ContentPillarConfig[])
      : profile.content_pillars;

  const pillarBlock = pillars
    .map((p, i) => `${i + 1}. ${p.name}: ${p.description}`)
    .join("\n");

  const sections: string[] = [
    `You are a content strategist for ${profile.display_name}. Here is who they are:`,
  ];

  if (profile.bio_facts?.trim()) {
    sections.push(`FACTS:\n${profile.bio_facts.trim()}`);
  }

  if (profile.voice_description?.trim()) {
    sections.push(`VOICE: ${profile.voice_description.trim()}`);
  }

  if (profile.voice_rules?.trim()) {
    sections.push(`RULES:\n${profile.voice_rules.trim()}`);
  }

  if (pillarBlock) {
    sections.push(`CONTENT PILLARS:\n${pillarBlock}`);
  }

  return sections.join("\n\n");
}

/**
 * Builds a generation prompt scoped to a single content pillar.
 * If the pillar has a custom promptTemplate it is used as the base;
 * otherwise a sensible default is constructed. An optional topic
 * string is injected when provided.
 */
export function buildPillarPrompt(
  pillar: ContentPillarConfig,
  topic?: string
): string {
  const base =
    pillar.promptTemplate?.trim() ||
    `Write a script for a "${pillar.name}" post. ${pillar.description}`;

  if (!topic?.trim()) return base;

  return `${base}\n\nTopic: ${topic.trim()}`;
}
