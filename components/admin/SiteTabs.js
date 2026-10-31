'use client';
import { ICON_NAMES } from '../site/Icons';
import { Color, LinkField, LinksEditor, ListEditor, MediaInput, Panel, Preview, Range, Select, TInput, Text, Toggle, enText } from './ui';
import { Wordmark } from '../Logo';
import { logoVars } from '../site/Chrome';
import SectionsEditor from './SectionsEditor';

/* ---------- Homepage ---------- */

export function HomeTab({ site, set, categories, toast }) {
  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Homepage</h1>
          <p>Sections appear top to bottom. Reorder, hide, edit or add new ones.</p>
        </div>
      </div>
      <SectionsEditor sections={site.home.sections} onChange={(v) => set(['home', 'sections'], v)} categories={categories} toast={toast} />
    </>
  );
}

/* ---------- Header, announcement & sidebar ---------- */

export function HeaderTab({ site, set, toast }) {
  const a = site.announcement;
  const sb = site.sidebar;
  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Header & menu</h1>
          <p>The bar at the very top, the header links and the slide-out sidebar.</p>
        </div>
      </div>
      <Panel title="Announcement bar" desc="Messages rotate every few seconds.">
        <Toggle on={a.enabled} onChange={(v) => set(['announcement', 'enabled'], v)} label="Show announcement bar" />
        <LinkField label="Link (optional)" value={a.link} onChange={(v) => set(['announcement', 'link'], v)} />
        <span className="lbl wide">Messages</span>
        <ListEditor items={a.messages} onChange={(v) => set(['announcement', 'messages'], v)} addLabel="Add message" blank="" render={(t, upd) => <TInput value={t} onChange={upd} placeholder="Message" aria-label="Message" />} />
        <Color label="Background" value={a.bg} onChange={(v) => set(['announcement', 'bg'], v)} />
        <Color label="Text colour" value={a.color} onChange={(v) => set(['announcement', 'color'], v)} />
      </Panel>
      <Panel title="Shop button" desc="The button on the left of the header that opens the sidebar menu (links are managed in the sidebar sections below).">
        <Text t label="Button text" value={site.header.shop_label} onChange={(v) => set(['header', 'shop_label'], v)} placeholder="Shop" />
      </Panel>
      <Panel title="Sidebar · section 1" desc="Big bold links at the top of the slide-out menu. Give a link dropdown links to show an arrow that opens them.">
        <Text t label="Search placeholder" value={sb.search_placeholder} onChange={(v) => set(['sidebar', 'search_placeholder'], v)} wide />
        <ListEditor
          items={sb.primary}
          onChange={(v) => set(['sidebar', 'primary'], v)}
          addLabel="Add link"
          blank={{ label: '', href: '', children: [] }}
          render={(l, upd) => (
            <div className="form nested">
              <Text t label="Label" value={l.label} onChange={(v) => upd({ ...l, label: v })} />
              <LinkField label="Link" value={l.href} linkLabel={enText(l.label)} onChange={(v) => upd({ ...l, href: v })} hint={l.children?.length ? 'Optional when it has a dropdown — empty makes the whole row open it.' : undefined} />
              <span className="lbl wide">Dropdown links (optional — adds an arrow that opens them)</span>
              <LinksEditor items={l.children || []} onChange={(v) => upd({ ...l, children: v })} addLabel="Add dropdown link" />
            </div>
          )}
        />
      </Panel>
      <Panel title="Sidebar · image tiles" desc="Optional picture links between the two sections. Remove all to hide.">
        <ListEditor
          items={sb.tiles}
          onChange={(v) => set(['sidebar', 'tiles'], v)}
          addLabel="Add tile"
          max={6}
          blank={{ label: '', href: '', image: '' }}
          render={(t, upd) => (
            <div className="form nested">
              <Text t label="Label" value={t.label} onChange={(v) => upd({ ...t, label: v })} />
              <LinkField label="Link" value={t.href} linkLabel={enText(t.label)} onChange={(v) => upd({ ...t, href: v })} />
              <MediaInput label="Image / GIF / video" value={t.image} onChange={(v) => upd({ ...t, image: v })} toast={toast} />
            </div>
          )}
        />
      </Panel>
      <Panel title="Sidebar · section 2" desc="Smaller links with icons at the bottom of the menu.">
        <LinksEditor items={sb.secondary} onChange={(v) => set(['sidebar', 'secondary'], v)} icons={ICON_NAMES} />
      </Panel>
    </>
  );
}

/* ---------- Footer ---------- */

export function FooterTab({ site, set, toast }) {
  const f = site.footer;
  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Footer</h1>
          <p>Background, animation, mascot, link columns and legal text.</p>
        </div>
      </div>
      <Panel title="Background & animation" desc="A video, GIF or image fills the footer. Layers drift slowly across it, like clouds of smoke.">
        <Color label="Background colour" value={f.bg} onChange={(v) => set(['footer', 'bg'], v)} />
        <Color label="Text colour" value={f.color} onChange={(v) => set(['footer', 'color'], v)} />
        <MediaInput label="Background video / GIF / image" value={f.media} onChange={(v) => set(['footer', 'media'], v)} toast={toast} empty="Solid colour" hint="MP4 / WebM loops play muted like a GIF. Keep videos short and small." />
        <Text label="Background opacity (0–1)" type="number" step="0.05" min="0" max="1" value={f.media_opacity} onChange={(v) => set(['footer', 'media_opacity'], Math.min(1, Math.max(0, Number(v))))} />
        <span className="lbl wide">Drifting layers</span>
        <ListEditor
          items={f.layers}
          onChange={(v) => set(['footer', 'layers'], v)}
          addLabel="Add layer"
          max={5}
          blank={{ image: '', speed: 60, opacity: 1 }}
          render={(l, upd) => (
            <div className="form nested">
              <Select
                label="Layer"
                value={l.image.startsWith('builtin:') ? l.image : 'custom'}
                onChange={(v) => upd({ ...l, image: v === 'custom' ? '' : v })}
                options={[['builtin:smoke-a', 'Built-in: big smoke clouds'], ['builtin:smoke-b', 'Built-in: small smoke puffs'], ['custom', 'My own image / GIF (transparent PNG)']]}
              />
              <Text label="Seconds per loop" type="number" min={5} value={l.speed} onChange={(v) => upd({ ...l, speed: Number(v) || 60 })} hint="Higher = slower" />
              <Text label="Opacity (0–1)" type="number" step="0.05" min="0" max="1" value={l.opacity} onChange={(v) => upd({ ...l, opacity: Math.min(1, Math.max(0, Number(v))) })} />
              {!l.image.startsWith('builtin:') && <MediaInput label="Layer image" value={l.image} onChange={(v) => upd({ ...l, image: v })} toast={toast} video={false} />}
            </div>
          )}
        />
        <MediaInput label="Mascot peeking over the top" value={f.mascot} onChange={(v) => set(['footer', 'mascot'], v)} toast={toast} trim empty="FUMO leaf (default)" hint="A transparent PNG or GIF works best." />
      </Panel>
      <Panel title="Link columns">
        <ListEditor
          items={f.columns}
          onChange={(v) => set(['footer', 'columns'], v)}
          addLabel="Add column"
          max={4}
          blank={{ title: 'New column', links: [] }}
          render={(c, upd) => (
            <div className="form nested">
              <Text t label="Column title" value={c.title} onChange={(v) => upd({ ...c, title: v })} wide />
              <LinksEditor items={c.links} onChange={(v) => upd({ ...c, links: v })} />
            </div>
          )}
        />
      </Panel>
      <Panel title="Call to action" desc="The block next to the columns.">
        <Toggle on={f.cta.enabled} onChange={(v) => set(['footer', 'cta', 'enabled'], v)} label="Show call to action" />
        <Text t label="Title" value={f.cta.title} onChange={(v) => set(['footer', 'cta', 'title'], v)} />
        <Text t label="Text" value={f.cta.text} onChange={(v) => set(['footer', 'cta', 'text'], v)} area />
        <Text t label="Button text" value={f.cta.button_label} onChange={(v) => set(['footer', 'cta', 'button_label'], v)} />
        <LinkField label="Button link" value={f.cta.button_link} onChange={(v) => set(['footer', 'cta', 'button_link'], v)} />
      </Panel>
      <Panel title="Bottom">
        <Text t label="Health warning" value={f.warning} onChange={(v) => set(['footer', 'warning'], v)} area />
        <Text t label="Copyright" value={f.copyright} onChange={(v) => set(['footer', 'copyright'], v)} hint="“©” is followed by the current year automatically." wide />
        <span className="lbl wide">Small links (privacy, terms…)</span>
        <LinksEditor items={f.bottom_links} onChange={(v) => set(['footer', 'bottom_links'], v)} />
      </Panel>
    </>
  );
}

/* ---------- Brand, theme & pages ---------- */

export function BrandTab({ site, set, toast }) {
  const b = site.brand;
  return (
    <>
      <div className="head">
        <div>
          <h1 className="d">Brand & theme</h1>
          <p>Logo, colours, search-engine text, product page and the 18+ check.</p>
        </div>
      </div>
      <Panel title="Logo" desc="Upload an SVG, PNG or GIF. Use the sliders to size it — the preview shows the header line it sits on.">
        <Text label="Brand name" value={b.name} onChange={(v) => set(['brand', 'name'], v)} hint="Used for the built-in wordmark and page titles." />
        <MediaInput label="Logo image (optional)" value={b.logo} onChange={(v) => set(['brand', 'logo'], v)} toast={toast} video={false} trim empty="Built-in FUMO wordmark" hint="SVG works best — it stays sharp at any size. Empty space around the logo is trimmed automatically on upload." />
        <Range label="Height on computers" value={b.logo_height} onChange={(v) => set(['brand', 'logo_height'], v)} min={20} max={220} />
        <Range label="Height on phones" value={b.logo_height_mobile} onChange={(v) => set(['brand', 'logo_height_mobile'], v)} min={16} max={140} />
        <Range label="Move up / down" value={b.logo_offset} onChange={(v) => set(['brand', 'logo_offset'], v)} min={-60} max={120} hint="0 = sits on the header line. Higher values let it hang over the line, like a mascot." />
        <div className="wide logo-previews">
          {[['Computer', 'logo_height'], ['Phone', 'logo_height_mobile']].map(([label, key]) => (
            <div key={label}>
              <span className="lbl">{label} preview</span>
              <div className="logo-preview" style={{ ...logoVars(b), '--lh': `var(${key === 'logo_height' ? '--logo-h' : '--logo-hm'})` }}>
                <div className="lp-bar">
                  <span className="lp-nav"><i /><i /><i /></span>
                  <span className="lp-logo">{b.logo ? <Preview src={b.logo} /> : <Wordmark name={b.name} size="calc(var(--lh) * 0.76)" />}</span>
                  <span className="lp-nav right"><i /><i /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Colours">
        <Color label="Accent (yellow)" value={b.accent} onChange={(v) => set(['brand', 'accent'], v)} />
        <Color label="Second accent (orange)" value={b.accent2} onChange={(v) => set(['brand', 'accent2'], v)} />
        <Color label="Text & lines" value={b.ink} onChange={(v) => set(['brand', 'ink'], v)} />
        <Color label="Page background" value={b.bg} onChange={(v) => set(['brand', 'bg'], v)} />
        <Color label="Product tile background" value={b.tile} onChange={(v) => set(['brand', 'tile'], v)} />
      </Panel>
      <Panel title="Search engines" desc="Title and description shown on Google and when the link is shared.">
        <Text t label="Site title" value={site.seo.title} onChange={(v) => set(['seo', 'title'], v)} wide />
        <Text t label="Description" value={site.seo.description} onChange={(v) => set(['seo', 'description'], v)} area />
      </Panel>
      <Panel title="Product page">
        <Text t label="Default buy button text" value={site.product_page.buy_label} onChange={(v) => set(['product_page', 'buy_label'], v)} />
        <Text t label="Note under the button" value={site.product_page.note} onChange={(v) => set(['product_page', 'note'], v)} wide />
      </Panel>
      <Panel title="Age verification" desc="Asked once per visitor.">
        <Toggle on={site.age_gate.enabled} onChange={(v) => set(['age_gate', 'enabled'], v)} label="Show 18+ check" />
        <Text t label="Title" value={site.age_gate.title} onChange={(v) => set(['age_gate', 'title'], v)} />
        <Text t label="Text" value={site.age_gate.text} onChange={(v) => set(['age_gate', 'text'], v)} area />
        <Text t label="Yes button" value={site.age_gate.yes} onChange={(v) => set(['age_gate', 'yes'], v)} />
        <Text t label="No button" value={site.age_gate.no} onChange={(v) => set(['age_gate', 'no'], v)} />
        <LinkField label="Where “No” sends visitors" value={site.age_gate.no_link} onChange={(v) => set(['age_gate', 'no_link'], v)} hint="A full address like https://www.google.com — or a page on this site." wide />
      </Panel>
    </>
  );
}
