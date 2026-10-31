'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const ROWS = 50;
import { I, MediaInput, Preview, Text, Toggle, api, ease, useEditLang } from './ui';
import { badgeColor, displayName } from '@/lib/site';
import { LOCALE_SHORT } from '@/i18n/config';

const host = (u) => {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; }
};

/* ---------- product drawer ---------- */
const EMPTY = { name: '', brand_id: '', category_id: '', description: '', notes: '', weight: '', strength: '', price: '', compare_price: '', badge: '', image: '', image2: '', redirect_url: '', button_label: '', featured: false, visible: true, sort_order: 0 };

// Field props for per-row translations: English edits the field itself, other languages edit
// row.translations[lang][field] with the English text as a hint.
function trField(row, setRow, field, lang, english = {}) {
  if (lang === 'en') return { value: row[field], onChange: (v) => setRow((s) => ({ ...s, [field]: v })), ...english };
  return {
    lang,
    value: row.translations?.[lang]?.[field] ?? '',
    placeholder: row[field] || english.placeholder,
    onChange: (v) => setRow((s) => ({ ...s, translations: { ...s.translations, [lang]: { ...s.translations?.[lang], [field]: v } } })),
  };
}

// Badge picker: one of the managed badges (Badges tab), with quick-add.
function BadgeField({ f, setF, badges, setBadges, toast }) {
  const current = (f.badge || '').toUpperCase();
  const known = badges.some((b) => b.name === current);
  const pick = async (v) => {
    if (v !== '__new') return setF((s) => ({ ...s, badge: v }));
    const name = prompt('New badge, e.g. COMING SOON');
    if (!name?.trim()) return;
    try {
      const res = await api('badges', 'POST', { name, sort_order: badges.length });
      setBadges(res.badges);
      setF((s) => ({ ...s, badge: res.name }));
      toast(`Badge “${res.name}” added`);
    } catch (e) {
      toast(e.message, false);
    }
  };
  return (
    <label className="wide">
      <span className="lbl">Badge</span>
      <select value={current} onChange={(e) => pick(e.target.value)}>
        <option value="">— No badge —</option>
        {badges.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        {current && !known && <option value={current}>{current} (not in the badge list)</option>}
        <option value="__new">＋ New badge…</option>
      </select>
      <span className="hint">Shown on the product tile and used by the Status filter. Manage names, colours and translations in the Badges tab.</span>
    </label>
  );
}

function brandOf(f, brands) {
  return brands.find((b) => String(b.id) === String(f.brand_id));
}

function shownAs(f, brands) {
  const b = brandOf(f, brands);
  return f.name && b ? `Shown on the site as “${displayName({ name: f.name, brand_name: b.name })}”` : undefined;
}

// Brand picker for a product, with quick-add and a tidy-up for names that repeat the brand.
function BrandField({ f, setF, brands, setBrands, toast }) {
  const b = brandOf(f, brands);
  const repeats = b && f.name.trim().toLowerCase().startsWith(b.name.toLowerCase() + ' ');
  const pick = async (v) => {
    if (v !== '__new') return setF((s) => ({ ...s, brand_id: v }));
    const name = prompt('New brand name, e.g. The Bulldog');
    if (!name?.trim()) return;
    try {
      const res = await api('brands', 'POST', { name: name.trim() });
      setBrands(res.brands);
      setF((s) => ({ ...s, brand_id: res.id }));
      toast(`Brand “${name.trim()}” added`);
    } catch (e) {
      toast(e.message, false);
    }
  };
  return (
    <label className="wide">
      <span className="lbl">Brand</span>
      <select value={f.brand_id ?? ''} onChange={(e) => pick(e.target.value)}>
        <option value="">— No brand —</option>
        {brands.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        <option value="__new">＋ New brand…</option>
      </select>
      {repeats ? (
        <span className="hint">
          The name starts with “{b.name}” — the brand is added automatically, so you can{' '}
          <button type="button" className="abtn sm" onClick={() => setF((s) => ({ ...s, name: s.name.trim().slice(b.name.length).trim() }))}>remove it from the name</button>
        </span>
      ) : (
        <span className="hint">Shown before the product name and used for brand pages and filters.</span>
      )}
    </label>
  );
}

// Extra categories the product also appears in, as a checklist (main category excluded).
function ExtraCategories({ f, setF, categories }) {
  const ids = f.extra_category_ids || [];
  const options = categories.filter((c) => String(c.id) !== String(f.category_id));
  if (!options.length) return null;
  const toggle = (id) => setF((s) => {
    const cur = s.extra_category_ids || [];
    return { ...s, extra_category_ids: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
  });
  return (
    <div className="wide">
      <span className="lbl">Also show in</span>
      <div className="checks">
        {options.map((c) => (
          <label key={c.id} className={`check ${c.parent_id ? 'sub' : ''} ${ids.includes(c.id) ? 'on' : ''}`}>
            <input type="checkbox" checked={ids.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.parent_name ? `${c.parent_name} › ${c.name}` : c.name}
          </label>
        ))}
      </div>
      <span className="hint">The product is listed in every ticked category as well as its main one.</span>
    </div>
  );
}

function ProductDrawer({ product, categories, brands, setBrands, badges, setBadges, onClose, onSaved, onDuplicate, toast, defaultLabel }) {
  const [f, setF] = useState(() => ({
    ...EMPTY,
    ...product,
    category_id: product ? product.category_id ?? '' : categories[0]?.id ?? '',
    brand_id: product?.brand_id ?? '',
    extra_category_ids: (product?.extra_categories || []).map((c) => c.id),
    featured: !!product?.featured,
    visible: product ? !!product.visible : true,
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const lang = useEditLang();
  const tf = (field, english) => trField(f, setF, field, lang, english);
  const urlOk = !f.redirect_url || /^https?:\/\/[^\s]+\.[^\s]+/i.test(f.redirect_url.trim());

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = product?.id ? await api(`products/${product.id}`, 'PUT', f) : await api('products', 'POST', f);
      onSaved(saved, !product?.id);
    } catch (err) {
      toast(err.message, false);
      setBusy(false);
    }
  };

  return (
    <>
      <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.form className="drawer" onSubmit={save} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease }}>
        <div className="drawer-head">
          <h2 className="d">{product?.id ? 'Edit product' : product?.copyOf ? 'Duplicate product' : 'New product'}</h2>
          <div className="acts">
            {product?.id && <button type="button" className="abtn" onClick={() => onDuplicate(f)} title="Start a new product from these details">{I.copy} Duplicate</button>}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">{I.close}</button>
          </div>
        </div>
        <div className="drawer-body form">
          {product?.copyOf && <p className="copy-note wide">Copy of “{product.copyOf}”. Change what’s different (name, photo, link…) and click “Create product” — the original isn’t touched.</p>}
          <BrandField f={f} setF={setF} brands={brands} setBrands={setBrands} toast={toast} />
          <Text label="Product name *" value={f.name} onChange={set('name')} required placeholder={f.brand_id ? 'e.g. Grinder Metal 3-Part Dadara' : 'e.g. Black Noir Blend'} wide hint={shownAs(f, brands)} />

          <div className="fieldset wide">
            <h3>Buy button</h3>
            <label className="wide">
              <span className="lbl">Redirect URL</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={f.redirect_url} onChange={(e) => set('redirect_url')(e.target.value)} placeholder="https://…" inputMode="url" className={urlOk ? '' : 'bad'} />
                {f.redirect_url && urlOk && <a className="icon-btn boxed" href={f.redirect_url} target="_blank" rel="noopener noreferrer" title="Test link">{I.ext}</a>}
              </div>
              <span className="hint" style={urlOk ? undefined : { color: '#d33' }}>
                {urlOk ? 'Where the buy button sends visitors (shop, Instagram post, WhatsApp…). Leave empty to show “Currently unavailable”.' : 'Must be a full link starting with https://'}
              </span>
            </label>
            <Text label="Button text" {...tf('button_label', { placeholder: defaultLabel })} hint={`Empty = “${defaultLabel}”`} wide />
          </div>

          <MediaInput label="Main photo" value={f.image} onChange={set('image')} toast={toast} removeBg empty="No photo — a FUMO pack is drawn" hint="Shown on the grey tile. Photo on a white or plain background? Use “Remove background” after uploading." />
          <MediaInput label="Hover photo (optional)" value={f.image2} onChange={set('image2')} toast={toast} removeBg hint="Shown when a visitor hovers the product card, and as a second photo on the product page." />

          <label>
            <span className="lbl">Main category</span>
            <select value={f.category_id ?? ''} onChange={(e) => set('category_id')(e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_name ? `${c.parent_name} › ${c.name}` : c.name}</option>)}
            </select>
            <span className="hint">Used for the product’s breadcrumbs.</span>
          </label>
          <ExtraCategories f={f} setF={setF} categories={categories} />
          <Text label="Price" value={f.price} onChange={set('price')} placeholder="5 000 AMD" />
          <Text label="Old price (optional)" value={f.compare_price} onChange={set('compare_price')} placeholder="6 500 AMD" hint="Shown crossed out next to the price." />
          <Text label="Subtitle" {...tf('subtitle', { placeholder: 'e.g. Ribbon cut · Virginia / Burley' })} hint="Short line under the name on product cards and the product page." />
          <Text label="Flavour" {...tf('notes', { placeholder: 'e.g. Dark Molasses, Black Currant' })} hint="Leave empty for products without a flavour." />
          <Text label="Description" {...tf('description', { placeholder: 'Tell the story of this blend…' })} area />
          <Text label="Weight" {...tf('weight', { placeholder: 'e.g. 250g' })} />
          <Text label="Size" {...tf('size', { placeholder: 'e.g. 70cm · 1.5m · 55mm' })} />
          <Text label="Strength" {...tf('strength', { placeholder: 'e.g. Medium' })} />
          <Text label="Nicotine" {...tf('nicotine', { placeholder: 'e.g. 1.2%' })} />
          <BadgeField f={f} setF={setF} badges={badges} setBadges={setBadges} toast={toast} />
          <Toggle on={f.visible} onChange={set('visible')} label="Visible on site" />
          <Toggle on={f.featured} onChange={set('featured')} label="Featured (Fresh drops / Bestsellers)" />
          <Text label="Sort order" type="number" value={f.sort_order} onChange={set('sort_order')} hint="Lower numbers come first." />
        </div>
        <div className="drawer-foot">
          <button type="button" className="abtn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !urlOk}>{busy ? 'Saving…' : product?.id ? 'Save changes' : 'Create product'}</button>
        </div>
      </motion.form>
    </>
  );
}

/* ---------- products tab ---------- */
export function ProductsTab({ products, setProducts, categories, brands, setBrands, badges, setBadges, toast, site }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [brand, setBrand] = useState('');
  // Long lists render 50 rows at a time; more appear while scrolling.
  const [shown, setShown] = useState(ROWS);
  const moreRef = useRef(null);
  useEffect(() => setShown(ROWS), [q, cat, brand]);
  useEffect(() => {
    if (!moreRef.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((n) => n + ROWS), { rootMargin: '400px' });
    io.observe(moreRef.current);
    return () => io.disconnect();
  });
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const inOne = (id) => String(id) === cat || String(categories.find((c) => c.id === id)?.parent_id) === cat;
    const inCat = (p) => !cat || inOne(p.category_id) || (p.extra_categories || []).some((c) => inOne(c.id));
    return products.filter((p) => inCat(p) && (!brand || String(p.brand_id) === brand) && (!s || `${p.brand_name || ''} ${p.name} ${p.subtitle || ''} ${p.notes} ${p.badge}`.toLowerCase().includes(s)));
  }, [products, q, cat, brand, categories]);

  const patch = async (p, data) => {
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...data } : x)));
    try {
      await api(`products/${p.id}`, 'PUT', data);
    } catch (e) {
      toast(e.message, false);
      setProducts((ps) => ps.map((x) => (x.id === p.id ? p : x)));
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    try {
      await api(`products/${p.id}`, 'DELETE');
      setProducts((ps) => ps.filter((x) => x.id !== p.id));
      toast('Product deleted');
    } catch (e) {
      toast(e.message, false);
    }
  };

  // Opens the editor pre-filled with a copy of a product (or of unsaved edits to it).
  const duplicate = (p) => {
    const { id, clicks, created_at, updated_at, ...rest } = p;
    setEditing(null);
    setTimeout(() => setEditing({
      ...rest,
      copyOf: displayName(p),
      name: `${p.name} (copy)`,
      extra_categories: p.extra_categories || (p.extra_category_ids || []).map((cid) => ({ id: cid })),
    }), 0);
  };

  const saved = async (p, created) => {
    setProducts(await api('products'));
    setEditing(null);
    toast(created ? `“${p.name}” created` : 'Changes saved');
  };

  const catName = (id) => {
    const c = categories.find((x) => x.id === id);
    return c ? (c.parent_name ? `${c.parent_name} › ${c.name}` : c.name) : '—';
  };
  const clicks = products.reduce((n, p) => n + p.clicks, 0);
  const noLink = products.filter((p) => !p.redirect_url).length;

  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Products</h1>
          <p>Each product’s buy button sends visitors to its own link.</p>
        </div>
        <button className="btn" onClick={() => setEditing({})}>{I.plus} New product</button>
      </div>
      <div className="kpis">
        <div className="kpi"><b>{products.length}</b><span>Products</span></div>
        <div className="kpi"><b>{products.filter((p) => p.visible).length}</b><span>Visible</span></div>
        <div className="kpi"><b>{clicks}</b><span>Buy clicks</span></div>
        <div className={`kpi ${noLink ? 'warn' : ''}`}><b>{noLink}</b><span>Missing link</span></div>
      </div>
      <div className="toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_name ? `${c.parent_name} › ${c.name}` : c.name}</option>)}
        </select>
        {brands.length > 0 && (
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>
      {list.length === 0 ? (
        <div className="blank">{products.length ? 'No products match your search.' : 'No products yet — create your first one.'}</div>
      ) : (
        <div className="plist">
            {list.slice(0, shown).map((p) => (
              <div key={p.id} className={`prow ${p.visible && p.brand_visible !== 0 && p.badge_visible !== 0 ? '' : 'hidden'}`}>
                <div className="thumb">{p.image ? <Preview src={p.image} thumb /> : <span>{p.name[0]}</span>}</div>
                <div className="pmain">
                  <div className="pname">{displayName(p)}{p.badge && <small>{p.badge}</small>}</div>
                  <div className="sub">{catName(p.category_id)}{p.extra_categories?.length ? ` +${p.extra_categories.length} more` : ''} · {p.price || 'no price'}{p.brand_visible === 0 && <em className="hid-by"> · hidden with brand {p.brand_name}</em>}{p.badge_visible === 0 && <em className="hid-by"> · hidden with badge {p.badge}</em>}</div>
                </div>
                <div className="c-link">
                  {p.redirect_url ? <a className="link" href={p.redirect_url} target="_blank" rel="noopener noreferrer" title={p.redirect_url}>↗ {host(p.redirect_url)}</a> : <span className="link none">No link</span>}
                </div>
                <div className="c-clicks" title="Buy-button clicks"><b>{p.clicks}</b> clicks</div>
                <div className="acts">
                  <button className={`icon-btn ${p.featured ? 'on' : ''}`} title={p.featured ? 'Featured' : 'Mark as featured'} onClick={() => patch(p, { featured: p.featured ? 0 : 1 })}>{p.featured ? I.star : I.starO}</button>
                  <button className="icon-btn" title={p.visible ? 'Hide from site' : 'Show on site'} onClick={() => patch(p, { visible: p.visible ? 0 : 1 })}>{p.visible ? I.eye : I.eyeOff}</button>
                  <button className="icon-btn" title="Edit" onClick={() => setEditing(p)}>{I.edit}</button>
                  <button className="icon-btn" title="Duplicate" onClick={() => duplicate(p)}>{I.copy}</button>
                  <button className="icon-btn del" title="Delete" onClick={() => remove(p)}>{I.trash}</button>
                </div>
              </div>
            ))}
          {shown < list.length && (
            <div ref={moreRef} className="list-more">
              <button className="abtn" onClick={() => setShown((n) => n + ROWS)}>Show more ({list.length - shown} left)</button>
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {editing && (
          <ProductDrawer key={editing.id || (editing.copyOf ? `copy-${editing.copyOf}` : 'new')} product={editing.id || editing.copyOf ? editing : null} onDuplicate={duplicate} categories={categories} brands={brands} setBrands={setBrands} badges={badges} setBadges={setBadges} onClose={() => setEditing(null)} onSaved={saved} toast={toast} defaultLabel={site.product_page.buy_label || 'Buy now'} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- categories tab ---------- */
export function CategoriesTab({ categories, setCategories, toast, onChanged }) {
  const lang = useEditLang();
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [drafts, setDrafts] = useState({});
  const tops = categories.filter((c) => !c.parent_id);

  const add = async (e) => {
    e.preventDefault();
    try {
      setCategories(await api('categories', 'POST', { name, parent_id: parent || null, sort_order: categories.filter((c) => String(c.parent_id || '') === parent).length }));
      setName('');
      toast(parent ? 'Subcategory added' : 'Category added');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const save = async (c) => {
    try {
      setCategories(await api(`categories/${c.id}`, 'PUT', { ...c, ...drafts[c.id] }));
      setDrafts((d) => ({ ...d, [c.id]: undefined }));
      onChanged();
      toast('Category saved');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const remove = async (c) => {
    const kids = categories.filter((x) => x.parent_id === c.id).length;
    if (!confirm(`Delete category “${c.name}”? Its products stay, without a category.${kids ? ` Its ${kids} subcategor${kids === 1 ? 'y becomes a' : 'ies become'} top-level.` : ''}`)) return;
    try {
      setCategories(await api(`categories/${c.id}`, 'DELETE'));
      onChanged();
      toast('Category deleted');
    } catch (err) {
      toast(err.message, false);
    }
  };

  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Categories</h1>
          <p>Each category gets its own page. Put a category inside another to make a subcategory — e.g. Grinders inside 420 Gear lives at <code>/c/420-gear/grinders</code>, and 420 Gear also shows its products.</p>
        </div>
      </div>
      <form className="panel inline-add" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name, e.g. Grinders" required />
        <select value={parent} onChange={(e) => setParent(e.target.value)} aria-label="Inside" style={{ width: 'auto', flex: '0 1 240px' }}>
          <option value="">Top-level category</option>
          {tops.map((c) => <option key={c.id} value={c.id}>Inside: {c.name}</option>)}
        </select>
        <button className="btn">{I.plus} Add</button>
      </form>
      {categories.map((c) => {
        const d = { ...c, ...drafts[c.id] };
        const dirty = d.name !== c.name || Number(d.sort_order) !== c.sort_order || (d.image || '') !== (c.image || '') || String(d.parent_id || '') !== String(c.parent_id || '') || JSON.stringify(d.translations || {}) !== JSON.stringify(c.translations || {});
        const upd = (k) => (v) => setDrafts((s) => ({ ...s, [c.id]: { ...s[c.id], [k]: v } }));
        const hasKids = categories.some((x) => x.parent_id === c.id);
        return (
          <section key={c.id} className={`panel cat-row ${c.parent_id ? 'sub' : ''}`}>
            <div className="form">
              <Text label={c.parent_id ? 'Subcategory name' : 'Name'} {...trField(d, (fn) => setDrafts((s) => ({ ...s, [c.id]: fn({ ...c, ...s[c.id] }) })), 'name', lang)} hint={`${c.product_count} product(s)`} />
              <label>
                <span className="lbl">Inside</span>
                <select value={d.parent_id || ''} onChange={(e) => upd('parent_id')(e.target.value ? Number(e.target.value) : null)} disabled={hasKids}>
                  <option value="">— Top level —</option>
                  {tops.filter((t) => t.id !== c.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <span className="hint">{hasKids ? 'Has its own subcategories, so it stays top-level.' : 'Make it a subcategory of another category.'}</span>
              </label>
              <Text label="Order" type="number" value={d.sort_order} onChange={upd('sort_order')} />
              <label>
                <span className="lbl">Web address</span>
                <a className="cat-path" href={c.path} target="_blank" rel="noopener noreferrer">{c.path} ↗</a>
              </label>
              <MediaInput label="Tile image (optional)" value={d.image} onChange={upd('image')} toast={toast} empty="Uses the first product photo" />
            </div>
            <div className="panel-foot">
              <button className="abtn danger" onClick={() => remove(c)}>{I.trash} Delete</button>
              <button className="btn" disabled={!dirty} onClick={() => save(c)}>Save</button>
            </div>
          </section>
        );
      })}
      {!categories.length && <div className="blank">No categories yet.</div>}
    </>
  );
}

/* ---------- brands tab ---------- */
export function BrandsTab({ brands, setBrands, toast, onChanged }) {
  const lang = useEditLang();
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState({});

  const add = async (e) => {
    e.preventDefault();
    try {
      setBrands((await api('brands', 'POST', { name, sort_order: brands.length })).brands);
      setName('');
      toast('Brand added');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const save = async (b) => {
    try {
      setBrands(await api(`brands/${b.id}`, 'PUT', { ...b, ...drafts[b.id] }));
      setDrafts((d) => ({ ...d, [b.id]: undefined }));
      onChanged();
      toast('Brand saved');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const toggle = async (b) => {
    try {
      setBrands(await api(`brands/${b.id}`, 'PUT', { ...b, visible: b.visible ? 0 : 1 }));
      onChanged();
      toast(b.visible ? `${b.name} hidden — its products are off the site` : `${b.name} is visible again`);
    } catch (err) {
      toast(err.message, false);
    }
  };
  const remove = async (b) => {
    if (!confirm(`Delete brand “${b.name}”? Its ${b.product_count} product(s) stay, without a brand.`)) return;
    try {
      setBrands(await api(`brands/${b.id}`, 'DELETE'));
      onChanged();
      toast('Brand deleted');
    } catch (err) {
      toast(err.message, false);
    }
  };

  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Brands</h1>
          <p>Each brand gets a page at <code>/b/brand-name</code>, a filter on category pages, and is shown before its products’ names. All brands are listed at <code>/b</code>.</p>
        </div>
      </div>
      <form className="panel inline-add" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New brand, e.g. The Bulldog" required />
        <button className="btn">{I.plus} Add</button>
      </form>
      {brands.map((b) => {
        const d = { ...b, ...drafts[b.id] };
        const dirty = ['name', 'logo', 'description'].some((k) => (d[k] || '') !== (b[k] || '')) || Number(d.sort_order) !== b.sort_order || JSON.stringify(d.translations || {}) !== JSON.stringify(b.translations || {});
        const upd = (k) => (v) => setDrafts((s) => ({ ...s, [b.id]: { ...s[b.id], [k]: v } }));
        return (
          <section key={b.id} className={`panel ${b.visible ? '' : 'is-hidden'}`}>
            {!b.visible && <p className="hidden-note">{I.eyeOff} Hidden — this brand’s page and all {b.product_count} of its products are off the site.</p>}
            <div className="form">
              <Text label="Brand name" value={d.name} onChange={upd('name')} hint={`${b.product_count} product(s)`} />
              <Text label="Order" type="number" value={d.sort_order} onChange={upd('sort_order')} />
              <label className="wide">
                <span className="lbl">Web address</span>
                <a className="cat-path" href={b.path} target="_blank" rel="noopener noreferrer">{b.path} ↗</a>
                <span className="hint">Follows the name — renaming a brand changes its address.</span>
              </label>
              <Text label="About the brand (optional)" {...trField(d, (fn) => setDrafts((s) => ({ ...s, [b.id]: fn({ ...b, ...s[b.id] }) })), 'description', lang)} area />
              <MediaInput label="Logo (optional)" value={d.logo} onChange={upd('logo')} toast={toast} video={false} trim empty="Uses a product photo" hint="Shown on the brand page and brand tiles. SVG or transparent PNG." />
            </div>
            <div className="panel-foot">
              <button className="abtn danger" onClick={() => remove(b)}>{I.trash} Delete</button>
              <button className="abtn vis-btn" onClick={() => toggle(b)} title="Show or hide this brand and all its products">{b.visible ? <>{I.eye} Visible on site</> : <>{I.eyeOff} Hidden</>}</button>
              <button className="btn" disabled={!dirty} onClick={() => save(b)}>Save</button>
            </div>
          </section>
        );
      })}
      {!brands.length && <div className="blank">No brands yet. Add one above, or pick “＋ New brand…” while editing a product.</div>}
    </>
  );
}

/* ---------- badges tab ---------- */
const COLOR_CHOICES = [['accent', 'Theme yellow'], ['accent2', 'Theme orange'], ['custom', 'Custom colour…']];

export function BadgesTab({ badges, setBadges, toast, onChanged }) {
  const lang = useEditLang();
  const [name, setName] = useState('');
  const [drafts, setDrafts] = useState({});

  const add = async (e) => {
    e.preventDefault();
    try {
      setBadges((await api('badges', 'POST', { name, sort_order: badges.length })).badges);
      setName('');
      toast('Badge added');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const save = async (b) => {
    try {
      setBadges(await api(`badges/${b.id}`, 'PUT', { ...b, ...drafts[b.id] }));
      setDrafts((d) => ({ ...d, [b.id]: undefined }));
      onChanged();
      toast('Badge saved');
    } catch (err) {
      toast(err.message, false);
    }
  };
  const toggle = async (b) => {
    try {
      setBadges(await api(`badges/${b.id}`, 'PUT', { ...b, visible: b.visible ? 0 : 1 }));
      onChanged();
      toast(b.visible ? `${b.name} hidden — its products are off the site` : `${b.name} is visible again`);
    } catch (err) {
      toast(err.message, false);
    }
  };
  const remove = async (b) => {
    if (!confirm(`Delete the badge “${b.name}”?${b.product_count ? ` It will be removed from ${b.product_count} product(s).` : ''}`)) return;
    try {
      setBadges(await api(`badges/${b.id}`, 'DELETE'));
      onChanged();
      toast('Badge deleted');
    } catch (err) {
      toast(err.message, false);
    }
  };

  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Badges</h1>
          <p>Labels like NEW, BESTSELLER or COMING SOON. Each badge has its own filter page — link to it from any menu with the “Choose…” picker.</p>
        </div>
      </div>
      <form className="panel inline-add" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New badge, e.g. COMING SOON" required />
        <button className="btn">{I.plus} Add</button>
      </form>
      {badges.map((b) => {
        const d = { ...b, ...drafts[b.id] };
        const upd = (k) => (v) => setDrafts((s) => ({ ...s, [b.id]: { ...s[b.id], [k]: v } }));
        const dirty = d.name !== b.name || d.color !== b.color || Number(d.sort_order) !== b.sort_order || JSON.stringify(d.translations || {}) !== JSON.stringify(b.translations || {});
        const custom = !['accent', 'accent2'].includes(d.color);
        return (
          <section key={b.id} className={`panel ${b.visible ? '' : 'is-hidden'}`}>
            {!b.visible && <p className="hidden-note">{I.eyeOff} Hidden — all {b.product_count} product(s) with this badge are off the site.</p>}
            <div className="form">
              <Text label="Badge" {...trField(d, (fn) => setDrafts((s) => ({ ...s, [b.id]: fn({ ...b, ...s[b.id] }) })), 'name', lang)} hint={`${b.product_count} product(s)`} />
              <label>
                <span className="lbl">Colour</span>
                <div className="color">
                  <select value={custom ? 'custom' : d.color} onChange={(e) => upd('color')(e.target.value === 'custom' ? '#ff6b6b' : e.target.value)}>
                    {COLOR_CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {custom && <input type="color" value={/^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#ff6b6b'} onChange={(e) => upd('color')(e.target.value)} aria-label="Badge colour" />}
                </div>
                <span className="badge-preview" style={{ background: badgeColor(d.color) }}>{(lang !== 'en' && d.translations?.[lang]?.name) || d.name || 'BADGE'}</span>
              </label>
              <Text label="Order" type="number" value={d.sort_order} onChange={upd('sort_order')} />
              <label>
                <span className="lbl">Filter page</span>
                <a className="cat-path" href={`/c/all?badge=${b.slug}`} target="_blank" rel="noopener noreferrer">/c/all?badge={b.slug} ↗</a>
              </label>
            </div>
            <div className="panel-foot">
              <button className="abtn danger" onClick={() => remove(b)}>{I.trash} Delete</button>
              <button className="abtn vis-btn" onClick={() => toggle(b)} title="Show or hide this badge and all its products">{b.visible ? <>{I.eye} Visible on site</> : <>{I.eyeOff} Hidden</>}</button>
              <button className="btn" disabled={!dirty} onClick={() => save(b)}>Save</button>
            </div>
          </section>
        );
      })}
      {!badges.length && <div className="blank">No badges yet.</div>}
    </>
  );
}
