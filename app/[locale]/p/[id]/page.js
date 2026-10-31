import Link from '@/components/site/L';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { productPath } from '@/lib/db';
import { productFor, productsFor, siteFor } from '@/lib/l10n';
import { localePath } from '@/i18n/config';
import { badgeColor, brandPath, categoryPath, displayName } from '@/lib/site';
import Media, { SIZES } from '@/components/site/Media';
import PackArt from '@/components/site/PackArt';
import { ProductGrid } from '@/components/site/ProductCard';
import { ICONS } from '@/components/site/Icons';

async function load(param, locale) {
  const id = parseInt(param, 10);
  return Number.isFinite(id) ? productFor(id, locale) : null;
}

export async function generateMetadata({ params }) {
  const { id, locale } = await params;
  const p = await load(id, locale);
  if (!p) return {};
  const site = await siteFor(locale);
  return { title: `${displayName(p)} — ${site.brand.name}`, description: p.description || p.subtitle || p.notes, openGraph: p.image ? { images: [p.image] } : undefined };
}

export default async function ProductPage({ params }) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const p = await load(id, locale);
  if (!p) notFound();
  if (`/p/${id}` !== productPath(p)) permanentRedirect(localePath(productPath(p), locale));

  const [site, all, t] = await Promise.all([siteFor(locale), productsFor(locale), getTranslations('product')]);
  const related = all.filter((x) => x.id !== p.id && x.category_id === p.category_id).slice(0, 4);
  const name = displayName(p);
  const specs = [
    [t('brand'), p.brand_name && <Link href={brandPath({ slug: p.brand_slug })}>{p.brand_name}</Link>],
    [t('flavour'), p.notes],
    [t('weight'), p.weight],
    [t('size'), p.size],
    [t('strength'), p.strength],
    [t('nicotine'), p.nicotine],
    [t('category'), p.category_name],
  ].filter(([, v]) => v);

  return (
    <div className="wrap">
      <nav className="crumbs">
        <Link href="/">{t('home')}</Link> /{' '}
        {p.parent_slug && <><Link href={`/c/${p.parent_slug}`}>{p.parent_name}</Link> /{' '}</>}
        {p.category_slug ? <Link href={categoryPath({ slug: p.category_slug, parent_slug: p.parent_slug })}>{p.category_name}</Link> : <Link href="/c/all">{t('shop')}</Link>} / {name}
      </nav>
      <div className="pdp">
        <div className="pdp-media">
          <div className="card-media">
            {p.badge && <span className="badge" style={p.badge_color ? { background: badgeColor(p.badge_color) } : undefined}>{p.badge}</span>}
            {p.image ? <Media src={p.image} alt={name} sizes={SIZES.half} priority /> : <PackArt name={p.name} sub={p.weight || p.size} brand={p.brand_name || site.brand.name} />}
          </div>
          {p.image2 && <div className="card-media"><Media src={p.image2} alt="" sizes={SIZES.half} /></div>}
        </div>
        <div className="pdp-info">
          {p.category_name && <p className="count">{p.parent_name ? `${p.parent_name} · ` : ''}{p.category_name}</p>}
          <h1 className="d">{name}</h1>
          {p.subtitle && <p className="pdp-notes">{p.subtitle}</p>}
          {p.price && <p className="pdp-price">{p.compare_price && <s>{p.compare_price}</s>}{p.price}</p>}
          {specs.length > 0 && (
            <dl className="pdp-specs">
              {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {p.redirect_url ? (
            <>
              <a className="btn" href={`/go/${p.id}`} target="_blank" rel="noopener noreferrer">{p.button_label || site.product_page.buy_label} {ICONS.arrow}</a>
              {site.product_page.note && <p className="pdp-note">{site.product_page.note}</p>}
            </>
          ) : (
            <p className="pdp-unavailable">{t('unavailable')}</p>
          )}
          {p.description && <p className="pdp-desc">{p.description}</p>}
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="d outline section-title">{t('related')}</h2>
          <ProductGrid products={related} brand={site.brand.name} />
        </section>
      )}
    </div>
  );
}
