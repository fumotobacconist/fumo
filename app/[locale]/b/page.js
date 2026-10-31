import Link from '@/components/site/L';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { brandsFor, siteFor } from '@/lib/l10n';
import Media, { SIZES } from '@/components/site/Media';
import PackArt from '@/components/site/PackArt';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const [site, t] = await Promise.all([siteFor(locale), getTranslations({ locale, namespace: 'shop' })]);
  return { title: `${t('brands')} — ${site.brand.name}` };
}

export default async function Brands({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [all, t] = await Promise.all([brandsFor(locale), getTranslations('shop')]);
  const brands = all.filter((b) => b.visible_count > 0);
  return (
    <div className="wrap">
      <div className="list-head">
        <div>
          <h1 className="d outline">{t('brands')}</h1>
          <p className="count" style={{ marginTop: 10 }}>{t('brandCount', { count: brands.length })}</p>
        </div>
      </div>
      {brands.length ? (
        <div className="tiles">
          {brands.map((b) => (
            <Link key={b.id} href={b.path} className="tile">
              <div className={`tile-media ${b.logo ? 'logo-tile' : ''}`}>
                {b.logo ? <Media src={b.logo} alt={b.name} /> : b.cover ? <Media src={b.cover} alt={b.name} sizes={SIZES.tile} /> : <PackArt name={b.name} brand="" />}
              </div>
              <div className="tile-label d">{b.name}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2 className="d">{t('noBrands')}</h2>
          <Link href="/c/all" className="btn">{t('shopAll')}</Link>
        </div>
      )}
    </div>
  );
}
