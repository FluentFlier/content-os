import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';
import { triggerAutoOptimize } from '@/lib/auto-optimize';

const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  pillar: z.string().min(1, 'Pillar is required').max(200),
  platform: z.string().min(1, 'Platform is required').max(100),
  status: z.string().max(50).optional(),
  script: z.string().max(25000).nullable().optional(),
  caption: z.string().max(25000).nullable().optional(),
  hashtags: z.string().max(5000).nullable().optional(),
  hook: z.string().max(2000).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  scheduled_date: z.string().max(50).nullable().optional(),
  posted_date: z.string().max(50).nullable().optional(),
  series_id: z.string().max(200).nullable().optional(),
  series_position: z.number().nullable().optional(),
  views: z.number().nullable().optional(),
  likes: z.number().nullable().optional(),
  saves: z.number().nullable().optional(),
  comments: z.number().nullable().optional(),
  shares: z.number().nullable().optional(),
  follows_gained: z.number().nullable().optional(),
  variant_group_id: z.string().uuid().nullable().optional(),
  source_platform: z.string().max(100).nullable().optional(),
  image_url: z.string().max(2000).nullable().optional(),
}).strict();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
  const params = request.nextUrl.searchParams;

  let query = client
    .database.from('posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const pillar = params.get('pillar');
  if (pillar) query = query.eq('pillar', pillar);

  const status = params.get('status');
  if (status) query = query.eq('status', status);

  const platform = params.get('platform');
  if (platform) query = query.eq('platform', platform);

  const seriesId = params.get('series_id');
  if (seriesId) query = query.eq('series_id', seriesId);

  // Pagination: coerce NaN/negative/zero into sane defaults so .range()
  // never receives invalid bounds (NaN or negative numbers).
  const rawPage = parseInt(params.get('page') ?? '1', 10);
  const rawLimit = parseInt(params.get('limit') ?? '50', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data, page, limit, total: count ?? data?.length ?? 0 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('posts')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Trigger auto-optimize in background if content is present
  const content = parsed.data.script || parsed.data.caption;
  if (content && data?.id) {
    const origin = request.nextUrl.origin;
    const cookieHeader = request.headers.get('cookie') ?? '';
    // Fire-and-forget: do not await
    triggerAutoOptimize({
      userId: user.id,
      postId: data.id,
      content,
      sourcePlatform: parsed.data.platform,
      requestCookies: cookieHeader,
      origin,
    }).catch((err) => {
      console.error('[posts] Auto-optimize trigger error:', err);
    });
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
