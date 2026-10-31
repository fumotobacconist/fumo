'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LOCALE_SHORT } from '@/i18n/config';
import Image from 'next/image';
import { isVideo } from '@/lib/site';
import { fileFromUrl, trimImage } from './trim';
import { LinkInput } from './LinkInput';
import { loadForEditing, removeBackground, toTrimmedPng } from './bgremove';

export const ease = [0.22, 1, 0.36, 1];

export async function api(path, method = 'GET', body) {
  const r = await fetch(`/api/admin/${path}`, {
    method,
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) {
    location.href = '/admin/login';
    throw new Error('Session expired');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

let uploadMode;
// Large files go straight from the browser to Blob when a read-write token is configured;
// otherwise they go through the server (4 MB cap on Vercel).
export async function uploadFile(file, onProgress) {
  uploadMode ??= await api('upload').catch(() => ({ client: false }));
  if (uploadMode.client) {
    const { upload } = await import('@vercel/blob/client');
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const blob = await upload(`site/file.${ext}`, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/upload/client',
      onUploadProgress: (e) => onProgress?.(e.percentage),
    });
    return blob.url;
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error('This file is over 4 MB. Paste a link to it instead, or enable large uploads (see README).');
  }
  const fd = new FormData();
  fd.append('file', file);
  return (await api('upload', 'POST', fd)).url;
}

// Immutable update of a nested value: setIn(obj, ['footer', 'columns', 0, 'title'], 'Shop')
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[k] = setIn(obj?.[k] ?? (typeof rest[0] === 'number' ? [] : {}), rest, value);
  return copy;
}

export const I = {
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></svg>,
  badge: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 12h10" /></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12V3h9l9 9-9 9-9-9z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 11l9-8 9 8M5 9v12h14V9" /></svg>,
  page: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6M9 13h8M9 17h6" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M3 12h12M3 18h18" /></svg>,
  foot: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15h18" /></svg>,
  brush: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 4l6 6-9 9H5v-6z" /><path d="M12 6l6 6" /></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17.9 17.9A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.1-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2M1 1l22 22" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 7.4H22l-6 4.6 2.3 7.6L12 17l-6.3 4.6L8 14 2 9.4h7.4z" /></svg>,
  starO: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2l2.6 7.4H22l-6 4.6 2.3 7.6L12 17l-6.3 4.6L8 14 2 9.4h7.4z" /></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
  up: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 15l6-6 6 6" /></svg>,
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 9l6 6 6-6" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  ext: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>,
  out: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg>,
};

/* ---------- translations ---------- */
// Which language the admin is editing. Translatable fields read/write that language.
export const EditLang = createContext('en');
export const useEditLang = () => useContext(EditLang);

const isTr = (v) => v && typeof v === 'object' && !Array.isArray(v);
// English text of a field that may be a plain string or { en, hy, ru }.
export const enText = (v) => (isTr(v) ? v.en ?? '' : v ?? '');
export const getText = (v, lang) => (lang === 'en' ? enText(v) : isTr(v) ? v[lang] ?? '' : '');
// Stores one language. Stays a plain string while only English is filled in.
export function setText(v, lang, text) {
  const next = isTr(v) ? { ...v } : { en: v ?? '' };
  next[lang] = text;
  const others = Object.entries(next).filter(([k, x]) => k !== 'en' && x);
  return others.length ? next : next.en;
}

// Props for an input bound to one language of a translatable value.
export function useTr(value, onChange, placeholder) {
  const lang = useEditLang();
  return {
    lang,
    value: getText(value, lang),
    onChange: (text) => onChange(setText(value, lang, text)),
    placeholder: lang === 'en' ? placeholder : enText(value) || placeholder,
  };
}

// A plain translatable input, for list items and link labels.
export function TInput({ value, onChange, placeholder, ...rest }) {
  const t = useTr(value, onChange, placeholder);
  return <input value={t.value} onChange={(e) => t.onChange(e.target.value)} placeholder={t.placeholder} {...rest} className={t.lang !== 'en' ? 'tr' : undefined} />;
}

export function Field({ label, hint, children, wide, lang }) {
  return (
    <label className={wide ? 'wide' : undefined}>
      <span className="lbl">{label}{lang && lang !== 'en' && <i className="lang-tag">{LOCALE_SHORT[lang]}</i>}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

// `t` makes the field translatable: it edits the language chosen in the admin sidebar.
// `lang` only shows the language tag (for fields whose value is already per-language).
export function Text({ label, hint, value, onChange, area, wide, t, lang: langTag, placeholder, ...rest }) {
  const tr = useTr(value, onChange, placeholder);
  const v = t ? tr.value : value;
  const set = t ? tr.onChange : onChange;
  const ph = t ? tr.placeholder : placeholder;
  const lang = t ? tr.lang : langTag;
  const cls = lang && lang !== 'en' ? 'tr' : undefined;
  return (
    <Field label={label} hint={hint} wide={wide || area} lang={lang}>
      {area ? (
        <textarea value={v ?? ''} onChange={(e) => set(e.target.value)} rows={3} placeholder={ph} className={cls} {...rest} />
      ) : (
        <input value={v ?? ''} onChange={(e) => set(e.target.value)} placeholder={ph} className={cls} {...rest} />
      )}
    </Field>
  );
}

export function Color({ label, value, onChange }) {
  const ok = /^#[0-9a-f]{6}$/i.test(value || '');
  return (
    <Field label={label}>
      <div className="color">
        <input type="color" value={ok ? value : '#000000'} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} />
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} maxLength={9} />
      </div>
    </Field>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" className="toggle-row" role="switch" aria-checked={!!on} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <span className={`switch ${on ? 'on' : ''}`} />
    </button>
  );
}

export function Range({ label, value, onChange, min, max, step = 1, unit = 'px', hint }) {
  return (
    <Field label={label} hint={hint}>
      <div className="range">
        <input type="range" min={min} max={max} step={step} value={value ?? min} onChange={(e) => onChange(Number(e.target.value))} />
        <input type="number" min={min} max={max} step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} aria-label={`${label} (${unit})`} />
        <span>{unit}</span>
      </div>
    </Field>
  );
}

// A link field with a page/category picker and a check that the address exists.
export function LinkField({ label, value, onChange, hint, linkLabel, placeholder, wide }) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      <LinkInput value={value} label={linkLabel} placeholder={placeholder} onChange={(v) => onChange(v)} />
    </Field>
  );
}

export function Select({ label, value, onChange, options, hint }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

// `thumb`: small, resized, lazily loaded preview for long lists (videos show a still).
export function Preview({ src, empty = 'Nothing yet', thumb = false }) {
  if (!src) return <span className="empty-media">{empty}</span>;
  if (src.startsWith('builtin:')) return <span className="empty-media">Built-in smoke</span>;
  if (isVideo(src)) return <video src={src} muted playsInline preload="metadata" {...(thumb ? {} : { autoPlay: true, loop: true })} />;
  if (thumb && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(src)) return <Image src={src} alt="" width={108} height={108} sizes="54px" loading="lazy" />;
  return <img src={src} alt="" loading="lazy" decoding="async" />;
}

// Upload an image / GIF / video, or paste a link to one.
// Preview + apply background removal for a product photo.
function BgRemover({ src, onClose, onApply, toast }) {
  const [source, setSource] = useState(null);
  const [strength, setStrength] = useState(30);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canvas = useRef(null);

  useEffect(() => {
    let live = true;
    loadForEditing(src).then((s) => live && setSource(s)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [src]);

  useEffect(() => {
    if (!source) return;
    const t = setTimeout(() => {
      const r = removeBackground(source, strength);
      setResult(r);
      const c = canvas.current;
      if (c) {
        c.width = source.w;
        c.height = source.h;
        c.getContext('2d').putImageData(r.imageData, 0, 0);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [source, strength]);

  const apply = async () => {
    setBusy(true);
    try {
      await onApply(await toTrimmedPng(result.imageData));
      onClose();
    } catch (e) {
      toast(e.message, false);
      setBusy(false);
    }
  };

  return (
    <motion.div className="modal-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-box" onClick={(e) => e.stopPropagation()} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <div className="drawer-head">
          <h2 className="d">Remove background</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">{I.close}</button>
        </div>
        <div className="bg-panes">
          <figure><figcaption>Before</figcaption><div className="bg-pane"><img src={src} alt="" crossOrigin="anonymous" /></div></figure>
          <figure>
            <figcaption>After {result ? `· ${Math.round(result.removed * 100)}% removed` : ''}</figcaption>
            <div className="bg-pane checker">{error ? <p className="err">{error}</p> : <canvas ref={canvas} />}</div>
          </figure>
        </div>
        <div className="bg-controls">
          <Range label="Strength" value={strength} onChange={(v) => setStrength(Number(v) || 1)} min={1} max={100} unit="" hint="Raise it if some background is left; lower it if parts of the product disappear." />
        </div>
        <div className="drawer-foot">
          <button type="button" className="abtn" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" disabled={!result || busy || !!error} onClick={apply}>{busy ? 'Saving…' : 'Use this image'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MediaInput({ label, hint, value, onChange, toast, video = true, empty, trim = false, removeBg = false }) {
  const [over, setOver] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const input = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(0);
    try {
      if (trim) file = await trimImage(file);
      onChange(await uploadFile(file, (p) => setBusy(Math.round(p))));
    } catch (e) {
      toast(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="wide">
      <span className="lbl">{label}</span>
      <div
        className={`drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files[0]); }}
      >
        <div className="drop-preview">{busy !== null ? <span className="empty-media">Uploading… {busy ? `${busy}%` : ''}</span> : <Preview src={value} empty={empty} />}</div>
        <div className="drop-side">
          <div className="acts">
            <button type="button" className="abtn" onClick={() => input.current.click()} disabled={busy !== null}>Upload file</button>
            {value && <button type="button" className="abtn danger" onClick={() => onChange('')}>Remove</button>}
            {trim && value && !value.startsWith('builtin:') && /\.(svg|png|webp|avif)(\?|$)/i.test(value) && (
              <button type="button" className="abtn" disabled={busy !== null} onClick={async () => {
                setBusy(0);
                try {
                  const original = await fileFromUrl(value);
                  const trimmed = await trimImage(original);
                  if (trimmed === original) toast('No empty space to trim');
                  else { onChange(await uploadFile(trimmed, (p) => setBusy(Math.round(p)))); toast('Empty space trimmed — publish to apply'); }
                } catch (e) {
                  toast(e.message, false);
                } finally {
                  setBusy(null);
                }
              }}>Trim empty space</button>
            )}
            {removeBg && value && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(value) && (
              <button type="button" className="abtn" disabled={busy !== null} onClick={() => setBgOpen(true)}>Remove background</button>
            )}
          </div>
          <input value={value?.startsWith('builtin:') ? '' : value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a link (https://…)" />
          <span className="hint">{hint || (video ? 'Image, SVG, GIF or video (MP4 / WebM). Drag & drop works too.' : 'JPG, PNG, SVG, WebP or GIF.')}</span>
          <input
            ref={input}
            type="file"
            hidden
            accept={video ? 'image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/avif'}
            onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }}
          />
        </div>
      </div>
      <AnimatePresence>
        {bgOpen && (
          <BgRemover
            src={value}
            onClose={() => setBgOpen(false)}
            onApply={async (file) => {
              const url = await uploadFile(file);
              onChange(url);
              toast('Background removed — save to keep it');
            }}
            toast={toast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Reorderable list editor. `render(item, update)` draws the fields of one row.
export function ListEditor({ items, onChange, render, blank, addLabel = 'Add', max = 50 }) {
  const list = items || [];
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="list wide">
      <AnimatePresence initial={false}>
        {list.map((item, i) => (
          <motion.div key={i} className="list-row" layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
            <div className="list-fields">{render(item, (v) => onChange(list.map((x, k) => (k === i ? v : x))), i)}</div>
            <div className="list-acts">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">{I.up}</button>
              <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">{I.down}</button>
              <button type="button" className="icon-btn del" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Remove">{I.trash}</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {list.length < max && (
        <button type="button" className="abtn add" onClick={() => onChange([...list, typeof blank === 'function' ? blank() : structuredClone(blank)])}>
          {I.plus} {addLabel}
        </button>
      )}
    </div>
  );
}

// Label + link rows, optionally with an icon picker.
export function LinksEditor({ items, onChange, icons, addLabel = 'Add link' }) {
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      addLabel={addLabel}
      blank={icons ? { label: '', href: '', icon: icons[0] } : { label: '', href: '' }}
      render={(l, set) => (
        <>
          <TInput value={l.label} onChange={(v) => set({ ...l, label: v })} placeholder="Label" aria-label="Label" />
          <LinkInput value={l.href} label={enText(l.label)} onChange={(href, label) => set({ ...l, href, label: enText(l.label) ? l.label : label || '' })} />
          {icons && (
            <select value={l.icon} onChange={(e) => set({ ...l, icon: e.target.value })} aria-label="Icon">
              {icons.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </>
      )}
    />
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, ok = true) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const view = (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.ok ? 'ok' : 'bad'}`} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  return [push, view];
}

export function Panel({ title, desc, children, actions }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="d">{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
        {actions}
      </div>
      <div className="form">{children}</div>
    </section>
  );
}
