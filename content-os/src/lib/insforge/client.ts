import { createClient } from '@insforge/sdk';

let client: ReturnType<typeof createClient> | null = null;

export function getInsforgeClient(): ReturnType<typeof createClient> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_INSFORGE_URL',
      !anonKey && 'NEXT_PUBLIC_INSFORGE_ANON_KEY',
    ].filter(Boolean).join(', ');

    throw new Error(
      `InsForge client cannot be initialized: missing environment variable(s): ${missing}. ` +
      'Add them to .env.local and restart the dev server.'
    );
  }

  client = createClient({ baseUrl: url, anonKey });
  return client;
}

/** Alias kept for backward compatibility with existing pages. */
export const getInsforge = getInsforgeClient;
