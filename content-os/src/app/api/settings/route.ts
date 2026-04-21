import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const key = request.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('key', key)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setting: data ?? null });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const SettingSchema = z.object({
    key: z.string().min(1).max(255),
    value: z.unknown(),
  });

  const parsed = SettingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { key, value } = parsed.data;
  // user_settings.value is a text column; serialize objects/arrays so
  // the DB doesn't reject them.
  const serializedValue =
    typeof value === 'string' ? value : JSON.stringify(value ?? null);

  // Cap at 100KB. Without this, a client could stash arbitrarily large
  // blobs in a user_settings row, inflating the row and every query
  // that joins against it.
  if (serializedValue.length > 100_000) {
    return NextResponse.json({ error: 'Value too large (max 100KB)' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('user_settings')
    .upsert(
      {
        user_id: user.id,
        key,
        value: serializedValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setting: data });
}
