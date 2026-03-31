import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { encryptToken } from '@/lib/crypto';

// GET: Handle Threads OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!appId || !appSecret) {
    return redirectWithError('Threads API credentials not configured');
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return redirectWithError(`Threads auth denied: ${error}`);
  if (!code || !state) return redirectWithError('Missing code or state');

  // Validate state against cookie (CSRF protection)
  const storedState = request.cookies.get('threads_oauth_state')?.value;
  if (state !== storedState) return redirectWithError('Invalid OAuth state. Try connecting again.');

  // Authenticate user
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirectWithError('Not authenticated. Please log in first.');
  }

  const callbackUrl = `${appUrl}/api/social-accounts/callback/threads`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code,
      }),
    });

    if (!tokenRes.ok) return redirectWithError('Failed to exchange Threads code');
    const { access_token } = await tokenRes.json();

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${access_token}`
    );
    const longData = longRes.ok ? await longRes.json() : { access_token };
    const longToken = longData.access_token ?? access_token;
    const expiresIn = longData.expires_in;

    // Get profile
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${longToken}`
    );
    const profile = profileRes.ok ? await profileRes.json() : null;

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Store tokens directly via database (no self-fetch)
    const db = getServerClient().database;
    const { error: dbError } = await db
      .from('social_accounts')
      .upsert(
        {
          user_id: user.id,
          platform: 'threads',
          account_name: profile?.username ? `@${profile.username}` : 'Threads',
          account_id: profile?.id ?? null,
          access_token: encryptToken(longToken),
          refresh_token: null,
          token_expires_at: expiresAt,
          connection_method: 'oauth',
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      );

    if (dbError) {
      console.error('[Threads Callback] DB error:', dbError.message);
      return redirectWithError('Failed to save Threads connection');
    }

    // Redirect to settings and clear OAuth cookies
    const response = NextResponse.redirect(`${appUrl}/settings?connected=threads`);
    response.cookies.set('threads_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[Threads Callback]', err);
    return redirectWithError('Failed to complete Threads connection');
  }
}

function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(
    `${appUrl}/settings?error=${encodeURIComponent(message)}`
  );
}
