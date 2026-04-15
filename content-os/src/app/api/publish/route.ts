import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import * as twitterClient from '@/lib/platforms/twitter';
import * as linkedinClient from '@/lib/platforms/linkedin';
import * as instagramClient from '@/lib/platforms/instagram';
import * as threadsClient from '@/lib/platforms/threads';
import { decryptToken, encryptToken } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
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
  connection_method: string | null;
  connected_at: string;
}

/**
 * Checks if the stored token is expired and attempts a refresh if possible.
 * Returns the (possibly refreshed) access token, or null if refresh failed.
 * Only used for OAuth accounts (not BYOK).
 */
async function ensureFreshToken(
  account: SocialAccountRow,
  platform: SocialPlatform,
  client: Awaited<ReturnType<typeof getServerClient>>
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

/**
 * Decrypts BYOK credentials stored as a JSON object of encrypted values.
 * The access_token column for BYOK rows contains JSON.stringify({key: encryptedValue, ...}).
 */
function decryptByokCredentials(encryptedJson: string): Record<string, string> {
  const encrypted: Record<string, string> = JSON.parse(encryptedJson);
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(encrypted)) {
    decrypted[key] = decryptToken(value);
  }
  return decrypted;
}

/**
 * Publish using BYOK credentials.
 * Twitter: OAuth 1.0a with 4 keys.
 * LinkedIn/Instagram/Threads: bearer token.
 */
async function publishWithByok(
  platform: SocialPlatform,
  credentials: Record<string, string>,
  publishContent: string,
  imageUrl?: string
): Promise<{ success: boolean; platformPostId?: string; url?: string; error?: string }> {
  switch (platform) {
    case 'twitter': {
      const { api_key, api_secret, access_token, access_token_secret } = credentials;
      if (!api_key || !api_secret || !access_token || !access_token_secret) {
        return { success: false, error: 'Incomplete Twitter BYOK credentials. All 4 keys are required.' };
      }
      return twitterClient.publishPostWithOAuth1(
        api_key,
        api_secret,
        access_token,
        access_token_secret,
        publishContent
      );
    }
    case 'linkedin': {
      const token = credentials.access_token;
      if (!token) {
        return { success: false, error: 'Missing LinkedIn BYOK access token.' };
      }
      return linkedinClient.publishPost(token, publishContent);
    }
    case 'instagram': {
      const token = credentials.access_token;
      if (!token) {
        return { success: false, error: 'Missing Instagram BYOK access token.' };
      }
      return instagramClient.publishPost(token, publishContent, undefined, imageUrl);
    }
    case 'threads': {
      const token = credentials.access_token;
      if (!token) {
        return { success: false, error: 'Missing Threads BYOK access token.' };
      }
      return threadsClient.publishPost(token, publishContent);
    }
    default:
      return { success: false, error: 'Unsupported platform' };
  }
}

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
    imageUrl: z.string().url().max(2048).optional(),
  });

  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { postId, platform, content, caption, imageUrl } = parsed.data;

  // Instagram requires an image URL for publishing
  if (platform === 'instagram' && !imageUrl) {
    return NextResponse.json(
      { error: 'Instagram requires an image' },
      { status: 400 }
    );
  }

  const client = await getServerClient();
  const publishContent = caption || content;

  // Step 1: Check for OAuth account (connection_method is null or 'oauth')
  const { data: oauthRows } = await client.database
    .from('social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .or('connection_method.is.null,connection_method.eq.oauth');

  const oauthRow = oauthRows && oauthRows.length > 0 ? oauthRows[0] : null;

  // Step 2: If no OAuth account, check for BYOK account
  let byokRow: Record<string, unknown> | null = null;
  if (!oauthRow) {
    const { data: byokRows } = await client.database
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('connection_method', 'byok');

    byokRow = byokRows && byokRows.length > 0 ? byokRows[0] : null;
  }

  // No account of any type found
  if (!oauthRow && !byokRow) {
    return NextResponse.json(
      { error: `No ${platform} account connected. Connect it in Settings or add API keys.` },
      { status: 400 }
    );
  }

  let result: { success: boolean; platformPostId?: string; url?: string; error?: string };

  if (oauthRow) {
    // Publish with OAuth credentials
    const account: SocialAccountRow = {
      id: oauthRow.id as string,
      user_id: oauthRow.user_id as string,
      platform: oauthRow.platform as string,
      account_name: (oauthRow.account_name as string) ?? null,
      account_id: (oauthRow.account_id as string) ?? null,
      access_token: oauthRow.access_token as string,
      refresh_token: (oauthRow.refresh_token as string) ?? null,
      token_expires_at: (oauthRow.token_expires_at as string) ?? null,
      connection_method: (oauthRow.connection_method as string) ?? null,
      connected_at: oauthRow.connected_at as string,
    };

    const freshToken = await ensureFreshToken(account, platform, client);

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
  } else {
    // Publish with BYOK credentials
    try {
      const credentials = decryptByokCredentials(byokRow!.access_token as string);
      result = await publishWithByok(platform, credentials, publishContent, imageUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to decrypt BYOK credentials';
      return NextResponse.json(
        { error: `BYOK credential error: ${message}` },
        { status: 500 }
      );
    }
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
