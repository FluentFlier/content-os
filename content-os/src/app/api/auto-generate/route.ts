import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { generateContent, buildSystemPrompt } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { searchUserContext } from '@/lib/supermemory';
import { z } from 'zod';

const AutoGenSchema = z.object({
  type: z.enum(['trend_reaction', 'scheduled', 'reply', 'original']),
  topic: z.string().optional(),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'threads']),
  trendId: z.string().optional(),
  context: z.string().optional(),
});

/**
 * Content types and their approval requirements:
 * - trend_reaction: auto-queue, can auto-publish if setting enabled
 * - reply: auto-queue, can auto-publish
 * - scheduled: auto-queue, needs approval
 * - original: always needs approval
 */
const AUTO_PUBLISH_TYPES = ['trend_reaction', 'reply'];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = AutoGenSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { type, topic, platform, context } = parsed.data;
  const client = getServerClient();

  // Load profile
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
  } catch { /* no profile */ }

  // Get Supermemory context if available
  let memoryContext = '';
  try {
    if (topic) {
      const results = await searchUserContext(user.id, topic, 3);
      if (results.length > 0) {
        memoryContext = `\n\nRelevant context from your memory:\n${results.map(r => r.content).filter(Boolean).join('\n---\n')}`;
      }
    }
  } catch {
    // Supermemory optional
  }

  // Check auto-publish setting
  const { data: autoPublishSetting } = await client.database
    .from('user_settings')
    .select('value')
    .eq('user_id', user.id)
    .eq('key', 'auto_publish_reactions')
    .maybeSingle();

  const autoPublishEnabled = autoPublishSetting?.value === 'true';
  const shouldAutoPublish = autoPublishEnabled && AUTO_PUBLISH_TYPES.includes(type);

  // Platform-specific constraints
  const platformGuide: Record<string, string> = {
    twitter: 'Max 280 characters. Punchy, conversational. No hashtags unless absolutely necessary.',
    linkedin: 'Professional but human. 1-3 short paragraphs. Can use line breaks for emphasis. 1-3 relevant hashtags at end.',
    instagram: 'Caption style. Hook in first line. Use line breaks. 5-15 hashtags at end.',
    threads: 'Conversational, like twitter but can be longer. Thread-worthy if topic is deep.',
  };

  const typeGuide: Record<string, string> = {
    trend_reaction: 'Quick take on a trending topic. Be first, be bold, have a clear opinion.',
    reply: 'Engaging reply that adds value. Not sycophantic. Offer a new angle or insight.',
    scheduled: 'Planned content that follows the creator\'s content calendar and pillars.',
    original: 'Original thought leadership piece. Deep insight, personal angle, unique perspective.',
  };

  const prompt = `Write a ${type.replace('_', ' ')} post for ${platform}.

Topic: ${topic || 'Creator\'s choice based on their pillars'}
${context ? `Additional context: ${context}` : ''}
${memoryContext}

Platform rules: ${platformGuide[platform]}
Content type: ${typeGuide[type]}

Return JSON:
{
  "content": "The full post text ready to publish",
  "hook": "The first line/hook",
  "hashtags": "Space-separated hashtags if applicable",
  "confidence": 0.0-1.0,
  "reasoning": "Why this content works for this creator and moment"
}`;

  try {
    const systemPrompt = buildSystemPrompt(profile, `You are generating a ${type} post for ${platform}.`);
    const result = await generateContent(prompt, undefined, systemPrompt, profile);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse generated content' }, { status: 500 });
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Store in auto_generated_posts queue
    const { data: savedPost, error: saveError } = await client.database
      .from('posts')
      .insert({
        user_id: user.id,
        title: generated.hook || topic || 'Auto-generated post',
        pillar: profile?.content_pillars?.[0]?.name || 'general',
        platform,
        status: shouldAutoPublish ? 'edited' : 'scripted',
        script: generated.content,
        caption: generated.content,
        hashtags: generated.hashtags || null,
        hook: generated.hook,
        notes: JSON.stringify({
          auto_generated: true,
          type,
          confidence: generated.confidence,
          reasoning: generated.reasoning,
          auto_publish: shouldAutoPublish,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      return NextResponse.json({ error: 'Failed to save generated content' }, { status: 500 });
    }

    return NextResponse.json({
      post: savedPost,
      generated,
      auto_publish: shouldAutoPublish,
    });
  } catch (err) {
    console.error('Auto-generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
