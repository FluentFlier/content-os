import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import * as twitterClient from '@/lib/platforms/twitter';
import * as linkedinClient from '@/lib/platforms/linkedin';
import * as instagramClient from '@/lib/platforms/instagram';
import * as threadsClient from '@/lib/platforms/threads';
import { decryptToken, encryptToken } from '@/lib/crypto';

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
 * Creates a service-level InsForge client (no user cookies required).
 * Used by cron jobs that need to query across all users.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing InsForge env vars');
  }
  return createClient({ baseUrl: url, anonKey, isServerMode: true });
}

/**
 * Checks token expiry and refreshes if needed (same logic as publish route).
 */
async function ensureFreshToken(
  account: SocialAccountRow,
  platform: SocialPlatform,
  client: ReturnType<typeof createClient>
): Promise<string> {
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;

  if (!expiresAt || expiresAt > now) {
    return decryptToken(account.access_token);
  }

  const decryptedAccess = decryptToken(account.access_token);
  const decryptedRefresh = account.refresh_token ? decryptToken(account.refresh_token) : null;
  let refreshed: { success: boolean; accessToken?: string; refreshToken?: string; expiresAt?: string } | null = null;

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
      break;
  }

  if (refreshed?.success && refreshed.accessToken) {
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

  return decryptedAccess;
}

/**
 * Decrypts BYOK credentials stored as encrypted JSON.
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
 * Publish a single post to its target platform using available credentials.
 */
async function publishPost(
  post: Record<string, unknown>,
  client: ReturnType<typeof createClient>
): Promise<{ postId: string; success: boolean; error?: string; platformPostId?: string; url?: string }> {
  const postId = post.id as string;
  const userId = post.user_id as string;
  const platform = post.platform as SocialPlatform;
  const content = (post.caption as string) || (post.script as string) || (post.hook as string) || (post.title as string);

  if (!content) {
    return { postId, success: false, error: 'No publishable content' };
  }

  // Find OAuth account first
  const { data: oauthRows } = await client.database
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .or('connection_method.is.null,connection_method.eq.oauth');

  const oauthRow = oauthRows && oauthRows.length > 0 ? oauthRows[0] : null;

  // Fall back to BYOK account
  let byokRow: Record<string, unknown> | null = null;
  if (!oauthRow) {
    const { data: byokRows } = await client.database
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connection_method', 'byok');

    byokRow = byokRows && byokRows.length > 0 ? byokRows[0] : null;
  }

  if (!oauthRow && !byokRow) {
    return { postId, success: false, error: `No ${platform} account for user` };
  }

  let result: { success: boolean; platformPostId?: string; url?: string; error?: string };

  if (oauthRow) {
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
        result = await twitterClient.publishPost(freshToken, content);
        break;
      case 'linkedin':
        result = await linkedinClient.publishPost(freshToken, content, account.account_id ?? undefined);
        break;
      case 'instagram':
        result = await instagramClient.publishPost(freshToken, content, account.account_id ?? undefined);
        break;
      case 'threads':
        result = await threadsClient.publishPost(freshToken, content, account.account_id ?? undefined);
        break;
      default:
        return { postId, success: false, error: 'Unsupported platform' };
    }
  } else {
    try {
      const credentials = decryptByokCredentials(byokRow!.access_token as string);

      switch (platform) {
        case 'twitter': {
          const { api_key, api_secret, access_token, access_token_secret } = credentials;
          if (!api_key || !api_secret || !access_token || !access_token_secret) {
            return { postId, success: false, error: 'Incomplete Twitter BYOK credentials' };
          }
          result = await twitterClient.publishPostWithOAuth1(api_key, api_secret, access_token, access_token_secret, content);
          break;
        }
        case 'linkedin': {
          const token = credentials.access_token;
          if (!token) return { postId, success: false, error: 'Missing LinkedIn BYOK token' };
          result = await linkedinClient.publishPost(token, content);
          break;
        }
        case 'instagram': {
          const token = credentials.access_token;
          if (!token) return { postId, success: false, error: 'Missing Instagram BYOK token' };
          result = await instagramClient.publishPost(token, content);
          break;
        }
        case 'threads': {
          const token = credentials.access_token;
          if (!token) return { postId, success: false, error: 'Missing Threads BYOK token' };
          result = await threadsClient.publishPost(token, content);
          break;
        }
        default:
          return { postId, success: false, error: 'Unsupported platform' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'BYOK credential error';
      return { postId, success: false, error: message };
    }
  }

  if (!result.success) {
    return { postId, success: false, error: result.error, platformPostId: result.platformPostId, url: result.url };
  }

  // Update post status to 'posted'
  await client.database
    .from('posts')
    .update({
      status: 'posted',
      posted_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('user_id', userId);

  return { postId, success: true, platformPostId: result.platformPostId, url: result.url };
}

/**
 * GET /api/cron/publish
 *
 * Cron endpoint for scheduled publishing. Runs every 5 minutes via Vercel Cron.
 * Queries posts where scheduled_publish_at <= now() AND status != 'posted',
 * then publishes each to its target platform.
 *
 * Protected by CRON_SECRET env var - rejects requests without valid secret.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validate CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = getServiceClient();

    // Query posts due for publishing. Skip 'posted' and 'publishing' to
    // avoid double-publishing when a cron run overlaps with the previous one.
    const now = new Date().toISOString();
    const { data: duePosts, error } = await client.database
      .from('posts')
      .select('*')
      .lte('scheduled_publish_at', now)
      .not('status', 'in', '("posted","publishing")');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ processed: 0, results: [] });
    }

    // Publish each post. Claim it by flipping to 'publishing' before calling
    // the platform so a concurrent cron run skips it.
    const results = [];
    for (const post of duePosts) {
      const postId = post.id as string;
      const userId = post.user_id as string;
      const prevStatus = (post.status as string) ?? 'scheduled';

      // Atomic claim: only flip to 'publishing' if the row is still in its
      // prior status. If a concurrent cron run already claimed it, the
      // filter matches no rows and we skip. Without the status filter,
      // two overlapping runs would both publish the same post.
      const { data: claimed } = await client.database
        .from('posts')
        .update({ status: 'publishing', updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', userId)
        .eq('status', prevStatus)
        .select('id');

      if (!claimed || claimed.length === 0) {
        results.push({ postId, success: false, error: 'Claimed by another run' });
        continue;
      }

      const result = await publishPost(post, client);
      results.push(result);

      // On failure, restore prior status so the next cron run can retry.
      if (!result.success) {
        await client.database
          .from('posts')
          .update({ status: prevStatus, updated_at: new Date().toISOString() })
          .eq('id', postId)
          .eq('user_id', userId);
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      processed: duePosts.length,
      succeeded: successCount,
      failed: duePosts.length - successCount,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
