import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DetectSchema = z.object({
  niche: z.string().max(500).optional(),
});

const TREND_DETECT_PROMPT = `You are a social media trend analyst. Your job is to identify current trending topics and angles that a content creator could capitalize on RIGHT NOW.

Consider:
- Viral formats and memes currently circulating
- Breaking news in tech, business, and culture
- Emerging conversations on Twitter/X, LinkedIn, and Instagram
- Seasonal events and cultural moments
- Counter-narrative opportunities (everyone says X, but actually Y)

For each trend, provide:
1. The trend/topic
2. Why it's trending NOW
3. A specific content angle the creator could take
4. Which platform it works best on
5. Urgency level (immediate / today / this week)
6. A draft hook (first line of the post)

Return JSON array:
[
  {
    "topic": "...",
    "why_trending": "...",
    "angle": "...",
    "best_platform": "twitter|linkedin|instagram|threads",
    "urgency": "immediate|today|this_week",
    "draft_hook": "...",
    "confidence": 0.0-1.0
  }
]

Return 5-8 trends. Prioritize by urgency and relevance to the creator's pillars.`;

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

  const client = await getServerClient();

  // Load creator profile for context
  let profile: CreatorProfileForPrompt | null = null;
  try {
    const { data: profileRow } = await client.database
      .from('creator_profile')
      .select('display_name, bio, content_pillars, voice_description, voice_rules')
      .eq('user_id', user.id)
      .single();

    if (profileRow) {
      profile = {
        display_name: profileRow.display_name,
        bio: profileRow.bio ?? undefined,
        content_pillars: typeof profileRow.content_pillars === 'string'
          ? JSON.parse(profileRow.content_pillars)
          : profileRow.content_pillars,
        voice_description: profileRow.voice_description ?? undefined,
        voice_rules: profileRow.voice_rules ?? undefined,
      };
    }
  } catch {
    // No profile, use generic detection
  }

  let rawBody: unknown = {};
  try { rawBody = await request.json(); } catch { /* empty body is fine */ }
  const bodyParsed = DetectSchema.safeParse(rawBody);
  const niche = bodyParsed.success ? bodyParsed.data.niche : undefined;

  const pillarContext = profile?.content_pillars
    ? `Creator's content pillars: ${profile.content_pillars.map((p: { name: string }) => p.name).join(', ')}`
    : '';

  const nicheContext = niche ? `Creator's niche: ${niche}` : '';

  const prompt = `Detect trending topics and content opportunities for today (${new Date().toISOString().split('T')[0]}).

${pillarContext}
${nicheContext}
${profile?.voice_description ? `Creator voice: ${profile.voice_description}` : ''}

Find trends that this specific creator could ride. Be specific, not generic.`;

  try {
    const result = await generateContent(prompt, undefined, TREND_DETECT_PROMPT);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse trends' }, { status: 500 });
    }

    let trends: Array<Record<string, unknown>>;
    try {
      trends = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Model returned invalid JSON' }, { status: 502 });
    }
    if (!Array.isArray(trends)) {
      return NextResponse.json({ error: 'Model returned non-array trends' }, { status: 502 });
    }

    // Store trends in DB in parallel; a detected_trends upsert is a leaf write.
    const nowIso = new Date().toISOString();
    await Promise.all(
      trends
        .filter((t) => typeof t.topic === 'string' && t.topic)
        .map((trend) =>
          client.database.from('detected_trends').upsert({
            user_id: user.id,
            topic: trend.topic,
            why_trending: trend.why_trending,
            angle: trend.angle,
            best_platform: trend.best_platform,
            urgency: trend.urgency,
            draft_hook: trend.draft_hook,
            confidence: trend.confidence,
            detected_at: nowIso,
          }, { onConflict: 'user_id,topic' }),
        ),
    );

    return NextResponse.json({ trends });
  } catch (err) {
    console.error('Trend detection error:', err);
    return NextResponse.json({ error: 'Trend detection failed' }, { status: 500 });
  }
}
