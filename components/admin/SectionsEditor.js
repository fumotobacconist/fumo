'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useState } from 'react';
import { LinkTargets } from './LinkInput';
import { NEW_SECTION, SECTION_TYPES } from '@/lib/site';
import { Color, I, LinkField, ListEditor, MediaInput, Select, TInput, Text, Toggle, enText } from './ui';

// Editor for a list of page sections (used by the homepage and custom pages).
function sectionTitle(s) {
  const head = enText(s.title) || enText(s.heading) || enText(s.caption);
  if (head) return head;
  if (s.type === 'marquee') return (s.items || []).map(enText).join(' · ');
  if (s.type === 'store') return (s.items || []).map((i) => enText(i.name)).filter(Boolean).join(' · ');
  if (s.type === 'gallery') return `${(s.items || []).length} photo(s)`;
  if (s.type === 'text') return enText(s.body).slice(0, 60);
  return '';
}

// Joins two texts that may be plain strings or { en, hy, ru } translations.
function joinText(a, b) {
  const tr = (v) => (v && typeof v === 'object' ? v : { en: v || '' });
  if ((!a || typeof a === 'string') && (!b || typeof b === 'string')) return [a, b].filter(Boolean).join('\n\n');
  const A = tr(a), B = tr(b);
  return Object.fromEntries([...new Set([...Object.keys(A), ...Object.keys(B)])].map((l) => [l, [A[l], B[l]].filter(Boolean).join('\n\n')]));
}

const storeToStories = (s) => ({
  id: s.id,
  type: 'stories',
  enabled: s.enabled,
  title: s.title || '',
  items: (s.items || []).map((st) => ({ title: st.name || '', text: joinText(st.address, st.hours), image: st.image || '', button_label: '', link: '' })),
});

function SectionFields({ s, set, categories, toast }) {
  const { brands = [], badges = [] } = useContext(LinkTargets);
  const f = (k) => (v) => set({ ...s, [k]: v });
  switch (s.type) {
    case 'hero':
      return (
        <>
          <Text t label="Heading" value={s.heading} onChange={f('heading')} wide />
          <Text t label="Subheading" value={s.subheading} onChange={f('subheading')} wide />
          <Text t label="Button text" value={s.button_label} onChange={f('button_label')} />
          <LinkField label="Button link" value={s.button_link} onChange={f('button_link')} />
          <MediaInput label="Background (image, GIF or video)" value={s.media} onChange={f('media')} toast={toast} empty="Solid colour" />
          <Color label="Background colour" value={s.bg} onChange={f('bg')} />
          <Color label="Text colour" value={s.color} onChange={f('color')} />
          <Select label="Height" value={s.height} onChange={f('height')} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['full', 'Full screen']]} />
        </>
      );
    case 'products':
      return (
        <>
          <Text t label="Title" value={s.title} onChange={f('title')} />
          <Select
            label="Show"
            value={s.source}
            onChange={f('source')}
            options={[['all', 'All products'], ['featured', 'Featured products'], ['new', 'Newest first'], ...categories.map((c) => [c.slug, `Category: ${c.parent_name ? `${c.parent_name} › ` : ''}${c.name}`]), ...badges.map((b) => [`badge:${b.slug}`, `Badge: ${b.name}`]), ...brands.map((b) => [`brand:${b.slug}`, `Brand: ${b.name}`])]}
          />
          <Text label="How many" type="number" min={1} max={48} value={s.limit} onChange={(v) => set({ ...s, limit: Number(v) || 8 })} />
        </>
      );
    case 'collections':
      return (
        <>
          <Text t label="Title" value={s.title} onChange={f('title')} wide />
          <p className="hint wide">Leave the list empty to show every category automatically, or add your own tiles:</p>
          <ListEditor
            items={s.items}
            onChange={f('items')}
            addLabel="Add tile"
            blank={{ label: '', href: '', image: '' }}
            render={(t, upd) => (
              <div className="form nested">
                <Text t label="Label" value={t.label} onChange={(v) => upd({ ...t, label: v })} />
                <LinkField label="Link" value={t.href} linkLabel={enText(t.label)} onChange={(v) => upd({ ...t, href: v })} />
                <MediaInput label="Image" value={t.image} onChange={(v) => upd({ ...t, image: v })} toast={toast} />
              </div>
            )}
          />
        </>
      );
    case 'banner':
      return (
        <>
          <Text t label="Heading" value={s.heading} onChange={f('heading')} wide />
          <Text t label="Text" value={s.text} onChange={f('text')} area />
          <Text t label="Button text" value={s.button_label} onChange={f('button_label')} />
          <LinkField label="Button link" value={s.button_link} onChange={f('button_link')} />
          <MediaInput label="Side image / GIF / video (optional)" value={s.media} onChange={f('media')} toast={toast} empty="Text only, centred" />
          <Color label="Background colour" value={s.bg} onChange={f('bg')} />
          <Color label="Text colour" value={s.color} onChange={f('color')} />
        </>
      );
    case 'marquee':
      return (
        <>
          <ListEditor items={s.items} onChange={f('items')} addLabel="Add word" blank="" render={(t, upd) => <TInput value={t} onChange={upd} placeholder="Text" aria-label="Text" />} />
          <Color label="Background colour" value={s.bg} onChange={f('bg')} />
          <Color label="Text colour" value={s.color} onChange={f('color')} />
        </>
      );
    case 'text':
      return (
        <>
          <Text t label="Heading" value={s.heading} onChange={f('heading')} wide />
          <Text t label="Text" value={s.body} onChange={f('body')} area />
        </>
      );
    case 'media':
      return (
        <>
          <MediaInput label="Image, GIF or video" value={s.media} onChange={f('media')} toast={toast} />
          <Text t label="Caption over it (optional)" value={s.caption} onChange={f('caption')} />
          <LinkField label="Link (optional)" value={s.link} onChange={f('link')} />
        </>
      );
    case 'store':
      return (
        <>
          <div className="wide convert-note">
            <span>Not a shop location? Turn these into plain image & text rows (no address/hours icons).</span>
            <button type="button" className="abtn sm" onClick={() => set(storeToStories(s))}>Convert to Image &amp; text rows</button>
          </div>
          <Text t label="Title above the stores (optional)" value={s.title} onChange={f('title')} wide />
          <ListEditor
            items={s.items}
            onChange={f('items')}
            addLabel="Add store"
            blank={{ name: '', image: '', address: '', hours: '', phone: '', map_link: '', show_map: true }}
            render={(st, upd) => (
              <div className="form nested">
                <Text t label="Store name" value={st.name} onChange={(v) => upd({ ...st, name: v })} />
                <Text label="Phone" value={st.phone} onChange={(v) => upd({ ...st, phone: v })} placeholder="+374 …" />
                <Text t label="Address" value={st.address} onChange={(v) => upd({ ...st, address: v })} area placeholder="Street, building, Yerevan" />
                <Text t label="Opening hours" value={st.hours} onChange={(v) => upd({ ...st, hours: v })} area placeholder={'Mon–Fri 11:00–22:00\nSat–Sun 12:00–23:00'} />
                <MediaInput label="Store photo" value={st.image} onChange={(v) => upd({ ...st, image: v })} toast={toast} />
                <Text label="Directions link (optional)" value={st.map_link} onChange={(v) => upd({ ...st, map_link: v })} placeholder="https://maps.app.goo.gl/…" hint="Empty = Google Maps search for the address." />
                <Toggle on={st.show_map} onChange={(v) => upd({ ...st, show_map: v })} label="Show map under the address" />
              </div>
            )}
          />
        </>
      );
    case 'gallery':
      return (
        <>
          <Text t label="Title (optional)" value={s.title} onChange={f('title')} />
          <Select label="Columns" value={String(s.columns || 3)} onChange={(v) => set({ ...s, columns: Number(v) })} options={[['2', '2'], ['3', '3'], ['4', '4']]} />
          <ListEditor
            items={s.items}
            onChange={f('items')}
            addLabel="Add photo"
            blank={{ image: '', caption: '', link: '' }}
            render={(g, upd) => (
              <div className="form nested">
                <MediaInput label="Photo / GIF / video" value={g.image} onChange={(v) => upd({ ...g, image: v })} toast={toast} />
                <Text t label="Caption (optional)" value={g.caption} onChange={(v) => upd({ ...g, caption: v })} />
                <LinkField label="Link (optional)" value={g.link} linkLabel={enText(g.caption)} onChange={(v) => upd({ ...g, link: v })} />
              </div>
            )}
          />
        </>
      );
    case 'stories':
      return (
        <>
          <Text t label="Title above the rows (optional)" value={s.title} onChange={f('title')} wide />
          <ListEditor
            items={s.items}
            onChange={f('items')}
            addLabel="Add row"
            blank={{ title: '', text: '', image: '', button_label: '', link: '' }}
            render={(it, upd) => (
              <div className="form nested">
                <Text t label="Title" value={it.title} onChange={(v) => upd({ ...it, title: v })} wide />
                <Text t label="Text" value={it.text} onChange={(v) => upd({ ...it, text: v })} area />
                <MediaInput label="Photo / GIF / video" value={it.image} onChange={(v) => upd({ ...it, image: v })} toast={toast} />
                <Text t label="Button text (optional)" value={it.button_label} onChange={(v) => upd({ ...it, button_label: v })} placeholder="Read more" />
                <LinkField label="Link (optional)" value={it.link} linkLabel={enText(it.title)} onChange={(v) => upd({ ...it, link: v })} />
              </div>
            )}
          />
        </>
      );
    case 'brands':
      return (
        <>
          <Text t label="Title" value={s.title} onChange={f('title')} wide />
          <p className="hint wide">Shows every brand that has products, with its logo (set logos in the Brands tab).</p>
        </>
      );
    default:
      return null;
  }
}

export default function SectionsEditor({ sections, onChange, categories, toast }) {
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState('products');
  const update = onChange;
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };
  const add = () => {
    const id = `${adding}-${Date.now().toString(36)}`;
    update([...sections, { id, type: adding, enabled: true, ...structuredClone(NEW_SECTION[adding] || {}) }]);
    setOpen(id);
  };

  return (
    <>
      {!sections.length && <div className="blank">No sections yet — add the first one below.</div>}
      <div className="sections">
        {sections.map((s, i) => (
          <motion.section key={s.id} layout className={`panel section ${s.enabled ? '' : 'off'}`}>
            <div className="section-bar">
              <button type="button" className="section-name" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                <span className="pill">{SECTION_TYPES[s.type] || s.type}</span>
                <span className="sec-title">{sectionTitle(s) || <em>Untitled</em>}</span>
                <span className={`caret ${open === s.id ? 'up' : ''}`}>{I.down}</span>
              </button>
              <div className="acts">
                <button type="button" className={`icon-btn ${s.enabled ? '' : 'on'}`} title={s.enabled ? 'Hide section' : 'Show section'} onClick={() => update(sections.map((x, k) => (k === i ? { ...x, enabled: !x.enabled } : x)))}>{s.enabled ? I.eye : I.eyeOff}</button>
                <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">{I.up}</button>
                <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Move down">{I.down}</button>
                <button type="button" className="icon-btn del" aria-label="Delete section" onClick={() => confirm('Delete this section?') && update(sections.filter((_, k) => k !== i))}>{I.trash}</button>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {open === s.id && (
                <motion.div className="form section-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <SectionFields s={s} set={(v) => update(sections.map((x, k) => (k === i ? v : x)))} categories={categories} toast={toast} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        ))}
      </div>
      <div className="panel inline-add">
        <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Section type">
          {Object.entries(SECTION_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button type="button" className="btn" onClick={add}>{I.plus} Add section</button>
      </div>
    </>
  );
}

