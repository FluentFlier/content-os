import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/generate',
  '/library',
  '/calendar',
  '/story-bank',
  '/ideas',
  '/series',
  '/analytics',
  '/settings',
  '/teleprompter',
  '/video-studio',
  '/onboarding',
];

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get('dispatch-token')?.value;
  const isProtected = PROTECTED.some(p => request.nextUrl.pathname.startsWith(p));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Only redirect /login to /dashboard if no OAuth callback params
  if (token && request.nextUrl.pathname === '/login') {
    const hasCallback = request.nextUrl.searchParams.has('insforge_code') || request.nextUrl.searchParams.has('code');
    if (!hasCallback) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
