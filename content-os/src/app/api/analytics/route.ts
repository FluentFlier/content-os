import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getServerClient();

  // Fetch last 30 posts for the user
  const { data: posts, error: postsError } = await client
    .database.from('posts')
    .select('id, pillar, status, platform, views, saves, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 });

  // Aggregate views and saves by pillar
  const byPillar: Record<string, { views: number; saves: number; count: number }> = {};
  for (const post of posts ?? []) {
    const pillar = post.pillar ?? 'uncategorized';
    if (!byPillar[pillar]) byPillar[pillar] = { views: 0, saves: 0, count: 0 };
    byPillar[pillar].views += post.views ?? 0;
    byPillar[pillar].saves += post.saves ?? 0;
    byPillar[pillar].count += 1;
  }

  const totalViews = (posts ?? []).reduce((sum: number, p: { views?: number }) => sum + (p.views ?? 0), 0);
  const totalSaves = (posts ?? []).reduce((sum: number, p: { saves?: number }) => sum + (p.saves ?? 0), 0);

  return NextResponse.json({
    totalViews,
    totalSaves,
    postCount: (posts ?? []).length,
    byPillar,
    recentPosts: posts ?? [],
  });
}
