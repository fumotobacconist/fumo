import Link from '@/components/site/L';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { productsFor, siteFor } from '@/lib/l10n';
import { ProductGrid } from '@/components/site/ProductCard';
import { buildIndex, searchProducts } from '@/lib/search';
import SearchBox from '@/components/site/SearchBox';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('title') };
}

export default async function Search({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const q = String((await searchParams).q || '').trim();
  const [site, products, t, ts] = await Promise.all([siteFor(locale), productsFor(locale), getTranslations('search'), getTranslations('shop')]);
  // Ranked, typo-tolerant, across all languages (see lib/search.js).
  const list = q ? searchProducts(buildIndex(products), q) : [];
  return (
    <div className="wrap">
      <div className="list-head">
        <div>
          <h1 className="d outline">{q ? `“${q}”` : t('title')}</h1>
          <p className="count" style={{ marginTop: 10 }}>{q ? t('results', { count: list.length }) : t('hint')}</p>
        </div>
        <div style={{ width: 'min(360px, 100%)' }}>
          <SearchBox defaultValue={q} placeholder={t('title')} />
        </div>
      </div>
      {list.length ? <ProductGrid products={list} brand={site.brand.name} /> : q && (
        <div className="empty">
          <h2 className="d">{t('noMatches')}</h2>
          <p>{t('tryFlavour')}</p>
          <Link href="/c/all" className="btn">{ts('shopAll')}</Link>
        </div>
      )}
    </div>
  );
}
