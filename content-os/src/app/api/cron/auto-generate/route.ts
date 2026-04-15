import { NextRequest, NextResponse } from 'next/server';
import { generateContent, buildSystemPrompt } from '@/lib/claude';
import type { CreatorProfileForPrompt } from '@/lib/claude';
import { createClient } from '@insforge/sdk';
import { timingSafeEqual } from 'crypto';

/**
 * Cron endpoint for automated content generation.
 * Runs periodically (e.g. every 6 hours) to:
 * 1. Detect trends for each active user
 * 2. Auto-generate content based on their schedule and pillars
 * 3. Queue posts for approval or auto-publish based on user settings
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const provided = Buffer.from(authHeader);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const serviceKey = process.env.INSFORGE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing service config' }, { status: 500 });
  }

  // Use service role key for admin access
  const adminClient = createClient({
    baseUrl: url,
    anonKey: serviceKey,
    isServerMode: true,
  });

  // Get all users with auto-generate enabled
  const { data: autoGenUsers } = await adminClient.database
    .from('user_settings')
    .select('user_id, value')
    .eq('key', 'auto_generate_enabled')
    .eq('value', 'true');

  if (!autoGenUsers || autoGenUsers.length === 0) {
    return NextResponse.json({ message: 'No users with auto-generate enabled', processed: 0 });
  }

  const results: Array<{ userId: string; status: string; postsGenerated: number }> = [];

  for (const userSetting of autoGenUsers) {
    const userId = userSetting.user_id;

    try {
      // Load profile
      const { data: profileRow } = await adminClient.database
        .from('creator_profile')
        .select('display_name, bio, content_pillars, voice_description, voice_rules')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileRow) {
        results.push({ userId, status: 'skipped_no_profile', postsGenerated: 0 });
        continue;
      }

      const profile: CreatorProfileForPrompt = {
        display_name: profileRow.display_name,
        bio: profileRow.bio ?? undefined,
        content_pillars: typeof profileRow.content_pillars === 'string'
          ? JSON.parse(profileRow.content_pillars)
          : profileRow.content_pillars,
        voice_description: profileRow.voice_description ?? undefined,
        voice_rules: profileRow.voice_rules ?? undefined,
      };

      // Load weekly schedule
      const { data: scheduleSetting } = await adminClient.database
        .from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'weekly_schedule')
        .maybeSingle();

      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
      let todaysPillar = 'general';

      if (scheduleSetting?.value) {
        try {
          const schedule = JSON.parse(scheduleSetting.value);
          todaysPillar = schedule[dayOfWeek] || 'Rest';
        } catch { /* use default */ }
      }

      if (todaysPillar === 'Rest') {
        results.push({ userId, status: 'rest_day', postsGenerated: 0 });
        continue;
      }

      // Check how many posts already exist for today. Use [start, nextDay)
      // half-open range so timestamps at 23:59:59.5 aren't dropped.
      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const { count: todayPostCount } = await adminClient.database
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', tomorrowStart.toISOString());

      if ((todayPostCount ?? 0) >= 3) {
        results.push({ userId, status: 'daily_limit_reached', postsGenerated: 0 });
        continue;
      }

      // Load default platform
      const { data: platformSetting } = await adminClient.database
        .from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'platform_defaults')
        .maybeSingle();

      let defaultPlatform = 'twitter';
      if (platformSetting?.value) {
        try {
          const pd = JSON.parse(platformSetting.value);
          defaultPlatform = pd.defaultPlatform || 'twitter';
        } catch { /* use default */ }
      }

      // Generate one scheduled post
      const systemPrompt = buildSystemPrompt(profile, `Generate a scheduled post for ${todaysPillar} pillar on ${defaultPlatform}.`);
      const prompt = `Write a ${defaultPlatform} post for the "${todaysPillar}" content pillar.
Today is ${dayOfWeek}. Write something fresh, timely, and on-brand.
Return ONLY the post text, no JSON, no formatting.`;

      const content = await generateContent(prompt, undefined, systemPrompt, profile);
      const cleaned = content.replace(/\u2014/g, ' - ').replace(/\u2013/g, '-');

      await adminClient.database.from('posts').insert({
        user_id: userId,
        title: cleaned.split('\n')[0].slice(0, 80),
        pillar: todaysPillar,
        platform: defaultPlatform,
        status: 'scripted',
        script: cleaned,
        caption: cleaned,
        hook: cleaned.split('\n')[0],
        notes: JSON.stringify({ auto_generated: true, type: 'scheduled', cron: true }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      results.push({ userId, status: 'generated', postsGenerated: 1 });
    } catch (err) {
      console.error(`Auto-generate error for user ${userId}:`, err);
      results.push({ userId, status: 'error', postsGenerated: 0 });
    }
  }

  return NextResponse.json({
    message: 'Auto-generation complete',
    processed: results.length,
    results,
  });
}
