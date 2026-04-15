import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('hashtag_sets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hashtagSets: data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const HashtagSetSchema = z.object({
    name: z.string().min(1).max(200),
    tags: z.string().min(1).max(5000),
    pillar: z.string().max(200).optional().nullable(),
    use_count: z.number().int().min(0).optional(),
  });

  const parsed = HashtagSetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('hashtag_sets')
    .insert({
      ...parsed.data,
      use_count: parsed.data.use_count ?? 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hashtagSet: data }, { status: 201 });
}
