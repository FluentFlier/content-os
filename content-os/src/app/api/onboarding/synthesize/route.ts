import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent } from '@/lib/claude';
import { storePersona } from '@/lib/supermemory';
import { z } from 'zod';

const QASchema = z.object({
  answers: z.object({
    display_name: z.string().min(1),
    bio: z.string().optional().default(''),
    audience: z.string().optional().default(''),
    pillars_raw: z.string().optional().default(''),
    sample_posts: z.string().optional().default(''),
    voice_self: z.string().optional().default(''),
    voice_avoid: z.string().optional().default(''),
    background: z.string().optional().default(''),
  }),
});

const PRESET_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#5A5047'];

interface SynthResult {
  voice_description: string;
  voice_rules: string;
  pillars: Array<{ name: string; description: string }>;
  bio_polished: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = QASchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const a = parsed.data.answers;

  const synthPrompt = `You are building a creator persona from short onboarding answers. Synthesize a structured profile.

Creator: ${a.display_name}
Bio they wrote: ${a.bio || '(none)'}
Audience: ${a.audience || '(unspecified)'}
Topics they want to post about (raw): ${a.pillars_raw || '(none)'}
Sample posts of theirs (for voice analysis):
---
${a.sample_posts || '(none provided)'}
---
How they describe their own voice: ${a.voice_self || '(none)'}
What to avoid: ${a.voice_avoid || '(none)'}
Background / current projects: ${a.background || '(none)'}

Return ONLY valid JSON in this exact shape (no prose, no markdown fences):
{
  "voice_description": "2-4 sentences capturing tone, sentence rhythm, energy. Concrete, not generic.",
  "voice_rules": "Bulleted list as a single string, one rule per line starting with '- '. Combine their stated avoids with patterns inferred from samples (e.g. '- No em dashes', '- Short sentences only').",
  "pillars": [{"name": "Short Title Case", "description": "one sentence"}],
  "bio_polished": "A clean 1-2 sentence bio. If user gave a bio, tighten it. If not, infer from background."
}

Pillars: produce 2-5 from their topic list. If they gave none, infer from background and samples. Keep names tight (1-3 words).`;

  let synth: SynthResult;
  try {
    const raw = await generateContent(
      synthPrompt,
      undefined,
      'You are a precise persona-synthesis assistant. Output only valid JSON.',
      null
    );
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    synth = JSON.parse(match[0]) as SynthResult;
  } catch (err) {
    console.error('Persona synth failed:', err);
    return NextResponse.json({ error: 'Failed to synthesize persona' }, { status: 500 });
  }

  const pillarsForDb = (synth.pillars || []).slice(0, 6).map((p, i) => ({
    name: p.name,
    description: p.description,
    color: PRESET_COLORS[i % PRESET_COLORS.length],
  }));

  const client = getServerClient();
  const { error: profileError } = await client.database
    .from('creator_profile')
    .upsert({
      user_id: user.id,
      display_name: a.display_name,
      bio: synth.bio_polished || a.bio || null,
      bio_facts: a.bio || synth.bio_polished || '',
      voice_description: synth.voice_description,
      voice_rules: synth.voice_rules,
      content_pillars: JSON.stringify(pillarsForDb),
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('Profile save error:', profileError);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  if (a.background.trim()) {
    await client.database
      .from('user_settings')
      .upsert({
        user_id: user.id,
        key: 'context_additions',
        value: a.background.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,key' });
  }

  if (a.sample_posts.trim()) {
    await client.database
      .from('user_settings')
      .upsert({
        user_id: user.id,
        key: 'sample_posts',
        value: JSON.stringify(a.sample_posts.split(/\n---+\n|\n\n+/).map(s => s.trim()).filter(Boolean)),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,key' });
  }

  try {
    const personaContent = [
      `Creator: ${a.display_name}`,
      `Bio: ${synth.bio_polished}`,
      `Voice: ${synth.voice_description}`,
      `Rules: ${synth.voice_rules}`,
      `Pillars: ${pillarsForDb.map(p => `${p.name} (${p.description})`).join('; ')}`,
      a.background ? `Background: ${a.background}` : '',
      a.audience ? `Audience: ${a.audience}` : '',
    ].filter(Boolean).join('\n\n');

    await storePersona(user.id, personaContent, { type: 'persona', source: 'onboarding' });
  } catch (err) {
    console.warn('Supermemory store failed (non-critical):', err);
  }

  return NextResponse.json({
    success: true,
    persona: {
      ...synth,
      pillars: pillarsForDb,
    },
  });
}
