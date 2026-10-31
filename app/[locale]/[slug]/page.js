import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { brandsFor, categoriesFor, pageFor, productsFor, siteFor } from '@/lib/l10n';
import { COOKIE, verifySession } from '@/lib/auth';
import Sections from '@/components/site/Sections';

// Drafts are only visible to a logged-in admin (for previewing).
async function load(slug, locale) {
  const page = await pageFor(slug, locale);
  if (!page) return null;
  if (page.published) return page;
  const admin = await verifySession((await cookies()).get(COOKIE)?.value);
  return admin ? page : null;
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const page = await load(slug, locale);
  if (!page) return {};
  const site = await siteFor(locale);
  return { title: `${page.title} — ${site.brand.name}`, description: page.description || undefined, robots: page.published ? undefined : { index: false } };
}

export default async function CustomPage({ params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const page = await load(slug, locale);
  if (!page) notFound();
  const [site, products, categories, brands, t] = await Promise.all([siteFor(locale), productsFor(locale), categoriesFor(locale), brandsFor(locale), getTranslations('page')]);
  return (
    <>
      {!page.published && <div className="draft-note">{t('draft')}</div>}
      {page.show_title ? (
        <div className="wrap page-head">
          <h1 className="d outline">{page.title}</h1>
        </div>
      ) : null}
      <Sections sections={page.sections} products={products} categories={categories} brands={brands} brand={site.brand.name} />
    </>
  );
}
