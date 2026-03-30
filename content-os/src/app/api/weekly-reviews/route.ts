import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();
  let query = client
    .database.from('weekly_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false });

  const weekStart = request.nextUrl.searchParams.get('week_start');
  if (weekStart) query = query.eq('week_start', weekStart);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const client = getServerClient();
  const { data, error } = await client
    .database.from('weekly_reviews')
    .insert({ ...body as Record<string, unknown>, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
