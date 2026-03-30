"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getInsforgeClient } from "@/lib/insforge/client";

async function syncToken(token: string) {
  await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    async function init() {
      const client = getInsforgeClient();

      // Handle hash-based OAuth callback (implicit flow)
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = params.get("access_token");
        if (accessToken) {
          await syncToken(accessToken);
          window.history.replaceState(null, "", window.location.pathname);
          router.push("/dashboard");
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get("mode");
      if (urlMode === "signup") {
        setMode("signup");
      }

      // Handle code-based OAuth callback
      const code = urlParams.get("code");
      if (code) {
        try {
          const result = await client.auth.exchangeOAuthCode(code);
          if (result?.data?.accessToken) {
            await syncToken(result.data.accessToken);
            router.push("/dashboard");
            return;
          }
        } catch {
          setError("OAuth sign-in failed. Please try again.");
        }
      }

      // Check if already logged in
      try {
        const { data } = await client.auth.getCurrentUser();
        if (data?.user) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // Not logged in, show form
      }

      setCheckingSession(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const client = getInsforgeClient();

      if (mode === "signup") {
        const { data, error: err } = await client.auth.signUp({
          email,
          password,
          name: name || undefined,
        });
        if (err) { setError(err.message); setLoading(false); return; }
        if (data?.requireEmailVerification) { setNeedsVerification(true); setLoading(false); return; }
        if (data?.accessToken) {
          await syncToken(data.accessToken);
          router.push("/dashboard");
          return;
        }
      } else {
        const { data, error: err } = await client.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        if (data?.accessToken) {
          await syncToken(data.accessToken);
          router.push("/dashboard");
          return;
        }
      }
      setLoading(false);
    } catch {
      setError("Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    try {
      const client = getInsforgeClient();
      await client.auth.signInWithOAuth({
        provider,
        redirectTo: `${window.location.origin}/login`,
      });
    } catch {
      setError(`Failed to connect with ${provider}`);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="animate-pulse font-body text-[13px] text-text-tertiary">Loading...</div>
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-sm px-4">
          <div className="text-center mb-8">
            <h1 className="font-display font-[800] text-[22px] text-text-primary tracking-[0.16em]">DISPATCH</h1>
          </div>
          <div className="bg-white rounded-lg p-6 text-center space-y-4 border border-border">
            <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 4L10 10L18 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="4" width="16" height="12" rx="2" stroke="#6366F1" strokeWidth="1.5"/></svg>
            </div>
            <h2 className="font-display font-[700] text-[16px] text-text-primary">Check your email</h2>
            <p className="font-body text-[13px] text-text-secondary">
              We sent a verification link to <strong className="text-text-primary">{email}</strong>.
            </p>
            <button onClick={() => { setNeedsVerification(false); setMode("signin"); }} className="font-body text-[13px] text-coral hover:text-coral-dark transition-colors">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display font-[800] text-[20px] text-text-primary tracking-[0.16em]">DISPATCH</h1>
          <p className="font-body text-[13px] mt-1.5 text-text-tertiary">Content command center</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg p-6 space-y-5 border border-border shadow-sm">
          {/* OAuth buttons */}
          <div className="space-y-2.5">
            <button onClick={() => handleOAuth("google")} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-md py-2.5 font-body text-[13px] font-medium text-text-primary bg-bg-secondary border border-border hover:border-border-hover hover:bg-bg-tertiary transition-all duration-100 disabled:opacity-40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("github")} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-md py-2.5 font-body text-[13px] font-medium text-text-primary bg-bg-secondary border border-border hover:border-border-hover hover:bg-bg-tertiary transition-all duration-100 disabled:opacity-40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0F172A"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="font-body text-[11px] text-text-tertiary uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block font-body text-[11px] font-medium uppercase tracking-[0.06em] mb-1.5 text-text-tertiary">Name</label>
                <input id="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-bg-secondary rounded-md px-3 py-2.5 font-body text-text-primary text-[13px] placeholder:text-text-tertiary border border-border focus:border-coral focus:ring-2 focus:ring-coral/10 focus:outline-none transition-all duration-100" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block font-body text-[11px] font-medium uppercase tracking-[0.06em] mb-1.5 text-text-tertiary">Email</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-secondary rounded-md px-3 py-2.5 font-body text-text-primary text-[13px] placeholder:text-text-tertiary border border-border focus:border-coral focus:ring-2 focus:ring-coral/10 focus:outline-none transition-all duration-100" />
            </div>
            <div>
              <label htmlFor="password" className="block font-body text-[11px] font-medium uppercase tracking-[0.06em] mb-1.5 text-text-tertiary">Password</label>
              <input id="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Create a password" : "Your password"}
                className="w-full bg-bg-secondary rounded-md px-3 py-2.5 font-body text-text-primary text-[13px] placeholder:text-text-tertiary border border-border focus:border-coral focus:ring-2 focus:ring-coral/10 focus:outline-none transition-all duration-100" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-md py-[10px] px-[20px] text-white font-body text-[13px] font-semibold bg-coral hover:bg-coral-dark transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm">
              {loading ? (mode === "signup" ? "Creating..." : "Signing in...") : (mode === "signup" ? "Create account" : "Sign in")}
            </button>
            {error && <p className="font-body text-[13px] text-center text-red-500">{error}</p>}
          </form>

          {/* Toggle */}
          <div className="text-center pt-1">
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              className="font-body text-[13px] text-text-secondary hover:text-text-primary transition-colors">
              {mode === "signin" ? <>No account? <span className="text-coral font-medium">Sign up</span></> : <>Have an account? <span className="text-coral font-medium">Sign in</span></>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-body text-[11px] text-text-tertiary mt-6">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
