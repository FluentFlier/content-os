import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { encryptToken } from '@/lib/crypto';

// GET: Handle Instagram/Facebook OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!appId || !appSecret) {
    return redirectWithError('Instagram API credentials not configured');
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return redirectWithError(`Instagram auth denied: ${error}`);
  if (!code || !state) return redirectWithError('Missing code or state');

  // Validate state against cookie (CSRF protection)
  const storedState = request.cookies.get('instagram_oauth_state')?.value;
  if (state !== storedState) return redirectWithError('Invalid OAuth state. Try connecting again.');

  // Authenticate user
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirectWithError('Not authenticated. Please log in first.');
  }

  const callbackUrl = `${appUrl}/api/social-accounts/callback/instagram`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${appSecret}&code=${code}`
    );

    if (!tokenRes.ok) return redirectWithError('Failed to exchange Instagram code');

    const { access_token } = await tokenRes.json();

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
    );
    const longData = longRes.ok ? await longRes.json() : { access_token };
    const longToken = longData.access_token ?? access_token;
    const expiresIn = longData.expires_in;

    // Get Instagram Business Account ID through Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`
    );
    let igAccountId: string | null = null;
    let igUsername = 'Instagram';

    if (pagesRes.ok) {
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];
      if (page) {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`
        );
        if (igRes.ok) {
          const igData = await igRes.json();
          igAccountId = igData.instagram_business_account?.id ?? null;
          if (igAccountId) {
            const profileRes = await fetch(
              `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${longToken}`
            );
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              igUsername = `@${profileData.username}`;
            }
          }
        }
      }
    }

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
          platform: 'instagram',
          account_name: igUsername,
          account_id: igAccountId,
          access_token: encryptToken(longToken),
          refresh_token: null,
          token_expires_at: expiresAt,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      );

    if (dbError) {
      console.error('[Instagram Callback] DB error:', dbError.message);
      return redirectWithError('Failed to save Instagram connection');
    }

    // Redirect to settings and clear OAuth cookies
    const response = NextResponse.redirect(`${appUrl}/settings?connected=instagram`);
    response.cookies.set('instagram_oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('[Instagram Callback]', err);
    return redirectWithError('Failed to complete Instagram connection');
  }
}

function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(
    `${appUrl}/settings?error=${encodeURIComponent(message)}`
  );
}
