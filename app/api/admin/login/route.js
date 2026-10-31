import { NextResponse } from 'next/server';
import { COOKIE, checkPassword, createSession } from '@/lib/auth';
import { handler } from '@/lib/api';

const attempts = new Map(); // ip -> { n, until }

export const POST = handler(async (req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const a = attempts.get(ip) || { n: 0, until: 0 };
  if (a.until > Date.now()) return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });

  const { password } = await req.json();
  if (!(await checkPassword(password))) {
    a.n += 1;
    if (a.n >= 5) Object.assign(a, { n: 0, until: Date.now() + 5 * 60_000 });
    attempts.set(ip, a);
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  attempts.delete(ip);
  const { token, maxAge } = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
  return res;
});
