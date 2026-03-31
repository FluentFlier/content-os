import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';
import { triggerAutoOptimize } from '@/lib/auto-optimize';

const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  pillar: z.string().optional(),
  platform: z.string().optional(),
  status: z.string().optional(),
  script: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  hashtags: z.string().nullable().optional(),
  hook: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  posted_date: z.string().nullable().optional(),
  series_id: z.string().nullable().optional(),
  series_position: z.number().nullable().optional(),
  views: z.number().nullable().optional(),
  likes: z.number().nullable().optional(),
  saves: z.number().nullable().optional(),
  comments: z.number().nullable().optional(),
  shares: z.number().nullable().optional(),
  follows_gained: z.number().nullable().optional(),
  variant_group_id: z.string().uuid().nullable().optional(),
  source_platform: z.string().nullable().optional(),
  updated_at: z.string().optional(),
}).strict();

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();
  const { data, error } = await client
    .database.from('posts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = getServerClient();
  const { data, error } = await client
    .database.from('posts')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Trigger auto-optimize in background if script or caption changed
  const hasContentChange =
    parsed.data.script !== undefined || parsed.data.caption !== undefined;

  if (hasContentChange && data) {
    const content = parsed.data.script || parsed.data.caption;
    if (content && data.platform) {
      const origin = request.nextUrl.origin;
      const cookieHeader = request.headers.get('cookie') ?? '';
      // Fire-and-forget: do not await
      triggerAutoOptimize({
        userId: user.id,
        postId: params.id,
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
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();
  const { error } = await client
    .database.from('posts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
