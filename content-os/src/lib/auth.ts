import { getServerInsforge } from "@/lib/insforge/server";

/**
 * Server-side: get the currently authenticated user from cookies.
 * Returns the user object or null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    const client = getServerInsforge();
    const {
      data: { user },
      error,
    } = await client.auth.getCurrentUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Client-side: sign out and redirect to login.
 * Must be called from a client component.
 */
export async function signOut() {
  const { getInsforge } = await import("@/lib/insforge/client");
  await getInsforge().auth.signOut();
  window.location.href = "/login";
}
