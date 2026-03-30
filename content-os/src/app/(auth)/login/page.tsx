"use client";

import { useState, useEffect } from "react";
import { getInsforgeClient } from "@/lib/insforge/client";

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    handleAuth();
  }, []);

  async function handleAuth() {
    const client = getInsforgeClient();

    // Wait a tick for SDK constructor to process insforge_code if present
    await new Promise(r => setTimeout(r, 800));

    // Check if user is now logged in (SDK handles PKCE exchange internally)
    try {
      const { data } = await client.auth.getCurrentUser();
      if (data?.user) {
        // Logged in -- go to dashboard
        window.location.replace("/dashboard");
        return;
      }
    } catch {
      // Not logged in
    }

    // Check if there was an OAuth error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) {
      setError("Sign-in failed. Please try again.");
      window.history.replaceState(null, "", "/login");
    }

    // Clean up any leftover insforge params
    if (params.has("insforge_code")) {
      setError("Sign-in failed. Please try again.");
      window.history.replaceState(null, "", "/login");
    }

    setReady(true);
  }

  function handleGoogle() {
    const client = getInsforgeClient();
    client.auth.signInWithOAuth({
      provider: "google",
      redirectTo: `${window.location.origin}/login`,
    });
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-[340px] text-center">
        <h1 className="font-display font-[800] text-[20px] text-text-primary tracking-[0.16em] mb-2">DISPATCH</h1>
        <p className="font-body text-[13px] text-text-tertiary mb-8">Content command center</p>

        <button onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-lg py-3 font-body text-[14px] font-medium text-text-primary bg-bg-tertiary border border-border hover:border-border-hover transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {error && <p className="font-body text-[13px] text-red-400 mt-4">{error}</p>}

        <p className="font-body text-[11px] text-text-tertiary mt-6">
          Sign in or create an account with Google.
        </p>
      </div>
    </div>
  );
}
