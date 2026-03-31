import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { encryptToken } from '@/lib/crypto';
import { z } from 'zod';

// GET: list connected social accounts for the current user
export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();
  const { data, error } = await client.database
    .from('social_accounts')
    .select('id, platform, account_name, account_id, connected_at, token_expires_at, connection_method')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data ?? [] });
}

// POST: save a new social account connection
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ConnectionSchema = z.object({
    platform: z.enum(['instagram', 'linkedin', 'twitter', 'threads']),
    account_name: z.string().nullish(),
    account_id: z.string().nullish(),
    access_token: z.string().min(1),
    refresh_token: z.string().nullish(),
    token_expires_at: z.string().nullish(),
  });

  const parsed = ConnectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { platform, account_name, account_id, access_token, refresh_token, token_expires_at } = parsed.data;

  const client = getServerClient();
  const { data, error } = await client.database
    .from('social_accounts')
    .upsert(
      {
        user_id: user.id,
        platform,
        account_name: account_name ?? null,
        account_id: account_id ?? null,
        access_token: encryptToken(access_token),
        refresh_token: refresh_token ? encryptToken(refresh_token) : null,
        token_expires_at: token_expires_at ?? null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    )
    .select('id, platform, account_name, account_id, connected_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data }, { status: 201 });
}
