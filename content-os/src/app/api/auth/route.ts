import { NextRequest, NextResponse } from 'next/server';

// POST: Set auth cookie after login
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('dispatch-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE: Clear auth cookie on sign out
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('dispatch-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
