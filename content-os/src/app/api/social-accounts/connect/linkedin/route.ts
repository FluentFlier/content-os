import { NextResponse } from 'next/server';

// GET: Redirect to LinkedIn OAuth 2.0 authorization
export async function GET(): Promise<NextResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'LinkedIn API credentials not configured' },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/social-accounts/callback/linkedin`;
  const state = crypto.randomUUID();

  const scopes = ['openid', 'profile', 'w_member_social'].join(' ');
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
