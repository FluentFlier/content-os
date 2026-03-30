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
  '/onboarding',
];

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get('dispatch-token')?.value;
  const isProtected = PROTECTED.some(p => request.nextUrl.pathname.startsWith(p));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
