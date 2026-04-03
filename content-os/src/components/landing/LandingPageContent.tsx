'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null!);
  const move = useCallback((e: MouseEvent) => { if (ref.current) { ref.current.style.setProperty('--mx', `${e.clientX}px`); ref.current.style.setProperty('--my', `${e.clientY}px`); } }, []);
  useEffect(() => { window.addEventListener('mousemove', move); return () => window.removeEventListener('mousemove', move); }, [move]);
  return ref;
}

const features = [
  { tag: 'GENERATE', title: 'AI that writes like you', desc: 'Eight tools trained on your voice, pillars, and background. Scripts, hooks, captions, replies, repurposing.' },
  { tag: 'ORGANIZE', title: 'Pipeline, not chaos', desc: 'Every post tracked from idea to posted. Pillar tags, status badges, bulk actions, and full-text search.' },
  { tag: 'SCHEDULE', title: 'Calendar with drag-and-drop', desc: 'Drag posts onto days. AI fills your week. Visual gaps show where momentum breaks.' },
  { tag: 'PUBLISH', title: 'Four platforms, one click', desc: 'X, LinkedIn, Instagram, Threads. OAuth connect, platform formatting, token refresh built in.' },
  { tag: 'ANALYZE', title: 'Know what ships', desc: 'Weekly AI reviews, pillar breakdowns, posting streaks, performance logs. Pattern detection across content.' },
  { tag: 'EDIT', title: 'Video studio built in', desc: 'Upload, template, preview. Auto-captions and smart cuts ready when you plug in a processing backend.' },
];

interface Props { loggedIn: boolean }

export default function LandingPageContent({ loggedIn }: Props) {
  const spotRef = useSpotlight();

  return (
    <div ref={spotRef} className="relative min-h-screen overflow-x-hidden bg-bg-primary font-body text-text-secondary">
      <style>{`
        @keyframes float1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
        @keyframes float2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,50px) scale(1.05); } }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        @keyframes beam { from { transform: translateY(-100%) rotate(15deg); opacity: 0; } 50% { opacity: 1; } to { transform: translateY(200%) rotate(15deg); opacity: 0; } }
      `}</style>

      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Aurora blobs */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="absolute -top-[200px] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)', filter: 'blur(100px)', animation: 'float1 12s ease-in-out infinite alternate' }} />
        <div className="absolute top-[40%] -right-[100px] w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(120px)', animation: 'float2 15s ease-in-out infinite alternate' }} />
      </div>

      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none z-[2] opacity-[0.035]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Cursor spotlight */}
      <div className="fixed inset-0 pointer-events-none z-[3]" style={{ background: 'radial-gradient(800px circle at var(--mx, 50%) var(--my, 50%), rgba(99,102,241,0.07), transparent 50%)' }} />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
          <span className="font-display font-[800] text-[15px] tracking-[0.2em] text-text-primary">DISPATCH</span>
          <div className="flex items-center gap-4">
            {loggedIn ? (
              <Link href="/dashboard" className="px-5 py-2 text-[13px] font-semibold rounded-md bg-text-primary text-bg-primary hover:opacity-90 transition-all">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors">Sign in</Link>
                <Link href="/login" className="px-5 py-2 text-[13px] font-semibold rounded-md bg-text-primary text-bg-primary hover:opacity-90 transition-all">Get Started</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-24 sm:pt-36 pb-28 px-6 sm:px-10 max-w-5xl mx-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[400px] overflow-hidden pointer-events-none opacity-40">
            <div className="w-full h-[120px]" style={{ background: 'linear-gradient(to bottom, transparent, #818CF8, transparent)', animation: 'beam 4s ease-in-out infinite' }} />
          </div>
          <div className="w-[200px] h-[1px] mb-12" style={{ background: 'linear-gradient(90deg, #818CF8, transparent)' }} />

          <Fade delay={80}>
            <h1 className="font-display font-[800] tracking-[-0.04em] text-text-primary leading-[1.02]" style={{ fontSize: 'clamp(44px, 8vw, 80px)' }}>
              Your content,<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #22D3EE 100%)' }}>dispatched.</span>
            </h1>
          </Fade>

          <Fade delay={180}>
            <p className="mt-7 max-w-lg text-[17px] text-text-secondary leading-relaxed">
              The command center for creators who ship. AI writing, content pipeline, scheduling, and multi-platform publishing -- one workspace.
            </p>
          </Fade>

          <Fade delay={280}>
            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link href="/login"
                className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold rounded-lg bg-text-primary text-bg-primary overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]">
                <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(99,102,241,0.15) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite' }} />
                <span className="relative">Start creating</span>
                <svg className="relative w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="#features" className="px-6 py-3.5 text-[14px] text-text-tertiary hover:text-text-primary transition-colors">See features &darr;</Link>
            </div>
          </Fade>

          <Fade delay={420}>
            <div className="flex items-center gap-12 sm:gap-16 mt-24 pt-8 border-t border-border">
              {[{ n: '8', l: 'AI writing tools' }, { n: '4', l: 'Platforms' }, { n: '5', l: 'Pipeline stages' }, { n: '<1m', l: 'Setup time' }].map((s, i) => (
                <div key={i}>
                  <div className="font-display font-[800] text-[36px] text-text-primary leading-none">{s.n}</div>
                  <div className="text-[11px] text-text-secondary tracking-[0.1em] uppercase mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </Fade>
        </section>

        {/* Features */}
        <section id="features" className="px-6 sm:px-10 pb-28 max-w-5xl mx-auto">
          <Fade>
            <span className="text-[11px] font-semibold tracking-[0.14em] text-coral uppercase">Features</span>
            <h2 className="font-display font-[800] mt-3 mb-14 text-text-primary tracking-[-0.03em] leading-[1.1]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              Everything to go from<br /><em className="font-normal italic">idea to posted.</em>
            </h2>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <Fade key={i} delay={i * 60}>
                <div className="group rounded-xl p-6 bg-[#111113] border border-[rgba(255,255,255,0.1)] hover:border-coral/30 hover:shadow-lg hover:shadow-coral/[0.08] transition-all duration-300 hover:-translate-y-0.5 h-full">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-[0.12em] text-coral bg-coral-light border border-coral/10 mb-4">{f.tag}</span>
                  <h3 className="font-display text-[16px] font-[700] text-text-primary mb-1.5">{f.title}</h3>
                  <p className="text-[14px] text-[#B4B4BD] leading-relaxed">{f.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 sm:px-10 py-24 max-w-5xl mx-auto border-t border-border">
          <Fade>
            <span className="text-[11px] font-semibold tracking-[0.14em] text-coral uppercase">Workflow</span>
            <h2 className="font-display font-[800] mt-3 mb-16 text-text-primary tracking-[-0.03em] leading-[1.1]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              Three steps. <em className="font-normal italic">That&apos;s it.</em>
            </h2>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { s: '01', t: 'Define your voice', d: 'Name, pillars, tone, background. The AI learns your style.' },
              { s: '02', t: 'Create and organize', d: 'Generate scripts, organize in library, drag posts onto calendar.' },
              { s: '03', t: 'Publish and learn', d: 'Push to all platforms. Track performance. AI spots what works.' },
            ].map((s, i) => (
              <Fade key={i} delay={i * 120}>
                <div className="relative pl-5 border-l border-border">
                  <div className="absolute -left-[4px] top-0 w-[7px] h-[7px] rounded-full bg-coral" style={{ boxShadow: '0 0 12px rgba(129,140,248,0.5)' }} />
                  <span className="text-[11px] text-text-secondary tracking-[0.08em]">{s.s}</span>
                  <h3 className="font-display text-[16px] font-[700] text-text-primary mt-2 mb-2">{s.t}</h3>
                  <p className="text-[14px] text-[#B4B4BD] leading-relaxed">{s.d}</p>
                </div>
              </Fade>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative text-center py-28 px-6 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1), transparent 65%)', filter: 'blur(40px)' }} />
          <Fade className="relative">
            <h2 className="font-display font-[800] text-text-primary tracking-[-0.03em] leading-tight" style={{ fontSize: 'clamp(34px, 6vw, 56px)' }}>
              Ready to ship<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #C084FC, #22D3EE)' }}>more content?</span>
            </h2>
            <p className="text-[16px] text-text-secondary mt-5 mb-9 max-w-md mx-auto">Free to use. Profile setup takes under a minute.</p>
            <Link href="/login"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold rounded-lg bg-text-primary text-bg-primary overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(99,102,241,0.15) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite' }} />
              <span className="relative">Get Started</span>
              <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </Fade>
        </section>

        {/* Footer */}
        <footer className="px-6 sm:px-10 py-8 max-w-6xl mx-auto flex items-center justify-between border-t border-border">
          <span className="font-display font-[800] text-[11px] tracking-[0.2em] text-text-tertiary">DISPATCH</span>
          <span className="text-[11px] text-text-tertiary">&copy; {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
