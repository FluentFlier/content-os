import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
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
  '/voice-lab',
  '/onboarding',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Always set x-pathname header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const token = request.cookies.get('dispatch-token')?.value;

  // Authenticated user hitting /login -> redirect to /dashboard
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl, 307);
  }

  // Protected routes: redirect to /login if no token
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
