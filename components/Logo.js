'use client';
import { motion } from 'framer-motion';

const veins = ['M44 56 L36 48', 'M50 50 L42 40', 'M56 44 L50 33', 'M44 56 L54 60', 'M50 50 L61 53', 'M56 44 L67 45'];

// The "O" of FUMO: a tobacco leaf inside a ring. `draw` animates the strokes in.
export function LeafO({ draw = false, delay = 0, className, style, fill = 'var(--accent)', stroke = 'var(--ink)' }) {
  const t = (i) => ({ duration: 1.2, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] });
  const P = draw ? motion.path : 'path';
  const anim = (i) => (draw ? { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true }, transition: t(i) } : {});
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="50" cy="50" r="44" strokeWidth="7" fill={fill} />
      <P d="M27 76 C 22 48, 44 22, 76 24 C 78 54, 56 80, 27 76 Z" strokeWidth="4.2" fill="var(--accent2)" {...anim(1)} />
      <P d="M29 74 Q 50 52, 70 30" strokeWidth="3" {...anim(3)} />
      {veins.map((d, i) => <P key={d} d={d} strokeWidth="2.4" {...anim(4 + i)} />)}
    </svg>
  );
}

// Built-in wordmark used when no logo image is uploaded.
export function Wordmark({ name = 'FUMO', size = 44 }) {
  const word = String(name || 'FUMO');
  const endsWithO = /o$/i.test(word);
  return (
    <span className="d" style={{ display: 'inline-flex', alignItems: 'flex-end', fontSize: size, lineHeight: 0.8, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
      {endsWithO ? word.slice(0, -1) : word}
      {endsWithO && <LeafO style={{ width: '0.82em', height: '0.82em', marginLeft: '0.03em', marginBottom: '0.01em' }} />}
    </span>
  );
}
