import { setRequestLocale } from 'next-intl/server';
import { brandsFor, categoriesFor, productsFor, siteFor } from '@/lib/l10n';
import Sections from '@/components/site/Sections';

export default async function Home({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [site, products, categories, brands] = await Promise.all([siteFor(locale), productsFor(locale), categoriesFor(locale), brandsFor(locale)]);
  return <Sections sections={site.home.sections} products={products} categories={categories} brands={brands} brand={site.brand.name} />;
}
