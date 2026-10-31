'use client';
import { createContext, useContext, useState } from 'react';
import { displayName, productPath } from '@/lib/site';

// Pages, categories and products the admin can link to, plus helpers to create missing ones.
export const LinkTargets = createContext({ pages: [], categories: [], products: [] });

const humanize = (slug) => slug.replace(/-+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

// Works out whether an internal link points at something that exists.
export function linkStatus(href, { pages = [], categories = [], brands = [], badges = [] }) {
  const v = String(href || '').trim();
  if (!v || !v.startsWith('/') || v.startsWith('//')) return { ok: true };
  const path = v.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const badge = new URLSearchParams(v.split('?')[1] || '').get('badge');
  if (badge && (path === '/c/all' || path.startsWith('/c/')) && !badges.some((b) => b.slug === badge)) {
    return { text: 'No badge with this name yet.', create: { kind: 'badge', name: badge.replace(/-+/g, ' ').toUpperCase(), slug: badge } };
  }
  if (['/', '/search', '/c/all', '/b'].includes(path)) return { ok: true };
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'p') return { ok: true };
  if (parts[0] === 'b') {
    if (parts.length !== 2) return { text: 'Brand addresses look like /b/brand-name.' };
    if (brands.some((b) => b.slug === parts[1])) return { ok: true };
    return { text: 'No brand at this address yet.', create: { kind: 'brand', name: humanize(parts[1]), slug: parts[1] } };
  }
  if (parts[0] === 'c') {
    if (parts.length === 2) {
      const c = categories.find((x) => x.slug === parts[1]);
      if (c) return c.path === path ? { ok: true } : { fix: c.path, text: `“${c.name}” lives at ${c.path}` };
      return { text: `No category at this address yet.`, create: { kind: 'category', name: humanize(parts[1]), slug: parts[1] } };
    }
    if (parts.length === 3) {
      const parent = categories.find((x) => x.slug === parts[1]);
      const child = categories.find((x) => x.slug === parts[2]);
      if (child && child.path === path) return { ok: true };
      if (child) return { fix: child.path, text: `“${child.name}” lives at ${child.path}` };
      if (!parent) return { text: `There’s no “${humanize(parts[1])}” category, so this subcategory can’t exist yet. Create that category first.` };
      if (parent.parent_id) return { text: `“${parent.name}” is already a subcategory — subcategories only go one level deep.` };
      return { text: `No subcategory at this address yet.`, create: { kind: 'subcategory', name: humanize(parts[2]), slug: parts[2], parent } };
    }
    return { text: 'Category addresses have at most two parts, like /c/420-gear/grinders.' };
  }
  if (parts.length === 1) {
    const page = pages.find((p) => p.slug === parts[0]);
    if (page) return page.published ? { ok: true } : { text: `“${page.title}” is still a draft — publish it in Pages, or visitors will see “not found”.` };
    return { text: 'No page at this address yet.', create: { kind: 'page', name: humanize(parts[0]), slug: parts[0] } };
  }
  return { text: 'Nothing lives at this address. Pages use one-part addresses (/grinders); subcategories use /c/category/subcategory.' };
}

export function LinkInput({ value, onChange, label = '', placeholder = '/c/all or https://…' }) {
  const t = useContext(LinkTargets);
  const [busy, setBusy] = useState(false);
  // The option list (every page, category, brand and product) is only built when the picker is opened.
  const [loaded, setLoaded] = useState(false);
  const status = linkStatus(value, t);

  const pick = (e) => {
    const v = e.target.value;
    if (!v) return;
    const opt = e.target.selectedOptions[0];
    onChange(v, opt?.dataset.label || '');
    e.target.value = '';
  };

  const create = async () => {
    const c = status.create;
    setBusy(true);
    try {
      if (c.kind === 'page') await t.createPage?.({ title: label.trim() || c.name, slug: c.slug });
      else if (c.kind === 'badge') await t.createBadge?.({ name: c.name }); // name must match the link's ?badge= value
      else if (c.kind === 'brand') await t.createBrand?.({ name: label.trim() || c.name, slug: c.slug });
      else await t.createCategory?.({ name: label.trim() || c.name, slug: c.slug, parent_id: c.parent?.id || null });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="linkin">
      <div className="linkin-row">
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Link" className={status.ok ? '' : 'warn'} />
        <select value="" onChange={pick} onFocus={() => setLoaded(true)} onMouseDown={() => setLoaded(true)} onTouchStart={() => setLoaded(true)} aria-label="Choose what to link to" title="Choose a page, category or product">
          <option value="">Choose…</option>
          {loaded && (
            <>
          <optgroup label="Shop">
            <option value="/" data-label="Home">Home</option>
            <option value="/c/all" data-label="Shop all">Shop all</option>
            <option value="/c/all?sort=new" data-label="Newest first">Newest first (by date added)</option>
            <option value="/c/all?featured=1" data-label="Featured">Featured products</option>
            <option value="#contact" data-label="Contact">Contact (footer)</option>
            <option value="/b" data-label="Brands">All brands</option>
          </optgroup>
          {t.categories.length > 0 && (
            <optgroup label="Categories">
              {t.categories.map((c) => (
                <option key={c.id} value={c.path} data-label={c.name}>{c.parent_id ? `   ↳ ${c.name}` : c.name}</option>
              ))}
            </optgroup>
          )}
          {t.badges?.length > 0 && (
            <optgroup label="Badges">
              {t.badges.map((b) => (
                <option key={b.id} value={`/c/all?badge=${b.slug}`} data-label={b.name}>{b.name}</option>
              ))}
            </optgroup>
          )}
          {t.brands?.length > 0 && (
            <optgroup label="Brands">
              {t.brands.map((b) => (
                <option key={b.id} value={b.path} data-label={b.name}>{b.name}</option>
              ))}
            </optgroup>
          )}
          {t.pages.length > 0 && (
            <optgroup label="Pages">
              {t.pages.map((p) => (
                <option key={p.id} value={`/${p.slug}`} data-label={p.title}>{p.title}{p.published ? '' : ' (draft)'}</option>
              ))}
            </optgroup>
          )}
          {t.products.length > 0 && (
            <optgroup label="Products">
              {t.products.map((p) => (
                <option key={p.id} value={productPath(p)} data-label={displayName(p)}>{displayName(p)}</option>
              ))}
            </optgroup>
          )}
            </>
          )}
        </select>
      </div>
      {!status.ok && (
        <div className="linkin-warn">
          <span>⚠ {status.text}</span>
          {status.fix && <button type="button" className="abtn sm" onClick={() => onChange(status.fix)}>Use {status.fix}</button>}
          {status.create && (
            <button type="button" className="abtn sm" disabled={busy} onClick={create}>
              {busy ? 'Creating…' : status.create.kind === 'subcategory'
                ? `Create subcategory “${label.trim() || status.create.name}” in ${status.create.parent.name}`
                : `Create ${status.create.kind} “${status.create.kind === 'badge' ? status.create.name : label.trim() || status.create.name}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
