/**
 * Browser-side InsForge client for Content OS.
 * Same SDK as Ada iOS app -- createClient from @insforge/sdk.
 */

import { createClient } from "@insforge/sdk";

let client: ReturnType<typeof createClient> | null = null;

export function getInsforge() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY");
  }

  client = createClient({
    baseUrl: url,
    anonKey,
  });

  return client;
}
