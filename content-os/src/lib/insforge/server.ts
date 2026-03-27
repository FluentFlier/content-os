/**
 * Server-side InsForge client for API routes.
 * Creates a fresh client per request with the access token from cookies/headers.
 */

import { createClient } from "@insforge/sdk";
import { cookies } from "next/headers";

export function getServerInsforge() {
  const url = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing InsForge env vars");
  }

  const cookieStore = cookies();
  const accessToken = cookieStore.get("insforge-access-token")?.value;

  const client = createClient({
    baseUrl: url,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken,
  });

  return client;
}
