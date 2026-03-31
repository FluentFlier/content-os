import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { encryptToken } from '@/lib/crypto';
import { z } from 'zod';

const TwitterCredentials = z.object({
  api_key: z.string().min(1, 'api_key is required'),
  api_secret: z.string().min(1, 'api_secret is required'),
  access_token: z.string().min(1, 'access_token is required'),
  access_token_secret: z.string().min(1, 'access_token_secret is required'),
});

const SingleTokenCredentials = z.object({
  access_token: z.string().min(1, 'access_token is required'),
});

const ByokSchema = z.discriminatedUnion('platform', [
  z.object({ platform: z.literal('twitter'), credentials: TwitterCredentials }),
  z.object({ platform: z.literal('linkedin'), credentials: SingleTokenCredentials }),
  z.object({ platform: z.literal('instagram'), credentials: SingleTokenCredentials }),
  z.object({ platform: z.literal('threads'), credentials: SingleTokenCredentials }),
]);

/**
 * POST /api/social-accounts/byok
 * Store BYOK (Bring Your Own Keys) credentials for a social platform.
 * Encrypts all credential values with AES-256-GCM before storage.
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

  const parsed = ByokSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 },
    );
  }

  const { platform, credentials } = parsed.data;

  // Encrypt each credential value individually
  const encryptedCredentials: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    encryptedCredentials[key] = encryptToken(value);
  }

  const client = getServerClient();
  const { data, error } = await client.database
    .from('social_accounts')
    .upsert(
      {
        user_id: user.id,
        platform,
        account_name: null,
        account_id: null,
        access_token: JSON.stringify(encryptedCredentials),
        refresh_token: null,
        token_expires_at: null,
        connection_method: 'byok',
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' },
    )
    .select('id, platform, connection_method, connected_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data }, { status: 201 });
}
