import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/insforge/server';
import { TwitterApi } from 'twitter-api-v2';
import { z } from 'zod';
import * as linkedin from '@/lib/platforms/linkedin';
import * as instagram from '@/lib/platforms/instagram';
import * as threads from '@/lib/platforms/threads';

const TwitterCredentials = z.object({
  api_key: z.string().min(1, 'api_key is required'),
  api_secret: z.string().min(1, 'api_secret is required'),
  access_token: z.string().min(1, 'access_token is required'),
  access_token_secret: z.string().min(1, 'access_token_secret is required'),
});

const SingleTokenCredentials = z.object({
  access_token: z.string().min(1, 'access_token is required'),
});

const TestSchema = z.discriminatedUnion('platform', [
  z.object({ platform: z.literal('twitter'), credentials: TwitterCredentials }),
  z.object({ platform: z.literal('linkedin'), credentials: SingleTokenCredentials }),
  z.object({ platform: z.literal('instagram'), credentials: SingleTokenCredentials }),
  z.object({ platform: z.literal('threads'), credentials: SingleTokenCredentials }),
]);

interface TestResult {
  valid: boolean;
  profile?: { name: string; username: string };
  error?: string;
}

async function testTwitter(credentials: z.infer<typeof TwitterCredentials>): Promise<TestResult> {
  try {
    const client = new TwitterApi({
      appKey: credentials.api_key,
      appSecret: credentials.api_secret,
      accessToken: credentials.access_token,
      accessSecret: credentials.access_token_secret,
    });
    const me = await client.v2.me();
    return {
      valid: true,
      profile: { name: me.data.name, username: me.data.username },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid Twitter credentials';
    return { valid: false, error: message };
  }
}

async function testLinkedin(credentials: z.infer<typeof SingleTokenCredentials>): Promise<TestResult> {
  try {
    const profile = await linkedin.getProfile(credentials.access_token);
    if (!profile) return { valid: false, error: 'Invalid LinkedIn credentials' };
    return {
      valid: true,
      profile: { name: profile.name, username: profile.username },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid LinkedIn credentials';
    return { valid: false, error: message };
  }
}

async function testInstagram(credentials: z.infer<typeof SingleTokenCredentials>): Promise<TestResult> {
  try {
    const profile = await instagram.getProfile(credentials.access_token);
    if (!profile) return { valid: false, error: 'Invalid Instagram credentials' };
    return {
      valid: true,
      profile: { name: profile.name, username: profile.username },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid Instagram credentials';
    return { valid: false, error: message };
  }
}

async function testThreads(credentials: z.infer<typeof SingleTokenCredentials>): Promise<TestResult> {
  try {
    const profile = await threads.getProfile(credentials.access_token);
    if (!profile) return { valid: false, error: 'Invalid Threads credentials' };
    return {
      valid: true,
      profile: { name: profile.name, username: profile.username },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid Threads credentials';
    return { valid: false, error: message };
  }
}

/**
 * POST /api/social-accounts/test
 * Validate credentials against platform APIs WITHOUT storing anything.
 * Returns {valid:true, profile:{name,username}} or {valid:false, error:'...'}.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = TestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const { platform, credentials } = parsed.data;

  let result: TestResult;
  switch (platform) {
    case 'twitter':
      result = await testTwitter(credentials);
      break;
    case 'linkedin':
      result = await testLinkedin(credentials);
      break;
    case 'instagram':
      result = await testInstagram(credentials);
      break;
    case 'threads':
      result = await testThreads(credentials);
      break;
  }

  return NextResponse.json(result);
}
