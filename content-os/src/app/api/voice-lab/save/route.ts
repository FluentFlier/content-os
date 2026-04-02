import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { storePersona } from '@/lib/supermemory';
import { z } from 'zod';

const SaveSchema = z.object({
  voice_description: z.string(),
  voice_rules: z.string(),
  vocabulary_fingerprint: z.record(z.string(), z.unknown()),
  structural_patterns: z.record(z.string(), z.unknown()),
  exportable_prompt: z.string(),
  sample_posts: z.array(z.object({
    content: z.string(),
    platform: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = getServerClient();

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
    { key: 'vocabulary_fingerprint', value: JSON.stringify(parsed.data.vocabulary_fingerprint) },
    { key: 'structural_patterns', value: JSON.stringify(parsed.data.structural_patterns) },
    { key: 'persona_prompt_export', value: parsed.data.exportable_prompt },
  ];

  if (parsed.data.sample_posts) {
    settingsToSave.push({
      key: 'sample_posts',
      value: JSON.stringify(parsed.data.sample_posts),
    });
  }

  for (const setting of settingsToSave) {
    await client.database
      .from('user_settings')
      .upsert({
        user_id: user.id,
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,key' });
  }

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
