import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('story_bank')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stories: data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Field list mirrors PATCH so every column on story_bank is reachable
  // from the create path. Without this, clients had to POST then PATCH
  // just to set title/body/category/tags/source on a new story.
  const StorySchema = z.object({
    title: z.string().min(1).max(500).optional(),
    body: z.string().max(10000).optional(),
    category: z.string().max(200).optional(),
    tags: z.array(z.string().max(100)).max(20).optional(),
    source: z.string().max(500).optional(),
    raw_memory: z.string().min(1).max(10000),
    mined_angle: z.string().max(2000).optional().nullable(),
    mined_hook: z.string().max(2000).optional().nullable(),
    mined_script: z.string().max(10000).optional().nullable(),
    mined_caption_line: z.string().max(2000).optional().nullable(),
    pillar: z.string().max(200).optional().nullable(),
    used: z.boolean().optional(),
  });

  const parsed = StorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('story_bank')
    .insert({
      ...parsed.data,
      used: parsed.data.used ?? false,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ story: data }, { status: 201 });
}
