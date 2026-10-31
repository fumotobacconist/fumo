'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { NEW_SECTION, slugify } from '@/lib/site';
import SectionsEditor from './SectionsEditor';
import { I, Panel, Text, Toggle, api, ease, enText, useEditLang } from './ui';

const sec = (type, extra = {}) => ({ id: `${type}-${Math.random().toString(36).slice(2, 8)}`, type, enabled: true, ...structuredClone(NEW_SECTION[type]), ...extra });

const TEMPLATES = {
  blank: { label: 'Blank page', title: 'New page', sections: () => [sec('text', { heading: '', body: 'Write something here…' })] },
  store: { label: 'Find a store', title: 'Find a store', sections: () => [sec('text', { heading: '', body: 'Come and visit us.' }), sec('store')] },
  about: { label: 'About us', title: 'About us', sections: () => [sec('media'), sec('text', { heading: 'Our story', body: 'Tell the FUMO story here…' })] },
  gallery: { label: 'Photo gallery', title: 'Gallery', sections: () => [sec('gallery')] },
  promo: { label: 'Promotion', title: 'Special offer', sections: () => [sec('hero', { heading: 'Special offer', subheading: '' }), sec('products', { title: 'On offer', source: 'featured' })] },
};

// Places in the site menus a page can be linked from.
function menuTargets(site) {
  return [
    ['header', 'Header links', ['header', 'nav']],
    ['sb1', 'Sidebar · section 1 (big)', ['sidebar', 'primary']],
    ['sb2', 'Sidebar · section 2 (small)', ['sidebar', 'secondary']],
    ...site.footer.columns.map((c, i) => [`f${i}`, `Footer · ${enText(c.title) || `column ${i + 1}`}`, ['footer', 'columns', i, 'links']]),
    ['fb', 'Footer · bottom links', ['footer', 'bottom_links']],
  ];
}

function linkedFrom(site, href) {
  return menuTargets(site).filter(([, , path]) => (path.reduce((o, k) => o?.[k], site) || []).some((l) => l.href === href)).map(([, label]) => label);
}

function PageEditor({ page, onBack, onSaved, onDelete, categories, toast, siteDirty }) {
  const [f, setF] = useState(page);
  const [slugTouched, setSlugTouched] = useState(!!page.id);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(page);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }));
  // Title and description: English in the page itself, other languages in page.translations.
  const lang = useEditLang();
  const trProps = (k) =>
    lang === 'en'
      ? { value: f[k], onChange: set(k) }
      : {
          lang,
          value: f.translations?.[lang]?.[k] ?? '',
          placeholder: f[k],
          onChange: (v) => setF((s) => ({ ...s, translations: { ...s.translations, [lang]: { ...s.translations?.[lang], [k]: v } } })),
        };

  const save = async () => {
    setBusy(true);
    try {
      const saved = f.id ? await api(`pages/${f.id}`, 'PUT', f) : await api('pages', 'POST', f);
      setF(saved);
      onSaved(saved, !f.id);
    } catch (e) {
      toast(e.message, false);
    } finally {
      setBusy(false);
    }
  };

  const back = () => (!dirty || confirm('Leave without saving this page?')) && onBack();

  return (
    <>
      <div className="head">
        <div>
          <button className="abtn" onClick={back} style={{ marginBottom: 12 }}>← All pages</button>
          <h1 className="d">{f.title || 'Untitled page'}</h1>
          <p>{f.published ? 'Published' : 'Draft — only visible to you'} · <code>/{f.slug || '…'}</code></p>
        </div>
        <div className="acts" style={{ gap: 8 }}>
          {f.id && <a className="abtn" href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">{I.ext} {page.published ? 'View' : 'Preview'}</a>}
          <button className="btn" onClick={save} disabled={busy || (!dirty && f.id)}>{busy ? 'Saving…' : f.id ? 'Save page' : 'Create page'}</button>
        </div>
      </div>
      <Panel title="Page settings">
        <Text label="Title" {...trProps('title')} />
        <label>
          <span className="lbl">Web address</span>
          <div className="slug">
            <span>/</span>
            <input value={f.slug} onChange={(e) => { setSlugTouched(true); setF((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })); }} placeholder="find-a-store" />
          </div>
          <span className="hint">Letters, numbers and dashes. Changing it breaks old links to this page.</span>
        </label>
        <Text label="Description for Google (optional)" {...trProps('description')} area />
        <Toggle on={!!f.published} onChange={set('published')} label="Published (visible to everyone)" />
        <Toggle on={!!f.show_title} onChange={set('show_title')} label="Show the title at the top of the page" />
      </Panel>
      <h2 className="d" style={{ fontSize: 22, margin: '26px 0 12px' }}>Content</h2>
      <SectionsEditor sections={f.sections} onChange={(v) => setF((s) => ({ ...s, sections: v }))} categories={categories} toast={toast} />
      {f.id && (
        <div style={{ marginTop: 30 }}>
          <button className="abtn danger" onClick={() => onDelete(f)}>{I.trash} Delete this page</button>
        </div>
      )}
      <AnimatePresence>
        {dirty && (
          <motion.div className="savebar" style={siteDirty ? { bottom: 86 } : undefined} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <span>Unsaved page changes</span>
            {f.id && <button className="abtn" onClick={() => setF(page)}>Discard</button>}
            <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : f.id ? 'Save page' : 'Create page'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PagesTab({ pages, setPages, site, set, categories, toast, siteDirty }) {
  const [editing, setEditing] = useState(null);
  const [template, setTemplate] = useState('blank');
  const [target, setTarget] = useState({});

  const create = () => {
    const t = TEMPLATES[template];
    let title = t.title;
    for (let n = 2; pages.some((p) => p.slug === slugify(title)); n++) title = `${t.title} ${n}`;
    setEditing({ title, slug: slugify(title), description: '', show_title: 1, published: 0, sections: t.sections() });
  };

  const remove = async (p) => {
    if (!confirm(`Delete the page “${p.title}”? Menu links pointing to /${p.slug} will stop working.`)) return;
    try {
      await api(`pages/${p.id}`, 'DELETE');
      setPages((ps) => ps.filter((x) => x.id !== p.id));
      setEditing(null);
      toast('Page deleted');
    } catch (e) {
      toast(e.message, false);
    }
  };

  const addToMenu = (p) => {
    const key = target[p.id] || 'sb2';
    const [, label, path] = menuTargets(site).find(([k]) => k === key);
    const list = path.reduce((o, k) => o?.[k], site) || [];
    const href = `/${p.slug}`;
    if (list.some((l) => l.href === href)) return toast(`Already in ${label}`, false);
    set(path, [...list, key === 'sb2' ? { label: p.title, href, icon: 'pin' } : { label: p.title, href }]);
    toast(
      p.published
        ? `Added to ${label} — click “Publish changes” to make it live`
        : `Added to ${label}. This page is still a draft — publish it too, or visitors will see “not found”.`,
      p.published
    );
  };

  if (editing) {
    return (
      <PageEditor
        key={editing.id || 'new'}
        page={editing}
        categories={categories}
        toast={toast}
        siteDirty={siteDirty}
        onBack={() => setEditing(null)}
        onDelete={remove}
        onSaved={(saved, created) => {
          setPages((ps) => (created ? [...ps, saved] : ps.map((x) => (x.id === saved.id ? saved : x))).sort((a, b) => a.title.localeCompare(b.title)));
          setEditing(saved);
          toast(created ? 'Page created' : 'Page saved');
        }}
      />
    );
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Pages</h1>
          <p>Extra pages like “Find a store”, “About us” or “Delivery”, built from the same blocks as the homepage.</p>
        </div>
      </div>
      <div className="panel inline-add">
        <select value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="Start from">
          {Object.entries(TEMPLATES).map(([k, t]) => <option key={k} value={k}>Start from: {t.label}</option>)}
        </select>
        <button className="btn" onClick={create}>{I.plus} New page</button>
      </div>
      {!pages.length && <div className="blank">No pages yet.</div>}
      <AnimatePresence initial={false}>
        {pages.map((p) => {
          const links = linkedFrom(site, `/${p.slug}`);
          return (
            <motion.section key={p.id} layout className="panel page-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease }}>
              <div className="page-main">
                <div>
                  <h2 className="d">{p.title}</h2>
                  <p className="sub">
                    <span className={`status ${p.published ? 'live' : ''}`}>{p.published ? 'Published' : 'Draft'}</span> <code>/{p.slug}</code>
                    {' · '}{links.length ? `Linked from ${links.join(', ')}` : 'Not linked from any menu yet'}
                  </p>
                </div>
                <div className="acts" style={{ gap: 6 }}>
                  <a className="abtn" href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">{I.ext} {p.published ? 'View' : 'Preview'}</a>
                  <button className="btn" onClick={() => setEditing(p)}>{I.edit} Edit</button>
                </div>
              </div>
              <div className="page-menu">
                <select value={target[p.id] || 'sb2'} onChange={(e) => setTarget((t) => ({ ...t, [p.id]: e.target.value }))} aria-label="Menu to add the link to">
                  {menuTargets(site).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <button className="abtn" onClick={() => addToMenu(p)}>{I.plus} Add link to menu</button>
                <button className="icon-btn del" title="Delete page" onClick={() => remove(p)}>{I.trash}</button>
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </>
  );
}
