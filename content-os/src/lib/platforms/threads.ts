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
 * Publish a text post to Threads via the Threads Publishing API.
 * Threads uses a two-step flow similar to Instagram Graph API.
 */
export async function publishPost(
  accessToken: string,
  content: string,
  threadsUserId?: string
): Promise<PublishResult> {
  try {
    if (!threadsUserId) {
      const profile = await getProfile(accessToken);
      if (!profile) return { success: false, error: 'Could not resolve Threads profile' };
      threadsUserId = profile.id;
    }

    // Step 1: Create a media container
    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: content,
          access_token: accessToken,
        }),
      }
    );

    if (!createRes.ok) {
      const body = await createRes.text();
      return { success: false, error: `Threads create error: ${createRes.status} ${body}` };
    }

    const { id: containerId } = await createRes.json();

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
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
      return { success: false, error: `Threads publish error: ${publishRes.status} ${body}` };
    }

    const { id: postId } = await publishRes.json();

    // The raw post ID isn't a valid URL slug; fetch the permalink.
    let url = `https://graph.threads.net/${postId}`;
    try {
      const permalinkRes = await fetch(
        `https://graph.threads.net/v1.0/${postId}?fields=permalink&access_token=${accessToken}`
      );
      if (permalinkRes.ok) {
        const data = await permalinkRes.json();
        if (data.permalink) url = data.permalink;
      }
    } catch {
      // keep fallback
    }

    return {
      success: true,
      platformPostId: postId,
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
 * Refresh a long-lived Threads access token.
 * Valid tokens that are at least 24 hours old and not expired
 * can be refreshed for a new 60-day token.
 */
export async function refreshAccessToken(
  accessToken: string
): Promise<RefreshResult> {
  try {
    const res = await fetch(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${accessToken}`
    );

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Threads refresh error: ${res.status} ${body}` };
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
    const res = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${accessToken}`
    );
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
