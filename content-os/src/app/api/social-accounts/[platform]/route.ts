import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

// DELETE: disconnect a social account
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { platform: string } }
): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform } = params;
  const validPlatforms = ['instagram', 'linkedin', 'twitter', 'threads'];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const client = getServerClient();
  const { error } = await client.database
    .from('social_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
