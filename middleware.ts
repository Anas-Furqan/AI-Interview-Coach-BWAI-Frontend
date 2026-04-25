import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'ai_auth';
const ROLE_COOKIE = 'ai_role';

function getHomeForRole(role: string): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'RECRUITER') return '/recruiter/dashboard';
  return '/dashboard';
}

function redirectToAuth(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const role = String(request.cookies.get(ROLE_COOKIE)?.value || '').toUpperCase();

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/interview') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/report') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/recruiter') ||
    pathname.startsWith('/profile');

  if (isProtectedPath && !isAuthenticated) {
    return redirectToAuth(request);
  }

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/interview', request.url));
  }

  if (pathname.startsWith('/recruiter') && role !== 'RECRUITER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/interview', request.url));
  }
  
  if (pathname.startsWith('/interview') && role !== 'CANDIDATE') {
    if (role === 'RECRUITER') {
      return NextResponse.redirect(new URL('/recruiter/dashboard', request.url));
    } else if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/dashboard') && role !== 'CANDIDATE') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  if (pathname === '/auth' && isAuthenticated) {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
  }

  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json).*)'],
};
