import { getServerClient } from '@/lib/insforge/server';
import { PLATFORMS } from '@/lib/constants';
import type { Platform } from '@/lib/constants';

/**
 * Checks if auto-optimize is enabled for a user, and if so, triggers
 * background optimization to create variant posts linked by variant_group_id.
 *
 * This function is called after a post is created/updated with script or
 * caption content. It runs asynchronously (fire-and-forget) so it does not
 * block the response to the original POST/PATCH request.
 */
export async function triggerAutoOptimize({
  userId,
  postId,
  content,
  sourcePlatform,
  requestCookies,
  origin,
}: {
  userId: string;
  postId: string;
  content: string;
  sourcePlatform: string;
  requestCookies: string;
  origin: string;
}): Promise<void> {
  const client = await getServerClient();

  // 1. Check user setting. Users who never toggled the flag have no row,
  // so .maybeSingle() returns null without an error — treat as disabled.
  const { data: setting } = await client.database
    .from('user_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'auto_optimize_on_save')
    .maybeSingle();

  if (!setting || setting.value !== 'true') {
    return;
  }

  // 2. Determine target platforms (all except source)
  const targetPlatforms = PLATFORMS.filter(
    (p) => p !== sourcePlatform
  ) as Platform[];

  if (targetPlatforms.length === 0 || !content.trim()) {
    return;
  }

  // 3. Generate a variant_group_id and assign it to the source post
  const variantGroupId = crypto.randomUUID();

  await client.database
    .from('posts')
    .update({
      variant_group_id: variantGroupId,
      source_platform: sourcePlatform,
    })
    .eq('id', postId)
    .eq('user_id', userId);

  // 4. Call POST /api/optimize to generate variants
  try {
    const optimizeRes = await fetch(`${origin}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: requestCookies,
      },
      body: JSON.stringify({
        content,
        sourcePlatform: sourcePlatform as Platform,
        targetPlatforms,
        postId,
        optimizationLevel: 'full',
      }),
    });

    if (!optimizeRes.ok) {
      console.error(
        '[auto-optimize] Optimization request failed:',
        optimizeRes.status
      );
      return;
    }

    const { variants } = await optimizeRes.json();

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return;
    }

    // 5. Fetch the source post to inherit title and pillar
    // Source post may have been deleted between the initial POST and this
    // background job completing. maybeSingle() returns null cleanly.
    const { data: sourcePost } = await client.database
      .from('posts')
      .select('title, pillar')
      .eq('id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!sourcePost) return;

    // 6. Create variant posts
    const variantPosts = variants.map(
      (v: { platform: string; content: string }) => ({
        user_id: userId,
        title: `${sourcePost.title} (${v.platform})`,
        pillar: sourcePost.pillar,
        platform: v.platform,
        status: 'scripted' as const,
        caption: v.content,
        variant_group_id: variantGroupId,
        source_platform: sourcePlatform,
      })
    );

    await client.database.from('posts').insert(variantPosts);
  } catch (err) {
    console.error('[auto-optimize] Background optimization error:', err);
  }
}
