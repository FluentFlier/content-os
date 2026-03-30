import { NextResponse } from 'next/server';

// GET: Redirect to Instagram/Facebook OAuth
export async function GET(): Promise<NextResponse> {
  const appId = process.env.INSTAGRAM_APP_ID;

  if (!appId) {
    return NextResponse.json(
      { error: 'Instagram API credentials not configured' },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/social-accounts/callback/instagram`;
  const state = crypto.randomUUID();

  const scopes = ['instagram_basic', 'instagram_content_publish', 'pages_show_list'].join(',');
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('instagram_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
