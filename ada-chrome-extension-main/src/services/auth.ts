import { CONFIG } from '@/config';
import type { AuthUser } from '@/types';
import { getCachedUser, setCachedUser, clearCachedUser } from '@/utils/storage';
import { authFetch, getSessionCookieValue } from '@/utils/fetch';

/**
 * Check if the ada_session cookie exists on tryada.app.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const value = await getSessionCookieValue();
  return value !== null;
}

/**
 * Check if user is authenticated by verifying the session cookie exists
 * and the profile endpoint responds 200.
 */
export async function isAuthenticated(): Promise<boolean> {
  const hasCookie = await hasSessionCookie();
  if (!hasCookie) return false;

  // Trust cached user when cookie exists — avoids unreliable fetch from
  // MV3 service workers where credentials/cookies are often not sent.
  const cached = await getCachedUser();
  if (cached) return true;

  try {
    const user = await fetchProfile();
    return user !== null;
  } catch {
    return false;
  }
}

/**
 * Fetch the current user profile from tryada.app.
 * Returns null if not authenticated.
 */
export async function fetchProfile(): Promise<AuthUser | null> {
  try {
    const response = await authFetch(`${CONFIG.api.baseUrl}/api/auth/profile`);

    if (!response.ok) return null;

    const data = await response.json();
    // verifySession() returns { id, email, name, avatar_url }
    const user: AuthUser = {
      id: data.id ?? '',
      email: data.email ?? '',
      name: data.name ?? undefined,
      avatarUrl: data.avatar_url ?? data.avatarUrl ?? undefined,
    };

    await setCachedUser(user);
    return user;
  } catch {
    return null;
  }
}

/**
 * Get the current user. First checks local cache, then fetches from API.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cached = await getCachedUser();
  if (cached) return cached;
  return fetchProfile();
}

/**
 * Sign in with email and password.
 * Posts to tryada.app/api/auth/login.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await authFetch(
    `${CONFIG.api.baseUrl}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let msg = 'Invalid email or password';
    try {
      const data = JSON.parse(text);
      msg = data.error || data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // Session cookie should now be set by the server response
  const user = await fetchProfile();
  if (!user) throw new Error('Sign-in succeeded but failed to load profile');
  return user;
}

/**
 * Sign out — clear session on server and locally.
 */
export async function signOut(): Promise<void> {
  try {
    await authFetch(`${CONFIG.api.baseUrl}/api/auth/logout`, {
      method: 'POST',
    });
  } catch {
    // Ignore — clear local state regardless
  }

  try {
    await chrome.cookies.remove({
      url: CONFIG.cookie.url,
      name: CONFIG.cookie.name,
    });
  } catch {}

  await clearCachedUser();
}
