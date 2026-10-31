import Link from '@/components/site/L';
import Reveal from '../Reveal';
import Media, { SIZES } from './Media';
import PackArt from './PackArt';
import { ProductGrid } from './ProductCard';
import { ICONS } from './Icons';
import { inCategory } from '@/lib/site';
import { useTranslations } from 'next-intl';

const ext = (href) => (/^https?:/i.test(href || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {});

function Hero({ s }) {
  return (
    <section className={`hero ${s.height || 'medium'}`} style={{ background: s.bg, color: s.color }}>
      <Media src={s.media} className="bg-media" sizes={SIZES.full} priority />
      {!s.media && (
        <>
          <span className="puff" style={{ width: 220, height: 220, left: '-60px', top: '18%' }} />
          <span className="puff" style={{ width: 140, height: 140, right: '8%', top: '-40px' }} />
          <span className="puff" style={{ width: 90, height: 90, right: '22%', bottom: '12%' }} />
        </>
      )}
      <div className="hero-inner">
        {s.heading && <Reveal as="h1" className="d outline">{s.heading}</Reveal>}
        {s.subheading && <Reveal as="p" delay={0.1}>{s.subheading}</Reveal>}
        {s.button_label && s.button_link && (
          <Reveal delay={0.2}>
            <Link href={s.button_link} className="btn" {...ext(s.button_link)}>{s.button_label} {ICONS.arrow}</Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Products({ s, products, categories, brands = [], brand }) {
  const t = useTranslations('shop');
  let list = products;
  if (s.source === 'featured') list = products.filter((p) => p.featured);
  else if (s.source === 'new') list = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else if (s.source?.startsWith('badge:')) list = products.filter((p) => p.badge_slug === s.source.slice(6));
  else if (s.source?.startsWith('brand:')) list = products.filter((p) => p.brand_slug === s.source.slice(6));
  else if (s.source && s.source !== 'all') list = products.filter((p) => inCategory(p, s.source));
  list = list.slice(0, Number(s.limit) || 8);
  if (!list.length) return null;
  const more = s.source === 'featured' ? '/c/all?featured=1' : s.source === 'new' ? '/c/all?sort=new' : s.source?.startsWith('badge:') ? `/c/all?badge=${s.source.slice(6)}` : s.source?.startsWith('brand:') ? `/b/${s.source.slice(6)}` : s.source && s.source !== 'all' ? categories.find((c) => c.slug === s.source)?.path || '/c/all' : '/c/all';
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <ProductGrid products={list} brand={brand} />
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <Link href={more} className="btn light">{t('viewAll')}</Link>
      </div>
    </section>
  );
}

function Collections({ s, categories, brand }) {
  const items = s.items?.some((i) => i.label)
    ? s.items.filter((i) => i.label)
    : categories.filter((c) => !c.parent_id && c.product_count > 0).map((c) => ({ label: c.name, image: c.image || c.cover, href: c.path }));
  if (!items.length) return null;
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <div className="tiles">
        {items.map((t, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <Link href={t.href || '#'} className="tile" {...ext(t.href)}>
              <div className="tile-media">{t.image ? <Media src={t.image} alt={t.label} sizes={SIZES.tile} /> : <PackArt name={t.label} brand={brand} />}</div>
              <div className="tile-label d">{t.label}</div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Banner({ s }) {
  return (
    <section className={`banner ${s.media ? '' : 'no-media'}`} style={{ background: s.bg, color: s.color }}>
      {s.media && <div className="banner-media"><Media src={s.media} alt="" sizes={SIZES.half} /></div>}
      <div className="banner-body">
        {s.heading && <Reveal as="h2" className="d outline">{s.heading}</Reveal>}
        {s.text && <Reveal as="p" delay={0.1}>{s.text}</Reveal>}
        {s.button_label && s.button_link && (
          <Reveal delay={0.2}><Link href={s.button_link} className="btn" {...ext(s.button_link)}>{s.button_label} {ICONS.arrow}</Link></Reveal>
        )}
      </div>
    </section>
  );
}

function Marquee({ s }) {
  const items = (s.items || []).filter(Boolean);
  if (!items.length) return null;
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="marquee" style={{ background: s.bg, color: s.color, '--speed': `${Math.max(8, items.length * 6)}s` }} aria-hidden>
      <div className="marquee-track">
        {loop.map((t, i) => <span key={i} className="marquee-item d">{t} {ICONS.star}</span>)}
      </div>
    </div>
  );
}

function TextBlock({ s }) {
  return (
    <section className="text-block">
      {s.heading && <Reveal as="h2" className="d outline section-title" style={{ paddingBottom: 0 }}>{s.heading}</Reveal>}
      {s.body && <Reveal as="p" delay={0.1}>{s.body}</Reveal>}
    </section>
  );
}

function MediaBlock({ s }) {
  if (!s.media) return null;
  const inner = (
    <>
      <Media src={s.media} alt={s.caption || ''} />
      {s.caption && <span className="caption d outline">{s.caption}</span>}
    </>
  );
  return (
    <Reveal className="media-block">
      {s.link ? <Link href={s.link} {...ext(s.link)}>{inner}</Link> : inner}
    </Reveal>
  );
}

function Store({ s }) {
  const t = useTranslations('store');
  const items = (s.items || []).filter((i) => i.name || i.address || i.image);
  if (!items.length) return null;
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <div className="stores">
      {items.map((st, i) => {
        const directions = st.map_link || (st.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address)}` : '');
        const map = st.show_map && st.address;
        return (
          <Reveal key={i} className={`store ${map ? 'has-map' : ''}`}>
            <div className="store-photo">{st.image ? <Media src={st.image} alt={st.name} sizes={SIZES.half} /> : <PackArt name={st.name || 'Store'} />}</div>
            <div className="store-info">
              {st.name && <h2 className="d">{st.name}</h2>}
              <dl>
                {st.address && <div><dt>{ICONS.pin} {t('address')}</dt><dd>{st.address}</dd></div>}
                {st.hours && <div><dt>{ICONS.clock} {t('hours')}</dt><dd>{st.hours}</dd></div>}
                {st.phone && <div><dt>{ICONS.phone} {t('phone')}</dt><dd><a href={`tel:${st.phone.replace(/[^\d+]/g, '')}`}>{st.phone}</a></dd></div>}
              </dl>
              {directions && <a className="btn" href={directions} target="_blank" rel="noopener noreferrer">{t('directions')} {ICONS.arrow}</a>}
            </div>
            {map && (
              <iframe
                className="store-map"
                title={t('map', { name: st.name || st.address })}
                src={`https://www.google.com/maps?q=${encodeURIComponent(st.address)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </Reveal>
        );
      })}
      </div>
    </section>
  );
}

function Gallery({ s }) {
  const items = (s.items || []).filter((i) => i.image);
  if (!items.length) return null;
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <div className="gallery" style={{ '--cols': Math.min(6, Math.max(1, Number(s.columns) || 3)) }}>
        {items.map((g, i) => {
          const inner = (
            <>
              <div className="gallery-media"><Media src={g.image} alt={g.caption || ''} sizes={SIZES.tile} /></div>
              {g.caption && <p className="tile-label d">{g.caption}</p>}
            </>
          );
          return (
            <Reveal key={i} delay={(i % 6) * 0.05}>
              {g.link ? <Link href={g.link} className="tile" {...ext(g.link)}>{inner}</Link> : <div className="tile">{inner}</div>}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function BrandTiles({ s, brands = [] }) {
  const list = brands.filter((b) => b.visible_count > 0);
  if (!list.length) return null;
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <div className="tiles">
        {list.map((b, i) => (
          <Reveal key={b.id} delay={(i % 8) * 0.05}>
            <Link href={b.path} className="tile">
              <div className={`tile-media ${b.logo ? 'logo-tile' : ''}`}>
                {b.logo ? <Media src={b.logo} alt={b.name} /> : b.cover ? <Media src={b.cover} alt={b.name} sizes={SIZES.tile} /> : <PackArt name={b.name} brand="" />}
              </div>
              <div className="tile-label d">{b.name}</div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Photo + title + text rows, alternating sides, frameless.
function Stories({ s, brand }) {
  const items = (s.items || []).filter((i) => i.title || i.text || i.image);
  if (!items.length) return null;
  return (
    <section className="wrap">
      {s.title && <Reveal as="h2" className="d outline section-title">{s.title}</Reveal>}
      <div className="posts">
        {items.map((it, i) => (
          <Reveal key={i} className={`post-card ${i % 2 ? 'flip' : ''}`}>
            <div className="post-media">{it.image ? <Media src={it.image} alt={it.title || ''} sizes={SIZES.half} /> : <PackArt name={it.title || ''} brand={brand} />}</div>
            <div className="post-body">
              {it.title && <h2 className="d">{it.link ? <Link href={it.link} {...ext(it.link)}>{it.title}</Link> : <span>{it.title}</span>}</h2>}
              {it.text && <p className="post-excerpt story-text">{it.text}</p>}
              {it.link && it.button_label && <Link href={it.link} className="post-more" {...ext(it.link)}>{it.button_label} {ICONS.arrow}</Link>}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const RENDER = { hero: Hero, products: Products, collections: Collections, banner: Banner, marquee: Marquee, text: TextBlock, media: MediaBlock, store: Store, gallery: Gallery, brands: BrandTiles, stories: Stories };

export default function Sections({ sections, products, categories, brands, brand }) {
  return sections
    .filter((s) => s.enabled && RENDER[s.type])
    .map((s, i) => {
      const C = RENDER[s.type];
      return <C key={s.id || i} s={s} products={products} categories={categories} brands={brands} brand={brand} />;
    });
}
