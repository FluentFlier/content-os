import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });

  const client = getServerClient();
  const { data, error } = await client
    .database.from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('key', key)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ setting: data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { key, value } = body as { key?: string; value?: unknown };
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

  const client = getServerClient();
  const { data, error } = await client
    .database.from('user_settings')
    .upsert(
      { user_id: user.id, key, value },
      { onConflict: 'user_id,key' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setting: data });
}
