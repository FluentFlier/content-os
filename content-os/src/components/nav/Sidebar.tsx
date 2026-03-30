'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getInsforgeClient } from '@/lib/insforge/client';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="8" rx="1.5" /><rect x="11" y="2" width="7" height="5" rx="1.5" /><rect x="2" y="12" width="7" height="6" rx="1.5" /><rect x="11" y="9" width="7" height="9" rx="1.5" /></svg> },
  { name: 'Generate', href: '/generate', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" /><path d="M15 13l.75 2.25L18 16l-2.25.75L15 19l-.75-2.25L12 16l2.25-.75L15 13z" /></svg> },
  { name: 'Library', href: '/library', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="12" y="2" width="6" height="6" rx="1" /><rect x="2" y="12" width="6" height="6" rx="1" /><rect x="12" y="12" width="6" height="6" rx="1" /></svg> },
  { name: 'Calendar', href: '/calendar', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="15" rx="2" /><path d="M2 8h16" /><path d="M6 1v4" /><path d="M14 1v4" /></svg> },
  { name: 'Story Bank', href: '/story-bank', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="2" /><path d="M7 2v16" /><path d="M7 6h7" /><path d="M7 10h5" /></svg> },
  { name: 'Ideas', href: '/ideas', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a5.5 5.5 0 00-2 10.63V14a1 1 0 001 1h2a1 1 0 001-1v-1.37A5.5 5.5 0 0010 2z" /><path d="M8 17h4" /></svg> },
  { name: 'Series', href: '/series', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="1" width="12" height="4" rx="1" /><rect x="3" y="5" width="14" height="4" rx="1" /><rect x="2" y="9" width="16" height="4" rx="1" /><rect x="3" y="13" width="14" height="4" rx="1" /></svg> },
  { name: 'Video Studio', href: '/video-studio', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="14" rx="2" /><polygon points="8,7 14,10 8,13" fill="currentColor" stroke="none" /></svg> },
  { name: 'Analytics', href: '/analytics', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18V10" /><path d="M7 18V6" /><path d="M11 18V2" /><path d="M15 18V8" /><path d="M19 18V4" /></svg> },
  { name: 'Settings', href: '/settings', icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="3" /><path d="M10 1v2M10 17v2M18.36 4.64l-1.42 1.42M3.06 13.94l-1.42 1.42M19 10h-2M3 10H1M15.78 15.78l-1.42-1.42M5.64 5.64L4.22 4.22" /></svg> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userLabel, setUserLabel] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const client = getInsforgeClient();
        const { data } = await client.auth.getCurrentUser();
        if (!data?.user) return;
        const uid = data.user.id;
        const email = data.user.email ?? '';
        const { data: profile } = await client.database
          .from('creator_profile')
          .select('display_name')
          .eq('user_id', uid)
          .single();
        setUserLabel(profile?.display_name || email);
      } catch {}
    })();
  }, []);

  const handleSignOut = async () => {
    await getInsforgeClient().auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-[220px] h-screen z-40"
      style={{ background: '#0C0C0F', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      <div className="px-5 pt-6 pb-1">
        <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.2em', color: '#FAFAFA', fontWeight: 500 }}>
          DISPATCH
        </h1>
        {userLabel && (
          <p className="text-[11px] text-[#52525B] mt-1.5 truncate">{userLabel}</p>
        )}
      </div>

      <div className="mx-5 my-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                active
                  ? 'text-[#FAFAFA] font-medium'
                  : 'text-[#71717A] font-normal hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.03)]'
              }`}
              style={active ? { background: 'rgba(129,140,248,0.1)', borderLeft: '2px solid #818CF8' } : {}}
            >
              <span className={active ? 'text-[#818CF8]' : 'text-[#52525B]'}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-5">
        <button onClick={handleSignOut}
          className="text-[11px] text-[#52525B] hover:text-[#A1A1AA] transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
