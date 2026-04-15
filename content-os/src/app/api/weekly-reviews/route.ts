import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
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

  const ReviewSchema = z.object({
    week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    posts_published: z.number().int().min(0).optional(),
    total_views: z.number().int().min(0).optional(),
    total_followers_gained: z.number().int().min(0).optional(),
    top_post_id: z.string().uuid().nullable().optional(),
    what_worked: z.string().max(5000).nullable().optional(),
    what_to_double_down: z.string().max(5000).nullable().optional(),
    what_to_cut: z.string().max(5000).nullable().optional(),
    next_week_focus: z.string().max(5000).nullable().optional(),
  });

  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('weekly_reviews')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
