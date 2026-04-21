import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemOverride: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit before parsing the body — cheap rejection for spam.
  const rl = checkRateLimit(user.id);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = await getServerClient();

  // Load profile and context_additions in parallel — both queries are
  // independent and each took a full round-trip sequentially before.
  const [profileSettled, settingSettled] = await Promise.allSettled([
    Promise.resolve(
      client.database
        .from('creator_profile')
        .select('display_name, bio, content_pillars, voice_description, voice_rules')
        .eq('user_id', user.id)
        .maybeSingle(),
    ),
    Promise.resolve(
      client.database
        .from('user_settings')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'context_additions')
        .maybeSingle(),
    ),
  ]);

  const profileResult =
    profileSettled.status === 'fulfilled' ? profileSettled.value.data : null;
  const settingResult =
    settingSettled.status === 'fulfilled' ? settingSettled.value.data : null;

  let profile: CreatorProfileForPrompt | null = null;
  if (profileResult) {
    try {
      const contentPillars = typeof profileResult.content_pillars === 'string'
        ? JSON.parse(profileResult.content_pillars)
        : profileResult.content_pillars;
      profile = {
        display_name: profileResult.display_name,
        bio: profileResult.bio ?? undefined,
        content_pillars: contentPillars,
        voice_description: profileResult.voice_description ?? undefined,
        voice_rules: profileResult.voice_rules ?? undefined,
      };
    } catch { /* corrupt pillars JSON — fall through without profile */ }
  }

  const contextAdditions: string | undefined = settingResult?.value ?? undefined;

  try {
    const text = await generateContent(
      parsed.data.prompt,
      contextAdditions,
      parsed.data.systemOverride,
      profile
    );
    // Strip em dashes from AI output
    const cleaned = text.replace(/\u2014/g, ' - ').replace(/\u2013/g, '-');
    return NextResponse.json({ text: cleaned });
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
