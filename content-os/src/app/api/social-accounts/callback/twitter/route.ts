import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// GET: Handle Twitter OAuth 2.0 callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError('Twitter API credentials not configured');
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return redirectWithError(`Twitter auth denied: ${error}`);
  }

  if (!code || !state) {
    return redirectWithError('Missing code or state from Twitter');
  }

  const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;
  const storedState = request.cookies.get('twitter_oauth_state')?.value;

  if (!codeVerifier || state !== storedState) {
    return redirectWithError('Invalid OAuth state. Try connecting again.');
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/social-accounts/callback/twitter`;

  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl,
    });

    // Get user profile
    const loggedClient = new TwitterApi(accessToken);
    const me = await loggedClient.v2.me();

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Save the account via our own API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const dispatchToken = request.cookies.get('dispatch-token')?.value;

    await fetch(`${appUrl}/api/social-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dispatch-token=${dispatchToken}`,
      },
      body: JSON.stringify({
        platform: 'twitter',
        account_name: `@${me.data.username}`,
        account_id: me.data.id,
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        token_expires_at: expiresAt,
      }),
    });

    // Redirect back to settings with success
    const response = NextResponse.redirect(`${appUrl}/settings?connected=twitter`);
    // Clear OAuth cookies
    response.cookies.set('twitter_code_verifier', '', { maxAge: 0, path: '/' });
    response.cookies.set('twitter_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[Twitter Callback]', err);
    return redirectWithError('Failed to complete Twitter connection');
  }
}

function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(
    `${appUrl}/settings?error=${encodeURIComponent(message)}`
  );
}
