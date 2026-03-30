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

    return {
      success: true,
      platformPostId: postId,
      url: `https://www.threads.net/post/${postId}`,
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
