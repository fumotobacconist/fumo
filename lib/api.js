import { NextResponse } from 'next/server';
import { bumpContentVersion } from './l10n';

// Wrap admin route handlers: JSON errors, reject cross-site form posts, and refresh the
// storefront cache after any change so visitors see it straight away.
export function handler(fn) {
  return async (req, ctx) => {
    try {
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
