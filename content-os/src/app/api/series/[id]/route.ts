import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('series')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ series: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const SeriesUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    pillar: z.string().min(1).max(200).optional(),
    total_parts: z.number().int().min(1).max(500).optional(),
  });

  const parsed = SeriesUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { id } = await params;

  const client = await getServerClient();
  const { data, error } = await client
    .database.from('series')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ series: data });
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
    .database.from('series')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
