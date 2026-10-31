'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';
import { LeafO } from '../Logo';
import { LanguageMenu } from './LanguageSwitcher';

const KEY = 'fumo_age_ok';

export default function AgeGate({ g }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  const accept = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="gate-box" role="dialog" aria-modal="true" aria-label={g.title} initial={{ y: 40, rotate: -2, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
            <Suspense><LanguageMenu className="gate-lang" align="right" /></Suspense>
            <LeafO style={{ width: 70, margin: '0 auto' }} />
            <h2 className="d outline">{g.title}</h2>
            <p>{g.text}</p>
            <div className="row">
              <button className="btn" onClick={accept}>{g.yes}</button>
              <a className="btn light" href={g.no_link || 'https://www.google.com'} rel="noopener noreferrer">{g.no}</a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
