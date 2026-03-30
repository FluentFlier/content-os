import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import * as twitterClient from '@/lib/platforms/twitter';
import * as linkedinClient from '@/lib/platforms/linkedin';
import * as instagramClient from '@/lib/platforms/instagram';
import * as threadsClient from '@/lib/platforms/threads';

type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'threads';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { postId, platform, content, caption, imageUrl } = body as {
    postId?: string;
    platform?: SocialPlatform;
    content?: string;
    caption?: string;
    imageUrl?: string;
  };

  if (!platform || !content) {
    return NextResponse.json({ error: 'Missing platform or content' }, { status: 400 });
  }

  const validPlatforms: SocialPlatform[] = ['twitter', 'linkedin', 'instagram', 'threads'];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const client = getServerClient();

  // Get the social account for this platform
  const { data: account, error: accountError } = await client.database
    .from('social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { error: `No ${platform} account connected. Connect it in Settings.` },
      { status: 400 }
    );
  }

  // Publish to the platform
  const publishContent = caption || content;
  let result: { success: boolean; platformPostId?: string; url?: string; error?: string };

  switch (platform) {
    case 'twitter':
      result = await twitterClient.publishPost(account.access_token, publishContent);
      break;
    case 'linkedin':
      result = await linkedinClient.publishPost(
        account.access_token,
        publishContent,
        account.account_id ?? undefined
      );
      break;
    case 'instagram':
      result = await instagramClient.publishPost(
        account.access_token,
        publishContent,
        account.account_id ?? undefined,
        imageUrl
      );
      break;
    case 'threads':
      result = await threadsClient.publishPost(
        account.access_token,
        publishContent,
        account.account_id ?? undefined
      );
      break;
    default:
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'Publishing failed' },
      { status: 500 }
    );
  }

  // If we have a postId, update the post status to posted
  if (postId) {
    await client.database
      .from('posts')
      .update({
        status: 'posted',
        posted_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('user_id', user.id);
  }

  return NextResponse.json({
    success: true,
    platformPostId: result.platformPostId,
    url: result.url,
  });
}
