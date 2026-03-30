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

      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = params.get("access_token");
        if (accessToken) {
          await syncToken(accessToken);
          window.location.hash = "";
          router.push("/dashboard");
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get("mode");
      if (urlMode === "signup") {
        setMode("signup");
      }

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
          // Code exchange failed, continue to login form
        }
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
      setError("Sign in failed - try again.");
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
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="animate-pulse font-[Space_Grotesk] text-[13px] text-[#94A3B8]">Loading...</div>
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="w-full max-w-sm px-4">
          <div className="text-center mb-8">
            <h1 className="font-[Syne] font-[800] text-[22px] text-[#0F172A] tracking-[0.16em]">DISPATCH</h1>
          </div>
          <div className="bg-[#FFFFFF] rounded-[12px] p-6 text-center space-y-4" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
            <h2 className="font-[Syne] font-[700] text-[16px] text-[#0F172A]">Check your email</h2>
            <p className="font-[Space_Grotesk] text-[13px] text-[#475569]">
              We sent a verification link to <strong className="text-[#0F172A]">{email}</strong>.
            </p>
            <button onClick={() => { setNeedsVerification(false); setMode("signin"); }} className="font-[Space_Grotesk] text-[13px] text-[#6366F1] hover:opacity-90 transition-all duration-100">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="font-[Syne] font-[800] text-[22px] text-[#0F172A] tracking-[0.16em]">DISPATCH</h1>
          <p className="font-[Space_Grotesk] text-[13px] mt-1.5 text-[#94A3B8]">Content command center</p>
        </div>

        <div className="bg-[#FFFFFF] rounded-[12px] p-6 space-y-4" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
          {/* OAuth */}
          <div className="space-y-2.5">
            <button onClick={() => handleOAuth("google")} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-[7px] py-2.5 font-[Space_Grotesk] text-[13px] font-medium text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all duration-100 disabled:opacity-40"
              style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("github")} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-[7px] py-2.5 font-[Space_Grotesk] text-[13px] font-medium text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all duration-100 disabled:opacity-40"
              style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0F172A"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(26,23,20,0.12)' }} />
            <span className="font-[Space_Grotesk] text-[11px] text-[#94A3B8]">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(26,23,20,0.12)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block font-[Space_Grotesk] text-[10px] font-medium uppercase tracking-[0.10em] mb-1.5 text-[#94A3B8]">Name</label>
                <input id="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" className="w-full bg-[#F8FAFC] rounded-[7px] px-3 py-2.5 font-[Space_Grotesk] text-[#0F172A] text-[13px] placeholder:text-[#94A3B8] focus:outline-none transition-all duration-100" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(26,23,20,0.40)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(26,23,20,0.12)'} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block font-[Space_Grotesk] text-[10px] font-medium uppercase tracking-[0.10em] mb-1.5 text-[#94A3B8]">Email</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="w-full bg-[#F8FAFC] rounded-[7px] px-3 py-2.5 font-[Space_Grotesk] text-[#0F172A] text-[13px] placeholder:text-[#94A3B8] focus:outline-none transition-all duration-100" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(26,23,20,0.40)'}
                onBlur={e => e.target.style.borderColor = 'rgba(26,23,20,0.12)'} />
            </div>
            <div>
              <label htmlFor="password" className="block font-[Space_Grotesk] text-[10px] font-medium uppercase tracking-[0.10em] mb-1.5 text-[#94A3B8]">Password</label>
              <input id="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Create a password" : "Your password"}
                className="w-full bg-[#F8FAFC] rounded-[7px] px-3 py-2.5 font-[Space_Grotesk] text-[#0F172A] text-[13px] placeholder:text-[#94A3B8] focus:outline-none transition-all duration-100" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(26,23,20,0.40)'}
                onBlur={e => e.target.style.borderColor = 'rgba(26,23,20,0.12)'} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-[7px] py-[10px] px-[20px] text-[#FFFFFF] font-[Space_Grotesk] text-[13px] font-medium bg-[#6366F1] hover:opacity-90 transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? (mode === "signup" ? "Creating..." : "Signing in...") : (mode === "signup" ? "Create account" : "Sign in")}
            </button>
            {error && <p className="font-[Space_Grotesk] text-[13px] text-center text-[#6366F1]">{error}</p>}
          </form>

          <div className="text-center pt-1">
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              className="font-[Space_Grotesk] text-[13px] text-[#475569] hover:opacity-80 transition-all duration-100">
              {mode === "signin" ? <>No account? <span className="text-[#6366F1]">Sign up</span></> : <>Have an account? <span className="text-[#6366F1]">Sign in</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
