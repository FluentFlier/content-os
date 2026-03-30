"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getInsforgeClient } from "@/lib/insforge/client";

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null!);
  const move = useCallback((e: MouseEvent) => { if (ref.current) { ref.current.style.setProperty('--mx', `${e.clientX}px`); ref.current.style.setProperty('--my', `${e.clientY}px`); } }, []);
  useEffect(() => { window.addEventListener('mousemove', move); return () => window.removeEventListener('mousemove', move); }, [move]);
  return ref;
}

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [hovering, setHovering] = useState(false);
  const spotRef = useSpotlight();

  useEffect(() => { handleAuth(); }, []);

  async function handleAuth() {
    const client = getInsforgeClient();
    await new Promise(r => setTimeout(r, 800));
    try {
      const { data } = await client.auth.getCurrentUser();
      if (data?.user) {
        // Sync token to cookie so server-side pages can authenticate
        const auth = client.auth as unknown as { getAccessToken?(): string | null };
        const token = auth.getAccessToken?.();
        if (token) {
          await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        }
        window.location.replace("/dashboard");
        return;
      }
    } catch {}
    const params = new URLSearchParams(window.location.search);
    if (params.has("error") || params.has("insforge_code")) {
      setError("Sign-in failed. Please try again.");
      window.history.replaceState(null, "", "/login");
    }
    setReady(true);
  }

  async function handleGoogle() {
    setError("");
    try {
      const client = getInsforgeClient();
      const { error: err } = await client.auth.signInWithOAuth({
        provider: "google",
        redirectTo: `${window.location.origin}/login`,
      });
      if (err) setError(err.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div ref={spotRef} className="relative min-h-screen overflow-hidden" style={{ background: '#050507', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes float1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
        @keyframes float2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,50px) scale(1.05); } }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(129,140,248,0.1), 0 0 60px rgba(129,140,248,0.05); } 50% { box-shadow: 0 0 30px rgba(129,140,248,0.15), 0 0 80px rgba(129,140,248,0.08); } }
      `}</style>

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[100px] w-[500px] h-[500px] rounded-full opacity-[0.1]" style={{
          background: 'radial-gradient(circle, #6366F1, transparent 70%)', filter: 'blur(100px)',
          animation: 'float1 12s ease-in-out infinite alternate',
        }} />
        <div className="absolute -bottom-[150px] -right-[100px] w-[400px] h-[400px] rounded-full opacity-[0.07]" style={{
          background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(120px)',
          animation: 'float2 15s ease-in-out infinite alternate',
        }} />
      </div>

      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Cursor spotlight */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(99,102,241,0.07), transparent 50%)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        {!ready ? (
          <div className="text-center" style={{ animation: 'fadeUp 0.5s ease-out' }}>
            <div className="w-7 h-7 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-[#71717A] mt-3">Signing you in...</p>
          </div>
        ) : (
          <div className="w-full max-w-[380px]" style={{ animation: 'fadeUp 0.6s ease-out' }}>
            {/* Logo */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{
                background: 'rgba(129,140,248,0.1)',
                border: '1px solid rgba(129,140,248,0.15)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: '#FAFAFA', fontWeight: 400, letterSpacing: '-0.02em' }}>
                Welcome to Dispatch
              </h1>
              <p className="text-[14px] text-[#71717A] mt-2">Sign in to your content command center</p>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-8" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              animation: hovering ? 'glow-pulse 2s ease-in-out infinite' : 'none',
            }}>
              {/* Google button */}
              <button
                onClick={handleGoogle}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                className="group relative w-full flex items-center justify-center gap-3 rounded-xl py-3.5 text-[14px] font-medium text-[#FAFAFA] transition-all duration-300 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Shimmer */}
                <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(129,140,248,0.08) 50%, transparent 70%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 2s infinite',
                }} />
                <svg className="relative" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="relative">Continue with Google</span>
                <svg className="relative w-3.5 h-3.5 text-[#71717A] group-hover:text-[#818CF8] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>

              {error && (
                <div className="mt-4 px-3 py-2 rounded-lg text-[13px] text-[#FCA5A5]" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {error}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[10px] text-[#52525B] uppercase tracking-[0.12em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Secure</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Info */}
              <div className="space-y-3">
                {[
                  { icon: "M9 12l2 2 4-4", label: "No password to remember" },
                  { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Encrypted and private" },
                  { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Instant setup, under 1 minute" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.08)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                    </div>
                    <span className="text-[13px] text-[#A1A1AA]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-[#52525B] mt-6">
              By continuing, you agree to our terms of service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
