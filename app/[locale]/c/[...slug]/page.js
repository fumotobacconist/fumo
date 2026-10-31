import Link from '@/components/site/L';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { badgesFor, categoriesFor, productsFor, siteFor } from '@/lib/l10n';
import { localePath } from '@/i18n/config';
import { inCategory } from '@/lib/site';
import { ProductGrid } from '@/components/site/ProductCard';
import FilterMenu from '@/components/site/FilterMenu';
import { brandOptions, paramItems } from '@/components/site/FilterChips';

// /c/all, /c/<category>, /c/<category>/<subcategory>
function resolve(parts, categories) {
  if (parts.length === 1 && parts[0] === 'all') return { cat: null };
  if (parts.length > 2) return null;
  const cat = categories.find((c) => c.slug === parts[parts.length - 1]);
  if (!cat) return null;
  const canonical = cat.path;
  return { cat, redirect: `/c/${parts.join('/')}` !== canonical ? canonical : null };
}

export async function generateMetadata({ params, searchParams }) {
  const { slug, locale } = await params;
  const [cats, site, t] = await Promise.all([categoriesFor(locale), siteFor(locale), getTranslations({ locale, namespace: 'shop' })]);
  const r = resolve(slug, cats);
  const sp = await searchParams;
  const badge = !r?.cat && sp.badge ? (await badgesFor(locale)).find((b) => b.slug === sp.badge) : null;
  return { title: `${r?.cat ? r.cat.name : badge ? badge.name : t('shopAll')} — ${site.brand.name}` };
}

export default async function Category({ params, searchParams }) {
  const { slug: parts, locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [site, products, categories, badges, t] = await Promise.all([siteFor(locale), productsFor(locale), categoriesFor(locale), badgesFor(locale), getTranslations('shop')]);
  const r = resolve(parts, categories);
  if (!r) notFound();
  if (r.redirect) {
    const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === 'string')).toString();
    permanentRedirect(localePath(r.redirect, locale) + (q ? `?${q}` : ''));
  }
  const { cat } = r;

  let list = cat ? products.filter((p) => inCategory(p, cat.slug)) : products;
  if (sp.featured) list = list.filter((p) => p.featured);
  // Status filter: badges that products in this list carry.
  const statuses = badges.filter((b) => list.some((p) => p.badge_slug === b.slug)).map((b) => ({ value: b.slug, label: b.name }));
  const badge = badges.find((b) => b.slug === sp.badge);
  if (sp.badge) list = list.filter((p) => p.badge_slug === sp.badge);
  const brands = brandOptions(list);
  if (sp.brand) list = list.filter((p) => p.brand_slug === sp.brand);
  if (sp.sort === 'new') list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const title = cat ? cat.name : badge ? badge.name : sp.featured ? t('bestsellers') : sp.sort === 'new' ? t('newArrivals') : t('shopAll');

  const parent = cat?.parent_id ? categories.find((c) => c.id === cat.parent_id) : null;
  // Category menu: every category with products, subcategories indented under their parent.
  const catItems = [{ href: '/c/all', label: t('all'), on: !cat, all: true }];
  // Only categories with products on the site (a hidden brand or badge can empty one).
  const has = (c) => products.some((p) => inCategory(p, c.slug));
  for (const c of categories.filter((x) => !x.parent_id && has(x))) {
    catItems.push({ href: c.path, label: c.name, on: cat?.id === c.id });
    for (const sub of categories.filter((x) => x.parent_id === c.id && has(x))) catItems.push({ href: sub.path, label: sub.name, on: cat?.id === sub.id, indent: true });
  }
  const base = cat ? cat.path : '/c/all';

  return (
    <div className="wrap">
      <div className="list-head">
        <div>
          {cat?.parent_id && <p className="count" style={{ marginBottom: 6 }}><Link href={parent.path}>{parent.name}</Link> /</p>}
          <h1 className="d outline">{title}</h1>
          <p className="count" style={{ marginTop: 10 }}>{t('products', { count: list.length })}</p>
        </div>
      </div>
      <div className="filters">
        <FilterMenu label={t('category')} items={catItems} />
        {statuses.length > 0 && <FilterMenu label={t('status')} items={paramItems({ allLabel: t('all'), options: statuses, active: sp.badge, base, param: 'badge', params: sp })} />}
        {brands.length > 0 && <FilterMenu label={t('brand')} items={paramItems({ allLabel: t('all'), options: brands, active: sp.brand, base, param: 'brand', params: sp })} />}
      </div>
      {list.length ? (
        <ProductGrid products={list} brand={site.brand.name} />
      ) : (
        <div className="empty">
          <h2 className="d">{t('nothingHere')}</h2>
          <p>{t('comingSoon')}</p>
          <Link href="/c/all" className="btn">{t('shopAll')}</Link>
        </div>
      )}
    </div>
  );
}
