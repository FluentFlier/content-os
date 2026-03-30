import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import * as twitterClient from '@/lib/platforms/twitter';
import * as linkedinClient from '@/lib/platforms/linkedin';
import * as instagramClient from '@/lib/platforms/instagram';
import * as threadsClient from '@/lib/platforms/threads';

type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'threads';

interface SocialAccountRow {
  id: string;
  user_id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  connected_at: string;
}

/**
 * Checks if the stored token is expired and attempts a refresh if possible.
 * Returns the (possibly refreshed) access token, or null if refresh failed.
 */
async function ensureFreshToken(
  account: SocialAccountRow,
  platform: SocialPlatform,
  client: ReturnType<typeof getServerClient>
): Promise<string> {
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;

  // If no expiry set or token is still valid, return as-is
  if (!expiresAt || expiresAt > now) {
    return account.access_token;
  }

  // Token is expired, attempt refresh based on platform
  let refreshed: { success: boolean; accessToken?: string; refreshToken?: string; expiresAt?: string; error?: string } | null = null;

  switch (platform) {
    case 'linkedin': {
      if (!account.refresh_token) break;
      const clientId = process.env.LINKEDIN_CLIENT_ID ?? '';
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? '';
      if (!clientId || !clientSecret) break;
      refreshed = await linkedinClient.refreshAccessToken(
        account.refresh_token,
        clientId,
        clientSecret
      );
      break;
    }
    case 'instagram': {
      refreshed = await instagramClient.refreshAccessToken(account.access_token);
      break;
    }
    case 'threads': {
      refreshed = await threadsClient.refreshAccessToken(account.access_token);
      break;
    }
    case 'twitter':
      // Twitter OAuth 2.0 with PKCE does not support token refresh in v2 user context
      // Fall through and use existing token
      break;
  }

  if (refreshed?.success && refreshed.accessToken) {
    // Persist refreshed tokens
    const updatePayload: Record<string, unknown> = {
      access_token: refreshed.accessToken,
      connected_at: new Date().toISOString(),
    };
    if (refreshed.refreshToken) {
      updatePayload.refresh_token = refreshed.refreshToken;
    }
    if (refreshed.expiresAt) {
      updatePayload.token_expires_at = refreshed.expiresAt;
    }

    await client.database
      .from('social_accounts')
      .update(updatePayload)
      .eq('id', account.id);

    return refreshed.accessToken;
  }

  // Refresh failed or not available, try with existing token anyway
  return account.access_token;
}

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

  // Ensure token is fresh (refresh if expired)
  const freshToken = await ensureFreshToken(
    account as SocialAccountRow,
    platform,
    client
  );

  // Publish to the platform
  const publishContent = caption || content;
  let result: { success: boolean; platformPostId?: string; url?: string; error?: string };

  switch (platform) {
    case 'twitter':
      result = await twitterClient.publishPost(freshToken, publishContent);
      break;
    case 'linkedin':
      result = await linkedinClient.publishPost(
        freshToken,
        publishContent,
        account.account_id ?? undefined
      );
      break;
    case 'instagram':
      result = await instagramClient.publishPost(
        freshToken,
        publishContent,
        account.account_id ?? undefined,
        imageUrl
      );
      break;
    case 'threads':
      result = await threadsClient.publishPost(
        freshToken,
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
