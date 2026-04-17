import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // ── Ban enforcement: kick banned users immediately ──
  // Skip redirect for /api/auth to let NextAuth handle its own session/signout logic without getting HTML back
  if (isLoggedIn && req.auth?.user?.isBanned && pathname !== '/login' && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('reason', 'suspended');
    const response = NextResponse.redirect(loginUrl);

    // Clear all auth-related cookies to force session invalidation
    const cookieNames = ['authjs.session-token', '__Secure-authjs.session-token', 'authjs.callback-url', '__Secure-authjs.callback-url', 'authjs.csrf-token', '__Secure-authjs.csrf-token'];
    for (const name of cookieNames) {
      response.cookies.set(name, '', { maxAge: 0, path: '/' });
    }

    return response;
  }

  // Public paths — accessible without login
  const publicPaths = ['/login', '/api/auth', '/blog', '/apple-ids', '/giveaways'];
  
  // Exact match for '/' (Home), startsWith match for other public paths
  const isPublicPath = 
    pathname === '/' || 
    publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    // If logged in but NOT banned, don't allow visiting /login
    // Do not redirect POST requests (like Server Actions) to prevent RPC parsing failures
    if (isLoggedIn && pathname === '/login' && !req.auth?.user?.isBanned) {
      if (req.method === 'POST') {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const role = req.auth?.user?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
