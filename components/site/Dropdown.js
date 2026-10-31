'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
);

// Minimal dropdown: a text button with a chevron and a small white card of links underneath.
// `children(close)` renders the <li> items; clicking outside or pressing Escape closes it.
export default function Dropdown({ button, label, className = '', align = 'center', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className={`dd ${open ? 'open' : ''} ${className}`}>
      <button type="button" className="dd-toggle" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open} aria-label={label}>
        {button}
        <Chevron />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul className={`dd-list ${align}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {children(() => setOpen(false))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
