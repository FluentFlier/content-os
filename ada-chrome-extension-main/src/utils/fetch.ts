import { CONFIG } from '@/config';
import { clearCachedUser } from '@/utils/storage';

/**
 * Read the ada_session cookie value via chrome.cookies API.
 */
export async function getSessionCookieValue(): Promise<string | null> {
  try {
    const cookie = await chrome.cookies.get({
      url: CONFIG.cookie.url,
      name: CONFIG.cookie.name,
    });
    return cookie?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch for tryada.app API calls.
 *
 * MV3 service workers + popups can't reliably set the Cookie header
 * (it's a forbidden header). Instead we use `credentials: 'include'`
 * which works from extension contexts that have host_permissions for
 * the target domain. As a fallback, we also try setting the Cookie header.
 */
export async function authFetch(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  const sessionValue = await getSessionCookieValue();

  const headers = new Headers(opts.headers);

  // Belt-and-suspenders: try setting Cookie header (works in some contexts)
  // AND use credentials: 'include' (works when browser has the cookie)
  if (sessionValue) {
    try {
      headers.set('Cookie', `${CONFIG.cookie.name}=${sessionValue}`);
    } catch {
      // Forbidden header — ignore
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...opts,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    // Clear stale cached user on auth failure so isAuthenticated()
    // stops trusting the cache and forces re-login.
    if (response.status === 401) {
      await clearCachedUser().catch(() => {});
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
