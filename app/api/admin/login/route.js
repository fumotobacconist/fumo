import { NextResponse } from 'next/server';
import { COOKIE, checkPassword, createSession } from '@/lib/auth';
import { handler } from '@/lib/api';
import { query } from '@/lib/db';

// Failed attempts are counted in the database, so the lock holds across all server instances.
// Each IP gets 5 tries, then waits 15 minutes; across all IPs, 100 failures in 15 minutes pauses
// logins for everyone (a slow, distributed password guesser can't get far).
const PER_IP = 5;
const GLOBAL = 100;
const LOCK = "interval '15 minutes'";

export const POST = handler(async (req) => {
  // Vercel sets x-forwarded-for itself; clients can't spoof the first entry there.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const tooMany = NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });

  await query(`DELETE FROM login_attempts WHERE updated_at < now() - ${LOCK} AND (locked_until IS NULL OR locked_until < now())`);
  const [row] = await query(
    `SELECT (SELECT locked_until > now() FROM login_attempts WHERE ip = $1) AS locked,
            (SELECT coalesce(sum(fails), 0) FROM login_attempts WHERE updated_at > now() - ${LOCK}) AS recent`,
    [ip]
  );
  if (row.locked || Number(row.recent) >= GLOBAL) return tooMany;

  const { password } = await req.json();
  if (!(await checkPassword(password))) {
    await query(
      `INSERT INTO login_attempts (ip, fails) VALUES ($1, 1)
       ON CONFLICT (ip) DO UPDATE SET fails = login_attempts.fails + 1, updated_at = now(),
         locked_until = CASE WHEN login_attempts.fails + 1 >= ${PER_IP} THEN now() + ${LOCK} END`,
      [ip]
    );
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  await query('DELETE FROM login_attempts WHERE ip = $1', [ip]);
  const { token, maxAge } = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
  return res;
});
