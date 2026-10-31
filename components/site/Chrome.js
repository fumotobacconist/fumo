'use client';
import Link from '@/components/site/L';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Wordmark } from '../Logo';
import Media, { SIZES } from './Media';
import PackArt from './PackArt';
import { ICONS, Icon } from './Icons';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher, { LanguageMenu } from './LanguageSwitcher';
import SearchBox from './SearchBox';

const ease = [0.22, 1, 0.36, 1];
const clamp = (v, min, max, d) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) && v !== '' ? Number(v) : d));

// Logo size / position from Admin → Brand & theme.
export const logoVars = (b) => ({
  '--logo-h': `${clamp(b.logo_height, 20, 220, 58)}px`,
  '--logo-hm': `${clamp(b.logo_height_mobile, 16, 140, 46)}px`,
  '--logo-y': `${clamp(b.logo_offset, -60, 120, 0)}px`,
});

const isExternal = (href) => /^https?:/i.test(href || '');
const ext = (href) => (isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {});

function Announcement({ a }) {
  const msgs = (a.messages || []).filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (msgs.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % msgs.length), 4500);
    return () => clearInterval(t);
  }, [msgs.length]);
  if (!a.enabled || !msgs.length) return null;
  const body = (
    <AnimatePresence mode="wait">
      <motion.span key={i} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35, ease }}>
        {msgs[i % msgs.length]}
      </motion.span>
    </AnimatePresence>
  );
  return (
    <div className="announce" style={{ background: a.bg, color: a.color }}>
      {a.link ? <a href={a.link} {...ext(a.link)}>{body}</a> : body}
    </div>
  );
}

// A big sidebar link. With dropdown links it gets an arrow that opens them in place.
function PrimaryItem({ item, onClose }) {
  const [open, setOpen] = useState(false);
  const children = (item.children || []).filter((c) => c.label?.trim());
  const label = item.label.trim();
  if (!children.length) {
    return (
      <Link href={item.href || '#'} className="sb-link" onClick={onClose} {...ext(item.href)}>
        {label}
      </Link>
    );
  }
  const toggle = () => setOpen((o) => !o);
  return (
    <>
      <div className="sb-row">
        {item.href ? (
          <Link href={item.href} className="sb-link" onClick={onClose} {...ext(item.href)}>{label}</Link>
        ) : (
          <button type="button" className="sb-link" onClick={toggle} aria-expanded={open}>{label}</button>
        )}
        <button type="button" className={`sb-toggle ${open ? 'open' : ''}`} onClick={toggle} aria-expanded={open} aria-label={`${open ? 'Close' : 'Open'} ${label}`}>
          {ICONS.chevron}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul className="sb-sub" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
            {children.map((c, j) => (
              <li key={j}>
                <Link href={c.href || '#'} onClick={onClose} {...ext(c.href)}>{c.label.trim()}</Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </>
  );
}

function Sidebar({ site, open, onClose, focusSearch }) {
  const t = useTranslations('nav');
  const sb = site.sidebar;
  const input = useRef(null);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    if (focusSearch) setTimeout(() => input.current?.focus(), 350);
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [open, onClose, focusSearch]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="sidebar" role="dialog" aria-modal="true" aria-label={t('menu')} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.45, ease }}>
            <div className="sb-top">
              <SearchBox inputRef={input} placeholder={sb.search_placeholder} onNavigate={onClose} />
              <button className="icon-btn" onClick={onClose} aria-label={t('closeMenu')}>{ICONS.close}</button>
            </div>
            <div className="sb-scroll">
              {/* Section 1: big bold links */}
              <ul className="sb-primary">
                {sb.primary.filter((l) => l.label?.trim()).map((l, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease }}>
                    <PrimaryItem item={l} onClose={onClose} />
                  </motion.li>
                ))}
              </ul>
              {sb.tiles?.some((t) => t.label || t.image) && (
                <div className="sb-tiles">
                  {sb.tiles.filter((t) => t.label || t.image).map((t, i) => (
                    <Link key={i} href={t.href || '#'} className="sb-tile" onClick={onClose} {...ext(t.href)}>
                      {t.image ? <Media src={t.image} alt={t.label} sizes={SIZES.side} /> : <PackArt name={t.label} brand={site.brand.name} />}
                      {t.label && <span className="d outline">{t.label}</span>}
                    </Link>
                  ))}
                </div>
              )}
              {/* Section 2: smaller links */}
              <ul className="sb-secondary">
                {sb.secondary.filter((l) => l.label).map((l, i) => (
                  <li key={i}>
                    <Link href={l.href || '#'} onClick={onClose} {...ext(l.href)}>
                      <Icon name={l.icon} /> {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="sb-lang">
                <span><Icon name="globe" /> {t('language')}</span>
                <Suspense><LanguageSwitcher full onPick={onClose} /></Suspense>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Chrome({ site }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const close = useRef(() => setOpen(false)).current;
  useEffect(() => setOpen(false), [pathname]);

  const openMenu = (withSearch) => {
    setSearch(withSearch);
    setOpen(true);
  };

  return (
    <>
      <Announcement a={site.announcement} />
      <header className="header" style={logoVars(site.brand)}>
        <div className="header-inner">
          <div>
            <button type="button" className="icon-btn burger" onClick={() => openMenu(false)} aria-label={t('openMenu')} aria-haspopup="dialog">{ICONS.menu}</button>
            <button type="button" className="shop-btn" onClick={() => openMenu(false)} aria-haspopup="dialog">
              {site.header.shop_label || 'Shop'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
          <Link href="/" className="logo" aria-label={`${site.brand.name} home`}>
            {site.brand.logo ? <Media src={site.brand.logo} alt={site.brand.name} eager /> : <Wordmark name={site.brand.name} size="calc(var(--lh) * 0.76)" />}
          </Link>
          <div className="icons">
            <Suspense><LanguageMenu className="header-lang" /></Suspense>
            <button className="icon-btn" onClick={() => openMenu(true)} aria-label={t('search')}>{ICONS.search}</button>
          </div>
        </div>
      </header>
      <Sidebar site={site} open={open} onClose={close} focusSearch={search} />
    </>
  );
}
