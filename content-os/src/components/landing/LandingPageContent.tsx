'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* ---------- fade-in on scroll ---------- */
function useFadeIn(): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(16px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
    >
      {children}
    </section>
  );
}

/* ---------- inline SVG icons (20x20) ---------- */
function IconPen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 2.5L17.5 5.5L6 17H3V14L14.5 2.5Z" stroke="#EB5E55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLibrary() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="5" height="14" rx="1" stroke="#4D96FF" strokeWidth="1.5" />
      <rect x="9" y="3" width="5" height="14" rx="1" stroke="#4D96FF" strokeWidth="1.5" />
      <path d="M16 3V17" stroke="#4D96FF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="14" rx="2" stroke="#F5C842" strokeWidth="1.5" />
      <path d="M2 8H18" stroke="#F5C842" strokeWidth="1.5" />
      <path d="M6 2V5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 2V5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="11" height="12" rx="2" stroke="#C77DFF" strokeWidth="1.5" />
      <path d="M13 8L18 5V15L13 12" stroke="#C77DFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="4" r="2.5" stroke="#5CB85C" strokeWidth="1.5" />
      <circle cx="5" cy="10" r="2.5" stroke="#5CB85C" strokeWidth="1.5" />
      <circle cx="14" cy="16" r="2.5" stroke="#5CB85C" strokeWidth="1.5" />
      <path d="M7.2 8.8L11.8 5.2" stroke="#5CB85C" strokeWidth="1.5" />
      <path d="M7.2 11.2L11.8 14.8" stroke="#5CB85C" strokeWidth="1.5" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17V9" stroke="#EB5E55" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 17V5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 17V11" stroke="#4D96FF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 17V3" stroke="#5CB85C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2C7.5 2 5 4 5 7C3.5 7.5 2.5 9 3 11C3.5 13 5 14 6 14H8" stroke="#C77DFF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 2C12.5 2 15 4 15 7C16.5 7.5 17.5 9 17 11C16.5 13 15 14 14 14H12" stroke="#C77DFF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14V18" stroke="#C77DFF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 16H12" stroke="#C77DFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconSwitch() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7H16M16 7L13 4M16 7L13 10" stroke="#EB5E55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13H4M4 13L7 10M4 13L7 16" stroke="#EB5E55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7.5" stroke="#5CB85C" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke="#5CB85C" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1" fill="#5CB85C" />
    </svg>
  );
}

/* ---------- feature data ---------- */
const features = [
  {
    icon: <IconPen />,
    title: 'AI Writing Tools',
    desc: 'Scripts, hooks, captions, replies, and repurposing. Eight AI tools that write in your voice, trained on your style.',
  },
  {
    icon: <IconLibrary />,
    title: 'Content Library',
    desc: 'Every post in one place with status tracking, pillar tags, and a pipeline from idea to posted.',
  },
  {
    icon: <IconCalendar />,
    title: 'Smart Calendar',
    desc: 'Visual calendar for scheduling content. See what is coming, spot gaps, and keep your cadence consistent.',
  },
  {
    icon: <IconVideo />,
    title: 'Video Studio',
    desc: 'Upload, preview, and compose videos with AI-generated templates. Built for short-form creators.',
  },
  {
    icon: <IconShare />,
    title: 'Social Publishing',
    desc: 'Connect Twitter, LinkedIn, Instagram, and Threads. Publish from one place with per-platform formatting.',
  },
  {
    icon: <IconChart />,
    title: 'Analytics',
    desc: 'Track what works. Pillar breakdowns, posting streaks, weekly AI reviews, and performance logs.',
  },
];

/* ---------- problem/solution data ---------- */
const problems = [
  {
    icon: <IconSwitch />,
    title: 'Stop context-switching',
    desc: 'Ideas live in Notes. Scripts in Docs. Scheduling in yet another app. Dispatch puts the whole pipeline in one place.',
  },
  {
    icon: <IconBrain />,
    title: 'AI that knows YOUR voice',
    desc: 'Generic AI writes generic content. Dispatch learns your background, your pillars, and your tone, then writes like you.',
  },
  {
    icon: <IconTarget />,
    title: 'Idea to posted in one place',
    desc: 'Capture an idea, turn it into a script, schedule it, film it, edit it, post it. One tool. One pipeline. Zero switching.',
  },
];

/* ---------- how it works ---------- */
const steps = [
  {
    n: '1',
    title: 'Set up your profile',
    desc: 'Tell Dispatch your name, content pillars, voice, and background. The AI adapts to you, not the other way around.',
  },
  {
    n: '2',
    title: 'Generate, organize, schedule',
    desc: 'Use AI tools to write scripts and hooks. Organize in the library. Drop posts on the calendar to plan your week.',
  },
  {
    n: '3',
    title: 'Publish and track',
    desc: 'Push content to your connected platforms. Track performance, spot trends, and let AI tell you what is working.',
  },
];

interface LandingPageContentProps {
  loggedIn: boolean;
}

export default function LandingPageContent({ loggedIn }: LandingPageContentProps) {
  return (
    <div className="min-h-screen bg-bg-primary font-body overflow-x-hidden">
      {/* ==================== Nav ==================== */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="font-display font-[800] text-[16px] tracking-[0.16em] text-text-primary">
          DISPATCH
        </span>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md py-[10px] px-[20px] text-[#FAFAF8] text-[13px] font-medium bg-coral hover:opacity-90 transition-all duration-100"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md py-[10px] px-[20px] text-[13px] font-medium text-text-secondary border border-border hover:text-text-primary hover:border-border-hover transition-all duration-100"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md py-[10px] px-[20px] text-[#FAFAF8] text-[13px] font-medium bg-coral hover:opacity-90 transition-all duration-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ==================== Hero ==================== */}
      <Section className="text-center pt-16 sm:pt-24 pb-16 px-6">
        <h1 className="font-display font-[800] text-[36px] sm:text-[48px] tracking-[-0.02em] text-text-primary leading-[1.1]">
          Your content, dispatched.
        </h1>
        <p className="mt-5 text-[15px] sm:text-[16px] text-text-secondary max-w-md mx-auto leading-relaxed">
          The content command center for creators who take their work
          seriously. AI writing, scheduling, publishing, and analytics
          in one pipeline.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/login?mode=signup"
            className="rounded-md py-[12px] px-[24px] text-[#FAFAF8] text-[13px] font-medium bg-coral hover:opacity-90 transition-all duration-100 min-h-[44px] flex items-center"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-md py-[12px] px-[24px] text-[13px] font-medium text-text-secondary border border-border hover:text-text-primary hover:border-border-hover transition-all duration-100 min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
        </div>
      </Section>

      {/* ==================== Problem / Solution ==================== */}
      <Section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-text-tertiary mb-3 text-center">
          WHY DISPATCH
        </p>
        <h2 className="font-display text-center mb-10 font-[700] text-[24px] sm:text-[28px] text-text-primary tracking-[-0.02em]">
          The problem with <span className="text-coral">your current workflow</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <div
              key={i}
              className="rounded-lg p-5 border border-border hover:border-border-hover transition-all duration-100"
            >
              <div className="mb-3">{p.icon}</div>
              <h3 className="font-display text-[14px] font-[700] text-text-primary mb-2">
                {p.title}
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ==================== Features Showcase ==================== */}
      <Section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-text-tertiary mb-3 text-center">
          FEATURES
        </p>
        <h2 className="font-display text-center mb-10 font-[700] text-[24px] sm:text-[28px] text-text-primary tracking-[-0.02em]">
          Everything you need to <span className="text-coral">create and ship</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-lg p-5 border border-border hover:border-border-hover transition-all duration-100"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-display text-[14px] font-[700] text-text-primary mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ==================== How It Works ==================== */}
      <Section className="max-w-3xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-text-tertiary mb-3 text-center">
          HOW IT WORKS
        </p>
        <h2 className="font-display text-center mb-10 font-[700] text-[24px] sm:text-[28px] text-text-primary tracking-[-0.02em]">
          Idea to posted in <span className="text-coral">three steps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-11 h-11 rounded-full mx-auto mb-4 flex items-center justify-center text-[14px] font-medium text-coral border-[1.5px] border-coral">
                {s.n}
              </div>
              <h3 className="font-display text-[14px] font-[700] text-text-primary mb-2">
                {s.title}
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ==================== CTA ==================== */}
      <Section className="text-center px-6 pb-20">
        <h2 className="font-display font-[800] text-[28px] sm:text-[32px] text-text-primary tracking-[-0.02em]">
          Ready to <span className="text-coral">dispatch</span>?
        </h2>
        <p className="text-[14px] text-text-secondary mt-3 mb-6">
          Free to use. Set up in under a minute.
        </p>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center rounded-md py-[12px] px-[24px] text-[#FAFAF8] text-[13px] font-medium bg-coral hover:opacity-90 transition-all duration-100 min-h-[44px]"
        >
          Get Started
        </Link>
      </Section>

      {/* ==================== Footer ==================== */}
      <footer className="text-center py-8 px-6 border-t border-border">
        <span className="font-display font-[800] text-[12px] tracking-[0.16em] text-text-tertiary">
          DISPATCH
        </span>
        <p className="text-[11px] text-text-tertiary mt-2">
          &copy; {new Date().getFullYear()} Dispatch. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
