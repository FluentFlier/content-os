import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';
import { triggerAutoOptimize } from '@/lib/auto-optimize';

type RouteContext = { params: Promise<{ id: string }> };

const UpdatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  pillar: z.string().max(200).optional(),
  platform: z.string().max(100).optional(),
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
  scheduled_publish_at: z.string().max(50).nullable().optional(),
  image_url: z.string().max(2048).nullable().optional(),
  // Accepted but ignored - server rewrites updated_at itself. Callers
  // across the dashboard (library bulk status, calendar drag, editor
  // drawer, performance modal) all send it, so rejecting under .strict()
  // was breaking those PATCHes with a 400.
  updated_at: z.string().max(50).optional(),
}).strict();

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { id } = await params;

  const client = await getServerClient();

  // Fetch existing post to compare content for auto-optimize. maybeSingle
  // returns null for a missing row instead of surfacing a PostgREST error.
  const { data: existingPost } = await client
    .database.from('posts')
    .select('script, caption')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingPost) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await client
    .database.from('posts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Trigger auto-optimize only if script or caption actually changed
  const scriptChanged =
    parsed.data.script !== undefined &&
    parsed.data.script !== (existingPost?.script ?? null);
  const captionChanged =
    parsed.data.caption !== undefined &&
    parsed.data.caption !== (existingPost?.caption ?? null);
  const hasContentChange = scriptChanged || captionChanged;

  if (hasContentChange && data) {
    const content = parsed.data.script || parsed.data.caption;
    if (content && data.platform) {
      const origin = request.nextUrl.origin;
      const cookieHeader = request.headers.get('cookie') ?? '';
      // Fire-and-forget: do not await
      triggerAutoOptimize({
        userId: user.id,
        postId: id,
        content,
        sourcePlatform: data.platform,
        requestCookies: cookieHeader,
        origin,
      }).catch((err) => {
        console.error('[posts] Auto-optimize trigger error:', err);
      });
    }
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const client = await getServerClient();
  const { error } = await client
    .database.from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
