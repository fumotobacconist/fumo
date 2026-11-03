// Edge- and Node-compatible session signing (used by middleware and API routes).
export const COOKIE = 'fumo_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

async function hmac(data) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]);
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// The signature covers the admin password too, so changing ADMIN_PASSWORD (or SESSION_SECRET)
// logs out every existing session.
const sessionSig = (exp) => hmac(`session:${exp}:${process.env.ADMIN_PASSWORD || ''}`);

export async function createSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return { token: `${exp}.${await sessionSig(exp)}`, maxAge: MAX_AGE };
}

export async function verifySession(token) {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const [exp, sig] = token.split('.');
  if (!/^\d+$/.test(exp || '') || !sig || Number(exp) < Date.now() / 1000) return false;
  try {
    return safeEqual(sig, await sessionSig(exp));
  } catch {
    return false;
  }
}

export async function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  // Compare HMACs so length differences don't leak.
  return safeEqual(await hmac('pw:' + String(pw)), await hmac('pw:' + real));
}
