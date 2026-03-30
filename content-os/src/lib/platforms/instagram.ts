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

    return {
      success: true,
      platformPostId: mediaId,
      url: `https://www.instagram.com/p/${mediaId}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getProfile(accessToken: string): Promise<ProfileResult | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,username&access_token=${accessToken}`
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
