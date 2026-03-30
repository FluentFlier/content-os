'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ---------- intersection observer fade-in ---------- */
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
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return ref;
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useFadeIn(delay);
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </div>
  );
}

/* ---------- animated counter ---------- */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null!);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(start);
        }, 30);
        io.unobserve(el);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ---------- data ---------- */
const features = [
  { emoji: '✍️', title: '8 AI Writing Tools', desc: 'Scripts, hooks, captions, comment replies, repurposing, trend catching, and more. All trained on your voice.' },
  { emoji: '📚', title: 'Content Library', desc: 'Every post tracked from idea to posted. Filter by pillar, status, platform. Bulk actions. Full pipeline.' },
  { emoji: '📅', title: 'Smart Calendar', desc: 'Drag posts onto days. AI fills your week. See gaps before they become missed opportunities.' },
  { emoji: '🎬', title: 'Video Studio', desc: 'Upload, preview, and template videos. Auto-captions and smart cuts when you connect a processing backend.' },
  { emoji: '📤', title: 'Social Publishing', desc: 'Connect X, LinkedIn, Instagram, Threads. Publish from one place. Platform-specific formatting built in.' },
  { emoji: '📊', title: 'Analytics + Reviews', desc: 'Weekly AI reviews. Pillar breakdowns. Posting streaks. Performance logs. Know what actually works.' },
];

const steps = [
  { n: '01', title: 'Define your voice', desc: 'Name, pillars, background, tone. The AI adapts to you.' },
  { n: '02', title: 'Create and organize', desc: 'Generate content, organize in library, schedule on calendar.' },
  { n: '03', title: 'Publish and learn', desc: 'Push to platforms. Track performance. Let AI spot patterns.' },
];

interface Props { loggedIn: boolean; }

export default function LandingPageContent({ loggedIn }: Props) {
  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden">
      {/* ==================== Nav ==================== */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-[800] text-[15px] tracking-[0.2em] text-text-primary">
          DISPATCH
        </span>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="rounded-md py-2 px-5 text-white text-[13px] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-all duration-150">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-md py-2 px-4 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
                Sign in
              </Link>
              <Link href="/login?mode=signup" className="rounded-md py-2 px-5 text-white text-[13px] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-all duration-150 shadow-sm shadow-[#6366F1]/25">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ==================== Hero ==================== */}
      <section className="relative pt-16 sm:pt-28 pb-20 px-6 text-center overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#6366F1]/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />

        <FadeIn className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#6366F1]/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
            <span className="text-[11px] font-semibold text-[#6366F1] uppercase tracking-[0.08em]">Now in public beta</span>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <h1 className="font-display font-[800] text-[40px] sm:text-[56px] md:text-[64px] tracking-[-0.04em] text-text-primary leading-[1.05] max-w-3xl mx-auto">
            Your content,<br />
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">dispatched.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={160}>
          <p className="mt-5 text-[16px] sm:text-[18px] text-text-secondary max-w-xl mx-auto leading-relaxed">
            The command center for creators who ship. AI writing, content pipeline, scheduling, and multi-platform publishing in one workspace.
          </p>
        </FadeIn>

        <FadeIn delay={240}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/login?mode=signup"
              className="group rounded-lg py-3 px-7 text-white text-[14px] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#6366F1]/20 hover:shadow-[#6366F1]/30 hover:-translate-y-0.5"
            >
              Start creating
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link
              href="#features"
              className="rounded-lg py-3 px-7 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              See how it works
            </Link>
          </div>
        </FadeIn>

        {/* Stats bar */}
        <FadeIn delay={350}>
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-14 text-center">
            {[
              { value: 8, suffix: '', label: 'AI writing tools' },
              { value: 4, suffix: '', label: 'Connected platforms' },
              { value: 5, suffix: '', label: 'Pipeline stages' },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display font-[800] text-[28px] sm:text-[32px] text-text-primary tracking-tight">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[11px] text-text-tertiary uppercase tracking-[0.08em] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ==================== Features ==================== */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <FadeIn>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6366F1] mb-3 text-center">Everything you need</p>
          <h2 className="font-display text-center mb-12 font-[800] text-[28px] sm:text-[36px] text-text-primary tracking-[-0.03em]">
            One workspace. Zero context-switching.
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="group rounded-xl p-5 border border-transparent bg-[#F8FAFC] hover:bg-white hover:border-[#E2E8F0] hover:shadow-lg hover:shadow-[#6366F1]/[0.04] transition-all duration-300 hover:-translate-y-0.5 h-full">
                <span className="text-[24px] block mb-3">{f.emoji}</span>
                <h3 className="font-display text-[15px] font-[700] text-text-primary mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ==================== How It Works ==================== */}
      <section className="bg-[#F8FAFC] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6366F1] mb-3 text-center">How it works</p>
            <h2 className="font-display text-center mb-14 font-[800] text-[28px] sm:text-[36px] text-text-primary tracking-[-0.03em]">
              Three steps to shipping consistently.
            </h2>
          </FadeIn>
          <div className="space-y-8">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-display font-[700] text-[14px] shadow-md shadow-[#6366F1]/20">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-display text-[16px] font-[700] text-text-primary mb-1">{s.title}</h3>
                    <p className="text-[14px] text-text-secondary leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative text-center py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#EEF2FF]/40 to-white pointer-events-none" />
        <FadeIn className="relative">
          <h2 className="font-display font-[800] text-[32px] sm:text-[42px] text-text-primary tracking-[-0.03em] leading-tight">
            Ready to ship<br />
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">more content?</span>
          </h2>
          <p className="text-[15px] text-text-secondary mt-4 mb-8 max-w-md mx-auto">
            Free to use. Set up your profile in under a minute. Start generating content immediately.
          </p>
          <Link
            href="/login?mode=signup"
            className="group inline-flex items-center rounded-lg py-3 px-8 text-white text-[15px] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] transition-all duration-200 gap-2 shadow-lg shadow-[#6366F1]/20 hover:shadow-[#6366F1]/30 hover:-translate-y-0.5"
          >
            Get Started Free
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </FadeIn>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="border-t border-[#E2E8F0] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display font-[800] text-[11px] tracking-[0.2em] text-text-tertiary">DISPATCH</span>
          <p className="text-[11px] text-text-tertiary">&copy; {new Date().getFullYear()} Dispatch</p>
        </div>
      </footer>
    </div>
  );
}
