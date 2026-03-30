import { createClient } from '@insforge/sdk';

let client: ReturnType<typeof createClient> | null = null;

export function getInsforgeClient(): ReturnType<typeof createClient> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      // During SSR/build, return a dummy client that won't be used
      return createClient({ baseUrl: 'https://placeholder.insforge.app', anonKey: 'placeholder' }) as ReturnType<typeof createClient>;
    }
    throw new Error('Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY');
  }

  client = createClient({ baseUrl: url, anonKey });
  return client;
}

/** Alias kept for backward compatibility with existing pages. */
export const getInsforge = getInsforgeClient;
