import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/insforge/server';

// GET: Redirect to Threads OAuth
export async function GET(): Promise<NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appId = process.env.THREADS_APP_ID;

  if (!appId) {
    return NextResponse.json(
      { error: 'Threads API credentials not configured' },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/social-accounts/callback/threads`;
  const state = crypto.randomUUID();

  const scopes = ['threads_basic', 'threads_content_publish'].join(',');
  const authUrl = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('threads_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
