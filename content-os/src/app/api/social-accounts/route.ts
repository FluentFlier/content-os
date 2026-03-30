import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

// GET: list connected social accounts for the current user
export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();
  const { data, error } = await client.database
    .from('social_accounts')
    .select('id, platform, account_name, account_id, connected_at, token_expires_at')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data ?? [] });
}

// POST: save a new social account connection
export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { platform, account_name, account_id, access_token, refresh_token, token_expires_at } = body;

  if (!platform || !access_token) {
    return NextResponse.json({ error: 'Missing platform or access_token' }, { status: 400 });
  }

  const validPlatforms = ['instagram', 'linkedin', 'twitter', 'threads'];
  if (!validPlatforms.includes(platform as string)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const client = getServerClient();
  const { data, error } = await client.database
    .from('social_accounts')
    .upsert(
      {
        user_id: user.id,
        platform,
        account_name: account_name ?? null,
        account_id: account_id ?? null,
        access_token,
        refresh_token: refresh_token ?? null,
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
