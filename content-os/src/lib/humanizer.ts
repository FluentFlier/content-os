import { generateContent } from './claude';
import type { CreatorProfileForPrompt } from './claude';

/**
 * Humanizer: Detects and removes 29 AI writing patterns to make content
 * sound authentically human. Based on Wikipedia's "Signs of AI writing" guide.
 *
 * Patterns detected:
 * - Content: significance inflation, name-dropping, vague attributions
 * - Language: overused AI vocabulary, copula avoidance, excessive hedging
 * - Style: em dash overuse, title case, emoji padding
 * - Communication: chatbot artifacts, sycophantic tone, filler conclusions
 */

const HUMANIZER_PROMPT = `You are a text humanizer. Your job is to rewrite AI-generated text so it reads like a real human wrote it.

DETECT AND FIX these 29 AI writing patterns:

**Content patterns:**
1. Significance inflation ("groundbreaking", "pivotal", "revolutionary" when not warranted)
2. Name-dropping and false authority
3. Vague attributions ("experts say", "studies show" without specifics)
4. Padding with obvious statements
5. Repetitive thesis restatement
6. Generic examples that could apply to anything

**Language patterns:**
7. Overused AI words: delve, tapestry, leverage, foster, landscape, nuanced, multifaceted, comprehensive, robust, holistic, pivotal, crucial, paramount, innovative, transformative, utilize
8. Copula avoidance ("serves as" instead of "is", "features" instead of "has")
9. Excessive hedging ("It is worth noting that...")
10. Paired near-synonyms ("diverse and varied", "challenges and obstacles")
11. Unnecessary transitional phrases
12. Overly formal register for casual topics

**Style patterns:**
13. Em dash overuse
14. Excessive use of colons for lists
15. Title case in headings where sentence case is normal
16. Emoji as section decorators
17. Bullet point padding
18. Artificially balanced paragraph lengths

**Communication patterns:**
19. Chatbot artifacts ("I hope this helps!", "Great question!")
20. Sycophantic openers ("That's a fantastic point")
21. Filler conclusions ("In conclusion, it is clear that...")
22. Meta-commentary ("Let me break this down for you")
23. Disclaimer hedging ("While I cannot provide medical advice...")
24. Artificial enthusiasm markers (excessive exclamation marks)

**Structure patterns:**
25. Perfect three-point structure (everything in threes)
26. Mirror structure (repeating the question back)
27. Numbered list as default organization
28. Topic sentence + 3 supporting points + conclusion in every paragraph
29. Artificial balance (equal weight to all sides)

RULES:
- Keep the core message and facts intact
- Match the voice/tone described below
- Make it sound like a real person typed it quickly
- Vary sentence length naturally
- Use contractions where natural
- Don't add new information
- Don't make it longer than the original

Return ONLY the rewritten text. No explanations, no meta-commentary.`;

/**
 * Humanize AI-generated content by removing telltale AI patterns.
 * Optionally matches the creator's voice profile.
 */
export async function humanize(
  text: string,
  profile?: CreatorProfileForPrompt | null
): Promise<string> {
  const voiceContext = profile
    ? `\n\nVOICE TO MATCH:\nName: ${profile.display_name}\n${profile.voice_description ? `Voice: ${profile.voice_description}` : ''}${profile.voice_rules ? `\nRules: ${profile.voice_rules}` : ''}`
    : '';

  const result = await generateContent(
    `Humanize this text:${voiceContext}\n\n---\n${text}\n---`,
    undefined,
    HUMANIZER_PROMPT,
  );

  return result.trim();
}

/**
 * Quick check: score how "AI-sounding" a piece of text is.
 * Returns 0-100 where 100 = obviously AI, 0 = sounds human.
 */
export async function aiScore(text: string): Promise<{ score: number; flags: string[] }> {
  const result = await generateContent(
    `Score this text 0-100 on how AI-generated it sounds. 0 = fully human, 100 = obviously AI.

Text:
${text}

Return JSON only: {"score": number, "flags": ["pattern1", "pattern2"]}`,
    undefined,
    'You are an AI detection expert. Analyze the text for the 29 known AI writing patterns. Be precise and honest. Return ONLY valid JSON.',
  );

  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 50, flags: ['analysis_failed'] };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { score: 50, flags: ['parse_failed'] };
  }
}
