import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { COOKIE, verifySession } from '@/lib/auth';

const intl = createIntlMiddleware(routing);

async function adminGuard(req) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin')) return adminGuard(req);
  if (pathname.startsWith('/api/')) return NextResponse.next();
  return intl(req); // storefront: adds the language (/en, /ru; Armenian has no prefix)
}

// Everything except Next internals, static files, the iPhone icon, buy-link redirects and uploaded media.
// Admin paths are listed separately so a dot in the address (/api/admin/products/1.0) can't skip the guard.
export const config = { matcher: ['/((?!_next|_vercel|apple-icon|go/|media/|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'] };
