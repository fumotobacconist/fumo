import { NextResponse } from 'next/server';
import { COOKIE, verifySession } from './auth';
import { bumpContentVersion } from './l10n';

// Admin routes check the session themselves too, so a request that slips past the middleware
// (e.g. /api/admin/products/1.0, which the matcher used to skip) is still refused.
export const isAdmin = (req) => verifySession(req.cookies.get(COOKIE)?.value);

// Wrap admin route handlers: login check, JSON errors, reject cross-site form posts, and refresh
// the storefront cache after any change so visitors see it straight away.
export function handler(fn) {
  return async (req, ctx) => {
    try {
      if (new URL(req.url).pathname !== '/api/admin/login' && !(await isAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (req.method !== 'GET') {
        const origin = req.headers.get('origin');
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
        if (origin && new URL(origin).host !== host) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
      }
      const res = await fn(req, ctx);
      if (req.method !== 'GET' && res.ok && !/\/api\/admin\/(login|logout|upload)/.test(new URL(req.url).pathname)) await bumpContentVersion();
      return res;
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Server error' }, { status: 400 });
    }
  };
}
