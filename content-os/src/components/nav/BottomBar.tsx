'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const primaryItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    dotColor: '#6366F1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    dotColor: '#F59E0B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
        <path d="M15 13l.75 2.25L18 16l-2.25.75L15 19l-.75-2.25L12 16l2.25-.75L15 13z" />
      </svg>
    ),
  },
  {
    name: 'Library',
    href: '/library',
    dotColor: '#6366F1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    dotColor: '#10B981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="15" rx="2" />
        <path d="M2 8h16" />
        <path d="M6 1v4" />
        <path d="M14 1v4" />
      </svg>
    ),
  },
];

const moreItems = [
  {
    name: 'Story Bank',
    href: '/story-bank',
    dotColor: '#8B5CF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    dotColor: '#F59E0B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a5.5 5.5 0 00-2 10.63V14a1 1 0 001 1h2a1 1 0 001-1v-1.37A5.5 5.5 0 0010 2z" />
        <path d="M8 17h4" />
        <path d="M9 17v1a1 1 0 002 0v-1" />
      </svg>
    ),
  },
  {
    name: 'Series',
    href: '/series',
    dotColor: '#6366F1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    dotColor: '#8B5CF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="14" rx="2" />
        <polygon points="8,7 14,10 8,13" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/analytics',
    dotColor: '#10B981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    dotColor: '#71717A',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 1v2M10 17v2M18.36 4.64l-1.42 1.42M3.06 13.94l-1.42 1.42M19 10h-2M3 10H1M15.78 15.78l-1.42-1.42M5.64 5.64L4.22 4.22" />
      </svg>
    ),
  },
];

export default function BottomBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Close drawer on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    if (!moreOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMore();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [moreOpen, closeMore]);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  );

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMore}
        />
      )}

      {/* Slide-up drawer */}
      {moreOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
          <div
            className="mx-3 mb-2 rounded-[12px] bg-[#09090B] p-3 space-y-1 animate-slide-in"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)', boxShadow: '0 -4px 20px rgba(255,255,255,0.08)' }}
          >
            {moreItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[7px] min-h-[44px] transition-all duration-100 ${
                    isActive
                      ? 'bg-[rgba(99,102,241,0.12)] text-[#6366F1]'
                      : 'text-[#A1A1AA] hover:bg-[#18181B]'
                  }`}
                  onClick={closeMore}
                >
                  <div
                    className="w-[3px] h-[20px] rounded-[2px] shrink-0"
                    style={{ backgroundColor: item.dotColor }}
                  />
                  {item.icon}
                  <span className="font-body text-[13px] font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden bg-[#18181B] z-40 pb-[env(safe-area-inset-bottom)]"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.12)' }}
      >
        <div className="flex items-center justify-around h-14">
          {primaryItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 transition-all duration-100 ${
                  isActive ? 'text-[#6366F1]' : 'text-[#A1A1AA]'
                }`}
                onClick={() => moreOpen && closeMore()}
              >
                <div className="relative">
                  {isActive && (
                    <span
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: item.dotColor }}
                    />
                  )}
                  {item.icon}
                </div>
                <span className="font-body text-[10px] font-medium leading-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-1 transition-all duration-100 ${
              moreOpen || isMoreActive ? 'text-[#6366F1]' : 'text-[#A1A1AA]'
            }`}
          >
            <div className="relative">
              {isMoreActive && !moreOpen && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-[#6366F1]" />
              )}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="4" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="16" cy="10" r="1.5" />
              </svg>
            </div>
            <span className="font-body text-[10px] font-medium leading-tight">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
