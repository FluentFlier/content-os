import { NextRequest, NextResponse } from 'next/server';

// GET: Handle LinkedIn OAuth 2.0 callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    return redirectWithError('LinkedIn API credentials not configured');
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return redirectWithError(`LinkedIn auth denied: ${error}`);
  if (!code || !state) return redirectWithError('Missing code or state from LinkedIn');

  const storedState = request.cookies.get('linkedin_oauth_state')?.value;
  if (state !== storedState) return redirectWithError('Invalid OAuth state');

  const callbackUrl = `${appUrl}/api/social-accounts/callback/linkedin`;

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      return redirectWithError('Failed to exchange LinkedIn code for token');
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get profile
    const profileRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.ok ? await profileRes.json() : null;

    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    const dispatchToken = request.cookies.get('dispatch-token')?.value;
    await fetch(`${appUrl}/api/social-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `dispatch-token=${dispatchToken}`,
      },
      body: JSON.stringify({
        platform: 'linkedin',
        account_name: profile ? `${profile.localizedFirstName} ${profile.localizedLastName}` : 'LinkedIn',
        account_id: profile?.id ?? null,
        access_token,
        refresh_token: refresh_token ?? null,
        token_expires_at: expiresAt,
      }),
    });

    const response = NextResponse.redirect(`${appUrl}/settings?connected=linkedin`);
    response.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[LinkedIn Callback]', err);
    return redirectWithError('Failed to complete LinkedIn connection');
  }
}

function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(
    `${appUrl}/settings?error=${encodeURIComponent(message)}`
  );
}
