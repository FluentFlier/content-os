import { TwitterApi } from "twitter-api-v2";

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export function createTwitterClient(config: TwitterConfig) {
  return new TwitterApi({
    appKey: config.apiKey,
    appSecret: config.apiSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessSecret,
  });
}

export async function postTweet(
  config: TwitterConfig,
  text: string
): Promise<{ id: string; text: string }> {
  const client = createTwitterClient(config);
  const { data } = await client.v2.tweet(text);
  return { id: data.id, text: data.text };
}

export async function postThread(
  config: TwitterConfig,
  tweets: string[]
): Promise<{ ids: string[] }> {
  const client = createTwitterClient(config);
  const { data: first } = await client.v2.tweet(tweets[0]);
  const ids = [first.id];

  let lastId = first.id;
  for (let i = 1; i < tweets.length; i++) {
    const { data } = await client.v2.tweet(tweets[i], {
      reply: { in_reply_to_tweet_id: lastId },
    });
    ids.push(data.id);
    lastId = data.id;
  }

  return { ids };
}

export async function deleteTweet(
  config: TwitterConfig,
  tweetId: string
): Promise<void> {
  const client = createTwitterClient(config);
  await client.v2.deleteTweet(tweetId);
}
