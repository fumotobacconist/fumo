'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { localePath } from '@/i18n/config';
import { ICONS } from './Icons';

// Search input with live suggestions (ranked, typo-tolerant — see /api/search).
export default function SearchBox({ defaultValue = '', placeholder, inputRef, onNavigate }) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [res, setRes] = useState(null);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(null);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`).then((x) => x.json());
        if (id === seq.current) {
          setRes(r);
          setActive(-1);
        }
      } catch {}
    }, 160);
    return () => clearTimeout(timer);
  }, [q, locale]);

  const go = (path) => {
    setOpen(false);
    onNavigate?.();
    router.push(path.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/');
  };

  const onKeyDown = (e) => {
    const items = res?.items || [];
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % items.length); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); go(items[active].path); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const show = open && res && q.trim().length >= 2;
  return (
    <div className="search-box" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <form className="sb-search" action={localePath('/search', locale)} onSubmit={() => { setOpen(false); onNavigate?.(); }} role="search">
        <input
          ref={inputRef}
          name="q"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={t('title')}
          autoComplete="off"
          role="combobox"
          aria-expanded={!!show}
          aria-controls="search-suggest"
        />
        <button aria-label={t('title')}>{ICONS.search}</button>
      </form>
      {show && (
        <div className="suggest" id="search-suggest" role="listbox">
          {res.items.length ? (
            <>
              {res.items.map((p, i) => (
                <a key={p.id} href={p.path} role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); go(p.path); }}>
                  <span className="suggest-img">{p.image && !/\.(mp4|webm|mov)(\?|$)/i.test(p.image) ? <img src={p.image} alt="" loading="lazy" /> : null}</span>
                  <span className="suggest-text"><b>{p.name}</b>{p.sub && <small>{p.sub}</small>}</span>
                  {p.price && <span className="suggest-price">{p.price}</span>}
                </a>
              ))}
              <a className="suggest-all" href={`${localePath('/search', locale)}?q=${encodeURIComponent(q.trim())}`} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); go(`/search?q=${encodeURIComponent(q.trim())}`); }}>
                {t('seeAll', { count: res.total })} {ICONS.arrow}
              </a>
            </>
          ) : (
            <p className="suggest-empty">{t('noSuggestions')}</p>
          )}
        </div>
      )}
    </div>
  );
}
