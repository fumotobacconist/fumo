'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wordmark } from '@/components/Logo';

export default function Login() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = '/admin';
    else {
      setErr((await r.json().catch(() => ({}))).error || 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <motion.form className="login-box" onSubmit={submit} initial={{ opacity: 0, y: 30, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
        <Wordmark size={46} />
        <h1 className="d">Admin</h1>
        <label>
          <span className="lbl">Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" required />
        </label>
        <button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {err && <motion.p className="err" animate={{ x: [8, -6, 4, 0] }}>{err}</motion.p>}
      </motion.form>
    </div>
  );
}
