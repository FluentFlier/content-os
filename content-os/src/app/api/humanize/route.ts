import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { humanize, aiScore } from '@/lib/humanizer';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const HumanizeSchema = z.object({
  text: z.string().min(1).max(25000),
  scoreOnly: z.boolean().optional(),
});

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

  const parsed = HumanizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  // Score only mode
  if (parsed.data.scoreOnly) {
    try {
      const result = await aiScore(parsed.data.text);
      return NextResponse.json(result);
    } catch (err) {
      console.error('AI score error:', err);
      return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
    }
  }

  // Load profile for voice matching
  const client = await getServerClient();
  let profile: CreatorProfileForPrompt | null = null;
  try {
    const { data: profileRow } = await client.database
      .from('creator_profile')
      .select('display_name, bio, content_pillars, voice_description, voice_rules')
      .eq('user_id', user.id)
      .maybeSingle();

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
  } catch { /* no profile */ }

  try {
    const humanized = await humanize(parsed.data.text, profile);
    return NextResponse.json({ text: humanized });
  } catch (err) {
    console.error('Humanize error:', err);
    return NextResponse.json({ error: 'Humanization failed' }, { status: 500 });
  }
}
