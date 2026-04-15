import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const AnalyzeSchema = z.object({
  samples: z.array(z.object({
    content: z.string().min(1).max(5000),
    platform: z.string().optional(),
  })).min(1).max(20),
});

const ANALYZE_PROMPT = `You are a voice analysis expert. Analyze these content samples and extract the creator's unique voice profile.

For each dimension, provide specific observations with examples from their actual writing:

1. **Tone**: Overall emotional register (casual/professional/irreverent/earnest/etc)
2. **Sentence Structure**: Average length, fragment usage, run-ons, punctuation quirks
3. **Vocabulary Level**: Simple/complex, jargon usage, slang, made-up words
4. **Opening Patterns**: How they start posts (question, bold claim, story, etc)
5. **Closing Patterns**: How they end (CTA, open question, punchline, fade out)
6. **Signature Phrases**: Recurring expressions, catchphrases, verbal tics
7. **Humor Style**: None/dry/self-deprecating/absurdist/sarcastic
8. **Perspective**: First person heavy? "You" directed? Third person?
9. **Taboo Words**: Words/phrases they NEVER use (identify by absence)
10. **Content Structure**: Short punchy paragraphs? Long form? Listicles? Thread style?

Also identify 3-5 GAP QUESTIONS -- things you CANNOT determine from the samples alone that would help complete the voice profile.

Return as JSON:
{
  "analysis": {
    "tone": "...",
    "sentence_structure": "...",
    "vocabulary_level": "...",
    "opening_patterns": "...",
    "closing_patterns": "...",
    "signature_phrases": ["...", "..."],
    "humor_style": "...",
    "perspective": "...",
    "taboo_words": ["...", "..."],
    "content_structure": "..."
  },
  "voice_summary": "A 2-3 sentence natural language description of their voice",
  "voice_rules": ["DO: ...", "DO: ...", "NEVER: ...", "NEVER: ..."],
  "gap_questions": [
    {"id": "q1", "question": "...", "why": "..."},
    {"id": "q2", "question": "...", "why": "..."}
  ]
}`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(user.id);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const samplesText = parsed.data.samples
    .map((s, i) => `--- Sample ${i + 1}${s.platform ? ` (${s.platform})` : ''} ---\n${s.content}`)
    .join('\n\n');

  try {
    const result = await generateContent(
      `Here are ${parsed.data.samples.length} content samples to analyze:\n\n${samplesText}`,
      undefined,
      ANALYZE_PROMPT,
    );

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 });
    }

    let analysis: unknown;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Model returned invalid JSON' }, { status: 502 });
    }
    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Voice analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
