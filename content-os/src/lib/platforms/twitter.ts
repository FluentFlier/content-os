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

function splitIntoThread(content: string): string[] {
  // If content has explicit thread delimiters, use those
  if (content.includes('---TWEET---')) {
    return content.split('---TWEET---').map((t) => t.trim()).filter(Boolean);
  }
  // If under 280 chars, single tweet
  if (content.length <= 280) return [content];
  // Split by double newline first, then by sentence if needed
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  const tweets: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && (current + '\n\n' + p).length > 280) {
      tweets.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current.trim()) tweets.push(current.trim());
  // If any single chunk is still >280, split by sentences
  const final: string[] = [];
  for (const chunk of tweets) {
    if (chunk.length <= 280) {
      final.push(chunk);
    } else {
      const sentences = chunk.match(/[^.!?]+[.!?]+\s*/g) || [chunk];
      let part = '';
      for (const s of sentences) {
        if (part && (part + s).length > 280) {
          final.push(part.trim());
          part = s;
        } else {
          part += s;
        }
      }
      if (part.trim()) final.push(part.trim());
    }
  }
  return final.length > 0 ? final.slice(0, 25) : [content.slice(0, 280)];
}

export async function publishPost(
  accessToken: string,
  content: string
): Promise<PublishResult> {
  try {
    const client = new TwitterApi(accessToken);
    const parts = splitIntoThread(content);

    if (parts.length === 1) {
      const tweet = await client.v2.tweet(parts[0]);
      return {
        success: true,
        platformPostId: tweet.data.id,
        url: `https://x.com/i/status/${tweet.data.id}`,
      };
    }

    // Post as thread
    let lastId: string | undefined;
    let firstId: string | undefined;
    let postedCount = 0;
    try {
      for (const part of parts) {
        const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text: part };
        if (lastId) payload.reply = { in_reply_to_tweet_id: lastId };
        const tweet = await client.v2.tweet(payload);
        if (!firstId) firstId = tweet.data.id;
        lastId = tweet.data.id;
        postedCount++;
      }
    } catch (threadErr) {
      const message = threadErr instanceof Error ? threadErr.message : 'Thread publish failed';
      if (firstId) {
        return {
          success: false,
          platformPostId: firstId,
          url: `https://x.com/i/status/${firstId}`,
          error: `Posted ${postedCount}/${parts.length} tweets before failing: ${message}`,
        };
      }
      return { success: false, error: message };
    }

    return {
      success: true,
      platformPostId: firstId,
      url: `https://x.com/i/status/${firstId}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Publish a tweet using OAuth 1.0a (4-key auth) for BYOK credentials.
 * Uses appKey, appSecret, accessToken, and accessSecret for user-context auth.
 */
export async function publishPostWithOAuth1(
  appKey: string,
  appSecret: string,
  accessToken: string,
  accessSecret: string,
  content: string
): Promise<PublishResult> {
  try {
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });
    const parts = splitIntoThread(content);

    if (parts.length === 1) {
      const tweet = await client.v2.tweet(parts[0]);
      return {
        success: true,
        platformPostId: tweet.data.id,
        url: `https://x.com/i/status/${tweet.data.id}`,
      };
    }

    let lastId: string | undefined;
    let firstId: string | undefined;
    let postedCount = 0;
    try {
      for (const part of parts) {
        const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text: part };
        if (lastId) payload.reply = { in_reply_to_tweet_id: lastId };
        const tweet = await client.v2.tweet(payload);
        if (!firstId) firstId = tweet.data.id;
        lastId = tweet.data.id;
        postedCount++;
      }
    } catch (threadErr) {
      const message = threadErr instanceof Error ? threadErr.message : 'Thread publish failed';
      if (firstId) {
        return {
          success: false,
          platformPostId: firstId,
          url: `https://x.com/i/status/${firstId}`,
          error: `Posted ${postedCount}/${parts.length} tweets before failing: ${message}`,
        };
      }
      return { success: false, error: message };
    }

    return {
      success: true,
      platformPostId: firstId,
      url: `https://x.com/i/status/${firstId}`,
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
