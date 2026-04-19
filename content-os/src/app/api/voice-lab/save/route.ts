import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { storePersona } from '@/lib/supermemory';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const SaveSchema = z.object({
  voice_description: z.string().max(10000),
  voice_rules: z.string().max(10000),
  vocabulary_fingerprint: z.record(z.string(), z.unknown()),
  structural_patterns: z.record(z.string(), z.unknown()),
  exportable_prompt: z.string().max(20000),
  sample_posts: z.array(z.object({
    content: z.string().max(25000),
    platform: z.string().max(100).optional(),
  })).max(100).optional(),
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

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  // The vocabulary_fingerprint and structural_patterns fields are
  // z.record(z.unknown()), so length caps on individual keys are not
  // enforced by zod. Serialize once and bound the total payload so a
  // malicious client can't stuff 100MB of JSON into user_settings.
  const vocabSerialized = JSON.stringify(parsed.data.vocabulary_fingerprint);
  const patternsSerialized = JSON.stringify(parsed.data.structural_patterns);
  if (vocabSerialized.length > 100_000 || patternsSerialized.length > 100_000) {
    return NextResponse.json(
      { error: 'vocabulary_fingerprint and structural_patterns are limited to 100KB each' },
      { status: 400 },
    );
  }

  const client = await getServerClient();

  // Update creator_profile with voice data
  const { error: profileError } = await client.database
    .from('creator_profile')
    .upsert({
      user_id: user.id,
      voice_description: parsed.data.voice_description,
      voice_rules: parsed.data.voice_rules,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('Profile save error:', profileError);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  // Store voice data in user_settings as JSON for the richer fields
  const settingsToSave = [
    { key: 'vocabulary_fingerprint', value: vocabSerialized },
    { key: 'structural_patterns', value: patternsSerialized },
    { key: 'persona_prompt_export', value: parsed.data.exportable_prompt },
  ];

  if (parsed.data.sample_posts) {
    settingsToSave.push({
      key: 'sample_posts',
      value: JSON.stringify(parsed.data.sample_posts),
    });
  }

  await Promise.all(
    settingsToSave.map((setting) =>
      client.database
        .from('user_settings')
        .upsert({
          user_id: user.id,
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,key' }),
    ),
  );

  // Store persona in Supermemory for semantic search during generation
  try {
    const personaContent = [
      `Voice: ${parsed.data.voice_description}`,
      `Rules: ${parsed.data.voice_rules}`,
      `Vocabulary: ${JSON.stringify(parsed.data.vocabulary_fingerprint)}`,
      `Patterns: ${JSON.stringify(parsed.data.structural_patterns)}`,
    ].join('\n\n');

    await storePersona(user.id, personaContent, {
      type: 'persona',
      hasExport: true,
    });
  } catch (err) {
    // Supermemory is optional -- don't fail the save if it's unavailable
    console.warn('Supermemory store failed (non-critical):', err);
  }

  return NextResponse.json({ success: true });
}
