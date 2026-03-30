import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import * as twitterClient from '@/lib/platforms/twitter';
import * as linkedinClient from '@/lib/platforms/linkedin';
import * as instagramClient from '@/lib/platforms/instagram';
import * as threadsClient from '@/lib/platforms/threads';
import { decryptToken } from '@/lib/crypto';
import { z } from 'zod';

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

  // If no expiry set or token is still valid, return decrypted token
  if (!expiresAt || expiresAt > now) {
    return decryptToken(account.access_token);
  }

  // Token is expired, attempt refresh based on platform
  const decryptedAccess = decryptToken(account.access_token);
  const decryptedRefresh = account.refresh_token ? decryptToken(account.refresh_token) : null;
  let refreshed: { success: boolean; accessToken?: string; refreshToken?: string; expiresAt?: string; error?: string } | null = null;

  switch (platform) {
    case 'linkedin': {
      if (!decryptedRefresh) break;
      const clientId = process.env.LINKEDIN_CLIENT_ID ?? '';
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? '';
      if (!clientId || !clientSecret) break;
      refreshed = await linkedinClient.refreshAccessToken(
        decryptedRefresh,
        clientId,
        clientSecret
      );
      break;
    }
    case 'instagram': {
      refreshed = await instagramClient.refreshAccessToken(decryptedAccess);
      break;
    }
    case 'threads': {
      refreshed = await threadsClient.refreshAccessToken(decryptedAccess);
      break;
    }
    case 'twitter':
      // Twitter OAuth 2.0 with PKCE does not support token refresh in v2 user context
      // Fall through and use existing token
      break;
  }

  if (refreshed?.success && refreshed.accessToken) {
    // Persist refreshed tokens (encrypted)
    const { encryptToken } = await import('@/lib/crypto');
    const updatePayload: Record<string, unknown> = {
      access_token: encryptToken(refreshed.accessToken),
      connected_at: new Date().toISOString(),
    };
    if (refreshed.refreshToken) {
      updatePayload.refresh_token = encryptToken(refreshed.refreshToken);
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
  return decryptedAccess;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const PublishSchema = z.object({
    postId: z.string().uuid().optional(),
    platform: z.enum(['twitter', 'linkedin', 'instagram', 'threads']),
    content: z.string().min(1).max(25000),
    caption: z.string().max(25000).optional(),
    imageUrl: z.string().url().optional(),
  });

  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { postId, platform, content, caption, imageUrl } = parsed.data;

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
