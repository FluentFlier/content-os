import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { z } from 'zod';

const RequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  systemOverride: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = getServerClient();

  // Load user's creator profile for personalized prompt
  let profile: CreatorProfileForPrompt | null = null;
  try {
    const { data: profileRow } = await client.database
      .from('creator_profile')
      .select('display_name, bio, content_pillars, voice_description, voice_rules')
      .eq('user_id', user.id)
      .single();

    if (profileRow) {
      const contentPillars = typeof profileRow.content_pillars === 'string'
        ? JSON.parse(profileRow.content_pillars)
        : profileRow.content_pillars;

      profile = {
        display_name: profileRow.display_name,
        bio: profileRow.bio ?? undefined,
        content_pillars: contentPillars,
        voice_description: profileRow.voice_description ?? undefined,
        voice_rules: profileRow.voice_rules ?? undefined,
      };
    }
  } catch {
    // No profile found - will use default prompt
  }

  // Load context_additions from user_settings
  let contextAdditions: string | undefined;
  try {
    const { data: settingRow } = await client.database
      .from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', 'context_additions')
      .single();
    contextAdditions = settingRow?.value ?? undefined;
  } catch {
    // No context additions found
  }

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
