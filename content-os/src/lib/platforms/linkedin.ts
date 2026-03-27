export interface LinkedInConfig {
  accessToken: string;
  personId: string;
}

export async function postToLinkedIn(
  config: LinkedInConfig,
  text: string
): Promise<{ id: string }> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${config.personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LinkedIn API error: ${res.status} ${error}`);
  }

  const data = await res.json();
  return { id: data.id };
}

export async function getLinkedInProfile(
  accessToken: string
): Promise<{ id: string; name: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch LinkedIn profile");
  const data = await res.json();
  return { id: data.sub, name: data.name };
}
