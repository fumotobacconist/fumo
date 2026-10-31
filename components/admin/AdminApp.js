'use client';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Wordmark } from '../Logo';
import { EditLang, I, api, ease, setIn, useToasts } from './ui';
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT } from '@/i18n/config';
import { BadgesTab, BrandsTab, CategoriesTab, ProductsTab } from './CatalogTabs';
import dynamic from 'next/dynamic';

// Site editors load on first use; Products (the default tab) is part of the initial bundle.
const loading = () => <div className="blank">Loading…</div>;
const HomeTab = dynamic(() => import('./SiteTabs').then((m) => m.HomeTab), { loading });
const HeaderTab = dynamic(() => import('./SiteTabs').then((m) => m.HeaderTab), { loading });
const FooterTab = dynamic(() => import('./SiteTabs').then((m) => m.FooterTab), { loading });
const BrandTab = dynamic(() => import('./SiteTabs').then((m) => m.BrandTab), { loading });
const PagesTab = dynamic(() => import('./PagesTab'), { loading });
import { LinkTargets } from './LinkInput';
import { NEW_SECTION } from '@/lib/site';

const TABS = [
  ['products', 'Products', I.box],
  ['categories', 'Categories', I.tag],
  ['brands', 'Brands', I.star],
  ['badges', 'Badges', I.badge],
  ['home', 'Homepage', I.home],
  ['pages', 'Pages', I.page],
  ['header', 'Header & menu', I.menu],
  ['footer', 'Footer', I.foot],
  ['brand', 'Brand & theme', I.brush],
];
const SITE_TABS = ['home', 'header', 'footer', 'brand'];

export default function AdminApp({ initial }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState(initial.products);
  const [categories, setCategories] = useState(initial.categories);
  const [pages, setPages] = useState(initial.pages);
  const [brands, setBrands] = useState(initial.brands);
  const [badges, setBadges] = useState(initial.badges);
  const [lang, setLang] = useState('en');
  const [saved, setSaved] = useState(initial.site);
  const [site, setSite] = useState(initial.site);
  const [busy, setBusy] = useState(false);
  const [toast, toasts] = useToasts();
  const dirty = JSON.stringify(site) !== JSON.stringify(saved);

  // Warn before leaving with unsaved site changes.
  useEffect(() => {
    const h = (e) => dirty && (e.preventDefault(), (e.returnValue = ''));
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = (path, value) => setSite((s) => setIn(s, path, value));

  const save = async () => {
    setBusy(true);
    try {
      const s = await api('site', 'PUT', site);
      setSaved(s);
      setSite(s);
      toast('Website updated');
    } catch (e) {
      toast(e.message, false);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
    await fetch('/api/admin/logout', { method: 'POST' });
    location.href = '/admin/login';
  };

  const props = { site, set, toast, categories };

  // What link fields can point at, and quick-create for addresses that don't exist yet.
  const targets = useMemo(() => ({
    pages,
    categories,
    products,
    brands,
    badges,
    createBadge: async ({ name }) => {
      try {
        setBadges((await api('badges', 'POST', { name })).badges);
        toast(`Badge “${name.toUpperCase()}” created — set it on products in Products`);
      } catch (e) {
        toast(e.message, false);
      }
    },
    createBrand: async ({ name, slug }) => {
      try {
        setBrands((await api('brands', 'POST', { name, slug })).brands);
        toast(`Brand “${name}” created — assign it to products in Products`);
      } catch (e) {
        toast(e.message, false);
      }
    },
    createCategory: async ({ name, slug, parent_id }) => {
      try {
        setCategories(await api('categories', 'POST', { name, slug, parent_id }));
        toast(parent_id ? `Subcategory “${name}” created — assign products to it in Products` : `Category “${name}” created`);
      } catch (e) {
        toast(e.message, false);
      }
    },
    createPage: async ({ title, slug }) => {
      try {
        const page = await api('pages', 'POST', {
          title,
          slug,
          published: 0,
          sections: [{ id: `text-${Date.now().toString(36)}`, type: 'text', enabled: true, ...structuredClone(NEW_SECTION.text), heading: '', body: '' }],
        });
        setPages((ps) => [...ps, page].sort((a, b) => a.title.localeCompare(b.title)));
        toast(`Draft page “${title}” created — fill it in and publish it in Pages`);
      } catch (e) {
        toast(e.message, false);
      }
    },
  }), [pages, categories, products, brands, badges, toast]);

  return (
    <EditLang.Provider value={lang}>
    <LinkTargets.Provider value={targets}>
    <div className="shell">
      <aside className="side">
        <div className="side-logo"><Wordmark size={30} /><small>Admin</small></div>
        <div className="edit-lang">
          <span className="lbl">Editing language</span>
          <div className="seg" role="radiogroup" aria-label="Editing language">
            {LOCALES.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)} title={LOCALE_NAMES[l]}>{LOCALE_SHORT[l]}</button>
            ))}
          </div>
        </div>
        <LayoutGroup>
          {TABS.map(([id, label, icon]) => (
            <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              {tab === id && <motion.span layoutId="tabbg" className="tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              {icon}
              <span className="tl">{label}</span>
              {SITE_TABS.includes(id) && dirty && <i className="dot" title="Unsaved changes" />}
            </button>
          ))}
        </LayoutGroup>
        <div className="side-foot">
          <a className="tab" href="/" target="_blank" rel="noopener noreferrer">{I.ext}<span className="tl">View site</span></a>
          <button className="tab" onClick={logout}>{I.out}<span className="tl">Log out</span></button>
        </div>
      </aside>
      <main className="main">
        {lang !== 'en' && (
          <div className="tr-banner">
            <b>Editing {LOCALE_NAMES[lang]}.</b> Fields marked {LOCALE_SHORT[lang]} save the {LOCALE_NAMES[lang]} text; the grey hint is the English. Empty fields show English on the {LOCALE_NAMES[lang]} site. Prices, links, colours and photos are shared.
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease }}>
            {tab === 'products' && <ProductsTab products={products} setProducts={setProducts} categories={categories} brands={brands} setBrands={setBrands} badges={badges} setBadges={setBadges} toast={toast} site={site} />}
            {tab === 'badges' && <BadgesTab badges={badges} setBadges={setBadges} toast={toast} onChanged={async () => setProducts(await api('products'))} />}
            {tab === 'brands' && <BrandsTab brands={brands} setBrands={setBrands} toast={toast} onChanged={async () => setProducts(await api('products'))} />}
            {tab === 'categories' && <CategoriesTab categories={categories} setCategories={setCategories} toast={toast} onChanged={async () => setProducts(await api('products'))} />}
            {tab === 'home' && <HomeTab {...props} />}
            {tab === 'pages' && <PagesTab {...props} pages={pages} setPages={setPages} siteDirty={dirty} />}
            {tab === 'header' && <HeaderTab {...props} />}
            {tab === 'footer' && <FooterTab {...props} />}
            {tab === 'brand' && <BrandTab {...props} />}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {dirty && (
            <motion.div className="savebar" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
              <span>Unsaved website changes</span>
              <button className="abtn" onClick={() => setSite(saved)}>Discard</button>
              <button className="btn" onClick={save} disabled={busy}>{busy ? 'Publishing…' : 'Publish changes'}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {toasts}
    </div>
    </LinkTargets.Provider>
    </EditLang.Provider>
  );
}
