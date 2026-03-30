import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

export function getServerClient(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing InsForge env vars');
  }

  const cookieStore = cookies();
  const token = cookieStore.get('dispatch-token')?.value;

  return createClient({
    baseUrl: url,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: token,
  });
}

export async function getAuthenticatedUser(): Promise<{ id: string; email: string } | null> {
  try {
    const client = getServerClient();
    const { data } = await client.auth.getCurrentUser();
    if (!data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
  } catch {
    return null;
  }
}
