'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (document.cookie.includes('dispatch-token')) {
      setLoggedIn(true);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <span className="font-body text-[13px] text-[#8C857D] animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="font-display font-[800] text-[16px] tracking-[0.16em] text-[#1A1714]">DISPATCH</span>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="rounded-[7px] py-[8px] px-[16px] text-[#FAFAF8] text-[13px] font-medium bg-[#EB5E55] hover:opacity-90 transition-all duration-100">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-[7px] py-[8px] px-[16px] text-[13px] font-medium text-[#4A4540] hover:text-[#1A1714] transition-all duration-100">Sign in</Link>
              <Link href="/login?mode=signup" className="rounded-[7px] py-[8px] px-[16px] text-[#FAFAF8] text-[13px] font-medium bg-[#EB5E55] hover:opacity-90 transition-all duration-100">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center pt-20 pb-16 px-6">
        <h1 className="font-display font-[800] text-[48px] tracking-[-0.02em] text-[#1A1714] leading-[1.1]">
          Plan it. Create it.<br /><span style={{ color: '#EB5E55' }}>Ship it.</span>
        </h1>
        <p className="mt-5 text-[16px] text-[#4A4540] max-w-lg mx-auto leading-relaxed">
          The content command center for creators who take their work seriously. Eight AI tools. One pipeline. Zero fluff.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login?mode=signup" className="rounded-[7px] py-[10px] px-[24px] text-[#FAFAF8] text-[13px] font-medium bg-[#EB5E55] hover:opacity-90 transition-all duration-100">Start for free</Link>
          <a href="#features" className="rounded-[7px] py-[10px] px-[24px] text-[13px] font-medium text-[#4A4540] hover:text-[#1A1714] transition-all duration-100" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>See how it works</a>
        </div>
      </section>

      {/* Dashboard mockup */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-[12px] overflow-hidden" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
          <div className="bg-[#F4F2EF] px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-[10px] h-[10px] rounded-full bg-[#EB5E55]/50" />
              <div className="w-[10px] h-[10px] rounded-full bg-[#F5C842]/50" />
              <div className="w-[10px] h-[10px] rounded-full bg-[#5CB85C]/50" />
            </div>
            <span className="text-[10px] text-[#8C857D] ml-2">dispatch</span>
          </div>
          <div className="bg-[#FAFAF8] p-6">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[{ n: '12', l: 'Posts this week' }, { n: '8', l: 'In pipeline' }, { n: '47', l: 'Total posted' }, { n: '6', l: 'Day streak', coral: true }].map((s, i) => (
                <div key={i} className="rounded-[12px] p-3" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
                  <div className={`text-[20px] font-medium ${s.coral ? 'text-[#EB5E55]' : 'text-[#1A1714]'}`}>{s.n}</div>
                  <div className="text-[11px] text-[#8C857D] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: 'Hot Take: Why most advice is wrong', color: '#EB5E55', status: 'Scripted', statusBg: '#E6F1FB', statusText: '#185FA5' },
                { title: 'Behind the scenes: building in public', color: '#4D96FF', status: 'Filmed', statusBg: '#FAEEDA', statusText: '#854F0B' },
                { title: 'The real cost of playing it safe', color: '#F5C842', status: 'Edited', statusBg: '#FAECE7', statusText: '#993C1D' },
              ].map((p, i) => (
                <div key={i} className="rounded-[12px] p-3 flex gap-2" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
                  <div className="w-[3px] rounded-[2px] shrink-0" style={{ backgroundColor: p.color }} />
                  <div>
                    <div className="text-[12px] font-medium text-[#1A1714] leading-tight">{p.title}</div>
                    <span className="inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-[3px]" style={{ backgroundColor: p.statusBg, color: p.statusText }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-[#8C857D] mb-3 text-center">WHAT IT DOES</p>
        <h2 className="font-display text-center mb-10 font-[700] text-[28px] text-[#1A1714] tracking-[-0.02em]">
          Three jobs. <span className="text-[#EB5E55]">One tool.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Generate', desc: 'Eight AI tools that write in your voice. Scripts, hooks, captions, story mining, repurposing, trend angles, replies, series plans.', color: '#EB5E55' },
            { title: 'Organize', desc: 'Content library, drag-and-drop calendar, story bank, idea backlog, series manager. Every post moves through a pipeline.', color: '#F5C842' },
            { title: 'Optimize', desc: 'Performance logging, pillar analytics, weekly AI reviews, hashtag vault. Know what works. Cut what does not.', color: '#5CB85C' },
          ].map((f, i) => (
            <div key={i} className="rounded-[12px] p-5" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
              <div className="w-[6px] h-[6px] rounded-full mb-3" style={{ backgroundColor: f.color }} />
              <h3 className="font-display text-[14px] font-[700] text-[#1A1714] mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#4A4540] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-[#8C857D] mb-3 text-center">HOW IT WORKS</p>
        <h2 className="font-display text-center mb-10 font-[700] text-[28px] text-[#1A1714] tracking-[-0.02em]">
          Idea to posted in <span className="text-[#EB5E55]">three steps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: '1', title: 'Write', desc: 'Mine your stories, generate scripts across six content pillars, capture ideas before they disappear.' },
            { n: '2', title: 'Schedule', desc: 'Drag posts onto your calendar. Let AI fill gaps based on your pillar weights and rhythm.' },
            { n: '3', title: 'Ship', desc: 'Open the teleprompter, record, log your stats. AI tells you what is working.' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center text-[14px] font-medium text-[#EB5E55]" style={{ border: '1.5px solid #EB5E55' }}>{s.n}</div>
              <h3 className="font-display text-[14px] font-[700] text-[#1A1714] mb-2">{s.title}</h3>
              <p className="text-[13px] text-[#4A4540] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.10em] text-[#8C857D] mb-3 text-center">AI TOOLS</p>
        <h2 className="font-display text-center mb-10 font-[700] text-[28px] text-[#1A1714] tracking-[-0.02em]">
          Eight tools. <span className="text-[#EB5E55]">Your voice.</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Script Writer', desc: 'Full scripts for six pillars', c: '#EB5E55' },
            { name: 'Hook Generator', desc: 'Eight scroll-stopping openers', c: '#F5C842' },
            { name: 'Caption Crafter', desc: 'Captions and hashtags that convert', c: '#4D96FF' },
            { name: 'Story Miner', desc: 'Turn memories into content', c: '#C77DFF' },
            { name: 'Repurposer', desc: 'One script, four platforms', c: '#5CB85C' },
            { name: 'Trend Angle', desc: 'Your earned take on any trend', c: '#EB5E55' },
            { name: 'Reply Composer', desc: 'Authentic replies at speed', c: '#F5C842' },
            { name: 'Series Planner', desc: 'Multi-part series with hooks', c: '#4D96FF' },
          ].map((t, i) => (
            <div key={i} className="rounded-[12px] p-4" style={{ border: '0.5px solid rgba(26,23,20,0.12)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: t.c }} />
                <span className="text-[12px] font-medium text-[#1A1714]">{t.name}</span>
              </div>
              <p className="text-[12px] text-[#8C857D]">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teleprompter */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-[12px] p-8 text-center bg-[#1A1714]">
          <h3 className="font-display font-[700] text-[22px] text-[#FAFAF8]">Full-screen teleprompter</h3>
          <p className="text-[13px] text-[#8C857D] mt-2">Speed control &middot; Mirror mode &middot; Works offline</p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 pb-20">
        <h2 className="font-display font-[800] text-[32px] text-[#1A1714] tracking-[-0.02em]">
          Ready to <span className="text-[#EB5E55]">dispatch</span>?
        </h2>
        <p className="text-[13px] text-[#4A4540] mt-3 mb-6">Free to use. Set up in under a minute.</p>
        <Link href="/login?mode=signup" className="inline-block rounded-[7px] py-[10px] px-[24px] text-[#FAFAF8] text-[13px] font-medium bg-[#EB5E55] hover:opacity-90 transition-all duration-100">Create your account</Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 px-6" style={{ borderTop: '0.5px solid rgba(26,23,20,0.12)' }}>
        <p className="text-[11px] text-[#8C857D]">Dispatch &middot; Powered by InsForge</p>
      </footer>
    </div>
  );
}
