'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ================================================================
   DISPATCH - "Terminal Luxe" with premium effects
   Animated dot grid, aurora glow, spotlight beams, glass cards
   ================================================================ */

/* ---------- fade-in observer ---------- */
function useFadeIn(delay = 0): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, delay);
        io.unobserve(el);
      }
    }, { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return ref;
}

function Fade({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useFadeIn(delay);
  return (
    <div ref={ref} className={className} style={{ opacity: 0, transform: 'translateY(20px)', transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- cursor spotlight ---------- */
function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null!);
  const handleMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    ref.current.style.setProperty('--mx', `${e.clientX}px`);
    ref.current.style.setProperty('--my', `${e.clientY}px`);
  }, []);
  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [handleMove]);
  return ref;
}

/* ---------- data ---------- */
const features = [
  { tag: 'GENERATE', title: 'AI that writes like you', desc: 'Eight tools trained on your voice, pillars, and background. Scripts, hooks, captions, replies, repurposing.' },
  { tag: 'ORGANIZE', title: 'Pipeline, not chaos', desc: 'Every post tracked idea through posted. Pillar tags, status badges, bulk actions, and full-text search.' },
  { tag: 'SCHEDULE', title: 'Calendar with drag-and-drop', desc: 'Drag posts onto days. AI fills your week. Visual gaps show where momentum breaks.' },
  { tag: 'PUBLISH', title: 'Four platforms, one click', desc: 'X, LinkedIn, Instagram, Threads. OAuth connect, platform-specific formatting, token refresh built in.' },
  { tag: 'ANALYZE', title: 'Know what ships', desc: 'Weekly AI reviews, pillar breakdowns, posting streaks, performance logs. Pattern detection across all content.' },
  { tag: 'EDIT', title: 'Video studio built in', desc: 'Upload, template, preview. Auto-captions and smart cuts ready for when you plug in a processing backend.' },
];

interface Props { loggedIn: boolean }

export default function LandingPageContent({ loggedIn }: Props) {
  const spotRef = useSpotlight();

  return (
    <div ref={spotRef} className="relative min-h-screen overflow-x-hidden" style={{ background: '#050507', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ===== GLOBAL EFFECTS LAYER ===== */}

      {/* Dot grid background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Aurora glow blobs */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="absolute -top-[200px] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.12]" style={{
          background: 'radial-gradient(circle, #6366F1, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'aurora1 12s ease-in-out infinite alternate',
        }} />
        <div className="absolute top-[40%] -right-[100px] w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{
          background: 'radial-gradient(circle, #8B5CF6, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'aurora2 15s ease-in-out infinite alternate',
        }} />
        <div className="absolute -bottom-[200px] left-[30%] w-[700px] h-[400px] rounded-full opacity-[0.06]" style={{
          background: 'radial-gradient(circle, #22D3EE, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'aurora3 18s ease-in-out infinite alternate',
        }} />
      </div>

      {/* Grain noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[2] opacity-[0.035]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Cursor spotlight */}
      <div className="fixed inset-0 pointer-events-none z-[3]" style={{
        background: 'radial-gradient(800px circle at var(--mx, 50%) var(--my, 50%), rgba(99,102,241,0.07), transparent 50%)',
      }} />

      {/* Keyframe animations */}
      <style>{`
        @keyframes aurora1 { from { transform: translate(0, 0) scale(1); } to { transform: translate(60px, 40px) scale(1.15); } }
        @keyframes aurora2 { from { transform: translate(0, 0) scale(1); } to { transform: translate(-40px, 60px) scale(1.1); } }
        @keyframes aurora3 { from { transform: translate(0, 0) scale(1); } to { transform: translate(50px, -30px) scale(1.2); } }
        @keyframes beam { from { transform: translateY(-100%) rotate(15deg); opacity: 0; } 50% { opacity: 1; } to { transform: translateY(200%) rotate(15deg); opacity: 0; } }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        @keyframes pulse-border { 0%, 100% { border-color: rgba(99,102,241,0.15); } 50% { border-color: rgba(99,102,241,0.3); } }
      `}</style>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10">

        {/* ---------- NAV ---------- */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.22em', color: '#E4E4E7', fontWeight: 500 }}>
            DISPATCH
          </span>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <Link href="/dashboard" className="px-5 py-2 text-[13px] font-semibold rounded-md text-[#050507]" style={{ background: '#E4E4E7' }}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-[13px] text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors duration-200">Sign in</Link>
                <Link href="/login?mode=signup" className="px-5 py-2 text-[13px] font-semibold rounded-md text-[#050507] transition-all hover:opacity-90" style={{ background: '#E4E4E7' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* ---------- HERO ---------- */}
        <section className="pt-24 sm:pt-36 pb-28 px-6 sm:px-10 max-w-5xl mx-auto">
          {/* Beam effect behind hero */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[400px] overflow-hidden pointer-events-none opacity-40">
            <div className="w-full h-[120px]" style={{ background: 'linear-gradient(to bottom, transparent, #818CF8, transparent)', animation: 'beam 4s ease-in-out infinite' }} />
          </div>

          {/* Gradient top rule */}
          <div className="w-[200px] h-[1px] mb-12 mx-0" style={{ background: 'linear-gradient(90deg, #818CF8, transparent)' }} />

          <Fade>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.5)', animation: 'pulse-border 2s infinite' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#71717A' }}>NOW IN PUBLIC BETA</span>
            </div>
          </Fade>

          <Fade delay={80}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(44px, 8vw, 80px)', color: '#FAFAFA', lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 400 }}>
              Your content,<br />
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>dispatched.</em>
            </h1>
          </Fade>

          <Fade delay={180}>
            <p className="mt-7 max-w-lg" style={{ fontSize: '17px', color: '#A1A1AA', lineHeight: 1.75 }}>
              The command center for creators who ship. AI writing, content pipeline, scheduling, and multi-platform publishing -- one workspace.
            </p>
          </Fade>

          <Fade delay={280}>
            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link href="/login?mode=signup"
                className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold text-[#050507] rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#FAFAFA' }}
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(99,102,241,0.12) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s infinite',
                }} />
                <span className="relative">Start creating</span>
                <svg className="relative w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="#features" className="px-6 py-3.5 text-[14px] text-[#71717A] hover:text-[#E4E4E7] transition-colors duration-200">
                See features &darr;
              </Link>
            </div>
          </Fade>

          {/* Stats */}
          <Fade delay={420}>
            <div className="flex items-center gap-12 sm:gap-16 mt-24 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { n: '8', label: 'AI writing tools' },
                { n: '4', label: 'Platforms' },
                { n: '5', label: 'Pipeline stages' },
                { n: '<1m', label: 'Setup time' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '36px', color: '#FAFAFA', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#52525B', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Fade>
        </section>

        {/* ---------- FEATURES ---------- */}
        <section id="features" className="px-6 sm:px-10 pb-28 max-w-5xl mx-auto">
          <Fade>
            <div className="mb-16">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', color: '#818CF8' }}>FEATURES</span>
              <h2 className="mt-3" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 5vw, 44px)', color: '#FAFAFA', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 400 }}>
                Everything to go from<br /><em style={{ fontStyle: 'italic' }}>idea to posted.</em>
              </h2>
            </div>
          </Fade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <Fade key={i} delay={i * 60}>
                <div
                  className="group relative rounded-xl p-6 transition-all duration-500 cursor-default h-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.035)';
                    el.style.borderColor = 'rgba(129,140,248,0.2)';
                    el.style.boxShadow = '0 0 40px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.015)';
                    el.style.borderColor = 'rgba(255,255,255,0.06)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Corner glow on hover */}
                  <div className="absolute -top-[50px] -right-[50px] w-[100px] h-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.15), transparent 70%)' }} />

                  <div className="flex items-center justify-between mb-4">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', color: '#818CF8', padding: '3px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: '#FAFAFA', fontWeight: 600 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#A1A1AA', lineHeight: 1.7 }}>
                    {f.desc}
                  </p>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ---------- HOW IT WORKS ---------- */}
        <section className="px-6 sm:px-10 py-28 max-w-5xl mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Fade>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', color: '#818CF8' }}>WORKFLOW</span>
            <h2 className="mt-3 mb-20" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 5vw, 44px)', color: '#FAFAFA', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 400 }}>
              Three steps. <em style={{ fontStyle: 'italic' }}>That&apos;s it.</em>
            </h2>
          </Fade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Define your voice', desc: 'Name, pillars, tone, background. The AI learns your style, not the other way around.' },
              { step: '02', title: 'Create and organize', desc: 'Generate scripts, organize in library, drag posts onto your calendar. One pipeline.' },
              { step: '03', title: 'Publish and learn', desc: 'Push to all four platforms. Track performance. AI reviews spot what works and what to change.' },
            ].map((s, i) => (
              <Fade key={i} delay={i * 120}>
                <div className="relative pl-6" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Glowing dot at top of border */}
                  <div className="absolute -left-[4px] top-0 w-[7px] h-[7px] rounded-full" style={{ background: '#818CF8', boxShadow: '0 0 12px rgba(129,140,248,0.5)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#52525B', letterSpacing: '0.08em' }}>{s.step}</span>
                  <h3 className="mt-2 mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: '#FAFAFA', fontWeight: 600 }}>{s.title}</h3>
                  <p style={{ fontSize: '13.5px', color: '#A1A1AA', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="relative text-center py-32 px-6 overflow-hidden">
          {/* CTA aurora glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 65%)', filter: 'blur(40px)' }} />

          <Fade className="relative">
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px, 6vw, 56px)', color: '#FAFAFA', lineHeight: 1.08, letterSpacing: '-0.03em', fontWeight: 400 }}>
              Ready to ship<br />
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #818CF8, #C084FC, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>more content?</em>
            </h2>
            <p className="mt-5 mb-9 mx-auto max-w-md" style={{ fontSize: '16px', color: '#A1A1AA', lineHeight: 1.7 }}>
              Free to use. Profile setup takes under a minute. No credit card.
            </p>
            <Link href="/login?mode=signup"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold text-[#050507] rounded-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#FAFAFA' }}
            >
              <span className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(110deg, transparent 30%, rgba(99,102,241,0.12) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite',
              }} />
              <span className="relative">Get Started</span>
              <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </Fade>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="px-6 sm:px-10 py-8 max-w-6xl mx-auto flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#3F3F46' }}>DISPATCH</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#3F3F46' }}>&copy; {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
