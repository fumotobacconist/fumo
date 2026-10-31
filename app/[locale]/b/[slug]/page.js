import Link from '@/components/site/L';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { brandsFor, categoriesFor, productsFor, siteFor } from '@/lib/l10n';
import { inCategory } from '@/lib/site';
import Media from '@/components/site/Media';
import { ProductGrid } from '@/components/site/ProductCard';
import FilterMenu from '@/components/site/FilterMenu';
import { paramItems } from '@/components/site/FilterChips';

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const [brands, site] = await Promise.all([brandsFor(locale), siteFor(locale)]);
  const b = brands.find((x) => x.slug === slug);
  return b ? { title: `${b.name} — ${site.brand.name}`, description: b.description || undefined } : {};
}

export default async function Brand({ params, searchParams }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [site, brands, products, categories, t] = await Promise.all([siteFor(locale), brandsFor(locale), productsFor(locale), categoriesFor(locale), getTranslations('shop')]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  const all = products.filter((p) => p.brand_id === brand.id);
  // Category filter: top-level categories this brand has products in.
  const cats = categories.filter((c) => !c.parent_id && all.some((p) => inCategory(p, c.slug))).map((c) => ({ value: c.slug, label: c.name }));
  const list = sp.category ? all.filter((p) => inCategory(p, sp.category)) : all;

  return (
    <div className="wrap">
      <div className="list-head">
        <div className="brand-head">
          {brand.logo && <Media src={brand.logo} alt="" className="brand-logo" eager />}
          <div>
            <p className="count" style={{ marginBottom: 6 }}><Link href="/b">{t('brands')}</Link> /</p>
            <h1 className="d outline">{brand.name}</h1>
            <p className="count" style={{ marginTop: 10 }}>{t('products', { count: list.length })}</p>
          </div>
        </div>
      </div>
      {brand.description && <p className="brand-desc">{brand.description}</p>}
      {cats.length > 1 && <div className="filters"><FilterMenu label={t('category')} items={paramItems({ allLabel: t('all'), options: cats, active: sp.category, base: brand.path, param: 'category', params: sp })} /></div>}
      {list.length ? (
        <ProductGrid products={list} brand={site.brand.name} />
      ) : (
        <div className="empty">
          <h2 className="d">{t('nothingHere')}</h2>
          <Link href="/c/all" className="btn">{t('shopAll')}</Link>
        </div>
      )}
    </div>
  );
}
