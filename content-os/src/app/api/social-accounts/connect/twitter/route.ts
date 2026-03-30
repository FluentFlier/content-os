import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// GET: Redirect to Twitter OAuth 2.0 authorization with PKCE
export async function GET(): Promise<NextResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Twitter API credentials not configured' },
      { status: 500 }
    );
  }

  const client = new TwitterApi({ clientId, clientSecret });
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/social-accounts/callback/twitter`;

  // Use crypto.randomUUID for CSRF-safe state
  const state = crypto.randomUUID();

  const { url, codeVerifier } = client.generateOAuth2AuthLink(callbackUrl, {
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    state,
  });

  // Store code verifier and state in httpOnly cookies for the callback
  const response = NextResponse.redirect(url);
  response.cookies.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  response.cookies.set('twitter_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
