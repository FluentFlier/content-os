'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

/* ================================================================
   DISPATCH LANDING PAGE - "Terminal Luxe"
   Dark, editorial, glass effects, grain texture
   ================================================================ */

/* ---------- intersection observer ---------- */
function useFadeIn(delay = 0): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay);
          io.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return ref;
}

function Fade({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useFadeIn(delay);
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(20px)', transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- spotlight cursor glow ---------- */
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

/* ---------- animated number ---------- */
function Num({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '42px', color: '#FAFAFA', lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#52525B', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
    </div>
  );
}

/* ---------- data ---------- */
const features = [
  { tag: 'GENERATE', title: 'AI that writes like you', desc: 'Eight tools trained on your voice. Scripts, hooks, captions, replies, repurposing. Not generic copy.', icon: '01' },
  { tag: 'ORGANIZE', title: 'Pipeline, not chaos', desc: 'Every post tracked from idea through scripted, filmed, edited, to posted. Filter. Search. Bulk edit.', icon: '02' },
  { tag: 'SCHEDULE', title: 'Calendar with drag-and-drop', desc: 'Drop posts on days. AI suggests your week. See gaps before they cost you momentum.', icon: '03' },
  { tag: 'PUBLISH', title: 'Four platforms, one click', desc: 'X, LinkedIn, Instagram, Threads. Connect once, publish everywhere with platform-aware formatting.', icon: '04' },
  { tag: 'ANALYZE', title: 'Know what ships', desc: 'Weekly AI reviews. Pillar breakdowns. Performance logs. Pattern detection across your content.', icon: '05' },
  { tag: 'EDIT', title: 'Video studio built in', desc: 'Upload, template, and prepare videos. Auto-captions and smart cuts ready when you plug in a backend.', icon: '06' },
];

/* ---------- component ---------- */
interface Props { loggedIn: boolean; }

export default function LandingPageContent({ loggedIn }: Props) {
  const spotlightRef = useSpotlight();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      ref={spotlightRef}
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: '#09090B',
        fontFamily: "'DM Sans', sans-serif",
        color: '#A1A1AA',
        fontSize: '14px',
        lineHeight: 1.6,
      }}
    >
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />

      {/* Cursor spotlight */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-30" style={{
        background: 'radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(99, 102, 241, 0.06), transparent 60%)',
      }} />

      {/* ==================== Nav ==================== */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.2em', color: '#FAFAFA', fontWeight: 500 }}>
          DISPATCH
        </span>
        <div className="flex items-center gap-4">
          {loggedIn ? (
            <Link href="/dashboard" className="px-5 py-2 text-[13px] font-medium text-[#09090B] rounded-md" style={{ background: '#FAFAFA' }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                Sign in
              </Link>
              <Link href="/login?mode=signup" className="px-5 py-2 text-[13px] font-medium text-[#09090B] rounded-md transition-all hover:opacity-90" style={{ background: '#FAFAFA' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ==================== Hero ==================== */}
      <section className="relative z-10 pt-20 sm:pt-32 pb-24 px-6 sm:px-10 max-w-5xl mx-auto">
        {/* Top gradient line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />

        <Fade>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#52525B' }}>
              PUBLIC BETA
            </span>
          </div>
        </Fade>

        <Fade delay={100}>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(40px, 7vw, 72px)', color: '#FAFAFA', lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 400 }}>
            Your content,<br />
            <em style={{ fontStyle: 'italic', color: '#818CF8' }}>dispatched.</em>
          </h1>
        </Fade>

        <Fade delay={200}>
          <p className="mt-6 max-w-lg" style={{ fontSize: '16px', color: '#71717A', lineHeight: 1.7 }}>
            The command center for creators who ship consistently. AI writing tools, content pipeline, scheduling, and multi-platform publishing. One workspace. No switching.
          </p>
        </Fade>

        <Fade delay={300}>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              href="/login?mode=signup"
              className="group inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium text-[#09090B] rounded-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#FAFAFA' }}
            >
              Start creating
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="#features" className="px-6 py-3 text-[14px] text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              See features
            </Link>
          </div>
        </Fade>

        {/* Stats row */}
        <Fade delay={450}>
          <div className="flex items-center gap-10 sm:gap-16 mt-20 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Num n="8" label="AI tools" />
            <Num n="4" label="Platforms" />
            <Num n="5" label="Pipeline stages" />
          </div>
        </Fade>
      </section>

      {/* ==================== Features ==================== */}
      <section id="features" className="relative z-10 px-6 sm:px-10 pb-24 max-w-5xl mx-auto">
        <Fade>
          <div className="mb-14">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', color: '#818CF8' }}>FEATURES</span>
            <h2 className="mt-3" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 40px)', color: '#FAFAFA', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 400 }}>
              Everything to go from<br /><em style={{ fontStyle: 'italic' }}>idea to posted.</em>
            </h2>
          </div>
        </Fade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <Fade key={i} delay={i * 70}>
              <div
                className="group relative rounded-xl p-6 transition-all duration-300 hover:scale-[1.01] cursor-default h-full"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(129,140,248,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)';
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', color: '#818CF8' }}>
                    {f.tag}
                  </span>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: 'rgba(255,255,255,0.06)', lineHeight: 1 }}>
                    {f.icon}
                  </span>
                </div>
                <h3 className="mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#FAFAFA', fontWeight: 600 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#71717A', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* ==================== How It Works ==================== */}
      <section className="relative z-10 px-6 sm:px-10 py-24 max-w-5xl mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <Fade>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', color: '#818CF8' }}>WORKFLOW</span>
          <h2 className="mt-3 mb-16" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 40px)', color: '#FAFAFA', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 400 }}>
            Three steps. <em style={{ fontStyle: 'italic' }}>That&apos;s it.</em>
          </h2>
        </Fade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Define your voice', desc: 'Pillars, tone, background. The AI learns you, not the other way around.' },
            { step: '02', title: 'Create and organize', desc: 'Generate scripts. Organize in library. Drag posts onto your calendar.' },
            { step: '03', title: 'Publish and learn', desc: 'Push to all platforms. Track performance. AI spots what works.' },
          ].map((s, i) => (
            <Fade key={i} delay={i * 120}>
              <div>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '48px', color: 'rgba(129,140,248,0.15)', lineHeight: 1, display: 'block', marginBottom: '12px' }}>
                  {s.step}
                </span>
                <h3 className="mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#FAFAFA', fontWeight: 600 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#71717A', lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative z-10 text-center py-28 px-6">
        {/* Gradient glow behind CTA */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08), transparent 70%)' }} />

        <Fade className="relative">
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 5vw, 52px)', color: '#FAFAFA', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 400 }}>
            Ready to ship<br /><em style={{ fontStyle: 'italic', color: '#818CF8' }}>more content?</em>
          </h2>
          <p className="mt-4 mb-8 mx-auto max-w-md" style={{ fontSize: '15px', color: '#71717A' }}>
            Free to use. Profile setup takes under a minute.
          </p>
          <Link
            href="/login?mode=signup"
            className="group inline-flex items-center gap-2 px-7 py-3 text-[14px] font-medium text-[#09090B] rounded-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#FAFAFA' }}
          >
            Get Started
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </Fade>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="relative z-10 px-6 sm:px-10 py-8 max-w-6xl mx-auto flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#3F3F46' }}>DISPATCH</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#3F3F46' }}>&copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
