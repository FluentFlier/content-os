'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getInsforgeClient } from '@/lib/insforge/client';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    dotColor: '#EB5E55',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="7" height="8" rx="1.5" />
        <rect x="11" y="2" width="7" height="5" rx="1.5" />
        <rect x="2" y="12" width="7" height="6" rx="1.5" />
        <rect x="11" y="9" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    name: 'Generate',
    href: '/generate',
    dotColor: '#F5C842',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
        <path d="M15 13l.75 2.25L18 16l-2.25.75L15 19l-.75-2.25L12 16l2.25-.75L15 13z" />
      </svg>
    ),
  },
  {
    name: 'Library',
    href: '/library',
    dotColor: '#4D96FF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="12" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="12" width="6" height="6" rx="1" />
        <rect x="12" y="12" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    name: 'Calendar',
    href: '/calendar',
    dotColor: '#5CB85C',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="15" rx="2" />
        <path d="M2 8h16" />
        <path d="M6 1v4" />
        <path d="M14 1v4" />
      </svg>
    ),
  },
  {
    name: 'Story Bank',
    href: '/story-bank',
    dotColor: '#C77DFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <path d="M7 2v16" />
        <path d="M7 6h7" />
        <path d="M7 10h5" />
      </svg>
    ),
  },
  {
    name: 'Ideas',
    href: '/ideas',
    dotColor: '#F5C842',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a5.5 5.5 0 00-2 10.63V14a1 1 0 001 1h2a1 1 0 001-1v-1.37A5.5 5.5 0 0010 2z" />
        <path d="M8 17h4" />
        <path d="M9 17v1a1 1 0 002 0v-1" />
      </svg>
    ),
  },
  {
    name: 'Series',
    href: '/series',
    dotColor: '#4D96FF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="1" width="12" height="4" rx="1" />
        <rect x="3" y="5" width="14" height="4" rx="1" />
        <rect x="2" y="9" width="16" height="4" rx="1" />
        <rect x="3" y="13" width="14" height="4" rx="1" />
      </svg>
    ),
  },
  {
    name: 'Video Studio',
    href: '/video-studio',
    dotColor: '#C77DFF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="14" rx="2" />
        <polygon points="8,7 14,10 8,13" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/analytics',
    dotColor: '#5CB85C',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18V10" />
        <path d="M7 18V6" />
        <path d="M11 18V2" />
        <path d="M15 18V8" />
        <path d="M19 18V4" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/settings',
    dotColor: '#8C857D',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 1v2M10 17v2M18.36 4.64l-1.42 1.42M3.06 13.94l-1.42 1.42M19 10h-2M3 10H1M15.78 15.78l-1.42-1.42M5.64 5.64L4.22 4.22" />
      </svg>
    ),
  },
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
        // Try to get display name from creator_profile
        const { data: profile } = await client.database
          .from('creator_profile')
          .select('display_name')
          .eq('user_id', uid)
          .single();
        if (profile?.display_name) {
          setUserLabel(profile.display_name);
        } else {
          setUserLabel(email);
        }
      } catch {
        // silent
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await getInsforgeClient().auth.signOut();
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-[240px] h-screen bg-[#F4F2EF] z-40" style={{ borderRight: '0.5px solid rgba(26,23,20,0.12)' }}>
      <div className="px-[18px] pt-6 pb-1">
        <h1 className="font-[Syne] font-[800] text-[18px] text-[#1A1714] tracking-[0.16em]">
          DISPATCH
        </h1>
        {userLabel && (
          <p className="font-[Space_Grotesk] text-[11px] font-normal text-[#8C857D] mt-1 truncate">{userLabel}</p>
        )}
      </div>

      <div className="mx-[18px] my-3" style={{ borderTop: '0.5px solid rgba(26,23,20,0.12)' }} />

      <nav className="flex-1 px-[10px] space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-[8px] py-[7px] rounded-md text-[13px] font-[Space_Grotesk] transition-all duration-100 ${
                isActive
                  ? 'text-[#EB5E55] font-medium bg-[#FAFAF8]'
                  : 'text-[#4A4540] font-normal bg-transparent hover:text-[#1A1714] hover:bg-[#FAFAF8]'
              }`}
              style={isActive ? { borderLeft: '2px solid #EB5E55' } : {}}
            >
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{
                  backgroundColor: item.dotColor,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-[18px] pb-5">
        <button
          onClick={handleSignOut}
          className="font-[Space_Grotesk] text-[11px] text-[#8C857D] hover:text-[#4A4540] transition-all duration-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
