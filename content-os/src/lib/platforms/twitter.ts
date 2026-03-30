import { TwitterApi } from 'twitter-api-v2';

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

export async function publishPost(
  accessToken: string,
  content: string
): Promise<PublishResult> {
  try {
    const client = new TwitterApi(accessToken);
    const tweet = await client.v2.tweet(content);

    return {
      success: true,
      platformPostId: tweet.data.id,
      url: `https://x.com/i/status/${tweet.data.id}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getProfile(accessToken: string): Promise<ProfileResult | null> {
  try {
    const client = new TwitterApi(accessToken);
    const me = await client.v2.me();
    return {
      id: me.data.id,
      name: me.data.name,
      username: me.data.username,
    };
  } catch {
    return null;
  }
}
