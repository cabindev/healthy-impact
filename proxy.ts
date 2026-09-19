import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  let token = null
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, cookieName: 'healthy-impact.session-token' })
  } catch { /* Malformed authorization headers must fail closed. */ }

  const { pathname } = request.nextUrl;

  const isAdmin = token?.role === 'ADMIN' || token?.role === 'SUPERADMIN'

  if (pathname.startsWith('/dashboard') && (!token || !isAdmin)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/signin'],
};
