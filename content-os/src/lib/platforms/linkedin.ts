/** LinkedIn API version in YYYYMM format */
const LINKEDIN_API_VERSION = '202601';

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  url?: string;
  error?: string;
}

interface ProfileResult {
  id: string;
  name: string;
  username: string;
}

export async function publishPost(
  accessToken: string,
  content: string,
  personId?: string
): Promise<PublishResult> {
  try {
    if (!personId) {
      const profile = await getProfile(accessToken);
      if (!profile) return { success: false, error: 'Could not resolve LinkedIn profile' };
      personId = profile.id;
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `LinkedIn API error: ${res.status} ${body}` };
    }

    // Posts API returns the post URN in the x-restli-id header
    const postId = res.headers.get('x-restli-id') ?? '';
    const urnEncoded = encodeURIComponent(postId);

    return {
      success: true,
      platformPostId: postId,
      url: `https://www.linkedin.com/feed/update/${urnEncoded}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshResult> {
  try {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `LinkedIn refresh error: ${res.status} ${body}` };
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getProfile(accessToken: string): Promise<ProfileResult | null> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: `${data.localizedFirstName} ${data.localizedLastName}`,
      username: data.id,
    };
  } catch {
    return null;
  }
}
