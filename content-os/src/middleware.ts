import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/generate",
  "/library",
  "/calendar",
  "/story-bank",
  "/ideas",
  "/series",
  "/analytics",
  "/settings",
  "/teleprompter",
  "/onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("insforge-access-token")?.value;

  // Root "/" is now the public content studio - no redirect
  if (pathname === "/") {
    return NextResponse.next();
  }

  // If on login page with valid token, redirect to dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect app routes
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/generate/:path*",
    "/library/:path*",
    "/calendar/:path*",
    "/story-bank/:path*",
    "/ideas/:path*",
    "/series/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/teleprompter/:path*",
    "/onboarding/:path*",
  ],
};
