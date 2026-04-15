interface PublishResult {
  success: boolean;
  platformPostId?: string;
  url?: string;
  error?: string;
}

interface ProfileResult {
  id: string;
  name: string;
  username: string;
}

/**
 * Publish a text-based post to Instagram via the Graph API.
 * Note: Instagram Graph API requires a business/creator account
 * and typically needs a media URL. Text-only posts are not natively
 * supported -- this creates a caption-ready container.
 * For full media posting, pass an imageUrl parameter.
 */
export async function publishPost(
  accessToken: string,
  content: string,
  igUserId?: string,
  imageUrl?: string
): Promise<PublishResult> {
  try {
    if (!igUserId) {
      const profile = await getProfile(accessToken);
      if (!profile) return { success: false, error: 'Could not resolve Instagram profile' };
      igUserId = profile.id;
    }

    if (!imageUrl) {
      return {
        success: false,
        error: 'Instagram requires an image URL for publishing. Text-only posts are not supported.',
      };
    }

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: content,
          access_token: accessToken,
        }),
      }
    );

    if (!createRes.ok) {
      const body = await createRes.text();
      return { success: false, error: `Instagram create error: ${createRes.status} ${body}` };
    }

    const { id: containerId } = await createRes.json();

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const body = await publishRes.text();
      return { success: false, error: `Instagram publish error: ${publishRes.status} ${body}` };
    }

    const { id: mediaId } = await publishRes.json();

    // Instagram post URLs use a shortcode, not the numeric media ID.
    // Fetch permalink via Graph API; fall back to a Graph link if unavailable.
    let url = `https://graph.facebook.com/${mediaId}`;
    try {
      const permalinkUrl = new URL(`https://graph.facebook.com/v19.0/${mediaId}`);
      permalinkUrl.searchParams.set('fields', 'permalink');
      permalinkUrl.searchParams.set('access_token', accessToken);
      const permalinkRes = await fetch(permalinkUrl);
      if (permalinkRes.ok) {
        const data = await permalinkRes.json();
        if (data.permalink) url = data.permalink;
      }
    } catch {
      // keep fallback
    }

    return {
      success: true,
      platformPostId: mediaId,
      url,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Refresh a long-lived Instagram/Facebook token.
 * Long-lived tokens can be refreshed as long as they are at least 24 hours
 * old and not expired.
 */
export async function refreshAccessToken(
  accessToken: string
): Promise<RefreshResult> {
  try {
    const refreshUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    refreshUrl.searchParams.set('grant_type', 'fb_exchange_token');
    refreshUrl.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID ?? '');
    refreshUrl.searchParams.set('client_secret', process.env.INSTAGRAM_APP_SECRET ?? '');
    refreshUrl.searchParams.set('fb_exchange_token', accessToken);
    const res = await fetch(refreshUrl);

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Instagram refresh error: ${res.status} ${body}` };
    }

    const data = await res.json();
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;

    return {
      success: true,
      accessToken: data.access_token,
      expiresAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getProfile(accessToken: string): Promise<ProfileResult | null> {
  try {
    const profileUrl = new URL('https://graph.facebook.com/v19.0/me');
    profileUrl.searchParams.set('fields', 'id,name,username');
    profileUrl.searchParams.set('access_token', accessToken);
    const res = await fetch(profileUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name ?? data.username ?? '',
      username: data.username ?? data.id,
    };
  } catch {
    return null;
  }
}
